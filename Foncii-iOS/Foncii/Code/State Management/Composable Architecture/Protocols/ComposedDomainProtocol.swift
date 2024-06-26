//
// ComposedDomainProtocol.swift
// Foncii
//
// Created by Justin Cook on 5/31/23 at 5:55 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import ComposableArchitecture

/// Allows domains to be comparable via the equatable protocol
protocol ComposedDomain: ReducerProtocol, Equatable {
    // MARK: - Required Variables
    var id: UUID { get }
    
    /// The first state of the store, used to reset the store when needed
    var initialState: State { get }
}

// MARK: - Implementation
extension ComposedDomain {
    var id: UUID {
        return .init()
    }
}
