// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class UpdateUserNotificationPreferenceMutation: GraphQLMutation {
    public static let operationName: String = "UpdateUserNotificationPreference"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "8f0fa0ea84f5e44de7a99c5a9a97bb2fd8d8ec252b7b6d0af3dbff8d9da79779",
      definition: .init(
        #"""
        mutation UpdateUserNotificationPreference($input: UpdateUserNotificationPreferenceInput!) {
          updateUserNotificationPreference(input: $input) {
            __typename
            notificationsEnabled
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

    public var input: UpdateUserNotificationPreferenceInput

    public init(input: UpdateUserNotificationPreferenceInput) {
      self.input = input
    }

    public var __variables: Variables? { ["input": input] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Mutation }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("updateUserNotificationPreference", UpdateUserNotificationPreference.self, arguments: ["input": .variable("input")]),
      ] }

      public var updateUserNotificationPreference: UpdateUserNotificationPreference { __data["updateUserNotificationPreference"] }

      /// UpdateUserNotificationPreference
      ///
      /// Parent Type: `UserNotificationPreferenceUpdateResponse`
      public struct UpdateUserNotificationPreference: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.UserNotificationPreferenceUpdateResponse }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("notificationsEnabled", Bool?.self),
          .field("statusCode", Int.self),
          .field("errors", [Error]?.self),
        ] }

        public var notificationsEnabled: Bool? { __data["notificationsEnabled"] }
        public var statusCode: Int { __data["statusCode"] }
        public var errors: [Error]? { __data["errors"] }

        /// UpdateUserNotificationPreference.Error
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