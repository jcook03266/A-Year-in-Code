// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class SetUserTasteProfileMutation: GraphQLMutation {
    public static let operationName: String = "SetUserTasteProfile"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "ad41d2d86ff0a8679e11468d2f7db4289aeda6e2bb26a035ec1e493f92e3b229",
      definition: .init(
        #"""
        mutation SetUserTasteProfile($input: UserTasteProfileInput!) {
          setUserTasteProfile(input: $input) {
            __typename
            tasteProfile {
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
            errors {
              __typename
              errorCode
              description
            }
            statusCode
          }
        }
        """#
      ))

    public var input: UserTasteProfileInput

    public init(input: UserTasteProfileInput) {
      self.input = input
    }

    public var __variables: Variables? { ["input": input] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Mutation }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("setUserTasteProfile", SetUserTasteProfile.self, arguments: ["input": .variable("input")]),
      ] }

      public var setUserTasteProfile: SetUserTasteProfile { __data["setUserTasteProfile"] }

      /// SetUserTasteProfile
      ///
      /// Parent Type: `SetTasteProfileResponse`
      public struct SetUserTasteProfile: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.SetTasteProfileResponse }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("tasteProfile", TasteProfile.self),
          .field("errors", [Error]?.self),
          .field("statusCode", Int.self),
        ] }

        public var tasteProfile: TasteProfile { __data["tasteProfile"] }
        public var errors: [Error]? { __data["errors"] }
        public var statusCode: Int { __data["statusCode"] }

        /// SetUserTasteProfile.TasteProfile
        ///
        /// Parent Type: `TasteProfile`
        public struct TasteProfile: FonciiSchema.SelectionSet {
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

        /// SetUserTasteProfile.Error
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