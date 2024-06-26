// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct SearchPaginationInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      hitsPerPage: GraphQLNullable<Int> = nil,
      page: GraphQLNullable<Int> = nil
    ) {
      __data = InputDict([
        "hitsPerPage": hitsPerPage,
        "page": page
      ])
    }

    public var hitsPerPage: GraphQLNullable<Int> {
      get { __data["hitsPerPage"] }
      set { __data["hitsPerPage"] = newValue }
    }

    public var page: GraphQLNullable<Int> {
      get { __data["page"] }
      set { __data["page"] = newValue }
    }
  }

}