//
// RestaurantManager.swift
// Foncii
//
// Created by Justin Cook on 4/29/23 at 9:13 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Combine
import CoreLocation
import OrderedCollections

/**
 * High-level manager that manages different restaurant data shared across the application
 * ranging from favorited restaurants, to personalized restaurants, to trending
 */
class RestaurantManager {
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.restaurantActionDispatcher) var restaurantActionDispatcher
    
    // MARK: - Singleton
    static let shared: RestaurantManager = .init()
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let networkService: NetworkingService = inject(),
            apolloService: GraphQLAPIServiceAdapter = inject(),
            userManager: UserManager = inject()
        
        lazy var appService: AppService = UserManager.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - User Service Dependencies
    struct UserDependencies: InjectableUserServices {
        let locationManager: LocationServiceManager = inject()
    }
    let userDependencies = UserDependencies()
    
    // MARK: - Convenience
    var apolloService: GraphQLAPIServiceAdapter {
        return dependencies.apolloService
    }
    
    var currentState: RestaurantDomain.State {
        return AppService
            .shared
            .getCurrentState(of: \.restaurantState)
    }
    
    var mostRecentUserCoordinates: CLLocationCoordinate2D? {
        let coordinatePoint = userDependencies
            .locationManager
            .currentCoordinates
        
        return coordinatePoint
    }
    
    // MARK: - Filters
    // Meal Types
    var selectedMealTypeFilters: Set<MealType> {
        return currentState
            .selectedMealTypeFilters
    }
    
    // Cuisine Types
    
    
    // Location
    var currentRestaurantSearchArea: CLLocationCoordinate2D? {
        let coordinatePoint = userDependencies
            .locationManager
            .searchLocationCoordinates
        
        return coordinatePoint
    }
    
    
    private init() {}
}

// MARK: - Subordinate-Manager Defintions and Selection
extension RestaurantManager {
    var discoveryRestaurantManager: DiscoveryRestaurantManager {
        return .shared
    }
    
    var mapRestaurantManager: MapRestaurantManager {
        return .shared
    }
    
    var homeFeedRestaurantManager: HomeFeedRestaurantManager {
        return .shared
    }
    
    var trendingFeedRestaurantManager: TrendingFeedRestaurantManager {
        return .shared
    }
    
    var favoritedRestaurantManager: FavoritedRestaurantManager {
        return .shared
    }
    
    var recommendedRestaurantManager: RecommendedRestaurantManager {
        return .shared
    }
    
    func selectRestaurantManager(_ keyPath: KeyPath<RestaurantManager, AsyncDataManager>) -> AsyncDataManager {
        return self[keyPath: keyPath]
    }
}

// MARK: - Discovery Restaurants - Non-Personalized
extension RestaurantManager {
    class DiscoveryRestaurantManager: AsyncRestaurantManager {
        // MARK: - Redux Actions
        @ActionDispatcherSelector(\.restaurantActionDispatcher) var restaurantActionDispatcher
        
        // MARK: - Singleton
        static let shared: DiscoveryRestaurantManager = .init()
        
        // MARK: - Properties
        var restaurants: OrderedSet<DiscoveryRestaurant> {
            return OrderedSet(currentState.discoveryRestaurants)
        }
        
        var selectedDiscoveryRestaurants: OrderedSet<DiscoveryRestaurant> {
            return currentState
                .selectedDiscoveryRestaurants
        }
        
        var currentActivity: RestaurantDomain.State.RestaurantManagerActivityStates {
            return currentState
                .discoveryRestaurantFeedManagerCurrentActivity
        }
        
        var currentSearchQuery: String {
            return currentState
                .discoveryRestaurantsSearchQuery
        }
        
        var currentPaginationIndex: Int {
            return currentState
                .discoveryRestaurantsPaginationIndex
        }
        
        var canPaginate: Bool {
            return currentPaginationIndex < maxPaginationIndex && !isAnOperationCurrentlyInProgress &&
            !restaurants.isEmpty &&
            !paginationWallReached &&
            loadedInitialRestaurants
        }
        
        var isAnOperationCurrentlyInProgress: Bool {
            return currentActivity != .idle
        }
        
