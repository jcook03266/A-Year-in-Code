//
//  OnboardingCoordinator.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import UIKit

class OnboardingCoordinator: RootCoordinator {
    typealias Router = OnboardingRouter
    typealias Body = AnyView
    
    // MARK: - Properties
    unowned var parent: any Coordinator {
        return self
    }
    var children: [any Coordinator] = []
    var deferredDismissalActionStore: [OnboardingRoutes : (() -> Void)?] = [:]
    var statusBarHidden: Bool = true /// Important: Do not publish changes from this variable, it disrupts the presentation of sheet modifiers
    
    // MARK: - Routing
    var router: Router!
    var rootRoute: Router.Route! {
        /// Compute the correct root route depending on the user's current state
        return router.decisionTree.execute()?.value ?? rootCoordinatorDelegate.onboardingRootRoute
    }
    
    // MARK: - Extended Functionality
    @Published var topLevelTransientView: AnyView? = nil
    
    // MARK: - Published
    @Published var rootView: AnyView!
    @Published var navigationPath: [OnboardingRoutes] = []
    @Published var sheetItem: OnboardingRoutes?
    @Published var fullCoverItem: OnboardingRoutes?
    
    // MARK: - Delegate
    var rootCoordinatorDelegate: RootCoordinatorDelegate
    
    init(rootCoordinatorDelegate: RootCoordinatorDelegate = .shared) {
        self.rootCoordinatorDelegate = rootCoordinatorDelegate
        self.router = OnboardingRouter(coordinator: self)
        self.rootView = router.view(for: rootRoute)
        
        UINavigationBar.changeAppearance(clear: true)
    }
    
    func coordinatorView() -> AnyView {
        AnyView(OnboardingCoordinatorView(coordinator: self))
    }
    
    /// Displays the confirmation screen as a transient top level view
    func displayConfirmationScreen(destinationRoute: OnboardingRoutes,
                                   confirmationMessage: String,
                                   presentationDuration: Int) {
        let confirmationScreen = router
            .confirmationScreen(destinationRoute: destinationRoute,
                                confirmationMessage: confirmationMessage)
        
        displayTransientView(view: confirmationScreen,
                             for: presentationDuration)
    }
}
