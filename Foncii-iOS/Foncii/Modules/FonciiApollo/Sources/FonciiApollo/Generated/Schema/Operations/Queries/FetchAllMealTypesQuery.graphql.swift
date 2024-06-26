// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class FetchAllMealTypesQuery: GraphQLQuery {
    public static let operationName: String = "FetchAllMealTypes"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "c2637a6aa842dc4261804af67c8139bd3cd90d33560b6636eb84194d3dc33a18",
      definition: .init(
        #"""
        query FetchAllMealTypes {
          fetchAllMealTypes {
            __typename
            id
            localizedNames {
              __typename
              en
            }
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
        .field("fetchAllMealTypes", [FetchAllMealType].self),
      ] }

      public var fetchAllMealTypes: [FetchAllMealType] { __data["fetchAllMealTypes"] }

      /// FetchAllMealType
      ///
      /// Parent Type: `MealType`
      public struct FetchAllMealType: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.MealType }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("id", FonciiSchema.ID.self),
          .field("localizedNames", LocalizedNames.self),
        ] }

        public var id: FonciiSchema.ID { __data["id"] }
        public var localizedNames: LocalizedNames { __data["localizedNames"] }

        /// FetchAllMealType.LocalizedNames
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