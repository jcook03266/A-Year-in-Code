//
// SelectableListCellView.swift
// Foncii
//
// Created by Justin Cook on 6/16/23 at 9:10 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct SelectableListCellView: View {
    // MARK: - Observed
    @ObservedObject var model: SelectableListCellViewModel
    
    // MARK: - Dimensions
    private let height: CGFloat = 40
    
    // MARK: - Padding
    private let radioButtonTrailingPadding: CGFloat = 10,
                textViewTrailingPadding: CGFloat = 27
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.isSelected)
            .disabled(!model.isEnabled)
    }
}

// MARK: - Sections
extension SelectableListCellView {
    var mainSection: some View {
            cellButton
    }
    
    var cellButton: some View {
        Button(action: model.selectionAction) {
                contentSection
        }
        .frame(height: height)
    }
    
    var contentSection: some View {
        HStack(spacing: 0) {
            textContentView
            Spacer()
            radioButton
        }
    }
}

// MARK: - Subviews
extension SelectableListCellView {
    var textContentView: some View {
        Text(model.textContent)
            .withFont(model.textFont)
            .lineLimit(2)
            .multilineTextAlignment(.leading)
            .fixedSize(horizontal: false,
                       vertical: true)
            .foregroundColor(model.textColor)
            .padding(.trailing,
                     textViewTrailingPadding)
    }
    
    var radioButton: some View {
        RadioButton(onSelectAction: model.selectionAction,
                    isSelected: $model.isSelected,
                    isEnabled: $model.isEnabled)
        .padding(.trailing,
                 radioButtonTrailingPadding)
    }
}

struct SelectableListCellView_Previews: PreviewProvider {
    static var previews: some View {
        SelectableListCellView(model: .init(textContent: "New York, NY",
                                            isEnabled: true))
            .background(Colors.dark_grey_1)
    }
}
