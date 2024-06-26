//
//  FonciiUserDataModel.swift
//  Foncii
//
//  Created by Justin Cook on 3/2/23.
//

import Foundation

/// Extension of the Foncii User data model, allowing for more control and functionality beyond storing data
extension FonciiUser {
    // MARK: - Properties
    /// True -> User has a phone number attached to their account, false otherwise
    var isPhoneUser: Bool {
        return phoneNumber != ""
    }
    
    /// True -> User has first favorites, false otherwise
    var hasFirstFavorites: Bool {
        guard let firstFavorites = firstFavorites
        else { return false }
        
        return !firstFavorites.isEmpty
    }
    
    // MARK: - Convenience
    // Full Name
    var firstName: String {
        return self.fullName
            .components(separatedBy: " ")
            .first ?? ""
    }
    
    var lastName: String {
        return self.fullName
            .components(separatedBy: " ")
            .last ?? ""
    }
    
    // Profile Tasks
    var profileTaskCompletionPercentage: CGFloat {
        let totalProfileTasks = self.profileTasks.count,
        totalProfileTasksCompleted = self.profileTasks.reduce(0) { partialResult, profileTask in
            
            if profileTask.isComplete { return partialResult + 1 }
            else {
                return partialResult
            }
        }
        
        return CGFloat(totalProfileTasksCompleted/totalProfileTasks) * 100
    }
    
    var didCompleteAllProfileTasks: Bool {
        return self.profileTaskCompletionPercentage == 100
    }
    
    /// The attributes attached to this user's model
    enum Attributes: String, CaseIterable {
        case username
        case phoneNumber
        case fullName
    }
}
