// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct UserTasteProfileInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      userID: ID,
      adventureLevel: GraphQLNullable<Int> = nil,
      restaurantRatingImportanceLevel: GraphQLNullable<Int> = nil,
      distancePreferenceLevel: GraphQLNullable<Int> = nil,
      prefersDrinks: GraphQLNullable<Bool> = nil,
      favoriteCuisines: GraphQLNullable<[ID]> = nil,
      foodRestrictions: GraphQLNullable<[ID]> = nil,
      preferredPriceLevels: GraphQLNullable<[Int]> = nil,
      preferredMealTypes: GraphQLNullable<[ID]> = nil
    ) {
      __data = InputDict([
        "userID": userID,
        "adventureLevel": adventureLevel,
        "restaurantRatingImportanceLevel": restaurantRatingImportanceLevel,
        "distancePreferenceLevel": distancePreferenceLevel,
        "prefersDrinks": prefersDrinks,
        "favoriteCuisines": favoriteCuisines,
        "foodRestrictions": foodRestrictions,
        "preferredPriceLevels": preferredPriceLevels,
        "preferredMealTypes": preferredMealTypes
      ])
    }

    public var userID: ID {
      get { __data["userID"] }
      set { __data["userID"] = newValue }
    }

    public var adventureLevel: GraphQLNullable<Int> {
      get { __data["adventureLevel"] }
      set { __data["adventureLevel"] = newValue }
    }

    public var restaurantRatingImportanceLevel: GraphQLNullable<Int> {
      get { __data["restaurantRatingImportanceLevel"] }
      set { __data["restaurantRatingImportanceLevel"] = newValue }
    }

    public var distancePreferenceLevel: GraphQLNullable<Int> {
      get { __data["distancePreferenceLevel"] }
      set { __data["distancePreferenceLevel"] = newValue }
    }

    public var prefersDrinks: GraphQLNullable<Bool> {
      get { __data["prefersDrinks"] }
      set { __data["prefersDrinks"] = newValue }
    }

    public var favoriteCuisines: GraphQLNullable<[ID]> {
      get { __data["favoriteCuisines"] }
      set { __data["favoriteCuisines"] = newValue }
    }

    public var foodRestrictions: GraphQLNullable<[ID]> {
      get { __data["foodRestrictions"] }
      set { __data["foodRestrictions"] = newValue }
    }

    public var preferredPriceLevels: GraphQLNullable<[Int]> {
      get { __data["preferredPriceLevels"] }
      set { __data["preferredPriceLevels"] = newValue }
    }

    public var preferredMealTypes: GraphQLNullable<[ID]> {
      get { __data["preferredMealTypes"] }
      set { __data["preferredMealTypes"] = newValue }
    }
  }

}