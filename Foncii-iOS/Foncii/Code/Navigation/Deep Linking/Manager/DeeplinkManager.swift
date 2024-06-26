//
//  DeeplinkManager.swift
//  Foncii
//
//  Created by Justin Cook on 2/21/23.
//

import Foundation

final class DeepLinkManager: ObservableObject {
    // MARK: - Published
    @Published var activeDeepLinkTarget: URL? = nil
    
    // MARK: - Singleton
    static let shared: DeepLinkManager = .init()
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let userDefaultsService: UserDefaultsService = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Properties
    // Static
    var deeplinkHandlers: [any DeeplinkHandlerProtocol] = []
    
    /// Note: For debugging purposes, the last successfully opened link is saved
    var lastActiveLink: URL? {
        get {
            return dependencies
                .userDefaultsService
                .getValueFor(key: .lastActiveDeeplink())
        }
        set {
            dependencies
                .userDefaultsService
                .setValueFor(key: .lastActiveDeeplink(),
                             value: newValue)
        }
    }
    
    private init() {
        setup()
    }
    
    private func setup() {
        injectHandlers()
    }
}

extension DeepLinkManager: DeeplinkManagerProtocol {
    func injectHandlers() {
        deeplinkHandlers = [
//            LaunchScreenDeeplinkHandler(manager: self),
//            OnboardingDeeplinkHandler(manager: self),
//            HomeTabDeeplinkHandler(manager: self),
//            WalletTabDeeplinkHandler(manager: self),
//            SettingsTabDeeplinkHandler(manager: self),
//            AlertsTabDeeplinkHandler(manager: self)
        ]
    }
}

// MARK: - Constants + Event Banner Actions
struct URLConstants {
    static let schemeSuffix = "://"
    static let queryIdentifier = "?"
    static let fragmentStub = "#"
    static let directorySlash = "/"
    static let parameterChainer = "&"
    static let parameterEquator = "="
}

extension DeepLinkManager {
    /// Reusable constants for keeping track of proper URL formatting standards
    class DeepLinkConstants {
        /// Universal links TBA:
        static let universalScheme = "https"
        static let host = "www.foncii.com"
        
        // Deep links
        static let scheme = "foncii"
        static let identifier = "com.foncii.deeplinker"
        
        // Shared
        static let queryTag = "q"
        static let portfolioCoinsOnlyFilterTag = "pcf"
    }
    
    /// All supported event banner deeplinks
    class EventBannerActions {
        static func ftueWelcomeMessageDeepLink() -> URL? {
            let builtURL = DeepLinkBuilder.buildDeeplinkFor(routerDirectory: .HomeRoutes,
                                                            directories: [],
                                                            parameters: [:],
                                                            fragment: "")
            
            return builtURL
        }
    }
}
