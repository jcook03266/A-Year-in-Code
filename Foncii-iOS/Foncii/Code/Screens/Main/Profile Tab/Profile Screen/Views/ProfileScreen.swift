//
// ProfileScreen.swift
// Foncii
//
// Created by Justin Cook on 6/25/23 at 2:03 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture
import Shimmer

struct ProfileScreen: View {
    @Namespace var profileScreenNameSpace
    
    // MARK: - Observed
    // Local
    @StateObject var model: ProfileScreenViewModel
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - Properties
    private let scrollViewCoordinateSpaceName = UUID()
    @State private var scrollViewOffset: CGPoint = .zero
    @State private var scrollViewContentSize: CGSize = .zero
    
    // MARK: - Dimensions
    private let topHeaderButtonSize: CGSize = .init(width: 24,
                                                    height: 24),
                contentFeedSectionDividerHeight: CGFloat = 1,
                clientLocationMapMarkerIconSize: CGSize = .init(width: 14,
                                                                height: 14),
                qrButtonSize: CGSize = .init(width: 32,
                                             height: 32),
                contextSwitcherShadowRadius: CGFloat = 4,
                listDividerHeight: CGFloat = 1
    
    // MARK: - Spacing + Padding
    private let profilePictureComponentBottomPadding: CGFloat = 14,
                userInfoSetionVerticalItemSpacing: CGFloat = 4,
                userInfoSectionHorizontalItemSpacing: CGFloat = 8,
                userInfoSectionBottomPadding: CGFloat = 16,
                userInfoSectionTopPadding: CGFloat = 50,
                recommendationButtonsItemSpacing: CGFloat = 16,
                recommendationButtonsVerticalPadding: CGFloat = 16,
                locationHeaderSectionTopPadding: CGFloat = 24,
                locationHeaderSectionBottomPadding: CGFloat = 16,
                locationSwitcherBottomPadding: CGFloat = 16,
                contentFeedSectionDividerVerticalPadding: CGFloat = 16,
                horizontalPadding: CGFloat = 20,
                headerSectionBottomPadding: CGFloat = 10,
                headerSectionHorizontalPadding: CGFloat = 26,
                usernameTextViewHorizontalPadding: CGFloat = 20,
                contextSwitcherShadowOffset: CGSize = .init(width: 0,
                                                            height: 6),
                topPadding: CGFloat = 10,
                contentFeedViewBottomPadding: CGFloat = 100,
                listDividerVerticalPadding: CGFloat = 12
    
    private var contextSwitcherTopPadding: CGFloat {
        return model.userInformationSectionHidden ? userInfoSectionTopPadding : 0
    }
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.selectedFeedTab)
            .animation(.spring(),
                       value: model.isClientLocationDescriptionLoading)
            .animation(.easeInOut,
                       value: model.userInformationSectionHidden)
            .onAppear {
                onloadTasks()
                
                /// Customizing pull to refresh appearance
                UIRefreshControl.appearance().tintColor = Colors.getUIColor(named: .primary_1)
            }
    }
}

// MARK: - Functions
extension ProfileScreen {
    func onloadTasks() {
        Task { @MainActor in
            if model.didAppear {
                await model.reload()
            }
            else {
                model.load()
            }
            
            model.didAppear = true
        }
    }
}

// MARK: - Sections
extension ProfileScreen {
    var mainSection: some View {
        ZStack(alignment: .top) {
            GeometryReader { geom in
                    VStack(spacing: 0) {
                        Group {
                            if !model.userInformationSectionHidden {
                                userInfoSection
                                    .transition(
                                        .asymmetric(insertion: .push(from: .top),
                                                    removal: .push(from: .bottom)))
                            }
                        }
                        .zIndex(1)
                        .id(model.userInformationSectionHidden)
                            
                        tabContextSwitcher
                        locationHeaderSection
                        locationFilterSection
                        contentFeedSection
                    }
                .frame(width: geom.size.width,
                       height: geom.size.height)
            }
            
            headerSection
        }
        .id(model.didAppear)
        .transition(
            .push(from: .bottom)
            .combined(with: .opacity)
        )
        .zIndex(1)
    }
    
    var headerSection: some View {
        HStack(alignment: .center,
               spacing: 0) {
            notificationButton
            Spacer()
            usernameTextView
            Spacer()
            settingsButton
        }
               .padding(.bottom, headerSectionBottomPadding)
               .padding(.horizontal,
                        headerSectionHorizontalPadding)
               .padding(.top, topPadding)
               .background(
                model.backgroundColor.opacity(0.75)
                    .ignoresSafeArea()
               )
    }
    
