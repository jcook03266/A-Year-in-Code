//
//  ProfileTabRouter.swift
//  Foncii
//
//  Created by Justin Cook on 2/11/23.
//

import SwiftUI
import OrderedCollections

class ProfileTabRouter: Routable {
    typealias Route = ProfileRoutes
    typealias Body = AnyView
    
    // MARK: -  View Models
    // Stateful Screens
    var profileScreenViewModel: ProfileScreenViewModel!,
        settingsScreenViewModel: SettingsScreenViewModel!
    
    // Static Screens (Doesn't maintain state changes)
    var tasteProfileQuestionnaireScreenViewModel: TasteProfileQuestionnaireScreenViewModel {
        .init(coordinator: self.coordinator)
    }
    
    // MARK: - Properties
    var coordinator: ProfileTabCoordinator
    
    init(coordinator: ProfileTabCoordinator) {
        self.coordinator = coordinator
        
        initViewModels()
    }
    
    func initViewModels() {
        profileScreenViewModel = .init(coordinator: self.coordinator)
        settingsScreenViewModel = .init(coordinator: self.coordinator)
    }
    
    func getPath(to route: Route) -> OrderedCollections.OrderedSet<Route> {
        var path: OrderedSet<Route> = []
        
        switch route {
        case .main:
            path = [.main]
        case .viewAllLocations:
            path = [.main, .viewAllLocations]
        case .qrFavorites:
            path = [.main, .qrFavorites]
        case .sendRecommendations:
            path = [.main, .sendRecommendations]
        case .requestRecommendations:
            path = [.main, .requestRecommendations]
        case .myQRCode:
            path = [.main, .myQRCode]
        case .profileProgress:
            path = [.main, .profileProgress]
        case .inviteContacts:
            path = [.main, .profileProgress, .inviteContacts]
        case .settings:
            path = [.main, .settings]
        case .notifications:
            path = [.main, .notifications]
        case .profileInformation:
            path = [.main, .settings, .profileInformation]
        case .referral:
            path = [.main, .settings, .referral]
        case .tasteProfileQuestionnaire:
            path = [.main, .tasteProfileQuestionnaire]
        case .restaurantDetail:
            path = [.main,
                    .profileProgress,
                    .restaurantDetail(restaurantData: nil, restaurantID: nil)]
        case .reservation:
            path = [.main,
                    .profileProgress, .restaurantDetail(restaurantData: nil, restaurantID: nil),
                    .reservation]
        case .resetPassword:
            path = [.main, .settings, .resetPassword]
        case .confirmation:
            break // N/A via deeplinking
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
    
    func getPreferredPresentationMethod(for route: Route) -> PreferredViewPresentationMethod {
        return route.getPreferredPresentationMethod()
    }
    
    func getStringLiteral(for route: Route) -> String {
        return route.getStringIdentifier()
    }
    
    func view(for route: Route) -> AnyView {
        var view: any View = EmptyView()
        var statusBarHidden: Bool = false
        
        switch route {
        case .main:
            view = ProfileScreen(model: self.profileScreenViewModel)
        case .viewAllLocations:
            break
        case .qrFavorites:
            break
        case .sendRecommendations:
            break
        case .requestRecommendations:
            break
        case .myQRCode:
            break
        case .profileProgress:
            break
        case .inviteContacts:
            break
        case .settings:
            view = SettingsScreen(model: self.settingsScreenViewModel)
                .navigationBarBackButtonHidden()
        case .notifications:
            break
        case .profileInformation:
            break
        case .referral:
            break
        case .tasteProfileQuestionnaire:
            view = TasteProfileQuestionnaireScreen(model: self.tasteProfileQuestionnaireScreenViewModel)
                .navigationBarBackButtonHidden()
        case .restaurantDetail:
            break
        case .reservation:
            break
        case .resetPassword:
            break
        case .confirmation:
            break
        }
        
        self.coordinator.statusBarHidden = statusBarHidden
        return AnyView(view
            .routerStatusBarVisibilityModifier(visible: statusBarHidden,
                                               coordinator: self.coordinator)
        )
    }
}


