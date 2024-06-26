//
//  AuthenticationService.swift
//  Foncii
//
//  Created by Justin Cook on 2/19/23.
//

import Foundation
import FirebaseAuth
import Combine

/**
 *  This centralized authentication layer acts as a gateway into the different methods the user can utilize to
 *  authenticate themselves and gain access to Foncii's services
 */
class AuthenticationService: ObservableObject {
    // MARK: - Properties
    let thirdPartyAuthServices = ThirdPartyAuthServices()
    
    // MARK: - Published
    @Published var numberOfSentPasscodeRequests: Int = 0
    @Published var numberOfPasscodeValidationAttempts: Int = 0
    @Published var numberOfPasswordResetRequests: Int = 0
    @Published var numberOfUsernameReminderRequests: Int = 0
    
    /// True when a firebase user is present, thus implying auth creds are cached, false otherwise
    @Published var isAuthenticated: Bool = false
    
    // OTP Verification
    /// The id sent back after requesting an OTP verification
    @Published var otpVerificationID: String? = nil
    
    // MARK: - Limits
    let maxNumberOfPasscodeRequests: Int = 3,
        maxNumberOfPasscodeValidationAttempts: Int = 3,
        requiredPasscodeLength: Int = 6,
        maxNumberOfPasswordResetRequests: Int = 2,
        maxNumberOfUsernameReminderRequests: Int = 2
    
    // MARK: - Firebase Authentication Service Interface
    let firebaseAuth: Auth = Auth.auth()
    
    // MARK: - Singleton
    static let shared: AuthenticationService = .init()
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let networkService: NetworkingService = inject()
        let apolloService: GraphQLAPIServiceAdapter = inject()
        lazy var alertManager: AlertManager = AuthenticationService.Dependencies.inject()
        lazy var userManager: UserManager = AuthenticationService.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Convenience
    /// Remainder of limits
    var numberOfPasscodeValidationAttemptsRemaining: Int {
        return max((maxNumberOfPasscodeValidationAttempts - numberOfPasscodeValidationAttempts), 0)
    }
    
    var numberOfOTPRequestsRemaining: Int {
        return max((maxNumberOfPasscodeRequests - numberOfSentPasscodeRequests), 0)
    }
    
    var numberOfPasswordResetRequestsRemaining: Int {
        return max((maxNumberOfPasswordResetRequests - numberOfPasswordResetRequests), 0)
    }
    
    var numberOfUsernameReminderRequestsRemaining: Int {
        return max((maxNumberOfUsernameReminderRequests - numberOfUsernameReminderRequests), 0)
    }
    
    var canTriggerPasswordResetRequest: Bool {
        return numberOfPasswordResetRequestsRemaining > 0
    }
    
    var canTriggerUsernameReminderRequest: Bool {
        return numberOfUsernameReminderRequestsRemaining > 0
    }
    
    /// Only request new OTPs when the internet is available and the hard limit for requests and passcode attempts hasn't yet been reached
    var canRequestNewOTP: Bool {
        let passcodeRequestLimitNotReached = numberOfOTPRequestsRemaining > 0
        let passcodeValidationAttemptsNotMaxedOut = numberOfPasscodeValidationAttemptsRemaining > 0
        let internetAvailable = dependencies
            .networkService
            .isInternetAvailable
        
        return passcodeRequestLimitNotReached && passcodeValidationAttemptsNotMaxedOut && internetAvailable
    }
    
    /// Only request new OTPs when the internet is available and the hard limit for validation requests hasn't yet been reached
    var canSendPasscodeValidationRequest: Bool {
        let passcodeValidationAttemptsNotMaxedOut = numberOfPasscodeValidationAttemptsRemaining > 0
        let internetAvailable = dependencies.networkService.isInternetAvailable
        
        return passcodeValidationAttemptsNotMaxedOut && internetAvailable
    }
    
    fileprivate var apolloService: GraphQLAPIServiceAdapter {
        return dependencies.apolloService
    }
    
    init() {
        addSubscriptions()
    }
    
    // MARK: - Debug
    /**
     * Signs in a test user with the following pre-provisioned test account for debugging purposes
     *
     * Note: This information is not obscured because it doesn't represent an actual user with sensitive personal information
     */
    func signInWithTestUser() async {
        let testUserEmail: String = "testfonciiuser@foncii.com",
            testUserPassword: String = "testFonc!!User123"
        
        // Other Test User Parameters
        //            testUserPhoneNumber: String = "1235556789",
        //            testUserPhoneOTP: String = "123456"
        //    testUsername: String = "testMobileFonciiUser",
        //    testUserFullName: String = "Test Foncii User"
        
        await authenticate(using: .email_password, accountIdentifier: testUserEmail,
                           password: testUserPassword)
    }
    
