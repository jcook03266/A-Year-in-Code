//
//  Routes.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import Foundation

// MARK: - Navigation System Documentation: https://foncii.atlassian.net/wiki/spaces/FA/pages/1835021/Foncii-iOS+Navigation+System+Design
// MARK: - Router Routes
/// Enums of all possible router routes (views) depending on the router
/// Each router is responsible for a specific set of views that it expects to present somewhere in its view hierarchy, this centralizes the app's navigation pathways to one source of truth
/// Note: Any new views must be added under their respective router

// MARK: - Launch Screen Router
enum LaunchScreenRoutes: String, CaseIterable, Hashable, RoutesProtocol {
    // Root
    case main = "" /// Default root route implementation
    
    func getPreferredPresentationMethod() -> PreferredViewPresentationMethod {
        return .none
    }
    
    func getStringIdentifier() -> String {
        return rawValue
    }
}

// MARK: - Onboarding Router
enum OnboardingRoutes: CaseIterable, Hashable, RoutesProtocol {
    static var allCases: [OnboardingRoutes] = [
        .main,
        .login,
        .signUp(referralID: nil),
        .forgotUsername,
        .otp,
        .enableLocation,
        .selectFavorites,
        .resetPassword,
        .confirmation
    ]
    
    // Root
    case main
    
    // Branches
    case login
    case signUp(referralID: String?) // Referral IDs are supplied when deeplinking from referral links where the referral ID is provided
    case forgotUsername
    case otp
    case enableLocation
    case selectFavorites
    
    // Shared Screens [OnboardingRoutes, ProfileRoutes]
    /// Forgot Password / Password reset screen
    case resetPassword
    /// Confirmation Screen
    case confirmation
    
    func getPreferredPresentationMethod() -> PreferredViewPresentationMethod {
        switch self {
        case .main:
            return .none
        case .login, .signUp, .forgotUsername, .otp, .enableLocation, .selectFavorites, .resetPassword:
            return .navigationStack
        case .confirmation:
            return .fullCover
        }
    }
    
    func getStringIdentifier() -> String {
        switch self {
        case .main:
            return ""
        case .login:
            return "login"
        case .signUp(_):
            return "signUp"
        case .forgotUsername:
            return "forgotUsername"
        case .otp:
            return "otp"
        case .enableLocation:
            return "enableLocation"
        case .selectFavorites:
            return "selectFavorites"
        case .resetPassword:
            return "resetPassword"
        case .confirmation:
            return "confirmation"
        }
    }
}

// MARK: - Main / Tabbar Router [For tabbar use only, no deeplinks!]
enum MainRoutes: String, CaseIterable, Hashable, RoutesProtocol {
    /// For tabbar use only, hence why the auth screen is excluded
    static var allCases: [MainRoutes] = [.home, .map, .profile]
    
    // Tabs
    case home
    case map
    case profile
    
    func getPreferredPresentationMethod() -> PreferredViewPresentationMethod {
        return .none
    }
    
    func getStringIdentifier() -> String {
        return rawValue
    }
}

// MARK: - Home Tab router
enum HomeRoutes: CaseIterable, Hashable, RoutesProtocol {
    static var allCases: [HomeRoutes] = [
        .main,
        .addMore,
        .search,
        .importContacts,
        .dateAndLocationEditor,
        .suggestedRestaurants,
        .restaurantDetail(restaurantData: nil,
                          restaurantID: nil),
        .reservation
    ]
    
    // Root
    case main
    
    // Branches
    case addMore
    case search
    case importContacts
    case dateAndLocationEditor
    case suggestedRestaurants
    
    // Shared Screens [HomeRoutes, MapRoutes, ProfileRoutes]
    /// Restaurant Detail View
    /// Passes either the restaurant data to display or the ID of the
    /// restaurant to download and then display
    case restaurantDetail(restaurantData: PersonalizedRestaurantSearchResult?,
                          restaurantID: String?)
    case reservation
    
    func getPreferredPresentationMethod() -> PreferredViewPresentationMethod {
        switch self {
        case .main:
            return .none
        case .addMore, .search, .importContacts, .dateAndLocationEditor, .suggestedRestaurants, .reservation:
            return .bottomSheet
        case .restaurantDetail(_,_):
            return .fullCover
        }
    }
    
    func getStringIdentifier() -> String {
        switch self {
        case .main:
            return ""
        case .addMore:
            return "addMore"
        case .search:
            return "search"
        case .importContacts:
            return "importContacts"
        case .dateAndLocationEditor:
            return "dle"
        case .suggestedRestaurants:
            return "sr"
        case .restaurantDetail(_,_):
            return "rd"
        case .reservation:
            return "reservation"
        }
    }
}

// MARK: - Map Tab Router
enum MapRoutes: CaseIterable, Hashable, RoutesProtocol {
    static var allCases: [MapRoutes] = [
        .main,
        .friendsFilter,
        .moreFilters,
        .percentMatchFilter,
        .priceRangeFilter,
        .changeLocation,
        .restaurantDetail(restaurantData: nil,
                          restaurantID: nil),
        .reservation
    ]
    
