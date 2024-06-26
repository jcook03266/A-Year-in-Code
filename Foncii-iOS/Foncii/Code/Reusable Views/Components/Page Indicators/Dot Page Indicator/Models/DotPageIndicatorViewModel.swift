//
// DotPageIndicatorViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 11:00 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

class DotPageIndicatorViewModel: GenericViewModel {
    // MARK: - Properties
    @Published var currentPageIndex: Int = 0
    
    // Component based updates
    var interactionsEnabled: Bool = true
    
    // Limits
    let totalPages: Int
    
    /// Zero-indexed index of the last page
    var maxPageIndex: Int {
        return totalPages - 1
    }
    
    // MARK: - Styling
    // Colors
    let activeDotColor: Color = Colors.medium_1,
        inactiveDotColor: Color = Colors.medium_dark_grey_1
    
    // MARK: - Convenience
    /// One-indexed page number
    var currentPage: Int {
        return (currentPageIndex + 1)
    }
    
    init(
        totalPages: Int,
        interactionsEnabled: Bool = true
    ) {
        self.totalPages = totalPages
        self.interactionsEnabled = interactionsEnabled
    }
    
    /// Updates the current page index to the provided index so long as the new page index is within the expected bounds
    /// Note: Use this instead of directly updating the published value in order to stay within the index bounds
    func selectPageIndex(pageIndex: Int) {
        guard isPageIndexInBounds(pageIndex: pageIndex)
        else {
            return
        }
        
        self.currentPageIndex = pageIndex
    }
    
    /// True if the page is within the current boundaries supported by this page indicator, false otherwise (out of bounds)
    private func isPageIndexInBounds(pageIndex: Int) -> Bool {
        return pageIndex <= maxPageIndex || pageIndex >= 0
    }
}
