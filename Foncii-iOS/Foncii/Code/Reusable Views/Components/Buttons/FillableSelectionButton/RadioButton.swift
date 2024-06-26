//
// RadioButton.swift
// Foncii
//
// Created by Justin Cook on 6/16/23 at 9:13 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct RadioButton: View {
    // MARK: - Properties
    var onSelectAction: (() -> Void) = {}
    
    // MARK: - Styling
    // Assets
    private let radioOutlineIcon: Image = Icons.getIconImage(named: .radio_outline),
                radioFilledIcon: Image = Icons.getIconImage(named: .filled_radio_indicator)
    
    // MARK: - States
    @Binding var isSelected: Bool
    @Binding var isEnabled: Bool
    
    // MARK: - Dimensions
    var size: CGSize = .init(width: 20,
                             height: 20)
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: isSelected)
            .disabled(!isEnabled)
    }
}

// MARK: - Sections
extension RadioButton {
    var mainSection: some View {
        Button {
            HapticFeedbackDispatcher
                .gentleButtonPress()
            
            isSelected.toggle()
            onSelectAction()
        } label: {
            radioIndicator
        }
        .frame(width: size.width,
               height: size.height)
        .buttonStyle(.genericSpringyShrink)
    }
}

// MARK: - Subviews
extension RadioButton {
    var radioIndicator: some View {
        Group {
            if isSelected {
                radioFilledIcon
                    .fittedResizableOriginalImageModifier()
            }
            else {
                radioOutlineIcon
                    .fittedResizableOriginalImageModifier()
            }
        }
        .transition(.scale.animation(.spring()))
    }
}

struct RadioButton_Previews: PreviewProvider {
    static var previews: some View {
        RadioButton(onSelectAction: {},
                    isSelected: .constant(true),
                    isEnabled: .constant(true))
    }
}
