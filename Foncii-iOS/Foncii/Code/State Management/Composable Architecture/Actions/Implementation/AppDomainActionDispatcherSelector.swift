//
// AppDomainActionDispatcherSelector.swift
// Foncii
//
// Created by Justin Cook on 6/3/23 at 9:05 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import CoreLocation
import Foundation

/**
 * An encapsulating instance that enables the simple selection of redux
 * action selectors encapsulated by the central App Domain instance, via
 * key path handling
 */
class AppDomainActionDispatcherSelector {
    subscript<T: AppDomainActionDispatcher>(keyPath: KeyPath<AppDomainActionDispatcherSelector, T>) -> T {
        return self[keyPath: keyPath]
    }
}

// MARK: - App Domain Action Dispatcher Definitions
// MARK: - Client Domain Actions
extension AppDomainActionDispatcherSelector {
    public var clientActionDispatcher: ClientActionDispatcher {
        return .init()
    }
    
    struct ClientActionDispatcher: AppDomainActionDispatcher {
        // MARK: - Properties
        typealias Domain = ClientDomain
        
        // MARK: - Action Composition
        func composeAppDomainAction(
            from scopedDomainAction: Domain.Action
        ) -> AppDomain.Action {
            return AppDomain
                .Action
                .clientAction(scopedDomainAction)
        }
        
        // MARK: - Actions
        // Networking 
        func setClientInternetStatus(isClientOnline: Bool) {
            dispatchAction(action: composeAppDomainAction(from: .setClientInternetStatus(isClientOnline: isClientOnline)))
        }
        
        // Location
        func setCurrentClientLocation(location: CLLocation) {
            dispatchAction(action: composeAppDomainAction(from: .setCurrentClientLocation(location: location)))
        }
        
        func resetCurrentClientLocation(location: CLLocation) {
            dispatchAction(action: composeAppDomainAction(from: .setCurrentClientLocation(location: location)))
        }
        
        func setUsingVirtualLocation(usingVirtualLocation: Bool) {
            dispatchAction(action: composeAppDomainAction(from: .setUsingVirtualLocation(usingVirtualLocation: usingVirtualLocation)))
        }
        
        // State Management
        func clear() {
            dispatchAction(action: composeAppDomainAction(from: .clear))
        }
    }
}

// MARK: - Home Screen Domain Actions
extension AppDomainActionDispatcherSelector {
    public var homeScreenActionDispatcher: HomeScreenActionDispatcher {
        return .init()
    }

    struct HomeScreenActionDispatcher: AppDomainActionDispatcher {
        // MARK: - Properties
        typealias Domain = HomeScreenDomain
        
        // MARK: - Action Composition
        func composeAppDomainAction(
            from scopedDomainAction: Domain.Action
        ) -> AppDomain.Action {
            return AppDomain
                .Action
                .homeScreenAction(scopedDomainAction)
        }
        
        // MARK: - Actions
        func selectTab(tab: HomeScreenDomain.State.HomeScreenTabs) {
            dispatchAction(action: composeAppDomainAction(from: .selectTab(tab: tab)))
        }
        
        func switchToActivity(activity: HomeScreenDomain.State.ActivityStates) {
            dispatchAction(action: composeAppDomainAction(from: .switchToActivity(activity: activity)))
        }
    }
}


// MARK: - Profile Screen Domain Actions
extension AppDomainActionDispatcherSelector {
    public var profileScreenActionDispatcher: ProfileScreenActionDispatcher {
        return .init()
    }

    struct ProfileScreenActionDispatcher: AppDomainActionDispatcher {
        // MARK: - Properties
        typealias Domain = ProfileScreenDomain
        
        // MARK: - Action Composition
        func composeAppDomainAction(
            from scopedDomainAction: Domain.Action
        ) -> AppDomain.Action {
            return AppDomain
                .Action
                .profileScreenAction(scopedDomainAction)
        }
        
        // MARK: - Actions
        func selectTab(tab: ProfileScreenDomain.State.ProfileScreenTabs) {
            dispatchAction(action: composeAppDomainAction(from: .selectTab(tab: tab)))
        }
        
        func switchToActivity(activity: ProfileScreenDomain.State.ActivityStates) {
            dispatchAction(action: composeAppDomainAction(from: .switchToActivity(activity: activity)))
        }
    }
}

// MARK: - Restaurant Domain Actions
extension AppDomainActionDispatcherSelector {
    public var restaurantActionDispatcher: RestaurantActionDispatcher {
        return .init()
    }

    struct RestaurantActionDispatcher: AppDomainActionDispatcher {
        // MARK: - Properties
        typealias Domain = RestaurantDomain
        
