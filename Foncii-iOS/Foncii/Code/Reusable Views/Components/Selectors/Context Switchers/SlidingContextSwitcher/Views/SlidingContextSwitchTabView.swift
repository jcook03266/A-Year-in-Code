//
// SlidingContextSwitchTabView.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 11:47 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct SlidingContextSwitchTabView: View {
    // MARK: - Observed
    @StateObject var model: SlidingContextSwitchTabViewModel
    @ObservedObject var parentModel: SlidingContextSwitchViewModel
    
    // MARK: - Dimensions
    private let iconSize: CGSize = .init(width: 24,
                                         height: 24)
    
    // MARK: - Padding
    private let iconBottomPadding: CGFloat = 4
    
    var body: some View {
        mainSection
        .animation(.spring(),
                   value: model.isSelected)
    }
}

// MARK: - Sections
extension SlidingContextSwitchTabView {
    var mainSection: some View {
        HStack {
            Spacer()
            VStack {
                Spacer()
                buttonView
                Spacer()
            }
            Spacer()
        }
    }
}

// MARK: - Subviews
extension SlidingContextSwitchTabView {
    var titleView: some View {
        Text(model.titleString)
            .withFont(model.titleFont,
                      weight: .semibold)
            .fixedSize(horizontal: false, vertical: true)
            .multilineTextAlignment(.center)
            .lineLimit(1)
            .foregroundColor(model.currentForegroundColor)
    }
    
    var iconView: some View {
        Group {
            if let icon = model.icon {
                icon
                    .fittedResizableTemplateImageModifier()
                    .foregroundColor(model.currentForegroundColor)
                    .frame(width: iconSize.width,
                           height: iconSize.height)
                    .padding(.bottom, iconBottomPadding)
            }
        }
    }
    
    var buttonView: some View {
        Button(action: model.selectionToggleAction) {
            VStack(spacing: 0) {
                iconView
                titleView
            }
        }
    }
}

struct SlidingContextSwitchTabView_Previews: PreviewProvider {
    static func getModel() -> SlidingContextSwitchTabViewModel {
        let slidingContextSwitcher: SlidingContextSwitchViewModel = .init(),
            tab: SlidingContextSwitchTabViewModel = .init(title: "Recommendations",
                                                          parentViewModel: slidingContextSwitcher,
                                                          icon: Icons.getIconImage(named: .thumbs_up))
        
        return tab
    }
    
    static var previews: some View {
        let model = getModel()
        
        SlidingContextSwitchTabView(model: model,
                                    parentModel: model.parentViewModel)
    }
}
