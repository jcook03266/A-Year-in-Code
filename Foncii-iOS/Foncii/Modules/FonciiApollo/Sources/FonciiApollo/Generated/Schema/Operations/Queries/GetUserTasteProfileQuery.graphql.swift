// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class GetUserTasteProfileQuery: GraphQLQuery {
    public static let operationName: String = "GetUserTasteProfile"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "3ae389aca4f95a31830714a2af107b5dbaa0453fa2c20791dbf5dadb52ea4179",
      definition: .init(
        #"""
        query GetUserTasteProfile($userId: ID!) {
          getUserTasteProfile(userID: $userId) {
            __typename
            id
            adventureLevel
            restaurantRatingImportanceLevel
            distancePreferenceLevel
            prefersDrinks
            favoriteCuisines
            foodRestrictions
            preferredPriceLevels
            preferredMealTypes
            creationDate
            lastUpdated
          }
        }
        """#
      ))

    public var userId: ID

    public init(userId: ID) {
      self.userId = userId
    }

    public var __variables: Variables? { ["userId": userId] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Query }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("getUserTasteProfile", GetUserTasteProfile?.self, arguments: ["userID": .variable("userId")]),
      ] }

      public var getUserTasteProfile: GetUserTasteProfile? { __data["getUserTasteProfile"] }

      /// GetUserTasteProfile
      ///
      /// Parent Type: `TasteProfile`
      public struct GetUserTasteProfile: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.TasteProfile }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("id", FonciiSchema.ID.self),
          .field("adventureLevel", Int?.self),
          .field("restaurantRatingImportanceLevel", Int?.self),
          .field("distancePreferenceLevel", Int?.self),
          .field("prefersDrinks", Bool.self),
          .field("favoriteCuisines", [FonciiSchema.ID].self),
          .field("foodRestrictions", [FonciiSchema.ID].self),
          .field("preferredPriceLevels", [Int].self),
          .field("preferredMealTypes", [FonciiSchema.ID].self),
          .field("creationDate", String.self),
          .field("lastUpdated", String.self),
        ] }

        public var id: FonciiSchema.ID { __data["id"] }
        public var adventureLevel: Int? { __data["adventureLevel"] }
        public var restaurantRatingImportanceLevel: Int? { __data["restaurantRatingImportanceLevel"] }
        public var distancePreferenceLevel: Int? { __data["distancePreferenceLevel"] }
        public var prefersDrinks: Bool { __data["prefersDrinks"] }
        public var favoriteCuisines: [FonciiSchema.ID] { __data["favoriteCuisines"] }
        public var foodRestrictions: [FonciiSchema.ID] { __data["foodRestrictions"] }
        public var preferredPriceLevels: [Int] { __data["preferredPriceLevels"] }
        public var preferredMealTypes: [FonciiSchema.ID] { __data["preferredMealTypes"] }
        public var creationDate: String { __data["creationDate"] }
        public var lastUpdated: String { __data["lastUpdated"] }
      }
    }
  }

}