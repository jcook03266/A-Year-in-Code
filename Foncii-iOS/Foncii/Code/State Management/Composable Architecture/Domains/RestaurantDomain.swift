//
// RestaurantDomain.swift
// Foncii
//
// Created by Justin Cook on 5/31/23 at 5:23 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import Foundation
import CoreLocation
import OrderedCollections

struct RestaurantDomain: ComposedDomain {
    // MARK: - Initial State
    var initialState: State = .init()
    
    struct State: Equatable {
        // Activity States Across Managers
        var currentActivity: ActivityStates = .idle
        
        // Restaurant Manager Activities
        var discoveryRestaurantFeedManagerCurrentActivity: RestaurantManagerActivityStates = .idle
        var homeFeedManagerCurrentActivity: RestaurantManagerActivityStates = .idle
        var favoriteRestaurantFeedManagerCurrentActivity: RestaurantManagerActivityStates = .idle
        
        // Restaurant Collections
        var discoveryRestaurants: OrderedSet<DiscoveryRestaurant> = []
        var homeFeedRestaurants: OrderedSet<PersonalizedRestaurantSearchResult> = []
        var favoritedRestaurants: OrderedSet<FavoritedRestaurant> = []
        
        // Initial Loading
        var loadedInitialDiscoveryFeedRestaurants: Bool = false
        var loadedInitialHomeFeedRestaurants: Bool = false
        var loadedInitialFavoritedRestaurants: Bool = false
        
        // Personalization Tracking
        var homeFeedQueryID: String? = nil
        
        // Discovery Restaurant Selection
        var selectedDiscoveryRestaurants: OrderedSet<DiscoveryRestaurant> = []
        
        // Searching
        var discoveryRestaurantsSearchQuery: String = ""
        var mapRestaurantsSearchQuery: String = ""
        var homeFeedRestaurantsSearchQuery: String = ""
        
        // Pagination
        // Cursor
        var favoritedRestaurantsPaginationCursor: String? = nil
        
        // Index
        var discoveryRestaurantsPaginationIndex: Int = 0
        var mapRestaurantsPaginationIndex: Int = 0
        var homeFeedRestaurantsPaginationIndex: Int = 0
        var trendingFeedRestaurantsPaginationIndex: Int = 0
        var favoritedRestaurantsPaginationIndex: Int = 0
        var recommendedRestaurantsPaginationIndex: Int = 0
        
        // Reservation date and location filter search parameters
        var reservationDateFilter: Date = .now
        var searchLocationFilter: CLLocation? = nil
        
        // Trending Feed Restaurants
        
        
        // Favorited Restaurant Filters
        var favoritedRestaurantsLocationFilters: OrderedSet<String> = []
        
        // Recommended Restaurant Filters
        var recommendedRestaurantsLocationFilters: OrderedSet<String> = []
        
        // Filtering
        var selectedMealTypeFilters: Set<MealType> = []
        var newFilterUpdatesCommitted: Bool = false
        
        /// An enum describing the various possible activities performed by this instance during different states
        enum ActivityStates: String, CaseIterable {
            case idle
            case searching
        }
        
        enum RestaurantManagerActivityStates: String, CaseIterable {
            case idle
            case searching
            case loading
            case reloading
            case resetting
            case filtering
            case updating
            case paginating
            case loadFailed
            case updatesPending // For signaling different screens to update from another screen
        }
    }
    
    // MARK: - Actions To Reduce
    enum Action: Equatable {
        // Restaurant Manager Activities
        case setDiscoveryRestaurantFeedActivity(currentActivity: RestaurantDomain.State.RestaurantManagerActivityStates)
        case setHomeFeedActivity(currentActivity: RestaurantDomain.State.RestaurantManagerActivityStates)
        case setFavoritedRestaurantFeedActivity(currentActivity: RestaurantDomain.State.RestaurantManagerActivityStates)
        
        // Initial Loading
        case setLoadedInitialDiscoveryFeedRestaurants(loaded: Bool)
        case setLoadedInitialHomeFeedRestaurants(loaded: Bool)
        case setLoadedInitialFavoritedRestaurantFeedRestaurants(loaded: Bool)
        