        var loadedInitialRestaurants: Bool {
            return currentState
                .loadedInitialHomeFeedRestaurants
        }
        
        var currentState: RestaurantDomain.State {
            return RestaurantManager
                .shared
                .currentState
        }
        
        // MARK: - Limits
        // Pagination
        let maxPaginationIndex = 9 // 10 pages total ~ 10 Results each, 100 total
        let expectedRestaurantResultsPerPage = 10
        
        var paginationWallReached: Bool = false // Set to true when the paginated search results returns an empty array (no more search results)
        
        // MARK: - Requirements
        /// Min and max amount of restaurants that the user can select to choose as their first favorite
        let restaurantSelectionLimit = (3, 10)
        
        var canSelectMoreRestaurants: Bool {
            return selectedDiscoveryRestaurants.count < restaurantSelectionLimit.1
        }
        
        private init() {}
        
        // MARK: - Restaurant Selection
        func toggleRestaurantSelection(restaurant: DiscoveryRestaurant) {
            let isSelected = isRestaurantSelected(restaurant: restaurant)
            /// Only toggle this when more restaurants can be selected or
            /// if this model has already been selected and can be unselected to make room for other selections
            if isSelected || canSelectMoreRestaurants
            {
                if !isSelected {
                    restaurantActionDispatcher
                        .selectDiscoveryRestaurant(selectedRestaurant: restaurant)
                }
                else {
                    restaurantActionDispatcher
                        .deselectDiscoveryRestaurant(restaurant: restaurant)
                }
            }
        }
        
        func isRestaurantSelected(restaurant: DiscoveryRestaurant) -> Bool {
            return selectedDiscoveryRestaurants
                .contains { $0.id == restaurant.id }
        }
        
        // MARK: - Search
        @MainActor func fetch() async {
            guard let userCoordinatePoint = RestaurantManager.shared.currentRestaurantSearchArea
            else { return }
            
            // Reset the pagination wall for this new search
            paginationWallReached = false
            
            restaurantActionDispatcher
                .setDiscoveryRestaurantFeedActivity(currentActivity: .loading)
            
            let restaurantSearchResult = await Dependencies().apolloService
                .performOnboardingRestaurantSearch(query: currentSearchQuery,
                                                   latitude: userCoordinatePoint.latitude,
                                                   longitude: userCoordinatePoint.longitude,
                                                   paginationIndex: currentPaginationIndex),
            restaurants = restaurantSearchResult?
                .restaurants?
                .map({ $0.restaurant })
            
            guard let restaurants = restaurants
            else {
                restaurantActionDispatcher
                    .setDiscoveryRestaurantFeedActivity(currentActivity: .loadFailed)
                return
            }
            
            if restaurants.isEmpty { paginationWallReached = true }
            
            restaurantActionDispatcher
                .insertDiscoveryRestaurants(restaurants: restaurants)
            
            restaurantActionDispatcher
                .setDiscoveryRestaurantFeedActivity(currentActivity: .idle)
        }
        
        /// Trigger this function to search for restaurants
        @MainActor func search(searchQuery: String) async {
            guard currentSearchQuery != searchQuery
            else { return }
            
            reset()
            
            restaurantActionDispatcher
                .setDiscoveryRestaurantsSearchQuery(searchQuery: searchQuery)
            
            restaurantActionDispatcher
                .setDiscoveryRestaurantFeedActivity(currentActivity: .searching)
            
            await fetch()
        }
        
        /// Performs the initial search for restaurants to populate the screen
        @MainActor func performInitialSearch() async {
            await search(searchQuery: currentSearchQuery)
            
            restaurantActionDispatcher
                .setLoadedInitialDiscoveryFeedRestaurants(loaded: true)
        }
        
        @MainActor func reload() async {
            reset()
            
            restaurantActionDispatcher
                .setDiscoveryRestaurantFeedActivity(currentActivity: .reloading)
            
            await fetch()
        }
        
        func reset() {
            paginationWallReached = false
            
            restaurantActionDispatcher
                .setDiscoveryRestaurantFeedActivity(currentActivity: .resetting)
            
            restaurantActionDispatcher
                .setDiscoveryRestaurantsPaginationIndex(paginationIndex: 0)
            
            restaurantActionDispatcher
                .removeAllDiscoveryRestaurants()
            
            restaurantActionDispatcher
                .setDiscoveryRestaurantFeedActivity(currentActivity: .idle)
        }
        
