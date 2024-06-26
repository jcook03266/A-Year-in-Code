// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class RequestUsernameReminderEmailMutation: GraphQLMutation {
    public static let operationName: String = "RequestUsernameReminderEmail"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "908fe606ccc365d71c41712f4496b49a1f814693646a66079e34d046d1f4a3a9",
      definition: .init(
        #"""
        mutation RequestUsernameReminderEmail($email: ID!) {
          requestUsernameReminderEmail(email: $email) {
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

    public var email: ID

    public init(email: ID) {
      self.email = email
    }

    public var __variables: Variables? { ["email": email] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Mutation }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("requestUsernameReminderEmail", RequestUsernameReminderEmail.self, arguments: ["email": .variable("email")]),
      ] }

      public var requestUsernameReminderEmail: RequestUsernameReminderEmail { __data["requestUsernameReminderEmail"] }

      /// RequestUsernameReminderEmail
      ///
      /// Parent Type: `GenericMutationResponse`
      public struct RequestUsernameReminderEmail: FonciiSchema.SelectionSet {
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

        /// RequestUsernameReminderEmail.Error
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