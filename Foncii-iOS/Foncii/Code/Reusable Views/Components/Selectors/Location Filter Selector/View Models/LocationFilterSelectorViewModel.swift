//
// LocationFilterSelectorViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/26/23 at 5:34 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture
import OrderedCollections
import ApolloTestSupport
import FonciiApollo
import CoreLocation

class LocationFilterSelectorViewModel: GenericViewModel {
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.restaurantActionDispatcher) var restaurantActionDispatcher
    
    // MARK: - Properties
    var majorCities: OrderedSet<MajorCity> {
        return OrderedSet(dependencies
            .staticAssetController
            .majorCities
            .prefix(majorCitiesToDisplayLimit))
    }
    
    /// An array of formatted major cities text strings [City, State]
    var majorCitiesFormattedStrings: [String] {
        return majorCities.map { majorCity in
            let formattedCityStateString =  majorCity.name.capitalizeAllFirstLetters
            + ", "
            + majorCity.abbreviatedState.uppercased()
            
            return formattedCityStateString
        }
    }
    
    var mockMajorCitiesFormattedStrings: [String] {
        return mockMajorCities.map { mockMajorCity in
            let formattedCityStateString =  mockMajorCity.name.capitalizeAllFirstLetters
            + ", "
            + mockMajorCity.abbreviatedState.uppercased()
            
            return formattedCityStateString
        }
    }
    
    let mockMajorCities: [MajorCity] = {
        var mocks: [MajorCity] = []
        let mockMajorCityCount: Int = 4
        
        for _ in 0..<mockMajorCityCount {
            let randomMultiplication = ([1,2,3,4,5,6].shuffled().randomElement()) ?? 0 *
            ([1,2,3,4,5,6].reversed().shuffled().randomElement() ?? 0)
            
            let mockMajorCity = Mock<FonciiApollo.MajorCity>()
            mockMajorCity.id = UUID().uuidString
            mockMajorCity.name = "Random City" + randomMultiplication.description
            mockMajorCity.abbreviatedState = "NY"
            
            mocks.append(.from(mockMajorCity))
        }
        
        return mocks
    }()
    
    let targetStoreToFilter: StoreToFilter
    
    var shouldDisplayLoadingIndicator: Bool {
        return majorCities.isEmpty
    }
    
    // MARK: - Limits
    /// Artificial limit on the amount of cities to display with this selector
    let majorCitiesToDisplayLimit: Int = 5
    
    // MARK: - Published
    @Published var selectedCityString: String? = nil
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let staticAssetController: StaticAssetController = inject(),
            restaurantManager: RestaurantManager = inject()
    }
    let dependencies = Dependencies()
    
    init(targetStoreToFilter: StoreToFilter) {
        self.targetStoreToFilter = targetStoreToFilter
    }
    
    // MARK: - Modular Properties
    /// The target store to reference when selecting and deselecting filters, this allows this component to share its state across different screens such as when the user presses view all to select a specific city, and if that city matches one of the major cities depicted then this component updates and vice versa
    enum StoreToFilter: String, CaseIterable {
        case favoritedRestaurants
        case restaurantRecommendations
    }
    
    // MARK: - Factory
    func createMajorCityFilterButtonViewModel(
        formattedMajorCityString: String
    ) -> FillableSelectionButtonViewModel {
        let restaurantManager: RestaurantManager = self.dependencies
            .restaurantManager
        
        var isSelected: Bool = false
        
        let model: FillableSelectionButtonViewModel = .init(title: formattedMajorCityString) { [weak self] in
            guard let self = self
            else { return }
            var isSelected: Bool = false
            
            switch self.targetStoreToFilter {
            case .favoritedRestaurants:
                let currentLocationFilters = restaurantManager
                    .favoritedRestaurantManager
                    .currentLocationFilters
                
                isSelected = currentLocationFilters.contains(formattedMajorCityString)
                
                if isSelected {
                    self.restaurantActionDispatcher
                        .removeFavoritedRestaurantsLocationFilter(locationFilterString: formattedMajorCityString)
                }
                else {
                    self.restaurantActionDispatcher
                        .addFavoriteRestaurantLocationFilter(locationFilterString: formattedMajorCityString)
                }
            case .restaurantRecommendations:
                let currentLocationFilters = restaurantManager
                    .recommendedRestaurantManager
                    .currentLocationFilters
                
                isSelected = currentLocationFilters.contains(formattedMajorCityString)
                
                if isSelected {
                    self.restaurantActionDispatcher
                        .removeRecommendedRestaurantsLocationFilter(locationFilterString: formattedMajorCityString)
                }
                else {
                    self.restaurantActionDispatcher
                        .addRecommendedRestaurantsLocationFilter(locationFilterString: formattedMajorCityString)
                }
            }
        }
        
        /// Initial selection state of the filter button
        switch self.targetStoreToFilter {
        case .favoritedRestaurants:
            let currentLocationFilters = restaurantManager
                .favoritedRestaurantManager
                .currentLocationFilters
            
            isSelected = currentLocationFilters.contains(formattedMajorCityString)
            
        case .restaurantRecommendations:
            let currentLocationFilters = restaurantManager
                .recommendedRestaurantManager
                .currentLocationFilters
            
            isSelected = currentLocationFilters.contains(formattedMajorCityString)
        }
        
        model.isSelected = isSelected
        
        return model
    }
}
