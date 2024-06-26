//
// SlidingContextSwitchTabViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 11:47 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

class SlidingContextSwitchTabViewModel: GenericViewModel, Hashable {
    // MARK: - Properties
    let id: UUID = .init(),
        title: String,
        parentViewModel: SlidingContextSwitchViewModel
    
    var onSelectAction: (() -> Void)? = nil
    
    // Optional icon to include above the text
    var icon: Image? = nil
    
    // MARK: - State Management
    var isSelected: Bool {
        return parentViewModel
            .isTabCurrentlySelected(tabViewModel: self)
    }
    
    // MARK: - Styling
    // Colors
    let selectedForegroundColor = Colors.primary_1,
        unselectedForegroundColor = Colors.medium_1
    
    // Fonts
    let titleFont: FontStyleRepository = .caption
    
    // MARK: - Actions
    var selectionToggleAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            HapticFeedbackDispatcher.genericButtonPress()
            
            self.parentViewModel
                .selectTab(tabViewModel: self,
                           onSelectAction: self.onSelectAction)
        }
    }
    
    // MARK: - Convenience
    var titleString: String {
        return title.uppercased()
    }
    
    var currentForegroundColor: Color {
        return isSelected ? selectedForegroundColor : unselectedForegroundColor
    }
    
    init(
        title: String,
        parentViewModel: SlidingContextSwitchViewModel,
        icon: Image? = nil,
        onSelectAction: (() -> Void)? = nil
    ) {
        self.title = title
        self.parentViewModel = parentViewModel
        self.icon = icon
        self.onSelectAction = onSelectAction
        
        // Insert tab view model into parent
        self.parentViewModel
            .insertTab(tabViewModel: self)
    }
    
    // MARK: - Protocol Conformance
    static func == (
        lhs: SlidingContextSwitchTabViewModel,
        rhs: SlidingContextSwitchTabViewModel
    ) -> Bool {
        return lhs.id == rhs.id
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.id)
    }
}
