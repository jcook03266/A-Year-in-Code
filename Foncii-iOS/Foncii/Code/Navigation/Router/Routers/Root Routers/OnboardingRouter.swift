//
//  OnboardingRouter.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import OrderedCollections

class OnboardingRouter: Routable {
    typealias Route = OnboardingRoutes
    typealias Body = AnyView
    typealias Coordinator = OnboardingCoordinator
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let authService: AuthenticationService = inject()
        let userManager: UserManager = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Root Route Decision Tree
    /// Computed to allow for dynamic route changes as the user's state mutates
    var decisionTree: BinaryDecisionTree<Route> {
        return buildDecisionTree()
    }
    
    // MARK: - View Models
    /// Cached View Models
    /// Note: These view models must maintain their state which is why they're cached here, for other non-stateful views they can be instantiated at will
    var openingScreenViewModel: OpeningScreenViewModel!
    
    /// Computed View Models
    /// Note: these are not stateful views, their states must be reset every time they're accessed which is why they're not cached
    var resetPasswordScreenViewModel: ResetPasswordScreenViewModel<Coordinator> {
        return .init(coordinator: self.coordinator)
    }
    
    var forgotUsernameScreenViewModel: ForgotUsernameScreenViewModel {
        return .init(coordinator: self.coordinator)
    }
    
    var confirmationScreenViewModel: ConfirmationScreenViewModel<Coordinator> {
        return .init(coordinator: self.coordinator)
    }
    
    var enableLocationScreenViewModel: EnableLocationScreenViewModel {
        return .init(coordinator: self.coordinator)
    }
    
    var loginScreenViewModel: LoginScreenViewModel {
        return .init(coordinator: self.coordinator)
    }
    
    var signUpScreenViewModel: SignUpScreenViewModel {
        return .init(coordinator: self.coordinator)
    }
    
    var otpScreenViewModel: OTPScreenViewModel {
        return .init(coordinator: self.coordinator)
    }
    
    var selectFavoriteRestaurantsScreenViewModel: SelectFavoriteRestaurantsScreenViewModel {
        return .init(coordinator: self.coordinator)
    }
    
    // MARK: - Properties
    var coordinator: Coordinator
    
    init(coordinator: Coordinator) {
        self.coordinator = coordinator
        
        initViewModels()
    }
    
    func initViewModels() {
        self.openingScreenViewModel = .init(coordinator: self.coordinator)
    }
    
    func getPath(to route: Route) -> OrderedSet<Route> {
        var path: OrderedSet<Route> = []
        
        switch route {
        case .main:
            path = [.main]
        case .login:
            path = [.main, .login]
        case .signUp:
            path = [.main,
                .signUp(referralID: nil)]
        case .forgotUsername:
            path = [.main, .login, .forgotUsername]
        case .otp:
            /// Not accessible outside of sign up/ sign in flow
            /// Note: Do not allow users to deep link to this screen, for internal usage only when a user must be shunted to the OTP to verify their phone number
            path = [.main,
                    .signUp(referralID: nil),
                    .otp]
        case .enableLocation:
            /// Note: Do not allow users to deep link to this screen,
            path = [.main,
                    .signUp(referralID: nil),
                    .enableLocation]
        case .selectFavorites:
            /// Note: Do not allow users to deep link to this screen, logged in users that completed onboarding cannot go to this screen, in the deep link manager prevent the user from going to this scene entirely if they're logged in, but only if their location service is turned on ofc
            path = [.main,
                    .signUp(referralID: nil),
                    .enableLocation, .selectFavorites]
        case .resetPassword:
            path = [.main, .login, .resetPassword]
        case .confirmation:
            break /// Not accessible outside of resetting credentials
        }
        
        /// Insert the terminal / target route at the
        /// end of the path, allows for injection of
        /// custom data for critical pathways to persist
        if !path.isEmpty {
            path.removeLast()
            path.append(route)
        }
        
        return path
    }
    
