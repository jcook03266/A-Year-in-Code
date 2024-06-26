// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct CreateNewUserInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      id: GraphQLNullable<ID> = nil,
      fullName: String,
      username: String,
      email: String,
      phoneNumberInput: GraphQLNullable<PhoneNumberInput> = nil,
      authProviders: [GraphQLEnum<UserAuthProviders>]
    ) {
      __data = InputDict([
        "id": id,
        "fullName": fullName,
        "username": username,
        "email": email,
        "phoneNumberInput": phoneNumberInput,
        "authProviders": authProviders
      ])
    }

    public var id: GraphQLNullable<ID> {
      get { __data["id"] }
      set { __data["id"] = newValue }
    }

    public var fullName: String {
      get { __data["fullName"] }
      set { __data["fullName"] = newValue }
    }

    public var username: String {
      get { __data["username"] }
      set { __data["username"] = newValue }
    }

    public var email: String {
      get { __data["email"] }
      set { __data["email"] = newValue }
    }

    public var phoneNumberInput: GraphQLNullable<PhoneNumberInput> {
      get { __data["phoneNumberInput"] }
      set { __data["phoneNumberInput"] = newValue }
    }

    public var authProviders: [GraphQLEnum<UserAuthProviders>] {
      get { __data["authProviders"] }
      set { __data["authProviders"] = newValue }
    }
  }

}