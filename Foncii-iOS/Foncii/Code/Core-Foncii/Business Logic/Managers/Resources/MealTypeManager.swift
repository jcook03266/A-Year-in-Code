//
// MealTypeManager.swift
// Foncii
//
// Created by Justin Cook on 4/23/23 at 1:13 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import OrderedCollections

class MealTypeManager: StaticAssetManager {
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.staticAssetActionDispatcher) var staticAssetActionDispatcher
    
    // MARK: - Properties
    var currentActivity: StaticAssetDomain.State.StaticAssetManagerActivityStates {
        return AppService
            .shared
            .getCurrentState(of: \.staticAssetState)
            .mealTypeManagerCurrentActivity
    }
    
    var mealTypes: OrderedSet<MealType> {
        return AppService
            .shared
            .getCurrentState(of: \.staticAssetState)
            .mealTypes
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let apolloService: GraphQLAPIServiceAdapter = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Singleton
    static let shared: MealTypeManager = .init()
    
    private init() {}
}

// MARK: - Business Logic
extension MealTypeManager {
    @MainActor func fetch() async {
        staticAssetActionDispatcher
            .updateMealTypeManagerActivity(activity: .loading)
        
       let mealTypes = await dependencies
            .apolloService
            .performFetchAllMealTypes()
        
        // Fetch failed
        if mealTypes.isEmpty {
            staticAssetActionDispatcher
                .updateMealTypeManagerActivity(activity: .failed)
        }
        else {
            // Fetch successful, update store
            staticAssetActionDispatcher
                .updateMealTypeManagerActivity(activity: .done)
            
            staticAssetActionDispatcher
                .setMealTypes(mealTypes: mealTypes)
        }
    }
    
    /// Reloads from the cache (if any) or if the last fetch failed, fetches from the remote
    /// and provisions the cache that was originally supposed to be fetched from
    @MainActor func reload() async {
       await fetch()
    }
    
    func reset() {
        staticAssetActionDispatcher
            .resetMealTypeManager()
    }
}
