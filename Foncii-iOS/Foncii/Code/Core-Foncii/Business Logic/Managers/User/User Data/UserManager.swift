//
// UserManager.swift
// Foncii
//
// Created by Justin Cook on 4/23/23 at 12:38 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import FirebaseAuth
import Combine

/**
 * High level manager responsible for fetching, storing, and interacting with user types, as well as user settings and taste profile data
 */
final class UserManager: ObservableObject {
    // MARK: - Properties
    // User
    @Published var currentUser: FonciiUser? = nil
    @Published var currentFirebaseUser: FirebaseAuth.User? = nil
    
    // MARK: - User Requirements
    /// A set of requirements a user has to fulfill in order to use the application normally
    struct UserRequirements {
        // MARK: - Dependencies
        let userManager: UserManager,
            userPermissionsManager: UserPermissionsManager.Type,
            tasteProfileManager: UserTasteProfileManager
        
        /**
         * If the user is an unverified phone user then they must be prompted to verify their phone number in order to use our service
         * If they back out of the OTP then their auth state is revoked and they must log in again and be prompted with the same consequence
         */
        var userMustVerifyPhoneNumber: Bool {
            guard let currentFirebaseUser = userManager.currentFirebaseUser,
                let currentFonciiUser = userManager.currentUser
            else { return false }
            
            let doesFirebaseUserHavePhoneNumber = (currentFirebaseUser.phoneNumber != nil)
            let isFonciiUserPhoneNumberVerified = currentFonciiUser.isPhoneNumberVerified
            
            // In-flight corrections: These are corrections made to the user's data whenever this requirement is accessed in order to maintain data parity between the auth backend and our own backend
            /// The firebase user having a phone # implies the user has verified their phone number
            /// correct the user's data in the database as the Firebase auth backend is the truth source
            if doesFirebaseUserHavePhoneNumber && !isFonciiUserPhoneNumberVerified {
                Task { @MainActor in
                    await userManager.updateUserPhoneNumberVerificationStatus(phoneNumberVerified: true)
                }
            }
            else if !doesFirebaseUserHavePhoneNumber &&
                        isFonciiUserPhoneNumberVerified {
                /// User doesn't have a phone # connected to their auth account, correct the database
                Task { @MainActor in
                    await userManager.updateUserPhoneNumberVerificationStatus(phoneNumberVerified: false)
                }
            }
            
            return !doesFirebaseUserHavePhoneNumber
        }
        
        /// The user must grant their location to use the app properly, if a user is signed in but has revoked their location service access from Foncii
        /// then they're brought to the enable location screen to reenable it in order to regain access to Foncii's services
        var userMustGrantLocationPermission: Bool {
            return !userPermissionsManager
                .hasPermissionToUse(service: .locationService)
        }
        
        /// The user must add their first favorite restaurants if they haven't done so already and if they haven't completed the onboarding process yet,
        /// this step is optional if the user completes onboarding by skipping the screen or if their account already has a taste profile associated with it
        var userMustAddFirstFavoriteRestaurants: Bool {
            guard let currentUser = userManager.currentUser
            else { return false }
            
            return (!currentUser.hasFirstFavorites && !userManager.hasUserCompletedOnboarding) &&
            !tasteProfileManager.isTasteProfileAvailable
        }
        
        /// For determining whether or not to re-route the user at launch to fulfill parameters
        var areAllUserRequirementsFulfilled: Bool {
            return !userMustVerifyPhoneNumber
            && !userMustGrantLocationPermission
            && !userMustAddFirstFavoriteRestaurants
        }
    }
    
    var userRequirements: UserRequirements!
    
    // MARK: - FTUE State Persistence
    /// A general flag for identifying when the user has progressed through the app's onboarding phase entirely
    private (set) var hasUserCompletedOnboarding: Bool {
        get {
            return dependencies
                .userDefaultsService
                .getValueFor(type: Bool.self,
                             key: .didCompleteOnboarding())
        }
        set {
            dependencies
                .userDefaultsService
                .setValueFor(type: Bool.self,
                             key: .didCompleteOnboarding(),
                             value: newValue)
        }
    }
    