    /**
     * Signs up a test user with the following pre-provisioned test account for debugging purposes
     *
     * Note: This information is not obscured because it doesn't represent an actual user with sensitive personal information
     */
    func signUpTestUser() async {
        let testUserEmail: String = "testfonciiuser@foncii.com",
            testUserPassword: String = "testFonc!!User123",
            testUserPhoneNumber: String = "1235556789",
            testUsername: String = "testMobileFonciiUser",
            testUserFullName: String = "Test Foncii User"
        
        await createNewAuthUser(email: testUserEmail,
                                password: testUserPassword,
                                attributes: [.fullName: testUserFullName,
                                             .phoneNumber: testUserPhoneNumber,
                                             .username: testUsername])
    }
    
    // MARK: - Subscriptions
    func addSubscriptions() {
        // Monitor the user manager for changes to user auth credentials
        dependencies
            .userManager
            .$currentFirebaseUser
            .receive(on: scheduler)
            .sink { [weak self] in
                guard let self = self
                else { return }
                
                self.isAuthenticated = $0 != nil
            }
            .store(in: &cancellables)
    }
    
    /// Returns true if the request went through, false otherwise
    func triggerResetPasswordAutomation() async -> Bool {
        guard canTriggerPasswordResetRequest
        else { return false }
        
        numberOfPasswordResetRequests += 1
        return true
    }
    
    /// Returns true if the request went through, false otherwise
    func triggerUsernameReminderAutomation() async -> Bool {
        guard canTriggerUsernameReminderRequest
        else { return false }
        
        numberOfUsernameReminderRequests += 1
        return true
    }
    
    /// Determines if the passed username is currently available for use, True -> Credential doesn't exist already, false otherwise
    func isUsernameAvailable(username: String) async -> Bool {
        return await !apolloService
            .performDoesUsernameExist(username: username)
    }
    
    /// Determines if the passed email is currently available for use
    func isEmailAvailable(email: String) async -> Bool {
        return await !apolloService
            .performDoesEmailExist(email: email)
    }
    
    /// Determines if the passed phone number is currently available for use
    func isPhoneNumberAvailable(phoneNumber: PhoneNumberModel) async -> Bool {
        return await !apolloService
            .performDoesPhoneNumberExist(phoneNumber: phoneNumber)
    }
    
    /**
     * Requests a one time passcode from the firebase auth backend to be sent via a silent push notification
     * - Parameters:
     *   - phoneNumber: Formatted phone number string ex.) `+13475551234`
     */
    func triggerOTPRequest(phoneNumber: String) async {
        guard canRequestNewOTP
        else { return }
        
        /// Call the phone auth provider to provide a verification ID to pass back to firebase along with the user's entered passcode to verify
        /// if its matches the generated code in the firebase auth backend, this sensitive information is not exposed to the client, only the verification ID is
        do {
            /// Store the verification ID to use when the user provides the passcode sent to them
            self.otpVerificationID = try await PhoneAuthProvider.provider().verifyPhoneNumber(phoneNumber,
                                                                                              uiDelegate: nil)
            
            numberOfSentPasscodeRequests += 1
            
            /// Reset the amount of validation attempts when the user requests a new passcode
            numberOfPasscodeValidationAttempts = 0
        }
        catch {
            /// Log, display the error and continue
            ErrorCodeDispatcher
                .AuthenticationErrors
                .printErrorCode(for: .otpRequestFailed(error: error.localizedDescription))
            
            /// Requesting a code is not available at this time for some reason
            self.dependencies
                .alertManager
                .triggerErrorAlert(alertType: .OTP_ERROR_REQUEST_UNAVAILABLE)
        }
    }
    
    /**
     * Validates the given passcode and returns a bool describing the outcome of the verification request
     * - Returns: -> True if the passcode was verified to be correct and no error occurred during the process, false otherwise
     */
    func validateOTP(passcode: String) async -> Bool {
        guard canSendPasscodeValidationRequest,
              passcode.count == requiredPasscodeLength,
              let otpVerificationID = otpVerificationID
        else { return false }
        
        let credential = PhoneAuthProvider.provider().credential(
            withVerificationID: otpVerificationID,
            verificationCode: passcode
        )
        
        let isValid = await linkAuthCredentialToCurrentUser(authCredential: credential)
        
        /// Mark the phone number as valid in the backend
        if isValid {
            await dependencies
                .userManager
                .updateUserPhoneNumberVerificationStatus(phoneNumberVerified: true)
        }
        
        numberOfPasscodeValidationAttempts += 1
        return isValid
    }
}

// MARK: - First-party Supported Auth Strategies
extension AuthenticationService {
    enum FirstPartyAuthStrategies: String, CaseIterable {
        case username_password
        case email_password
        case phone_number_password
    }
    
