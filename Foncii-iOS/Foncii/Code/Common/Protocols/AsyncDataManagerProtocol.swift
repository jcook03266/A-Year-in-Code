//
// AsyncDataManagerProtocol.swift
// Foncii
//
// Created by Justin Cook on 6/5/23 at 3:46 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation

/**
 * The requirements for some manager instance responsible for loading data
 * asynchronously and storing it in a shared context
 */
protocol AsyncDataManager {
    // MARK: - Required Variables
    /// Singleton
    // static var shared: AsyncDataManager { get }
    
    // MARK: - Required Functions
    @MainActor func fetch() async
    @MainActor func reload() async
    func reset()
}