        // Personalization Tracking
        case setHomeFeedQueryID(queryID: String)
        case resetHomeFeedQueryID
        
        // Discovery Restaurants
        case setDiscoveryRestaurants(restaurants: [DiscoveryRestaurant])
        case insertDiscoveryRestaurants(restaurants: [DiscoveryRestaurant])
        case removeAllDiscoveryRestaurants
        
        case selectDiscoveryRestaurant(selectedRestaurant: DiscoveryRestaurant)
        case deselectDiscoveryRestaurant(restaurant: DiscoveryRestaurant)
        case removeAllSelectedDiscoveryRestaurants
        
        // Map Restaurants
        
        
        // Home Feed Restaurants
        case setHomeFeedRestaurants(restaurants: [PersonalizedRestaurantSearchResult])
        case insertHomeFeedRestaurants(restaurants: [PersonalizedRestaurantSearchResult])
        case removeAllHomeFeedRestaurants
        case sortHomeFeedRestaurants
        case updateHomeFeedRestaurant(updatedRestaurant: PersonalizedRestaurantSearchResult)
        
        // Trending Feed Restaurants
        
        
        // Favorited Restaurants
        case setFavoritedRestaurants(restaurants: [FavoritedRestaurant])
        case insertFavoritedRestaurants(restaurants: [FavoritedRestaurant])
        case removeAllFavoritedRestaurants
        case removeFavoritedRestaurant(restaurant: FavoritedRestaurant)
        
        // Recommended Restaurants
        
        
        // Searching
        case setDiscoveryRestaurantsSearchQuery(searchQuery: String)
        case setHomeFeedRestaurantsSearchQuery(searchQuery: String)
        
        // Pagination
        // Cursor
        case setFavoritedRestaurantsPaginationCursor(paginationCursor: String?)
        
        // Index
        case setDiscoveryRestaurantsPaginationIndex(paginationIndex: Int)
        case setHomeFeedRestaurantsPaginationIndex(paginationIndex: Int)
        case setFavoritedRestaurantsPaginationIndex(paginationIndex: Int)
        
        // Target Reservation Date Filter
        case setReservationDateFilter(targetReservationDate: Date)
        case resetReservationDateFilter
        
        // Client Virtual Search Location Filter
        case setSearchLocationFilter(targetSearchArea: CLLocation)
        case resetSearchLocationFilter
        
        // Favorited Restaurant Filters
        case addFavoriteRestaurantLocationFilter(locationFilterString: String)
        case removeFavoritedRestaurantsLocationFilter(locationFilterString: String)
        case resetFavoritedRestaurantsLocationFilters
        
        // Recommended Restaurant Filters
        case addRecommendedRestaurantsLocationFilter(locationFilterString: String)
        case removeRecommendedRestaurantsLocationFilter(locationFilterString: String)
        case resetRecommendedRestaurantsLocationFilters
        
        // Meal Type Filter
        case selectMealTypeFilter(selectedMealType: MealType)
        case deselectMealTypeFilter(mealType: MealType)
        case clearMealTypeFilters
        
        // Filter Updates
        case setNewFilterUpdatesCommitted(newUpdatesCommitted: Bool)
        
        // State Management
        case clear
    }
    