        // MARK: - Action Composition
        func composeAppDomainAction(
            from scopedDomainAction: Domain.Action
        ) -> AppDomain.Action {
            return AppDomain
                .Action
                .restaurantAction(scopedDomainAction)
        }
        
        // MARK: - Actions
        // Restaurant Manager Activities
        func setDiscoveryRestaurantFeedActivity(currentActivity: RestaurantDomain.State.RestaurantManagerActivityStates) {
            dispatchAction(action: composeAppDomainAction(from:(.setDiscoveryRestaurantFeedActivity(currentActivity: currentActivity))))
        }
        
        func setHomeFeedActivity(currentActivity: RestaurantDomain.State.RestaurantManagerActivityStates) {
            dispatchAction(action: composeAppDomainAction(from:(.setHomeFeedActivity(currentActivity: currentActivity))))
        }
        
        func setFavoritedRestaurantFeedActivity(currentActivity: RestaurantDomain.State.RestaurantManagerActivityStates) {
            dispatchAction(action: composeAppDomainAction(from:(.setFavoritedRestaurantFeedActivity(currentActivity: currentActivity))))
        }
        
        // Initial Loading
        func setLoadedInitialDiscoveryFeedRestaurants(loaded: Bool) {
            dispatchAction(action: composeAppDomainAction(from:(.setLoadedInitialDiscoveryFeedRestaurants(loaded: loaded))))
        }
        
        func setLoadedInitialHomeFeedRestaurants(loaded: Bool) {
            dispatchAction(action: composeAppDomainAction(from:(.setLoadedInitialHomeFeedRestaurants(loaded: loaded))))
        }
        
        func setLoadedInitialFavoritedRestaurantFeedRestaurants(loaded: Bool) {
            dispatchAction(action: composeAppDomainAction(from:(.setLoadedInitialFavoritedRestaurantFeedRestaurants(loaded: loaded))))
        }
        
        // Personalization Tracking
        func setHomeFeedQueryID(queryID: String) {
            dispatchAction(action: composeAppDomainAction(from:(.setHomeFeedQueryID(queryID: queryID))))
        }
        
        func resetHomeFeedQueryID() {
            dispatchAction(action: composeAppDomainAction(from:.resetHomeFeedQueryID))
        }
        
        // Discovery Restaurants
        func setDiscoveryRestaurants(restaurants: [DiscoveryRestaurant]) {
            dispatchAction(action: composeAppDomainAction(from: .setDiscoveryRestaurants(restaurants: restaurants)))
        }
        
        func insertDiscoveryRestaurants(restaurants: [DiscoveryRestaurant]) {
            dispatchAction(action: composeAppDomainAction(from: .insertDiscoveryRestaurants(restaurants: restaurants)))
        }
        
        func removeAllDiscoveryRestaurants() {
            dispatchAction(action: composeAppDomainAction(from:.removeAllDiscoveryRestaurants))
        }
        
        func selectDiscoveryRestaurant(selectedRestaurant: DiscoveryRestaurant) {
            dispatchAction(action: composeAppDomainAction(from: .selectDiscoveryRestaurant(selectedRestaurant: selectedRestaurant)))
        }
        
        func deselectDiscoveryRestaurant(restaurant: DiscoveryRestaurant) {
            dispatchAction(action: composeAppDomainAction(from: .deselectDiscoveryRestaurant(restaurant: restaurant)))
        }
        
        func removeAllSelectedDiscoveryRestaurants() {
            dispatchAction(action: composeAppDomainAction(from:.removeAllSelectedDiscoveryRestaurants))
        }
        
        // Home Feed Restaurants
        func setHomeFeedRestaurants(restaurants: [PersonalizedRestaurantSearchResult]) {
            dispatchAction(action: composeAppDomainAction(from: .setHomeFeedRestaurants(restaurants: restaurants)))
            
            sortHomeFeedRestaurants()
        }
        
        /// Inserts and sorts all home feed restaurants
        func insertHomeFeedRestaurants(restaurants: [PersonalizedRestaurantSearchResult]) {
            dispatchAction(action: composeAppDomainAction(from: .insertHomeFeedRestaurants(restaurants: restaurants)))
            
            sortHomeFeedRestaurants()
        }
        
        func removeAllHomeFeedRestaurants() {
            dispatchAction(action: composeAppDomainAction(from: .removeAllHomeFeedRestaurants))
        }
        
        func sortHomeFeedRestaurants() {
            dispatchAction(action: composeAppDomainAction(from: .sortHomeFeedRestaurants))
        }
        
