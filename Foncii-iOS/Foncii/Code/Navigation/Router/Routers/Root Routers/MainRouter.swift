//
//  MainRouter.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import OrderedCollections

class MainRouter: Routable {
    typealias Route = MainRoutes
    typealias Body = AnyView
    
    // MARK: -  View Models
    var mainTabbarViewModel: MainTabbarViewModel!
    
    // MARK: - Properties
    var coordinator: MainCoordinator
    
    init(coordinator: MainCoordinator) {
        self.coordinator = coordinator
        
        initViewModels()
    }
    
    func initViewModels() {
        self.mainTabbarViewModel = .init(
            coordinator: self.coordinator,
            router: self
        )
    }
    
    /// Since this is a tabbar coordinator the coordinator children handle their own path finding
    func getPath(to route: Route) -> OrderedCollections.OrderedSet<Route> {
        return []
    }
    
    func getPreferredPresentationMethod(for route: Route) -> PreferredViewPresentationMethod {
        return route.getPreferredPresentationMethod()
    }
    
    func getStringLiteral(for route: Route) -> String {
        return route.rawValue
    }
    
    func view(for route: Route) -> AnyView {
        let view: any View = EmptyView()
        let statusBarHidden: Bool = false

        self.coordinator.statusBarHidden = statusBarHidden
        
        return AnyView(view
            .routerStatusBarVisibilityModifier(visible: statusBarHidden,
                                               coordinator: self.coordinator)
        )
    }
    
    func getTabbar() -> AnyView {
        return AnyView(MainTabbar(model: self.mainTabbarViewModel))
    }
}

