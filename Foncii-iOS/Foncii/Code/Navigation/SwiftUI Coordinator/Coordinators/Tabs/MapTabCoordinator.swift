//
//  MapTabCoordinator.swift
//  Foncii
//
//  Created by Justin Cook on 2/11/23.
//

import SwiftUI

class MapTabCoordinator: RootCoordinator {
    typealias Router = MapTabRouter
    typealias Body = AnyView
    
    unowned let parent: any Coordinator
    var children: [any Coordinator] = []
    var deferredDismissalActionStore: [MapRoutes : (() -> Void)?] = [:]
    var statusBarHidden: Bool = false
    
    // MARK: - Routing
    var router: Router!
    var rootRoute: Router.Route! = .main
    
    // MARK: - Extended Functionality
    @Published var topLevelTransientView: AnyView? = nil
    
    // MARK: - Published
    @Published var rootView: AnyView!
    @Published var navigationPath: [MapRoutes] = []
    @Published var sheetItem: MapRoutes?
    @Published var fullCoverItem: MapRoutes?
    
    // MARK: - Delegate
    var rootCoordinatorDelegate: RootCoordinatorDelegate
    
    init (parent: any Coordinator,
          rootCoordinatorDelegate: RootCoordinatorDelegate) {
        self.rootCoordinatorDelegate = rootCoordinatorDelegate
        self.parent = parent
        self.router = MapTabRouter(coordinator: self)
        self.rootView = router.view(for: rootRoute)
    }
    
    func coordinatorView() -> AnyView {
        return AnyView(MapTabCoordinatorView(coordinator: self))
    }
}

