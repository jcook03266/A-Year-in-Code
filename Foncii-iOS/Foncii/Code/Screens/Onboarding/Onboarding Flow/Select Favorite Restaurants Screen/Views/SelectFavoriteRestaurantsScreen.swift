//
// SelectFavoriteRestaurantsScreen.swift
// Foncii
//
// Created by Justin Cook on 4/29/23 at 9:39 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Shimmer
import ComposableArchitecture

struct SelectFavoriteRestaurantsScreen: View {
    // MARK: - Observed
    // Local
    @StateObject var model: SelectFavoriteRestaurantsScreenViewModel
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - Properties
    private let scrollViewCoordinateSpaceName = UUID()
    @State private var scrollViewOffset: CGPoint = .zero
    @State private var scrollViewContentSize: CGSize = .zero
    
    // MARK: - Dimensions
    private let nextButtonSize: CGSize = .init(width: 208,
                                               height: 48),
                searchBarMaxWidth: CGFloat = 335
    
    // MARK: - Padding + Spacing
    private let nextButtonTopPadding: CGFloat = 44,
                titleTopPadding: CGFloat = 26,
                searchBarVerticalPadding: CGFloat = 24,
                restaurantGridViewBottomPadding: CGFloat = 100,
                restaurantChipViewVerticalSpacing: CGFloat = 20,
                restaurantChipViewItemSpacing: CGFloat = 15.5,
                horizontalPadding: CGFloat = 20,
                bottomSectionBottomPadding: CGFloat = 48.5
    
    var body: some View {
        mainSection
            .onAppear {
                onloadTasks()
                
                /// Customizing pull to refresh appearance
                UIRefreshControl.appearance().tintColor = Colors.getUIColor(named: .primary_1)
            }
            .animation(.spring(),
                       value: model.displayingAggregationOverlay)
            .animation(.easeInOut,
                       value: model.restaurants)
            .animation(.easeIn,
                       value: model.shouldDisplayNoSearchResultsPrompt)
            .animation(.spring(),
                       value: model.shouldDisplayFailedFetchRequestPrompt)
    }
}

// MARK: - Functions
extension SelectFavoriteRestaurantsScreen {
    func onloadTasks() {
        Task { @MainActor in
            model.load()
            model.determineIfAggregationNeeded()
        }
    }
}

// MARK: - Sections
extension SelectFavoriteRestaurantsScreen {
    var mainSection: some View {
        GeometryReader { geom in
            ZStack {
                VStack(spacing: 0) {
                    topSection
                        .padding(.horizontal, horizontalPadding)
                    
                    bottomSection
                }
                .frame(width: geom.size.width,
                       height: geom.size.height)
                
                restaurantAggregationOverlay
            }
        }
        .background(model.backgroundColor)
    }
    
    var topSection: some View {
        VStack(spacing: 0) {
            skipButton
            
            titleView
            
            searchBar
        }
        .fixedSize()
    }
    
    var bottomSection: some View {
        ZStack {
            contentSection
            
            VStack {
                Spacer()
                
                nextButton
            }
            .padding(.horizontal, horizontalPadding)
            .padding(.bottom, bottomSectionBottomPadding)
        }
    }
    
    var contentSection: some View {
        Group {
            if model.shouldDisplaySomePrompt {
                promptView
            }
            else {
                restaurantGridView
            }
        }
        .transition(.slide)
    }
    
    var restaurantAggregationOverlay: some View {
        Group {
            if (model.displayingAggregationOverlay) {
                ZStack {
                    OpaqueBackgroundOverlay()
                        .transition(.opacity
                            .animation(.easeIn)
                        )
                    
                    AggregationPhaseOverlay()
                        .transition(
                            .scale
                                .animation(.spring())
                        )
                }
            }
        }
        .zIndex(10)
    }
}

