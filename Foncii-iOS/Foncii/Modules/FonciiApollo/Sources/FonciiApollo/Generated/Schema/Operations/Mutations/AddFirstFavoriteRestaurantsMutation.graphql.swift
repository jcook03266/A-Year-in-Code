// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class AddFirstFavoriteRestaurantsMutation: GraphQLMutation {
    public static let operationName: String = "AddFirstFavoriteRestaurants"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "79024a97e86529775fefadf9feb88c3a30ba2618a98e7151917d049753911378",
      definition: .init(
        #"""
        mutation AddFirstFavoriteRestaurants($input: FirstFavoritedRestaurantsInput!) {
          addFirstFavoriteRestaurants(input: $input) {
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

    public var input: FirstFavoritedRestaurantsInput

    public init(input: FirstFavoritedRestaurantsInput) {
      self.input = input
    }

    public var __variables: Variables? { ["input": input] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Mutation }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("addFirstFavoriteRestaurants", AddFirstFavoriteRestaurants.self, arguments: ["input": .variable("input")]),
      ] }

      public var addFirstFavoriteRestaurants: AddFirstFavoriteRestaurants { __data["addFirstFavoriteRestaurants"] }

      /// AddFirstFavoriteRestaurants
      ///
      /// Parent Type: `GenericMutationResponse`
      public struct AddFirstFavoriteRestaurants: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.GenericMutationResponse }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("statusCode", Int.self),
          .field("errors", [Error]?.self),
        ] }

        public var statusCode: Int { __data["statusCode"] }
        public var errors: [Error]? { __data["errors"] }

        /// AddFirstFavoriteRestaurants.Error
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