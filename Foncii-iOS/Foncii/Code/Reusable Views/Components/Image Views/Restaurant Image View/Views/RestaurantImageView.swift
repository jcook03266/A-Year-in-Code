//
// RestaurantImageView.swift
// Foncii
//
// Created by Justin Cook on 4/29/23 at 11:14 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Shimmer

/// Simple reusable image view for displaying restaurant specific images
struct RestaurantImageView: View {
    // Cross-view animation
    var crossOriginNamespace: Namespace.ID? = nil,
        matchedGeometryEffectID: String = UUID().uuidString
    
    // MARK: - Observed
    @StateObject var model: RestaurantImageViewModel
    
    // MARK: - Image Loading Shimmer Placeholder Properties
    private let shimmerDuration: CGFloat = 2,
                /// Start immediately
                shimmerDelay: CGFloat = 0,
                shimmerBounce: Bool = false
    
    // MARK: - Dimensions
    var cornerRadius: CGFloat = 8
    
    var body: some View {
        mainSection
    }
}

// MARK: - Sections
extension RestaurantImageView {
    var mainSection: some View {
        imageView
            .cornerRadius(cornerRadius,
                          corners: .allCorners)
    }
}

// MARK: - Subviews
extension RestaurantImageView {
    var imageView: some View {
        Group {
            if let image = model.image {
                image
                    .filledResizableOriginalImageModifier()
            }
            else {
                placeholderShimmerView
            }
        }
        .zIndex(1)
        .transition(.opacity)
        .if(crossOriginNamespace != nil,
            transform: { view in
            view.matchedGeometryEffect(
                id: matchedGeometryEffectID,
                in: crossOriginNamespace!)
            
        })
            .if(model.imageSize != .none, transform: { view in
                view.frame(height: model.imageSize.getSize().height)
            })
    }
    
    var placeholderShimmerView: some View {
        Rectangle()
            .foregroundColor(model.shimmerViewColor)
            .shimmering(active: model.isLoading,
                        duration: shimmerDuration,
                        bounce: shimmerBounce,
                        delay: shimmerDelay)
    }
}

struct RestaurantImageView_Previews: PreviewProvider {
    static var sampleRestaurantHeroImageURLString: String {
        return "https://s3-media3.fl.yelpcdn.com/bphoto/Q0j4awkHOq_NeqVxQ31vfg/o.jpg"
    }
    
    static var previews: some View {
        RestaurantImageView(model: .init(
            imageURLString: sampleRestaurantHeroImageURLString,
            imageSize: .hero)
        )
    }
}
