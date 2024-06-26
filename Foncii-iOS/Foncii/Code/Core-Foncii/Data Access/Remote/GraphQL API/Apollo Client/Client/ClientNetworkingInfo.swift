//
// ClientNetworkingInfo.swift
// Foncii
//
// Created by Justin Cook on 4/22/23 at 3:18 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import FonciiApollo

/**
 * General information related to this client necessary for interfacing with the backend services
 */
struct ClientNetworkingInfo {
    // MARK: - Properties
    // Dynamic
    var fonciiServerEndpoint: String,
        amplitudeAPIKey: String
    
    // Static
    let clientID: String,
        schema = FonciiSchema.self,
        fonciiServerAPIKey: String,
        vendorDeviceIdentifier: String = DeviceConstants.device.identifierForVendor?.uuidString ?? "Undetermined" /// App specific identifier for this device, regenerates when the user reinstalls the app, shouldn't be used to keep track of users due to its volatility
    
    // MARK: - Singleton
    static let shared: ClientNetworkingInfo = .init()

    /// Parse the required information from the main info.plist file
    private init() {
        guard let infoPlist = Bundle.main.infoDictionary,
              let clientID = infoPlist[SecretInfoPlistKeys.clientID.rawValue] as? String,
              let fonciiDevServerEndpoint =
                infoPlist[SecretInfoPlistKeys.fonciiDevServerEndpoint.rawValue] as? String,
              let fonciiProdServerEndpoint = infoPlist[SecretInfoPlistKeys.fonciiProdServerEndpoint.rawValue] as? String,
              let fonciiServerAPIKey = infoPlist[SecretInfoPlistKeys.fonciiServerAPIKey.rawValue] as? String,
              let amplitudeProdAPIKey = infoPlist[SecretInfoPlistKeys.amplitudeProdAPIKey.rawValue] as? String,
              let amplitudeDevAPIKey = infoPlist[SecretInfoPlistKeys.amplitudeDevAPIKey.rawValue] as? String
        else {
            ErrorCodeDispatcher
                .SwiftErrors
                .triggerFatalError(for: .infoPlistException)()
        }
        
        self.clientID = clientID
        self.fonciiServerAPIKey = fonciiServerAPIKey
        
        /// Use a local instance of the backend running instead of the actual server to reduce costs
        /// Advisory: be careful when developing with SwiftUI, every UI reload will spin up an instance and keep it occupied with refreshes
        /// Simulators use local backend, but builds to real devices can use the production server
        self.fonciiServerEndpoint = AppService.runningOnSimulator ? fonciiDevServerEndpoint : fonciiProdServerEndpoint
        
        /// Log debug analytic events in the sandbox environment in order to avoid reporting mock events and segmentation properties
        self.amplitudeAPIKey = AppService.isDebug ? amplitudeDevAPIKey : amplitudeProdAPIKey
    }
    
    enum SecretInfoPlistKeys: String, CaseIterable {
        case clientID = "CLIENT_ID"
        case fonciiServerAPIKey = "FONCII_SERVER_API_KEY"
        case fonciiProdServerEndpoint = "FONCII_PROD_SERVER_ENDPOINT"
        case fonciiDevServerEndpoint = "FONCII_DEV_SERVER_ENDPOINT"
        case amplitudeProdAPIKey = "AMPLITUDE_PROD_API_KEY"
        case amplitudeDevAPIKey = "AMPLITUDE_DEV_API_KEY"
    }
}
