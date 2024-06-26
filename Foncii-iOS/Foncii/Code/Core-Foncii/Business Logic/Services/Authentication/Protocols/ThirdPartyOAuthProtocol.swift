//
//  ThirdPartyOAuthProtocol.swift
//  Foncii
//
//  Created by Justin Cook on 2/19/23.
//

import Foundation

/// General protocol describing how third party OAuth strategies should behave on a functional basis
protocol ThirdPartyOAuthStrategy {
    // MARK: - Functions
    /// For authenticating existing users
    func authenticate()
    
    /// For creating accounts for new users in the backend through the given OAuth provider
    func createNewAuthCredential()
}

// MARK: - Service Dependency Injection Container
protocol InjectableThirdPartyOAuthStrategies {}

extension InjectableThirdPartyOAuthStrategies {
    // MARK: - Apple OAuth Service
    static func inject() -> AuthenticationService.AppleOAuthService {
        return .shared
    }
    
    // MARK: - Twitter OAuth Service
    static func inject() -> AuthenticationService.TwitterOAuthService {
        return .shared
    }
    
    // MARK: - Facebook OAuth Service
    static func inject() -> AuthenticationService.FacebookOAuthService {
        return .shared
    }
    
    // MARK: - Google OAuth Service
    static func inject() -> AuthenticationService.GoogleOAuthService {
        return .shared
    }
}
