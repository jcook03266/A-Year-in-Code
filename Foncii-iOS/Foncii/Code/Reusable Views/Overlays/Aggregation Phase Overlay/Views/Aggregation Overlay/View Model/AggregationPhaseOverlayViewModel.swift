//
// AggregationPhaseOverlayViewModel.swift
// Foncii
//
// Created by Justin Cook on 5/20/23 at 6:29 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Combine
import CoreLocation
import ActivityIndicatorView

/**
 * An intelligent overlay that responds to the restaurant aggregator's published events
 * Can be displayed anywhere because it's loosely coupled and independent of any specific scene
 */
class AggregationPhaseOverlayViewModel: GenericViewModel {
    // MARK: - Published
    @Published var currentActivity: ActivityStates = .searching
    @Published var currentGeocodedLocationText: String = LocalizedStrings
        .getLocalizedString(for: .LOCATION_UNAVAILABLE)
    @Published var loadingIndicatorActive: Bool = true
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let userPermissionManager: UserPermissionsManager.Type = inject(),
            restaurantAggregator: RestaurantAggregator = inject(),
            locationService: LocationServiceManager = inject()
        
        var locationPermissionsManager: LocationServiceManager {
            return userPermissionManager
                .userServices
                .locationServicesManager
        }
    }
    let dependencies = Dependencies()
    
    // MARK: - Assets
    // Animations
    let globeAnimation = LottieAnimationRepository.globe_spin_animation
    
    var currentActivityIndicatorType: ActivityIndicatorView.IndicatorType {
        switch currentActivity {
        case .searching:
            return .growingArc(
                self.dynamicLoadingAnimationColor,
                lineWidth: 1
            )
        case .indexing:
            return .equalizer(count: 20)
        case .done, .failed:
            return .growingCircle
        }
    }
    
    // Images
    var currentStatusIndicatorIcon: Image {
        switch currentActivity {
        case .searching:
            return Icons.getIconImage(named: .map_marker_selected)
        case .indexing:
            return Icons.getIconImage(named: .clock_watch_later)
        case .done:
            return Icons.getIconImage(named: .filled_radio_indicator)
        case .failed:
            return Icons.getIconImage(named: .invalid_xmark_red)
        }
    }
    
    // MARK: - Styling
    // Colors
    let backgroundColor = Colors.black_1,
        titleColor: Color = Colors.permanent_white,
        textColor: Color = Colors.neutral_1,
        loadingIndicatorColor: Color = Colors.primary_1,
        dynamicLoadingAnimationColor: Color = Colors.primary_1
    
    // Fonts
    let titleFont: FontStyleRepository = .heading_3,
        subtitleFont: FontStyleRepository = .body
    
    // MARK: - Localized Text
    var titleText: String {
        var baseString = ""
        
        switch currentActivity {
        case .searching:
            baseString = LocalizedStrings.getLocalizedString(for: .AGGREGATION_PHASE_OVERLAY_SEARCHING_STATE_TITLE)
        case .indexing:
            baseString = LocalizedStrings.getLocalizedString(for: .AGGREGATION_PHASE_OVERLAY_INDEXING_STATE_TITLE)
        case .done:
            baseString = LocalizedStrings.getLocalizedString(for: .AGGREGATION_PHASE_OVERLAY_DONE_STATE_TITLE)
        case .failed:
            baseString = LocalizedStrings.getLocalizedString(for: .AGGREGATION_PHASE_OVERLAY_FAILED_STATE_TITLE)
        }
        
        return baseString + ":"
    }
    
    let subtitleText: String = LocalizedStrings.getLocalizedString(for: .AGGREGATION_PHASE_OVERLAY_SUBTITLE)
    
    init() {
        addSubscribers()
        getGeocodedLocationText()
    }
    
    /// Parses the current geocoded location of the client to display
    func getGeocodedLocationText() {
        let locationService = dependencies.locationService
        
        Task { @MainActor in
            do {
                guard let currentCity = await locationService
                    .getCityFromLocation(),
                      let currentState = await locationService
                    .getStateFromLocation()
                else {
                    /// Fall back if the location can't be determined
                    self.currentGeocodedLocationText = LocalizedStrings
                        .getLocalizedString(for: .LOCATION_UNAVAILABLE)
                    
                    return
                }
                
                self.currentGeocodedLocationText = "\(currentCity), \(currentState)"
            }
        }
    }
    
    // MARK: - State Management
    /// An enum describing the various possible activities performed by this instance during different states
    enum ActivityStates: String, CaseIterable {
        case searching
        case indexing
        case done
        case failed
    }
    
    // MARK: - Subscriptions
    func addSubscribers() {
        let restaurantAggregator = dependencies.restaurantAggregator
        
        /// Update the geocoded location text when the current coordinates update
        AppService
            .shared
            .globalViewStore
            .publisher
            .clientState
            .currentClientLocation
            .receive(on: scheduler)
            .sink { [weak self] _ in
                guard let self = self
                else { return }
                
                self.getGeocodedLocationText()
            }
            .store(in: &cancellables)
        
        /// Listen to the restaurant aggregator and update the UI accordingly
        restaurantAggregator
            .$currentActivity
            .receive(on: scheduler)
            .sink { [weak self] activityState in
                guard let self = self
                else { return }
                
                switch activityState {
                case .hibernating:
                    break
                case .aggregating:
                    self.currentActivity = .searching
                case .indexing:
                    self.currentActivity = .indexing
                case .done:
                    self.currentActivity = .done
                case .failed:
                    self.currentActivity = .failed
                }
            }
            .store(in: &cancellables)
    }
}
