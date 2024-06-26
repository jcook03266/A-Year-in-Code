//
// HomeScreenDomain.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 3:22 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture

struct HomeScreenDomain: ComposedDomain {
    // MARK: - Initial State
    var initialState: State = .init()
    
    struct State: Equatable {
        var currentActivity: ActivityStates = .idle
        var currentTab: HomeScreenTabs = .fyp
        
        // Persistence
        // TODO: - Create user default for this
        var dwfPromptDismissed: Bool = false
        
        // Filtering
//        var selectedMealType:
        
        /// Context Tab
        enum HomeScreenTabs: String, CaseIterable {
            case fyp
            case trending
        }
        
        /// An enum describing the various possible activities performed by this instance during different states
        enum ActivityStates: String, CaseIterable {
            case idle
            case searching
        }
    }
    
    // MARK: - Actions To Reduce
    enum Action: Equatable {
        case selectTab(tab: State.HomeScreenTabs)
        case switchToActivity(activity: HomeScreenDomain.State.ActivityStates)
    }
    
    func reduce(
        into state: inout State,
        action: Action
    ) -> EffectTask<Action> {
        switch action {
        case .selectTab(tab: let tab):
            state.currentTab = tab
            
            return .none
        case .switchToActivity(activity: let activity):
            state.currentActivity = activity
            
            return .none
        }
    }
}


