//
//  InjectableServices.swift
//  Foncii
//
//  Created by Justin Cook on 2/12/23.
//

import Foundation

/// Protocol that allows the deployment of case specific services within any instance that calls this protocol and selectively injects the necessary services to use within that scope
protocol InjectableServices {}

/// All dependency injectable services are listed below, from these implementations these services can be injected into any Instance without the host scope knowing how to instantiate them
extension InjectableServices {
    // MARK: - App Service
    static func inject() -> AppService {
        return .shared
    }
    
    // MARK: - Deep / Universal / System Linking
    static func inject() -> SystemLinker {
        return .shared
    }
    
    // MARK: - User Authentication Service Layer
    static func inject() -> AuthenticationService {
        return .shared
    }
    
    // MARK: - Static Asset Controller
    static func inject() -> StaticAssetController {
        return .shared
    }
    
    // MARK: - Cuisine Manager
    static func inject() -> CuisineManager {
        return .shared
    }
    
    // MARK: - Food Restriction Manager
    static func inject() -> FoodRestrictionsManager {
        return .shared
    }
    
    // MARK: - Meal Type Manager
    static func inject() -> MealTypeManager {
        return .shared
    }
    
    // MARK: - Major City Manager
    static func inject() -> MajorCityManager {
        return .shared
    }
    
    // MARK: - Restaurant Aggregator
    static func inject() -> RestaurantAggregator {
        return .shared
    }
    
    // MARK: - Restaurant Manager
    static func inject() -> RestaurantManager {
        return .shared
    }
    
    // MARK: - Restaurant Interactions Manager
    static func inject() -> RestaurantInteractionsManager {
        return .init()
    }
    
    // MARK: - Taste Profile Manager
    static func inject() -> UserTasteProfileManager {
        return .shared
    }
    
    // MARK: - Location Services Manager
    static func inject() -> LocationServiceManager {
        return .shared
    }
    
    // MARK: - Reservation Date Manager
    static func inject() -> ReservationDateManager {
        return .shared
    }
    
    // MARK: - User Manager
    static func inject() -> UserManager {
        return .shared
    }
    
    // MARK: - User Settings Manager
    static func inject() -> UserSettingsManager {
        return .shared
    }
    
    // MARK: - Validator Manager
    static func inject() -> ValidatorManager {
        return .init()
    }
    
    // MARK: - Apollo GraphQL Service
    static func inject() -> FonciiApolloService {
        return .shared
    }
    
    // MARK: - Apollo GraphQL Service Adapter
    static func inject() -> GraphQLAPIServiceAdapter {
        return .init()
    }
    
    // MARK: - Networking Service / Monitor
    static func inject() -> NetworkingService {
        return .shared
    }
    
    // MARK: - Static User Permissions Manager
    static func inject() -> UserPermissionsManager.Type {
        return UserPermissionsManager.self
    }
    
    // MARK: - UserDefaults Service
    static func inject() -> UserDefaultsService {
        return .init()
    }
    
    // MARK: - Alert Manager
    static func inject() -> AlertManager {
        return .shared
    }
    
//    // MARK: - FTUE Service
//    static func inject() -> FTUEService {
//        return FTUEService()
//    }
//
//
//    // MARK: - Feature Flag Service
//    static func inject() -> FeatureFlagService {
//        return FeatureFlagService()
//    }
//
//
//    // MARK: - Localized Language Manager
//    static func inject() -> LocalizedLanguageManager {
//        return .shared
//    }
//
//
    // MARK: - Image Downloader Service
    static func inject() -> ImageDownloaderService {
        return .init()
    }
    
    static func inject() -> ImageCacher {
        return .shared
    }
    
//
//    // MARK: - Endpoint Manager
//    static func inject() -> EndpointManager {
//        return .init()
//    }
//
//    // MARK: - Keychain Manager
//    static func inject() -> KeychainManager {
//        return .init()
//    }
//
//
//
//    // MARK: - User Manager
//    static func inject() -> UserManager {
//        return .shared
//    }
}
//
//// MARK: - Other domain specific dependency containers
//
//// MARK: - Development specific services
//protocol InjectableDevelopmentServices {}
//extension InjectableDevelopmentServices {
//    // MARK: - Feature Flag Service
//    static func inject() -> FeatureFlagService {
//        return FeatureFlagService()
//    }
//}
//
//// MARK: - Managers
//protocol InjectableManagers {}
//
///// Scope specific to only manager oriented services
//extension InjectableManagers {
//    // MARK: - Fiat Currency Manager
//    static func inject() -> FiatCurrencyManager {
//        return .shared
//    }
//
//    // MARK: - Localized Language Manager
//    static func inject() -> LocalizedLanguageManager {
//        return .shared
//    }
//
//    // MARK: - Endpoint Manager
//    static func inject() -> EndpointManager {
//        return .init()
//    }
//
//    // MARK: - Keychain Manager
//    static func inject() -> KeychainManager {
//        return .init()
//    }
//
//    // MARK: - Validator Manager
//    static func inject() -> ValidatorManager {
//        return .shared
//    }
//
//    // MARK: - User Manager
//    static func inject() -> UserManager {
//        return .shared
//    }
//}

// MARK: - Managers
protocol InjectableManagers {}

/// Scope specific to only manager oriented services
extension InjectableManagers {
    // MARK: - Validator Manager
    static func inject() -> ValidatorManager {
        return .init()
    }
    
    // MARK: - Static User Permissions Manager
    static func inject() -> UserPermissionsManager.Type {
        return UserPermissionsManager.self
    }
    
    static func inject() -> RestaurantManager {
        return .shared
    }
    
    static func inject() -> RestaurantInteractionsManager {
        return .init()
    }
}

// MARK: - Private iOS User Services
protocol InjectableUserServices {}

/// Scope specific to only manager oriented services
extension InjectableUserServices {
    // MARK: - Location Services Manager
    static func inject() -> LocationServiceManager {
        return .shared
    }
}