    // Root
    case main
    
    // Branches
    /// Filters
    case friendsFilter
    case moreFilters
    case percentMatchFilter
    case priceRangeFilter
    case changeLocation
    
    // Shared Screens [HomeRoutes, MapRoutes, ProfileRoutes]
    /// Restaurant Detail View
    case restaurantDetail(restaurantData: PersonalizedRestaurantSearchResult?,
                          restaurantID: String?)
    case reservation
    
    func getPreferredPresentationMethod() -> PreferredViewPresentationMethod {
        switch self {
        case .main:
            return .none
        case .friendsFilter, .moreFilters, .percentMatchFilter, .priceRangeFilter, .changeLocation, .reservation:
            return .bottomSheet
        case .restaurantDetail(_,_):
            return .fullCover
        }
    }
    
    func getStringIdentifier() -> String {
        switch self {
        case .main:
            return ""
        case .friendsFilter:
            return "ff"
        case .moreFilters:
            return "mf"
        case .percentMatchFilter:
            return "pmf"
        case .priceRangeFilter:
            return "prf"
        case .changeLocation:
            return "cl"
        case .restaurantDetail(_,_):
            return "rd"
        case .reservation:
            return "reservation"
        }
    }
}

// MARK: - Profile Tab Router
enum ProfileRoutes: CaseIterable, Hashable, RoutesProtocol {
    static var allCases: [ProfileRoutes] = [
        .main,
        .viewAllLocations,
        .qrFavorites,
        .sendRecommendations,
        .requestRecommendations,
        .myQRCode,
        .profileProgress,
        .inviteContacts,
        .notifications,
        .settings,
        .profileInformation,
        .referral,
        .tasteProfileQuestionnaire
    ]
    
    // Root
    case main
    
    // Branches
    case viewAllLocations
    case qrFavorites
    case sendRecommendations
    case requestRecommendations
    case myQRCode
    case profileProgress
    case inviteContacts
    case notifications
    case settings
    case profileInformation
    case referral
    case tasteProfileQuestionnaire
    
    // Shared [HomeRoutes, MapRoutes, ProfileRoutes]
    /// Restaurant Detail View
    case restaurantDetail(restaurantData: PersonalizedRestaurantSearchResult?,
                          restaurantID: String?)
    case reservation
    
    // Shared [OnboardingRoutes, ProfileRoutes]
    /// Forgot Password / Password reset screen
    case resetPassword
    /// Confirmation Screen
    case confirmation
    
    func getPreferredPresentationMethod() -> PreferredViewPresentationMethod {
        switch self {
        case .main:
            return .none
        case .viewAllLocations, .qrFavorites, .profileProgress, .reservation:
            return .bottomSheet
        case .notifications,
                .settings:
            return .navigationStack
        case .sendRecommendations, .requestRecommendations,
                .myQRCode,
                .inviteContacts,
                .profileInformation,
                .referral,
                .tasteProfileQuestionnaire,
                .restaurantDetail(_,_),
                .resetPassword,
                .confirmation:
            return .fullCover
        }
    }
    
    func getStringIdentifier() -> String {
        switch self {
        case .main:
            return ""
        case .viewAllLocations:
            return "locations"
        case .qrFavorites:
            return "qrf"
        case .sendRecommendations:
            return "sr"
        case .requestRecommendations:
            return "rr"
        case .myQRCode:
             return "qrcode"
        case .profileProgress:
            return "progress"
        case .inviteContacts:
            return "invite"
        case .notifications:
            return "notifications"
        case .settings:
            return "settings"
        case .profileInformation:
            return "info"
        case .referral:
            return "referral"
        case .tasteProfileQuestionnaire:
            return "tpq"
        case .restaurantDetail(_, _):
            return "rd"
        case .reservation:
            return "reservation"
        case .resetPassword:
            return "rp"
        case .confirmation:
            return "confirmation"
        }
    }
}

/// A record of all possible route pathways across the app, this is used to deeplink a user into a specific part of the application when they trigger a link with a scheme specific to this application
enum RouteDirectories: String, CaseIterable, Hashable, RoutesProtocol {
    /// Routable Sections
    case LaunchScreenRoutes = "launch"
    case OnboardingRoutes = "onboarding"
    case HomeRoutes = "home"
    case MapRoutes = "map"
    case ProfileRoutes = "profile"
    
    func getPreferredPresentationMethod() -> PreferredViewPresentationMethod {
        return .none
    }
    
    func getStringIdentifier() -> String {
        return rawValue
    }
}

// MARK: - Deeplink Navigation Traversal
/// An enum that specifies the method of presentation for a target view, each view can be presented in a number of ways
/// Note: Please be advised that SwiftUI does not support multiple sheets being presented at once, if this is the case each sheet must be popped and a new one has to be presented in its place
enum PreferredViewPresentationMethod: String, CaseIterable, Hashable {
    case none = "" /// Reserved for root views, navigation stack is the default if none is selected
    case navigationStack = "ns"
    case bottomSheet = "bs"
    case fullCover = "fc"
}