    // MARK: - Singleton
    static let shared: UserManager = .init()
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let networkService: NetworkingService = inject(),
            userDefaultsService: UserDefaultsService = inject(),
            apolloService: GraphQLAPIServiceAdapter = inject(),
            userPermissionsManager: UserPermissionsManager.Type = UserManager.Dependencies.inject(),
            restaurantInteractionsManager: RestaurantInteractionsManager = inject()
        
        lazy var userSettingsManager: UserSettingsManager = UserManager.Dependencies.inject()
        lazy var authenticationService: AuthenticationService = UserManager.Dependencies.inject()
        lazy var appService: AppService = UserManager.Dependencies.inject()
        lazy var tasteProfileManager: UserTasteProfileManager = UserManager.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Convenience
    /// True -> User is authenticated and their data has been loaded up
    var isUserPresent: Bool {
        return self.currentUser != nil && self.currentFirebaseUser != nil
    }
    
    private init() {
        userRequirements = .init(userManager: self,
                                 userPermissionsManager: dependencies.userPermissionsManager, tasteProfileManager: dependencies.tasteProfileManager)
    }
    
    /// Begin monitoring the auth layer for changes and load necessary user data (if any)
    @MainActor func start() async {
        addSubscribers()
        await loadUserData()
    }
    
    // MARK: - Subscriptions
    func addSubscribers() {
        /// Listen for auth state changes (sign out / sign in), and ID token refreshes and update the user accordingly
        /// Note: Token refreshes occur on an hourly basis, password changes and other cross client changes will reflect during this time interval
        dependencies
            .authenticationService
            .firebaseAuth
            .addIDTokenDidChangeListener { [weak self] authState, firebaseUser in
                guard let self = self
                else { return }
                
                self.currentFirebaseUser = firebaseUser
                
                Task { @MainActor [weak self] in
                    guard let self = self
                    else { return }
                    
                    if currentUser != nil {
                        // Refresh the existing user's data
                        await refreshUserData()
                    }
                }
            }
        
        dependencies
            .authenticationService
            .firebaseAuth
            .addStateDidChangeListener { [weak self] authState, firebaseUser in
                guard let self = self
                else { return }
                
                self.currentFirebaseUser = firebaseUser
                
                Task { @MainActor [weak self] in
                    guard let self = self
                    else { return }
                    
                    if currentUser != nil {
                        // Refresh the existing user's data
                        await refreshUserData()
                    }
                }
            }
    }
    
    // MARK: - Scene Navigation
    /// Force the user to go to the onboarding scene (on sign out) since they're no longer authenticated
    private func shuntUserToOnboardingScene() {
        dependencies
            .appService
            .rootCoordinatorDelegate
            .switchToOnboardingScene()
    }
    
    // MARK: - State Management
    /// Marks the onboarding phase as complete
    func markOnboardingAsComplete() {
        self.hasUserCompletedOnboarding = true
    }
    
    /// Loads up the current auth user's (if any) data from our backend and stores the user in this manager
    /// Also loads the user's associated taste profile as both are entities directly tied
    /// to the current user and to each other
    func loadUserData() async {
        guard let currentFirebaseUser = Auth.auth().currentUser,
              let user = await getUser(userID: currentFirebaseUser.uid)
        else { return }
    
        self.currentUser = user
        self.currentFirebaseUser = currentFirebaseUser
        
        // User Taste Profile
        await dependencies
            .tasteProfileManager
            .loadTasteProfile()
        
        /// Mark onboarding as complete if the user already has a taste profile, which implies
        /// they've already gone through the whole setup process
        if (dependencies.tasteProfileManager.isTasteProfileAvailable &&
            !hasUserCompletedOnboarding) {
            markOnboardingAsComplete()
        }
    }
    
    /**
     * Trigger this to refresh the user's data when updating user preferences or profile tasks or some user defined data
     * Also used to automatically sign the user out if their auth state has been invalidated
     */
    func refreshUserData() async {
        // Only refresh if there's actual user data to refresh
        guard currentUser != nil
        else { return }
        
        if currentFirebaseUser != nil {
            /// User is authenticated, reload their data
            await loadUserData()
        }
        else {
            /// User is not authenticated and their data is still being managed, sign out the current user and clear out their sensitive information
            await signOut()
        }
    }
    
