//
//  Router.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import OrderedCollections

/// - Responsibilities: Knows how to create views, create views, presents views, and dismisses views
protocol Routable: ObservableObject {
    typealias RouteType = Hashable & CaseIterable
    associatedtype coordinator: Coordinator
    associatedtype Route: RouteType
    associatedtype Body: View
    
    var coordinator: coordinator { get }
    
    @ViewBuilder func view(for route: Route) -> Self.Body
    
    /// Optional func for abstracting the intialization of any retained view models by the router
    func initViewModels() -> Void
    
    func getPath(to route: Route) -> OrderedSet<Route>
    
    func getPreferredPresentationMethod(for route: Route) -> PreferredViewPresentationMethod
    
    /// Human readable String description of the route
    func getStringLiteral(for route: Route) -> String
}

extension Routable {
    func initViewModels() {}
}
