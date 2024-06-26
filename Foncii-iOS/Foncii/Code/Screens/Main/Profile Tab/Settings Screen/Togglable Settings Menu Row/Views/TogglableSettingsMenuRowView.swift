//
// TogglableSettingsMenuRowView.swift
// Foncii
//
// Created by Justin Cook on 6/27/23 at 1:56 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ActivityIndicatorView

struct TogglableSettingsMenuRowView: View {
    // MARK: - View Model
    @StateObject var model: TogglableSettingsMenuRowViewModel
    
    // MARK: - Dimensions
    private let bottomDividerHeight: CGFloat = 1,
                sideIconSize: CGSize = .init(width: 24,
                                             height: 24),
                activityIndicatorSize: CGSize = .init(width: 24,
                                                      height: 24)
    
    // MARK: - Spacing + Padding
    private let textContentSectionVerticalPadding: CGFloat = 14,
                sideIconTrailingPadding: CGFloat = 16,
                toggleButtonLeadingPadding: CGFloat = 16
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.asyncActivityInProgress)
    }
}

// MARK: - Sections
extension TogglableSettingsMenuRowView {
    var mainSection: some View {
        rowContent
    }
    
    var rowContent: some View {
        HStack(spacing: 0) {
            Group {
                if model.shouldDisplayActivityIndicator {
                    activityIndicator
                }
                else {
                    sideIcon
                }
            }
                .padding(.trailing,
                         sideIconTrailingPadding)
                .transition(.scale)
            
            Spacer()
            
            VStack {
                HStack(spacing: 0) {
                    textContentSection
                    Spacer()
                    
                    toggleButton
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
extension TogglableSettingsMenuRowView {
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
    
    var activityIndicator: some View {
        ActivityIndicatorView(isVisible: $model.asyncActivityInProgress,
                              type: .flickeringDots())
        .frame(width: activityIndicatorSize.width,
               height: activityIndicatorSize.height)
        .foregroundColor(model.activityIndicatorColor)
    }
    
    var sideIcon: some View {
        model.icon
            .fittedResizableTemplateImageModifier()
            .foregroundColor(model.sideIconColor)
            .frame(width: sideIconSize.width,
                   height: sideIconSize.height)
    }
    
    /// Toggle button for show, the cell controls the toggle state
    var toggleButton: some View {
        Toggle(
            isOn: $model.toggleButtonToggled,
            label: {}
        )
            .toggleStyle(.switch)
            .tint(model.toggleSwitchTrackColor)
            .padding(.leading, toggleButtonLeadingPadding)
            .disabled(!model.toggleButtonEnabled)
    }
    
}

struct TogglableSettingsMenuRowView_Previews: PreviewProvider {
    static var previews: some View {
        TogglableSettingsMenuRowView(model: .init(title: "Push Notifications",
                                                  subtitle: "For daily update you will get it",
                                                  icon: Icons.getIconImage(named: .notification_bell),
                                                  toggleButtonToggled: false,
                                                  onToggleAction: {
            return .random()
        }))
        .background(Colors.black_1)
    }
}
