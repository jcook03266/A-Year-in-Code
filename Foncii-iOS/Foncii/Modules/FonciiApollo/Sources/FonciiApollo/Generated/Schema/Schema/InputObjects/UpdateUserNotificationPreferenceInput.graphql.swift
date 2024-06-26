// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct UpdateUserNotificationPreferenceInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      userID: ID,
      isEnabled: Bool
    ) {
      __data = InputDict([
        "userID": userID,
        "isEnabled": isEnabled
      ])
    }

    public var userID: ID {
      get { __data["userID"] }
      set { __data["userID"] = newValue }
    }

    public var isEnabled: Bool {
      get { __data["isEnabled"] }
      set { __data["isEnabled"] = newValue }
    }
  }

}