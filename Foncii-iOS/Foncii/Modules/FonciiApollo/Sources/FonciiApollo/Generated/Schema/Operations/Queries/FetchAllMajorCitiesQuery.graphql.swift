// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class FetchAllMajorCitiesQuery: GraphQLQuery {
    public static let operationName: String = "FetchAllMajorCities"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "dad5bddac7cc6cb1548a2ac388a206ee019c86ccd4292da57d0d5f38a0fcdfee",
      definition: .init(
        #"""
        query FetchAllMajorCities {
          fetchAllMajorCities {
            __typename
            id
            name
            abbreviatedState
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
        .field("fetchAllMajorCities", [FetchAllMajorCity].self),
      ] }

      public var fetchAllMajorCities: [FetchAllMajorCity] { __data["fetchAllMajorCities"] }

      /// FetchAllMajorCity
      ///
      /// Parent Type: `MajorCity`
      public struct FetchAllMajorCity: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.MajorCity }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("id", FonciiSchema.ID.self),
          .field("name", String.self),
          .field("abbreviatedState", String.self),
        ] }

        public var id: FonciiSchema.ID { __data["id"] }
        public var name: String { __data["name"] }
        public var abbreviatedState: String { __data["abbreviatedState"] }
      }
    }
  }

}