//
// StaticAssetManager.swift
// Foncii
//
// Created by Justin Cook on 6/19/23 at 2:19 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import ComposableArchitecture
import OrderedCollections

/**
 * Controls all static assets from one centralized location, allowing for
 * synchronous loading and reloading of static assets used across
 * the entire application
 */
class StaticAssetController {
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.staticAssetActionDispatcher) var staticAssetActionDispatcher
    
    // MARK: - Singleton
    static let shared: StaticAssetController = .init()
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let cuisineManager: CuisineManager = inject(),
            foodRestrictionManager: FoodRestrictionsManager = inject(),
            mealTypeManager: MealTypeManager = inject(),
            majorCityManager: MajorCityManager = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Static Assets
    var cuisines: OrderedSet<Cuisine> {
        return currentState.cuisines
    }
    
    var foodRestrictions: OrderedSet<FoodRestriction> {
        return currentState.foodRestrictions
    }
    
    var mealTypes: OrderedSet<MealType> {
        return currentState.mealTypes
    }
    
    var majorCities: OrderedSet<MajorCity> {
        return currentState.majorCities
    }
    
    /// A static list of the supported price levels (doesn't change from platform to platform so this can be hard coded)
    var priceLevels: Dictionary<Int, Int> {
        return [
            0 : 1,
            1 : 2,
            2 : 3,
            3 : 4
        ]
    }
    
    // MARK: - Redux State
    var currentState: StaticAssetDomain.State {
        return AppService
            .shared
            .getCurrentState(of: \.staticAssetState)
    }
    
    private init() {}
}

// MARK: - Business Logic
extension StaticAssetController {
    /// Fetches, caches, and stores all static assets in parallel
    func load() {
        Task { @MainActor in
            await [
                dependencies
                    .cuisineManager
                    .fetch(),
                dependencies
                    .foodRestrictionManager
                    .fetch(),
                dependencies
                    .mealTypeManager
                    .fetch(),
                dependencies
                    .majorCityManager
                    .fetch()
            ]
        }
    }
    
    /// Reloads all static assets from the cached operation (if available, else fetches from remote)
    func reload() {
        Task { @MainActor in
            await [
                dependencies
                    .cuisineManager
                    .reload(),
                dependencies
                    .foodRestrictionManager
                    .reload(),
                dependencies
                    .mealTypeManager
                    .reload(),
                dependencies
                    .majorCityManager
                    .reload()
            ]
        }
    }
    
    /// Resets all static asset managers without resetting the entire static asset domain's state
    func resetAll() {
        dependencies
            .cuisineManager
            .reset()
        
        dependencies
            .foodRestrictionManager
            .reset()
        
        dependencies
            .mealTypeManager
            .reset()
        
        dependencies
            .majorCityManager
            .reset()
    }
    
    /// Resets the current state of the static asset domain to its initial state
    func clearStaticAssetDomain() {
        staticAssetActionDispatcher.clear()
    }
}
