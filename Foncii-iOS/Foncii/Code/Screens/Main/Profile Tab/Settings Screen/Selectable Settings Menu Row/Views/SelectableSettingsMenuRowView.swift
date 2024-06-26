//
// SelectableSettingsMenuRowView.swift
// Foncii
//
// Created by Justin Cook on 6/27/23 at 12:59 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct SelectableSettingsMenuRowView: View {
    // MARK: - View Model
    var model: SelectableSettingsMenuRowViewModel
    
    // MARK: - Dimensions
    private let chevronIndicatorSize: CGSize = .init(width: 8,
                                                     height: 14),
                bottomDividerHeight: CGFloat = 1,
                sideIconSize: CGSize = .init(width: 24,
                                             height: 24)
    
    // MARK: - Spacing + Padding
    private let textContentSectionVerticalPadding: CGFloat = 14,
                sideIconTrailingPadding: CGFloat = 16,
                linkChevronLeadingPadding: CGFloat = 15
    
    var body: some View {
        mainSection
    }
}

// MARK: - Sections
extension SelectableSettingsMenuRowView {
    var mainSection: some View {
        rowButton
    }
    
    var rowButton: some View {
        Button(action: model.selectionAction) {
            HStack(spacing: 0) {
                sideIcon
                    .padding(.trailing,
                             sideIconTrailingPadding)
                
                Spacer()
                
                VStack {
                    HStack(spacing: 0) {
                        textContentSection
                        Spacer()
                        
                        linkChevronButton
                    }
                    
                    bottomDivider
                }
                
            }
        }
    }
    
    var textContentSection: some View {
        VStack(alignment: .leading,
               spacing: 0) {
            titleText
            subtitleText
        }
               .padding(.vertical,
                        textContentSectionVerticalPadding)
    }
}

// MARK: - Subviews
extension SelectableSettingsMenuRowView {
    var titleText: some View {
        Text(model.title)
            .withFont(model.titleFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.titleColor)
            .lineLimit(1)
            .minimumScaleFactor(0.85)
            .multilineTextAlignment(.leading)
    }
    
    var subtitleText: some View {
        Text(model.subtitle)
            .withFont(model.subtitleFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.subtitleColor)
            .lineLimit(1)
            .minimumScaleFactor(0.85)
            .multilineTextAlignment(.leading)
    }
    
    var sideIcon: some View {
        model.icon
            .fittedResizableTemplateImageModifier()
            .foregroundColor(model.sideIconColor)
            .frame(width: sideIconSize.width,
                   height: sideIconSize.height)
    }
    
    var linkChevronButton: some View {
        Button(action: model.selectionAction) {
            model.chevronIndicator
                .fittedResizableTemplateImageModifier()
                .foregroundColor(model.chevronIndicatorColor)
        }
        .buttonStyle(.offsettableButtonStyle)
        .frame(width: chevronIndicatorSize.width,
               height: chevronIndicatorSize.height)
        .padding(.leading,
                 linkChevronLeadingPadding)
    }
    
    var bottomDivider: some View {
        Divider()
            .frame(height: bottomDividerHeight)
            .overlay(model.bottomDividerColor)
    }
}

struct SelectableSettingsMenuRowView_Previews: PreviewProvider {
    static var previews: some View {
        SelectableSettingsMenuRowView(model: .init(title: "Update Food Profile",
                                         subtitle: "Change your food restrictions, etc",
                                         icon: Icons.getIconImage(named: .taste_profile_cutlery)))
        .background(Colors.black_1)
    }
}
