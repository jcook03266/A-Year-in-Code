//
// GraphQLAPIServiceAdapter.swift
// Foncii
//
// Created by Justin Cook on 4/22/23 at 4:58 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Apollo
import CoreLocation
import FonciiApollo
import ApolloAPI

/**
 * A service adapter that allows for the enumeration of specific queries and mutations
 * all of which can be accessed from this one instance at any time, acting as a single
 * source of truth for interfacing with our dedicated GraphQL API
 */
final class GraphQLAPIServiceAdapter {
    // MARK: Properties
    private let schema = ClientNetworkingInfo.shared.schema
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let apolloService: FonciiApolloService = inject()
    }
    internal let dependencies = Dependencies()
    
    // MARK: Operations For Error Logging
    // MARK: - Queries
    enum QueryType: String {
        case getUser
        case doesUsernameExist
        case doesEmailExist
        case doesPhoneNumberExist
    }
    
    // MARK: - Mutations
    enum MutationType: String {
        case createUser
    }
    
    // MARK: - Convenience
    private var apolloService: FonciiApolloService {
        return dependencies.apolloService
    }
    
    init() {}
    
    func startClient() {
        dependencies
            .apolloService
            .configure()
    }
    
    // MARK: - Query Operations
    // Static Assets (Fetch exclusively from cache (if available, else fetch from backend and cache))
    func performFetchAllCuisines() async -> [Cuisine] {
        let query = self.schema.FetchAllCuisinesQuery(),
            result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .returnCacheDataElseFetch)
        
        return result?.fetchAllCuisines ?? []
    }
    
    func performFetchAllFoodRestrictions() async -> [FoodRestriction] {
        let query = self.schema.FetchAllFoodRestrictionsQuery(),
            result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .returnCacheDataElseFetch)
        
        return result?.fetchAllFoodRestrictions ?? []
    }
    
    func performFetchAllMealTypes() async -> [MealType] {
        let query = self.schema.FetchAllMealTypesQuery(),
            result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .returnCacheDataElseFetch)
        
        return result?.fetchAllMealTypes ?? []
    }
    
    func performFetchAllMajorCities() async -> [MajorCity] {
        let query = self.schema.FetchAllMajorCitiesQuery(),
            result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .returnCacheDataElseFetch)
        
        return result?.fetchAllMajorCities ?? []
    }
    
    func performGetTasteProfile(
        userID: String
    ) async -> UserTasteProfile? {
        let query = self.schema.GetUserTasteProfileQuery(userId: userID),
            result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .fetchIgnoringCacheCompletely)
        
        return result?.getUserTasteProfile
    }
    
    func performGetEmailFromUsername(
        username: String
    ) async -> String? {
        let query = self.schema.GetEmailFromUsernameQuery(username: username),
            result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .fetchIgnoringCacheCompletely)
        
        return result?.getUserEmailFromUsername
    }
    
    func performGetEmailFromPhoneNumber(
        phoneNumber: PhoneNumberModel
    ) async -> String? {
        let query = self.schema.GetEmailFromPhoneNumberQuery(
            phoneNumberInput: .init(countryCode: phoneNumber.countryCode.rawValue,
                                    nsn: phoneNumber.nsn)),
            result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .fetchIgnoringCacheCompletely)
        
        return result?.getUserEmailFromPhoneNumber
    }
    
    /// Default value is: false
    func performDoesUsernameExist(
        username: String
    ) async -> Bool {
        let query = self.schema.DoesUsernameExistQuery(username: username),
            result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .fetchIgnoringCacheCompletely)
        
        return result?.doesUsernameExist ?? false
    }
    
    /// Default value is: false
    func performDoesPhoneNumberExist(
        phoneNumber: PhoneNumberModel
    ) async -> Bool {
        let query = self.schema.DoesPhoneNumberExistQuery(phoneNumberInput:
                .init(countryCode: phoneNumber.countryCode.rawValue,
                      nsn: phoneNumber.nsn)),
            result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .fetchIgnoringCacheCompletely)
        
        return result?.doesPhoneNumberExist ?? false
    }
    
    /// Default value is: false
    func performDoesEmailExist(
        email: String
    ) async -> Bool {
        let lowercasedEmail = email.lowercased()
        let query = self.schema.DoesEmailExistQuery(email: lowercasedEmail),
            result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .fetchIgnoringCacheCompletely)
        
        return result?.doesEmailExist ?? false
    }
    
    /// No default value, respond to nil values accordingly when encountered
    func performGetUser(
        userID: String
    ) async -> FonciiUser? {
        let query = self.schema.GetUserQuery(userId: userID),
            result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .fetchIgnoringCacheCompletely)
        
        return result?.getUser
    }
    
    /// Fetches optionally personalized favorited restaurants that can be paginated and sorted in place from the
    /// backend request
    func performFetchFavoritedRestaurants(
        userID: String,
        paginationLimit: Int,
        paginationCursor: String?,
        personalized: Bool = true
    ) async -> [FavoritedRestaurant] {
        let query = self.schema.FetchFavoriteRestaurantsForQuery(input: .init(
            userID: userID,
            personalized: true,
            cursorPaginationInput:
                    .init(
                        .init(paginationCursor: paginationCursor ?? .none,
                              limit: .some(paginationLimit),
                              sortOrder: .none))
        ))
        
        let result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .fetchIgnoringCacheCompletely)
        
        return result?.fetchFavoriteRestaurantsFor ?? []
    }
    
    func performMainRestaurantSearch(
        userID: String,
        query: String,
        latitude: Double,
        longitude: Double,
        paginationIndex: Int,
        hitsPerPage: Int,
        mealTypes: [MealType] = []
    ) async -> PersonalizedRestaurantSearchResults? {
        let mealTypeIDs = mealTypes.map { $0.id },
            query = self.schema.MainRestaurantSearchQuery(input:
                    .init(
                        .init(query: .some(query),
                              searchFilterInput: .init(
                                .init(userID: userID,
                                      mealTypes: .some(mealTypeIDs))),
                              paginationInput: .some(
                                .init(hitsPerPage: .some(hitsPerPage),
                                      page: .some(paginationIndex))),
                              geoLocationSearchInput:
                                .init(
                                    .init(latitude: latitude,
                                          longitude: longitude)),
                              personalize: true)))
        
        let result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .fetchIgnoringCacheCompletely)
        
        return result?.searchForRestaurants
    }
    
    func performOnboardingRestaurantSearch(
        query: String,
        latitude: Double,
        longitude: Double,
        paginationIndex: Int
    ) async -> DiscoveryRestaurantSearchResult? {
        let query = self.schema.OnboardingRestaurantSearchQuery(input:
                .init(
                    .init(query: .some(query),
                          paginationInput: .some(
                            .init(page: .some(paginationIndex))),
                          geoLocationSearchInput:
                            .init(
                                .init(latitude: latitude,
                                      longitude: longitude)),
                          personalize: false)))
        
        let result = await apolloService
            .performQuery(query: query,
                          headers: nil,
                          cachePolicy: .fetchIgnoringCacheCompletely)
        
        return result?.searchForRestaurants
    }
    
    // MARK: - Mutation Operations
    func performUpdateUserNotificationPreferences(
        userID: String,
        notificationsEnabled: Bool
    ) async -> FonciiSchema.UpdateUserNotificationPreferenceMutation.Data? {
        let mutation = self.schema.UpdateUserNotificationPreferenceMutation(input:
                .init(userID: userID,
                      isEnabled: notificationsEnabled))
        
        let result = await apolloService
            .performMutation(mutation: mutation,
                             headers: nil)
        
        return result
    }
    
    @discardableResult
    func performAddFirstFavoriteRestaurants(
        userID: String,
        restaurantIDs: [String]
    ) async -> FonciiSchema.AddFirstFavoriteRestaurantsMutation.Data? {
        let mutation = self.schema.AddFirstFavoriteRestaurantsMutation(input:
                .init(userID: userID,
                      restaurantIDs: restaurantIDs))
        
        let result = await apolloService
            .performMutation(mutation: mutation,
                             headers: nil)
        
        return result
    }
    
    @discardableResult
    func performAddFavoriteRestaurant(
        userID: String,
        restaurantID: String
    ) async -> FonciiSchema.AddFavoriteRestaurantMutation.Data? {
        let mutation = self.schema.AddFavoriteRestaurantMutation(input:
                .init(userID: userID,
                      restaurantID: restaurantID))
        
        let result = await apolloService
            .performMutation(mutation: mutation,
                             headers: nil)
        
        return result
    }
    
    @discardableResult
    func performRemoveFavoriteRestaurant(
        userID: String,
        restaurantID: String
    ) async -> FonciiSchema.RemoveFavoriteRestaurantMutation.Data? {
        let mutation = self.schema.RemoveFavoriteRestaurantMutation(input:
                .init(userID: userID,
                      restaurantID: restaurantID))
        
        let result = await apolloService
            .performMutation(mutation: mutation,
                             headers: nil)
        
        return result
    }
    
    func performRestaurantAggregation(
        userID: String,
        coordinates: CLLocationCoordinate2D
    ) async -> FonciiSchema.AggregateRestaurantsAroundMutation.Data? {
        let mutation = self.schema.AggregateRestaurantsAroundMutation(input:
                .init(
                    .init(coordinates: .init(lat: coordinates.latitude,
                                             lng: coordinates.longitude),
                          userID: .some(userID))))
        
        let result = await apolloService
            .performMutation(mutation: mutation,
                             headers: nil)
        
        return result
    }
    
    func performSetTasteProfile(
        userID: String,
        tasteProfileInput: FonciiSchema.UserTasteProfileInput
    ) async -> SetUserTasteProfile? {
        let mutation = self.schema
            .SetUserTasteProfileMutation(input: tasteProfileInput)
        
        let result = await apolloService.performMutation(mutation: mutation,
                                                         headers: nil)
        
        return result?.setUserTasteProfile.tasteProfile
    }
    
    func performInferUserTasteProfile(
        userID: String
    ) async -> FonciiSchema.InferUserTasteProfileUsingFirstFavoritesMutation.Data.InferUserTasteProfileUsingFirstFavorites.TasteProfile? {
        let mutation = self.schema.InferUserTasteProfileUsingFirstFavoritesMutation(userId: userID)
        
        let result = await apolloService.performMutation(mutation: mutation,
                                                         headers: nil)
        
        return result?.inferUserTasteProfileUsingFirstFavorites.tasteProfile
    }
    
    /// Updates the user's phone number verification status to either true or false
    func performUpdateUserPhoneNumberVerificationStatus(
        userID: String,
        phoneNumberVerified: Bool
    ) async {
        let mutation = self.schema.UpdateUserPhoneNumberVerificationStatusMutation(input:
                .init(userID: userID,
                      phoneNumberVerified: phoneNumberVerified
                     ))
        
        await apolloService.performMutation(mutation: mutation,
                                            headers: nil)
    }
    
    /// Not a mission critical function so no extended error handling needs to be implemented here, it's just purely for logging user changes and metrics
    func performSignOut(userID: String) async {
        let mutation = self.schema.SignOutUserMutation(input: .init(userID: userID))
        
        await apolloService.performMutation(mutation: mutation,
                                            headers: nil)
    }
    
    /// Updates the user's last login information, not really a mission critical function so no extended error handling needs to be implemented here, it's just purely for logging user changes and metrics
    func performLoginUser(
        userID: String,
        authProvider: UserAuthProviders
    ) async {
        let mutation = self.schema.LoginUserMutation(input: .init(userID: userID,
                                                                  authProvider: authProvider))
        
        await apolloService.performMutation(mutation: mutation,
                                            headers: nil)
    }
    
    func performCreateUser(
        userID: String,
        authProviders: [UserAuthProviders],
        fullName: String,
        username: String,
        email: String,
        phoneNumber: PhoneNumberModel?
    ) async -> FonciiUser? {
        var phoneNumberInput: FonciiSchema.PhoneNumberInput? = nil,
            user: FonciiUser? = nil
        
        /// Parse the phone number data into an input (if any)
        if let phoneNumber = phoneNumber {
            phoneNumberInput = self.schema.PhoneNumberInput(countryCode: phoneNumber.countryCode.rawValue,
                                                            nsn: phoneNumber.nsn)
        }
        
        let mutation = self.schema.CreateUserMutation(input: .init(id: .some(userID),
                                                                   fullName: fullName,
                                                                   username: username,
                                                                   email: email,
                                                                   phoneNumberInput: phoneNumberInput ?? .none,
                                                                   authProviders: authProviders))
        
        let result = await apolloService.performMutation(mutation: mutation,
                                                         headers: nil)
        
        /// Parse the result
        let response = result?.createUser,
            newUser = response?.newUser
        
        /// Init a Foncii User type with the data from the new user's data dictionary
        if let newUser = newUser {
            user = FonciiUser(_dataDict: newUser.__data)
        }
        
        return user
    }
}
