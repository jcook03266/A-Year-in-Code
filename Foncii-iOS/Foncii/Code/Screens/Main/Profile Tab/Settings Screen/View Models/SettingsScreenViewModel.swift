//
// SettingsScreenViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/27/23 at 12:48 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

class SettingsScreenViewModel: CoordinatedGenericViewModel {
    typealias coordinator = ProfileTabCoordinator
    
    // MARK: - Properties
    var coordinator: coordinator
    
    enum SettingsMenuRows: String, CaseIterable {
        case profileInformationRow
        case updateTasteProfileRow
        case changePasswordRow
        case referToFriendsRow
        case pushNotificationsRow
        case rateUsRow
        case helpAndSupportRow
    }
    
    var currentPushNotificationsToggleStatus: Bool {
        return dependencies
            .userSettingsManager
            .notificationsEnabled
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let systemLinker: SystemLinker = inject(),
            userSettingsManager: UserSettingsManager = inject(),
            appService: AppService = inject()
        
        lazy var userManager: UserManager = SettingsScreenViewModel.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Styling
    // Assets
    let profileInformationRowIcon: Image = Icons.getIconImage(named: .user),
        updateTasteProfileRowIcon: Image = Icons.getIconImage(named: .taste_profile_cutlery),
        changePasswordRowIcon: Image = Icons.getIconImage(named: .lock),
        referToFriendsRowIcon: Image = Icons.getIconImage(named: .mail),
        pushNotificationsRowIcon: Image = Icons.getIconImage(named: .notification_bell),
        rateUsRowIcon: Image = Icons.getIconImage(named: .star_filled),
        helpAndSupportRowIcon: Image = Icons.getIconImage(named: .help_safety_buoy)
    
    // Colors
    let backgroundColor: Color = Colors.black_1,
        titleColor: Color = Colors.permanent_white,
        subheadingColor: Color = Colors.permanent_white.opacity(0.75),
        rowIconColor: Color = Colors.medium_1,
        rowTitleColor: Color = Colors.permanent_white,
        rowSubtitleColor: Color = Colors.neutral_1,
        toggleSwitchThumbColor: Color = Colors.permanent_white,
        toggleSwitchTrackColor: Color = Colors.primary_1
    
    // Fonts
    let titleFont: FontStyleRepository = .subtitle,
        titleFontWeight: UIFont.Weight = .semibold,
        subheadingTextFont: FontStyleRepository = .subtitle_bold
    
    // MARK: - Localized Text
    let profileInformationRowTitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_PROFILE_INFORMATION_ROW_TITLE),
profileInformationRowSubtitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_PROFILE_INFORMATION_ROW_SUBTITLE),
updateTasteProfileRowTitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_UPDATE_TASTE_PROFILE_ROW_TITLE),
updateTasteProfileRowSubtitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_UPDATE_TASTE_PROFILE_ROW_SUBTITLE),
changePasswordRowTitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_CHANGE_PASSWORD_ROW_TITLE),
changePasswordRowSubtitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_CHANGE_PASSWORD_ROW_SUBTITLE),
referToFriendsRowTitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_REFER_TO_FRIENDS_ROW_TITLE),
referToFriendsRowSubtitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_REFER_TO_FRIENDS_ROW_SUBTITLE),
pushNotificationsRowTitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_PUSH_NOTIFICATIONS_ROW_TITLE),
pushNotificationsRowSubtitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_PUSH_NOTIFICATIONS_ROW_SUBTITLE),
rateUsRowTitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_RATE_US_ROW_TITLE),
rateUsRowSubtitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_RATE_US_ROW_SUBTITLE),
helpAndSupportRowTitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_HELP_AND_SUPPORT_ROW_TITLE),
helpAndSupportRowSubtitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS_SCREEN_HELP_AND_SUPPORT_ROW_SUBTITLE),
notificationsHeaderText: String = LocalizedStrings
        .getLocalizedString(for: .NOTIFICATIONS),
fonciiHeaderText: String = LocalizedStrings
        .getLocalizedString(for: .APP_NAME),
settingsMenuTitle: String = LocalizedStrings
        .getLocalizedString(for: .SETTINGS),
