//
//  HomeTabRouter.swift
//  Foncii
//
//  Created by Justin Cook on 2/11/23.
//

import SwiftUI
import OrderedCollections

class HomeTabRouter: Routable {
    typealias Route = HomeRoutes
    typealias Body = AnyView
    
    // MARK: -  View Models
    // Stateful Screens
    var homeScreenViewModel: HomeScreenViewModel!
    
    // Static Screens (Doesn't maintain state changes)
    var dateAndLocationEditorSheetViewModel: DateAndLocationEditorSheetViewModel {
        return .init(coordinator: self.coordinator)
    }
    
    // MARK: - Deeplink URL Fragments
    /// The section to scroll to on the home screen when passed a section identifier
    //    @Published var homeScreenSectionFragment: HomeScreenViewModel.Sections? = nil
    
    // MARK: - Deeplink Queries
    /// Main Screen
    @Published var restaurantSearchQuery: String = ""
    
    // MARK: - Properties
    var coordinator: HomeTabCoordinator
    
    init(coordinator: HomeTabCoordinator) {
        self.coordinator = coordinator
        
        initViewModels()
    }
    
    func initViewModels() {
        homeScreenViewModel = .init(coordinator: self.coordinator)
    }
    
    // MARK: - Factory Methods
    // View Model Factory
    func createRestaurantDetailViewModel(
        restaurantData: PersonalizedRestaurantSearchResult?,
        restaurantID: String?
    ) -> RestaurantDetailViewModel<HomeTabCoordinator> {
        return .init(coordinator: self.coordinator,
                     selectedRestaurantData: restaurantData,
                     targetRestaurantID: restaurantID)
    }
    
    // MARK: - Navigation Logic
    func getPath(to route: Route) -> OrderedCollections.OrderedSet<Route> {
        var path: OrderedSet<Route> = []
        
        switch route {
        case .main:
            path = [.main]
        case .addMore:
            path = [.main, .addMore]
        case .search:
            path = [.main, .search]
        case .importContacts:
            path = [.main, .importContacts]
        case .dateAndLocationEditor:
            path = [.main, .dateAndLocationEditor]
        case .suggestedRestaurants:
            path = [.main, .suggestedRestaurants]
        case .restaurantDetail:
            path = [.main, .restaurantDetail(restaurantData: nil, restaurantID: nil)]
        case .reservation:
            path = [.main,
                    .restaurantDetail(restaurantData: nil, restaurantID: nil)
                    , .reservation]
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
        let statusBarHidden: Bool = false
        
        switch route {
        case .main:
            view = HomeScreen(model: self.homeScreenViewModel)
        case .addMore:
            break
        case .search:
            break
        case .importContacts:
            break
        case .dateAndLocationEditor:
            view = DateAndLocationEditorSheet(model: self.dateAndLocationEditorSheetViewModel)
        case .suggestedRestaurants:
            break
        case .restaurantDetail(
            let restaurantData,
            let restaurantID
        ):
            
            view = RestaurantDetailView(
                model: self.createRestaurantDetailViewModel(restaurantData: restaurantData,
                                                            restaurantID: restaurantID))
        case .reservation:
            break
        }
        
        self.coordinator.statusBarHidden = statusBarHidden
        return AnyView(view
            .routerStatusBarVisibilityModifier(visible: statusBarHidden,
                                               coordinator: self.coordinator)
        )
    }
}

