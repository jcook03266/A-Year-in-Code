// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct TrackableUserEventTrackingInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      userID: ID,
      eventPropertiesJSON: String,
      eventType: GraphQLEnum<TrackableUserEvents>
    ) {
      __data = InputDict([
        "userID": userID,
        "eventPropertiesJSON": eventPropertiesJSON,
        "eventType": eventType
      ])
    }

    public var userID: ID {
      get { __data["userID"] }
      set { __data["userID"] = newValue }
    }

    public var eventPropertiesJSON: String {
      get { __data["eventPropertiesJSON"] }
      set { __data["eventPropertiesJSON"] = newValue }
    }

    public var eventType: GraphQLEnum<TrackableUserEvents> {
      get { __data["eventType"] }
      set { __data["eventType"] = newValue }
    }
  }

}