//
// MainTabbarViewModel.swift
// Foncii
//
// Created by Justin Cook on 5/24/23 at 10:35 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Combine

/**
 * View model for the tabbar displayed at the bottom of the screen for the
 * main scene
 */
class MainTabbarViewModel: CoordinatedGenericViewModel {
    typealias coordinator = MainCoordinator
    typealias router = MainRouter
    
    // MARK: - Properties
    var coordinator: coordinator
    let router: router
    
    // MARK: - Published
    @Published var selectedTab: MainRoutes
    @Published var isVisible: Bool = true
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Assets
    let homeIcon: Image = Icons.getIconImage(named: .home),
        mapIcon: Image = Icons.getIconImage(named: .map_marker),
        profileIcon: Image = Icons.getIconImage(named: .user)
    
    // MARK: - Styling
    let baseIconColor: Color = Colors.medium_1,
        selectedIconColor: Color = Colors.primary_1,
        tabbarBackgroundColor: Color = Colors.dark_grey_1,
        shadowColor: Color = Colors.shadow
    
    // MARK: - Actions
    var tabSelectionAction: ((MainRoutes) -> Void) {
        return { [weak self] targetTab in
            guard let self = self
            else { return }
            
            HapticFeedbackDispatcher.tabbarButtonPress()
            
            self.navigateTo(tab: targetTab)
        }
    }
    
    // MARK: - Convenience
    var currentTab: MainRoutes {
        return self.coordinator.currentTab
    }
    
    init(coordinator: coordinator,
         router: router
    ) {
        self.coordinator = coordinator
        self.router = router
        self.selectedTab = coordinator.currentTab
        
        addSubscribers()
    }
    
    // MARK: - Dynamic Styling Selection
    func getIcon(for tab: MainRoutes) -> Image {
        switch tab {
        case .home:
            return homeIcon
        case .map:
            return mapIcon
        case .profile:
            return profileIcon
        }
    }
    
    func getIconColor(for tab: MainRoutes) -> Color {
        return currentTab == tab ? selectedIconColor : baseIconColor
    }
    
    func isTabSelected(tab: MainRoutes) -> Bool {
        return tab == currentTab
    }
    
    // MARK: - Subscriptions
    func addSubscribers() {
        /// Synchronize this model with the main coordinator (source of truth)
        self.coordinator
            .$currentTab
            .receive(on: scheduler)
            .assign(to: &$selectedTab)
    }
    
    // MARK: - Navigation Logic
    /// Navigate to the target tab and execute some custom closure logic if any
    func navigateTo(
        tab: MainRoutes,
        onNavigate: @escaping (() -> Void) = {}
    ) {
        self.coordinator
            .navigateTo(tab: tab,
                        onNavigate: onNavigate)
    }
    
    // MARK: - Visibility Logic
    /// For unconditionally hiding or showing the tabbar's view
    func hide() {
        self.isVisible = false
    }
    
    func show() {
        self.isVisible = true
    }
}