logOutButtonTitle: String = LocalizedStrings
        .getLocalizedString(for: .LOG_OUT)
    
    // MARK: - Convenience
    var isClientOnline: Bool {
        return dependencies
            .appService
            .isClientOnline
    }
    
    /// Disabled when no internet access to prevent playing with the button when no updates are possible
    var pushNotificationsRowDisabled: Bool {
        return !isClientOnline
    }
    
    // MARK: - Actions
    var profileInformationRowAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            // Verify Using FaceID before navigating to the target view

        }
    }
    var updateTasteProfileRowAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .presentFullScreenCover(with: .tasteProfileQuestionnaire)
        }
    }
    
    var changePasswordRowAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            // Verify Using FaceID before navigating to the target view
        }
    }
    
    var referToFriendsRowAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            
        }
    }
    
    var pushNotificationsRowToggleAction: (() async -> Bool) {
        return { @MainActor [weak self] in
            guard let self = self,
                  self.currentPushNotificationsToggleStatus != self.pushNotificationsRowViewModel.toggleButtonToggled
            else { return self?.currentPushNotificationsToggleStatus ?? false }
            
            let isToggled = await self.dependencies
                .userSettingsManager
                .setUserNotificationPreference(remoteNotificationsEnabled: !self.currentPushNotificationsToggleStatus)
            
            return isToggled
        }
    }
    
    var rateUsRowAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            /// User has manually asked to leave a review
            dependencies
                .systemLinker
                .open(link: .appStoreWriteReview)
        }
    }
    
    var helpAndSupportRowAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            
        }
    }
    
    /// Refresh action triggered when the user scrolls up to the top of a connected scroll view
    var refreshAction: @Sendable () async -> Void {
        return { @MainActor [weak self] in
            guard let self = self
            else { return }
            
            await self.reload()
        }
    }
    
    var backButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .popView()
        }
    }
    
    /// Securely logs the user out of the application and resets all accrued state logic
    var logOutButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self,
                  isClientOnline
            else { return }
            
            Task { @MainActor in
                await self.dependencies
                    .userManager
                    .signOut()
            }
        }
    }

    // MARK: - Models
    var profileInformationRowViewModel: SelectableSettingsMenuRowViewModel!,
        updateTasteProfileRowViewModel: SelectableSettingsMenuRowViewModel!,
        changePasswordRowViewModel: SelectableSettingsMenuRowViewModel!,
        referToFriendsRowViewModel: SelectableSettingsMenuRowViewModel!,
        pushNotificationsRowViewModel: TogglableSettingsMenuRowViewModel!,
        rateUsRowViewModel: SelectableSettingsMenuRowViewModel!,
        helpAndSupportRowViewModel: SelectableSettingsMenuRowViewModel!
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
        
        initModels()
    }
    
    private func initModels() {
        SettingsMenuRows.allCases.forEach { row in
            switch row {
            case .profileInformationRow:
                profileInformationRowViewModel = .init(
                    title: profileInformationRowTitle,
                    subtitle: profileInformationRowSubtitle,
                    icon: profileInformationRowIcon,
                    onSelectAction: profileInformationRowAction)
                
            case .updateTasteProfileRow:
                updateTasteProfileRowViewModel = .init(
                    title: updateTasteProfileRowTitle,
                    subtitle: updateTasteProfileRowSubtitle,
                    icon: updateTasteProfileRowIcon,
                    onSelectAction: updateTasteProfileRowAction)
                
            case .changePasswordRow:
                changePasswordRowViewModel = .init(
                    title: changePasswordRowTitle,
                    subtitle: changePasswordRowSubtitle,
                    icon: changePasswordRowIcon,
                    onSelectAction: changePasswordRowAction)
                
            case .referToFriendsRow:
                referToFriendsRowViewModel = .init(
                    title: referToFriendsRowTitle,
                    subtitle: referToFriendsRowSubtitle,
                    icon: referToFriendsRowIcon,
                    onSelectAction: referToFriendsRowAction)
                
            case .pushNotificationsRow:
                pushNotificationsRowViewModel = .init(
                    title: pushNotificationsRowTitle,
                    subtitle: pushNotificationsRowSubtitle,
                    icon: pushNotificationsRowIcon,
                    toggleButtonToggled: currentPushNotificationsToggleStatus,
                    onToggleAction: pushNotificationsRowToggleAction)
                
            case .rateUsRow:
                rateUsRowViewModel = .init(
                    title: rateUsRowTitle,
                    subtitle: rateUsRowSubtitle,
                    icon: rateUsRowIcon,
                    onSelectAction: rateUsRowAction)
                
            case .helpAndSupportRow:
                helpAndSupportRowViewModel = .init(
                    title: helpAndSupportRowTitle,
                    subtitle: helpAndSupportRowSubtitle,
                    icon: helpAndSupportRowIcon,
                    onSelectAction: helpAndSupportRowAction)
            }
        }
    }
    
    // MARK: - State Management
    /// Reload some of the state tied to this screen
    @MainActor func reload() async {
        /// Sync up the user's various settings, remote and local
        await dependencies
            .userSettingsManager
            .synchronizeSettings()
        
        /// Update push notification row since it's not tied to the app's state, only local states
        self.pushNotificationsRowViewModel
            .toggleButtonToggled = currentPushNotificationsToggleStatus
    }
    
    // MARK: - Business Logic
    /// Returns the current state if the notification status failed to update, else the updated toggle state if it did update successfully with the backend
    @MainActor func toggleUserNotifications(notificationsEnabled: Bool) async -> Bool {
        // Update store which will persist to user defaults as well
        
        return true
    }
}