    /// Authenticates the user using the default sign in approach without the use of third party OAuth providers
    @MainActor func authenticate(using strategy: FirstPartyAuthStrategies,
                                 accountIdentifier: String,
                                 password: String) async {
        switch strategy {
        case .username_password:
            /// Get the user's email from their username and log in with that
            let email = await apolloService.performGetEmailFromUsername(username: accountIdentifier)
            
            /// If it doesn't exist (unlikely) then this error is handled elsewhere as a failed auth attempt due to an invalid credential
            guard let email = email
            else { return }
            
            /// Attempt Login
            do {
                try await firebaseAuth.signIn(withEmail: email, password: password)
            }
            catch {
                /// Error occurred, log error and continue, will be displayed to the user on a case by case basis
                ErrorCodeDispatcher
                    .AuthenticationErrors
                    .printErrorCode(for: .authenticationFailed(error: error.localizedDescription))
            }
        case .email_password:
            /// Login like normal, no extended requests necessary
            do {
                try await firebaseAuth.signIn(withEmail: accountIdentifier, password: password)
            }
            catch {
                /// Error occurred, log error and continue, will be displayed to the user on a case by case basis
                ErrorCodeDispatcher
                    .AuthenticationErrors
                    .printErrorCode(for: .authenticationFailed(error: error.localizedDescription))
            }
        case .phone_number_password:
            /// Get the user's email from their phone number and log in with that
            let phoneNumberModel = PhoneNumberModel(nsn: accountIdentifier),
                email = await apolloService.performGetEmailFromPhoneNumber(phoneNumber: phoneNumberModel)
            
            /// If it doesn't exist (unlikely) then this error is handled elsewhere as a failed auth attempt due to an invalid credential
            guard let email = email
            else { return }
            
            /// Attempt Login
            do {
                try await firebaseAuth.signIn(withEmail: email, password: password)
            }
            catch {
                /// Error occurred, log error and continue, will be displayed to the user on a case by case basis
                ErrorCodeDispatcher
                    .AuthenticationErrors
                    .printErrorCode(for: .authenticationFailed(error: error.localizedDescription))
            }
        }
        
        /// On auth load the user's remote data and log their current login event
        if isAuthenticated {
            await dependencies
                .userManager
                .loadUserData()
            
            /// Notify the backend of the user's current login event if the login was successful
            await dependencies
                .userManager
                .notifyBackendOfLogin(authProvider: .case(.default))
        }
    }
    
    /// Selects an  auth / user account creation strategy from the specified textfield inferred text content type
    @MainActor func selectStrategyFromTextualContextType(_ inferredType: TextFieldExtendedFunctionality.TextFieldEntryContentType,
                                                         accountIdentifier: String,
                                                         password: String) async
    {
        switch inferredType {
        case .username:
            await authenticate(using: .username_password,
                               accountIdentifier: accountIdentifier,
                               password: password)
        case .email:
            await authenticate(using: .email_password,
                               accountIdentifier: accountIdentifier,
                               password: password)
        case .phoneNumber:
            await authenticate(using: .phone_number_password,
                               accountIdentifier: accountIdentifier,
                               password: password)
        case .name, .password, .unknown:
            break
        }
    }
    
    /**
     * Creates a new email + password Firebase user account that also creates a Foncii User document hosted on our database using extended user
     * attributes such as username, phone number, and full name
     * Note: This function provides error catching and
     */
    @MainActor func createNewAuthUser(
        email: String,
        password: String,
        attributes: [FonciiUser.Attributes : String]
    ) async {
        do {
            let result = try await firebaseAuth.createUser(withEmail: email, password: password),
                newFirebaseUserID = result.user.uid,
                phoneNumberNSNString = attributes[.phoneNumber].unwrap(defaultValue: ""),
                phoneNumberModel = PhoneNumberModel(nsn: phoneNumberNSNString),
                authProviders: [UserAuthProviders] = [.case(.default)]
            
            await dependencies
                .userManager
                .createNewUser(userID: newFirebaseUserID,
                               authProviders: authProviders,
                               fullName: attributes[.fullName].unwrap(defaultValue: ""),
                               username: attributes[.username].unwrap(defaultValue: ""),
                               email: email,
                               phoneNumber: phoneNumberModel)
            
            /// If a user isn't created in the Foncii backend then delete the firebase user
            if dependencies.userManager.currentUser == nil {
                try await dependencies
                    .userManager
                    .currentFirebaseUser?
                    .delete()
                
                /// Throw an error to trigger the alert pop up following this try catch
                throw ErrorCodeDispatcher
                    .AuthenticationErrors
                    .throwError(for: .userCreationFailed(error: "Foncii User could not be created at this time."))
            }
        }
        catch {
            /// Display a top level alert informing the user that a firebase account can not be created at this time for some unknown reason
            dependencies
                .alertManager
                .triggerErrorAlert(alertType: .SIGN_UP_ERROR_FIREBASE_USER_CREATION_FAILED)
        }
    }
}


