//
//  UserPermissionsManager.swift
//  Foncii
//
//  Created by Justin Cook on 2/21/23.
//

import Foundation

/// A static simple manager that encapsulates all supported privatized iOS OS-level user services such as location services
/// Each service can be interacted with via this static entry point
class UserPermissionsManager: NSObject {
    // MARK: - Service Manager Container
    /// Container in which all managed ios user services live
    struct UserServices {
        let locationServicesManager: LocationServiceManager = .shared,
            pushNotificationServiceManger: PushNotificationServiceManager = .shared
    }
    static let userServices = UserServices()
    
    override init() { super.init() }
    
    // MARK: - Business Logic
    static func getServiceManager(for service: SupportedUserServices) -> any PermissibleiOSService {
        switch service {
        case .locationService:
            return userServices.locationServicesManager
        case .contactsService:
            return userServices.locationServicesManager
        case .pushNotificationService:
            return userServices.pushNotificationServiceManger
        }
    }
    
    static func hasPermissionToUse(service: SupportedUserServices) -> Bool {
        switch service {
        case .locationService:
            return userServices.locationServicesManager.isAccessGranted
        case .contactsService:
            return userServices.locationServicesManager.isAccessGranted
        case .pushNotificationService:
            return userServices.pushNotificationServiceManger.isAccessGranted
        }
    }
    
    /// Only ask for permission if the user hasn't already granted access yet, this is handled by the service manager already
    @discardableResult
    @MainActor static func askForPermissionToUse(service: SupportedUserServices) async -> Bool {
        switch service {
        case .locationService:
            return await userServices.locationServicesManager.askForPermission()
        case .contactsService:
            return await userServices.locationServicesManager.askForPermission()
        case .pushNotificationService:
            return await userServices.pushNotificationServiceManger.askForPermission()
        }
    }
    
    /// All supported / required services needed for the functionality of this application
    enum SupportedUserServices: String, CaseIterable {
        case locationService,
             contactsService,
            pushNotificationService
    }
}
