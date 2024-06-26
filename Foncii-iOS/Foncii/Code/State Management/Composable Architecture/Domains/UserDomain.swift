//
// UserDomain.swift
// Foncii
//
// Created by Justin Cook on 6/28/23 at 5:51 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import CoreLocation

struct UserDomain: ComposedDomain {
    // MARK: - Initial State
    var initialState: State = .init()
    
    struct State: Equatable {
        // User Specific Properties
        var currentUser: FonciiUser? = nil
    }
    
    // MARK: - Actions To Reduce
    enum Action: Equatable {
        // User Specific Properties
        case setCurrentUser(fonciiUser: FonciiUser)
        case resetUser
        
        // State Management
        case clear
    }
    
    func reduce(
        into state: inout State,
        action: Action
    ) -> EffectTask<Action> {
        switch action {
            // User Specific Properties
        case .setCurrentUser(fonciiUser: let fonciiUser):
            state.currentUser = fonciiUser
            
            return .none
        case .resetUser:
            state.currentUser = initialState.currentUser
            
            return .none
            
        case .clear:
            state = initialState
            
            return .none
        }
    }
}
