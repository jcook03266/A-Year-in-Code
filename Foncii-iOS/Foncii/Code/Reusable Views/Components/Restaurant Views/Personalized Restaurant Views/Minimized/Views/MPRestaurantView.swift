//
// MPRestaurantView.swift
// Foncii
//
// Created by Justin Cook on 6/5/23 at 10:51 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ApolloTestSupport
import FonciiApollo
import ComposableArchitecture

/// Minimized personalized restaurant view
struct MPRestaurantView<coordinator: Coordinator>: View {
    // MARK: - Properties
    // Cross-view animation
    let crossOriginNamespace: Namespace.ID
    
    // MARK: - Observed
    @StateObject var model: MPRestaurantViewModel<coordinator>
    
    // MARK: - Dimensions
    private let height: CGFloat = 118,
                maxWidth: CGFloat = 400,
                imageViewCornerRadius: CGFloat = 8,
                percentageMatchBackgroundCornerRadius: CGFloat = 36,
                percentageMatchBackgroundSize: CGSize = .init(width: 44,
                                                              height: 20),
                thirdPartyPlatformIconSizes: CGSize = .init(width: 16,
                                                            height: 16),
                favoriteButtonIconSize: CGSize = .init(width: 20,
                                                       height: 20),
                favoriteButtonSize: CGSize = .init(width: 28,
                                                   height: 28),
                separatorDotSize: CGSize = .init(width: 4,
                                                 height: 4),
                favoriteButtonEdgePadding: CGFloat = 13.5,
                listRankTextViewSize: CGSize = .init(width: 28,
                                                     height: 28),
                listRankTextViewCornerRadius: CGFloat = 8
    
    private var imageViewWidth: CGFloat {
        return self.model
            .imageViewSize
            .getSize()
            .width
    }
    
    // MARK: - Spacing + Padding
    private let rightSectionItemSpacing: CGFloat = 4,
                interSectionSpacing: CGFloat = 12,
                separatorDotHorizontalPadding: CGFloat = 8,
                ratingItemSpacing: CGFloat = 8,
                listRankTextViewPadding: CGFloat = 4
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.isPresentingDetailView)
    }
}

// MARK: - Sections
extension MPRestaurantView {
    var mainSection: some View {
        HStack(spacing: interSectionSpacing) {
            leftSection
            rightSection
        }
        .onTapGesture {
            model.selectionAction()
        }
        .frame(maxWidth: maxWidth,
               maxHeight: height)
        .presentation(
            transition: .heroMove,
            isPresented: self.$model.isPresentingDetailView
        ) {
            RestaurantDetailView(model: model.restaurantDetailViewModel)
        }
    }
    
    var leftSection: some View {
        ZStack {
            restaurantImageView
            
            HStack {
                VStack {
                    listRankTextView
                    Spacer()
                }
                
                Spacer()
                
                VStack {
                    Spacer()
                    favoriteButton
                }
                .padding([.bottom, .trailing],
                         favoriteButtonEdgePadding)
            }
        }
        .fixedSize()
    }
    
    var rightSection: some View {
        VStack(alignment: .leading,
               spacing: rightSectionItemSpacing) {
            restaurantPropertiesSection
            restaurantName
            addressTextView
            
            ratingSection
        }
    }
    
    var restaurantPropertiesSection: some View {
        HStack(spacing: 0) {
            priceLevelTextView
            
            if model.hasCategories {
                separatorDot
                
                firstRestaurantCategoryTextView
            }
            
            Spacer()
            
            percentMatchLabel
        }
    }
    
    var ratingSection: some View {
        HStack(spacing: 0) {
            Group {
                googleRating
                separatorDot
                yelpRating
            }
            .withFont(model.restaurantPropertiesFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.restaurantPropertiesColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            
            Spacer()
        }
    }
}

// MARK: - Subviews
extension MPRestaurantView {
    var yelpRating: some View {
        HStack(spacing: ratingItemSpacing) {
            model.yelpIcon
                .fittedResizableOriginalImageModifier()
                .frame(width: thirdPartyPlatformIconSizes.width,
                       height: thirdPartyPlatformIconSizes.height)
            
            Text(model.yelpRating)
        }
        .matchedGeometryEffect(id: "yelpRating\(model.restaurant.id)",
                               in: crossOriginNamespace)
    }
    
    var googleRating: some View {
        HStack(spacing: ratingItemSpacing) {
            model.googleIcon
                .fittedResizableOriginalImageModifier()
                .frame(width: thirdPartyPlatformIconSizes.width,
                       height: thirdPartyPlatformIconSizes.height)
            
            Text(model.googleRating)
        }
        .matchedGeometryEffect(id: "googleRating\(model.restaurant.id)",
                               in: crossOriginNamespace)
    }
    
