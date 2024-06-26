//
//  FirstPartyOAuthProtocol.swift
//  Foncii
//
//  Created by Justin Cook on 2/19/23.
//

import Foundation

/// Protocol describing how non-OAuth authentication should be handled from Foncii's backend
protocol FirstPartyAuthStrategy {
    /// For authenticating existing users
    func authenticate()
    
    /// For creating accounts for new users in the backend
    func createNewAuthCredential()
}