    /// Sign the user out, inform the backend, nullify their data,
    @MainActor func signOut() async {
        /// If the current firebase user isn't signed out then sign them out manually, and push them back to the opening scene
        if currentFirebaseUser != nil {
            do {
                try dependencies
                    .authenticationService
                    .firebaseAuth
                    .signOut()
                
                await notifyBackendOfSignOut()
                
                currentUser = nil
                currentFirebaseUser = nil
                shuntUserToOnboardingScene()
            }
            catch {
                // TODO: Inform the user to try again as an error has occurred
                
                return
            }
        }
    }
}

// MARK: - API Interactor
extension UserManager {
    /// Adds 3 - 10 first favorite restaurants to the user's first favorites collection
    func addFirstFavoriteRestaurants(firstFavoriteRestaurants: [DiscoveryRestaurant]) async {
        guard let userID = currentUser?.id
        else { return }
        
        let restaurantIDs = firstFavoriteRestaurants.map { $0.id }
        
            await dependencies
            .apolloService
            .performAddFirstFavoriteRestaurants(userID: userID,
                                                restaurantIDs: restaurantIDs)
        
        /// User now has first favorites, update the client's state to reflect this transition elsewhere
        await refreshUserData()
    }
    
    /// Creates a new user on the backend and stores the user's data in this manager
    func createNewUser(
        userID: String,
        authProviders: [UserAuthProviders],
        fullName: String,
        username: String,
        email: String,
        phoneNumber: PhoneNumberModel?
    ) async {
        /// Capitalize the full name to fit the expected convention
        let nameCasedFullName = fullName.capitalizeAllFirstLetters
        
        let newUser = await dependencies
            .apolloService
            .performCreateUser(userID: userID,
                               authProviders: authProviders,
                               fullName: nameCasedFullName,
                               username: username,
                               email: email,
                               phoneNumber: phoneNumber)
        
        /// Error handling for this is handled and displayed elsewhere to prevent unexpected notifications
        /// from popping up when this logic is executed from unrelated scenes (if any)
        if let newUser = newUser {
            self.currentUser = newUser
        }
    }
    
    /// Fetches the user data corresponding to the given ID (should not be used to fetch other user's data, only the primary auth user)
    func getUser(userID: String) async -> FonciiUser? {
        let user = await dependencies
            .apolloService
            .performGetUser(userID: userID)
        
        return user
    }
    
    /// Updates the user's remote data
    // TODO: Implement
    func updateUser() async {
    
        await refreshUserData()
    }
    
    /// Deletes the user's account, revokes authentication via the auth service, clears all saved data, and shunts the user back to the opening screen
    // TODO: Implement
    func deleteUser() async {
        
        self.currentUser = nil
    }
    
    /// Informs the API of a user login event, this is separate from logging in on the client, this is just used for tracking login events
    func notifyBackendOfLogin(authProvider: UserAuthProviders) async {
        if let userID = currentFirebaseUser?.uid {
            await dependencies
                .apolloService
                .performLoginUser(userID: userID, authProvider: authProvider)
        }
    }
    
    /// Informs the API of a user sign out event, this is separate from logging out on the client through firebase, just used for tracking sign out events
    private func notifyBackendOfSignOut() async {
        if let userID = currentFirebaseUser?.uid {
            await dependencies
                .apolloService
                .performSignOut(userID: userID)
        }
    }
    
    /// Updates the user's phone number verification status in the backend and refreshes the user's data model to reflect these changes
    func updateUserPhoneNumberVerificationStatus(phoneNumberVerified: Bool) async {
        if let userID = currentFirebaseUser?.uid {
            await dependencies
                .apolloService
                .performUpdateUserPhoneNumberVerificationStatus(userID: userID,
                                                                phoneNumberVerified: phoneNumberVerified)
        }
        
        await refreshUserData()
    }
}
