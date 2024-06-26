//
// FoodRestrictionSelectionScreen.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 2:43 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture

struct FoodRestrictionSelectionScreen: View {
    // MARK: - Observed
    // Local
    @StateObject var model: FoodRestrictionSelectionScreenViewModel
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - Dimensions
    private let navigationButtonSize: CGSize = .init(width: 28,
                                                     height: 28),
                navigationButtonIconSize: CGSize = .init(width: 9.33,
                                                         height: 16.33)
    
    // MARK: - Spacing + Padding
    private let contentSectionHorizontalPadding: CGFloat = 24,
                gridItemHorizontalSpacing: CGFloat = 14,
                gridItemVerticalSpacing: CGFloat = 14,
                questionTextViewBottomPadding: CGFloat = 32
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.canNavigateForward)
            .animation(.spring(),
                       value: model.canNavigateBackward)
            .animation(.easeIn,
                       value: model.foodRestrictions)
            .animation(.spring(),
                       value: model.currentPageIndex)
            .animation(.easeIn,
                       value: model.selectedFoodRestrictions)
    }
}

// MARK: - Sections
extension FoodRestrictionSelectionScreen {
    var mainSection: some View {
        VStack(spacing: 0) {
            questionDescriptionTextView
            HStack(spacing: contentSectionHorizontalPadding) {
                backNavigationButton
                horizontalContentStack
                forwardNavigationButton
            }
        }
    }
    
    var horizontalContentStack: some View {
        Group {
            let columns = [
                GridItem(.fixed(FoodRestrictionSelectionChip.size.height),
                         spacing: gridItemHorizontalSpacing,
                         alignment: .center),
                GridItem(.fixed(FoodRestrictionSelectionChip.size.height),
                         spacing: gridItemHorizontalSpacing,
                         alignment: .center),
                GridItem(.fixed(FoodRestrictionSelectionChip.size.height),
                         spacing: gridItemHorizontalSpacing,
                         alignment: .center)
            ]
            
            let foodRestrictions = model.getFoodRestrictionsForPage(with: model.currentPageIndex)
            
            LazyVGrid(columns: columns,
                      spacing: gridItemVerticalSpacing) {
                ForEach(
                    foodRestrictions,
                    id: \.self
                ) {
                    FoodRestrictionSelectionChip(model: .init(foodRestrictionType: $0, parentViewModel: self.model))
                    
                }
            }
                      .id(model.currentPageIndex)
                      .transition(model.didMoveForwards ? .offset(x: 400) : .offset(x: -400))
        }
    }
}

// MARK: - Subviews
extension FoodRestrictionSelectionScreen {
    var questionDescriptionTextView: some View {
        Text(model.questionDescription)
            .withFont(model.questionDescriptionFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.questionDescriptionColor)
            .multilineTextAlignment(.center)
            .padding(.bottom,
                     questionTextViewBottomPadding)
    }
    
    var backNavigationButton: some View {
        Button(action: model.navigateToPreviousPageAction) {
            model.backwardNavigationIndicatorIcon
                .fittedResizableOriginalImageModifier()
                .foregroundColor(model.navigationIndicatorColor)
                .opacity(model.canNavigateBackward ? 1 : 0)
                .disabled(!model.canNavigateBackward)
                .frame(width: navigationButtonIconSize.width,
                       height: navigationButtonIconSize.height)
        }
        .frame(width: navigationButtonSize.width,
               height: navigationButtonSize.height)
    }
    
    var forwardNavigationButton: some View {
        Button(action: model.navigateToNextPageAction) {
            model.forwardNavigationIndicatorIcon
                .fittedResizableOriginalImageModifier()
                .foregroundColor(model.navigationIndicatorColor)
                .opacity(model.canNavigateForward ? 1 : 0)
                .disabled(!model.canNavigateForward)
                .frame(width: navigationButtonIconSize.width,
                       height: navigationButtonIconSize.height)
        }
        .frame(width: navigationButtonSize.width,
               height: navigationButtonSize.height)
    }
}

struct FoodRestrictionSelectionScreen_Previews: PreviewProvider {
    static var previews: some View {
        FoodRestrictionSelectionScreen(model: .init())            .background(Colors.black_1)
    }
}
