//
// FoodRestrictionSelectionChipViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 2:45 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

class FoodRestrictionSelectionChipViewModel: GenericViewModel {
    // MARK: - Properties
    let foodRestrictionType: FoodRestriction,
        parentViewModel: FoodRestrictionSelectionScreenViewModel
    
    // Selection State
    @Published var isSelected: Bool = false
    
    // MARK: - Styling
    // Assets
    /// Placeholder just in case the food restriction's icon doesn't load
    let placeholderIcon: Image = Icons.getIconImage(named: .taste_profile_cutlery)
    
    // Colors
    let defaultTitleColor: Color = Colors.permanent_white,
        selectionColor: Color = Colors.primary_1
    
    // Dynamic Colors
    var selectionBoxColor: Color { return selectionColor.opacity(0.36)
    }
    
    var titleColor: Color {
        return isSelected ? selectionColor : defaultTitleColor
    }
    
    // Fonts
    let titleFont: FontStyleRepository = .subtitle_2,
        titleFontWeight: UIFont.Weight = .medium
    
    // MARK: - Convenience
    /// Default is english localization
    var foodRestrictionName: String {
        return foodRestrictionType.localizedNames.en
    }
    
    var foodRestrictionImageURLString: String {
        return foodRestrictionType.imageURL
    }
    
    var foodRestrictionImageURL: URL? {
        return foodRestrictionImageURLString.asURL
    }
    
    // MARK: - Actions
    // Selection
    var toggleSelectionAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            let selectedFoodRestrictions = self.parentViewModel.selectedFoodRestrictions
            
            if selectedFoodRestrictions.contains(self.foodRestrictionType) {
                self.parentViewModel
                    .selectedFoodRestrictions
                    .remove(self.foodRestrictionType)
                
                isSelected = false
            }
            else {
                self.parentViewModel
                    .selectedFoodRestrictions
                    .insert(self.foodRestrictionType)
                
                isSelected = true
            }
            
            HapticFeedbackDispatcher
                .gentleButtonPress()
        }
    }
    
    // MARK: - Models
    lazy var imageViewModel: GenericImageViewModel = {
        return .init(imageURLString: self.foodRestrictionImageURLString,
                     placeholderImage: placeholderIcon)
    }()
    
    init(
        foodRestrictionType: FoodRestriction,
        parentViewModel: FoodRestrictionSelectionScreenViewModel
    ) {
        self.foodRestrictionType = foodRestrictionType
        self.parentViewModel = parentViewModel
        
        // Determine initial selectionstate
        self.isSelected = parentViewModel
            .selectedFoodRestrictions
            .contains(foodRestrictionType)
    }
}