    var restaurantName: some View {
        HStack {
            Text(model.restaurantName)
                .withFont(model.restaurantNameFont)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundColor(model.restaurantNameColor)
                .lineLimit(1)
                .multilineTextAlignment(.center)
            
            Spacer()
        }
        .matchedGeometryEffect(id: "restaurantName\(model.restaurant.id)",
                               in: crossOriginNamespace)
    }
    
    var percentMatchLabel: some View {
        ZStack {
            RoundedRectangle(cornerRadius: percentageMatchBackgroundCornerRadius)
                .fill(model.percentageMatchBackgroundColor)
                .frame(width: percentageMatchBackgroundSize.width,
                       height: percentageMatchBackgroundSize.height)
            
            Text(model.percentMatchPercentage)
                .withFont(model.percentageMatchPercentFont)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundColor(model.percentageMatchPercentColor)
                .lineLimit(1)
                .multilineTextAlignment(.center)
        }
        .matchedGeometryEffect(id: "percentMatchLabel\(model.restaurant.id)",
                               in: crossOriginNamespace)
    }
    
    var listRankTextView: some View {
        ZStack {
                Rectangle()
                    .fill(model.listRankBackgroundColor)
                    .cornerRadius(listRankTextViewCornerRadius,
                                  corners: .topLeft)
                    .frame(width: listRankTextViewSize.width,
                           height: listRankTextViewSize.height)
                
                Text(model.formattedListRank)
                    .withFont(model.listRankFont,
                              weight: model.listRankFontWeight)
                    .fixedSize(horizontal: false, vertical: true)
                    .minimumScaleFactor(0.5)
                    .foregroundColor(model.listRankFontColor)
                    .lineLimit(1)
                    .multilineTextAlignment(.center)
                    .padding(.all, listRankTextViewPadding)
        }
        .frame(width: listRankTextViewSize.width,
               height: listRankTextViewSize.height)
    }
    
    var addressTextView: some View {
        Text(model.restaurantAddress)
            .withFont(model.restaurantAddressFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.restaurantPropertiesColor)
            .lineLimit(2)
            .multilineTextAlignment(.leading)
    }
    
    var firstRestaurantCategoryTextView: some View {
        Text(model.restaurantFirstCategoryType)
            .withFont(model.restaurantPropertiesFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.restaurantPropertiesColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .matchedGeometryEffect(id: "firstRestaurantCategoryTextView\(model.restaurant.id)",
                                   in: crossOriginNamespace)
    }
    
    var separatorDot: some View {
        Circle()
            .frame(width: separatorDotSize.width,
                   height: separatorDotSize.height)
            .foregroundColor(model.separatorDotColor)
            .padding(.horizontal, separatorDotHorizontalPadding)
    }
    
    var priceLevelTextView: some View {
        Text(model.priceLevelInDollarSigns)
            .withFont(model.restaurantPropertiesFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.restaurantPropertiesColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .matchedGeometryEffect(id: "priceLevelTextView\(model.restaurant.id)",
                                   in: crossOriginNamespace)
    }
    
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
        .matchedGeometryEffect(id: "favoriteButton\(model.restaurant.id)",
                               in: crossOriginNamespace)
    }
    
    var restaurantImageView: some View {
        Button(action: model.selectionAction) {
                RestaurantImageView(model: model.imageViewModel)
                .frame(width: imageViewWidth)
                .scaledToFit()
                .cornerRadius(imageViewCornerRadius,
                              corners: .allCorners)
                .applyGradient(gradient: model.heroImageOverlayGradient)
        }
        .buttonStyle(GenericSpringyShrink(scaleAmount: 0.95))
        .matchedGeometryEffect(id: "restaurantImageViewButton\(model.restaurant.id)",
                               in: crossOriginNamespace)
    }
}

struct MPRestaurantView_Previews: PreviewProvider {
    
    /// Provisions a view model with a mock restaurant type
    static var mockupModel: MPRestaurantViewModel<HomeTabCoordinator> {
        return .init(restaurantSearchResult: .mock,
                     coordinator: RootCoordinatorDelegate.shared.tabbarCoordinatorSelector.homeTabCoordinator)
    }
    
    static var previews: some View {
        GeometryReader { geom in
            ZStack(alignment: .center) {
                MPRestaurantView(crossOriginNamespace: Namespace().wrappedValue, model: mockupModel)
            }
            .frame(width: geom.size.width,
                   height: geom.size.height)
        }
        .background(Colors.black_1)
    }
}
