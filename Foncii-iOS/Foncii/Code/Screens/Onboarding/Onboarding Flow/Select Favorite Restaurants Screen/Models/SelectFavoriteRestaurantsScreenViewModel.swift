//
// SelectFavoriteRestaurantsScreenViewModel.swift
// Foncii
//
// Created by Justin Cook on 4/29/23 at 9:39 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Combine
import ApolloTestSupport
import OrderedCollections
import FonciiApollo

class SelectFavoriteRestaurantsScreenViewModel: CoordinatedGenericViewModel {
    typealias coordinator = OnboardingCoordinator
    
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.restaurantActionDispatcher) var restaurantActionDispatcher
    
    // MARK: - Properties
    var coordinator: coordinator
    
    // Restaurants
    var selectedRestaurants: OrderedSet<DiscoveryRestaurant> {
        return dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .selectedDiscoveryRestaurants
    }
    
    var restaurants: OrderedSet<DiscoveryRestaurant> {
        return dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .restaurants
    }
    
    var currentSearchQuery: String {
        return dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .currentSearchQuery
    }

    // Aggregation
    @Published var displayingAggregationOverlay: Bool = false

    // UI State Management
    @Published var displayActivityIndicator: Bool = false
    
    // MARK: - Limits
    // Pagination
    let maxPaginationIndex = 9 // 10 pages total ~ 20 Results each, 200 total
    let expectedRestaurantResultsPerPage = 20
    
    // MARK: - Placeholders For Lazy Loading
    /// Loads up an array of discovery restaurant chip view models with fake data
    /// to display while the real data loads
    let mockRestaurants: [DiscoveryRestaurant] = {
        var mocks: [DiscoveryRestaurant] = []
        let mockRestaurantCount = 20
        
        for _ in 0..<mockRestaurantCount {
            let mockRestaurant = Mock<Restaurant>()
            mockRestaurant.id = UUID().uuidString
            mockRestaurant.name = "Tony's Pizza Shop"
            mockRestaurant.heroImageURL = ""
            mockRestaurant.categories = ["Italian"]
            
            mocks.append(.from(mockRestaurant))
        }
        
        return mocks
    }()
    
    // MARK: - Requirements
    /// Min and max amount of restaurants that the user can select to choose as their first favorite
    let restaurantSelectionLimit = (3, 10)
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let appService: AppService = inject(),
            alertManager: AlertManager = inject(),
            userManager: UserManager = inject(),
            restaurantManager: RestaurantManager = inject(),
            tasteProfileManager: UserTasteProfileManager = inject(),
            restaurantAggregationManager: RestaurantAggregator = inject(),
            networkService: NetworkingService = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Styling
    // Colors
    let backgroundColor: Color = Colors.black_1,
        titleColor: Color = Colors.permanent_white,
        textColor: Color = Colors.neutral_1
    
    // Fonts
    let titleFont: FontStyleRepository = .subtitle_bold,
        promptFont: FontStyleRepository = .subtitle
    
    // MARK: - Localized Text
    let nextButtonTitle: String = LocalizedStrings
        .getLocalizedString(for: .NEXT),
