//
// FoodRestrictionsManager.swift
// Foncii
//
// Created by Justin Cook on 4/23/23 at 1:13 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import OrderedCollections

class FoodRestrictionsManager: StaticAssetManager {
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.staticAssetActionDispatcher) var staticAssetActionDispatcher
    
    // MARK: - Properties
    var currentActivity: StaticAssetDomain.State.StaticAssetManagerActivityStates {
        return AppService
            .shared
            .getCurrentState(of: \.staticAssetState)
            .foodRestrictionManagerCurrentActivity
    }
    
    var foodRestrictions: OrderedSet<FoodRestriction> {
        return AppService
            .shared
            .getCurrentState(of: \.staticAssetState)
            .foodRestrictions
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let apolloService: GraphQLAPIServiceAdapter = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Singleton
    static let shared: FoodRestrictionsManager = .init()
    
    private init() {}
}

// MARK: - Business Logic
extension FoodRestrictionsManager {
    @MainActor func fetch() async {
        staticAssetActionDispatcher
            .updateFoodRestrictionManagerActivity(activity: .loading)
        
       let foodRestrictions = await dependencies
            .apolloService
            .performFetchAllFoodRestrictions()
        
        // Fetch failed
        if foodRestrictions.isEmpty {
            staticAssetActionDispatcher
                .updateFoodRestrictionManagerActivity(activity: .failed)
        }
        else {
            // Fetch successful, update store
            staticAssetActionDispatcher
                .updateFoodRestrictionManagerActivity(activity: .done)
            
            staticAssetActionDispatcher
                .setFoodRestrictions(foodRestrictions: foodRestrictions)
        }
    }
    
    /// Reloads from the cache (if any) or if the last fetch failed, fetches from the remote
    /// and provisions the cache that was originally supposed to be fetched from
    @MainActor func reload() async {
       await fetch()
    }
    
    func reset() {
        staticAssetActionDispatcher
            .resetFoodRestrictionManager()
    }
}

