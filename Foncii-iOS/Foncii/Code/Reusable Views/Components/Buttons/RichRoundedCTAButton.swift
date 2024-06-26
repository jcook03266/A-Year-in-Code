//
// RichRoundedCTAButton.swift
// Foncii
//
// Created by Justin Cook on 6/25/23 at 7:46 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

/// Rounded CTA Button with an additional image / icon embedded within the
/// button's content
struct RichRoundedCTAButton: View {
    // MARK: - Properties
    var title: String,
        action: (() -> Void),
        disabled: Bool = false,
        icon: Image
    
    // MARK: - Dimensions
    var size: CGSize = .init(width: 124, height: 36),
        cornerRadius: CGFloat = 36,
        iconSize: CGSize = .init(width: 15,
                                 height: 15)
        
        // MARK: - Padding
        /// Don't let the title touch the edges of the container
        var horizontalPadding: CGFloat = 24,
            verticalPadding: CGFloat = 8,
            interItemSpacing: CGFloat = 4
    
    // MARK: - Styling
    // Colors
    var backgroundColor: Color = Colors.primary_1
    
    var foregroundColor: Color = Colors.permanent_white,
        // Font
        font: FontStyleRepository = .caption
    
    var body: some View {
        mainSection
    }
}

// MARK: - Sections
extension RichRoundedCTAButton {
    var mainSection: some View {
        Button {
            action()
            
            HapticFeedbackDispatcher
                .interstitialCTAButtonPress()
        } label: {
            buttonContentSection
        }
        .buttonStyle(.genericSpringyShrink)
        .disabled(disabled)
        .frame(width: size.width,
               height: size.height)
    }
    
    var buttonContentSection: some View {
        ZStack {
            pillView
            
            HStack(spacing: interItemSpacing) {
                iconView
                titleView
            }
            .transition(.scale)
            .padding(.horizontal, horizontalPadding)
            .padding(.vertical, verticalPadding)
        }
    
    }
}

// MARK: - Subviews
extension RichRoundedCTAButton {
    var iconView: some View {
        icon.fittedResizableTemplateImageModifier()
            .frame(width: iconSize.width,
                   height: iconSize.height)
            .foregroundColor(foregroundColor)
    }
    
    var pillView: some View {
        ZStack {
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(backgroundColor)
        }
    }
    
    var titleView: some View {
        Text(title)
            .withFont(font)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .minimumScaleFactor(0.5)
            .foregroundColor(foregroundColor)
    }
}

struct RichRoundedCTAButton_Previews: PreviewProvider {
    static var previews: some View {
        RichRoundedCTAButton(title: "Send",
                             action: {},
                             icon: Icons.getIconImage(named: .send))
    }
}
