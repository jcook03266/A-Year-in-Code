//
//  PermissibleiOSServiceProtocol.swift
//  Foncii
//
//  Created by Justin Cook on 2/21/23.
//

import Foundation

/// A protocol describing any private iOS service the user can allow this application access to via their privacy settings
protocol PermissibleiOSService: ObservableObject {
    associatedtype Service: PermissibleiOSService
    
    // MARK: - Singleton
    static var shared: Service { get }
    
    // MARK: - Properties
    /// Describes whether or not the app absolutely requires this service to function, if the user doesn't grant access then the UI cannot progress forward unless permission is granted
    /// (i.e location services)
    var isCriticalService: Bool { get }
    /// States whether or not the user has explicitly denied access to this service previously, if so forward them to the settings menu, effective from iOS-14 and above
    var accessHasBeenDenied: Bool { get set }
    
    // MARK: - Published
    var isAccessGranted: Bool { get set }
    
    // MARK: - Functions
    /// Setup any delegate references and other proprietary case by case service based settings etc.
    func setup()
    
    /// If the app doesn't have permission to access this private service then request it from the user
    @discardableResult
    @MainActor func askForPermission() async -> Bool
    
    /// Determines the authorization status of the service (on startup or whenever necessary)
    @discardableResult
    @MainActor func determineAuthStatus() async -> Bool

    /// Route the user to the general settings menu for the app so that they can manually change the settings
    func navigateToSettingsMenu()
}

extension PermissibleiOSService {
    func navigateToSettingsMenu() {
        DeepLinkManager
            .shared
            .open(systemLink: .openSettings)
    }
}
