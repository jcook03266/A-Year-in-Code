//
// CuisineSelectionScreenViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/29/23 at 8:59 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import OrderedCollections
import FonciiApollo

/// Small widget for selecting cuisine types for the user's taste profile update questionnaire
class CuisineSelectionScreenViewModel: GenericViewModel {
    // MARK: - Properties
    var cuisines: OrderedSet<Cuisine> {
        return dependencies
            .staticAssetController
            .cuisines
    }
    
    /// User Properties
    var userTasteProfile: UserTasteProfile? {
        return dependencies
            .tasteProfileManager
            .tasteProfile
    }
    
    var userTasteProfileFavoritedCuisineIDs: [String] {
        guard let userTasteProfile = userTasteProfile
        else { return [] }
        
        return userTasteProfile.favoriteCuisines
    }
    
    var lastPageIndex: Int = 0
    
    // MARK: - Published
    // Entity Selection
    @Published var selectedCuisines: Set<Cuisine> = []
    
    // Navigation
    /// Min: 0, Max: [cuisineTypeTotalPages - 1]
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
    
    var totalCuisineTypes: Int {
        return cuisines.count
    }
    
    var cuisineTypesPerPage: Int {
        return cuisineTypeRows * cuisineTypeColumns
    }
    
    var cuisineTypeTotalPages: Int {
        guard totalCuisineTypes > 0
                && cuisineTypesPerPage > 0
        else { return 0 }
        
        return totalCuisineTypes / cuisineTypesPerPage
    }
    
    // Zero-indexed page index for the last page in the collection
    var maxPageIndex: Int {
        return cuisineTypeTotalPages - 1
    }
    
    /// Controls whether or not to display the forward arrow
    var canNavigateForward: Bool {
        return currentPageIndex < maxPageIndex
    }
    
    var canNavigateBackward: Bool {
        return currentPageIndex > minPageIndex
    }
    
    // MARK: - Limits
    private let cuisineTypeRows: Int = 3,
                cuisineTypeColumns: Int = 3,
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
    let questionDescription: String = LocalizedStrings.getLocalizedString(for: .TASTE_PROFILE_CUISINE_PREFERENCE_QUESTION_TITLE)
    
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
        populateInitialCuisineSelection()
    }
    
    // MARK: - Data Manipulation and Parsing
    /// Converts the favorited cuisines of the current user's taste profile into their actual cuisine type counterparts
    func convertFavoritedCuisineIDsIntoCuisines() -> [Cuisine] {
        return userTasteProfileFavoritedCuisineIDs
            .compactMap { userFavoritedCuisineID in
                return cuisines.first { cuisine in
                    cuisine.id == userFavoritedCuisineID
                }
            }
    }
    
    /// Populates the initital cuisine selection with the user's already favorited cuisines from their taste profile
    /// Updating the local selections in this entity doesn't mutate the user's taste profile, only when the user updates their taste profile
    /// based on these selections is the taste profile actually updated
    func populateInitialCuisineSelection() {
        let userFavoritedCuisines = convertFavoritedCuisineIDsIntoCuisines()
        
        self.selectedCuisines = Set(userFavoritedCuisines)
    }
    
    /// Computes and returns the cuisines for a specific page
    func getCuisinesForPage(with index: Int) -> OrderedSet<Cuisine> {
        let startIndex = (index * cuisineTypesPerPage),
            endIndex = startIndex + cuisineTypesPerPage
        
        return OrderedSet(cuisines
            .suffix(from: startIndex)
            .prefix(endIndex))
    }
}
