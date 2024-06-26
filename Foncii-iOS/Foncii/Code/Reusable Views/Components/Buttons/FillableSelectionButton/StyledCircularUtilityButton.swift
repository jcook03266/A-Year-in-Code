//
// StyledCircularUtilityButton.swift
// Foncii
//
// Created by Justin Cook on 7/18/23 at 11:20 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

/// Reusable base template for close button and other similar
/// opaque or non-encased button types
struct StyledCircularUtilityButton: View {
    // MARK: - Properties
    // Styling
    enum Style: String, Hashable {
        case plain
        case encased
    }
    
    var style: Style = .plain
    
    // Color
    var tintColor: Color {
        switch style {
        case .plain:
            return Colors.medium_1
        case .encased:
            return Colors.permanent_white
        }
    }
    
    var backgroundColor: Color {
        switch style {
        case .plain:
            return .clear
        case .encased:
            let opacityLevel: CGFloat = 0.4
            
            return Colors.black_1
                .opacity(opacityLevel)
        }
    }
    
    // Actions
    var action: (() -> Void)
    
    var icon: Image = Icons
        .getIconImage(named: .share)
    
    // MARK: - Dimensions
    var size: CGSize = .init(width: 24,
                             height: 24)
    
    var desiredIconSize: CGSize? = nil
    
    var iconSize: CGSize {
        switch style {
        case .plain:
            /// Slightly enlarged when no background
            /// to be more visually appealing
            return desiredIconSize ??
                .init(width: 12,
                         height: 12)
        case .encased:
            return desiredIconSize ??
                .init(width: 9,
                         height: 9)
        }
    }
    
    var body: some View {
        button
    }
}

// MARK: - Subviews
extension StyledCircularUtilityButton {
    var button: some View {
        Button {
            action()
            HapticFeedbackDispatcher
                .gentleButtonPress()
        } label: {
            ZStack {
                Circle()
                    .fill(backgroundColor)
                
                image
            }
        }
        .buttonStyle(.genericSpringyShrink)
        .frame(width: size.width,
               height: size.height)
    }
    
    var image: some View {
        icon
            .filledResizableTemplateImageModifier()
            .foregroundColor(tintColor)
            .frame(width: iconSize.width,
                   height: iconSize.height)
    }
    
    var encasingBackground: some View {
        Circle()
            .fill()
    }
}

struct StyledCircularUtilityButton_Previews: PreviewProvider {
    static var previews: some View {
        GeometryReader { geom in
            VStack {
                CloseButton(style: .encased,
                            closeAction: {})
            }
            .frame(width: geom.size.width,
                   height: geom.size.height)
            .background(Colors.black_1)
        }
    }
}