// MARK: - Subviews
extension SelectFavoriteRestaurantsScreen {
    var restaurantGridViewContent: some View {
        Group {
            let columns = [
                GridItem(spacing: restaurantChipViewItemSpacing,
                         alignment: .center),
                GridItem(spacing: restaurantChipViewItemSpacing,
                         alignment: .center),
                GridItem(spacing: restaurantChipViewItemSpacing,
                         alignment: .center)
            ]
            
            LazyVGrid(columns: columns,
                      spacing: restaurantChipViewVerticalSpacing) {
                Group {
                    if model.shouldDisplayShimmerView {
                        // Fake Data
                        ForEach(model.mockRestaurants,
                                id: \.self) { restaurant in
                            
                            DiscoveryRestaurantChipView(model: .init(restaurant: restaurant))
                                .redacted(reason: .placeholder)
                                .shimmering(active: model.shouldDisplayShimmerView)
                                .disabled(true)
                                .id(restaurant)
                        }
                    }
                    else {
                        // Real Data
                        ForEach(model.restaurants,
                                id: \.self) { restaurant in
                            DiscoveryRestaurantChipView(model: .init(restaurant: restaurant))
                                .id(restaurant)
                        }
                                .transition(.opacity.animation(.spring()))
                    }
                }
            }
        }
        .padding(.bottom, restaurantGridViewBottomPadding)
        .padding(.horizontal, horizontalPadding)
    }
    
    var restaurantGridView: some View {
        GeometryReader { geom in
            ScrollView(.vertical) {
                SPObservingView(
                    coordinateSpace: .named(scrollViewCoordinateSpaceName),
                    size: Binding(
                        get: { scrollViewContentSize },
                        set: { newSize in
                            guard newSize != scrollViewContentSize
                            else { return }
                            
                            scrollViewContentSize = newSize
                        }
                    ),
                    position: Binding(
                        get: { scrollViewOffset },
                        set: { newOffset in
                            guard model.canPaginate
                            else { return }
                            
                            if PaginationHelper.scrollViewCanPaginate(
                                newOffset: newOffset,
                                scrollViewContentSize: scrollViewContentSize,
                                viewGeometryProxy: geom
                            ) {
                                model.triggerPagination()
                            }
                        }
                    ),
                    content: {
                        restaurantGridViewContent
                    }
                )
            }
        }
        .refreshable(action: model.refreshAction)
        .coordinateSpace(name: scrollViewCoordinateSpaceName)
    }
    
    var promptView: some View {
        GeometryReader { geom in
        ScrollView(.vertical) {
            VStack {
                currentPrompt
                    .padding(.bottom,
                             restaurantGridViewBottomPadding)
                    .padding(.horizontal, horizontalPadding)
            }
            .frame(width: geom.size.width,
                   height: geom.size.height)
        }
        .refreshable(action: model.refreshAction)
        }
    }
    
    var currentPrompt: some View {
        Group {
            if model.shouldDisplayNoSearchResultsPrompt {
                noSearchResultsPrompt
            }
            else if model.shouldDisplayFailedFetchRequestPrompt {
                failedFetchRequestPrompt
            }
        }
    }
    
    var failedFetchRequestPrompt: some View {
        VStack {
            Text(model.failedFetchRequestPrompt)
                .withFont(model.promptFont)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundColor(model.textColor)
                .multilineTextAlignment(.center)
        }
    }
    
    var noSearchResultsPrompt: some View {
        VStack {
            Text(model.noSearchResultsPrompt)
                .withFont(model.promptFont)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundColor(model.textColor)
                .multilineTextAlignment(.center)
        }
    }
    
    var searchBar: some View {
        SearchBarTextFieldView(model: model.searchBarTextFieldViewModel)
            .padding(.vertical, searchBarVerticalPadding)
            .frame(maxWidth: searchBarMaxWidth)
    }
    
    var titleView: some View {
        Text(model.titleText)
            .withFont(model.titleFont)
            .fixedSize(horizontal: false, vertical: true)
            .multilineTextAlignment(.center)
            .foregroundColor(model.titleColor)
            .padding(.top, titleTopPadding)
    }
    
    var skipButton: some View {
        HStack {
            Spacer()
            
            SkipButton(skipAction: model.skipButtonAction)
                .disabled(!model.isClientOnline)
        }
    }
    
    var nextButton: some View {
        RoundedCTAButton(title: model.nextButtonTitle,
                         action: model.nextButtonAction,
                         disabled: !model.canContinue,
                         displayActivityIndicator: model.displayActivityIndicator,
                         size: nextButtonSize)
        .padding(.top, nextButtonTopPadding)
    }
}

struct SelectFavoriteRestaurantsScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .rootCoordinatorSelector
            .onboardingCoordinator
            .router
            .view(for: .selectFavorites)
    }
    
    static var previews: some View {
        getView()
    }
}
