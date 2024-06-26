//
// FillableSelectionButtonViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 4:52 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

class FillableSelectionButtonViewModel: GenericViewModel {
    // MARK: - Properties
    var title: String,
        data: Any? = nil,
    onSelectionToggleAction: (() -> Void)
    
    // MARK: - Published
    @Published var isSelected: Bool = false
    @Published var disabled: Bool = false
    
    // MARK: - Actions
    var selectionToggleAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            HapticFeedbackDispatcher
                .gentleButtonPress()
            
            self.isSelected.toggle()
            self.onSelectionToggleAction()
        }
    }
    
    // MARK: - Styling
    // Colors
    let selectionColor: Color = Colors.primary_1
    
    var backgroundColor: Color {
        return selectionColor.opacity(isSelected ? 1 : 0)
    }
    
    var foregroundColor: Color {
        return isSelected ? Colors.permanent_white : Colors.primary_1
    }
    
    var borderColor: Color {
        return selectionColor
    }
    
    // Font
    var font: FontStyleRepository = .subtitle_2,
        fontWeight: UIFont.Weight = .medium
    
    init(
        title: String,
        data: Any? = nil,
        isSelected: Bool = false, 
        onSelectionToggleAction: @escaping (() -> Void)
    ) {
        self.title = title
        self.data = data
        self.onSelectionToggleAction = onSelectionToggleAction
        self.isSelected = isSelected
    }
}
