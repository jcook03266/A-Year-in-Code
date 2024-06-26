//
// AppDomainActionDispatcher.swift
// Foncii
//
// Created by Justin Cook on 6/3/23 at 9:02 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import ComposableArchitecture

/// Simple instance for dispatching actions from anywhere in the
/// application without any additional boilerplate code
protocol AppDomainActionDispatcher {
    // MARK: - Properties
    associatedtype Domain: ComposedDomain
    
    // MARK: - Required Variables
    /// Immutable
    var viewStore: ViewStore<AppDomain.State, AppDomain.Action> { get }
    
    // MARK: - Required Functions
    /// Removes the required boilerplate for forward feeding scoped
    /// Domain specific actions to global App Domain actions
    func composeAppDomainAction(from domainAction: Domain.Action) -> AppDomain.Action
    
    /// Centralized handler for sending actions to be reduced by the store
    func dispatchAction(action: AppDomain.Action)
    
    /// Resets the store back to its original state, it helps if every domain action dispatcher has one
    /// so that any part of the app's state can be reset back to its initial state at any time
    func clear()
}

/// Reusable action dispatcher that allows simplified action definition and
/// submission from other instances
extension AppDomainActionDispatcher {
    // Singleton Accessor
    var viewStore: ViewStore<AppDomain.State, AppDomain.Action> {
        return AppService.shared.globalViewStore
    }
    
    // View Store Action Sender
    func dispatchAction(action: AppDomain.Action) {
        viewStore.send(action)
    }
    
    // Store Reset
    func clear() {
        print("Error: Clearing not yet implemented for Domain of type:\(Domain.self)")
    }
}
