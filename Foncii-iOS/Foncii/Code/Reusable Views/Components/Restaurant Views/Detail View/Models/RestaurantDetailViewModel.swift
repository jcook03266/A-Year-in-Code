//
// RestaurantDetailViewModel.swift
// Foncii
//
// Created by Justin Cook on 7/17/23 at 5:17 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import FonciiApollo
import ApolloTestSupport

class RestaurantDetailViewModel<someCoordinator: Coordinator>: CoordinatedGenericViewModel {
    typealias coordinator = someCoordinator
    
    // MARK: - Properties
    var coordinator: coordinator
    
    // Restaurant Data
    @Published var personalizedRestaurant: PersonalizedRestaurantSearchResult = .mock
    
    var restaurant: PersonalizedRestaurant {
        return personalizedRestaurant.restaurant
    }
    
    // Image View Sizing
    let heroImageViewSize: RestaurantImageViewModel.ImageSizes = .hero
    var heroImageViewExplicitSize: CGSize {
        return heroImageViewSize.getSize()
    }
    
    // States
    @Published var didAppear: Bool = false
    
    /// Controls placeholder loading state
    @Published var didDataFinishLoading: Bool = false
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let userManager: UserManager = inject(),
            locationManager: LocationServiceManager = inject(),
            reservationDateManager: ReservationDateManager = inject(),
            restaurantManager: RestaurantManager = inject(),
            restaurantInteractor: RestaurantInteractionsManager = RestaurantDetailViewModel.Dependencies.inject()
    }
    
    var dependencies = Dependencies()
    
    // MARK: - Styling
    // Assets
    // Utility
    let shareButtonIcon: Image = Icons.getIconImage(named: .share),
        // Ratings
        googleIcon: Image = Images.getImage(named: .google_logo),
        yelpIcon: Image = Images.getImage(named: .yelp_logo),
        // Interactions
        filledHeartIcon: Image = Icons.getIconImage(named: .heart_favorite_filled),
        unfilledHeartIcon: Image = Icons.getIconImage(named: .heart_favorite_unfilled),
        // Property List
        clockIcon: Image = Icons.getIconImage(named: .clock_watch_later),
        mapMarkerIcon: Image = Icons.getIconImage(named: .map_marker),
        telephoneIcon: Image = Icons.getIconImage(named: .phone),
        globeIcon: Image = Icons.getIconImage(named: .globe),
        rideshareIcon: Image = Icons.getIconImage(named: .uber)
    
    // Colors
    let nameHeaderColor: Color = Colors.permanent_white,
        textColor: Color = Colors.neutral_1,
        backgroundColor: Color = Colors.black_1,
        propertyListIconColor: Color = Colors.medium_1,
        ratingsSeparatorColor: Color = Colors.medium_1,
        percentMatchLabelBackgroundColor: Color = Colors.primary_1.opacity(0.20),
        percentMatchLabelTextColor: Color = Colors.primary_1,
        heroImageOverlayGradient: LinearGradient = Colors.restaurantHeroOverlayGradient,
        headerDividerColor: Color = Colors.medium_dark_grey_1
    
    // Fonts
    let nameHeaderFont: FontStyleRepository = .heading_2_bold,
        percentMatchLabelFont: FontStyleRepository = .subtitle,
        percentMatchLabelFontWeight: UIFont.Weight = .medium,
        summaryFont: FontStyleRepository = .body
    
    // MARK: - Localized Text
    // Text
    var percentMatchPostfix: String {
        return LocalizedStrings
            .getLocalizedString(for: .MATCH)
            .uppercased()
    }
    
    // Convenience
    var restaurantName: String {
        return restaurant.name
    }
    
    var restaurantSummary: String? {
        return restaurant.description
    }
    
    var priceLevelDescription: String {
        return restaurant.priceLevelAsDollarSigns
    }
    
    var restaurantCategoriesString: String? {
        return restaurant.categoriesString(" | ")
    }
    
    var distanceFromCurrentUserLocationDescription: String? {
        return "1.4 mi"
    }
    
    var address: String {
        return restaurant
            .addressProperties
            .formattedAddress ?? ""
    }
    
    /// N/A if the percent match is undefined (not possible, but still a placeholder is available)
    var formattedPercentMatchDescription: String {
        let percentMatchAsPercent = personalizedRestaurant.percentageMatchAsPercent
        
        if personalizedRestaurant
            .percentMatch == nil
        {
            return percentMatchAsPercent
        }
        else {
            return "\(percentMatchAsPercent) \(percentMatchPostfix)"
        }
    }
    
    // MARK: - Actions
    /// Toggles the favorite status for this restaurant and reloads the entire
    /// restaurant with its updated counterpart, thus triggering a reload of the
    /// modeled view
    var toggleFavoriteAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            HapticFeedbackDispatcher
                .gentleButtonPress()
            
            Task { @MainActor in
                await self.toggleFavoriteStatus()
            }
        }
    }
    
    /// Custom logic to execute within the based favorite action closure
    var favoriteActionSideEffect: ((PersonalizedRestaurantSearchResult) -> Void)? = nil
    
    /// Provisions a share sheet for a URL to the current path
    var shareSheetAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
        }
    }
    
    var backNavigationAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            if let heroTransitionDismissalAction = heroTransitionDismissalAction {
//                self.favoriteActionSideEffect?(personalizedRestaurant)
//
//                // Hero Transition Presentation
//                heroTransitionDismissalAction()
                self.coordinator
                    .dismissSheet()
            }
            else {
                // Full Cover Presentation
                self.coordinator
                    .dismissFullScreenCover()
            }
        }
    }
    
    var heroTransitionDismissalAction: (() -> Void)? = nil
    
    // MARK: - Convenience
    var shouldDisplayLoadingIndicators: Bool {
        return !didDataFinishLoading
    }
    
    var isFavorited: Bool {
        return personalizedRestaurant.isFavorited ?? false
    }
    
    // MARK: - View Models
    @Published var imageViewModel: RestaurantImageViewModel? = nil
    @Published var heroImage: Image? = nil
    
    /**
     * Pass in explicit restaurant data or the ID of the restaurant to be loaded
     * into this view model, this allows the detail view to be created even
     * when the desired restaurant data isn't in memory, usually when
     * deeplinking from a shared link
     */
    init(coordinator: coordinator,
         selectedRestaurantData: PersonalizedRestaurantSearchResult?,
         targetRestaurantID: String? = nil,
         favoriteActionSideEffect: ((PersonalizedRestaurantSearchResult) -> Void)? = nil,
         heroImage: Image? = nil,
         heroTransitionDismissalAction: (() -> Void)? = nil
    ) {
        self.coordinator = coordinator
        self.favoriteActionSideEffect = favoriteActionSideEffect
        self.heroImage = heroImage
        self.insertRestaurantData(selectedRestaurantData: selectedRestaurantData,
                                  targetRestaurantID: targetRestaurantID)
        self.heroTransitionDismissalAction = heroTransitionDismissalAction
    }
    
    // MARK: - Dynamic Data Loader
    /// Insert the already defined restaurant data or acquire it from elsewhere, locally
    /// or remotely
    private func insertRestaurantData(
        selectedRestaurantData: PersonalizedRestaurantSearchResult?,
        targetRestaurantID: String?
    ) {
        if let selectedRestaurantData = selectedRestaurantData {
            self.personalizedRestaurant = selectedRestaurantData
            self.didDataFinishLoading = true
        }
        else {
            Task { @MainActor in
                await self.fetchRequiredRestaurantData(using: targetRestaurantID)
                
                // Image Parsing from remote data
                self.imageViewModel = .init(
                    imageURLString: self.personalizedRestaurant
                        .restaurant
                        .heroImageURL ?? ImageDownloaderService.fallbackRestaurantPlaceholder,
                    imageSize: heroImageViewSize,
                    preloadedImage: heroImage)
                self.didDataFinishLoading = true
                
                return
            }
        }
        
        // Image Parsing
        self.imageViewModel = .init(
            imageURLString: self.personalizedRestaurant
                .restaurant
                .heroImageURL ?? ImageDownloaderService.fallbackRestaurantPlaceholder,
            imageSize: heroImageViewSize,
            preloadedImage: heroImage)
    }
    
    /**
     * Fetches the required restaurant data from available stores or
     * downloads it from the backend
     */
    @MainActor private func fetchRequiredRestaurantData(using restaurantID: String?) async {
        guard let restaurantID = restaurantID
        else { return }
        
        var acquiredRestaurantData: PersonalizedRestaurantSearchResult? = nil
        
        /// Try Homepage Restaurant Store
        
        /// Try Map Restaurant Store
        
        /// Try Favorites Restaurant Store
        
        /// All else failed, fetch from backend
        
        /// Fetch failed, use mock data and inform the
        /// user that the requested resource could not be
        /// found (404)
        
        if let acquiredRestaurantData = acquiredRestaurantData {
            self.personalizedRestaurant = acquiredRestaurantData
        }
        else {
            self.personalizedRestaurant = .mock
            self.didDataFinishLoading = true
        }
    }
    
    // MARK: - State Management
    @MainActor func refresh() {
        
    }
    
    // MARK: - Business Logic
    @MainActor private func toggleFavoriteStatus() async {
        var updatedPersonalizedRestaurantSearchResult: PersonalizedRestaurantSearchResult? = nil
        
        if isFavorited {
            updatedPersonalizedRestaurantSearchResult = await dependencies
                .restaurantInteractor
                .unfavoriteRestaurant(restaurantID: restaurant.id)
        }
        else {
            updatedPersonalizedRestaurantSearchResult = await dependencies
                .restaurantInteractor
                .favoriteRestaurant(restaurantID: restaurant.id)
        }
        
        guard let updatedPersonalizedRestaurantSearchResult = updatedPersonalizedRestaurantSearchResult
        else { return }
        
        self.personalizedRestaurant = updatedPersonalizedRestaurantSearchResult
        
        favoriteActionSideEffect?(personalizedRestaurant)
    }
}
