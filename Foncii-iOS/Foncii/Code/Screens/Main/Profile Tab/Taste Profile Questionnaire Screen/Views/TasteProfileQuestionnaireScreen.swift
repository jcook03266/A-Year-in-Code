//
// TasteProfileQuestionnaireScreen.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 8:39 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture

struct TasteProfileQuestionnaireScreen: View {
    // MARK: - Observed
    // Local
    @StateObject var model: TasteProfileQuestionnaireScreenViewModel
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - Dimensions
    private let appIconImageViewSize: CGSize = .init(width: 90,
                                                     height: 90),
                bottomButtonSize: CGSize = .init(width: 208,
                                                 height: 48)
    
    // MARK: - Padding + Spacing
    private let appIconImageViewVerticalPadding: CGFloat = 24,
                contentSectionTopPadding: CGFloat = 34,
                horizontalPadding: CGFloat = 20,
                headerSectionBottomPadding: CGFloat = 10,
                topPadding: CGFloat = 10,
                bottomNavigationControlSectionItemSpacing: CGFloat = 44,
                contentSectionBottomPadding: CGFloat = 72
    
    var body: some View {
        mainSection
            .animation(.easeInOut,
                       value: model.isClientOnline)
    }
}

// MARK: - Sections
extension TasteProfileQuestionnaireScreen {
    var mainSection: some View {
        ZStack(alignment: .top) {
            GeometryReader { geom in
                ScrollView(.vertical) {
                    VStack(spacing: 0) {
                        Spacer()
                        contentSection
                        Spacer()
                    }
                    .frame(width: geom.size.width,
                           height: geom.size.height)
                }
            }
            
            headerSection
            bottomNavigationControlSection
        }
        .background(model.backgroundColor)
    }
    
    var headerSection: some View {
        HStack(alignment: .center,
               spacing: 0) {
            backButton
            headerTitleTextView
            skipButton
        }
               .padding(.bottom, headerSectionBottomPadding)
               .padding(.horizontal,
                        horizontalPadding)
               .padding(.top, topPadding)
               .background(
                model.backgroundColor.opacity(0.75)
                    .ignoresSafeArea()
               )
    }
    
    var bottomNavigationControlSection: some View {
        VStack(spacing: bottomNavigationControlSectionItemSpacing) {
            Spacer()
            currentBottomButton
            pageIndicator
        }
    }
    
    var contentSection: some View {
        VStack(spacing: 0) {
            appIconImageView
            questionnaireContentSection
            Spacer()
        }
        .padding(.top, contentSectionTopPadding)
        .padding(.bottom, contentSectionBottomPadding)
    }
    
    var questionnaireContentSection: some View {
        GeometryReader { geom in
            ScrollView(.horizontal) {
                ScrollViewReader { scrollViewProxy in
                    HStack {
                        ForEach(TasteProfileQuestionnaireScreenViewModel.Pages.allCases,
                                id: \.self) { page in
                                VStack {
                                    switch page {
                                    case .adventureLevelPage,
                                            .drinkPreferencePage,
                                            .restaurantRatingImportancePage,
                                            .preferredMealTypesPage,
                                            .preferredPriceLevelsPage,
                                            .distancePreferencePage:
                                        
                                        let viewModel = model
                                            .getMCQViewModelFor(page: page)
                                        
                                        if let viewModel = viewModel {
                                            TasteProfileMCQScreen(model: viewModel)
                                        }
                                        
                                    case .cuisineSelectionPage:
                                        CuisineSelectionScreen(model: model.cuisineSelectionScreenViewModel)
                                        
                                    case .foodRestrictionPage:
                                        FoodRestrictionSelectionScreen(model: model.foodRestrictionSelectionScreenViewModel)
                                    }
                                    
                                    Spacer()
                                }
                                .id(page)
                                .padding(.horizontal,
                                         horizontalPadding)
                            .frame(width: geom.size.width)
                        }
                    }
                    .onChange(of: model.currentPageAsEnum) { newPage in
                        withAnimation {
                            scrollViewProxy.scrollTo(newPage,
                                                     anchor: .center)
                        }
                    }
                }
            }
            .scrollDisabled(true)
        }
    }
    
    var currentBottomButton: some View {
        Group {
            if model.shouldDisplayUpdateButton {
                updateButton
            }
            else {
                nextButton
            }
        }
        .animation(.easeInOut,
                   value: model.isClientOnline)
        .animation(.easeInOut,
                   value: model.shouldDisplayUpdateButton)
    }
}

// MARK: - Subviews
extension TasteProfileQuestionnaireScreen {
    var appIconImageView: some View {
        model.appIcon
            .fittedResizableOriginalImageModifier()
            .frame(width: appIconImageViewSize.width,
                   height: appIconImageViewSize.height)
            .padding(.vertical, appIconImageViewVerticalPadding)
    }
    
    var headerTitleTextView: some View {
        Text(model.currentPageTitle)
            .withFont(model.pageTitleFont,
                      weight: model.pageTitleFontWeight)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.pageTitleColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .padding(.horizontal,
                     horizontalPadding)
            .fixedSize()
            .id(model.currentPageTitle)
            .transition(.opacity)
    }
    
    var backButton: some View {
        HStack {
            BackButton(customBackAction: model.backButtonAction)
            Spacer()
        }
    }
    
    var skipButton: some View {
        HStack {
            Spacer()
            
            SkipButton(skipAction: model.skipButtonAction)
                .disabled(!model.skipButtonEnabled)
                .opacity(model.skipButtonEnabled ? 1 : 0)
                .animation(.easeInOut,
                           value: model.skipButtonEnabled)
        }
    }
    
    var pageIndicator: some View {
        DotPageIndicator(model: model.pageIndicatorViewModel)
    }
    
    var updateButton: some View {
        RoundedCTAButton(title: model.updateButtonTitle,
                         action: model.updateButtonAction,
                         disabled: !model.updateButtonEnabled,
                         size: bottomButtonSize)
    }
    
    var nextButton: some View {
        RoundedCTAButton(title: model.nextButtonTitle,
                         action: model.nextPageNavigationAction,
                         disabled: !model.nextButtonEnabled,
                         size: bottomButtonSize)
    }
}

struct TasteProfileQuestionnaireScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .tabbarCoordinatorSelector
            .profileTabCoordinator
            .router
            .view(for: .tasteProfileQuestionnaire)
    }
    
    static var previews: some View {
        getView()
            .background(Colors.black_1)
    }
}
