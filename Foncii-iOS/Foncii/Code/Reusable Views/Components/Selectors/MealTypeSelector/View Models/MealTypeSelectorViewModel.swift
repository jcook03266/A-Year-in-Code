//
// MealTypeSelectorViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 5:16 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture
import OrderedCollections
import ApolloTestSupport
import FonciiApollo

class MealTypeSelectorViewModel: GenericViewModel {
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.restaurantActionDispatcher) var restaurantActionDispatcher
    
    // MARK: - Properties
    var mealTypes: OrderedSet<MealType> {
        return dependencies
            .staticAssetController
            .mealTypes
    }
    
    let mockMealTypes: [MealType] = {
        var mocks: [MealType] = []
        let mockMealTypeCount: Int = 4
        
        for _ in 0..<mockMealTypeCount {
            let mockMealType = Mock<FonciiApollo.MealType>()
            mockMealType.id = UUID().uuidString
            mockMealType.localizedNames = .init(en: "Breakfast")
            
            mocks.append(.from(mockMealType))
        }
        
        return mocks
    }()
    
    var shouldDisplayLoadingIndicator: Bool {
        return mealTypes.isEmpty
    }
    
    // MARK: - Singleton
    static let shared: MealTypeSelectorViewModel = .init()
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let staticAssetController: StaticAssetController = inject(),
            restaurantManager: RestaurantManager = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Actions
    var onSelectAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            Task { @MainActor in
                await self.dependencies
                    .restaurantManager
                    .homeFeedRestaurantManager
                    .reload()
            }
        }
    }
    
    private init() {}
    
    // MARK: - Factory
    func createMealTypeFilterButtonViewModel(
        mealType: MealType
    ) -> FillableSelectionButtonViewModel {
        let mealTypeName: String = mealType.localizedNames.en,
            model: FillableSelectionButtonViewModel = .init(title: mealTypeName) { [weak self] in
                guard let self = self
                else { return }
                
                let isSelected: Bool = dependencies
                    .restaurantManager
                    .selectedMealTypeFilters
                    .contains(mealType)
                
                if isSelected {
                    self.restaurantActionDispatcher
                        .deselectMealTypeFilter(mealType: mealType)
                }
                else {
                    self.restaurantActionDispatcher
                        .selectMealTypeFilter(selectedMealType: mealType)
                }
                
                self.onSelectAction()
            }
        
        model.isSelected = dependencies
            .restaurantManager
            .selectedMealTypeFilters
            .contains(mealType)
        
        return model
    }
}
