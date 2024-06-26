//
// NavigationDomain.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 1:47 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import Foundation

/// Domain responsible for maintaining a consistent application navigation state
struct NavigationDomain: ComposedDomain {
    // MARK: - Initial State
    var initialState: State = .init()
    
    struct State: Equatable {
        // Tabbars
        var selectedTabbarTab: MainRoutes = .home
        
        // Coordinators
        var currentRouteDirectory: RouteDirectories = .LaunchScreenRoutes
        
        var currentRoute: AnyHashable? = nil
        
        // Deeplinks
        var currentDeepLink: URL? = nil
    }
    
    // MARK: - Actions To Reduce
    enum Action: Equatable {
    }
    
    func reduce(
        into state: inout State,
        action: Action
    ) -> EffectTask<Action> {
        return .none
    }
}


