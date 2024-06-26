//
// TogglableSettingsMenuRowViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/27/23 at 1:56 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Combine

class TogglableSettingsMenuRowViewModel: GenericViewModel {
    // MARK: - Properties
    let title: String,
        subtitle: String,
        icon: Image
    
    /// External action that determines the internal toggle state of this component
    @MainActor var onToggleAction: (() async -> Bool)
    
    var lastToggleState: Bool
    
    // MARK: - Published
    @Published var toggleButtonToggled: Bool = false
    @Published var asyncActivityInProgress: Bool = false // Toggle is disabled when some activity is in progress to prevent race conditions
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Styling
    // Assets
    let chevronIndicator: Image = Icons.getIconImage(named: .forward_chevron)
    
    // Colors
    let sideIconColor: Color = Colors.medium_1,
        titleColor: Color = Colors.permanent_white,
        subtitleColor: Color = Colors.neutral_1,
        toggleSwitchThumbColor: Color = Colors.permanent_white,
        toggleSwitchTrackColor: Color = Colors.primary_1,
        activityIndicatorColor: Color = Colors.primary_1
    
    // Fonts
    let titleFont: FontStyleRepository = .subtitle_bold,
        subtitleFont: FontStyleRepository = .caption
    
    // MARK: - Convenience
    var isClientOnline: Bool {
        return AppService
            .shared
            .getCurrentState(of: \.clientState)
            .isClientOnline
    }
    
    var toggleButtonEnabled: Bool {
        return !asyncActivityInProgress || !isClientOnline
    }
    
    var shouldDisplayActivityIndicator: Bool {
        return asyncActivityInProgress
    }
    
    // MARK: - Actions
    var toggleAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            Task { @MainActor in
                self.asyncActivityInProgress = true
                
                // Update the current and last toggle state based on custom closure logic
                self.toggleButtonToggled = await self.onToggleAction()
                self.lastToggleState = self.toggleButtonToggled
                
                self.asyncActivityInProgress = false
            }
        }
    }
    
    init(
        title: String,
        subtitle: String,
        icon: Image,
        toggleButtonToggled: Bool = false,
        onToggleAction: @escaping (() async -> Bool)
    ) {
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.toggleButtonToggled = toggleButtonToggled
        self.onToggleAction = onToggleAction
        self.lastToggleState = toggleButtonToggled
        
        addSubscribers()
    }
    
    // MARK: - Subscriptions
    func addSubscribers() {
        /// Listen for updates to the toggle state and trigger the custom action that will determine
        /// the button's actual toggle state
        self.$toggleButtonToggled
            .receive(on: scheduler)
            .sink { [weak self] toggled in
                guard let self = self
                else { return }
                
                /// Initiate the actual toggle logic when the toggle button's state changes
                if toggled != lastToggleState {
                    self.toggleAction()
                }
            }
            .store(in: &cancellables)
    }
}

