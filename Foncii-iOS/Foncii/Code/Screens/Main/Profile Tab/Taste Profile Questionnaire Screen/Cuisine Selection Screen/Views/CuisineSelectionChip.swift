//
// CuisineSelectionChip.swift
// Foncii
//
// Created by Justin Cook on 6/29/23 at 9:50 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ApolloTestSupport
import FonciiApollo

struct CuisineSelectionChip: View {
    // MARK: - Observed
    /// Observed in order to update when external changes happen w/ the parent view model
    @ObservedObject var model: CuisineSelectionChipViewModel
    
    // MARK: - Dimensions
    static let size: CGSize = .init(width: 84,
                                    height: 84)
    
    private let imageViewSize: CGSize = .init(width: 36,
                                              height: 36),
                selectionBoxSize: CGSize = .init(width: 54,
                                                 height: 44),
                selectionBoxCornerRadius: CGFloat = 6
    
    // MARK: - Padding + Spacing
    private let verticalPadding: CGFloat = 14,
                itemSpacing: CGFloat = 5
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.isSelected)
    }
}

// MARK: - Sections
extension CuisineSelectionChip {
    var mainSection: some View {
        Button(action: model.toggleSelectionAction) {
            contentSection
        }
        .buttonStyle(.genericSpringyShrink)
        .frame(width: CuisineSelectionChip.size.width,
               height: CuisineSelectionChip.size.height)
    }
    
    var contentSection: some View {
        VStack(spacing: itemSpacing) {
            imageView
            textView
        }
        .padding(.vertical,
                 verticalPadding)
    }
}

// MARK: - Subviews
extension CuisineSelectionChip {
    var textView: some View {
        Text(model.cuisineName)
            .withFont(model.titleFont,
                      weight: model.titleFontWeight)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.titleColor)
            .lineLimit(1)
            .minimumScaleFactor(0.75)
            .multilineTextAlignment(.center)
    }
    
    var imageView: some View {
        ZStack {
            GenericImageView(model: model.imageViewModel,
                             shimmerViewCornerRadius: imageViewSize.height)
                .frame(width: imageViewSize.width,
                       height: imageViewSize.height)
                .background(
                    Group {
                        if model.isSelected {
                            selectionBox
                                .transition(.scale.animation(.spring()))
                        }
                    }
                )
        }
    }
    
    var selectionBox: some View {
        RoundedRectangle(cornerRadius: selectionBoxCornerRadius)
            .frame(width: selectionBoxSize.width,
                   height: selectionBoxSize.height)
            .foregroundColor(model.selectionBoxColor)
    }
}

struct CuisineSelectionChip_Previews: PreviewProvider {
    static var mockCuisineType: Mock<FonciiApollo.Cuisine> {
        return .init(id: UUID().uuidString,
                     imageURL: "",
                     localizedNames: .init(en: "Vietnamese"))
    }
    
    static var previews: some View {
        CuisineSelectionChip(model: .init(cuisineType: .from(mockCuisineType), parentViewModel: .init()))
            .background(Colors.black_1)
    }
}
