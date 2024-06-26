// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct UpdateUserPhoneNumberVerificationStatusInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      userID: ID,
      phoneNumberVerified: Bool
    ) {
      __data = InputDict([
        "userID": userID,
        "phoneNumberVerified": phoneNumberVerified
      ])
    }

    public var userID: ID {
      get { __data["userID"] }
      set { __data["userID"] = newValue }
    }

    public var phoneNumberVerified: Bool {
      get { __data["phoneNumberVerified"] }
      set { __data["phoneNumberVerified"] = newValue }
    }
  }

}