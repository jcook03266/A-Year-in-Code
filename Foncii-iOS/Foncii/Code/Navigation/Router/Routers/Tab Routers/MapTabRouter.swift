//
//  MapTabRouter.swift
//  Foncii
//
//  Created by Justin Cook on 2/11/23.
//

import SwiftUI
import OrderedCollections

class MapTabRouter: Routable {
    typealias Route = MapRoutes
    typealias Body = AnyView
    
    // MARK: -  View Models
    // @Published var ...
    
    // MARK: - Deeplink Queries
    /// Main Screen
    @Published var restaurantSearchQuery: String = ""
    
    // MARK: - Properties
    var coordinator: MapTabCoordinator
    
    init(coordinator: MapTabCoordinator) {
        self.coordinator = coordinator
        
        initViewModels()
    }
    
    func initViewModels() {

    }
    
    func getPath(to route: Route) -> OrderedCollections.OrderedSet<Route> {
        var path: OrderedSet<Route> = []
        
        switch route {
        case .main:
            path = [.main]
        case .friendsFilter:
            path = [.main, .friendsFilter]
        case .moreFilters:
            path = [.main, .moreFilters]
        case .percentMatchFilter:
            path = [.main, .percentMatchFilter]
        case .priceRangeFilter:
            path = [.main, .priceRangeFilter]
        case .changeLocation:
            path = [.main, .changeLocation]
        case .restaurantDetail:
            path = [.main,
                    .restaurantDetail(restaurantData: nil, restaurantID: nil)]
        case .reservation:
            path = [.main,
                    .restaurantDetail(restaurantData: nil, restaurantID: nil),
                .reservation]
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
            view = AnyView(
                Color.green
            )
        case .friendsFilter:
            break
        case .moreFilters:
            break
        case .percentMatchFilter:
            break
        case .priceRangeFilter:
            break
        case .changeLocation:
            break
        case .restaurantDetail:
            break
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


