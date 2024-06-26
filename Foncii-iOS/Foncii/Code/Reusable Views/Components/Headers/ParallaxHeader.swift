//
// ParallaxHeader.swift
// Foncii
//
// Created by Justin Cook on 7/21/23 at 3:18 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

/// An offsettable header to insert at the top of some scroll view. Follows the parallax
/// effect principles in the sense that the foreground 'moves' at a different speed relative
/// to the background, which is achieved by offsetting the header content relative to the scroll view's offset
struct ParallaxHeader<Content: View, Space: Hashable>: View {
    let content: () -> Content
    let coordinateSpace: Space
    let defaultHeight: CGFloat

    init(
        coordinateSpace: Space,
        defaultHeight: CGFloat,
        @ViewBuilder _ content: @escaping () -> Content
    ) {
        self.content = content
        self.coordinateSpace = coordinateSpace
        self.defaultHeight = defaultHeight
    }
    
    var body: some View {
        GeometryReader { proxy in
            let offset = offset(for: proxy),
                heightModifier = heightModifier(for: proxy),
            scale = scale(for: proxy)
            
            content()
                .scaledToFill()
                .edgesIgnoringSafeArea(.horizontal)
                .scaleEffect(scale)
                .offset(y: offset)
                .frame(
                    width: proxy.size.width,
                    height: proxy.size.height + heightModifier
                )
        }
        .frame(height: defaultHeight)
    }
    
    /// Computes the scale of the content when the user bounces off the top of the scroll view so as to not expose the background of the header
    private func scale(for proxy: GeometryProxy) -> CGSize {
        let currentHeight = proxy.size.height,
            heightModifier = heightModifier(for: proxy),
            modifierScaleFactor = 0.004,
            scaledHeightModifier = heightModifier * modifierScaleFactor,
            baseHeight = defaultHeight,
            scale = currentHeight / baseHeight, /// Part vs Whole
            normalizedScale = scale + scaledHeightModifier,
            maxScaleClamp = max(normalizedScale, 1),
            minScaleClamp = min(maxScaleClamp, 1.5)
        
        return .init(width: minScaleClamp,
                     height: minScaleClamp)
    }
    
    /// Compute the offset for the embedded content relative to the current frame
    /// it's hosted within
    private func offset(for proxy: GeometryProxy) -> CGFloat {
        let frame = proxy.frame(in: .named(coordinateSpace))
        if frame.minY < 0 {
            return -frame.minY * 0.8
        }
        return -frame.minY
    }
    
    /// Returns a maximum value of the minimum value of the current frame, or 0 if the min
    /// is negative, this is used to remove the extra spacing encountered when offsetting the
    /// target content from the scrollview it's hosted in
    private func heightModifier(for proxy: GeometryProxy) -> CGFloat {
        let frame = proxy.frame(in: .named(coordinateSpace))
        return max(0, frame.minY)
    }
}
