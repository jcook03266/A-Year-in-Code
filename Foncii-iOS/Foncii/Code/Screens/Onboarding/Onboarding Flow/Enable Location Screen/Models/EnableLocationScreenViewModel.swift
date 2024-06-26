//
//  EnableLocationScreenViewModel.swift
//  Foncii
//
//  Created by Justin Cook on 3/15/23.
//

import SwiftUI
import Combine

class EnableLocationScreenViewModel: CoordinatedGenericViewModel {
    typealias coordinator = OnboardingCoordinator
    
    // MARK: - Properties
    var coordinator: coordinator
    
    // MARK: - Published
    // Permissions
    @Published var isLocationPermissionGranted: Bool = false
    
    // Aggregation
    @Published var displayingAggregationOverlay: Bool = false
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let userPermissionManager: UserPermissionsManager.Type = inject(),
            userManager: UserManager = inject(),
            restaurantAggregationManager: RestaurantAggregator = inject()
        
        var locationPermissionsManager: LocationServiceManager {
            return userPermissionManager
                .userServices
                .locationServicesManager
        }
    }
    let dependencies = Dependencies()
    
    // MARK: - Assets
    let locationScreenArt: Image = ArtAssets.getArtAssetImage(named: .location_screen_art)
    
    // MARK: - Styling
    // Colors
    let backgroundColor: Color = Colors.black_1,
        titleColor: Color = Colors.permanent_white,
        textColor: Color = Colors.neutral_1
    
    // Fonts
    let titleFont: FontStyleRepository = .heading_3,
        subtitleFont: FontStyleRepository = .body
    
    // MARK: - Localized Text
    let titleTextFragment_1: String = LocalizedStrings
        .getLocalizedString(for: .ENABLE_LOCATION_SCREEN_TITLE_FRAGMENT_1),
titleTextFragment_2: String = LocalizedStrings
        .getLocalizedString(for: .ENABLE_LOCATION_SCREEN_TITLE_FRAGMENT_2),
titleTextFragment_3: String = LocalizedStrings
        .getLocalizedString(for: .ENABLE_LOCATION_SCREEN_TITLE_FRAGMENT_3),
titleTextFragment_4: String = LocalizedStrings
        .getLocalizedString(for: .ENABLE_LOCATION_SCREEN_TITLE_FRAGMENT_4),
titleTextFragment_5: String = LocalizedStrings
        .getLocalizedString(for: .ENABLE_LOCATION_SCREEN_TITLE_FRAGMENT_5),
titleTextFragment_6: String = LocalizedStrings
        .getLocalizedString(for: .ENABLE_LOCATION_SCREEN_TITLE_FRAGMENT_6),
subtitleText: String = LocalizedStrings
        .getLocalizedString(for: .ENABLE_LOCATION_SCREEN_SUBTITLE),
enableLocationButtonTitle: String = LocalizedStrings
        .getLocalizedString(for: .ENABLE_LOCATION_SCREEN_BUTTON_TITLE)
    
    var titleFragments: [String] {
        return [
            titleTextFragment_1,
            titleTextFragment_2,
            titleTextFragment_3,
            titleTextFragment_4,
            titleTextFragment_5,
            titleTextFragment_6
        ]
    }
    
    // MARK: - Actions
    /// Allows the user to enable access to their current location at their own discretion
    var triggerEnableLocationPromptAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            let userNeedsToEditSettings = self.dependencies
                .locationPermissionsManager
                .accessHasBeenDenied
            
            guard !userNeedsToEditSettings
            else {
                self.dependencies
                    .locationPermissionsManager
                    .navigateToSettingsMenu()
                
                return
            }
            
            // User has not denied access yet, ask them for permission
            Task { @MainActor in
                await self.dependencies
                    .locationPermissionsManager
                    .askForPermission()
            }
        }
    }
    
    // MARK: - Convenience
    /// The permission button is automatically disabled when the user grants permission, and enabled when permission is revoked
    var locationPermissionButtonEnabled: Bool {
        return !isLocationPermissionGranted
    }
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
        addSubscribers()
    }
    
    // MARK: - Subscriptions
    func addSubscribers() {
        /// Move forward once the user grants permission for us to use their location
        self.dependencies
            .locationPermissionsManager
            .$isAccessGranted
            .receive(on: scheduler)
            .sink { [weak self] locationPermissionGranted in
                guard let self = self
                else { return }
                
                /// Bind location changes to this object
                self.isLocationPermissionGranted = locationPermissionGranted
                
                if locationPermissionGranted {
                    self.transitionToAggregationPhase()
                }
            }
            .store(in: &cancellables)
        
        /// Listen for the current activity of the aggregation manager
        /// If finished aggregating then move on to the next screen / scene
        self.dependencies
            .restaurantAggregationManager
            .$currentActivity
            .receive(on: scheduler)
            .sink { [weak self] activityState in
                guard let self = self
                else { return }
                
                switch activityState {
                case .hibernating,
                        .aggregating,
                        .indexing:
                    break
                case .done, .failed:
                    
                    aggregationCompletionTransition()
                }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Navigation Actions
    /// Trigger this to resign the aggregation UI and navigate onwards
    /// Note: the extra time spent waiting for the UI to transition gives the
    /// backend more time to index the new restaurants if not already
    /// done, so this transition serves a functional and stylistic purpose
    func aggregationCompletionTransition() {
        Task { @MainActor in
            try! await Task.sleep(until: .now + .seconds(2),
                                  clock: .continuous)
            
            self.displayingAggregationOverlay = false
            
            try! await Task.sleep(until: .now + .seconds(1),
                                  clock: .continuous)
            
            self.navigateToNextScreen()
        }
    }
    
    /// Middle-man script used to trigger the aggregation
    /// phase if needed (specifically used during onboarding, and maybe
    /// if the user hasn't yet aggregated any restaurants after signing
    /// up for whatever reason)
    func transitionToAggregationPhase() {
        let restaurantAggregationManager = dependencies.restaurantAggregationManager
        
        let isFirstAggregation = !restaurantAggregationManager.firstAggregationEventOccurred,
            canAggregate = restaurantAggregationManager
            .canAggregate
        
        if (isFirstAggregation && canAggregate) {
            /// This process is super expensive so simulator / preview
            /// envs are not allowed to aggregate
            if !AppService.runningOnSimulator {
                displayingAggregationOverlay = true
                
                restaurantAggregationManager
                    .aggregateRestaurants()
            }
            else {
                navigateToNextScreen()
            }
        }
        else {
            /// Only first time users are supposed to see the loading
            /// overlay, so just go to the next scene if not FTUE.
            /// Any required aggregations will be handled in the
            /// background when the user reaches the main scene
            navigateToNextScreen()
        }
    }
    
    /// Branching path: Navigates to either the favorites section where the user can select their favorite restaurants, or the main scene depending on the current state of the user
    func navigateToNextScreen() {
        guard isLocationPermissionGranted
        else { return }
        
        let userManager = dependencies.userManager
        
        guard let userRequirements = userManager.userRequirements
        else { return }
        
        /// Switch to the main scene if all user requirements are fulfilled, else go to the next requirement to fulfill
        if userRequirements.areAllUserRequirementsFulfilled {
            self.coordinator.rootCoordinatorDelegate.switchToMainScene()
        }
        else {
            let nextRoute = self.coordinator
                .router
                .getNextRouteFrom(route: .enableLocation)
            
            self.coordinator.pushView(with: nextRoute)
        }
    }
}
