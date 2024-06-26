//
//  RoutesProtocol.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import Foundation

// MARK: - Generic protocol for all routes to conform to
protocol RoutesProtocol: Identifiable {
    /// Random ID to differentiate the separate routes
    var id: String { get }
    
    /// Explicitly describes the preferred presentation method
    /// for the view provisioned at the given route (bottom sheet etc.)
    func getPreferredPresentationMethod() -> PreferredViewPresentationMethod
    
    /// Formerly the raw value of each route directory was type 'String',
    /// but now since associated values are being used to pass data
    /// this raw value must now be expressed as a String identifier
    func getStringIdentifier() -> String
}

/// Identifiable conformance implementation
extension RoutesProtocol {
    var id: String {
        return UUID().uuidString
    }
}
