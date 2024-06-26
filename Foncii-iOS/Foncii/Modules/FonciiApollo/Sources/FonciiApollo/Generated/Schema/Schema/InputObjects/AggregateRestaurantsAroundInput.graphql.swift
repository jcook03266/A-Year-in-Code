// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct AggregateRestaurantsAroundInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      coordinates: CoordinatePointInput,
      userID: GraphQLNullable<ID> = nil
    ) {
      __data = InputDict([
        "coordinates": coordinates,
        "userID": userID
      ])
    }

    public var coordinates: CoordinatePointInput {
      get { __data["coordinates"] }
      set { __data["coordinates"] = newValue }
    }

    public var userID: GraphQLNullable<ID> {
      get { __data["userID"] }
      set { __data["userID"] = newValue }
    }
  }

}