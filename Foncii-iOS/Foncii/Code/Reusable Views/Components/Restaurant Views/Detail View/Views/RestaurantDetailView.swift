//
// RestaurantDetailView.swift
// Foncii
//
// Created by Justin Cook on 7/17/23 at 5:17 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture

struct RestaurantDetailView<someCoordinator: Coordinator>: View {
    @Namespace var scrollViewCoordinateSpaceName
    
    // MARK: - Observed
    // Local
    @StateObject var model: RestaurantDetailViewModel<someCoordinator>
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - Dimensions
    private let shareButtonIconSize: CGSize = .init(width: 14,
                                                    height: 14),
                percentMatchLabelCornerRadius: CGFloat = 36,
                headerDividerHeight: CGFloat = 1,
                favoriteButtonIconSize: CGSize = .init(width: 20,
                                                       height: 20),
                favoriteButtonSize: CGSize = .init(width: 28,
                                                   height: 28)
    
    // MARK: - Spacing + Padding
    private let imageViewCornerRadius: CGFloat = 0,
                horizontalPadding: CGFloat = 20,
                restaurantDetailsSectionTopPadding: CGFloat = 24,
                restaurantDetailsSectionItemSpacing: CGFloat = 24,
                percentMatchLabelPadding: CGFloat = 8,
                separatorDotHorizontalPadding: CGFloat = 8,
                headerSectionBottomPadding: CGFloat = 10,
                favoriteButtonPadding: CGFloat = 20
    
    // MARK: - Properties
    @State private var scrollViewOffset: CGPoint = .zero
    @State private var scrollViewContentSize: CGSize = .zero
    
    var headerBackgroundOpacity: CGFloat {
        let normalizedVerticalOffset: CGFloat = -scrollViewOffset.y,
            targetOffset: CGFloat = model.heroImageViewExplicitSize.height/3,
            bufferOffset: CGFloat = 100, /// Don't start the opacity transition until this offset is reached
            bufferedNormalizedVerticalOffset = normalizedVerticalOffset - bufferOffset
        
        if normalizedVerticalOffset < bufferOffset {
            return 0
        }
        
        return bufferedNormalizedVerticalOffset/targetOffset
    }
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.didAppear)
            .onAppear {
                performOnloadTasks()
            }
    }
}

// MARK: - Functions
extension RestaurantDetailView {
    func performOnloadTasks() {
        self.model.didAppear = true
    }
}

// MARK: - Sections
extension RestaurantDetailView {
    var mainSection: some View {
        ZStack {
            GeometryReader { geom in
                ScrollView {
                    contentSection
                        .frame(width: geom.size.width,
                               height: geom.size.height)
                        .trackScrollViewOffset(coordinateSpaceName: scrollViewCoordinateSpaceName, bindingOffset: $scrollViewOffset)
                }
                .coordinateSpace(name: scrollViewCoordinateSpaceName)
                .ignoresSafeArea()
            }
            
            headerSection
        }
        .background(model.backgroundColor)
    }
    
    var contentSection: some View {
        GeometryReader { geom in
            VStack(spacing: 0) {
                ParallaxHeader(
                    coordinateSpace: scrollViewCoordinateSpaceName,
                    defaultHeight: model.heroImageViewExplicitSize.height
                ) { restaurantImageView }
                
                VStack {
                    restaurantDetailsSection
                    Spacer()
                }
                .background(model.backgroundColor)
            }
        }
    }
    
    var restaurantDetailsSection: some View {
        VStack(alignment: .leading,
               spacing: restaurantDetailsSectionItemSpacing) {
            HStack(alignment: .center,
                   spacing: 0) {
                nameHeaderTextView
                Spacer()
                percentMatchLabel
            }
            
            restaurantSummaryTextView
            restaurantMetadataSection
        }
        .padding(.top,
                 restaurantDetailsSectionTopPadding)
        .padding(.horizontal,
                 horizontalPadding)
    }
    
    var headerSection: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                closeButton
                Spacer()
                shareButton
            }
            .padding(.bottom, headerSectionBottomPadding)
            .padding(.horizontal,
                     horizontalPadding)
            .background(
                model.backgroundColor
                .opacity(headerBackgroundOpacity)
            )
            
            Divider()
                .frame(height: headerDividerHeight)
                .overlay(model.headerDividerColor)
                .opacity(headerBackgroundOpacity)
            
            Spacer()
        }
    }
    
    var restaurantMetadataSection: some View {
        HStack(spacing: 0) {
            priceLevelTextView
            categoriesTextView
            distanceFromCurrentUserLocationTextView
            
            Spacer()
        }
        .withFont(model.summaryFont)
        .minimumScaleFactor(0.9)
        .foregroundColor(model.textColor)
        .multilineTextAlignment(.center)
    }
}