        /// Paginates forward by one page
        @MainActor func paginate() async {
            guard canPaginate else { return }
            
            restaurantActionDispatcher
                .setDiscoveryRestaurantsPaginationIndex(paginationIndex: currentPaginationIndex + 1)
            
            await fetch()
        }
    }
}

// MARK: - Discovery Restaurants - Personalized
extension RestaurantManager {
    class MapRestaurantManager: AsyncRestaurantManager {
        // MARK: - Singleton
        static let shared: MapRestaurantManager = .init()
        
        // MARK: - Properties
        var currentSearchQuery: String {
            return ""
        }
        
        private init() {}
        
        @MainActor func fetch() async {}
        
        @MainActor func reload() async {}
        
        @MainActor func search(searchQuery: String) async {}
        
        @MainActor func performInitialSearch() async {}
        
        func reset() {}
    }
}

// MARK: - Home Feed Restaurants - Personalized
extension RestaurantManager {
    class HomeFeedRestaurantManager: AsyncRestaurantManager {
        // MARK: - Redux Actions
        @ActionDispatcherSelector(\.restaurantActionDispatcher) var restaurantActionDispatcher
        
        // MARK: - Singleton
        static let shared: HomeFeedRestaurantManager = .init()
        
        // MARK: - Properties
        var restaurants: OrderedSet<PersonalizedRestaurantSearchResult> {
            return OrderedSet(currentState
                .homeFeedRestaurants
                .prefix(currentTotalPaginatedRestaurants))
        }
        
        var currentActivity: RestaurantDomain.State.RestaurantManagerActivityStates {
            return currentState
                .homeFeedManagerCurrentActivity
        }
        
        var currentSearchQuery: String {
            return currentState
                .homeFeedRestaurantsSearchQuery
        }
        
        var currentPaginationIndex: Int {
            return currentState
                .homeFeedRestaurantsPaginationIndex
        }
        
        var canPaginate: Bool {
            return currentPaginationIndex < maxPaginationIndex && !isAnOperationCurrentlyInProgress &&
            !restaurants.isEmpty &&
            loadedInitialRestaurants
        }
        
        var isAnOperationCurrentlyInProgress: Bool {
            return currentActivity != .idle
        }
        
        var loadedInitialRestaurants: Bool {
            return currentState
                .loadedInitialHomeFeedRestaurants
        }
        
        var currentState: RestaurantDomain.State {
            return RestaurantManager
                .shared
                .currentState
        }
        
        var currentTotalPaginatedRestaurants: Int {
            return expectedRestaurantResultsPerPage * (currentPaginationIndex + 1)
        }
        
        // MARK: - Limits
        // Pagination
        let serverPaginationIndex = 0 // This is the constant index passed to the server to return a collection of data to be paginated locally instead of server-side, meaning top results won't be missing from the partial list of data returned by server side paginaton
        let maxSearchResults = 100 // The amount of hits to display per page from the server, since the pagination index for server requests for this type is held constant, this means that this number is the maximum amount of results to be returned
        
        let maxPaginationIndex = 9 // 10 pages total ~ 10 Results each, 100 total
        let expectedRestaurantResultsPerPage = 10
        
        private init() {}
        
