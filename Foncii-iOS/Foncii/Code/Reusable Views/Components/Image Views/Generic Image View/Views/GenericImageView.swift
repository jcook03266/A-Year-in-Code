//
// GenericImageView.swift
// Foncii
//
// Created by Justin Cook on 6/29/23 at 10:07 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Shimmer

/// Simple reusable image view for displaying generic URL based asynchronous images
struct GenericImageView: View {
    // Cross-view animation
    var crossOriginNamespace: Namespace.ID? = nil,
        matchedGeometryEffectID: String = UUID().uuidString
    
    // MARK: - Observed
    @StateObject var model: GenericImageViewModel
    
    // MARK: - Image Loading Shimmer Placeholder Properties
    private let shimmerDuration: CGFloat = 2,
                /// Start immediately
                shimmerDelay: CGFloat = 0,
                shimmerBounce: Bool = false
    
    // MARK: - Dimensions
    var shimmerViewCornerRadius: CGFloat = 0
    
    var body: some View {
        mainSection
    }
}

// MARK: - Sections
extension GenericImageView {
    var mainSection: some View {
        imageView
    }
}

// MARK: - Subviews
extension GenericImageView {
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
                view.matchedGeometryEffect(id: matchedGeometryEffectID,
                                           in: crossOriginNamespace!)
                
            })
    }
    
    var placeholderShimmerView: some View {
       Rectangle()
            .foregroundColor(model.shimmerViewColor)
            .shimmering(active: model.isLoading,
                        duration: shimmerDuration,
                        bounce: shimmerBounce,
                        delay: shimmerDelay)
            .cornerRadius(shimmerViewCornerRadius)
    }
}

struct GenericImageView_Previews: PreviewProvider {
    static var sampleImageURLString: String {
        return "https://s3-media3.fl.yelpcdn.com/bphoto/Q0j4awkHOq_NeqVxQ31vfg/o.jpg"
    }
    
    static var previews: some View {
        GenericImageView(model: .init(imageURLString: sampleImageURLString,
                                      placeholderImage: Icons.getIconImage(named: .restaurant_hero_placeholder)))
    }
}
