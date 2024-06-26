//
// RestaurantAggregator.swift
// Foncii
//
// Created by Justin Cook on 5/3/23 at 4:09 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import CoreLocation

/**
 * A managerial instance that handles asynchronous restaurant aggregation events and limits their occurrences based on time between
 * aggregations in order to prevent abuse of the powerful and dynamic restaurant aggregation pipeline
 */
class RestaurantAggregator: ObservableObject {
    // MARK: - Properties
    @Published var currentActivity: ActivityStates = .hibernating
    
    // MARK: - Limits
    /// The amount of the time the client should ideally wait for the newly
    /// aggregated restaurants to be indexed in Algolia, in seconds [S]
    let restaurantIndexGracePeriod: CGFloat = 5
    
    /// The minimum distance the user has to travel in order to trigger another
    /// aggregation event while their client is currently in the
    /// aggregation cool-down period ~ 1 week. In kilometers [KM] ~ 40 miles
    let minimumDistanceBetweenAggregationLocations = 64.3738
    
    /// 7 days minimum between aggregation events unless the user moves to
    /// a new location at least 40 miles away from the last aggregation event
    /// 7 days as a time interval is 7 days * 24 hours * 60 minutes * 60 seconds
    let minimumDaysBetweenAggregationEvents: TimeInterval = .init(7 * 24 * 60 * 60)
    
    // MARK: - Persistence
    /// Keeps track of the last aggregation event's metadata
    /**
     * The date of the user's last aggregation event, used to put the user's
     * client into a cool-down period of ~ 1 week, after which they'll be able to
     * trigger another aggregation event. This cool-down period is overridden when the user
     * travels ~ 40+ miles away from their last aggregation event, allowing them to
     * aggregate more geographically diverse restaurants from around them. This benefits
     * other users around those locations, resulting in a mutually beneficial relationship.
     */
    private (set) var lastAggregationEventDate: Date? {
        get {
            return dependencies
                .userDefaultsService
                .getValueFor(key: .lastAggregationEventDate())
        }
        set {
            dependencies
                .userDefaultsService
                .setValueFor(key: .lastAggregationEventDate(),
                             value: newValue)
        }
    }

    /**
     * The user can aggregate restaurants in the same location once every week,
     * unless they travel ~ 40 miles away from their last location
     * This discourages abuse of our API by dormant users and encourages
     * opportunisitic data aggregation by having users from geographically
     * unique locations contribute to our database
     */
    private (set) var lastAggregationLocation: CLLocationCoordinate2D? {
        get {
            return dependencies
                .userDefaultsService
                .getValueFor(key: .lastAggregationLocation())
        }
        set {
            dependencies
                .userDefaultsService
                .setValueFor(key: .lastAggregationLocation(),
                             value: newValue)
        }
    }
    
