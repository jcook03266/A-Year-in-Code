//
// DotPageIndicator.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 11:00 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct DotPageIndicator: View {
    // MARK: - Properties
    @Namespace var dotPageIndicatorNameSpace
    
    // MARK: - Observed
    @StateObject var model: DotPageIndicatorViewModel
    
    // MARK: - Dimensions
    private let dotSize: CGSize = .init(width: 8,
                                        height: 8)
    
    // MARK: - Spacing + Padding
    private let dotSpacing: CGFloat = 7
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.currentPageIndex)
    }
}

// MARK: - Sections
extension DotPageIndicator {
    var mainSection: some View {
        GeometryReader { geom in
            ScrollView(.horizontal) {
                dotSection
                    .frame(width: geom.size.width,
                           height: geom.size.height)
            }
        }
        .frame(height: dotSize.height)
    }
    
    var dotSection: some View {
        HStack(spacing: dotSpacing) {
            ForEach(0..<model.totalPages,
                    id: \.self) { index in
                let isPageIndexSelected = model.currentPageIndex == index
                
                Button {
                    model.selectPageIndex(pageIndex: index)
                    
                    HapticFeedbackDispatcher
                        .gentleButtonPress()
                } label: {
                    Circle()
                        .fill(isPageIndexSelected ? model.activeDotColor : model.inactiveDotColor)
                        .frame(width: dotSize.width,
                               height: dotSize.height)
                        .id(isPageIndexSelected)
                        .transition(.scale.animation(.spring()))
                }
                .buttonStyle(.genericSpringyShrink)
                .disabled(!model.interactionsEnabled)
            }
        }
    }
}

struct DotPageIndicator_Previews: PreviewProvider {
    static var previews: some View {
        GeometryReader { geom in
            DotPageIndicator(model: .init(totalPages: 8))
                .frame(width: geom.size.width,
                       height: geom.size.height)
        }
            .background(Colors.black_1)
    }
}
