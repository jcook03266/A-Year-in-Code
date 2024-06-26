//
//  HomeTabCoordinator.swift
//  Foncii
//
//  Created by Justin Cook on 2/11/23.
//

import SwiftUI

class HomeTabCoordinator: RootCoordinator {
    typealias Router = HomeTabRouter
    typealias Body = AnyView
    
    unowned let parent: any Coordinator
    var children: [any Coordinator] = []
    var deferredDismissalActionStore: [HomeRoutes : (() -> Void)?] = [:]
    var statusBarHidden: Bool = false
    
    // MARK: - Routing
    var router: Router!
    var rootRoute: Router.Route! = .main
    
    // MARK: - Extended Functionality
    @Published var topLevelTransientView: AnyView? = nil
    
    // MARK: - Published
    @Published var rootView: AnyView!
    @Published var navigationPath: [HomeRoutes] = []
    @Published var sheetItem: HomeRoutes?
    @Published var fullCoverItem: HomeRoutes?
    
    // MARK: - Delegate
    var rootCoordinatorDelegate: RootCoordinatorDelegate
    
    init (parent: any Coordinator,
          rootCoordinatorDelegate: RootCoordinatorDelegate) {
        self.rootCoordinatorDelegate = rootCoordinatorDelegate
        self.parent = parent
        self.router = HomeTabRouter(coordinator: self)
        self.rootView = router.view(for: rootRoute)
    }
    
    func coordinatorView() -> AnyView {
        AnyView(HomeTabCoordinatorView(coordinator: self))
    }
}

