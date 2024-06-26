//
// SelectableSettingsMenuRowViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/27/23 at 12:59 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

class SelectableSettingsMenuRowViewModel {
    // MARK: - Properties
    let title: String,
        subtitle: String,
        icon: Image
    
    // MARK: - Actions
    var selectionAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.onSelectAction?()
            HapticFeedbackDispatcher
                .interstitialCTAButtonPress()
        }
    }
    
    var onSelectAction: (() -> Void)? = nil
    
    // MARK: - Styling
    // Assets
    let chevronIndicator: Image = Icons.getIconImage(named: .forward_chevron)
    
    // Colors
    let sideIconColor: Color = Colors.medium_1,
        titleColor: Color = Colors.permanent_white,
        subtitleColor: Color = Colors.neutral_1,
        bottomDividerColor: Color = Colors.permanent_white.opacity(0.20),
        chevronIndicatorColor: Color = Colors.medium_1
    
    // Fonts
    let titleFont: FontStyleRepository = .subtitle_bold,
        subtitleFont: FontStyleRepository = .caption
    
    init(
        title: String,
        subtitle: String,
        icon: Image,
        onSelectAction: (() -> Void)? = nil
    ) {
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.onSelectAction = onSelectAction
    }
}
