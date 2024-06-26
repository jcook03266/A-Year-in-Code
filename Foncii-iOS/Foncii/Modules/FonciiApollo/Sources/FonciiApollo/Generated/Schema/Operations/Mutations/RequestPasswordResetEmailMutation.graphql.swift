// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class RequestPasswordResetEmailMutation: GraphQLMutation {
    public static let operationName: String = "RequestPasswordResetEmail"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "8d682f5475c1d080dd7e0433a5483b65b68612855eae30b489aac4ec58c8d7cc",
      definition: .init(
        #"""
        mutation RequestPasswordResetEmail($email: ID!) {
          requestPasswordResetEmail(email: $email) {
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
        .field("requestPasswordResetEmail", RequestPasswordResetEmail.self, arguments: ["email": .variable("email")]),
      ] }

      public var requestPasswordResetEmail: RequestPasswordResetEmail { __data["requestPasswordResetEmail"] }

      /// RequestPasswordResetEmail
      ///
      /// Parent Type: `GenericMutationResponse`
      public struct RequestPasswordResetEmail: FonciiSchema.SelectionSet {
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

        /// RequestPasswordResetEmail.Error
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