    var userInfoSection: some View {
        VStack(spacing: 0) {
            profilePictureComponent
                .padding(.bottom,
                         profilePictureComponentBottomPadding)
            
            HStack(spacing: userInfoSectionHorizontalItemSpacing) {
                HStack {
                    Spacer()
                    Color.clear
                }
                .frame(width: qrButtonSize.width,
                       height: qrButtonSize.height)
                
                VStack(spacing: userInfoSetionVerticalItemSpacing) {
                    fullNameTextView
                    clientLocationDescriptionView
                }
                
                HStack {
                    VStack {
                        qrCodeButton
                        Spacer()
                    }
                    Spacer()
                }
                .frame(width: qrButtonSize.width,
                       height: qrButtonSize.height)
            }
            .fixedSize()
            
            recommendationButtonSection
        }
        .padding(.top,
                 userInfoSectionTopPadding)
        .padding(.horizontal,
                 horizontalPadding)
    }
    
    var recommendationButtonSection: some View {
        HStack(spacing: recommendationButtonsItemSpacing) {
            requestRecommendationButton
            sendRecommendationButton
        }
        .padding(.vertical, recommendationButtonsVerticalPadding)
    }
    
    var locationHeaderSection: some View {
        HStack(spacing: 0) {
            locationsHeaderText
            Spacer()
            viewAllButton
        }
        .padding(.horizontal,
                 horizontalPadding)
        .padding(.top,
                 locationHeaderSectionTopPadding)
        .padding(.bottom,
                 locationHeaderSectionBottomPadding)
    }
    
    var locationFilterSection: some View {
        VStack(spacing: 0) {
            locationFilterSelector
            
            contentFeedSectionDivider
                .padding(.horizontal,
                         horizontalPadding)
        }
    }
    
    var contentFeedSection: some View {
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
                            /// Hide unimportant UI when scrolling down
                            model.handleScrollViewOffsetUpdate(offset: newOffset)
                            
                            // Pagination logic
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
                        currentContentFeed
                    }
                )
            }
        }
        .refreshable(action: model.refreshAction)
        .coordinateSpace(name: scrollViewCoordinateSpaceName)
    }
}

// MARK: - Subviews
extension ProfileScreen {
    var currentContentFeed: some View {
        Group {
            if model.selectedFeedTab == .favorites {
                favoritedRestaurantsFeed
            }
            else {
                recommendedRestaurantsFeed
            }
        }
        .padding(.bottom, contentFeedViewBottomPadding)
        .padding(.horizontal, horizontalPadding)
    }
    
    var usernameTextView: some View {
        Text(model.username)
            .withFont(model.usernameFont,
                      weight: model.usernameFontWeight)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.usernameColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .padding(.horizontal,
                     usernameTextViewHorizontalPadding)
    }
    
    var notificationButton: some View {
        Button {
            model.notificationsButtonAction()
            
            HapticFeedbackDispatcher
                .genericButtonPress()
        } label: {
            model.notificationsButtonIcon
                .fittedResizableTemplateImageModifier()
                .foregroundColor(model.topHeaderButtonColor)
        }
        .buttonStyle(.genericSpringyShrink)
        .frame(width: topHeaderButtonSize.width,
               height: topHeaderButtonSize.height)
        .disabled(true) // Disabled until feature implemented
        
    }
    
    var settingsButton: some View {
        Button {
            model.settingsButtonAction()
            
            HapticFeedbackDispatcher
                .genericButtonPress()
        } label: {
            model.settingsButtonIcon
                .fittedResizableTemplateImageModifier()
                .foregroundColor(model.topHeaderButtonColor)
        }
        .buttonStyle(.genericSpringyShrink)
        .frame(width: topHeaderButtonSize.width,
               height: topHeaderButtonSize.height)
    }
    
    var profilePictureComponent: some View {
        ProfilePictureComponent(model: model.profilePictureComponentViewModel)
    }
    
    var qrCodeButton: some View {
        Button(action: model.qrCodeButtonAction) {
            ZStack {
                Circle()
                    .fill(model.qrCodeBackgroundColor)
                
                model.qrCodeIcon
                    .fittedResizableTemplateImageModifier()
                    .foregroundColor(model.qrCodeIconColor)
                    .frame(width: qrButtonSize.width/2,
                           height: qrButtonSize.height/2)
            }
        }
        .buttonStyle(.genericSpringyShrink)
        .frame(width: qrButtonSize.width,
               height: qrButtonSize.height)
    }
    