        /**
         * Fetches and appends personalized restaurant data
         * to the restaurant store's state, alongside an associated
         * queryID for tracking personalization conversions
         *
         * Note: Don't call this function directly, use `search` instead
         */
        @MainActor func fetch() async {
            guard let userCoordinatePoint = RestaurantManager.shared.currentRestaurantSearchArea,
                  let userID = Dependencies().userManager.currentUser?.id
            else { return }
            
            // Reset the queryID for this new query
            restaurantActionDispatcher.resetHomeFeedQueryID()
            
            restaurantActionDispatcher
                .setHomeFeedActivity(currentActivity: .loading)
            
            let mealTypeFilters = Array(RestaurantManager.shared.selectedMealTypeFilters),
                restaurantSearchResult = await Dependencies().apolloService
                .performMainRestaurantSearch(userID: userID,
                                             query: currentSearchQuery,
                                             latitude: userCoordinatePoint.latitude,
                                             longitude: userCoordinatePoint.longitude,
                                             paginationIndex: serverPaginationIndex,
                                             hitsPerPage: maxSearchResults,
                                             mealTypes: mealTypeFilters),
            restaurantSearchResults = restaurantSearchResult?.restaurants
            
            guard let restaurantSearchResults = restaurantSearchResults
            else {
                restaurantActionDispatcher
                    .setHomeFeedActivity(currentActivity: .loadFailed)
                return
            }
            
            // Specify the queryID
            if let queryID = restaurantSearchResult?.queryID {
                restaurantActionDispatcher.setHomeFeedQueryID(queryID: queryID)
            }
            
            restaurantActionDispatcher
                .insertHomeFeedRestaurants(restaurants: restaurantSearchResults)
            
            restaurantActionDispatcher
                .setHomeFeedActivity(currentActivity: .idle)
        }
        
        /// Resets the restaurant data and reloads the data from the
        /// last query
        @MainActor func reload() async {
            reset()
            
            restaurantActionDispatcher
                .setHomeFeedActivity(currentActivity: .reloading)
            
            await fetch()
            
            restaurantActionDispatcher
                .sortHomeFeedRestaurants()
        }
        
        /// Resets the stored restaurant data, but not the filters applied to the
        /// search functionality
        func reset() {
            restaurantActionDispatcher
                .setHomeFeedActivity(currentActivity: .resetting)
            
            restaurantActionDispatcher
                .setHomeFeedRestaurantsPaginationIndex(paginationIndex: 0)
            
            restaurantActionDispatcher
                .removeAllHomeFeedRestaurants()
            
            restaurantActionDispatcher
                .setHomeFeedActivity(currentActivity: .idle)
        }
        
        /// Trigger this function to search for restaurants
        @MainActor func search(searchQuery: String) async {
            reset()
            
            restaurantActionDispatcher
                .setHomeFeedRestaurantsSearchQuery(searchQuery: searchQuery)
            
            restaurantActionDispatcher
                .setHomeFeedActivity(currentActivity: .searching)
            
            await fetch()
        }
        
        /// Performs the initial search for restaurants to populate the screen
        /// or refreshes the current search when the user comes back to the
        /// target screen
        @MainActor func performInitialSearch() async {
            await search(searchQuery: currentSearchQuery)
            
            restaurantActionDispatcher
                .setLoadedInitialHomeFeedRestaurants(loaded: true)
        }
        
        /// Paginates forward locally by one page
        @MainActor func paginate() async {
            guard canPaginate else { return }
            
            restaurantActionDispatcher
                .setHomeFeedRestaurantsPaginationIndex(paginationIndex: currentPaginationIndex + 1)
        }
        
        /// Updates a member with the same id as the given restaurant search result (if any)
        func updateRestaurant(updatedRestaurantSearchResult: PersonalizedRestaurantSearchResult) {
            restaurantActionDispatcher
                .setHomeFeedActivity(currentActivity: .updating)
            
            restaurantActionDispatcher
                .updateHomeFeedRestaurant(updatedRestaurant: updatedRestaurantSearchResult)
            
            restaurantActionDispatcher
                .setHomeFeedActivity(currentActivity: .idle)
        }
    }
}

// MARK: - Trending Feed Restaurants - Personalized
extension RestaurantManager {
    class TrendingFeedRestaurantManager: AsyncRestaurantManager {
        // MARK: - Singleton
        static let shared: TrendingFeedRestaurantManager = .init()
        
        // MARK: - Properties
        var currentSearchQuery: String {
            return ""
        }
        
        private init() {}
        
        @MainActor func fetch() async {}
        
        @MainActor func reload() async {}
        
        @MainActor func search(searchQuery: String) async {}
        
        @MainActor func performInitialSearch() async {}
        
        func reset() {}
    }
}

// MARK: - Favorited Restaurants - Personalized
extension RestaurantManager {
    class FavoritedRestaurantManager: AsyncRestaurantManager {
        // MARK: - Redux Actions
        @ActionDispatcherSelector(\.restaurantActionDispatcher) var restaurantActionDispatcher
        
