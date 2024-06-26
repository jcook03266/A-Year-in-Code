//
// FPRestaurantView.swift
// Foncii
//
// Created by Justin Cook on 6/5/23 at 10:51 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ApolloTestSupport
import FonciiApollo
import ComposableArchitecture

struct FPRestaurantView<coordinator: Coordinator>: View {
    // MARK: - Properties
    // Cross-view animation
    let crossOriginNamespace: Namespace.ID
    
    // MARK: - Observed
    @StateObject var model: FPRestaurantViewModel<coordinator>
    
    @State var isPresenting: Bool = false
    
    // MARK: - Dimensions
    private let size: CGSize = .init(width: 160,
                                     height: 242),
                imageViewCornerRadius: CGFloat = 8,
                percentageMatchBackgroundCornerRadius: CGFloat = 36,
                percentageMatchBackgroundSize: CGSize = .init(width: 44, height: 20),
                thirdPartyPlatformIconSizes: CGSize = .init(width: 16, height: 16),
                favoriteButtonIconSize: CGSize = .init(width: 20,
                                                       height: 20),
                favoriteButtonSize: CGSize = .init(width: 28,
                                                   height: 28),
                separatorDotSize: CGSize = .init(width: 4, height: 4),
                favoriteButtonEdgePadding: CGFloat = 14.5
    
    // MARK: - Spacing + Padding
    private let bottomSectionTopPadding: CGFloat = 12,
                bottomSectionItemSpacing: CGFloat = 4,
                separatorDotHorizontalPadding: CGFloat = 8,
                ratingItemSpacing: CGFloat = 8
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.isSelected)
            .animation(.spring(),
                       value: model.isFavorited)
            .animation(.spring(),
                       value: model.isPresentingDetailView)
    }
}

// MARK: - Sections
extension FPRestaurantView {
    var mainSection: some View {
        VStack(spacing: 0) {
            topSection
            bottomSection
        }
        .onTapGesture {
            model.selectionAction()
        }
        .frame(width: size.width,
               height: size.height)
        .presentation(
            transition: .heroMove,
            isPresented: self.$model.isPresentingDetailView
        ) {
            RestaurantDetailView(model: model.restaurantDetailViewModel)
        }
    }
    
    var topSection: some View {
        ZStack {
            restaurantImageView
            
            HStack {
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
    
    var bottomSection: some View {
        VStack(spacing: bottomSectionItemSpacing) {
            restaurantPropertiesSection
            restaurantName
            ratingSection
        }
        .padding(.top, bottomSectionTopPadding)
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
            googleRating
            separatorDot
            yelpRating
            
            Spacer()
        }
        .withFont(model.restaurantPropertiesFont)
        .fixedSize(horizontal: false, vertical: true)
        .foregroundColor(model.restaurantPropertiesColor)
        .lineLimit(1)
        .multilineTextAlignment(.center)
    }
}

// MARK: - Subviews
extension FPRestaurantView {
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
                    .frame(width: size.width)
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

struct FPRestaurantView_Previews: PreviewProvider {
    /// Provisions a view model with a mock restaurant type
    static var mockupModel: FPRestaurantViewModel<HomeTabCoordinator> {
        return .init(restaurantSearchResult: .mock,
                     coordinator: RootCoordinatorDelegate.shared.tabbarCoordinatorSelector.homeTabCoordinator)
    }
    
    static var previews: some View {
        GeometryReader { geom in
            ZStack(alignment: .center) {
                FPRestaurantView(crossOriginNamespace: Namespace().wrappedValue,
                                 model: mockupModel)
            }
            .frame(width: geom.size.width,
                   height: geom.size.height)
        }
        .background(Colors.black_1)
    }
}
