//
// ProfileScreenViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/25/23 at 2:11 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import Combine
import ApolloTestSupport
import OrderedCollections
import FonciiApollo
import SwiftUI

class ProfileScreenViewModel: CoordinatedGenericViewModel {
    typealias coordinator = ProfileTabCoordinator
    
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.profileScreenActionDispatcher) var profileScreenActionDispatcher
    
    // MARK: - Properties
    var coordinator: coordinator
    
    let clientLocationDescriptionPlaceHolder: String = "Somewhere, USA"
    
    var username: String {
        return dependencies
            .userManager
            .currentUser?
            .username ?? ""
    }
    
    /// Namecased first and last name of the user (excludes middle names)
    var fullNameString: String {
        let currentUser = dependencies
            .userManager
            .currentUser,
        firstName = currentUser?.firstName ?? "",
        lastName = currentUser?.lastName ?? ""
        
        return "\(firstName) \(lastName)"
            .capitalizeAllFirstLetters
    }
    
    /// The current feed [Favorites or Recommendations]
    var selectedFeedTab: ProfileScreenDomain.State.ProfileScreenTabs {
        return AppService
            .shared
            .getCurrentState(of: \.profileScreenState)
            .currentTab
    }
    
    // MARK: - Restaurants
    var favoritedRestaurants: OrderedSet<FavoritedRestaurant> {
        return dependencies
            .restaurantManager
            .favoritedRestaurantManager
            .restaurants
    }
    
    // MARK: - Placeholders For Lazy Loading
    let mockFavoritedRestaurants: [FavoritedRestaurant] = {
        var mocks: [FavoritedRestaurant] = []
        let mockRestaurantCount = 10
        
        for _ in 0..<mockRestaurantCount {
            mocks.append(.mock)
        }
        
        return mocks
    }()
    
    // TODO: - Update
    let mockRestaurantRecommendations: [FavoritedRestaurant] = {
        var mocks: [FavoritedRestaurant] = []
        let mockRestaurantCount = 10
        
        for _ in 0..<mockRestaurantCount {
            mocks.append(.mock)
        }
        
        return mocks
    }()
    
    // MARK: - Published
    @Published var clientLocationDescription: String = ""
    @Published var didAppear: Bool = false
    
    // UI State
    /// Hides the user information section conditionally
    @Published var userInformationSectionHidden: Bool = false
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let userManager: UserManager = inject(),
            locationManager: LocationServiceManager = inject(),
            restaurantManager: RestaurantManager = inject(),
            staticAssetController: StaticAssetController = inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Styling
    // Assets
    let notificationsButtonIcon: Image = Icons.getIconImage(named: .notification_bell),
        settingsButtonIcon: Image = Icons.getIconImage(named: .settings_gear),
        mapMarkerIcon: Image = Icons.getIconImage(named: .map_marker_outline_pinhole),
        qrCodeIcon: Image = Icons.getIconImage(named: .qr_code),
        paperPlaneSendIcon: Image = Icons.getIconImage(named: .send),
        editIcon: Image = Icons.getIconImage(named: .request),
        heartIcon: Image = Icons.getIconImage(named: .heart_favorite_filled),
        thumbsUpIcon: Image = Icons.getIconImage(named: .thumbs_up)
    
    // Colors
    let topHeaderButtonColor: Color = Colors.medium_1,
        usernameColor: Color = Colors.permanent_white,
        fullNameColor: Color = Colors.permanent_white,
        clientLocationDescriptionColor: Color = Colors.neutral_1,
        qrCodeIconColor: Color = Colors.primary_1,
        qrCodeBackgroundColor: Color = Colors.medium_dark_grey_1,
        sectionDividerColor: Color = Colors.medium_dark_grey_1,
        viewAllButtonColor: Color = Colors.neutral_1,
        locationsHeaderColor: Color = Colors.permanent_white,
        contentFeedSectionDividerColor: Color = Colors.medium_dark_grey_1,
        shadowColor: Color = Colors.shadow,
        backgroundColor: Color = Colors.black_1,
        listDividerColor: Color = Colors.medium_dark_grey_1
    
    // Fonts
    let usernameFont: FontStyleRepository = .subtitle,
        usernameFontWeight: UIFont.Weight = .semibold,
        fullNameFont: FontStyleRepository = .heading_3_bold,
        clientLocationDescriptionFont: FontStyleRepository = .caption_bold,
        viewAllButtonFont: FontStyleRepository = .caption,
        locationsHeaderFont: FontStyleRepository = .heading_3,
        locationsHeaderFontWeight: UIFont.Weight = .medium
    
    // MARK: - Localized Text
    let locationsHeaderText: String = LocalizedStrings.getLocalizedString(for: .PROFILE_SCREEN_LOCATIONS_HEADER_TEXT),
        viewAllButtonText: String = LocalizedStrings.getLocalizedString(for: .VIEW_ALL),
        favoritesTabTitle: String = LocalizedStrings.getLocalizedString(for: .PROFILE_SCREEN_FAVORITES_TAB_TITLE),
        recommendationsTabTitle: String = LocalizedStrings.getLocalizedString(for: .PROFILE_SCREEN_RECOMMENDATIONS_TAB_TITLE),
        requestRecommendationButtonTitle: String = LocalizedStrings.getLocalizedString(for: .REQUEST),
        sendRecommendationButtonTitle: String = LocalizedStrings.getLocalizedString(for: .SEND)
    
    // MARK: - Convenience
    /// Passes the current pagination capability of the feed being viewed (Favorites or Recommendations)
    var canPaginate: Bool {
        switch selectedFeedTab {
        case .favorites:
            return dependencies
                .restaurantManager
                .favoritedRestaurantManager
                .canPaginate
            
        case .recommendations:
            // TODO: - Update
            return dependencies
                .restaurantManager
                .favoritedRestaurantManager
                .canPaginate
        }
    }
    
    /// Display the shimmer view when data is loading, except during paginations as the existing data is not being
    /// loaded, pagination basically implies the current data is not empty, and if the data is empty that means the
    /// initial restaurants are loading which should result in a placeholder shimmer as no data exists yet
    var shouldDisplayShimmerView: Bool {
        switch selectedFeedTab {
        case .favorites:
            return favoritedRestaurants.isEmpty && dependencies
                .restaurantManager
                .favoritedRestaurantManager
                .currentActivity == .loading
            
        case .recommendations:
            // TODO: - Update
            return favoritedRestaurants.isEmpty && dependencies
                .restaurantManager
                .favoritedRestaurantManager
                .currentActivity == .loading
        }
    }
    
    var shouldDisplayFailedFetchRequestPrompt: Bool {
        switch selectedFeedTab {
        case .favorites:
            return favoritedRestaurants.isEmpty && dependencies
                .restaurantManager
                .favoritedRestaurantManager
                .currentActivity == .loadFailed
            
        case .recommendations:
            // TODO: - Update
            return favoritedRestaurants.isEmpty && dependencies
                .restaurantManager
                .favoritedRestaurantManager
                .currentActivity == .loadFailed
        }
    }
    
    /// The user either doesn't have any favorites or doesn't have any
    /// recommendations, prompt them to fulfill either to populate the screen,
    /// with a CTA button
    var shouldDisplayNoResultsPrompt: Bool {
        switch selectedFeedTab {
        case .favorites:
            return favoritedRestaurants.isEmpty
            
        case .recommendations:
            // TODO: - Update
            return favoritedRestaurants.isEmpty
        }
    }
    
    var shouldDisplaySomePrompt: Bool {
        return shouldDisplayFailedFetchRequestPrompt
    }
    
    var isClientOnline: Bool {
        AppService
            .shared
            .getCurrentState(of: \.clientState)
            .isClientOnline
    }
    
    var isClientLocationDescriptionLoading: Bool {
        return clientLocationDescription.isEmpty
    }
    
    
    // MARK: - Actions
    var restaurantFavoriteActionSideEffect: ((PersonalizedRestaurantSearchResult) -> Void) {
        return { [weak self] updatedRestaurantSearchResult in
            guard let self = self,
                  !((updatedRestaurantSearchResult.isFavorited) ?? false)
            else { return }
            
            // Find the target restaurant in the managed favorites collection
            let targetFavoritedRestaurant = favoritedRestaurants
                .first { $0.favoritedRestaurant?.restaurant.id == updatedRestaurantSearchResult.restaurant.id }
            
            guard let targetFavoritedRestaurant = targetFavoritedRestaurant
            else { return }
            
            // Removes the target updated favorited restaurant when
            // its favorite status becomes false aka it's unfavorited
            Task { @MainActor in
                await self.dependencies
                    .restaurantManager
                    .favoritedRestaurantManager
                    .removeRestaurant(restaurant: targetFavoritedRestaurant)
            }
        }
    }
    
    // Navigation Actions
    var notificationsButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
        }
    }
    
    var settingsButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .pushView(with: .settings)
        }
    }
    
    var requestRecommendationButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
        }
    }
    
    var sendRecommendationButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
        }
    }
    
    var qrCodeButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            HapticFeedbackDispatcher
                .gentleButtonPress()
        }
    }
    
    /// Opens the profile tasks screen when triggered
    var viewProfileTasksButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
        }
    }
    
    var viewAllButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
        }
    }
    
    /// Refresh action triggered when the user scrolls up to the top of a connected scroll view
    /// Reloads everything on the profile screen, including the content feeds
    var refreshAction: @Sendable () async -> Void {
        return { @MainActor [weak self] in
            guard let self = self
            else { return }
            
            await self.reload(reloadContentFeeds: true)
        }
    }
    
    // MARK: - Models
    var slidingContextSwitcherViewModel: SlidingContextSwitchViewModel!
    var profilePictureComponentViewModel: ProfilePictureComponentViewModel!
    var favoritesLocationFilterSelectorViewModel: LocationFilterSelectorViewModel!
    var recommendationsLocationFilterSelectorViewModel: LocationFilterSelectorViewModel!
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
        
        initModels()
    }
    
    // MARK: - State Management
    func load() {
        Task { @MainActor in
            self.clientLocationDescription = await dependencies
                .locationManager
                .getCityAndStateFromLocation() ?? ""
            
            dependencies
                .staticAssetController
                .load()
            
            await dependencies
                .restaurantManager
                .favoritedRestaurantManager
                .performInitialSearch()
        }
    }
    
    /// Reloads this view's data sources (if an internet connection is currently present)
    @MainActor func reload(reloadContentFeeds: Bool = false) async {
        guard isClientOnline
        else { return }
        
        let shouldUpdate = dependencies
            .restaurantManager
            .favoritedRestaurantManager
            .currentActivity == .updatesPending
        
        self.clientLocationDescription = await dependencies
            .locationManager
            .getCityAndStateFromLocation() ?? clientLocationDescription
        
        self.dependencies
            .staticAssetController
            .reload()
        
        /// Reload favorites and recommendations as well
        if reloadContentFeeds || shouldUpdate {
            await self.dependencies
                .restaurantManager
                .favoritedRestaurantManager
                .reload()
        }
    }
    
    // MARK: - Factory Methods
    // View Models
    func createFavoritedRestaurantMPRestaurantViewModel(favoritedRestaurantResult: FavoritedRestaurant) -> MPRestaurantViewModel<coordinator> {
        let sourceCollection: [PersonalizedRestaurantSearchResult] = Array(
            self.favoritedRestaurants
                .map({ .init(_fieldData: $0.favoritedRestaurant._fieldData) })),
            restaurant = favoritedRestaurantResult.favoritedRestaurant,
            transformedRestaurant: PersonalizedRestaurantSearchResult = .init(_dataDict: restaurant?.__data ?? PersonalizedRestaurantSearchResult.mock.__data)
        
        return .init(
            restaurantSearchResult: transformedRestaurant,
            coordinator: self.coordinator,
            sourceCollection: sourceCollection,
            favoriteActionSideEffect: self.restaurantFavoriteActionSideEffect
        )
    }
    
    // TODO: - Implement
    //    func createRecommendedRestaurantMPRestaurantViewModel(restaurant: FavoritedRestaurant) -> MPRestaurantViewModel<coordinator> {
    //    let sourceCollection: [PersonalizedRestaurantSearchResult] = Array(
    //        self.favoritedRestaurants
    //            .map({ .init(_fieldData: $0.favoritedRestaurant._fieldData) })),
    //        restaurant = favoritedRestaurantResult.favoritedRestaurant,
    //        transformedRestaurant: PersonalizedRestaurantSearchResult = .init(_dataDict: restaurant?.__data ?? PersonalizedRestaurantSearchResult.mock.__data)
    //
    //    return .init(
    //        restaurantSearchResult: transformedRestaurant,
    //        coordinator: self.coordinator,
    //        sourceCollection: sourceCollection,
    //        favoriteActionSideEffect: self.restaurantFavoriteActionSideEffect
    //    )
    //    }
    
    private func initModels() {
        self.slidingContextSwitcherViewModel = SlidingContextSwitchViewModel { [self] contextSwitcher in
            let favoritesTab = SlidingContextSwitchTabViewModel(
                title: favoritesTabTitle,
                parentViewModel: contextSwitcher,
                icon: heartIcon
            ) { [weak self] in
                guard let self = self
                else { return }
                
                self.profileScreenActionDispatcher
                    .selectTab(tab: .favorites)
            },
                recommendationsTab = SlidingContextSwitchTabViewModel(
                    title: recommendationsTabTitle,
                    parentViewModel: contextSwitcher,
                    icon: thumbsUpIcon
                ) { [weak self] in
                    guard let self = self
                    else { return }
                    
                    self.profileScreenActionDispatcher
                        .selectTab(tab: .recommendations)
                }
            
            contextSwitcher.currentlySelectedTab = favoritesTab
            
            return [favoritesTab, recommendationsTab]
        }
        
        self.profilePictureComponentViewModel = .init(onSelectAction: { [weak self] in
            guard let self = self
            else { return }
            
            self.viewProfileTasksButtonAction()
        })
        
        self.favoritesLocationFilterSelectorViewModel = .init(targetStoreToFilter: .favoritedRestaurants)
        
        self.recommendationsLocationFilterSelectorViewModel = .init(targetStoreToFilter: .restaurantRecommendations)
    }
    
    /// Triggers pagination when the user is close to or at / beyond the bottom of the scrollview's content (if pagination is possible)
    func triggerPagination() {
        if selectedFeedTab == .favorites {
            guard !dependencies
                .restaurantManager
                .favoritedRestaurantManager
                .isAnOperationCurrentlyInProgress
                    && isClientOnline
                    && canPaginate
            else { return }
        }
        else if selectedFeedTab == .recommendations {
            guard !dependencies
                .restaurantManager
                .favoritedRestaurantManager
                .isAnOperationCurrentlyInProgress
                    && isClientOnline
                    && canPaginate
            else { return }
        }
        
        Task { @MainActor in
            switch selectedFeedTab {
            case .favorites:
                await dependencies
                    .restaurantManager
                    .favoritedRestaurantManager
                    .paginate()
                
            case .recommendations:
                // TODO: - Update
                await dependencies
                    .restaurantManager
                    .favoritedRestaurantManager
                    .paginate()
            }
        }
    }
}

extension ProfileScreenViewModel {
    /// Conditionally hides user information section when the user is scrolling through the content
    /// feed in order to unimpede their browsing experience
    func handleScrollViewOffsetUpdate(offset: CGPoint) {
        let normalizedVertifcalOffset = abs(offset.y),
            scrollViewTopBuffer: CGFloat = 100,
            scrollViewTop: CGFloat = 0 + scrollViewTopBuffer,
            isAtTopOfScrollView = normalizedVertifcalOffset <= scrollViewTop
        
        userInformationSectionHidden = !isAtTopOfScrollView
    }
}
