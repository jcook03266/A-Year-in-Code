//
// PushNotificationServiceManager.swift
// Foncii
//
// Created by Justin Cook on 6/28/23 at 6:10 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import UserNotifications

class PushNotificationServiceManager: NSObject, PermissibleiOSService {
    typealias Service = PushNotificationServiceManager
    
    // MARK: - Singleton
    static let shared: Service = .init()
    
    // MARK: - Properties
    let isCriticalService: Bool = true,
    // Service Implementation
userNotificationService: UNUserNotificationCenter = .current(),
userNotificationAuthOptions: UNAuthorizationOptions = [.providesAppNotificationSettings,
                                                       .provisional, // Sent even when quiet notifications enabled
                                                       .sound,
                                                       .badge,
                                                       .alert]
    
    var accessHasBeenDenied: Bool = false
    
    // MARK: - Published
    // Authorization
    @Published var isAccessGranted: Bool = false
    
    private override init() {
        super.init()
        
        setup()
    }
    
    func setup() {
        // User Notification Services
        userNotificationService.delegate = self
        
        Task {
            await determineAuthStatus()
        }
    }
    
    @discardableResult
    @MainActor func askForPermission() async -> Bool {
        guard !isAccessGranted
        else { return true }
        
        do {
            return try await userNotificationService
                .requestAuthorization(options: userNotificationAuthOptions)
        } catch {
            ErrorCodeDispatcher
                .SwiftErrors
                .printErrorCode(for: .userNotificationAuthorizationRequestFailed)
            
            return false
        }
    }
    
    @discardableResult
    @MainActor func determineAuthStatus() async -> Bool {
        let notificationSettings = await userNotificationService.notificationSettings(),
            authStatus = notificationSettings.authorizationStatus
        
        switch authStatus {
        case .notDetermined:
            // Permission by the user has not yet been asked
            isAccessGranted = false
        case .denied:
            // The user has explicitly denied permission to use this service
            accessHasBeenDenied = true
            isAccessGranted = false
        case .authorized, .provisional, .ephemeral:
            // User has granted permission
            isAccessGranted = true
        @unknown default:
            // Permission status is unknown
            isAccessGranted = false
        }
        
        if isAccessGranted == true {
            accessHasBeenDenied = false
        }
        
        return isAccessGranted
    }
    
    /// For navigating directly to notification settings for this application
    func navigateToNotificationSettingsMenu() {
        DeepLinkManager
            .shared
            .open(systemLink: .openNotificationSettings)
    }
}

// MARK: - Delegate Implementation - UNUserNotificationCenterDelegate
extension PushNotificationServiceManager: UNUserNotificationCenterDelegate {
    /// Opens the in-app settings menu to control notification preferences (if available)
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        openSettingsFor notification: UNNotification?
    ) {
        // TODO: - Set up deeplink for settings menu
        return
    }
}
