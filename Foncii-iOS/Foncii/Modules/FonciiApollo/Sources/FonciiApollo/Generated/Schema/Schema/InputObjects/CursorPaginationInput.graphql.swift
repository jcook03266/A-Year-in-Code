// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct CursorPaginationInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      paginationCursor: GraphQLNullable<ID> = nil,
      limit: GraphQLNullable<Int> = nil,
      sortOrder: GraphQLNullable<GraphQLEnum<SortOrders>> = nil
    ) {
      __data = InputDict([
        "paginationCursor": paginationCursor,
        "limit": limit,
        "sortOrder": sortOrder
      ])
    }

    public var paginationCursor: GraphQLNullable<ID> {
      get { __data["paginationCursor"] }
      set { __data["paginationCursor"] = newValue }
    }

    public var limit: GraphQLNullable<Int> {
      get { __data["limit"] }
      set { __data["limit"] = newValue }
    }

    public var sortOrder: GraphQLNullable<GraphQLEnum<SortOrders>> {
      get { __data["sortOrder"] }
      set { __data["sortOrder"] = newValue }
    }
  }

}