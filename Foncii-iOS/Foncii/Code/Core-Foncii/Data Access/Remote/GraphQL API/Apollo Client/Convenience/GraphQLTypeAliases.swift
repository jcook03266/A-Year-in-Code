//
// GraphQLTypeAliases.swift
// Foncii
//
// Created by Justin Cook on 4/22/23 at 5:29 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Apollo
import ApolloAPI
import FonciiApollo

/// A global collection of type aliases that simplify accessing the data corresponding to GraphQL operations
// MARK: - Queries
// MARK: - Users
// Data model for Foncii Users
typealias FonciiUser = FonciiSchema.GetUserQuery.Data.GetUser

// MARK: - Static Assets
typealias Cuisine = FonciiSchema.FetchAllCuisinesQuery.Data.FetchAllCuisine
typealias FoodRestriction = FonciiSchema.FetchAllFoodRestrictionsQuery.Data.FetchAllFoodRestriction
typealias MealType = FonciiSchema.FetchAllMealTypesQuery.Data.FetchAllMealType
typealias MajorCity = FonciiSchema.FetchAllMajorCitiesQuery.Data.FetchAllMajorCity

// MARK: - Taste Profile
typealias UserTasteProfile = FonciiSchema.GetUserTasteProfileQuery.Data.GetUserTasteProfile

// MARK: - Auth
// Authentication Provider Enum for user logins and sign-ups
typealias UserAuthProviders = GraphQLEnum<FonciiSchema.UserAuthProviders>

// MARK: - Restaurants
typealias FonciiRestaurant = FonciiSchema.MainRestaurantSearchQuery.Data.SearchForRestaurants.Restaurant.Restaurant
// Restaurants shown on the FYP, Map, and Trending section
typealias PersonalizedRestaurant = FonciiSchema.MainRestaurantSearchQuery.Data
    .SearchForRestaurants.Restaurant.Restaurant
// Personalized restaurant search result with the favorited status + percent match score
typealias PersonalizedRestaurantSearchResult = FonciiSchema.MainRestaurantSearchQuery.Data
    .SearchForRestaurants.Restaurant
// List of personalized restaurant search results and the queryID associated with them
typealias PersonalizedRestaurantSearchResults = FonciiSchema.MainRestaurantSearchQuery.Data
    .SearchForRestaurants
// Favorited Restaurants with optional personalized data ~ percent match scoring
typealias FavoritedRestaurant = FonciiSchema.FetchFavoriteRestaurantsForQuery.Data.FetchFavoriteRestaurantsFor
// Restaurants shown to the user when they first onboard
typealias DiscoveryRestaurant = FonciiSchema.OnboardingRestaurantSearchQuery.Data.SearchForRestaurants.Restaurant.Restaurant
// Search result containing the query ID to pass back to Algolia to enable higher depth personalization
typealias DiscoveryRestaurantSearchResult = FonciiSchema.OnboardingRestaurantSearchQuery.Data.SearchForRestaurants

// MARK: - Mutations
// MARK: - Taste Profile
typealias SetUserTasteProfile = FonciiSchema.SetUserTasteProfileMutation.Data.SetUserTasteProfile.TasteProfile
typealias InferredUserTasteProfile = FonciiSchema.InferUserTasteProfileUsingFirstFavoritesMutation.Data.InferUserTasteProfileUsingFirstFavorites.TasteProfile