        // MARK: - Singleton
        static let shared: FavoritedRestaurantManager = .init()
        
        // MARK: - Properties
        var restaurants: OrderedSet<FavoritedRestaurant> {
            return currentState.favoritedRestaurants
        }
        
        var currentActivity: RestaurantDomain.State.RestaurantManagerActivityStates {
            return currentState
                .favoriteRestaurantFeedManagerCurrentActivity
        }
        
        /// Note: This is not used to fetch this type of data
        var currentSearchQuery: String {
            return ""
        }
        
        var currentLocationFilters: OrderedSet<String> {
            return currentState
                .favoritedRestaurantsLocationFilters
        }
        
        var currentState: RestaurantDomain.State {
            return RestaurantManager
                .shared
                .currentState
        }
        
        // Pagination
        var currentPaginationIndex: Int {
            return currentState.favoritedRestaurantsPaginationIndex
        }
        
        /// ID of the last element of the current page of results to send to the backend
        /// in order to fetch the elements that follow
        var currentPaginationCursor: String? {
            return currentState.favoritedRestaurantsPaginationCursor
        }
        
        var canPaginate: Bool {
            return currentPaginationIndex < maxPaginationIndex &&
            !isAnOperationCurrentlyInProgress &&
            !restaurants.isEmpty &&
            !paginationWallReached &&
            loadedInitialRestaurants
        }
        
        var isAnOperationCurrentlyInProgress: Bool {
            return currentActivity != .idle
        }
        
        var loadedInitialRestaurants: Bool {
            return currentState
                .loadedInitialFavoritedRestaurants
        }
        
        // MARK: - Limits
        let maxElements = 1000
        let maxPaginationIndex = 99 // 100 pages total ~ 10 Results each, 1000 total
        let paginationPageElementLimit = 10
        
        var paginationWallReached: Bool = false // Set to true when the paginated search results returns an empty array (no more search results)
        
        private init() {}
        
        @MainActor func fetch() async {
            guard let userID = Dependencies().userManager.currentUser?.id
            else { return }
            
            // Reset the pagination wall for this new search
            paginationWallReached = false
            
            restaurantActionDispatcher
                .setFavoritedRestaurantFeedActivity(currentActivity: .loading)

            let favoritedRestaurants = await Dependencies()
                .apolloService
                .performFetchFavoritedRestaurants(
                    userID: userID,
                    paginationLimit: paginationPageElementLimit,
                    paginationCursor: currentPaginationCursor
                )
            
            if favoritedRestaurants.isEmpty { paginationWallReached = true }
            
            restaurantActionDispatcher
                .insertFavoritedRestaurants(restaurants: favoritedRestaurants)

            restaurantActionDispatcher
                .setFavoritedRestaurantFeedActivity(currentActivity: .idle)
        }
        
        @MainActor func reload() async {
            reset()
            
            restaurantActionDispatcher
                .setFavoritedRestaurantFeedActivity(currentActivity: .reloading)
            
            await fetch()
        }
        
        /// Unused
        func search(searchQuery: String) {}
        
        @MainActor func performInitialSearch() async {
            await fetch()
            
            restaurantActionDispatcher
                .setLoadedInitialFavoritedRestaurantFeedRestaurants(loaded: true)
        }
        
        /// Resets the stored restaurant data, but not the filters applied to the
        /// search functionality
        func reset() {
            paginationWallReached = false
            
            restaurantActionDispatcher
                .setFavoritedRestaurantFeedActivity(currentActivity: .resetting)
            
            restaurantActionDispatcher
                .setFavoritedRestaurantsPaginationCursor(paginationCursor: nil)
            
            restaurantActionDispatcher
                .setFavoritedRestaurantsPaginationIndex(paginationIndex: 0)
            
            restaurantActionDispatcher
                .removeAllFavoritedRestaurants()
            
            restaurantActionDispatcher
                .setFavoritedRestaurantFeedActivity(currentActivity: .idle)
        }
        