    // MARK: - Dependency Based Navigation
    func getNextRouteFrom(route: Route) -> Route {
        let userManager = self.dependencies.userManager
        let userRequirements = userManager.userRequirements
        var destinationRoute: Route = .main
        
        switch route {
        /// Select favorites included because it switches branches so no next route is available
        case .main, .confirmation, .selectFavorites:
            break
        case .login, .signUp, .otp, .enableLocation:
            let nextRoute: Route = {
                guard dependencies.authService.isAuthenticated,
                      let userRequirements = userRequirements
                else { return destinationRoute }
                
                if userRequirements.userMustVerifyPhoneNumber {
                    destinationRoute = .otp
                }
                else if userRequirements.userMustGrantLocationPermission {
                    destinationRoute = .enableLocation
                }
                else if userRequirements.userMustAddFirstFavoriteRestaurants {
                    destinationRoute = .selectFavorites
                }
                
                return destinationRoute
            }()
            
            destinationRoute = nextRoute
        case .forgotUsername, .resetPassword:
            destinationRoute = .confirmation
        }
        
        return destinationRoute
    }
    
    private func buildDecisionTree() -> BinaryDecisionTree<Route> {
        let rootNode = BinaryDecisionTree<Route>.Node<Route>()
        
        rootNode
            .build { [weak self] builder in
                guard let self = self
                else { return }
                
                // MARK: - User Authentication Decision Branch
                /// If the user is authenticated then explore any of the requirements they might need
                /// to fulfill by simulating them going through the login page.
                /// If they're not authenticated then default to main for the user to decide which action to take and manually navigate
                /// Note: Branch switching is handled by the root coordinator delegate so there's no need to switch here in case all requirements are fulfilled
                builder.addDecision {
                    self.dependencies
                        .authService
                        .isAuthenticated
                    &&
                    self.dependencies
                        .userManager
                        .isUserPresent
                }
                
                let falseChild = BinaryDecisionTree<Route>.Node(value: Route.main)
                let trueChild = BinaryDecisionTree<Route>.Node(value: getNextRouteFrom(route: .login))
                
                builder.addTrueChild(child: trueChild)
                builder.addFalseChild(child: falseChild)
            }
        
        return BinaryDecisionTree<Route>(root: rootNode)
    }
    
    func getPreferredPresentationMethod(for route: Route) -> PreferredViewPresentationMethod {
        return route.getPreferredPresentationMethod()
    }
    
    func getStringLiteral(for route: Route) -> String {
        return route.getStringIdentifier()
    }
    
    func view(for route: Route) -> AnyView {
        var view: any View = EmptyView()
        let statusBarHidden: Bool = false
        
        switch route {
        case .main:
            view = OpeningScreen(model: self.openingScreenViewModel)
        case .login:
            view = LoginScreen(model: self.loginScreenViewModel)
        case .signUp:
            view = SignUpScreen(model: self.signUpScreenViewModel)
        case .forgotUsername:
            view = ForgotUsernameScreen(model: self.forgotUsernameScreenViewModel)
        case .otp:
            view = OTPScreen(model: self.otpScreenViewModel)
        case .enableLocation:
            view = EnableLocationScreen(model: self.enableLocationScreenViewModel)
        case .selectFavorites:
            view = SelectFavoriteRestaurantsScreen(model: self.selectFavoriteRestaurantsScreenViewModel)
        case .resetPassword:
            view = ResetPasswordScreen(model: self.resetPasswordScreenViewModel)
        case .confirmation:
            break /// Use the confirmation screen view builder, this screen is not to be presented modally [In its own view hierarchy instance]
        }
        
        self.coordinator.statusBarHidden = statusBarHidden
        return AnyView(view
            .routerStatusBarVisibilityModifier(visible: statusBarHidden,
                                               coordinator: self.coordinator)
                .navigationBarBackButtonHidden(true)
        )
    }
    
    func confirmationScreen(destinationRoute: Route? = nil,
                            confirmationMessage: String) -> AnyView {
        var view: any View = EmptyView()
        let statusBarHidden: Bool = false
        
        let model = confirmationScreenViewModel
        model.confirmationMessage = confirmationMessage
        model.destinationRoute = destinationRoute
        
        view = ConfirmationScreen(model: model)
        
        self.coordinator.statusBarHidden = statusBarHidden
        return AnyView(view
            .routerStatusBarVisibilityModifier(visible: statusBarHidden,
                                               coordinator: self.coordinator)
                .navigationBarBackButtonHidden(true)
        )
    }
}

