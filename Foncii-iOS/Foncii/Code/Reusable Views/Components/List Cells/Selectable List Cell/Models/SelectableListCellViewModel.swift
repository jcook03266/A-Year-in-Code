//
// SelectableListCellViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/16/23 at 9:10 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

/// A row with text and a radio button that's selectable by a user
/// and can be displayed in a list of results
class SelectableListCellViewModel: GenericViewModel {
    // MARK: - Properties
    /// The textual content being selected by the user
    var textContent: String
    
    // MARK: - Published
    @Published var isSelected: Bool = false
    @Published var isEnabled: Bool = true
    
    // MARK: - Styling
    // Colors
    let textColor: Color = Colors.permanent_white,
        backgroundColor: Color = Colors.dark_grey_1
    
    // Fonts
    let textFont: FontStyleRepository = .body
    
    // MARK: - Actions
    var selectionAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.onSelectAction()
            self.isSelected.toggle()
        }
    }
    
    // External logic to execute when selecting the view
    var onSelectAction: (() -> Void)
    
    init(
        textContent: String,
         isEnabled: Bool,
        isSelected: Bool = false,
        onSelectAction: @escaping (() -> Void) = {}
    ) {
        self.textContent = textContent
        self.isEnabled = isEnabled
        self.isSelected = isSelected
        self.onSelectAction = onSelectAction
    }
}