        /// Paginates forward by one page
        @MainActor func paginate() async {
            guard canPaginate else { return }
            
            restaurantActionDispatcher
                .setFavoritedRestaurantsPaginationIndex(paginationIndex: currentPaginationIndex + 1)
            
            /// Pass the next page to paginate to by using the last element's ID as the cursor to iterate to the next batch of elements with
            let lastElementIDCursor = restaurants.last?.id
            
            restaurantActionDispatcher
                .setFavoritedRestaurantsPaginationCursor(paginationCursor: lastElementIDCursor)
            
            await fetch()
        }
        
        /// Removes a restaurant locally when the user unfavorites one
        /// this allows the user to traverse their favorites and unfavorite restaurants
        /// without having to reload the entire list from scratch
        @MainActor func removeRestaurant(restaurant: FavoritedRestaurant) async {
            restaurantActionDispatcher
                .setFavoritedRestaurantFeedActivity(currentActivity: .updating)
            
            restaurantActionDispatcher
                .removeFavoritedRestaurant(restaurant: restaurant)
            
            restaurantActionDispatcher
                .setFavoritedRestaurantFeedActivity(currentActivity: .idle)
        }
        
        func triggerPendingUpdateStatus() {
            restaurantActionDispatcher
                .setFavoritedRestaurantFeedActivity(currentActivity: .updatesPending)
        }
    }
}

// MARK: - Recommended Restaurants - Personalized
extension RestaurantManager {
    class RecommendedRestaurantManager: AsyncRestaurantManager {
        // MARK: - Singleton
        static let shared: RecommendedRestaurantManager = .init()
        
        // MARK: - Properties
//        var restaurants: OrderedSet<FavoritedRestaurant> {
//            return currentState.favoritedRestaurants
//        }
//
//        var currentActivity: RestaurantDomain.State.RestaurantManagerActivityStates {
//            return currentState
//                .homeFeedManagerCurrentActivity
//        }
        
        /// Note: This is not used to fetch this type of data
        var currentSearchQuery: String {
            return ""
        }
        
        var currentLocationFilters: OrderedSet<String> {
            return currentState
                .recommendedRestaurantsLocationFilters
        }
        
        var currentState: RestaurantDomain.State {
            return RestaurantManager
                .shared
                .currentState
        }
        
        // Pagination
        var currentPaginationIndex: Int {
            return 0
        }
        
        /// ID of the last element of the current page of results to send to the backend
        /// in order to fetch the elements that follow
        var currentPaginationCursor: String? {
            return nil
        }
        
//        var canPaginate: Bool {
//            return currentPaginationIndex < maxPaginationIndex && !isAnOperationCurrentlyInProgress &&
//            !restaurants.isEmpty &&
//            !paginationWallReached &&
//            loadedInitialRestaurants
//        }
        
//        var isAnOperationCurrentlyInProgress: Bool {
//            return currentActivity != .idle
//        }
        
//        var loadedInitialRestaurants: Bool {
//            return currentState
//                .loadedInitialHomeFeedRestaurants
//        }
        
        // MARK: - Limits
        let maxElements = 100
        let maxServerPaginationIndex = 9 // 10 pages total ~ 10 Results each, 100 total
        let paginationPageElementLimit = 10
        
        private init() {}
        
        @MainActor func fetch() async {}
        
        @MainActor func reload() async {}
        
        /// Unused
        func search(searchQuery: String) {}
        
        @MainActor func performInitialSearch() async {}
        
        func reset() {}
    }
}

// Discovery Restaurants
extension RestaurantManager {
    /// Fetches restaurants for the user to choose from as their initial first favorites, based on their geographical location
    @MainActor func fetchDiscoveryRestaurants(
        searchQuery: String,
        paginationIndex: Int
    ) async -> [DiscoveryRestaurant] {
        guard let userCoordinatePoint = mostRecentUserCoordinates
        else { return [] }
        
        let restaurantSearchResult = await apolloService
            .performOnboardingRestaurantSearch(query: searchQuery,
                                               latitude: userCoordinatePoint.latitude,
                                               longitude: userCoordinatePoint.longitude,
                                               paginationIndex: paginationIndex),
        restaurants = restaurantSearchResult?.restaurants?.map({ $0.restaurant }) ?? []
        
        return restaurants
    }
}
