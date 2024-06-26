// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class FetchAllCuisinesQuery: GraphQLQuery {
    public static let operationName: String = "FetchAllCuisines"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "1c6caca519f582c88f6572b758add05375e47955f4f93a15b7d1418134abfe37",
      definition: .init(
        #"""
        query FetchAllCuisines {
          fetchAllCuisines {
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
        .field("fetchAllCuisines", [FetchAllCuisine].self),
      ] }

      public var fetchAllCuisines: [FetchAllCuisine] { __data["fetchAllCuisines"] }

      /// FetchAllCuisine
      ///
      /// Parent Type: `Cuisine`
      public struct FetchAllCuisine: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Cuisine }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("id", FonciiSchema.ID.self),
          .field("localizedNames", LocalizedNames.self),
          .field("imageURL", String.self),
        ] }

        public var id: FonciiSchema.ID { __data["id"] }
        public var localizedNames: LocalizedNames { __data["localizedNames"] }
        public var imageURL: String { __data["imageURL"] }

        /// FetchAllCuisine.LocalizedNames
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