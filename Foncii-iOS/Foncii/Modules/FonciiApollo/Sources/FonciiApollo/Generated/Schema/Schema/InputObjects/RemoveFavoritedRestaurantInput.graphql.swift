// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct RemoveFavoritedRestaurantInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      userID: ID,
      restaurantID: ID
    ) {
      __data = InputDict([
        "userID": userID,
        "restaurantID": restaurantID
      ])
    }

    public var userID: ID {
      get { __data["userID"] }
      set { __data["userID"] = newValue }
    }

    public var restaurantID: ID {
      get { __data["restaurantID"] }
      set { __data["restaurantID"] = newValue }
    }
  }

}