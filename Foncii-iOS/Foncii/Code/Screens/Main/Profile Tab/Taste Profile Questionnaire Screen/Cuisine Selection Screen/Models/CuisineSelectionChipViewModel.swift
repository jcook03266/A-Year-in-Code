//
// CuisineSelectionChipViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/29/23 at 9:37 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

class CuisineSelectionChipViewModel: GenericViewModel {
    // MARK: - Properties
    let cuisineType: Cuisine,
        parentViewModel: CuisineSelectionScreenViewModel
    
    // Selection State
    @Published var isSelected: Bool = false
    
    // MARK: - Styling
    // Assets
    /// Placeholder just in case the cuisine's icon doesn't load
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
    var cuisineName: String {
        return cuisineType.localizedNames.en
    }
    
    var cuisineImageURLString: String {
        return cuisineType.imageURL
    }
    
    var cuisineImageURL: URL? {
        return cuisineImageURLString.asURL
    }
    
    // MARK: - Actions
    // Selection
    var toggleSelectionAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            let selectedCuisines = self.parentViewModel.selectedCuisines
            
            if selectedCuisines.contains(self.cuisineType) {
                self.parentViewModel
                    .selectedCuisines
                    .remove(self.cuisineType)
                
                isSelected = false
            }
            else {
                self.parentViewModel
                    .selectedCuisines
                    .insert(self.cuisineType)
                
                isSelected = true
            }
            
            HapticFeedbackDispatcher
                .gentleButtonPress()
        }
    }
    
    // MARK: - Models
    lazy var imageViewModel: GenericImageViewModel = {
        return .init(imageURLString: self.cuisineImageURLString,
                     placeholderImage: placeholderIcon)
    }()
    
    init(
        cuisineType: Cuisine,
        parentViewModel: CuisineSelectionScreenViewModel
    ) {
        self.cuisineType = cuisineType
        self.parentViewModel = parentViewModel
        
        // Determine initial selectionstate
        self.isSelected = parentViewModel
            .selectedCuisines
            .contains(cuisineType)
    }
}
