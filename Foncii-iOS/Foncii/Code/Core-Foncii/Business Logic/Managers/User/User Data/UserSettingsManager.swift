//
//  UserSettingsManager.swift
//  Foncii
//
//  Created by Justin Cook on 3/21/23.
//

import Foundation

/**
 * Encapsulation responsible for managing user settings and preferences including those saved to this device
 */
class UserSettingsManager: ObservableObject {
    // MARK: - Properties
    var notificationsEnabled: Bool {
        return currentUser?
            .notificationsEnabled ?? false
    }
    
    // MARK: - Singleton
    static let shared: UserSettingsManager = .init()
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let userDefaultsService: UserDefaultsService = inject(),
            userPermissionsManager: UserPermissionsManager.Type = inject(),
            apolloService: GraphQLAPIServiceAdapter = inject(),
            appService: AppService = inject()
        
        lazy var userManager: UserManager = UserSettingsManager.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Convenience
    var currentUser: FonciiUser? {
        return dependencies
            .userManager
            .currentUser
    }
    
    var isClientOnline: Bool {
        dependencies
            .appService
            .getCurrentState(of: \.clientState)
            .isClientOnline
    }
    
    private init() {
        Task {
            await synchronizeSettings()
        }
    }
    
    /// Synchronizes the app's local settings with the user's system level settings
    @MainActor func synchronizeSettings() async {
        await syncUserNotificationPreference()
    }
}

/// API Interactor
extension UserSettingsManager {
    /**
     * Fired when the user toggles the notifications enabled switch in the profile settings. Can prompt the user to authorize
     * notifications with a pop-up or by forcing them to the settings menu after they've denied usage previously. Updates are pushed
     * to the database after passing through system authorization checks below.
     * Note: This function also auto-refreshes the app's user state with the updated data pushed to the database
     *
     * - Main actor since the settings menu screen responds to any updates
     *
     * - Returns: Bool - True if notifications are now enabled, false otherwise (if denied or other cases)
     */
    @discardableResult
    @MainActor func setUserNotificationPreference(remoteNotificationsEnabled: Bool) async -> Bool {
        guard isClientOnline,
              let pushNotificationService: PushNotificationServiceManager = dependencies
            .userPermissionsManager
            .getServiceManager(for: .pushNotificationService) as? PushNotificationServiceManager,
              let userID = currentUser?.id
        else { return !remoteNotificationsEnabled }
        
        await pushNotificationService
            .determineAuthStatus()
        
        // System properties
        let systemNotificationsEnabled: Bool = pushNotificationService
            .isAccessGranted,
        systemNotificationsDenied: Bool = pushNotificationService
            .accessHasBeenDenied
        
        // Pending update to the database
        var remoteNotificationsEnabledPendingUpdate: Bool = remoteNotificationsEnabled
        
        /// User denied using notifications on a system level, force them to go to the settings menu
        /// They'll have to toggle the settings manually and toggle the in-app notification settings
        /// afterwards as well to get the desired effect. If the user denied access and wants to untoggle the in-app setting as well
        /// then they're able to.
        if systemNotificationsDenied
            && remoteNotificationsEnabled
        {
            pushNotificationService.navigateToNotificationSettingsMenu()
            
            return !remoteNotificationsEnabled
        }
        
        /// Prompt the user to authorize notifications first before enabling it remotely,
        /// if already enabled then continue like normal
        if !systemNotificationsEnabled
            && remoteNotificationsEnabled
        {
            remoteNotificationsEnabledPendingUpdate = await dependencies
                .userPermissionsManager
                .getServiceManager(for: .pushNotificationService)
                .askForPermission()
        }
        
        /// Update the database with this new preference
        let result = await dependencies
            .apolloService
            .performUpdateUserNotificationPreferences(userID: userID,
                                                      notificationsEnabled: remoteNotificationsEnabledPendingUpdate)
        
        /// Result must be defined, else return the opposite of the intended change
        /// to revert any associated states backward
        guard let result = result,
              let updatedNotificationsEnabledPreference = result
            .updateUserNotificationPreference
            .notificationsEnabled
        else { return !remoteNotificationsEnabled }
        
        await dependencies
            .userManager
            .updateUser()
        
        return updatedNotificationsEnabledPreference
    }
    
    /**
     * Synchronizes the current user's notification preferences with the system's current settings
     * this allows for auto-updates when the user edits their settings outside of the application. Only updates
     * when the user's local notif pref is true but the sys is false (impossible to send notifs so disable it remotely too)
     *
     * Note: This function also auto-refreshes the app's user state with the updated data pushed to the database,
     * so no need to update at the caller of this method as well
     *
     * - Returns: Bool - The current system preference (truth) that was used to synchronize the user's
     * remote data, conditionally false if specific conditions aren't satisfied such as a valid user being logged in
     */
    @discardableResult
    @MainActor func syncUserNotificationPreference() async -> Bool {
        guard let pushNotificationService: PushNotificationServiceManager = dependencies
            .userPermissionsManager
            .getServiceManager(for: .pushNotificationService) as? PushNotificationServiceManager,
              let currentUser = currentUser
        else { return false }
        
        await pushNotificationService
            .determineAuthStatus()
        
        // System properties
        let systemNotificationsEnabled: Bool = pushNotificationService
            .isAccessGranted,
        // User properties
    userNotificationPreference: Bool = currentUser.notificationsEnabled
        
        if systemNotificationsEnabled != userNotificationPreference
            && !systemNotificationsEnabled
        {
            await setUserNotificationPreference(remoteNotificationsEnabled: systemNotificationsEnabled)
        }
        
        await dependencies
            .userManager
            .updateUser()
        
        return systemNotificationsEnabled
    }
}
