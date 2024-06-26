//
// FPRestaurantViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/5/23 at 10:50 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import SwiftUI

/**
 * A full-personalized restaurant view model for a full-personalized
 * restaurant view that displays restaurant data in a large format suited
 * for the FYP tab
 */
class FPRestaurantViewModel<coordinator: Coordinator>: CoordinatedGenericViewModel {
    // MARK: - Properties
    var coordinator: coordinator
    
    /// Personalized Restaurant Search Result
    @Published var restaurantSearchResult: PersonalizedRestaurantSearchResult
    
    // Presentation
    @Published var isPresentingDetailView: Bool = false
    
    /// True if this model's detail view is current being presented, false otherwise
    var isSelected: Bool {
        return false
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let restaurantInteractor: RestaurantInteractionsManager = FPRestaurantViewModel.Dependencies.inject(),
            restaurantManager: RestaurantManager = FPRestaurantViewModel.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Styling
    // Assets
    let filledHeartIcon: Image = Icons.getIconImage(named: .heart_favorite_filled),
        unfilledHeartIcon: Image = Icons.getIconImage(named: .heart_favorite_unfilled),
        yelpIcon: Image = Images.getImage(named: .yelp_logo),
        googleIcon: Image = Images.getImage(named: .google_logo)
    
    // Colors
    let restaurantNameColor: Color = Colors.permanent_white,
        separatorDotColor: Color = Colors.medium_1,
        restaurantPropertiesColor: Color = Colors.neutral_1,
        percentageMatchPercentColor: Color = Colors.permanent_white,
        percentageMatchBackgroundColor: Color = Colors.primary_1,
        heroImageOverlayGradient: LinearGradient = Colors.restaurantHeroOverlayGradient
    
    // Fonts
    let restaurantPropertiesFont: FontStyleRepository = .caption,
        restaurantNameFont: FontStyleRepository = .body_bold,
        percentageMatchPercentFont: FontStyleRepository = .subtitle_2_bold
    
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
    
    /// Presents the detail view for this restaurant
    /// using a context animation to animate the geometry of the
    /// view outwards
    var selectionAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            HapticFeedbackDispatcher
                .genericButtonPress()
            
            /// Present the detail view via a local hero transition instead of regular full cover
            self.isPresentingDetailView = true
        }
    }
    
    /// Custom logic to execute within the based favorite action closure
    var favoriteActionSideEffect: ((PersonalizedRestaurantSearchResult) -> Void)? = nil
    
    var heroPresentationDismissalAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.isPresentingDetailView = false
        }
    }
    
    // MARK: - Convenience
    var hasCategories: Bool {
        guard let categories = restaurant.categories
        else { return false }
        
        return !categories.isEmpty
    }
    
    var isFavorited: Bool {
        return restaurantSearchResult.isFavorited ?? false
    }
    
    var restaurantName: String {
        return restaurant
            .name
    }
    
    var yelpRating: String {
        return restaurant
            .yelpProperties?
            .rating?
            .description
        ?? "N/A"
    }
    
    var googleRating: String {
        return restaurant
            .googleProperties?
            .rating?
            .description
        ?? "N/A"
    }
    
    var percentMatchPercentage: String {
        return restaurantSearchResult.percentageMatchAsPercent
    }
    
    var restaurantFirstCategoryType: String {
        return restaurant
            .categories?
            .first ?? ""
    }
    
    var priceLevelInDollarSigns: String {
        return restaurant.priceLevelAsDollarSigns
    }
    
    /// Actual restaurant data
    var restaurant: PersonalizedRestaurant {
        return restaurantSearchResult.restaurant
    }
    
    // MARK: - Models
    let imageViewModel: RestaurantImageViewModel
    
    // For Custom Hero Presentations
    var restaurantDetailViewModel: RestaurantDetailViewModel<coordinator> {
        let heroImage = imageViewModel.image
        
        return .init(coordinator: self.coordinator,
                     selectedRestaurantData: self.restaurantSearchResult,
                     targetRestaurantID: nil,
                     favoriteActionSideEffect: self.favoriteActionSideEffect,
                     heroImage: heroImage,
                     heroTransitionDismissalAction: heroPresentationDismissalAction)
    }
    
    init(
        restaurantSearchResult: PersonalizedRestaurantSearchResult,
        coordinator: coordinator,
        favoriteActionSideEffect: ((PersonalizedRestaurantSearchResult) -> Void)? = nil
    ) {
        self.restaurantSearchResult = restaurantSearchResult
        self.coordinator = coordinator
        self.favoriteActionSideEffect = favoriteActionSideEffect
        
        // Image Parsing
        self.imageViewModel = .init(imageURLString: restaurantSearchResult.restaurant.heroImageURL ??
                                    ImageDownloaderService.fallbackRestaurantPlaceholder,
                                    imageSize: .mediumChip)
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
        
        self.restaurantSearchResult = updatedPersonalizedRestaurantSearchResult
        
        favoriteActionSideEffect?(restaurantSearchResult)
    }
}