// MARK: - Third-party OAuth Strategies
extension AuthenticationService {
    enum ThirdPartyAuthStrategies: String, CaseIterable {
        case apple
        case twitter
        case google
        case facebook
    }
    
    struct ThirdPartyAuthServices: InjectableThirdPartyOAuthStrategies {
        let appleAuthService: AppleOAuthService = inject(),
            twitterAuthService: TwitterOAuthService = inject(),
            facebookAuthService: FacebookOAuthService = inject(),
            googleAuthService: GoogleOAuthService = inject()
    }
    
    func authenticate(using strategy: ThirdPartyAuthStrategies) async {
        switch strategy {
        case .apple:
            thirdPartyAuthServices
                .appleAuthService
                .authenticate()
            
        case .twitter:
            thirdPartyAuthServices
                .twitterAuthService
                .authenticate()
            
        case .google:
            thirdPartyAuthServices
                .googleAuthService
                .authenticate()
            
        case .facebook:
            thirdPartyAuthServices
                .facebookAuthService
                .authenticate()
        }
        
        // Notify the backend of the user's current login event if the login was successful
        //        await dependencies
        //            .userManager
        //            .notifyBackendOfLogin()
    }
    
    func createNewAuthUser(using strategy: ThirdPartyAuthStrategies) async {
        switch strategy {
        case .apple:
            thirdPartyAuthServices
                .appleAuthService
                .createNewAuthCredential()
            
        case .twitter:
            thirdPartyAuthServices
                .twitterAuthService
                .createNewAuthCredential()
            
        case .google:
            thirdPartyAuthServices
                .googleAuthService
                .createNewAuthCredential()
            
        case .facebook:
            thirdPartyAuthServices
                .facebookAuthService
                .createNewAuthCredential()
        }
    }
    
    /// Signs the user in using any generated firebase auth credential
    /// If using email + password only don't try to sign in with other auth creds through this function, a different user will be created
    /// If using apple or twitter or facebook etc, do  the same thing, only use this method for signing in with primary auth providers, not secondary (phone etc)
    func authenticateWithAuthCredential(authCredential: AuthCredential) async -> Bool {
        do {
            try await firebaseAuth.signIn(with: authCredential)
            
            /// User signed in successfully
            return true
        }
        catch {
            /// Error occurred, log error and continue, will be displayed to the user on a case by case basis
            ErrorCodeDispatcher
                .AuthenticationErrors
                .printErrorCode(for: .authenticationFailed(error: error.localizedDescription))
        }
        
        return false
    }
    
    /// Links the current user to the auth credential provided (if valid), used for phone # and other secondary auth providers
    func linkAuthCredentialToCurrentUser(authCredential: AuthCredential) async -> Bool {
        guard let currentFirebaseUser = dependencies.userManager.currentFirebaseUser
        else { return false }
        
        do {
            try await currentFirebaseUser.link(with: authCredential)
            
            /// User auth credential linked successfully
            return true
        }
        catch {
            /// Error occurred, log error and continue, will be displayed to the user on a case by case basis
            ErrorCodeDispatcher
                .AuthenticationErrors
                .printErrorCode(for: .authenticationFailed(error: error.localizedDescription))
        }
        
        return false
    }
}

// MARK: - Third Party Auth Strategy Implementations
extension AuthenticationService {
    struct AppleOAuthService: ThirdPartyOAuthStrategy {
        // MARK: - Singleton
        static let shared: AppleOAuthService = .init()
        
        private init() {}
        
        // MARK: - Business Logic
        func authenticate() {}
        func createNewAuthCredential() {}
    }
    
    struct TwitterOAuthService: ThirdPartyOAuthStrategy {
        // MARK: - Singleton
        static let shared: TwitterOAuthService = .init()
        
        private init() {}
        
        // MARK: - Business Logic
        func authenticate() {}
        func createNewAuthCredential() {}
    }
    
    struct FacebookOAuthService: ThirdPartyOAuthStrategy {
        // MARK: - Singleton
        static let shared: FacebookOAuthService = .init()
        
        private init() {}
        
        // MARK: - Business Logic
        func authenticate() {}
        func createNewAuthCredential() {}
    }
    
    struct GoogleOAuthService: ThirdPartyOAuthStrategy {
        // MARK: - Singleton
        static let shared: GoogleOAuthService = .init()
        
        private init() {}
        
        // MARK: - Business Logic
        func authenticate() {}
        func createNewAuthCredential() {}
    }
}
