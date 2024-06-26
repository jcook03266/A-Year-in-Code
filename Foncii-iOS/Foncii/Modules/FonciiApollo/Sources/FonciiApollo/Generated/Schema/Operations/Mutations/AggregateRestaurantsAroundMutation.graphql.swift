// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class AggregateRestaurantsAroundMutation: GraphQLMutation {
    public static let operationName: String = "AggregateRestaurantsAround"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "82e92a10086d134e6dfcb920fa7f6f58a30ecea8c6571fe4422e63135a8f5523",
      definition: .init(
        #"""
        mutation AggregateRestaurantsAround($input: AggregateRestaurantsAroundInput) {
          aggregateRestaurantsAround(input: $input) {
            __typename
            statusCode
            errors {
              __typename
              errorCode
              description
            }
          }
        }
        """#
      ))

    public var input: GraphQLNullable<AggregateRestaurantsAroundInput>

    public init(input: GraphQLNullable<AggregateRestaurantsAroundInput>) {
      self.input = input
    }

    public var __variables: Variables? { ["input": input] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Mutation }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("aggregateRestaurantsAround", AggregateRestaurantsAround.self, arguments: ["input": .variable("input")]),
      ] }

      public var aggregateRestaurantsAround: AggregateRestaurantsAround { __data["aggregateRestaurantsAround"] }

      /// AggregateRestaurantsAround
      ///
      /// Parent Type: `RestaurantAggregationResponse`
      public struct AggregateRestaurantsAround: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.RestaurantAggregationResponse }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("statusCode", Int.self),
          .field("errors", [Error]?.self),
        ] }

        public var statusCode: Int { __data["statusCode"] }
        public var errors: [Error]? { __data["errors"] }

        /// AggregateRestaurantsAround.Error
        ///
        /// Parent Type: `ClientError`
        public struct Error: FonciiSchema.SelectionSet {
          public let __data: DataDict
          public init(_dataDict: DataDict) { __data = _dataDict }

          public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.ClientError }
          public static var __selections: [ApolloAPI.Selection] { [
            .field("__typename", String.self),
            .field("errorCode", String.self),
            .field("description", String.self),
          ] }

          public var errorCode: String { __data["errorCode"] }
          public var description: String { __data["description"] }
        }
      }
    }
  }

}