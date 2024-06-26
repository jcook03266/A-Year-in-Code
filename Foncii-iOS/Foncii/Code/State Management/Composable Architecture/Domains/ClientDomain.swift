//
// ClientDomain.swift
// Foncii
//
// Created by Justin Cook on 6/5/23 at 9:48 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture
import CoreLocation

struct ClientDomain: ComposedDomain {
    // MARK: - Initial State
    var initialState: State = .init()
    
    struct State: Equatable {
        // Client Properties
        // Networking
        var isClientOnline: Bool = false
        
        // Location
        var currentClientLocation: CLLocation? = nil
        // True when the user specifies a virtual location, false otherwise TODO: update the home screen to reflect this change
        var usingVirtualLocation: Bool = false
    }
    
    // MARK: - Actions To Reduce
    enum Action: Equatable {
        // Client Properties
        // Networking
        case setClientInternetStatus(isClientOnline: Bool)
        
        // Location
        case setCurrentClientLocation(location: CLLocation)
        case resetCurrentClientLocation
        case setUsingVirtualLocation(usingVirtualLocation: Bool)
        
        // State Management
        case clear
    }
    
    func reduce(
        into state: inout State,
        action: Action
    ) -> EffectTask<Action> {
        switch action {
            // Client Properties
            // Networking
        case .setClientInternetStatus(isClientOnline: let isClientOnline):
            state.isClientOnline = isClientOnline
            
            return .none
            
            // Location
        case .setCurrentClientLocation(location: let location):
            state.currentClientLocation = location
            
            return.none
        case .resetCurrentClientLocation:
            state.currentClientLocation = initialState.currentClientLocation
            
            return .none
        case .setUsingVirtualLocation(usingVirtualLocation: let usingVirtualLocation):
            state.usingVirtualLocation = usingVirtualLocation
            
            return .none
            
            // State Management
        case .clear:
            state = initialState
            
            return .none
        }
    }
}


