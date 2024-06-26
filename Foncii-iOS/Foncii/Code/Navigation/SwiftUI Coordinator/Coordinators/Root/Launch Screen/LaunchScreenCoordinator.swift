//
//  LaunchScreenCoordinator.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import UIKit

class LaunchScreenCoordinator: RootCoordinator {
    typealias Router = LaunchScreenRouter
    typealias Body = AnyView
    
    // MARK: - Properties
    unowned var parent: any Coordinator {
        return self
    }
    var children: [any Coordinator] = []
    var deferredDismissalActionStore: [LaunchScreenRoutes : (() -> Void)?] = [:]
    var statusBarHidden: Bool = true
    
    // MARK: - Routing
    var router: Router!
    var rootRoute: Router.Route!
    
    // MARK: - Extended Functionality
    @Published var topLevelTransientView: AnyView? = nil
    
    // MARK: - Published
    @Published var rootView: AnyView!
    @Published var navigationPath: [LaunchScreenRoutes] = []
    @Published var sheetItem: LaunchScreenRoutes?
    @Published var fullCoverItem: LaunchScreenRoutes?
    
    // MARK: - Delegate
    var rootCoordinatorDelegate: RootCoordinatorDelegate
    
    init(rootCoordinatorDelegate: RootCoordinatorDelegate = .shared) {
        self.rootCoordinatorDelegate = rootCoordinatorDelegate
        self.rootRoute = rootCoordinatorDelegate.launchScreenRootRoute
        self.router = LaunchScreenRouter(coordinator: self)
        self.rootView = router.view(for: rootRoute)
        
        UINavigationBar.changeAppearance(clear: true)
    }
    
    func coordinatorView() -> AnyView {
        return AnyView(LaunchScreenCoordinatorView(coordinator: self))
    }
}
