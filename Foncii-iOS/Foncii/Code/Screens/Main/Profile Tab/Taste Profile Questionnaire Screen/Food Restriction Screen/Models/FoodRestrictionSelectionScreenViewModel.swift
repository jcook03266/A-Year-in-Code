//
// FoodRestrictionSelectionScreenViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 2:45 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import OrderedCollections
import FonciiApollo

/// Small widget for selecting food / dietary restriction types for the user's taste profile update questionnaire
class FoodRestrictionSelectionScreenViewModel: GenericViewModel {
    // MARK: - Properties
    var foodRestrictions: OrderedSet<FoodRestriction> {
        return dependencies
            .staticAssetController
            .foodRestrictions
    }
    
    /// User Properties
    var userTasteProfile: UserTasteProfile? {
        return dependencies
            .tasteProfileManager
            .tasteProfile
    }
    
    var userTasteProfileSelectedFoodRestrictionIDs: [String] {
        guard let userTasteProfile = userTasteProfile
        else { return [] }
        
        return userTasteProfile.foodRestrictions
    }
    
    var lastPageIndex: Int = 0
    
    // MARK: - Published
    // Entity Selection
    @Published var selectedFoodRestrictions: Set<FoodRestriction> = []
    
    // Navigation
    /// Min: 0, Max: [foodRestrictionTypeTotalPages - 1]
    @Published var currentPageIndex: Int = 0
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let staticAssetController: StaticAssetController = inject(),
            tasteProfileManager: UserTasteProfileManager = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Convenience
    // Navigation History for animating transitions
    var didMoveForwards: Bool {
        return lastPageIndex < currentPageIndex
    }
    
    var didMoveBackwards: Bool {
        return lastPageIndex > currentPageIndex
    }
    
    var totalFoodRestrictionTypes: Int {
        return foodRestrictions.count
    }
    
    var foodRestrictionTypesPerPage: Int {
        return foodRestrictionTypeRows * foodRestrictionTypeColumns
    }
    
    var foodRestrictionTypeTotalPages: Int {
        guard totalFoodRestrictionTypes > 0
                && foodRestrictionTypesPerPage > 0
        else { return 0 }
        
        return totalFoodRestrictionTypes / foodRestrictionTypesPerPage
    }
     
    // Zero-indexed page index for the last page in the collection
    var maxPageIndex: Int {
        return foodRestrictionTypeTotalPages - 1
    }
    
    /// Controls whether or not to display the forward arrow
    var canNavigateForward: Bool {
        return currentPageIndex < maxPageIndex
    }
    
    var canNavigateBackward: Bool {
        return currentPageIndex > minPageIndex
    }
    
    // MARK: - Limits
    private let foodRestrictionTypeRows: Int = 2,
                foodRestrictionTypeColumns: Int = 3,
                minPageIndex: Int = 0
    
    // MARK: - Styling
    // Assets
    let forwardNavigationIndicatorIcon: Image = Icons.getIconImage(named: .forward_chevron),
        backwardNavigationIndicatorIcon: Image = Icons.getIconImage(named: .back_chevron)
    
    // Colors
    let navigationIndicatorColor: Color = Colors.medium_1,
        questionDescriptionColor: Color = Colors.permanent_white
    
    // Fonts
    let questionDescriptionFont: FontStyleRepository = .heading_3
    
    // MARK: - Localized Text
    let questionDescription: String = LocalizedStrings.getLocalizedString(for: .TASTE_PROFILE_FOOD_RESTRICTION_PREFERENCE_QUESTION_TITLE)
    
    // MARK: - Actions
    // Navigation
    var navigateToNextPageAction: (() -> Void) {
        return { [weak self] in
            guard let self = self,
                  self.currentPageIndex < maxPageIndex
            else { return }
            
            self.currentPageIndex += 1
            
            HapticFeedbackDispatcher
                .gentleButtonPress()
        }
    }
    
    var navigateToPreviousPageAction: (() -> Void) {
        return { [weak self] in
            guard let self = self,
                  self.currentPageIndex > minPageIndex
            else { return }
            
            self.currentPageIndex -= 1
            
            HapticFeedbackDispatcher
                .gentleButtonPress()
        }
    }
    
    init() {
        populateInitialFoodRestrictionSelection()
    }
    
    // MARK: - Data Manipulation and Parsing
    /// Converts the selected food restrictions of the current user's taste profile into their actual food restriction type counterparts
    func convertFromSelectedFoodRestrictionIDs() -> [FoodRestriction] {
        return userTasteProfileSelectedFoodRestrictionIDs
            .compactMap { userSelectedFoodRestrictionID in
                return foodRestrictions.first { foodRestriction in
                    foodRestriction.id == userSelectedFoodRestrictionID
                }
            }
    }
    
    /// Populates the initital food restriction selection with the user's already selected food restrictions from their taste profile
    /// Updating the local selections in this entity doesn't mutate the user's taste profile, only when the user updates their taste profile
    /// based on these selections is the taste profile actually updated
    func populateInitialFoodRestrictionSelection() {
        let userSelectedFoodRestrictions = convertFromSelectedFoodRestrictionIDs()
        
        self.selectedFoodRestrictions = Set(userSelectedFoodRestrictions)
    }
    
    /// Computes and returns the food restrictions for a specific page
    func getFoodRestrictionsForPage(with index: Int) -> OrderedSet<FoodRestriction> {
        let startIndex = (index * foodRestrictionTypesPerPage),
        endIndex = startIndex + foodRestrictionTypesPerPage
        
        return OrderedSet(
            foodRestrictions
            .suffix(from: startIndex)
            .prefix(endIndex)
        )
    }
}

