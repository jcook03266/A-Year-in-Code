//
// HomeScreenViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 11:39 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import Combine
import ApolloTestSupport
import OrderedCollections
import FonciiApollo
import SwiftUI

class HomeScreenViewModel: CoordinatedGenericViewModel {
    typealias coordinator = HomeTabCoordinator
    
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.homeScreenActionDispatcher) var homeScreenActionDispatcher
    
    // MARK: - Properties
    var coordinator: coordinator
    
    var currentSearchQuery: String {
        return dependencies
            .restaurantManager
            .homeFeedRestaurantManager
            .currentSearchQuery
    }
    
    var dateText: String {
        let date = dependencies
            .reservationDateManager
            .targetReservationDate
        
        return dependencies
            .reservationDateManager
            .formatDateToHomeScreenFormat(date: date)
    }
    
    let currentSearchLocationDescriptionPlaceHolder: String = "Somewhere, USA"
    
    // MARK: - Published
    @Published var didAppear: Bool = false
    @Published var currentSearchLocationDescription: String = ""

    // UI State
    @Published var gridListFormatEnabled: Bool = true
    @Published var searchBarToggled: Bool = false
    
    // MARK: - State Management
    var currentActivity: HomeScreenDomain.State.ActivityStates {
        return AppService.shared.getCurrentState(of: \.homeScreenState)
            .currentActivity
    }
    
    /// The current feed [FYP or Trending]
    var selectedFeedTab: HomeScreenDomain.State.HomeScreenTabs {
        return AppService
            .shared
            .getCurrentState(of: \.homeScreenState)
            .currentTab
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let userManager: UserManager = inject(),
            locationManager: LocationServiceManager = inject(),
            reservationDateManager: ReservationDateManager = inject(),
            restaurantManager: RestaurantManager = inject(),
            staticAssetController: StaticAssetController = inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Restaurants
    var homeFeedRestaurantSearchResults: OrderedSet<PersonalizedRestaurantSearchResult> {
        return dependencies
            .restaurantManager
            .homeFeedRestaurantManager
            .restaurants
    }
    
    // MARK: - Styling
    // Assets
    let searchButtonIcon: Image = Icons.getIconImage(named: .search)
    
    /// Note: Grid indicates the list format is currently toggled and the grid can be triggered by toggling the button again
    var listFormatToggleButtonIcon: Image {
        if gridListFormatEnabled {
            return Icons.getIconImage(named: .line_3_horizontal)
        }
        else {
            return Icons.getIconImage(named: .square_grid_2x2_fill)
        }
    }
    
    // Colors
    let greetingTextColor: Color = Colors.primary_1,
        datePickerColor: Color = Colors.neutral_1,
        currentLocationDescriptionColor: Color = Colors.permanent_white,
        shadowColor: Color = Colors.shadow,
        textColor: Color = Colors.neutral_1,
        headerButtonColor: Color = Colors.neutral_1,
        listDividerColor: Color = Colors.medium_dark_grey_1
    
    // Fonts
    let greetingTextFont: FontStyleRepository = .caption,
        datePickerFont: FontStyleRepository = .caption,
        currentLocationDescriptionFont: FontStyleRepository = .heading_3,
        promptFont: FontStyleRepository = .subtitle
    
    // MARK: - Localized Text
    let fypTabTitle: String = LocalizedStrings
        .getLocalizedString(for: .HOME_SCREEN_FYP_TAB_TITLE),
trendingTabTitle: String = LocalizedStrings
        .getLocalizedString(for: .HOME_SCREEN_TRENDING_TAB_TITLE),
    noSearchResultsPrompt = LocalizedStrings
        .getLocalizedString(for: .NO_SEARCH_RESULTS),
    failedFetchRequestPrompt = LocalizedStrings
        .getLocalizedString(for: .FAILED_FETCH_REQUEST)
    
    /// Greeting to be displayed at the top of the home screen when
    /// a valid user is logged in
    var greetingText: String {
        let greetingPrefix: String = LocalizedStrings
            .getLocalizedString(for: .HI_GREETING),
    greetingSeparator: String = ", ",
    userFirstName: String = dependencies.userManager.currentUser?.firstName ?? "",
        exclamationPointPostfix = "!"
        
        if userFirstName.isEmpty {
            return ""
        }
        else {
            return greetingPrefix
            + greetingSeparator
            + userFirstName
            + exclamationPointPostfix
        }
    }
    
    // MARK: - Actions
    /// Updates the home feed's managed restaurants when the favorited status of a specific restaurant result is mutated
    var restaurantFavoriteActionSideEffect: ((PersonalizedRestaurantSearchResult) -> Void) {
        return { [weak self] updatedRestaurantSearchResult in
            guard let self = self
            else { return }
            
            dependencies
                .restaurantManager
                .homeFeedRestaurantManager
                .updateRestaurant(updatedRestaurantSearchResult: updatedRestaurantSearchResult)
            
            dependencies
                .restaurantManager
                .favoritedRestaurantManager
                .triggerPendingUpdateStatus()
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
    
    // UI Component Togglers
    var datePickerToggleButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .presentSheet(with: .dateAndLocationEditor,
                              onDismiss: { [weak self] in
                    guard let self = self
                    else { return }
                    
                    let newChangesCommitted = AppService
                        .shared
                        .getCurrentState(of: \.restaurantState)
                        .newFilterUpdatesCommitted
                    
                    if newChangesCommitted {
                        Task { @MainActor in
                            await self.reload()
                        }
                    }
                })
        }
    }
    
    var locationPickerToggleButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .presentSheet(with: .dateAndLocationEditor,
                              onDismiss: { [weak self] in
                    guard let self = self
                    else { return }
                    
                    let newChangesCommitted = AppService
                        .shared
                        .getCurrentState(of: \.restaurantState)
                        .newFilterUpdatesCommitted
                    
                    if newChangesCommitted {
                        Task { @MainActor in
                            await self.reload()
                        }
                    }
                })
        }
    }
    
    var searchBarToggleButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.searchBarToggled.toggle()
            
            // Focus the search bar when toggled
            if searchBarToggled {
                self.searchBarTextFieldViewModel.focus()
            }
            
            // Reset search bar contents on untoggle
            if !searchBarToggled {
                self.searchBarTextFieldViewModel.clear()
                self.searchBarTextFieldViewModel.dismiss()
                
                // Globally hide the keyboard
                hideKeyboard()
            }
        }
    }
    
    var listFormatToggleButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.gridListFormatEnabled.toggle()
        }
    }
    
    // MARK: - Placeholders For Lazy Loading
    /// Loads up an array of discovery restaurant chip view models with fake data
    /// to display while the real data loads
    let mockRestaurantSearchResults: [PersonalizedRestaurantSearchResult] = {
        var mocks: [PersonalizedRestaurantSearchResult] = []
        let mockRestaurantCount = 10
        
        for _ in 0..<mockRestaurantCount {
            mocks.append(.mock)
        }
        
        return mocks
    }()
    
    // MARK: - Convenience
    /// Passes the current pagination capability of the feed being viewed (FYP or Trending)
    var canPaginate: Bool {
        return dependencies
            .restaurantManager
            .homeFeedRestaurantManager
            .canPaginate
    }
    
    /// Display the shimmer view when data is loading, except during paginations as the existing data is not being
    /// loaded, pagination basically implies the current data is not empty, and if the data is empty that means the
    /// initial restaurants are loading which should result in a placeholder shimmer as no data exists yet
    var shouldDisplayShimmerView: Bool {
        return homeFeedRestaurantSearchResults.isEmpty && dependencies
            .restaurantManager
            .homeFeedRestaurantManager
            .currentActivity == .loading
    }
    
    var shouldDisplayFailedFetchRequestPrompt: Bool {
        return homeFeedRestaurantSearchResults.isEmpty && dependencies
            .restaurantManager
            .homeFeedRestaurantManager
            .currentActivity == .loadFailed
    }
    
    var shouldDisplayNoSearchResultsPrompt: Bool {
        let hasGottenPastInitialLoadingPhase = dependencies
            .restaurantManager
            .homeFeedRestaurantManager
            .loadedInitialRestaurants,
        searchResultsEmpty = homeFeedRestaurantSearchResults.isEmpty,
        managerIsIdle = !dependencies
            .restaurantManager
            .homeFeedRestaurantManager
            .isAnOperationCurrentlyInProgress
        
        return hasGottenPastInitialLoadingPhase
        && searchResultsEmpty
        && managerIsIdle
    }
    
    var shouldDisplaySomePrompt: Bool {
        return shouldDisplayFailedFetchRequestPrompt || shouldDisplayNoSearchResultsPrompt
    }
    
    var isCurrentLocationDescriptionLoading: Bool {
        return currentSearchLocationDescription.isEmpty
    }
    
    var isClientOnline: Bool {
        AppService
            .shared
            .getCurrentState(of: \.clientState)
            .isClientOnline
    }
    
    // MARK: - Models
    var slidingContextSwitcherViewModel: SlidingContextSwitchViewModel!
    var searchBarTextFieldViewModel: SearchBarTextFieldViewModel!
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
        
        initModels()
    }
    
    // MARK: - State Management
    func load() {
        Task { @MainActor in
            dependencies
                .staticAssetController
                .load()
            
            let currentTargetSearchArea = dependencies
                .restaurantManager
                .currentRestaurantSearchArea
            
            self.currentSearchLocationDescription = await dependencies
                .locationManager
                .getCityAndStateFromLocation(coordinates: currentTargetSearchArea) ?? ""
            
            /// Initial restaurant data to display when the user first views the home screen
            if !dependencies
                .restaurantManager
                .homeFeedRestaurantManager
                .loadedInitialRestaurants {
                await dependencies
                    .restaurantManager
                    .homeFeedRestaurantManager
                    .performInitialSearch()
            }
        }
    }
    
    /// Reloads this view's data sources (if an internet connection is currently present)
    @MainActor func reload() async {
        guard isClientOnline
        else { return }
        
        let currentTargetSearchArea = dependencies
            .restaurantManager
            .currentRestaurantSearchArea
        
        self.currentSearchLocationDescription = await dependencies
            .locationManager
            .getCityAndStateFromLocation(coordinates: currentTargetSearchArea) ?? currentSearchLocationDescription
        
        self.dependencies
            .staticAssetController
            .reload()
        
        await dependencies
            .restaurantManager
            .homeFeedRestaurantManager
            .reload()
    }
    
    @MainActor func search(searchQuery: String) async {
        await dependencies
            .restaurantManager
            .homeFeedRestaurantManager
            .search(searchQuery: searchQuery)
    }
    
    /// Triggers pagination when the user is close to or at / beyond the bottom of the scrollview's content (if pagination is possible)
    func triggerPagination() {
        guard !dependencies
            .restaurantManager
            .homeFeedRestaurantManager
            .isAnOperationCurrentlyInProgress
                && isClientOnline
                && canPaginate
        else { return }
        
        Task { @MainActor in
            await dependencies
                .restaurantManager
                .homeFeedRestaurantManager
                .paginate()
        }
    }
    
    // MARK: - Factory Methods
    // View Models
    func createFPRestaurantViewModel(restaurantSearchResult: PersonalizedRestaurantSearchResult) -> FPRestaurantViewModel<coordinator> {
        return .init(
            restaurantSearchResult: restaurantSearchResult,
            coordinator: self.coordinator,
            favoriteActionSideEffect: self.restaurantFavoriteActionSideEffect
        )
    }
    
    func createMPRestaurantViewModel(restaurantSearchResult: PersonalizedRestaurantSearchResult) -> MPRestaurantViewModel<coordinator> {
        return .init(
            restaurantSearchResult: restaurantSearchResult,
            coordinator: self.coordinator,
            sourceCollection: Array(self.homeFeedRestaurantSearchResults),
            favoriteActionSideEffect: self.restaurantFavoriteActionSideEffect
        )
    }
    
    func initModels() {
        slidingContextSwitcherViewModel = SlidingContextSwitchViewModel { [self] contextSwitcher in
            let fypTab = SlidingContextSwitchTabViewModel(title: fypTabTitle,
                                                          parentViewModel: contextSwitcher) { [weak self] in
                guard let self = self
                else { return }
                
                homeScreenActionDispatcher
                    .selectTab(tab: .fyp)
            },
                trendingTab = SlidingContextSwitchTabViewModel(title: trendingTabTitle,
                                                               parentViewModel: contextSwitcher) { [weak self] in
                    guard let self = self
                    else { return }
                    
                    homeScreenActionDispatcher
                        .selectTab(tab: .trending)
                }
            
            contextSwitcher.currentlySelectedTab = fypTab
            
            return [fypTab, trendingTab]
        }
        
        searchBarTextFieldViewModel = .init()
        searchBarTextFieldViewModel.configurator { [weak self] model in
            guard let self = self
            else { return }
            
            // Main Properties
            model.keyboardType = .asciiCapable
            model.placeholderText = LocalizedStrings.getLocalizedString(for: .RESTAURANT_SEARCHBAR_PLACEHOLDER)
            model.submitLabel = .done
            
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
}

// MARK: - Reservation Date Picker
extension HomeScreenViewModel {
    // MARK: - Actions
    var reservationDateFilterToggleAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            HapticFeedbackDispatcher
                .gentleButtonPress()
        }
    }
}

// MARK: - Search Button
extension HomeScreenViewModel {
    // MARK: - Actions
    var searchButtonToggle: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            HapticFeedbackDispatcher
                .gentleButtonPress()
        }
    }
}

// MARK: - Location Selector
extension HomeScreenViewModel {
    // MARK: - Actions
    var searchLocationFilterSelectorToggleAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            HapticFeedbackDispatcher
                .gentleButtonPress()
        }
    }
}
