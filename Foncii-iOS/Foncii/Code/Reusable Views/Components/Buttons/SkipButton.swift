//
// SkipButton.swift
// Foncii
//
// Created by Justin Cook on 7/1/23 at 1:06 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

/// A custom skip button used in custom scenes
/// to skip over some sequential content that contains optional selections or content for the user to interact with
struct SkipButton: View {
    // MARK: - Properties
    // Color
    private let fontColor: Color = Colors.permanent_white
    
    // Font
    private let font: FontStyleRepository = .caption_bold
    
    // MARK: - Localized Text
    private let title: String = LocalizedStrings.getLocalizedString(for: .SKIP).uppercased()
    
    // Actions
    var skipAction: (() -> Void)
    
    // MARK: - Dimensions
    var size: CGSize = .init(width: 14,
                             height: 14)
    
    var body: some View {
        button
    }
}

// MARK: - Subviews
extension SkipButton {
    var button: some View {
        Button {
            HapticFeedbackDispatcher.genericButtonPress()
            
            skipAction()
        } label: {
            Text(title)
                .withFont(font)
                .fixedSize(horizontal: false, vertical: true)
                .lineLimit(1)
                .foregroundColor(fontColor)
        }
        .buttonStyle(.genericSpringyShrink)
    }
}

struct SkipButton_Previews: PreviewProvider {
    static var previews: some View {
        GeometryReader { geom in
            ZStack {
                SkipButton(skipAction: {})
            }
            .frame(width: geom.size.width,
                   height: geom.size.height)
            .background(Colors.black_1)
        }
    }
}

