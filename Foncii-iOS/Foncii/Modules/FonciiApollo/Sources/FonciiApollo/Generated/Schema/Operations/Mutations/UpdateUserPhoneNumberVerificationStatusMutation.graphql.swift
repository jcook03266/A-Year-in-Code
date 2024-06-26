// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class UpdateUserPhoneNumberVerificationStatusMutation: GraphQLMutation {
    public static let operationName: String = "UpdateUserPhoneNumberVerificationStatus"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "ce3ab7c6c7e631806f4e66a2789074a5289c74a62160a7511f5a6cb04e6aedfe",
      definition: .init(
        #"""
        mutation UpdateUserPhoneNumberVerificationStatus($input: UpdateUserPhoneNumberVerificationStatusInput!) {
          updateUserPhoneNumberVerificationStatus(input: $input) {
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

    public var input: UpdateUserPhoneNumberVerificationStatusInput

    public init(input: UpdateUserPhoneNumberVerificationStatusInput) {
      self.input = input
    }

    public var __variables: Variables? { ["input": input] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Mutation }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("updateUserPhoneNumberVerificationStatus", UpdateUserPhoneNumberVerificationStatus.self, arguments: ["input": .variable("input")]),
      ] }

      public var updateUserPhoneNumberVerificationStatus: UpdateUserPhoneNumberVerificationStatus { __data["updateUserPhoneNumberVerificationStatus"] }

      /// UpdateUserPhoneNumberVerificationStatus
      ///
      /// Parent Type: `GenericMutationResponse`
      public struct UpdateUserPhoneNumberVerificationStatus: FonciiSchema.SelectionSet {
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

        /// UpdateUserPhoneNumberVerificationStatus.Error
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