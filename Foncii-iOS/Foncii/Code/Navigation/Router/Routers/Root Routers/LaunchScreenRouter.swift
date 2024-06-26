//
//  LaunchScreenRouter.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import OrderedCollections

class LaunchScreenRouter: Routable {
    typealias Route = LaunchScreenRoutes
    typealias Body = AnyView
    typealias Coordinator = LaunchScreenCoordinator
    
    // MARK: -  View Models
    var splashScreenViewModel: SplashScreenViewModel!
    
    // MARK: - Properties
    var coordinator: Coordinator
    
    init(coordinator: Coordinator) {
        self.coordinator = coordinator
        
        initViewModels()
    }
    
    func initViewModels() {
        /// No coordinator required b/c this scene doesn't handle its own navigation
       splashScreenViewModel = .init()
    }
    
    func getPath(to route: Route) -> OrderedCollections.OrderedSet<Route>
    {
        switch route {
        case .main:
            return [.main]
        }
    }
    
    func getPreferredPresentationMethod(for route: Route) -> PreferredViewPresentationMethod {
        return route.getPreferredPresentationMethod()
    }
    
    func getStringLiteral(for route: Route) -> String {
        return route.rawValue
    }
    
    func view(for route: Route) -> AnyView {
        var view: any View = EmptyView()
        let statusBarHidden: Bool = false
        
        switch route {
        case .main:
            view = SplashScreen(model: self.splashScreenViewModel)
        }
        self.coordinator
            .statusBarHidden = statusBarHidden
        
        return AnyView(view
            .routerStatusBarVisibilityModifier(visible: statusBarHidden,
                                               coordinator: self.coordinator))
    }
}