titleText: String = LocalizedStrings
        .getLocalizedString(for: .SELECT_FAVORITES_SCREEN_TITLE),
    searchBarFieldPlaceholder = LocalizedStrings
        .getLocalizedString(for: .SEARCH),
    noSearchResultsPrompt = LocalizedStrings
        .getLocalizedString(for: .NO_SEARCH_RESULTS),
    failedFetchRequestPrompt = LocalizedStrings
        .getLocalizedString(for: .FAILED_FETCH_REQUEST)
    
    // MARK: - Actions
    var skipButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            navigateToNextScene()
        }
    }
    
    /// Moves on to the next screen
    var nextButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self,
                  canContinue
            else { return }
            
            navigateToNextScene()
        }
    }
    
    /// Refresh action triggered when the user scrolls up to the top of a connected scroll view
    var refreshAction: @Sendable () async -> Void {
        return { @MainActor [weak self] in
            guard let self = self
            else { return }
            
            await self.reload()
        }
    }
    
    // MARK: - Convenience
    var canPaginate: Bool {
        return dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .canPaginate
    }
    
    /// Continue when internet is available and the user has selected the required amount of restaurants
    var canContinue: Bool {
        return dependencies.appService.isClientOnline && isRequiredAmountOfRestaurantsSelected
    }
    
    var hasUserAlreadySubmittedFirstFavorites: Bool {
        return !dependencies
            .userManager
            .userRequirements
            .userMustAddFirstFavoriteRestaurants
    }
    
    var isRequiredAmountOfRestaurantsSelected: Bool {
        return selectedRestaurants.count >= restaurantSelectionLimit.0
    }
    
    /// Display the shimmer view when data is loading, except during paginations as the existing data is not being loaded
    var shouldDisplayShimmerView: Bool {
        return restaurants.isEmpty &&
        dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .currentActivity == .loading
    }
    
    var shouldDisplayFailedFetchRequestPrompt: Bool {
        return restaurants.isEmpty && dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .currentActivity == .loadFailed
    }
    
    /// Triggers the no search results prompt to be displayed when a search has turned up zero results
    var shouldDisplayNoSearchResultsPrompt: Bool {
        let hasGottenPastInitialLoadingPhase = dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .loadedInitialRestaurants,
        searchResultsEmpty = restaurants.isEmpty,
        managerIsIdle = !dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .isAnOperationCurrentlyInProgress
        
        return hasGottenPastInitialLoadingPhase
        && searchResultsEmpty
        && managerIsIdle
    }
    
    var shouldDisplaySomePrompt: Bool {
        return shouldDisplayFailedFetchRequestPrompt || shouldDisplayNoSearchResultsPrompt
    }
    
    var isClientOnline: Bool {
        AppService
            .shared
            .getCurrentState(of: \.clientState)
            .isClientOnline
    }
    
    // MARK: - Models
    var searchBarTextFieldViewModel: SearchBarTextFieldViewModel!
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
        
        initModels()
        addSubscribers()
    }
    
    // MARK: - State Management
    func load() {
        Task { @MainActor in
            await dependencies
                .restaurantManager
                .discoveryRestaurantManager
                .performInitialSearch()
        }
    }
    
    func initModels() {
        searchBarTextFieldViewModel = .init()
        searchBarTextFieldViewModel.configurator { [weak self] model in
            guard let self = self
            else { return }
            
            // Main Properties
            model.keyboardType = .asciiCapable
            model.placeholderText = searchBarFieldPlaceholder
            model.submitLabel = .search
            
            model.onSubmitAction = { [weak self] in
                /// Only trigger new searches when the search query changes
                guard let self = self,
                      self.currentSearchQuery != model.textEntry
                else { return }
                
                /// Remove any trailing spaces and cache the search query to be passed to other functions
                model.textEntry = model.textEntry.removeTrailingSpaces()
                let searchQuery = model.textEntry
                
                /// Execute a new search operation
                Task { @MainActor in
                    await self.search(searchQuery: searchQuery)
                }
            }
            
            // In-field icon
            model.inFieldIcon = Icons.getIconImage(named: .search)
        }
    }
    
    // MARK: - Subscriptions
    func addSubscribers() {
        /// Listen for the current activity of the aggregation manager
        /// and update the associated view accordingly
        self.dependencies
            .restaurantAggregationManager
            .$currentActivity
            .receive(on: scheduler)
            .sink { [weak self] activityState in
                guard let self = self
                else { return }
                
                switch activityState {
                case .hibernating,
                        .aggregating,
                        .indexing:
                    break
                case .done, .failed:
                    aggregationCompletionTransition()
                }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Search Functionality
    /// Reloads this view's data sources (if an internet connection is currently present)
    @MainActor func reload() async {
        guard isClientOnline
        else { return }
      
        await dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .reload()
    }
    
    @MainActor func search(searchQuery: String) async {
        await dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .search(searchQuery: searchQuery)
    }
    
    /// Triggers pagination when the user is close to or at / beyond the bottom of the scrollview's content (if pagination is possible)
    func triggerPagination() {
        guard !dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .isAnOperationCurrentlyInProgress
                && isClientOnline
                && canPaginate
        else { return }
        
        Task { @MainActor in
            await dependencies
                .restaurantManager
                .discoveryRestaurantManager
                .paginate()
        }
    }
    
    // MARK: - Navigation Actions
    /// Trigger this to resign the aggregation UI and navigate onwards
    /// Note: the extra time spent waiting for the UI to transition gives the
    /// backend more time to index the new restaurants if not already
    /// done, so this transition serves a functional and stylistic purpose
    func aggregationCompletionTransition() {
        Task { @MainActor in
            try! await Task.sleep(until: .now + .seconds(2),
                       clock: .continuous)
            
            self.displayingAggregationOverlay = false
            
            try! await Task.sleep(until: .now + .seconds(1),
                       clock: .continuous)
            
            /// Trigger an immediate reload to display the newly
            /// aggregated data
            await self.reload()
        }
    }
    
    /// Middle-man script used to trigger the aggregation
    /// phase if needed, this differs from the method used
    /// for the enable location screen as this screen is specifically
    /// meant to be visited only once, thus the user can trigger an aggregation
    /// event if possible when they visit this screen in order to ensure
    /// restaurant data is available for their current location. The enable location
    /// screen doesn't require restaurant data, therefore this phase isn't a hard
    /// dependency for that screen, but it is for this screen
    func determineIfAggregationNeeded() {
        let restaurantAggregationManager = dependencies.restaurantAggregationManager
        
        let canAggregate = restaurantAggregationManager
            .canAggregate
        
        if (canAggregate) {
            /// This process is super expensive so debug
            /// envs are not allowed to aggregate
            #if !DEBUG
            displayingAggregationOverlay = true
            
            restaurantAggregationManager
                .aggregateRestaurants()
            #endif
        }
    }
    
    /// Submits any selections and move on to the next scene
    func navigateToNextScene() {
        Task { @MainActor in
            let userManager = self.dependencies.userManager
            
            guard let userRequirements = userManager.userRequirements
            else { return }
            
            await self.submitFirstFavoriteSelections()
            
            /// If all requirements are fulfilled then navigate to the main scene
            if userRequirements
                .areAllUserRequirementsFulfilled {
                self.coordinator.rootCoordinatorDelegate.switchToMainScene()
            }
        }
    }
    
    // MARK: - Business Logic
    @MainActor func submitFirstFavoriteSelections() async {
        /// Don't continue if the user has already committed their first favorites, if that's the case then they should never see this screen again
        guard !hasUserAlreadySubmittedFirstFavorites
        else { return }
        
        // Start network activity indicator
        self.displayActivityIndicator = true
        
        /// Infer the user's taste profile if they've selected restaurants
        if isRequiredAmountOfRestaurantsSelected {
            /// Add the restaurants to the user's first favorites
            await dependencies
                .userManager
                .addFirstFavoriteRestaurants(firstFavoriteRestaurants: Array(selectedRestaurants))
            
            /// Infer the user's tastes given their first favorite restaurants
            await dependencies
                .tasteProfileManager
                .inferUserTasteProfile()
        }
        else {
            /// Just generate a basic taste profile without inferring the user's tastes since they skipped this screen
            await dependencies
                .tasteProfileManager
                .setUserTasteProfile(
                    adventureLevel: nil,
                    restaurantRatingImportanceLevel: nil,
                    distancePreferenceLevel: nil,
                    prefersDrinks: nil,
                    favoriteCuisines: nil,
                    foodRestrictions: nil,
                    preferredPriceLevels: nil,
                    preferredMealTypes: nil
                )
        }
        
        /// Mark the user's onboarding process as complete since this screen is the
        /// last setup
        /// screen before the main scene
        dependencies
            .userManager
            .markOnboardingAsComplete()
        
        // stop network activity indicator
        self.displayActivityIndicator = false
    }
}
