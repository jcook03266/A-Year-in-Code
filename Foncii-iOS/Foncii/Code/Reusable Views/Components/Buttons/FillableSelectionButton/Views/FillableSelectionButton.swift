//
// FillableSelectionButton.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 4:12 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct FillableSelectionButton: View {
    // MARK: - Observed
    @StateObject var model: FillableSelectionButtonViewModel
    
    // MARK: - Dimensions
    var height: CGFloat = 32,
        cornerRadius: CGFloat = 36,
        borderWidth: CGFloat = 1
    
    // MARK: - Padding
    var horizontalPadding: CGFloat = 20
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.isSelected)
    }
}

// MARK: - Sections
extension FillableSelectionButton {
    var mainSection: some View {
        Button(action: model.selectionToggleAction)
        {
            buttonContentSection
        }
        .frame(height: height)
        .buttonStyle(.genericSpringyShrink)
        .disabled(model.disabled)
    }
    
    var buttonContentSection: some View {
        VStack(spacing: 0) {
                titleView
                    .padding(.horizontal, horizontalPadding)
            }
        .frame(height: height)
        .background(pillView)
    }
}

// MARK: - Subviews
extension FillableSelectionButton {
    var pillView: some View {
        ZStack {
            RoundedRectangle(cornerRadius: cornerRadius)
                .strokeBorder(model.borderColor,
                              lineWidth: borderWidth)
            
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(model.backgroundColor)
        }
    }
    
    var titleView: some View {
        Text(model.title)
            .withFont(model.font,
                      weight: model.fontWeight)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .minimumScaleFactor(0.5)
            .foregroundColor(model.foregroundColor)
    }
}

struct FillableSelectionButton_Previews: PreviewProvider {
    static var previews: some View {
        HStack {
            FillableSelectionButton(model: .init(title: "Breakfast", onSelectionToggleAction: {}))
            
            FillableSelectionButton(model: .init(title: "Lunch", onSelectionToggleAction: {}))
        }
    }
}
