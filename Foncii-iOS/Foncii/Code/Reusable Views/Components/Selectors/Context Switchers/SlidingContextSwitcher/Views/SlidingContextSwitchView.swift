//
// SlidingContextSwitchView.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 11:47 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import OrderedCollections

struct SlidingContextSwitchView: View {
    // MARK: - Properties
    @Namespace private var slidingContextSwitchViewNamespace
    private let selectionUnderlineMatchedGeomID = "selectionUnderline"
    
    // MARK: - Observed
    @StateObject var model: SlidingContextSwitchViewModel
    
    // MARK: - Dimensions
    private let selectionUnderlineHeight: CGFloat = 2
    
    // MARK: - Padding
    private let padding: CGFloat = 5
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.currentlySelectedTab)
    }
}

// MARK: - Sections
extension SlidingContextSwitchView {
    var mainSection: some View {
        VStack(spacing: 0) {
            tabViewContainer
        }
        .fixedSize(horizontal: false, vertical: true)
        .clipped()
        .background(model.backgroundColor)
    }
    
    var tabViewContainer: some View {
        HStack(spacing: 0) {
            ForEach(model.tabs, id: \.id) { tabViewModel in
                VStack(spacing: 0) {
                    SlidingContextSwitchTabView(model: tabViewModel,
                                                parentModel: tabViewModel.parentViewModel)
                    .padding(.all, padding)
                    .padding(.bottom,
                             tabViewModel.isSelected ? 0 : selectionUnderlineHeight)
                    
                    Group {
                        if tabViewModel.isSelected {
                            selectionUnderline
                        }
                    }
                    .matchedGeometryEffect(id: selectionUnderlineMatchedGeomID,
                                           in: slidingContextSwitchViewNamespace)
                }
            }
        }
    }
}

// MARK: Subviews
extension SlidingContextSwitchView {
    var selectionUnderline: some View {
        Rectangle()
            .fill(model.selectionUnderlineColor)
            .frame(height: selectionUnderlineHeight)
    }
}

struct SlidingContextSwitchView_Previews: PreviewProvider {
    static func getModel() -> SlidingContextSwitchViewModel {
        let slidingContextSwitcher: SlidingContextSwitchViewModel = SlidingContextSwitchViewModel { parentViewModel in
            let tab_1: SlidingContextSwitchTabViewModel = .init(title: "Overview",
                                                                parentViewModel: parentViewModel),
                tab_2: SlidingContextSwitchTabViewModel = .init(title: "Menu",
                                                                parentViewModel: parentViewModel),
                tab_3: SlidingContextSwitchTabViewModel = .init(title: "Photos",
                                                                parentViewModel: parentViewModel)
            
            parentViewModel.currentlySelectedTab = tab_1
            
            return [tab_1, tab_2, tab_3]
        }
        
        return slidingContextSwitcher
    }
    
    static var previews: some View {
        SlidingContextSwitchView(model: getModel())
    }
}
