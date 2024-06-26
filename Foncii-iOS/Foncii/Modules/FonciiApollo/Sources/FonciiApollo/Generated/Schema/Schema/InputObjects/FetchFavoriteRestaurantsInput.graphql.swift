// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct FetchFavoriteRestaurantsInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      userID: ID,
      personalized: GraphQLNullable<Bool> = nil,
      cursorPaginationInput: GraphQLNullable<CursorPaginationInput> = nil
    ) {
      __data = InputDict([
        "userID": userID,
        "personalized": personalized,
        "cursorPaginationInput": cursorPaginationInput
      ])
    }

    public var userID: ID {
      get { __data["userID"] }
      set { __data["userID"] = newValue }
    }

    public var personalized: GraphQLNullable<Bool> {
      get { __data["personalized"] }
      set { __data["personalized"] = newValue }
    }

    public var cursorPaginationInput: GraphQLNullable<CursorPaginationInput> {
      get { __data["cursorPaginationInput"] }
      set { __data["cursorPaginationInput"] = newValue }
    }
  }

}