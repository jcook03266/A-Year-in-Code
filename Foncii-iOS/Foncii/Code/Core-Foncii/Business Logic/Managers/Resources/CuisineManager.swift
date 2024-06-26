//
// CuisineManager.swift
// Foncii
//
// Created by Justin Cook on 4/23/23 at 1:12 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import OrderedCollections

class CuisineManager: StaticAssetManager {
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.staticAssetActionDispatcher) var staticAssetActionDispatcher
    
    // MARK: - Properties
    var currentActivity: StaticAssetDomain.State.StaticAssetManagerActivityStates {
        return AppService
            .shared
            .getCurrentState(of: \.staticAssetState)
            .cuisineManagerCurrentActivity
    }
    
    var cuisines: OrderedSet<Cuisine> {
        return AppService
            .shared
            .getCurrentState(of: \.staticAssetState)
            .cuisines
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let apolloService: GraphQLAPIServiceAdapter = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Singleton
    static let shared: CuisineManager = .init()
    
    private init() {}
}

// MARK: - Business Logic
extension CuisineManager {
    @MainActor func fetch() async {
        staticAssetActionDispatcher
            .updateCuisineManagerActivity(activity: .loading)
        
       let cuisines = await dependencies
            .apolloService
            .performFetchAllCuisines()
        
        // Fetch failed
        if cuisines.isEmpty {
            staticAssetActionDispatcher
                .updateCuisineManagerActivity(activity: .failed)
        }
        else {
            // Fetch successful, update store
            staticAssetActionDispatcher
                .updateCuisineManagerActivity(activity: .done)
            
            staticAssetActionDispatcher
                .setCuisines(cuisines: cuisines)
        }
    }
    
    /// Reloads from the cache (if any) or if the last fetch failed, fetches from the remote
    /// and provisions the cache that was originally supposed to be fetched from
    @MainActor func reload() async {
       await fetch()
    }
    
    func reset() {
        staticAssetActionDispatcher
            .resetCuisineManager()
    }
}