// MARK: - Subviews
extension RestaurantDetailView {
    var favoriteButton: some View {
        Button(action: model.toggleFavoriteAction,
               label: {
            Group {
                if model.isFavorited {
                    model.filledHeartIcon
                        .fittedResizableOriginalImageModifier()
                }
                else {
                    model.unfilledHeartIcon
                        .fittedResizableOriginalImageModifier()
                }
            }
            .transition(.scale.animation(.spring()))
            .frame(width: favoriteButtonIconSize.width,
                   height: favoriteButtonIconSize.height)
        })
        .buttonStyle(.genericSpringyShrink)
        .frame(width: favoriteButtonSize.width,
               height: favoriteButtonSize.height)
    }
    
    var separatorDot: some View {
        Text("•")
            .padding(.horizontal,
                     separatorDotHorizontalPadding)
    }
    
    var priceLevelTextView: some View {
        Text(model.priceLevelDescription)
        .fixedSize(horizontal: false,
                   vertical: true)
    }
    
    var categoriesTextView: some View {
        Group {
            if let text = model.restaurantCategoriesString {
                HStack(spacing: 0) {
                    separatorDot
                    Text(text)
                }
            }
        }
        .lineLimit(1)
    }
    
    var distanceFromCurrentUserLocationTextView: some View {
        Group {
            if let text = model.distanceFromCurrentUserLocationDescription {
                HStack(spacing: 0) {
                    separatorDot
                    Text(text)
                }
            }
        }
        .fixedSize(horizontal: false,
                   vertical: true)
    }
    
    var restaurantSummaryTextView: some View {
        Group {
            if let text = model.restaurantSummary,
               !text.isEmpty
            {
                Text(text)
                    .withFont(model.summaryFont)
                    .minimumScaleFactor(1)
                    .fixedSize(horizontal: false,
                               vertical: true)
                    .foregroundColor(model.textColor)
                    .multilineTextAlignment(.leading)
            }
        }
    }
    
    var percentMatchLabel: some View {
        Text(model.formattedPercentMatchDescription)
                .withFont(model.percentMatchLabelFont,
                          weight: model.percentMatchLabelFontWeight)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .fixedSize(horizontal: false,
                           vertical: true)
                .foregroundColor(model.percentMatchLabelTextColor)
                .multilineTextAlignment(.center)
                .padding(.all,
                         percentMatchLabelPadding)
                .background(
                    RoundedRectangle(cornerRadius: percentMatchLabelCornerRadius)
                        .fill(model.percentMatchLabelBackgroundColor)
                )
    }
    
    var nameHeaderTextView: some View {
        Text(model.restaurantName)
            .withFont(model.nameHeaderFont)
            .lineLimit(1)
            .minimumScaleFactor(0.5)
            .fixedSize(horizontal: false,
                       vertical: true)
            .foregroundColor(model.nameHeaderColor)
            .multilineTextAlignment(.leading)
    }
    
    var restaurantImageView: some View {
        Group {
            ZStack(alignment: .bottomTrailing) {
                if let imageViewModel = model.imageViewModel {
                    RestaurantImageView(
                        model: imageViewModel,
                        cornerRadius: imageViewCornerRadius
                    )
                    .applyGradient(gradient: model.heroImageOverlayGradient)
                }
                
                
                favoriteButton
                    .zIndex(1)
                    .padding([.bottom,
                              .trailing], favoriteButtonPadding)
            }
        }
    }
    
    var closeButton: some View {
        CloseButton(style: .encased,
                    closeAction: model.backNavigationAction)
    }
    
    var shareButton: some View {
        StyledCircularUtilityButton(
            style: .encased,
            action: model.shareSheetAction,
            icon: model.shareButtonIcon,
            desiredIconSize: shareButtonIconSize
        )
    }
}

struct RestaurantDetailView_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .tabbarCoordinatorSelector
            .homeTabCoordinator
            .router
            .view(for: .restaurantDetail(restaurantData: nil,
                                         restaurantID: nil))
    }
    
    static var previews: some View {
        getView()
            .background(Colors.black_1)
    }
}
