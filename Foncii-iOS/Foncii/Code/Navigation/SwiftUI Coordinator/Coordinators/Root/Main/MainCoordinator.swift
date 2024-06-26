//
//  MainCoordinator.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import Combine
import UIKit

class MainCoordinator: TabbarCoordinator {
    typealias Router = MainRouter
    typealias Body = AnyView
    
    // MARK: - Properties
    unowned var parent: any Coordinator {
        return self
    }
    var children: [any Coordinator] = []
    var deferredDismissalActionStore: [MainRoutes : (() -> Void)?] = [:]
    var statusBarHidden: Bool = true // Important: Do not publish changes from this variable, it disrupts the presentation of sheet modifiers
    
    // MARK: - Routing
    var router: Router!
    var rootRoute: Router.Route!
    
    // MARK: - Extended Functionality
    @Published var topLevelTransientView: AnyView? = nil
    
    // MARK: - Published
    @Published var rootView: AnyView!
    @Published var navigationPath: [MainRoutes] = []
    @Published var sheetItem: MainRoutes?
    @Published var fullCoverItem: MainRoutes?
    @Published var currentTab: MainRoutes
    
    // MARK: - Observed
    @ObservedObject var rootCoordinatorDelegate: RootCoordinatorDelegate
    
    init(rootCoordinatorDelegate: RootCoordinatorDelegate = .shared) {
        self.rootCoordinatorDelegate = rootCoordinatorDelegate
        self.rootRoute = rootCoordinatorDelegate.mainRootRoute
        self.currentTab = rootRoute
        self.router = MainRouter(coordinator: self)
        self.rootView = router.view(for: rootRoute)
                
        UINavigationBar.changeAppearance(clear: true)
        
        /// Add the tabbar tab coordinators as children of this root
        populateChildren()
        
        /// Ensure the amount of children equals the amount of tabs currently enumerated
        assert(children.count == MainRoutes.allCases.count)

        presentRootTab()
    }
    
    // MARK: - Startup
    /// Present the target first tab, this is the first tab the user will see when they enter the app, (mutable)
    func presentRootTab() {
        navigateTo(tab: rootRoute)
    }
    
    // MARK: - Tabbar Navigation
    func navigateTo(tab: MainRoutes,
                    onNavigate: @escaping (() -> Void) = {}) {
        guard let child = getChildTabCoordinator(for: tab)
        else { return }
        
        onNavigate()
        currentTab = tab
        switchTo(rootCoordinator: child)
    }
    
    // MARK: - Root Coordinated View Builders
    func coordinatorView() -> AnyView {
        AnyView(MainCoordinatorView(coordinator: self))
    }
}

