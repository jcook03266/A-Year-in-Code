//
//  ProfileTabCoordinator.swift
//  Foncii
//
//  Created by Justin Cook on 2/12/23.
//

import SwiftUI

class ProfileTabCoordinator: RootCoordinator {
    typealias Router = ProfileTabRouter
    typealias Body = AnyView
    
    unowned let parent: any Coordinator
    var children: [any Coordinator] = []
    var deferredDismissalActionStore: [ProfileRoutes : (() -> Void)?] = [:]
    var statusBarHidden: Bool = false
    
    // MARK: - Routing
    var router: Router!
    var rootRoute: Router.Route! = .main
    
    // MARK: - Extended Functionality
    @Published var topLevelTransientView: AnyView? = nil
    
    // MARK: - Published
    @Published var rootView: AnyView!
    @Published var navigationPath: [ProfileRoutes] = []
    @Published var sheetItem: ProfileRoutes?
    @Published var fullCoverItem: ProfileRoutes?
    
    // MARK: - Delegate
    var rootCoordinatorDelegate: RootCoordinatorDelegate
    
    init (parent: any Coordinator,
          rootCoordinatorDelegate: RootCoordinatorDelegate) {
        self.rootCoordinatorDelegate = rootCoordinatorDelegate
        self.parent = parent
        self.router = ProfileTabRouter(coordinator: self)
        self.rootView = router.view(for: rootRoute)
    }
    
    func coordinatorView() -> AnyView {
        return AnyView(ProfileTabCoordinatorView(coordinator: self))
    }
}

