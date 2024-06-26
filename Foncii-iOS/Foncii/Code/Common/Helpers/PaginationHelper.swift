//
// PaginationHelper.swift
// Foncii
//
// Created by Justin Cook on 7/9/23 at 12:22 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import SwiftUI

/// Simple helper for minimizing shared code between views that rely on
/// pagination to infinitely scroll through content
struct PaginationHelper {
    /**
     * - Returns: True if the given scroll view's offset exceeds the
     * lower boundary needed in order to 'paginate' to its next page / list
     * of content to add to the existing scroll view hierarchy
     */
    @inlinable
    static func paginationThresholdReached(
        for scrollViewOffset: CGPoint,
        scrollViewContentSize: CGSize
    ) -> Bool {
        /// Add the device's base height to the y offset to get the real
        /// offset relative to the screen's dimensions
        let deviceBaseHeight: CGFloat = DeviceConstants.getDeviceSize().1
        let yOffset: CGFloat = scrollViewOffset.y + deviceBaseHeight
        
        let scrollViewBottom: CGFloat = scrollViewContentSize.height
        
        return yOffset >= scrollViewBottom
    }
    
    /**
     * - Returns: True if the given scroll view's offset exceeds the
     * lower boundary needed in order to 'paginate' to its next page / list
     * of content to add to the existing scroll view hierarchy. This is used
     * directly within the scroll view unlike the
     * `paginationThresholdReached` method which can be used
     * anywhere else.
     */
    @inlinable
    static func scrollViewCanPaginate(
        newOffset: CGPoint,
        scrollViewContentSize: CGSize,
        viewGeometryProxy: GeometryProxy
    ) -> Bool {
        /// The difference between the scrollview's height and the content view is the maximum offset the user can scroll
        let scrollViewHeight: CGFloat = viewGeometryProxy.size.height,
            updateThreshold: CGFloat = scrollViewContentSize.height - scrollViewHeight,
            updateBuffer: CGFloat = 200, /// A small buffer before the real threshold that will allow content to load in before the user sees it
        normalizedOffset = newOffset.negated(),
            buffedUpdateThreshold: CGFloat = updateThreshold - updateBuffer
        
        /// Faster way of paginating, updating the scroll view offset reloads the view too much and causes performance drops
        return normalizedOffset.y > buffedUpdateThreshold
    }
}