        func updateHomeFeedRestaurant(updatedRestaurant: PersonalizedRestaurantSearchResult) {
            dispatchAction(action: composeAppDomainAction(from: .updateHomeFeedRestaurant(updatedRestaurant: updatedRestaurant)))
            
            sortHomeFeedRestaurants()
        }
        
        // Favorited Restaurants
        func setFavoritedRestaurants(restaurants: [FavoritedRestaurant]) {
            dispatchAction(action: composeAppDomainAction(from: .setFavoritedRestaurants(restaurants: restaurants)))
        }
        
        func insertFavoritedRestaurants(restaurants: [FavoritedRestaurant]) {
            dispatchAction(action: composeAppDomainAction(from: .insertFavoritedRestaurants(restaurants: restaurants)))
        }
        
        func removeAllFavoritedRestaurants() {
            dispatchAction(action: composeAppDomainAction(from: .removeAllFavoritedRestaurants))
        }
        
        func removeFavoritedRestaurant(restaurant: FavoritedRestaurant) {
            dispatchAction(action: composeAppDomainAction(from: .removeFavoritedRestaurant(restaurant: restaurant)))
        }
        
        // Searching
        func setDiscoveryRestaurantsSearchQuery(searchQuery: String) {
            dispatchAction(action: composeAppDomainAction(from: .setDiscoveryRestaurantsSearchQuery(searchQuery: searchQuery)))
        }
        
        func setHomeFeedRestaurantsSearchQuery(searchQuery: String) {
            dispatchAction(action: composeAppDomainAction(from: .setHomeFeedRestaurantsSearchQuery(searchQuery: searchQuery)))
        }
        
        // Pagination
        // Cursor
        func setFavoritedRestaurantsPaginationCursor(paginationCursor: String?) {
            dispatchAction(action: composeAppDomainAction(from: .setFavoritedRestaurantsPaginationCursor(paginationCursor: paginationCursor)))
        }
        
        // Index
        func setDiscoveryRestaurantsPaginationIndex(paginationIndex: Int) {
            dispatchAction(action: composeAppDomainAction(from: .setDiscoveryRestaurantsPaginationIndex(paginationIndex: paginationIndex)))
        }
        
        func setHomeFeedRestaurantsPaginationIndex(paginationIndex: Int) {
            dispatchAction(action: composeAppDomainAction(from: .setHomeFeedRestaurantsPaginationIndex(paginationIndex: paginationIndex)))
        }
        
        func setFavoritedRestaurantsPaginationIndex(paginationIndex: Int) {
            dispatchAction(action: composeAppDomainAction(from: .setFavoritedRestaurantsPaginationIndex(paginationIndex: paginationIndex)))
        }
        
        // Reservation Date Filter
        func setReservationDateFilter(targetReservationDate: Date) {
            dispatchAction(action: composeAppDomainAction(from: .setReservationDateFilter(targetReservationDate: targetReservationDate)))
            
            dispatchAction(action: composeAppDomainAction(from:.setReservationDateFilter(targetReservationDate: targetReservationDate)))
        }
        
        func resetReservationDateFilter() {
            dispatchAction(action: composeAppDomainAction(from:(.resetReservationDateFilter)))
        }
        
        // Search Location Filter
        func setSearchLocationFilter(targetSearchArea: CLLocation) {
            dispatchAction(action: composeAppDomainAction(from:(.setSearchLocationFilter(targetSearchArea: targetSearchArea))))
        }
        
        func resetSearchLocationFilter() {
            dispatchAction(action: composeAppDomainAction(from:(.resetSearchLocationFilter)))
        }
        
        // Favorited Restaurant Filters
        func addFavoriteRestaurantLocationFilter(locationFilterString: String) {
            dispatchAction(action: composeAppDomainAction(from:(.addFavoriteRestaurantLocationFilter(locationFilterString: locationFilterString))))
        }
        
        func removeFavoritedRestaurantsLocationFilter(locationFilterString: String) {
            dispatchAction(action: composeAppDomainAction(from:(.removeFavoritedRestaurantsLocationFilter(locationFilterString: locationFilterString))))
        }
        
        func resetFavoritedRestaurantsLocationFilter() {
            dispatchAction(action: composeAppDomainAction(from:(.resetFavoritedRestaurantsLocationFilters)))
        }
        
        // Recommended Restaurant Filters
        func addRecommendedRestaurantsLocationFilter(locationFilterString: String) {
            dispatchAction(action: composeAppDomainAction(from:(.addRecommendedRestaurantsLocationFilter(locationFilterString: locationFilterString))))
        }
        
