//
// AppDomain.swift
// Foncii
//
// Created by Justin Cook on 5/31/23 at 5:23 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture

/**
 * This domain represents the complete Redux app state, its environment, and all of the actions
 * that can be taken to mutate that unified state over the course of the app's life cycle
 */
struct AppDomain: ComposedDomain {
    // MARK: - Initial State
    var initialState: State = .prod
    
    struct State: Equatable {
        /// Combined domains / slices
        var clientState: ClientDomain.State
        var navigationState: NavigationDomain.State
        var restaurantState: RestaurantDomain.State
        var staticAssetState: StaticAssetDomain.State
        
        /// Complex Screen States
        var homeScreenState: HomeScreenDomain.State
        var profileScreenState: ProfileScreenDomain.State
    }
    
    // MARK: - Actions To Reduce
    enum Action: Equatable {
        case clientAction(ClientDomain.Action)
        case navigationAction(NavigationDomain.Action)
        case restaurantAction(RestaurantDomain.Action)
        case staticAssetAction(StaticAssetDomain.Action)
        case homeScreenAction(HomeScreenDomain.Action)
        case profileScreenAction(ProfileScreenDomain.Action)
    }
    
    var body: some ReducerProtocol<State, Action> {
        // User Domain
        Scope(
            state: \.clientState,
            action: /Action.clientAction
        ) {
            ClientDomain()
        }
        
        // Navigation Domain
        Scope(
            state: \.restaurantState,
            action: /Action.restaurantAction
        ) {
            RestaurantDomain()
        }
        
        // Restaurant Domain
        Scope(
            state: \.restaurantState,
            action: /Action.restaurantAction
        ) {
            RestaurantDomain()
        }
        
        // Restaurant Domain
        Scope(
            state: \.staticAssetState,
            action: /Action.staticAssetAction
        ) {
            StaticAssetDomain()
        }
        
        // Home Screen Domain
        Scope(
            state: \.homeScreenState,
            action: /Action.homeScreenAction
        ) {
            HomeScreenDomain()
        }
        
        // Map Screen Domain
        
        // Profile Screen Domain
        Scope(
            state: \.profileScreenState,
            action: /Action.profileScreenAction
        ) {
            ProfileScreenDomain()
        }
    }
}

/// An shared state tree for the application's production code
extension AppDomain.State {
    static let prod = Self(
        clientState: .init(),
        navigationState: .init(),
        restaurantState: .init(),
        staticAssetState: .init(),
        homeScreenState: .init(),
        profileScreenState: .init()
    )
}
