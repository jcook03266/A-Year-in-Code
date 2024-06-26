// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct UserLoginInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      userID: ID,
      authProvider: GraphQLEnum<UserAuthProviders>
    ) {
      __data = InputDict([
        "userID": userID,
        "authProvider": authProvider
      ])
    }

    public var userID: ID {
      get { __data["userID"] }
      set { __data["userID"] = newValue }
    }

    public var authProvider: GraphQLEnum<UserAuthProviders> {
      get { __data["authProvider"] }
      set { __data["authProvider"] = newValue }
    }
  }

}