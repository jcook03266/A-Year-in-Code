//
// FoodRestrictionSelectionChip.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 2:44 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ApolloTestSupport
import FonciiApollo

struct FoodRestrictionSelectionChip: View {
    // MARK: - Observed
    /// Observed in order to update when external changes happen w/ the parent view model
    @ObservedObject var model: FoodRestrictionSelectionChipViewModel
    
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
extension FoodRestrictionSelectionChip {
    var mainSection: some View {
        Button(action: model.toggleSelectionAction) {
            contentSection
        }
        .buttonStyle(.genericSpringyShrink)
        .frame(width: FoodRestrictionSelectionChip.size.width,
               height: FoodRestrictionSelectionChip.size.height)
        
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
extension FoodRestrictionSelectionChip {
    var textView: some View {
        Text(model.foodRestrictionName)
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

struct FoodRestrictionSelectionChip_Previews: PreviewProvider {
    static var mockFoodRestrictionType: Mock<FonciiApollo.FoodRestriction> {
        return .init(id: UUID().uuidString,
                     imageURL: "",
                     localizedNames: .init(en: "Halal"))
    }
    
    static var previews: some View {
        FoodRestrictionSelectionChip(model: .init(foodRestrictionType: .from(mockFoodRestrictionType), parentViewModel: .init()))
            .background(Colors.black_1)
    }
}
