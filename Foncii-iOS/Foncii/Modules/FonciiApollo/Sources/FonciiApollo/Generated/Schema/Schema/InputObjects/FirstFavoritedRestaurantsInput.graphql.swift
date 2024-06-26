// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct FirstFavoritedRestaurantsInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      userID: ID,
      restaurantIDs: [ID]?
    ) {
      __data = InputDict([
        "userID": userID,
        "restaurantIDs": restaurantIDs
      ])
    }

    public var userID: ID {
      get { __data["userID"] }
      set { __data["userID"] = newValue }
    }

    public var restaurantIDs: [ID]? {
      get { __data["restaurantIDs"] }
      set { __data["restaurantIDs"] = newValue }
    }
  }

}