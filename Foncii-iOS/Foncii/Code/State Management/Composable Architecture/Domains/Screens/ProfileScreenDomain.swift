//
// ProfileScreenDomain.swift
// Foncii
//
// Created by Justin Cook on 6/26/23 at 9:55 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture

struct ProfileScreenDomain: ComposedDomain {
    // MARK: - Initial State
    var initialState: State = .init()
    
    struct State: Equatable {
        var currentActivity: ActivityStates = .idle
        var currentTab: ProfileScreenTabs = .favorites
        
        /// Context Tab
        enum ProfileScreenTabs: String, CaseIterable {
            case favorites
            case recommendations
        }
        
        /// An enum describing the various possible activities performed by this instance during different states
        enum ActivityStates: String, CaseIterable {
            case idle
            case searching
        }
    }
    
    // MARK: - Actions To Reduce
    enum Action: Equatable {
        case selectTab(tab: State.ProfileScreenTabs)
        case switchToActivity(activity: ProfileScreenDomain.State.ActivityStates)
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



