//
// DiscoveryRestaurantViewModel.swift
// Foncii
//
// Created by Justin Cook on 4/29/23 at 5:31 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture
import OrderedCollections

class DiscoveryRestaurantChipViewModel: GenericViewModel, Hashable {
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.restaurantActionDispatcher) var restaurantActionDispatcher
    
    // MARK: - Properties
    var id: String {
        return restaurant.id
    }
    
    /// The restaurant information to display
    let restaurant: DiscoveryRestaurant
    
    /// The selection state of the view according to the parent view which
    /// is the single source of truth
    var isSelected: Bool {
        return dependencies
            .restaurantManager
            .discoveryRestaurantManager
            .isRestaurantSelected(restaurant: self.restaurant)
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let restaurantManager: RestaurantManager = inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Styling
    // Colors
    let cuisineTypeTextColor: Color = Colors.neutral_1,
        selectionHighlightColor: Color = Colors.primary_1,
        selectionHighlightOverlayColor: Color = Colors.primary_1.opacity(0.30)
    
    var restaurantNameTextColor: Color {
        return isSelected ? selectionHighlightColor : Colors.permanent_white
    }
    
    // Fonts
    let textFont: FontStyleRepository = .caption
    
    // MARK: - Actions
    var selectionAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            HapticFeedbackDispatcher.detailChipSelected()
            
            dependencies
                .restaurantManager
                .discoveryRestaurantManager
                .toggleRestaurantSelection(restaurant: self.restaurant)
        }
    }
    
    // MARK: - Convenience
    var restaurantCuisineType: String {
        let categories = restaurant.categories ?? []
        return categories.first ?? ""
    }
    
    // MARK: - Models
    let imageViewModel: RestaurantImageViewModel
    
    init(
        restaurant: DiscoveryRestaurant
    ) {
        self.restaurant = restaurant
        self.imageViewModel = .init(imageURLString: restaurant.heroImageURL ??
                                    ImageDownloaderService.fallbackRestaurantPlaceholder,
                                    imageSize: .small)
    }
    
    // MARK: - Equatable Conformance
    static func == (
        lhs: DiscoveryRestaurantChipViewModel,
        rhs: DiscoveryRestaurantChipViewModel
    ) -> Bool {
        return lhs.id == rhs.id
    }
    
    // MARK: - Hashable Conformance
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.id)
    }
}
