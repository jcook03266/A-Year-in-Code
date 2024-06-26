//
// HomeScreen.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 2:26 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture

struct HomeScreen: View {
    // MARK: - Properties
    @Namespace var homeScreenNameSpace
    
    // MARK: - Observed
    // Local
    @StateObject var model: HomeScreenViewModel
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - Properties
    private let scrollViewCoordinateSpaceName = UUID()
    @State private var scrollViewOffset: CGPoint = .zero
    @State private var scrollViewContentSize: CGSize = .zero
    
    // MARK: - Dimensions
    private let searchButtonSize: CGSize = .init(width: 14,
                                                 height: 14),
                listFormatToggleButtonSize: CGSize = .init(width: 20,
                                                     height: 14),
                contextSwitcherShadowRadius: CGFloat = 4,
                listDividerHeight: CGFloat = 1
    
    // MARK: - Spacing + Padding
    private let topPadding: CGFloat = 10,
                horizontalPadding: CGFloat = 20,
                greetingTextViewBottomPadding: CGFloat = 2,
                mealTypeFilterSelectorBottomPaddding: CGFloat = 12,
                searchBarTopPadding: CGFloat = 32,
                mealTypeFilterSelectorTopPaddding: CGFloat = 32,
                restaurantCollectionViewBottomPadding: CGFloat = 100,
                restaurantCollectionViewTopPadding: CGFloat = 24,
                restaurantChipViewVerticalSpacing: CGFloat = 24,
                restaurantChipViewItemSpacing: CGFloat = 16.5,
                contextSwitcherShadowOffset: CGSize = .init(width: 0,
                                             height: 6),
                topRightButtonSectionItemSpacing: CGFloat = 24,
                listDividerVerticalPadding: CGFloat = 12
    
    var body: some View {
        mainSection
            .onAppear {
                onloadTasks()
                
                /// Customizing pull to refresh appearance
                UIRefreshControl.appearance().tintColor = Colors.getUIColor(named: .primary_1)
            }
            .animation(.spring(),
                       value: model.selectedFeedTab)
            .animation(.linear,
                       value: model.homeFeedRestaurantSearchResults)
            .animation(.spring(),
                       value: model.shouldDisplayNoSearchResultsPrompt)
            .animation(.spring(),
                       value: model.shouldDisplayFailedFetchRequestPrompt)
            .animation(.easeInOut,
                       value: model.gridListFormatEnabled)
            .animation(.spring(),
                       value: model.searchBarToggled)
            .animation(
                .spring(response: 0.7)
                .speed(0.5),
                value: model.didAppear)
    }
}

// MARK: - Functions
extension HomeScreen {
    func onloadTasks() {
        Task { @MainActor in
            if model.didAppear {
                //await model.reload()
            }
            else {
                model.load()
            }
            
            model.didAppear = true
        }
    }
}

// MARK: - Sections
extension HomeScreen {
    var mainSection: some View {
                VStack(spacing: 0) {
                    headerSection
                    searchBarSection
                    mealTypeFilterSelector
                    tabContextSwitcher
                    contentFeedSection
                }
                .id(model.didAppear)
                .transition(
                    .push(from: .bottom)
                    .combined(with: .opacity)
                )
                .zIndex(1)
            }
    
    var searchBarSection: some View {
        Group {
            if model.searchBarToggled {
                searchBar
                    .padding(.horizontal,
                             horizontalPadding)
                    .padding(.top,
                             searchBarTopPadding)
            }
        }
        .transition(.slide)
    }
    
    var headerSection: some View {
        HStack(alignment: .bottom,
               spacing: 0) {
            topLeftButtonSection
            topMiddleButtonSection
            topRightButtonSection
        }
               .padding(.top,
                        topPadding)
               .padding(.horizontal,
                        horizontalPadding)
    }
    
    var topLeftButtonSection: some View {
        HStack(spacing: 0) {
            datePickerButton
            Spacer()
        }
    }
    
    var topMiddleButtonSection: some View {
        VStack(spacing: 0) {
            userGreetingTextView
            locationPickerButton
        }
        .fixedSize()
    }
    
    var topRightButtonSection: some View {
        HStack(spacing: topRightButtonSectionItemSpacing) {
            Spacer()
            searchButton
            listFormatToggleButton
        }
    }
    
