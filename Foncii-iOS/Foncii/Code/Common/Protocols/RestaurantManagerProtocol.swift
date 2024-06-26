//
// RestaurantManagerProtocol.swift
// Foncii
//
// Created by Justin Cook on 6/15/23 at 7:11 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation

protocol AsyncRestaurantManager: AsyncDataManager {
    // MARK: - Required Properties
    var currentSearchQuery: String { get }
    
    // MARK: - Required Functions
    /// Trigger this function to search for restaurants
    @MainActor func search(searchQuery: String) async
    /// Performs the initial search for restaurants to populate a screen
    @MainActor func performInitialSearch() async
}
