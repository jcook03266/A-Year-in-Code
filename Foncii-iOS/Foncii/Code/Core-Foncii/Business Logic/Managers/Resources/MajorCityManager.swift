//
// MajorCityManager.swift
// Foncii
//
// Created by Justin Cook on 6/18/23 at 10:10 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import OrderedCollections

class MajorCityManager: StaticAssetManager {
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.staticAssetActionDispatcher) var staticAssetActionDispatcher
    
    // MARK: - Properties
    var currentActivity: StaticAssetDomain.State.StaticAssetManagerActivityStates {
        return AppService
            .shared
            .getCurrentState(of: \.staticAssetState)
            .majorCityManagerCurrentActivity
    }
    
    var majorCities: OrderedSet<MajorCity> {
        return AppService
            .shared
            .getCurrentState(of: \.staticAssetState)
            .majorCities
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let apolloService: GraphQLAPIServiceAdapter = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Singleton
    static let shared: MajorCityManager = .init()
    
    private init() {}
}

// MARK: - Business Logic
extension MajorCityManager {
    @MainActor func fetch() async {
        staticAssetActionDispatcher
            .updateMajorCityManagerActivity(activity: .loading)
        
       let majorCities = await dependencies
            .apolloService
            .performFetchAllMajorCities()
        
        // Fetch failed
        if majorCities.isEmpty {
            staticAssetActionDispatcher
                .updateMajorCityManagerActivity(activity: .failed)
        }
        else {
            // Fetch successful, update store
            staticAssetActionDispatcher
                .updateMajorCityManagerActivity(activity: .done)
            
            staticAssetActionDispatcher
                .setMajorCities(majorCities: majorCities)
        }
    }
    
    /// Reloads from the cache (if any) or if the last fetch failed, fetches from the remote
    /// and provisions the cache that was originally supposed to be fetched from
    @MainActor func reload() async {
       await fetch()
    }
    
    func reset() {
        staticAssetActionDispatcher
            .resetMajorCityManager()
    }
}
