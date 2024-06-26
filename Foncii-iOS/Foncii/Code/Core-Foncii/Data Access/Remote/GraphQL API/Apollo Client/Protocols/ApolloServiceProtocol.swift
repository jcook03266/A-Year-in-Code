//
// ApolloServiceProtocol.swift
// Foncii
//
// Created by Justin Cook on 4/21/23 at 10:53 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Apollo

protocol ApolloServiceProtocol {
    // MARK: - Properties
    /// Singleton for sharing gql data layer across the application consistently
    static var shared: FonciiApolloService { get }
    var client: ApolloClient! { get }
    
    // MARK: - Functions
    func configure()
}

