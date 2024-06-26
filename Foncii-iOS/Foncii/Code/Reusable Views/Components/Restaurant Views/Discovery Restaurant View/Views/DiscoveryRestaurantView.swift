//
// DiscoveryRestaurantView.swift
// Foncii
//
// Created by Justin Cook on 4/29/23 at 5:30 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ApolloTestSupport
import FonciiApollo
import ComposableArchitecture

struct DiscoveryRestaurantChipView: View {
    // MARK: - Observed
    @StateObject var model: DiscoveryRestaurantChipViewModel
    
    // Listen for View Store updates
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - Dimensions
    private let size: CGSize = .init(width: 100,
                                     height: 140),
                imageViewCornerRadius: CGFloat = 8,
                borderLineWidth: CGFloat = 2
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.isSelected)
    }
}

// MARK: - Sections
extension DiscoveryRestaurantChipView {
    var mainSection: some View {
        Button(action: model.selectionAction,
               label: {
            VStack(spacing: 0) {
                topSection
                bottomSection
            }
        })
        .buttonStyle(.genericSpringyShrink)
        .frame(width: size.width,
               height: size.height)
    }
    
    var topSection: some View {
        restaurantImageView
    }
    
    var bottomSection: some View {
        VStack(spacing: 0) {
            Text(model.restaurant.name)
                .foregroundColor(model.restaurantNameTextColor)
            
            Text(model.restaurantCuisineType)
                .foregroundColor(model.cuisineTypeTextColor)
        }
        .withFont(model.textFont)
    }
}

// MARK: - Subviews
extension DiscoveryRestaurantChipView {
    var restaurantImageView: some View {
        ZStack {
            RestaurantImageView(model: model.imageViewModel)
                .overlay {
                    if model.isSelected {
                        model.selectionHighlightOverlayColor
                    }
                }
                .cornerRadius(imageViewCornerRadius,
                              corners: .allCorners)
            
            if model.isSelected {
                RoundedRectangle(cornerRadius: imageViewCornerRadius)
                    .stroke(model.selectionHighlightColor,
                            lineWidth: borderLineWidth)
            }
        }
        .scaledToFit()
    }
}

struct DiscoveryRestaurantChipView_Previews: PreviewProvider {
    /// Provisions a view model with a mock restaurant type
    static var mockupModel: DiscoveryRestaurantChipViewModel {
        let mockRestaurant = Mock<Restaurant>()
        
        /// Settings required properties
        mockRestaurant.name = "Rubirosa"
        mockRestaurant.categories = ["Italian", "Pizza"]
        mockRestaurant.heroImageURL = "https://s3-media3.fl.yelpcdn.com/bphoto/F65qqO1RNThFSHKKJ4iTRA/o.jpg"
        
        return .init(restaurant: .from(mockRestaurant))
    }
    
    static var previews: some View {
        GeometryReader { geom in
            ZStack(alignment: .center) {
                DiscoveryRestaurantChipView(model: mockupModel)
            }
            .frame(width: geom.size.width,
                   height: geom.size.height)
        }
        .background(Colors.black_1)
    }
}
