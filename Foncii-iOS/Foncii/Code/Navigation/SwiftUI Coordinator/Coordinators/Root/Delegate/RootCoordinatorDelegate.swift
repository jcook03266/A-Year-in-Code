//
//  RootCoordinator.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI

/// A centralized delegate for all root coordinators to refer to an interact with and be managed by
class RootCoordinatorDelegate: ObservableObject {
    // MARK: - Published
    @Published var activeRoot: RootCoordinators!
    
    // MARK: - Coordinator Selectors
    var rootCoordinatorSelector: RootCoordinatorSelector!
    var generalCoordinatorSelector: GeneralCoordinatorSelector!
    var tabbarCoordinatorSelector: TabbarCoordinatorSelector!
    
    // MARK: - Root Coordinator management
    var activeRootCoordinator: (any RootCoordinator)!
    
    // MARK: - Singleton Instance to prevent reinstantiation at runtime
    static let shared: RootCoordinatorDelegate = .init()
    
    // MARK: - Launch Screen Manager
    private var launchScreenManager: LaunchScreenManager = .shared
    
    // MARK: - Reference values to be used whenever needed
    static var rootSwitchAnimationBlendDuration: CGFloat = 0.25
    
    // MARK: - Active Root Coordinator Decision Tree
    /// Computed to allow for dynamic route changes as the user's state mutates
    private var decisionTree: BinaryDecisionTree<RootCoordinators> {
        return buildDecisionTree()
    }
    
    /// In case the decision tree falls through, this is the fallback root
    private let defaultRoot = RootCoordinators.mainCoordinator
    
    // MARK: - Root Routes for Root Coordinators
    var launchScreenRootRoute: LaunchScreenRoutes = .main
    var onboardingRootRoute: OnboardingRoutes = .main
    var mainRootRoute: MainRoutes = .home
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let authService: AuthenticationService = inject()
        let userManager: UserManager = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Convenience
    /// - Note: Running this app in a debug env overrides all of the following feature authorization flags
    /// * Only navigate here when a user is signed in and all their requirements are fulfilled
    var canNavigateToMainScene: Bool {
        return dependencies.userManager.isUserPresent
        && dependencies.userManager.userRequirements.areAllUserRequirementsFulfilled
    }
    
    /// The app can freely navigate back and forth between the onboarding scene
    var canNavigateToOnboardingScene: Bool {
        return true
    }
    
    /// Only navigate to the launch scene once, never accessible after the transition to the user driven roots
    var canNavigateToLaunchScene: Bool {
        return activeRoot != .mainCoordinator
        && activeRoot != .onboardingCoordinator
    }
    
    private init() {
        self.rootCoordinatorSelector = .init(delegate: self)
        self.generalCoordinatorSelector = .init(delegate: self)
        self.createTabbarCoordinatorSelector(parentCoordinator: self
            .rootCoordinatorSelector
            .mainCoordinator)
        
        performOnLoadNavigation()
    }
    
    /// Create the tabbar tab coordinator selector using any tabbar coordinator, passing a direct reference like this is required to prevent a race condition or a looping reference from one object referencing an object before it's done being initialized
    private func createTabbarCoordinatorSelector(parentCoordinator: any TabbarCoordinator)
    {
        guard tabbarCoordinatorSelector == nil
        else { return }
        
        tabbarCoordinatorSelector = .init(parentCoordinator: parentCoordinator,
                                          rootCoordinatorDelegateReference: self)
    }
    
    func performOnLoadNavigation() {
        switchToLaunchScreenScene()
        performLaunchScreenBridge()
    }

    func performLaunchScreenBridge() {
        launchScreenManager.onDelayedComplete { [weak self] in
            guard let self = self
            else { return }

            /// The decision tree decides which scene to navigate to when the launch screen is done
            let activeRootNode = self.decisionTree.execute()
            if let activeRoot = activeRootNode?.value {
                self.switchActiveRoot(to: activeRoot)
            }
            else {
                self.switchActiveRoot(to: self.defaultRoot)
            }
        }
    }
    
    private func buildDecisionTree() -> BinaryDecisionTree<RootCoordinators> {
        let rootNode = BinaryDecisionTree<RootCoordinators>
            .Node<RootCoordinators>()

        rootNode
            .build { [weak self] builder in
                    guard let self = self
                    else { return }
                
                // MARK: - User Authentication Decision Branch
                /// If the user is authenticated, their data is loaded, and doesn't have any user requirements then move them to the main scene, else onboarding / login scene
                builder.addDecision {
                    let condition = self.dependencies
                        .authService
                        .isAuthenticated
                    && self.dependencies
                        .userManager
                        .isUserPresent
                    && self.dependencies
                        .userManager
                        .userRequirements
                        .areAllUserRequirementsFulfilled
                    
                    return condition
                }

                // Onboarding Coordinator
                let falseChild = BinaryDecisionTree<RootCoordinators>.Node(value: RootCoordinators.onboardingCoordinator)

                // Main Coordinator
                let trueChild = BinaryDecisionTree<RootCoordinators>.Node(value: RootCoordinators.mainCoordinator)

                builder.addTrueChild(child: trueChild)
                builder.addFalseChild(child: falseChild)
            }

        return BinaryDecisionTree<RootCoordinators>(root: rootNode)
    }
    
