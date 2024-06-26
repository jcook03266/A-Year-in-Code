//
// CuisineSelectionScreen.swift
// Foncii
//
// Created by Justin Cook on 6/29/23 at 8:58 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture

struct CuisineSelectionScreen: View {
    // MARK: - Observed
    // Local
    @StateObject var model: CuisineSelectionScreenViewModel
    
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
                       value: model.cuisines)
            .animation(.spring(),
                       value: model.currentPageIndex)
            .animation(.easeIn,
                       value: model.selectedCuisines)
    }
}

// MARK: - Sections
extension CuisineSelectionScreen {
    var mainSection: some View {
            VStack(spacing: 0) {
                questionDescriptionTextView
                    HStack(spacing: 0) {
                        backNavigationButton
                        horizontalContentStack
                        forwardNavigationButton
                    }
                    
                }
    }
    
    var horizontalContentStack: some View {
        Group {
            let columns = [
                GridItem(.fixed(CuisineSelectionChip.size.height),
                         spacing: gridItemHorizontalSpacing,
                         alignment: .center),
                GridItem(.fixed(CuisineSelectionChip.size.height),
                         spacing: gridItemHorizontalSpacing,
                         alignment: .center),
                GridItem(.fixed(CuisineSelectionChip.size.height),
                         spacing: gridItemHorizontalSpacing,
                         alignment: .center)
            ]
            
            let cuisines = model.getCuisinesForPage(with: model.currentPageIndex)
            
                LazyVGrid(columns: columns,
                          spacing: gridItemVerticalSpacing) {
                    ForEach(
                        cuisines,
                        id: \.self
                    ) {
                        CuisineSelectionChip(
                            model: .init(cuisineType: $0,
                                         parentViewModel: self.model))
                    }
                }
                          .id(model.currentPageIndex)
                          .transition(model.didMoveForwards ? .offset(x: 400) : .offset(x: -400))
        }
    }
}

// MARK: - Subviews
extension CuisineSelectionScreen {
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

struct CuisineSelectionScreen_Previews: PreviewProvider {
    static var previews: some View {
        CuisineSelectionScreen(model: .init())
            .background(Colors.black_1)
    }
}
