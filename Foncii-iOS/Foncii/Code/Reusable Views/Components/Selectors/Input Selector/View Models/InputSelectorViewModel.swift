//
// InputSelectorViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/16/23 at 4:27 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

class InputSelectorViewModel: GenericViewModel {
    // MARK: - Published
    @Published var fieldTextContents: String = ""
    @Published var isSelected: Bool = false
    
    // MARK: - Styling
    // Assets
    var inFieldIcon: Image
    
    // Colors
    var borderColor: Color {
        return isSelected ? selectionColor : defaultBorderColor
    }
    
    let selectionColor: Color = Colors.primary_1,
defaultBorderColor: Color = Colors.medium_dark_grey_1,
textColor: Color = Colors.neutral_1,
        iconColor: Color = Colors.medium_1
    
    // Fonts
    let textFont: FontStyleRepository = .caption
    
    // MARK: - Actions
    var selectionAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            HapticFeedbackDispatcher
                .genericButtonPress()
            
            self.didSelectAction?()
            
            isSelected.toggle()
        }
    }
    
    var didSelectAction: (() -> Void)?
    
    init(fieldTextContents: String,
         inFieldIcon: Image,
         didSelectAction: (() -> Void)? = nil,
         isSelected: Bool = false) {
        self.fieldTextContents = fieldTextContents
        self.inFieldIcon = inFieldIcon
        self.didSelectAction = didSelectAction
        self.isSelected = isSelected
    }
    
    // MARK: - State Management
    func deselect() {
        isSelected = false
    }
}
