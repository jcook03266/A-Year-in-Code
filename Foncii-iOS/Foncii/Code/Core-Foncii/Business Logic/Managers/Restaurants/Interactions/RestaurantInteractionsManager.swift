//
// RestaurantInteractionsManager.swift
// Foncii
//
// Created by Justin Cook on 4/29/23 at 9:41 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation

/// A dedicated manager for handling restaurant interactions including favoriting and sending / receiving recommendations
class RestaurantInteractionsManager {
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let apolloService: GraphQLAPIServiceAdapter = inject()
        let alertManger: AlertManager = inject()
        
        lazy var userManager: UserManager = RestaurantInteractionsManager.Dependencies.inject()
        lazy var userSettingsManager: UserSettingsManager = RestaurantInteractionsManager.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    init() {}
}

// MARK: - API Interactor
extension RestaurantInteractionsManager {
    // MARK: - Favoriting
    /**
     * - Returns: An updated personalized restaurant if the operation succeeded, nil otherwise
     * If the favoriting operation fails a small notification is displayed informing the user of the failed operation just to let them know why the UI didn't update
     */
    @discardableResult
    func favoriteRestaurant(
        restaurantID: String
    ) async -> PersonalizedRestaurantSearchResult? {
        guard let userID = dependencies
            .userManager
            .currentUser?.id
        else { return nil }
        
        let result = await dependencies
            .apolloService
            .performAddFavoriteRestaurant(userID: userID,
                                          restaurantID: restaurantID),
        updatedPersonalizedRestaurant = result?.addFavoriteRestaurant.updatedPersonalizedRestaurant
    
        guard let updatedPersonalizedRestaurant = updatedPersonalizedRestaurant
        else {
            /// Display a notification informing the user that this operation failed
            dependencies
                .alertManger
                .triggerErrorAlert(alertType: .RESTAURANT_INTERACTION_ERROR_OPERATION_FAILED)

            return nil
        }
        
        return .init(_dataDict: updatedPersonalizedRestaurant.__data)
    }
    
    /**
     * - Returns: An updated personalized restaurant if the operation succeeded, nil otherwise
     *
     * If the favoriting operation fails a small notification is displayed informing the user of the failed operation just to let them know why the UI didn't update
     */
    func unfavoriteRestaurant(
        restaurantID: String
   ) async -> PersonalizedRestaurantSearchResult? {
       guard let userID = dependencies
           .userManager
           .currentUser?.id
       else { return nil }
       
       let result = await dependencies
           .apolloService
           .performRemoveFavoriteRestaurant(userID: userID,
                                         restaurantID: restaurantID),
       updatedPersonalizedRestaurant = result?.removeFavoriteRestaurant.updatedPersonalizedRestaurant
   
       guard let updatedPersonalizedRestaurant = updatedPersonalizedRestaurant
       else {
           /// Display a notification informing the user that this operation failed
           dependencies
               .alertManger
               .triggerErrorAlert(alertType: .RESTAURANT_INTERACTION_ERROR_OPERATION_FAILED)

           return nil
       }
       
       return .init(_dataDict: updatedPersonalizedRestaurant.__data)
   }
}
