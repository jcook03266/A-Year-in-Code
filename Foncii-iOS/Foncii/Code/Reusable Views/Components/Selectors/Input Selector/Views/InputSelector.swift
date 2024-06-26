//
// InputSelector.swift
// Foncii
//
// Created by Justin Cook on 6/16/23 at 4:26 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct InputSelector: View {
    // MARK: - Observed
    // Local
    @ObservedObject var model: InputSelectorViewModel
    
    // MARK: - Dimensions
    private let height: CGFloat = 48,
                cornerRadius: CGFloat = 36,
                borderWidth: CGFloat = 1,
                iconSize: CGSize = .init(width: 18,
                                         height: 18)
    
    // MARK: - Padding
    private let fieldItemSpacing: CGFloat = 15,
                fieldContentsHorizontalPadding: CGFloat = 24,
                fieldContentsVerticalPadding: CGFloat = 15
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.isSelected)
    }
}

// MARK: - Sections
extension InputSelector {
    var mainSection: some View {
        HStack(spacing: 0) {
            selectableField
        }
        .frame(height: height)
    }
    
    var selectableField: some View {
        Button {
            model.selectionAction()
        } label: {
            ZStack {
                fieldBackground
                fieldContent
            }
        }
    }
    
    var fieldContent: some View {
        HStack(spacing: fieldItemSpacing) {
            inFieldIcon
            fieldInputTextContent
            
            Spacer()
        }
        .padding(.vertical,
                 fieldContentsVerticalPadding)
        .padding(.horizontal,
                 fieldContentsHorizontalPadding)
    }
}

// MARK: - Subviews
extension InputSelector {
    var inFieldIcon: some View {
        model.inFieldIcon.fittedResizableOriginalImageModifier()
            .frame(width: iconSize.width,
                   height: iconSize.height)
        
    }
    
    var fieldBackground: some View {
            RoundedRectangle(cornerRadius: cornerRadius)
            .strokeBorder(model.borderColor,
                          style: .init(lineWidth: borderWidth))
    }
    
    var fieldInputTextContent: some View {
        Text(model.fieldTextContents)
            .withFont(model.textFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.textColor)
            .lineLimit(1)
            .multilineTextAlignment(.leading)
    }
}

struct InputSelector_Previews: PreviewProvider {
    static var previews: some View {
        InputSelector(model: .init(fieldTextContents: "Search by City",
                                   inFieldIcon: Icons.getIconImage(named: .map_marker),
                                   didSelectAction: {}))
    }
}