        func removeRecommendedRestaurantsLocationFilter(locationFilterString: String) {
            dispatchAction(action: composeAppDomainAction(from:(.removeRecommendedRestaurantsLocationFilter(locationFilterString: locationFilterString))))
        }
        
        func resetRecommendedRestaurantsLocationFilter() {
            dispatchAction(action: composeAppDomainAction(from:(.resetRecommendedRestaurantsLocationFilters)))
        }
        
        // Meal Type Filter
        func selectMealTypeFilter(selectedMealType: MealType) {
            dispatchAction(action: composeAppDomainAction(from: .selectMealTypeFilter(selectedMealType: selectedMealType)))
        }
        
        func deselectMealTypeFilter(mealType: MealType) {
            dispatchAction(action: composeAppDomainAction(from: .deselectMealTypeFilter(mealType: mealType)))
        }
   
        func clearMealTypeFilters() {
            dispatchAction(action: composeAppDomainAction(from: .clearMealTypeFilters))
        }
        
        // Filter Updates
        func setNewFilterUpdatesCommitted(newUpdatesCommitted: Bool) {
            dispatchAction(action: composeAppDomainAction(from: .setNewFilterUpdatesCommitted(newUpdatesCommitted: newUpdatesCommitted)))
        }
        
        // State Management
        func clear() {
            dispatchAction(action: composeAppDomainAction(from: .clear))
        }
    }
}

// MARK: - Static Asset Domain Actions
extension AppDomainActionDispatcherSelector {
    public var staticAssetActionDispatcher: StaticAssetActionDispatcher {
        return .init()
    }
    
    struct StaticAssetActionDispatcher: AppDomainActionDispatcher {
        // MARK: - Properties
        typealias Domain = StaticAssetDomain

        // MARK: - Action Composition
        func composeAppDomainAction(
            from scopedDomainAction: Domain.Action
        ) -> AppDomain.Action {
            return AppDomain
                .Action
                .staticAssetAction(scopedDomainAction)
        }
        
        // MARK: - Actions
        // Set
        func setCuisines(cuisines: [Cuisine]) {
            dispatchAction(action: composeAppDomainAction(from:
                    .setCuisines(cuisines: cuisines)))
        }
        
        func setFoodRestrictions(foodRestrictions: [FoodRestriction]) {
            dispatchAction(action: composeAppDomainAction(from:
                    .setFoodRestrictions(foodRestrictions: foodRestrictions)))
        }
        
        func setMealTypes(mealTypes: [MealType]) {
            dispatchAction(action: composeAppDomainAction(from:
                    .setMealTypes(mealTypes: mealTypes)))
        }
        
        func setMajorCities(majorCities: [MajorCity]) {
            dispatchAction(action: composeAppDomainAction(from:
                    .setMajorCities(majorCities: majorCities)))
        }
        
        // Update
        func updateCuisineManagerActivity(activity: StaticAssetDomain.State.StaticAssetManagerActivityStates) {
            dispatchAction(action: composeAppDomainAction(from:
                    .updateCuisineManagerActivity(activity: activity)))
        }
        
        func updateFoodRestrictionManagerActivity(activity: StaticAssetDomain.State.StaticAssetManagerActivityStates) {
            dispatchAction(action: composeAppDomainAction(from:
                    .updateFoodRestrictionManagerActivity(activity: activity)))
        }
        
        func updateMealTypeManagerActivity(activity: StaticAssetDomain.State.StaticAssetManagerActivityStates) {
            dispatchAction(action: composeAppDomainAction(from:
                    .updateMealTypeManagerActivity(activity: activity)))
        }
        
        func updateMajorCityManagerActivity(activity: StaticAssetDomain.State.StaticAssetManagerActivityStates) {
            dispatchAction(action: composeAppDomainAction(from:
                    .updateMajorCityManagerActivity(activity: activity)))
        }
        
        // Reset
        func resetCuisineManager() {
            dispatchAction(action: composeAppDomainAction(from:
                    .resetCuisineManager))
        }
        
        func resetFoodRestrictionManager() {
            dispatchAction(action: composeAppDomainAction(from:
                    .resetFoodRestrictionManager))
        }
        
        func resetMealTypeManager() {
            dispatchAction(action: composeAppDomainAction(from:
                    .resetMealTypeManager))
        }
        
        func resetMajorCityManager() {
            dispatchAction(action: composeAppDomainAction(from:
                    .resetMajorCityManager))
        }
        
        // State Management
        func clear() {
            dispatchAction(action: composeAppDomainAction(from: .clear))
        }
    }
}
