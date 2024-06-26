// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class FetchAllFoodRestrictionsQuery: GraphQLQuery {
    public static let operationName: String = "FetchAllFoodRestrictions"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "4e068eeb70a07e9c42b202433cd9b79804420494313c70b53fc7320c584ced48",
      definition: .init(
        #"""
        query FetchAllFoodRestrictions {
          fetchAllFoodRestrictions {
            __typename
            id
            localizedNames {
              __typename
              en
            }
            imageURL
          }
        }
        """#
      ))

    public init() {}

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Query }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("fetchAllFoodRestrictions", [FetchAllFoodRestriction].self),
      ] }

      public var fetchAllFoodRestrictions: [FetchAllFoodRestriction] { __data["fetchAllFoodRestrictions"] }

      /// FetchAllFoodRestriction
      ///
      /// Parent Type: `FoodRestriction`
      public struct FetchAllFoodRestriction: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.FoodRestriction }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("id", FonciiSchema.ID.self),
          .field("localizedNames", LocalizedNames.self),
          .field("imageURL", String.self),
        ] }

        public var id: FonciiSchema.ID { __data["id"] }
        public var localizedNames: LocalizedNames { __data["localizedNames"] }
        public var imageURL: String { __data["imageURL"] }

        /// FetchAllFoodRestriction.LocalizedNames
        ///
        /// Parent Type: `SupportedLocalizations`
        public struct LocalizedNames: FonciiSchema.SelectionSet {
          public let __data: DataDict
          public init(_dataDict: DataDict) { __data = _dataDict }

          public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.SupportedLocalizations }
          public static var __selections: [ApolloAPI.Selection] { [
            .field("__typename", String.self),
            .field("en", String.self),
          ] }

          public var en: String { __data["en"] }
        }
      }
    }
  }

}