    /// Transitions the user to the specified scene, with that scene handling any transition animations
    func switchActiveRoot(to root: RootCoordinators) {
        guard root != self.activeRoot else { return }

        // prevent the user from accessing restricted scenes
        if root == .mainCoordinator && !canNavigateToMainScene
            || root == .onboardingCoordinator && !canNavigateToOnboardingScene
            || root == .launchScreenCoordinator && !canNavigateToLaunchScene
        { return }

        activeRoot = root
        activeRootCoordinator = getRootCoordinatorFor(root: root)
    }

    // MARK: - Convenience functions
    func switchToLaunchScreenScene() {
        /// Switching to the launch screen after it has already been presented is only available in a debugging environment, no deeplinking is provided to access it outside of a controlled environment
        guard canNavigateToLaunchScene
        else { return }
        
        // Switch to the root view and then switch the root scene to the launch screen scene
        switchActiveRoot(to: .launchScreenCoordinator)
        self.activeRootCoordinator.rebaseRootView()
    }

    func switchToOnboardingScene() {
        guard canNavigateToOnboardingScene
        else { return }
        
        // Switch to the root view and then switch the root scene to the onboarding scene
        switchActiveRoot(to: .onboardingCoordinator)
        self.activeRootCoordinator.rebaseRootView()
    }

    func switchToMainScene() {
        guard canNavigateToMainScene
        else { return }

        // Switch to the root view and then switch the root scene to the main scene
        switchActiveRoot(to: .mainCoordinator)
        self.activeRootCoordinator.rebaseRootView()
    }
}

// MARK: - Root Coordinator tracking and selection
extension RootCoordinatorDelegate {
    /// A persistent cache of all root coordinators, once initialized they remain here until the delegate is cleared from memory, this helps with manipulating data across roots without having to switch to them directly
    struct RootCoordinatorSelector {
        let delegate: RootCoordinatorDelegate
        lazy var launchScreenCoordinator: LaunchScreenCoordinator = .init(rootCoordinatorDelegate: delegate)
        lazy var onboardingCoordinator: OnboardingCoordinator = .init(rootCoordinatorDelegate: delegate)
        lazy var mainCoordinator: MainCoordinator = .init(rootCoordinatorDelegate: delegate)
    }
    
    func getRootCoordinatorFor(root: RootCoordinators) -> any RootCoordinator {
        switch root {
        case .launchScreenCoordinator:
            return rootCoordinatorSelector
                .launchScreenCoordinator
            
        case .onboardingCoordinator:
            return rootCoordinatorSelector
                .onboardingCoordinator
            
        case .mainCoordinator:
            return rootCoordinatorSelector
                .mainCoordinator
        }
    }
    
    /// Keeps track of all root coordinators
    enum RootCoordinators: Hashable, CaseIterable {
        case launchScreenCoordinator
        case onboardingCoordinator
        case mainCoordinator
    }
}

// MARK: - Tabbar Tab Coordinator tracking and selection
extension RootCoordinatorDelegate {
    struct TabbarCoordinatorSelector {
        var parentCoordinator: any Coordinator
        
        let homeTabCoordinator: HomeTabCoordinator,
            mapTabCoordinator: MapTabCoordinator,
            profileTabCoordinator: ProfileTabCoordinator
        
        let rootCoordinatorDelegateReference: RootCoordinatorDelegate
        
        init(parentCoordinator: any Coordinator,
             rootCoordinatorDelegateReference: RootCoordinatorDelegate) {
            self.parentCoordinator = parentCoordinator
            self.rootCoordinatorDelegateReference = rootCoordinatorDelegateReference
            
            self.homeTabCoordinator = .init(parent: parentCoordinator,
                                            rootCoordinatorDelegate: rootCoordinatorDelegateReference)
            self.mapTabCoordinator = .init(parent: parentCoordinator,
                                           rootCoordinatorDelegate: rootCoordinatorDelegateReference)
            self.profileTabCoordinator = .init(parent: parentCoordinator,
                                               rootCoordinatorDelegate: rootCoordinatorDelegateReference)
        }
    }
    
    func getTabCoordinatorFor(tab: TabCoordinators,
                              parentCoordinator: any TabbarCoordinator) -> any Coordinator
    {
        createTabbarCoordinatorSelector(parentCoordinator: parentCoordinator)
        var coordinator: any Coordinator
        
        switch tab {
        case .homeTabCoordinator:
            coordinator = tabbarCoordinatorSelector
                .homeTabCoordinator
        case .mapTabCoordinator:
            coordinator = tabbarCoordinatorSelector
                .mapTabCoordinator
        case .profileTabCoordinator:
            coordinator = tabbarCoordinatorSelector
                .profileTabCoordinator
        }

        return coordinator
    }
    
    /// Keeps track of all tabbar tab coordinators
    enum TabCoordinators: Hashable, CaseIterable {
        case homeTabCoordinator,
             mapTabCoordinator,
             profileTabCoordinator
    }
}

// MARK: - Non-Root Coordinator tracking and selection
extension RootCoordinatorDelegate {
    struct GeneralCoordinatorSelector {
        let delegate: RootCoordinatorDelegate
    }
    
    func getCoordinatorFor(coordinator: GeneralCoordinators) -> any Coordinator {
        switch coordinator {
        case .tba:
            break
        }
        
        // TODO: - Replace This Placeholder
        return rootCoordinatorSelector.mainCoordinator
    }
    
    /// Keeps track of all non-root non-tab coordinators
    enum GeneralCoordinators: Hashable, CaseIterable {
        case tba
    }
}
