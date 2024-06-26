// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct SearchFilterInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      userID: ID,
      cuisines: GraphQLNullable<[ID]> = nil,
      mealTypes: GraphQLNullable<[ID]> = nil,
      foodRestrictions: GraphQLNullable<[ID]> = nil,
      priceLevels: GraphQLNullable<[Int]> = nil,
      yelpRatings: GraphQLNullable<[Int]> = nil,
      googleRatings: GraphQLNullable<[Int]> = nil,
      cities: GraphQLNullable<[String]> = nil
    ) {
      __data = InputDict([
        "userID": userID,
        "cuisines": cuisines,
        "mealTypes": mealTypes,
        "foodRestrictions": foodRestrictions,
        "priceLevels": priceLevels,
        "yelpRatings": yelpRatings,
        "googleRatings": googleRatings,
        "cities": cities
      ])
    }

    public var userID: ID {
      get { __data["userID"] }
      set { __data["userID"] = newValue }
    }

    public var cuisines: GraphQLNullable<[ID]> {
      get { __data["cuisines"] }
      set { __data["cuisines"] = newValue }
    }

    public var mealTypes: GraphQLNullable<[ID]> {
      get { __data["mealTypes"] }
      set { __data["mealTypes"] = newValue }
    }

    public var foodRestrictions: GraphQLNullable<[ID]> {
      get { __data["foodRestrictions"] }
      set { __data["foodRestrictions"] = newValue }
    }

    public var priceLevels: GraphQLNullable<[Int]> {
      get { __data["priceLevels"] }
      set { __data["priceLevels"] = newValue }
    }

    public var yelpRatings: GraphQLNullable<[Int]> {
      get { __data["yelpRatings"] }
      set { __data["yelpRatings"] = newValue }
    }

    public var googleRatings: GraphQLNullable<[Int]> {
      get { __data["googleRatings"] }
      set { __data["googleRatings"] = newValue }
    }

    public var cities: GraphQLNullable<[String]> {
      get { __data["cities"] }
      set { __data["cities"] = newValue }
    }
  }

}