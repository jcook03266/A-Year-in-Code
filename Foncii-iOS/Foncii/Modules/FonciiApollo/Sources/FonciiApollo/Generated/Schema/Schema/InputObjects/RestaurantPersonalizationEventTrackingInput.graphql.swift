// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct RestaurantPersonalizationEventTrackingInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      userID: ID,
      objectIDs: GraphQLNullable<[String]>,
      filters: GraphQLNullable<[String]>,
      queryID: GraphQLNullable<String>,
      eventType: GraphQLEnum<RestaurantPersonalizationEvents>
    ) {
      __data = InputDict([
        "userID": userID,
        "objectIDs": objectIDs,
        "filters": filters,
        "queryID": queryID,
        "eventType": eventType
      ])
    }

    public var userID: ID {
      get { __data["userID"] }
      set { __data["userID"] = newValue }
    }

    public var objectIDs: GraphQLNullable<[String]> {
      get { __data["objectIDs"] }
      set { __data["objectIDs"] = newValue }
    }

    public var filters: GraphQLNullable<[String]> {
      get { __data["filters"] }
      set { __data["filters"] = newValue }
    }

    public var queryID: GraphQLNullable<String> {
      get { __data["queryID"] }
      set { __data["queryID"] = newValue }
    }

    public var eventType: GraphQLEnum<RestaurantPersonalizationEvents> {
      get { __data["eventType"] }
      set { __data["eventType"] = newValue }
    }
  }

}