//
// SettingsScreen.swift
// Foncii
//
// Created by Justin Cook on 6/27/23 at 12:48 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture

struct SettingsScreen: View {
    // MARK: - Observed
    // Local
    @StateObject var model: SettingsScreenViewModel
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - Dimensions
    private let logOutButtonSize: CGSize = .init(width: 208, height: 48)
    
    // MARK: - Padding + Spacing
    private let backButtonLeadingPadding: CGFloat = 20,
                topPadding: CGFloat = 10,
                headerSectionBottomPadding: CGFloat = 10,
                topRowsSectionTopPadding: CGFloat = 68,
                horizontalPadding: CGFloat = 20,
                notificationSectionHeaderTopPadding: CGFloat = 20,
                notificationSectionHeaderBottomPadding: CGFloat = 5,
                fonciiSectionHeaderHeaderVerticalPadding: CGFloat = 5,
                scrollViewBottomPadding: CGFloat = 100,
                logOutButtonTopPadding: CGFloat = 52
    
    var body: some View {
        mainSection
            .onAppear {
                onloadTasks()
            }
    }
}
 
// MARK: - Functions
extension SettingsScreen {
    func onloadTasks() {
        Task { @MainActor in
            await model.reload()
        }
    }
}

// MARK: - Sections
extension SettingsScreen {
    var mainSection: some View {
        ZStack(alignment: .top) {
            GeometryReader { geom in
                ScrollView(.vertical) {
                    VStack(spacing: 0) {
                        menuSection
                        logOutButton
                    }
                    .padding(.bottom,
                             scrollViewBottomPadding)
                }
                .frame(width: geom.size.width,
                       height: geom.size.height)
            }
            
            headerSection
        }
        .transition(
            .push(from: .bottom)
            .combined(with: .opacity)
        )
        .background(model.backgroundColor)
        .zIndex(1)
    }
    
    var headerSection: some View {
        ZStack {
            HStack(alignment: .center,
                   spacing: 0) {
                backButton
                Spacer()
            }
            
            titleView
        }
               .padding(.top, topPadding)
               .padding(.bottom, headerSectionBottomPadding)
               .background(
                model.backgroundColor.opacity(0.75)
                    .ignoresSafeArea()
               )
    }
    
    var menuSection: some View {
        VStack(spacing: 0) {
            topRowsSection
            notificationRowSection
            fonciiRowsSection
        }
        .padding(.horizontal,
                 horizontalPadding)
    }
    
    var topRowsSection: some View {
        VStack(spacing: 0) {
            // Profile Information Row
            SelectableSettingsMenuRowView(model: model.profileInformationRowViewModel)
            
            // Update Taste Profile Row
            SelectableSettingsMenuRowView(model: model.updateTasteProfileRowViewModel)
            
            // Change Password Row
            SelectableSettingsMenuRowView(model: model.changePasswordRowViewModel)
            
            // Refer To Friends Row
            SelectableSettingsMenuRowView(model: model.referToFriendsRowViewModel)
        }
        .padding(.top,
                 topRowsSectionTopPadding)
    }
    
    var notificationRowSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            notificationSectionHeaderTextView
                .padding(.top,
                         notificationSectionHeaderTopPadding)
                .padding(.bottom, notificationSectionHeaderBottomPadding)
            
            TogglableSettingsMenuRowView(model: model.pushNotificationsRowViewModel)
                .disabled(model.pushNotificationsRowDisabled)
        }
    }
    
    var fonciiRowsSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            fonciiSectionHeaderTextView
                .padding(.vertical, fonciiSectionHeaderHeaderVerticalPadding)
            
            SelectableSettingsMenuRowView(model: model.rateUsRowViewModel)
            
            SelectableSettingsMenuRowView(model: model.helpAndSupportRowViewModel)
                .disabled(true) // Disabled until feature implemented
                .opacity(0.75)
        }
    }
}

// MARK: - Subviews
extension SettingsScreen {
    var notificationSectionHeaderTextView: some View {
        Text(model.notificationsHeaderText)
            .withFont(model.subheadingTextFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.subheadingColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
    }
    
    var fonciiSectionHeaderTextView: some View {
        Text(model.fonciiHeaderText)
            .withFont(model.subheadingTextFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.subheadingColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
    }
    
    var titleView: some View {
        Text(model.settingsMenuTitle)
            .withFont(model.titleFont,
                      weight: model.titleFontWeight)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.titleColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
    }
    
    var backButton: some View {
        BackButton(customBackAction: model.backButtonAction)
        .padding(.leading, backButtonLeadingPadding)
    }
    
    var logOutButton: some View {
        RoundedCTAButton(title: model.logOutButtonTitle,
                         action: model.logOutButtonAction,
                         disabled: !model.isClientOnline,
                         size: logOutButtonSize)
        .padding(.top, logOutButtonTopPadding)
    }
}

struct SettingsScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .tabbarCoordinatorSelector
            .profileTabCoordinator
            .router
            .view(for: .settings)
    }
    
    static var previews: some View {
        getView()
            .background(Colors.black_1)
    }
}
