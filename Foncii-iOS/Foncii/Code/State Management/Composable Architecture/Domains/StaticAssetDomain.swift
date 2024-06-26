//
// StaticAssetDomain.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 6:24 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import OrderedCollections

struct StaticAssetDomain: ComposedDomain {
    // MARK: - Initial State
    var initialState: State = .init()
    
    struct State: Equatable {
        // Static Asset Collections
        var cuisines: OrderedSet<Cuisine> = []
        var foodRestrictions: OrderedSet<FoodRestriction> = []
        var mealTypes: OrderedSet<MealType> = []
        var majorCities: OrderedSet<MajorCity> = []
        
        // Loading States
        var cuisineManagerCurrentActivity: StaticAssetManagerActivityStates = .waiting
        var foodRestrictionManagerCurrentActivity: StaticAssetManagerActivityStates = .waiting
        var mealTypeManagerCurrentActivity: StaticAssetManagerActivityStates = .waiting
        var majorCityManagerCurrentActivity: StaticAssetManagerActivityStates = .waiting
        
        // Activity States for Static Asset Managers
        enum StaticAssetManagerActivityStates: String, CaseIterable {
            case waiting
            case loading
            case done
            case failed
        }
    }
    
    // MARK: - Actions To Reduce
    enum Action: Equatable {
        // Set
        case setCuisines(cuisines: [Cuisine])
        case setFoodRestrictions(foodRestrictions: [FoodRestriction])
        case setMealTypes(mealTypes: [MealType])
        case setMajorCities(majorCities: [MajorCity])
        
        // Update
        case updateCuisineManagerActivity(activity: StaticAssetDomain.State.StaticAssetManagerActivityStates)
        case updateFoodRestrictionManagerActivity(activity: StaticAssetDomain.State.StaticAssetManagerActivityStates)
        case updateMealTypeManagerActivity(activity: StaticAssetDomain.State.StaticAssetManagerActivityStates)
        case updateMajorCityManagerActivity(activity: StaticAssetDomain.State.StaticAssetManagerActivityStates)
        
        // Reset
        case resetCuisineManager
        case resetFoodRestrictionManager
        case resetMealTypeManager
        case resetMajorCityManager
        
        // State Management
        case clear
    }
    
    func reduce(
        into state: inout State,
        action: Action
    ) -> EffectTask<Action> {
        switch action {
            // Set
        case .setCuisines(cuisines: let cuisines):
            state.cuisines = OrderedSet(cuisines)
            
            return .none
        case .setFoodRestrictions(foodRestrictions: let foodRestrictions):
            state.foodRestrictions = OrderedSet(foodRestrictions)

            return .none
        case .setMealTypes(mealTypes: let mealTypes):
            state.mealTypes = OrderedSet(mealTypes)
            
            return .none
        case .setMajorCities(majorCities: let majorCities):
            state.majorCities = OrderedSet(majorCities)

            return .none
            
            // Update
        case .updateCuisineManagerActivity(activity: let activity):
            state.cuisineManagerCurrentActivity = activity
            
            return .none
        case .updateFoodRestrictionManagerActivity(activity: let activity):
            state.cuisineManagerCurrentActivity = activity
            
            return .none
        case .updateMealTypeManagerActivity(activity: let activity):
            state.mealTypeManagerCurrentActivity = activity
            
            return .none
        case .updateMajorCityManagerActivity(activity: let activity):
            state.cuisineManagerCurrentActivity = activity
            
            return .none
            
            // Reset
        case .resetCuisineManager:
            state.cuisines = initialState.cuisines
            state.cuisineManagerCurrentActivity = initialState.cuisineManagerCurrentActivity
            
            return .none
        case .resetFoodRestrictionManager:
            state.foodRestrictions = initialState.foodRestrictions
            state.foodRestrictionManagerCurrentActivity = initialState.foodRestrictionManagerCurrentActivity
            
            return .none
        case .resetMealTypeManager:
            state.mealTypes = initialState.mealTypes
            state.mealTypeManagerCurrentActivity = initialState.mealTypeManagerCurrentActivity
            
            return .none
        case .resetMajorCityManager:
            state.majorCities = initialState.majorCities
            state.majorCityManagerCurrentActivity = initialState.majorCityManagerCurrentActivity
            
            return .none
        
            // Clear
        case .clear:
            state = initialState
            
            return .none
        }
    }
}


