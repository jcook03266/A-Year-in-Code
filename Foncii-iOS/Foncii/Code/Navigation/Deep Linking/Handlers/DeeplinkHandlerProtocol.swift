//
//  DeeplinkHandlerProtocol.swift
//  Foncii
//
//  Created by Justin Cook on 2/21/23.
//

import Foundation

/// Generic protocol for a deep link handler, a handler is chosen if they're able to open a specific url formatted to be parsed by this app specifically. This is done by a chain response, if one can't open the URL then another one is tried and so on.
protocol DeeplinkHandlerProtocol {
    associatedtype Router: Routable
    associatedtype Route: RoutesProtocol
    associatedtype RCoordinator: RootCoordinator
    associatedtype ChildCoordinator: Coordinator
    
    // MARK: - Properties
    // Referential
    var manager: DeepLinkManager { get }
    var routerDirectory: RouteDirectories { get }
    var routes: Route.Type { get }
    var router: Router { get }
    var rootCoordinator: RCoordinator { get }
    var childCoordinator: (ChildCoordinator)? { get }
    
    // Static
    var deeplinkURLPrefix: String { get }
    var universalLinkURLPrefix: String { get }
    
    // MARK: - Service functions
    /// Analyzes the URL's contents to determine if it can open it
    func canOpenURL(_ url: URL) -> Bool
    
    /// If the URL can be opened by this handler then this function will try to open it, this requires case by case implementation
    func openURL(_ url: URL)
}

extension DeeplinkHandlerProtocol {
    /// URL Prefix needed for this handler to function
    var deeplinkURLPrefix: String {
        return (DeepLinkManager.DeepLinkConstants.scheme +
                URLConstants.schemeSuffix +
                routerDirectory.rawValue.getURLSafeString())
    }
    
    var universalLinkURLPrefix: String {
        return (DeepLinkManager.DeepLinkConstants.universalScheme +
                URLConstants.schemeSuffix +
                DeepLinkManager.DeepLinkConstants.host +
                routerDirectory.rawValue.getURLSafeString())
    }
    
    func canOpenURL(_ url: URL) -> Bool {
        guard let scheme = url.scheme,
              scheme == DeepLinkManager.DeepLinkConstants.scheme || scheme == DeepLinkManager.DeepLinkConstants.universalScheme
        else {
            ErrorCodeDispatcher.DeeplinkingErrors.printErrorCode(for: .urlDoesNotConformToScheme(url: url))
            
            return false
        }
        
        return url.absoluteString.hasPrefix(deeplinkURLPrefix) || url.absoluteString.hasPrefix(universalLinkURLPrefix)
    }
    
    /// Query parsing
    /// Resolve full URL path into its components
    func getQueries(from url: URL) -> [String : String] {
        let components = URLComponents(url: url, resolvingAgainstBaseURL: true)
        let queryItems: [URLQueryItem] = components?.queryItems ?? []
        let queries = queryItems.reduce(into: [String : String]()) { (result, item) in
            result[item.name] = item.value
        }
        
        return queries
    }
}
