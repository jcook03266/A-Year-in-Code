// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class TrackRestaurantPersonalizationEventMutation: GraphQLMutation {
    public static let operationName: String = "TrackRestaurantPersonalizationEvent"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "599c99078080ba401c9b5851fb7b4e4f80bf934056b2bcca5d1ccba7ba9bdc85",
      definition: .init(
        #"""
        mutation TrackRestaurantPersonalizationEvent($input: RestaurantPersonalizationEventTrackingInput) {
          trackRestaurantPersonalizationEvent(input: $input) {
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

    public var input: GraphQLNullable<RestaurantPersonalizationEventTrackingInput>

    public init(input: GraphQLNullable<RestaurantPersonalizationEventTrackingInput>) {
      self.input = input
    }

    public var __variables: Variables? { ["input": input] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Mutation }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("trackRestaurantPersonalizationEvent", TrackRestaurantPersonalizationEvent.self, arguments: ["input": .variable("input")]),
      ] }

      public var trackRestaurantPersonalizationEvent: TrackRestaurantPersonalizationEvent { __data["trackRestaurantPersonalizationEvent"] }

      /// TrackRestaurantPersonalizationEvent
      ///
      /// Parent Type: `GenericMutationResponse`
      public struct TrackRestaurantPersonalizationEvent: FonciiSchema.SelectionSet {
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

        /// TrackRestaurantPersonalizationEvent.Error
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