    /**
     * This number represents the total amount of times the user has
     * aggregated restaurants for this install of the application on their
     * current device
     */
    private (set) var totalAggregationEvents: Int {
        get {
            return dependencies
                .userDefaultsService
                .getValueFor(type: Int.self,
                             key: .totalAggregationEvents())
        }
        set {
            dependencies
                .userDefaultsService
                .setValueFor(type: Int.self,
                             key: .totalAggregationEvents(),
                             value: newValue)
        }
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let networkService: NetworkingService = inject(),
            userManager: UserManager = inject(),
            userDefaultsService: UserDefaultsService = inject(),
            apolloService: GraphQLAPIServiceAdapter = inject(),
            alertManager: AlertManager = inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - User Service Dependencies
    struct UserDependencies: InjectableUserServices {
        let locationManager: LocationServiceManager = inject()
    }
    let userDependencies = UserDependencies()
    
    // MARK: - Singleton
    static let shared: RestaurantAggregator = .init()
    
    // MARK: - Convenience
    /// Only aggregate if the aggregator awakes from a hibernation or past
    /// failure and all cool-down periods are invalid
    var canAggregate: Bool {
        let isInSteadyState = (currentActivity == .hibernating || currentActivity == .failed || currentActivity == .done),
        isClientUnrestricted = (!isLastAggregationCoolDownPeriodActive() || isUserOutsideOfLastAggregationBoundary())
        
        return isInSteadyState && isClientUnrestricted
    }
    
    /// True if the user has activated at least one aggregation event before, if none has occurred then one has to
    var firstAggregationEventOccurred: Bool {
        return totalAggregationEvents > 0
    }
    
    private init() {}
    
    // MARK: - State Management
    /// An enum describing the various possible activities performed by this instance during different states
    enum ActivityStates: String, CaseIterable {
        case hibernating
        case aggregating
        case indexing
        /// Triggered when this session resulted in a completed aggregation
        /// event, not triggered otherwise (aka when the client is in a
        /// cool-down period)
        case done
        /// Aggregation attempt failed (trying again shouldn't be attempted in this session)
        case failed
    }
}

// MARK: - API Interactor
extension RestaurantAggregator {
    func aggregateRestaurants() {
        guard dependencies
            .networkService
            .isInternetAvailable
        else {
            /// Since this is an important process, if the user's internet connection
            /// is unavailable prompt them to retry this operation when it is
            /// available again
            dependencies
                .alertManager
                .triggerErrorAlert(alertType: .AGGREGATION_ERROR_NO_INTERNET
                ) {
                    self.aggregateRestaurants()
                }
            
            return
        }
        
        // Client information
        let userID = dependencies
            .userManager
            .currentUser?
            .id
        
        let clientCoordinates = userDependencies
            .locationManager
            .currentCoordinates
        
        /// Only proceed if a valid user with a valid coordinate location
        /// is aggregating, and if the user's client is allowed to
        guard let userID = userID,
              let clientCoordinates = clientCoordinates,
              canAggregate
        else { return }
        
        currentActivity = .aggregating
        
        Task { @MainActor in
           let result = await dependencies
                .apolloService
                .performRestaurantAggregation(
                    userID: userID,
                    coordinates: clientCoordinates)
            
            /// If the result is defined then the process was successful
            let aggregationSuccessful = result != nil
            
            /// Mark event as a success and wait for the indexing period to expire
            if aggregationSuccessful {
                aggregationEventDidSucceed()
  
                currentActivity = .indexing
                
                /// Since indexing is a remote process the clock doesn't have to be paused
                try! await Task.sleep(until: .now +
                    .seconds(restaurantIndexGracePeriod),
                           clock: .continuous)
                
                /// Inform any subscribers that the aggregation event
                /// has finished
                currentActivity = .done
            }
            else {
                /// The operation failed, inform subscribers
                currentActivity = .failed
            }
        }
    }
    
    /// Tracks the last location, last date, and summation of aggregation events
    private func aggregationEventDidSucceed() {
        // Client information
        let clientCoordinates = userDependencies
            .locationManager
            .currentCoordinates
 
        guard let clientCoordinates = clientCoordinates
        else { return }
        
        lastAggregationLocation = clientCoordinates
        lastAggregationEventDate = Date.now
        totalAggregationEvents += 1
    }
}

/// Utilities for determining the client's current state relative to the aggregator's restrictions
extension RestaurantAggregator {
    /**
     * - Returns: True if the user's location has exceeded the last aggregation
     * event's recorded location, false otherwise. Default is true if the user has never
     * aggregated before since this is a dependency that will allow first time users to do so
     */
    func isUserOutsideOfLastAggregationBoundary() -> Bool {
        // Client information
        let clientCoordinates = userDependencies
            .locationManager
            .currentCoordinates
        
        guard let lastAggregationLocation = lastAggregationLocation,
              let clientCoordinates = clientCoordinates
        else { return true }
        
        let lastLocation = CLLocation(
            latitude: lastAggregationLocation.latitude,
            longitude: lastAggregationLocation.longitude
        ),
        currentLocation = CLLocation(
            latitude: clientCoordinates.latitude,
            longitude: clientCoordinates.longitude)
        
        /// Computes the difference between the points using the haversine formula
        let distanceDifferenceInMeters = currentLocation.distance(from: lastLocation)

        return distanceDifferenceInMeters >= minimumDistanceBetweenAggregationLocations
    }
    
    /**
     * - Returns: True if the current date is less than the cool down period's
     * expiration date, false otherwise. Default is false if the user has never
     * aggregated before since this is a dependency that will allow first time users to do so
     */
    func isLastAggregationCoolDownPeriodActive() -> Bool {
        guard let lastAggregationEventDate = lastAggregationEventDate
        else { return false }
        
        let currentDate = Date.now,
            expirationDate = lastAggregationEventDate.advanced(by: minimumDaysBetweenAggregationEvents)
        
        return currentDate < expirationDate
    }
}
