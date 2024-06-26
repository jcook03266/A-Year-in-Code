//
// UserTasteProfileManager.swift
// Foncii
//
// Created by Justin Cook on 5/3/23 at 1:52 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Combine
import FonciiApollo

/// Dedicated instance for managing the current user's taste profile, from creation, updating, and loading
/// this manager is responsible for keeping the taste profile in parity with its remote counterpart
class UserTasteProfileManager: ObservableObject {
    // MARK: - Properties
    // Taste Profile
    @Published var tasteProfile: UserTasteProfile? = nil
    
    // MARK: - Singleton
    static let shared: UserTasteProfileManager = .init()
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let networkService: NetworkingService = inject()
        let apolloService: GraphQLAPIServiceAdapter = inject()
        
        lazy var appService: AppService = UserTasteProfileManager.Dependencies.inject()
        lazy var userManager: UserManager = UserTasteProfileManager.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Convenience
    var apolloService: GraphQLAPIServiceAdapter {
        return dependencies.apolloService
    }
    
    var isTasteProfileAvailable: Bool {
        return tasteProfile != nil
    }
    
    private init() {}
    
    // MARK: - State Management
    /// Loads the user's taste profile into memory if it hasn't been loaded already
    /// Note: A user is required to create a taste profile during onboarding through the
    /// first favorites screen, even if they don't have one they'll still have to go through this
    /// screen to ensure one is created for them as it's a user requirement
    @MainActor func loadTasteProfile() async {
        guard dependencies.userManager.currentUser != nil,
              let tasteProfile = await getUserTasteProfile()
        else { return }
        
        self.tasteProfile = tasteProfile
    }
    
    @MainActor func refreshTasteProfile() async {
        /// Only refresh if there's actual taste profile data to refresh
        guard isTasteProfileAvailable
        else { return }
        
        await loadTasteProfile()
    }
}

// MARK: - API Interfacing
extension UserTasteProfileManager {
    /// Creates a new user taste profile by inferring the user's tastes based on their first favorited restaurants
    @discardableResult
    @MainActor func inferUserTasteProfile() async -> UserTasteProfile? {
        guard let userID = dependencies
            .userManager
            .currentUser?.id
        else { return nil }
        
        let inferredTasteProfile = await dependencies
            .apolloService
            .performInferUserTasteProfile(userID: userID)
        
        /// Init the required taste profile data from the updated data received from the mutation
        guard let inferredTasteProfile = inferredTasteProfile
        else { return nil }
        
        // Set the current taste profile to be the newly inferred one
        let userTasteProfile: UserTasteProfile = .init(_dataDict: inferredTasteProfile.__data)
        self.tasteProfile = userTasteProfile
        
        return userTasteProfile
    }
    
    /// Creates a new user taste profile if one doesn't already exist, or updates the existing one with the optionally passed taste profile
    @discardableResult
    @MainActor func setUserTasteProfile(
        adventureLevel: Int?,
        restaurantRatingImportanceLevel: Int?,
        distancePreferenceLevel: Int?,
        prefersDrinks: Bool?,
        favoriteCuisines: [Cuisine]?,
        foodRestrictions: [FoodRestriction]?,
        preferredPriceLevels: [Int]?,
        preferredMealTypes: [MealType]?
    ) async -> UserTasteProfile? {
        guard let userID = dependencies
            .userManager
            .currentUser?.id
        else { return nil }
        
        /// Converts the direct types into their corresponding identifiers to pass to the server to parse through appropriately
        let favoriteCuisineIDs: [String]? = favoriteCuisines?.compactMap({ $0.id }),
            foodRestrictionIDs: [String]? = foodRestrictions?.compactMap({ $0.id }),
            preferredMealTypeIDs: [String]? = preferredMealTypes?.compactMap({ $0.id })
        
        let input: FonciiSchema
            .UserTasteProfileInput = .init(
                userID: userID,
                adventureLevel: adventureLevel ?? .none,
                restaurantRatingImportanceLevel: restaurantRatingImportanceLevel  ?? .none,
                distancePreferenceLevel: distancePreferenceLevel  ?? .none,
                prefersDrinks: prefersDrinks ?? .none,
                favoriteCuisines: favoriteCuisineIDs ?? .none,
                foodRestrictions: foodRestrictionIDs ?? .none,
                preferredPriceLevels: preferredPriceLevels ?? .none,
                preferredMealTypes: preferredMealTypeIDs ?? .none
            )
        
        let setTasteProfile = await dependencies
            .apolloService
            .performSetTasteProfile(
                userID: userID,
                tasteProfileInput: input
            )
        
        /// Init the required taste profile data from the updated data received from the mutation
        guard let setTasteProfile = setTasteProfile
        else { return nil }
        
        // Set the current taste profile to be the newly set one
        let userTasteProfile: UserTasteProfile = .init(_dataDict: setTasteProfile.__data)
        self.tasteProfile = userTasteProfile
        
        return userTasteProfile
    }
    
    @MainActor func getUserTasteProfile() async -> UserTasteProfile? {
        guard let userID = dependencies
            .userManager
            .currentUser?.id
        else { return nil }
        
        let tasteProfile = await dependencies
            .apolloService
            .performGetTasteProfile(userID: userID)
        
        return tasteProfile
    }
}
