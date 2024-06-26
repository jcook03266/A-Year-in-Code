//
// AnalyticsManager.swift
// Foncii
//
// Created by Justin Cook on 7/4/23 at 6:01 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import Amplitude

/// A high level manager for remotely logging app events such as user searches and
/// conversions, session duration, and crash events
class AnalyticsManager {
    // MARK: - Properties
    // Amplitude
    private let amplitudeService: Amplitude = .instance()
    
    /// The current API key depending on the app's current runtime environment (debug or production)
    private var amplitudeAPIKey: String {
        return ClientNetworkingInfo.shared.amplitudeAPIKey
    }
    
    /// New session tracking begins after a minimum of 1 hour (3.6e+6 [ms]) of inactivity by the application
    /// This makes sense since the person could be dining for an extended period of time and wants to
    /// use the app again in a follow up session following their meal
    private let sessionExpirationInterval: Int = 3600000
    
    // MARK: - Singleton
    static let shared: AnalyticsManager = .init()
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        lazy var userManager: UserManager = AnalyticsManager.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    private init() {
       start()
    }
    
    /// Start and configure the various analytics services
    private func start() {
        setupAmplitude()
    }
}

// MARK: - Amplitude - Metrics
extension AnalyticsManager {
    enum AmplitudeEvents: String, CaseIterable {
        case firstAppLaunchEvent // Logs device ID, triggered only once, when app is installed
        case appLaunchEvent // Triggered every launch
    }
    
    /// The current amplitude session for tracking, string representation of a timestamp [Int64]
    var amplitudeSessionID: String {
        return amplitudeService.getSessionId().description
    }
    
    // MARK: - Setup and Configuration
    private func setupAmplitude() {
        amplitudeService.defaultTracking.sessions = true
        amplitudeService.initializeApiKey(amplitudeAPIKey)
        amplitudeService.minTimeBetweenSessionsMillis = sessionExpirationInterval
    }
    
    /// Associate the current device with the logged in user's credentials
    /// and specify any user specific attributes for advanced segmentation
    /// Note: Only trigger this method when the user logs in or is logged in at launch
    func setAmplitudeUserProperties () {
       guard let currentUser = dependencies
            .userManager
            .currentUser
        else { return }
        
        // Parse user properties
        let userID = currentUser.id
        
        amplitudeService.setUserId(userID)
        amplitudeService.setUserProperties(
            currentUser.__data._data
        )
    }
    
    // MARK: - Logic
    func trackEvent(
        event: AmplitudeEvents,
        with properties: [AnyHashable : Any]?
    ) {
        amplitudeService.logEvent(event.rawValue,
                                  withEventProperties: properties)
    }
}

// MARK: - Algolia - Search Personalization
extension AnalyticsManager {
    
}
 
// MARK: - Crashlytics - Crash Reports & App Metrics
extension AnalyticsManager {
    
}