    var contentFeedSection: some View {
        Group {
            if model.shouldDisplaySomePrompt {
                promptView
            }
            else {
                restaurantCollectionView
            }
        }
        .transition(.slide)
    }
}

// MARK: - Subviews
extension HomeScreen {
    var promptView: some View {
        GeometryReader { geom in
            ScrollView(.vertical) {
                VStack {
                    currentPrompt
                        .padding(.bottom,
                                 restaurantCollectionViewBottomPadding)
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
    
    var restaurantGridViewContent: some View {
        Group {
            let columns = [
                GridItem(spacing: restaurantChipViewItemSpacing,
                         alignment: .center),
                GridItem(spacing: restaurantChipViewItemSpacing,
                         alignment: .center)
            ]
            
            LazyVGrid(columns: columns,
                      spacing: restaurantChipViewVerticalSpacing) {
                Group {
                    if model.shouldDisplayShimmerView {
                        // Mock / Placeholder Data
                        ForEach(model.mockRestaurantSearchResults,
                                id: \.self) { mockRestaurantSearchResult in
                            
                            FPRestaurantView(crossOriginNamespace: homeScreenNameSpace,
                                             model: .init(restaurantSearchResult: mockRestaurantSearchResult,
                                                          coordinator: model.coordinator))
                                .redacted(reason: .placeholder)
                                .shimmering(active: model.shouldDisplayShimmerView)
                                .disabled(true)
                                .id(mockRestaurantSearchResult.restaurant)
                        }
                    }
                    else {
                        // Real Data
                        ForEach(model.homeFeedRestaurantSearchResults,
                                id: \.restaurant.id) { restaurantSearchResult in
                            let viewModel: FPRestaurantViewModel = self.model.createFPRestaurantViewModel(restaurantSearchResult: restaurantSearchResult)
                            
                            FPRestaurantView(crossOriginNamespace: homeScreenNameSpace,
                                             model: viewModel)
                            .id(restaurantSearchResult.restaurant)
                        }
                                .transition(.opacity
                                    .animation(.spring()))
                    }
                }
            }
        }
    }
    
    var restaurantListViewContent: some View {
        LazyVStack {
            Group {
                if model.shouldDisplayShimmerView {
                    // Mock Data
                    ForEach(model.mockRestaurantSearchResults,
                            id: \.self) { mockRestaurantSearchResult in
                        
                        VStack(spacing: 0) {
                            let viewModel: MPRestaurantViewModel = .init(
                                restaurantSearchResult: mockRestaurantSearchResult,
                                coordinator: model.coordinator),
                                lastElement = model.mockRestaurantSearchResults.last,
                                isLastElement = mockRestaurantSearchResult == lastElement
                            
                            MPRestaurantView(crossOriginNamespace: homeScreenNameSpace,
                                             model: viewModel)
                                .redacted(reason: .placeholder)
                                .shimmering(active: model.shouldDisplayShimmerView)
                                .disabled(true)
                                .id(mockRestaurantSearchResult.restaurant)
                            
                            Spacer()
                            
                            if (!isLastElement) {
                                Divider()
                                    .frame(height: listDividerHeight)
                                    .overlay(model.listDividerColor)
                                    .padding(.vertical, listDividerVerticalPadding)
                            }
                        }
                    }
                }
                else {
                    // Real Data
                    ForEach(model.homeFeedRestaurantSearchResults,
                            id: \.restaurant.id) { restaurantSearchResult in
                        
                        VStack(spacing: 0) {
                            let viewModel: MPRestaurantViewModel = self.model.createMPRestaurantViewModel(restaurantSearchResult: restaurantSearchResult),
                                lastElement = model.homeFeedRestaurantSearchResults.last,
                                isLastElement = restaurantSearchResult == lastElement
                            
                            MPRestaurantView(crossOriginNamespace: homeScreenNameSpace,
                                             model: viewModel)
                            .id(restaurantSearchResult.restaurant)
                            
                            Spacer()
                            
                            // Exclude the divider from the last element
                            if (!isLastElement) {
                                Divider()
                                    .frame(height: listDividerHeight)
                                    .overlay(model.listDividerColor)
                                    .padding(.vertical, listDividerVerticalPadding)
                            }
                        }
                    }
                            .transition(.opacity
                                .animation(.spring()))
                }
            }
        }
    }
    
    var restaurantContentView: some View {
        Group {
            if model.gridListFormatEnabled {
                restaurantGridViewContent
            }
            else {
                restaurantListViewContent
            }
        }
        .padding(.horizontal,
                 horizontalPadding)
        .padding(.bottom, restaurantCollectionViewBottomPadding)
        .padding(.top, restaurantCollectionViewTopPadding)
    }
    
    var restaurantCollectionView: some View {
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
                        restaurantContentView
                    }
                )
            }
        }
        .refreshable(action: model.refreshAction)
        .coordinateSpace(name: scrollViewCoordinateSpaceName)
    }
    
