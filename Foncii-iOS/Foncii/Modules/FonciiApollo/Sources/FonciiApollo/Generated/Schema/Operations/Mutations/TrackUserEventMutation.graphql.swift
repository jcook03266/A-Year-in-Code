// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class TrackUserEventMutation: GraphQLMutation {
    public static let operationName: String = "TrackUserEvent"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "1bb2f50dbf9fe6b715ba9e8a0d3af722f6ab7e9692fd41a81bfeb4b7c884ff86",
      definition: .init(
        #"""
        mutation TrackUserEvent($input: TrackableUserEventTrackingInput) {
          trackUserEvent(input: $input) {
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

    public var input: GraphQLNullable<TrackableUserEventTrackingInput>

    public init(input: GraphQLNullable<TrackableUserEventTrackingInput>) {
      self.input = input
    }

    public var __variables: Variables? { ["input": input] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Mutation }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("trackUserEvent", TrackUserEvent.self, arguments: ["input": .variable("input")]),
      ] }

      public var trackUserEvent: TrackUserEvent { __data["trackUserEvent"] }

      /// TrackUserEvent
      ///
      /// Parent Type: `GenericMutationResponse`
      public struct TrackUserEvent: FonciiSchema.SelectionSet {
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

        /// TrackUserEvent.Error
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