    func reduce(
        into state: inout State,
        action: Action
    ) -> EffectTask<Action> {
        switch action {
            // Restaurant Manager Activities
        case .setDiscoveryRestaurantFeedActivity(currentActivity: let currentActivity):
            state.discoveryRestaurantFeedManagerCurrentActivity = currentActivity
            
            return .none
        case .setHomeFeedActivity(currentActivity: let currentActivity):
            state.homeFeedManagerCurrentActivity = currentActivity
            
            return .none
            
        case .setFavoritedRestaurantFeedActivity(currentActivity: let currentActivity):
            state.favoriteRestaurantFeedManagerCurrentActivity = currentActivity
            
            return .none
            
            // Initial Loading
        case .setLoadedInitialDiscoveryFeedRestaurants(loaded: let loaded):
            state.loadedInitialDiscoveryFeedRestaurants = loaded
            
            return .none
        case .setLoadedInitialHomeFeedRestaurants(loaded: let loaded):
            state.loadedInitialHomeFeedRestaurants = loaded
            
            return .none
        case .setLoadedInitialFavoritedRestaurantFeedRestaurants(loaded: let loaded):
            state.loadedInitialFavoritedRestaurants = loaded
            
            return .none
            
            // Personalization Tracking
        case .setHomeFeedQueryID(queryID: let queryID):
            state.homeFeedQueryID = queryID
            
            return .none
        case .resetHomeFeedQueryID:
            state.homeFeedQueryID = nil
            
            return .none
            
            // Discovery Restaurants
        case .setDiscoveryRestaurants(restaurants: let restaurants):
            state.discoveryRestaurants = OrderedSet(restaurants)
            
            return .none
        case .insertDiscoveryRestaurants(restaurants: let restaurants):
            state.discoveryRestaurants.append(contentsOf: restaurants)
            
            return .none
        case .removeAllDiscoveryRestaurants:
            state.discoveryRestaurants
                .removeAll()
            
            return .none
        case .selectDiscoveryRestaurant(selectedRestaurant: let selectedRestaurant):
            state.selectedDiscoveryRestaurants
                .append(selectedRestaurant)
            
            return .none
        case .deselectDiscoveryRestaurant(restaurant: let restaurant):
            state.selectedDiscoveryRestaurants
                .remove(restaurant)
            
            return .none
        case .removeAllSelectedDiscoveryRestaurants:
            state.selectedDiscoveryRestaurants
                .removeAll()
            
            return .none
            
            // Home Feed Restaurants
        case .setHomeFeedRestaurants(restaurants: let restaurants):
            state.homeFeedRestaurants = OrderedSet(restaurants)
            
            return .none
        case .insertHomeFeedRestaurants(restaurants: let restaurants):
            state.homeFeedRestaurants.append(contentsOf: restaurants)
            
            return .none
        case .removeAllHomeFeedRestaurants:
            state.homeFeedRestaurants
                .removeAll()
            
            return .none
        case .sortHomeFeedRestaurants:
            /// Sorts home feed restaurants by percent match
            /// and favorited status
            state.homeFeedRestaurants
                .sort {
                    let percentMatch1 = $0.percentMatch ?? 0,
                        percentMatch2 = $1.percentMatch ?? 0,
                        isFavorited1 = $0.isFavorited ?? false,
                        isFavorited2 = $1.isFavorited ?? false
                    
                    let percentMatchDescending = percentMatch1 > percentMatch2
                    
                    /// Tie breaker is the favorited status, with favorited posts taking
                    /// priority over non-favorited
                    if percentMatch1 == percentMatch2 {
                        return isFavorited1 && !isFavorited2
                    }
                    
                    return percentMatchDescending
                }
            
            return .none
            
        case .updateHomeFeedRestaurant(updatedRestaurant: let updatedRestaurant):
            var homeFeedRestaurants = state.homeFeedRestaurants
            
            homeFeedRestaurants.removeAll {
                $0.restaurant.id == updatedRestaurant.restaurant.id
            }
            
            homeFeedRestaurants.append(updatedRestaurant)
            
            state.homeFeedRestaurants = homeFeedRestaurants
            
            return .none
            
            // Favorited Restaurants
        case .setFavoritedRestaurants(restaurants: let restaurants):
            state.favoritedRestaurants = OrderedSet(restaurants)
            
            return .none
        case .insertFavoritedRestaurants(restaurants: let restaurants):
            state.favoritedRestaurants.append(contentsOf: restaurants)
            
            return .none
        case .removeAllFavoritedRestaurants:
            state.favoritedRestaurants
                .removeAll()
            
            return .none
        case .removeFavoritedRestaurant(restaurant: let restaurant):
                var favoritedRestaurants = state.favoritedRestaurants
                
                favoritedRestaurants.removeAll {
                    $0.id == restaurant.id
                }
                                
                state.favoritedRestaurants = favoritedRestaurants
                
                return .none
            
            // Searching
        case .setDiscoveryRestaurantsSearchQuery(searchQuery: let searchQuery):
            state.discoveryRestaurantsSearchQuery = searchQuery
            
            return .none
        case .setHomeFeedRestaurantsSearchQuery(searchQuery: let searchQuery):
            state.homeFeedRestaurantsSearchQuery = searchQuery
            
            return .none
            
            // Pagination
            // Cursor
        case .setFavoritedRestaurantsPaginationCursor(paginationCursor: let paginationCursor):
            state.favoritedRestaurantsPaginationCursor = paginationCursor
            
            return .none
            
            // Index
        case .setDiscoveryRestaurantsPaginationIndex(paginationIndex: let paginationIndex):
            state.discoveryRestaurantsPaginationIndex = paginationIndex
            
            return .none
        case .setHomeFeedRestaurantsPaginationIndex(paginationIndex: let paginationIndex):
            state.homeFeedRestaurantsPaginationIndex = paginationIndex
            
            return .none
        case .setFavoritedRestaurantsPaginationIndex(paginationIndex: let paginationIndex):
            state.favoritedRestaurantsPaginationIndex = paginationIndex
            
            return .none
        
            // Reservation Date Filter
        case .setReservationDateFilter(targetReservationDate: let targetReservationDate):
            state.reservationDateFilter = targetReservationDate
            
            return .none
            
        case .resetReservationDateFilter:
            state.reservationDateFilter = initialState.reservationDateFilter
            
            return .none
            
            // Search Location Filter
        case .setSearchLocationFilter(targetSearchArea: let targetSearchArea):
            state.searchLocationFilter = targetSearchArea
            
            return .none
        case .resetSearchLocationFilter:
            state.searchLocationFilter = initialState.searchLocationFilter
            
            return.none
            
            // Favorited Restaurant Filters
        case .addFavoriteRestaurantLocationFilter(locationFilterString: let locationFilterString):
            state.favoritedRestaurantsLocationFilters
                .append(locationFilterString)
            
            return .none
        case .removeFavoritedRestaurantsLocationFilter(locationFilterString: let locationFilterString):
            state.favoritedRestaurantsLocationFilters
                .remove(locationFilterString)
            
            return .none
        case .resetFavoritedRestaurantsLocationFilters:
            state.favoritedRestaurantsLocationFilters = initialState.recommendedRestaurantsLocationFilters

            return .none
            
            // Recommended Restaurant Filters
        case .addRecommendedRestaurantsLocationFilter(locationFilterString: let locationFilterString):
            state.recommendedRestaurantsLocationFilters
                .append(locationFilterString)
            
            return .none
        case .removeRecommendedRestaurantsLocationFilter(locationFilterString: let locationFilterString):
            state.recommendedRestaurantsLocationFilters
                .remove(locationFilterString)
            
            return .none
        case .resetRecommendedRestaurantsLocationFilters:
            state.recommendedRestaurantsLocationFilters = initialState.recommendedRestaurantsLocationFilters
            
            return .none
            
            // Meal Type Filter
        case .selectMealTypeFilter(selectedMealType: let selectedMealType):
            state.selectedMealTypeFilters
                .insert(selectedMealType)
            
            return .none
        case .deselectMealTypeFilter(mealType: let mealType):
            state.selectedMealTypeFilters
                .remove(mealType)
            
            return .none
        case .clearMealTypeFilters:
            state.selectedMealTypeFilters.removeAll()
            
            return .none
            
        // Filter Updates
        case .setNewFilterUpdatesCommitted(newUpdatesCommitted: let newUpdatesCommitted):
            state.newFilterUpdatesCommitted = newUpdatesCommitted
            
            return .none
            
            // State Management
        case .clear:
            state = initialState
            
            return .none
        }
    }
}