    var searchBar: some View {
        HStack {
            SearchBarTextFieldView(model: model.searchBarTextFieldViewModel)
            
            Spacer()
        }
    }
    
    var datePickerButton: some View {
        VStack {
            Button {
                model.datePickerToggleButtonAction()
                
                HapticFeedbackDispatcher
                    .genericButtonPress()
            } label: {
                Text(model.dateText)
                    .withFont(model.datePickerFont)
                    .fixedSize(horizontal: false, vertical: true)
                    .foregroundColor(model.datePickerColor)
                    .lineLimit(1)
                    .multilineTextAlignment(.center)
            }
            .buttonStyle(.genericSpringyShrink)
        }
    }
    
    var searchButton: some View {
            Button {
                model.searchBarToggleButtonAction()
                
                HapticFeedbackDispatcher
                    .genericButtonPress()
            } label: {
                model.searchButtonIcon
                    .fittedResizableTemplateImageModifier()
                    .foregroundColor(model.headerButtonColor)
                    .fixedSize()
            }
            .buttonStyle(.genericSpringyShrink)
            .frame(width: searchButtonSize.width,
                   height: searchButtonSize.height)
    }
    
    var listFormatToggleButton: some View {
        Button {
            model.listFormatToggleButtonAction()
            
            HapticFeedbackDispatcher
                .genericButtonPress()
        } label: {
            model.listFormatToggleButtonIcon
                .fittedResizableTemplateImageModifier()
                .foregroundColor(model.headerButtonColor)
        }
        .id(model.gridListFormatEnabled)
        .transition(
            .scale
            .combined(with: .opacity)
            .animation(.spring())
        )
        .buttonStyle(.genericSpringyShrink)
        .frame(width: listFormatToggleButtonSize.width,
               height: listFormatToggleButtonSize.height)
    }
    
    var userGreetingTextView: some View {
        Text(model.greetingText)
            .withFont(model.greetingTextFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.greetingTextColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .padding(.bottom,
                     greetingTextViewBottomPadding)
    }
    
    var locationPickerButton: some View {
        Button {
            model.locationPickerToggleButtonAction()
            
            HapticFeedbackDispatcher
                .genericButtonPress()
            
        } label: {
            currentLocationDescriptionTextView
        }
        .disabled(model.isCurrentLocationDescriptionLoading)
    }
    
    var currentLocationDescriptionTextView: some View {
        Group {
            if model.isCurrentLocationDescriptionLoading {
                Text(model.currentSearchLocationDescriptionPlaceHolder)
                    .redacted(reason: .placeholder)
                    .shimmering(active: model.isCurrentLocationDescriptionLoading)
            }
            else {
                Text(model.currentSearchLocationDescription)
                    .withFont(model.currentLocationDescriptionFont)
                    .fixedSize(horizontal: false, vertical: true)
                    .foregroundColor(model.currentLocationDescriptionColor)
                    .lineLimit(1)
                    .multilineTextAlignment(.center)
                    .underline(color: model.currentLocationDescriptionColor)
            }
        }
        .transition(.opacity)
    }
    
    var mealTypeFilterSelector: some View {
        MealTypeSelector()
            .padding(.bottom,
                     mealTypeFilterSelectorBottomPaddding)
            .padding(.top,
                     mealTypeFilterSelectorTopPaddding)
    }
    
    var tabContextSwitcher: some View {
        SlidingContextSwitchView(model: model.slidingContextSwitcherViewModel)
            .shadow(color: model.shadowColor,
                    radius: contextSwitcherShadowRadius,
                    x: contextSwitcherShadowOffset.width,
                    y: contextSwitcherShadowOffset.height)
            .disabled(true) // Disabled until functionality enabled
    }
}

struct HomeScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .tabbarCoordinatorSelector
            .homeTabCoordinator
            .router
            .view(for: .main)
    }
    
    static var previews: some View {
        getView()
            .background(Colors.black_1)
    }
}