    var fullNameTextView: some View {
        Text(model.fullNameString)
            .withFont(model.fullNameFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.fullNameColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
    }
    
    var clientLocationDescriptionView: some View {
        HStack {
            model.mapMarkerIcon
                .fittedResizableTemplateImageModifier()
                .foregroundColor(model.clientLocationDescriptionColor)
                .frame(width: clientLocationMapMarkerIconSize.width,
                       height: clientLocationMapMarkerIconSize.height)
            
            Group {
                if model.isClientLocationDescriptionLoading {
                    Text(model.clientLocationDescriptionPlaceHolder)
                        .redacted(reason: .placeholder)
                        .shimmering(active: model.isClientLocationDescriptionLoading)
                }
                else {
                    Text(model.clientLocationDescription)
                        .withFont(model.clientLocationDescriptionFont)
                        .fixedSize(horizontal: false, vertical: true)
                        .foregroundColor(model.clientLocationDescriptionColor)
                        .lineLimit(1)
                        .multilineTextAlignment(.center)
                }
            }
            .transition(.opacity)
        }
    }
    
    var requestRecommendationButton: some View {
        RichRoundedCTAButton(
            title: model.requestRecommendationButtonTitle,
            action: model.requestRecommendationButtonAction,
            icon: model.editIcon
        )
    }
    
    var sendRecommendationButton: some View {
        RichRoundedCTAButton(
            title: model.sendRecommendationButtonTitle,
            action: model.sendRecommendationButtonAction,
            icon: model.paperPlaneSendIcon
        )
    }
    
    var locationsHeaderText: some View {
        Text(model.locationsHeaderText)
            .withFont(model.locationsHeaderFont,
                      weight: model.locationsHeaderFontWeight)
            .fixedSize(horizontal: false,
                       vertical: true)
            .foregroundColor(model.locationsHeaderColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
    }
    
    var viewAllButton: some View {
        Button {
            model.viewAllButtonAction()
        } label: {
            Text(model.viewAllButtonText)
                .withFont(model.viewAllButtonFont)
                .fixedSize(horizontal: false,
                           vertical: true)
                .foregroundColor(model.viewAllButtonColor)
                .lineLimit(1)
                .multilineTextAlignment(.center)
        }
    }
    
    /// Filters the locations of favorites and recommendations depending on the currently selected context tab
    var locationFilterSelector: some View {
        Group {
            if model.selectedFeedTab == .favorites {
                LocationFilterSelector(model: model.favoritesLocationFilterSelectorViewModel)
                    .transition(.asymmetric(insertion: .slideForwards,
                                            removal: .slideBackwards))
            }
            else {
                LocationFilterSelector(model: model.recommendationsLocationFilterSelectorViewModel)
                    .transition(.asymmetric(insertion: .slideBackwards,
                                            removal: .slideForwards))
            }
        }
    }
    
    var contentFeedSectionDivider: some View {
        Divider()
            .frame(height: contentFeedSectionDividerHeight)
            .overlay(model.contentFeedSectionDividerColor)
            .padding(.vertical, contentFeedSectionDividerVerticalPadding)
    }
    
    var favoritedRestaurantsFeed: some View {
        LazyVStack {
            Group {
                if model.shouldDisplayShimmerView {
                    // Mock Data
                   
                }
                else {
                    // Real Data
                    ForEach(model.favoritedRestaurants,
                            id: \.id) { favoritedRestaurantResult in
                        
                        VStack(spacing: 0) {
                            let viewModel: MPRestaurantViewModel = self.model.createFavoritedRestaurantMPRestaurantViewModel(
                                favoritedRestaurantResult: favoritedRestaurantResult),
                                lastElement = model.favoritedRestaurants.last,
                                isLastElement = favoritedRestaurantResult == lastElement
                            
                            MPRestaurantView(crossOriginNamespace: profileScreenNameSpace,
                                             model: viewModel)
                            .id(favoritedRestaurantResult.favoritedRestaurant)
                            
                            Spacer()
                            
                            // Exclude the divider from the last element
                            if (!isLastElement) {
                                Divider()
                                    .frame(height: listDividerHeight)
                                    .overlay(model.listDividerColor)
                                    .padding(.vertical, listDividerVerticalPadding)
                            }
                        }
                        .transition(.opacity
                            .animation(.spring()))
                    }
                }
            }
        }
    }
    
    var recommendedRestaurantsFeed: some View {
        Group {}
    }
    
    /// Becomes sticky when user scrolls down
    var tabContextSwitcher: some View {
        SlidingContextSwitchView(model: model.slidingContextSwitcherViewModel)
            .shadow(color: model.shadowColor,
                    radius: contextSwitcherShadowRadius,
                    x: contextSwitcherShadowOffset.width,
                    y: contextSwitcherShadowOffset.height)
            .disabled(false) // Disabled until functionality enabled
            .padding(.top, contextSwitcherTopPadding)
    }
}

struct ProfileScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .tabbarCoordinatorSelector
            .profileTabCoordinator
            .router
            .view(for: .main)
    }
    
    static var previews: some View {
        getView()
            .background(Colors.black_1)
    }
}
