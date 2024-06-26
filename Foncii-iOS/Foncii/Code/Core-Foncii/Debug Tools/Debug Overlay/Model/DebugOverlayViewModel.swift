//
// DebugOverlayViewModel.swift
// Foncii
//
// Created by Justin Cook on 4/27/23 at 6:59 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Combine
import SwiftUI
import CoreLocation

/**
 * A simple overlay to display over the app's base UI to display diagnostic
 * information on the fly without having to step into the instruction stack to view
 * variables
 */
class DebugOverlayViewModel: GenericViewModel {
    // MARK: - Published
    /// Note: Menu is hidden by default
    @Published var displayMenu: Bool = false
    @Published var displayAdvancedNavigationInfo: Bool = false
    @Published var isAuthenticated: Bool = false
    
    var isClientOnline: Bool {
        return dependencies
            .appService
            .isClientOnline
    }
    
    var currentCoordinates: CLLocationCoordinate2D? {
        return userDependencies
            .locationService
            .currentCoordinates
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let userManager: UserManager = inject(),
            authService: AuthenticationService = inject(),
            userPermissions: UserPermissionsManager.Type = inject(),
            apolloService: FonciiApolloService = inject(),
            tasteProfileManager: UserTasteProfileManager = inject()
            
        lazy var appService: AppService = DebugOverlayViewModel.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    struct UserDependencies: InjectableUserServices {
        let locationService: LocationServiceManager = inject()
    }
    let userDependencies = UserDependencies()
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Actions
    var triggerLastActiveDeepLinkAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            dependencies
                .appService
                .deepLinkManager
                .openLastActiveLink()
        }
    }
    
    var toggleButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.displayMenu.toggle()
        }
    }
    
    /// Signs the user out
    var signOutAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            Task { @MainActor in
                await self.dependencies
                    .userManager
                    .signOut()
            }
        }
    }
    
    /// Signs the user in using a pre-provisioned test account
    var signInAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            Task { @MainActor in
                await self.dependencies
                    .authService
                    .signInWithTestUser()
                
                self.dependencies
                    .appService
                    .rootCoordinatorDelegate
                    .activeRootCoordinator
                    .rebaseAndPopToRoot()
                
                /// Switch scenes if possible
                if self.dependencies
                    .userManager
                    .userRequirements
                    .areAllUserRequirementsFulfilled
                {
                    RootCoordinatorDelegate
                        .shared
                        .switchToMainScene()
                }
            }
        }
    }
    
    var createTestUserAction: (() -> Void) {
        return { [weak self] in
            guard let self = self,
                  !isAuthenticated
            else { return }
            
            Task { @MainActor in
                await self.dependencies
                    .authService
                    .signUpTestUser()
            }
        }
    }
    
    // MARK: - Convenience
    @MainActor var currentClientLocationDescription: String {
        let locationService = userDependencies.locationService
        var locationString: String = ""
        
        if locationService.isAccessGranted,
           let coordinates = self.currentCoordinates {
            locationString += "Latitude: \(coordinates.latitude)"
            locationString += "\nLongitude: \(coordinates.longitude)"
        }
        else {
            locationString += "Location Unavailable"
        }
        
        return locationString
    }
    
    @MainActor var deviceProperties: String {
        let device = DeviceConstants.device,
            deviceID = ClientNetworkingInfo.shared.vendorDeviceIdentifier
        var devicePropertiesString = ""
       
        devicePropertiesString += "Type: \(device.model)"
        devicePropertiesString += "\nModel: \(device.name)"
        devicePropertiesString += "\nDevice / Vendor ID: \(deviceID)"
        devicePropertiesString += "\nOS: \(device.systemName)"
        devicePropertiesString += "\nOS Version: \(device.systemVersion)"
        devicePropertiesString += "\nIdiom: \(device.userInterfaceIdiom.rawValue)"
        devicePropertiesString += "\n🔋 Battery Level: \(device.batteryLevel)"
        devicePropertiesString += "\nBattery State: \(device.batteryState.rawValue)"
        
        return devicePropertiesString
    }
    
    @MainActor var apiMetrics: String {
        var apiMetricsString = ""
        
        apiMetricsString += "Last Query: "
        if let lastQuery = dependencies
            .apolloService
            .lastQuery {
            apiMetricsString += String(reflecting: lastQuery)
        }
        else {
            apiMetricsString += "None"
        }
        
        apiMetricsString += "\nLast Search Query: "
        if let lastSearchQuery = dependencies
            .apolloService
            .lastSearchQuery {
            apiMetricsString += String(reflecting: lastSearchQuery)
        }
        else {
            apiMetricsString += "None"
        }
        
        apiMetricsString += "\nLast Query: "
        if let lastQuery = dependencies
            .apolloService
            .lastQuery {
            apiMetricsString += String(reflecting: lastQuery)
        }
        else {
            apiMetricsString += "None"
        }
        
        apiMetricsString += "\nLast Mutation: "
        if let lastMutation = dependencies
            .apolloService
            .lastMutation {
            apiMetricsString += String(reflecting: lastMutation)
        }
        else {
            apiMetricsString += "None"
        }
        
        apiMetricsString += "\n\nLast Failed Query: "
        if let lastFailedQuery = dependencies
            .apolloService
            .lastFailedQuery {
            apiMetricsString += String(reflecting: lastFailedQuery)
        }
        else {
            apiMetricsString += "None"
        }
        
        apiMetricsString += "\nLast Failed Search Query: "
        if let lastFailedSearchQuery = dependencies
            .apolloService
            .lastFailedSearchQuery {
            apiMetricsString += String(reflecting: lastFailedSearchQuery)
        }
        else {
            apiMetricsString += "None"
        }
        
        apiMetricsString += "\nLast Failed Mutation: "
        if let lastFailedMutation = dependencies
            .apolloService
            .lastFailedMutation {
            apiMetricsString += String(reflecting: lastFailedMutation)
        }
        else {
            apiMetricsString += "None"
        }
        
        apiMetricsString += "\n\nTotal Queries: \(dependencies.apolloService.totalQueries)"
        
        apiMetricsString += "\nTotal Search Queries: \(dependencies.apolloService.totalSearchQueries)"
        
        apiMetricsString += "\nTotal Mutations: \(dependencies.apolloService.totalMutations)"
        
        apiMetricsString += "\n\nSuccessful Queries: \(dependencies.apolloService.totalQueries - dependencies.apolloService.totalFailedQueries)"
        
        apiMetricsString += "\nSuccessful Search Queries: \(dependencies.apolloService.totalSearchQueries - dependencies.apolloService.totalFailedSearchQueries)"
        
        apiMetricsString += "\nSuccessful Mutations: \(dependencies.apolloService.totalMutations - dependencies.apolloService.totalFailedMutations)"
        
        apiMetricsString += "\n\nFailed Queries: \(dependencies.apolloService.totalFailedQueries)"
        
        apiMetricsString += "\nFailed Search Queries: \(dependencies.apolloService.totalFailedSearchQueries)"
        
        apiMetricsString += "\nFailed Mutations: \(dependencies.apolloService.totalFailedMutations)"
        
        let querySuccessPercentage = dependencies.apolloService.querySuccessRate * 100
        
        let searchQuerySuccessPercentage = dependencies.apolloService.searchQuerySuccessRate * 100
        
        let mutationSuccessPercentage = dependencies.apolloService.mutationSuccessRate * 100
        
        apiMetricsString += "\n\nQuery Success Rate: \(querySuccessPercentage)%"
        
        apiMetricsString += "\nSearch Query Success Rate: \(searchQuerySuccessPercentage)%"
        
        apiMetricsString += "\nMutation Success Rate: \(mutationSuccessPercentage)%"
        
        apiMetricsString += "\n\nCurrent Search Request Task: \(dependencies.apolloService.searchRequestTask.debugDescription)"
        
        apiMetricsString += "\n\nOperation Headers: \(dependencies.apolloService.headers)"
        
        apiMetricsString += "\n\nOperation Header Queue: " + String(reflecting: dependencies.apolloService.headerQueue)
        
        apiMetricsString += "\n\nOperation Queue: " + String(reflecting: dependencies.apolloService.operationQueue)
        
        apiMetricsString += "\n\nClient Resets: \(dependencies.apolloService.clientResets)"
        
        apiMetricsString += "\n Cache Invalidations: \(dependencies.apolloService.cacheInvalidations)"
        
        return apiMetricsString
    }
    
    @MainActor var userRequirementsInfo: String {
        let userManager = dependencies.userManager
        
        var infoString = ""
        
        infoString += "🥘 Must Add First Favorite Restaurants: \(userManager.userRequirements.userMustAddFirstFavoriteRestaurants)"
        
        infoString += "\n🗺️ Must Grant Location Permissions: \(userManager.userRequirements.userMustGrantLocationPermission)"
        
        infoString += "\n📞 Must Verify Phone Number: \(userManager.userRequirements.userMustVerifyPhoneNumber)"
        
        return infoString
    }
    
    @MainActor var userPermissionsInfo: String {
        let userPermissions = dependencies.userPermissions
        
        var infoString = ""
        
        infoString += "🗺️ Location Access Granted: \(userPermissions.hasPermissionToUse(service: .locationService))"
        
        infoString += "\n👥 Contacts Access Granted: \(userPermissions.hasPermissionToUse(service: .contactsService))"
        
        return infoString
    }
    
    /// Displays a string of the user data model's properties
    @MainActor var currentFonciiUserInfo: String {
        guard let currentFonciiUser = dependencies
            .userManager.currentUser
        else { return "None" }
        
        var objDump = ""
        dump(currentFonciiUser,
             to: &objDump,
             maxDepth: 4)
        
        return objDump
    }
    
    @MainActor var tasteProfileInfo: String {
        guard let tasteProfile = dependencies
            .tasteProfileManager.tasteProfile
        else { return "None" }
        
        var objDump = ""
        dump(tasteProfile,
             to: &objDump,
             maxDepth: 10)
        
        return objDump
    }
    
    @MainActor var currentFirebaseUserInfo: String {
        guard let currentFirebaseUser = dependencies
            .userManager.currentFirebaseUser
        else { return "None" }
        
        var propertiesString = ""
        propertiesString += "UID: \(currentFirebaseUser.uid)"
        propertiesString += "\nDisplay Name: \(String(describing: currentFirebaseUser.displayName))"
        propertiesString += "\nEmail: \(String(describing: currentFirebaseUser.email))"
        propertiesString += "\nPhone Number: \(String(describing: currentFirebaseUser.phoneNumber))"
        propertiesString += "\nPhoto URL: \(String(describing: currentFirebaseUser.photoURL))"
        propertiesString += "\nTenant ID: \(String(describing: currentFirebaseUser.tenantID))"
        propertiesString += "\nMeta Data: \(currentFirebaseUser.metadata)"
        propertiesString += "\nProvider ID: \(currentFirebaseUser.providerID)"
        propertiesString += "\nProvider Data: \(currentFirebaseUser.providerData)"
        propertiesString += "\nMulti-Factor: \(currentFirebaseUser.multiFactor)"
        propertiesString += "\nEmail Verified: \(currentFirebaseUser.isEmailVerified)"
        propertiesString += "\nAnonymous User: \(currentFirebaseUser.isAnonymous)"
        
        return propertiesString
    }
    
    @MainActor var navigationInformation: String {
        var navigationInformationString: String = ""
        
        let rootCoordinatorDelegate = dependencies
            .appService
            .rootCoordinatorDelegate
        
        let activeRoot = String(reflecting: rootCoordinatorDelegate.activeRoot)
        
        let rootRoute = String(reflecting: rootCoordinatorDelegate
            .activeRootCoordinator
            .rootRoute)
        
        let currentRoute = String(reflecting: rootCoordinatorDelegate
            .activeRootCoordinator
            .currentRoute)
        
        let activeDeepLinkPath = String(reflecting: dependencies
            .appService
            .deepLinkManager
            .activeDeepLinkTarget)
        
        let lastActiveDeepLinkPath = String(reflecting: dependencies
            .appService
            .deepLinkManager
            .activeDeepLinkTarget)
        
        navigationInformationString += "🧭 Navigation Pathways"
        
        navigationInformationString += "\nActive Scene: \(String(describing: activeRoot))"
        
        navigationInformationString += "\nRoot Route: \(String(describing: rootRoute))"
        
        navigationInformationString += "\nCurrent Route: \(currentRoute)"
        
        navigationInformationString += "\n🔗 Universal / Deeplinking"
        
        navigationInformationString += "\nActive Deeplink URL: \(String(describing: activeDeepLinkPath))"
        
        navigationInformationString += "\nLast Active Deeplink URL: \(String(describing: lastActiveDeepLinkPath))"
        
        return navigationInformationString
    }
    
    @MainActor var advancedNavigationInfo: String {
        var advancedNavInfoString: String = ""
        
        let rootCoordinatorDelegate = dependencies
            .appService
            .rootCoordinatorDelegate
        
        var activeRootCoordinatorDump = ""
        dump(rootCoordinatorDelegate
            .activeRootCoordinator,
             to: &activeRootCoordinatorDump,
             maxDepth: 3)
        
        advancedNavInfoString += "\nActive Coordinator Dump: " + activeRootCoordinatorDump
        
        return advancedNavInfoString
    }
    
    init() {
        addSubscribers()
    }
    
    // MARK: - Subscriptions
    func addSubscribers() {
        /// Attach listeners to the various debug information sources
        // User Auth State
        dependencies
            .authService
            .$isAuthenticated
            .receive(on: scheduler)
            .assign(to: &$isAuthenticated)
        
        /// Update this object when these sources update
        // Apollo API Updates
        dependencies
            .apolloService
            .objectWillChange
            .receive(on: scheduler)
            .sink { [weak self] _ in
                guard let self = self
                else { return }
                
                self.objectWillChange.send()
            }
            .store(in: &cancellables)
        
        // User State Updates
        dependencies
            .userManager
            .objectWillChange
            .receive(on: scheduler)
            .sink { [weak self] _ in
                guard let self = self
                else { return }
                
                self.objectWillChange.send()
            }
            .store(in: &cancellables)
        
        // Internal App Service Updates
        dependencies
            .appService
            .objectWillChange
            .receive(on: scheduler)
            .sink { [weak self] _ in
                guard let self = self
                else { return }
                
                self.objectWillChange.send()
            }
            .store(in: &cancellables)
        
        // Auth Updates
        dependencies
            .authService
            .objectWillChange
            .receive(on: scheduler)
            .sink { [weak self] _ in
                guard let self = self
                else { return }
                
                self.objectWillChange.send()
            }
            .store(in: &cancellables)
        
        // Location Updates
        userDependencies
            .locationService
            .objectWillChange
            .receive(on: scheduler)
            .sink { [weak self] _ in
                guard let self = self
                else { return }
                
                self.objectWillChange.send()
            }
            .store(in: &cancellables)
        
        RootCoordinatorDelegate
            .shared
            .objectWillChange
            .receive(on: scheduler)
            .sink { [weak self] _ in
                guard let self = self
                else { return }
                
                self.objectWillChange.send()
            }
            .store(in: &cancellables)
    }
}
