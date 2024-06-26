// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class CreateUserMutation: GraphQLMutation {
    public static let operationName: String = "CreateUser"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "58c5c0aaf100cc7671b941c7030391ec17caf6d1431c13d3da8f1e7bbfedb460",
      definition: .init(
        #"""
        mutation CreateUser($input: CreateNewUserInput!) {
          createUser(input: $input) {
            __typename
            statusCode
            errors {
              __typename
              errorCode
              description
            }
            newUser {
              __typename
              id
              fullName
              username
              email
              phoneNumber
              authProviders
              isPhoneNumberVerified
              creationDate
              profilePictureURL
              lastUpdated
              notificationsEnabled
              profileTasks {
                __typename
                id
                isComplete
              }
              referralCode
            }
          }
        }
        """#
      ))

    public var input: CreateNewUserInput

    public init(input: CreateNewUserInput) {
      self.input = input
    }

    public var __variables: Variables? { ["input": input] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Mutation }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("createUser", CreateUser.self, arguments: ["input": .variable("input")]),
      ] }

      public var createUser: CreateUser { __data["createUser"] }

      /// CreateUser
      ///
      /// Parent Type: `CreateUserResponse`
      public struct CreateUser: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.CreateUserResponse }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("statusCode", Int.self),
          .field("errors", [Error]?.self),
          .field("newUser", NewUser?.self),
        ] }

        public var statusCode: Int { __data["statusCode"] }
        public var errors: [Error]? { __data["errors"] }
        public var newUser: NewUser? { __data["newUser"] }

        /// CreateUser.Error
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

        /// CreateUser.NewUser
        ///
        /// Parent Type: `User`
        public struct NewUser: FonciiSchema.SelectionSet {
          public let __data: DataDict
          public init(_dataDict: DataDict) { __data = _dataDict }

          public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.User }
          public static var __selections: [ApolloAPI.Selection] { [
            .field("__typename", String.self),
            .field("id", FonciiSchema.ID.self),
            .field("fullName", String.self),
            .field("username", String.self),
            .field("email", String.self),
            .field("phoneNumber", String.self),
            .field("authProviders", [FonciiSchema.ID].self),
            .field("isPhoneNumberVerified", Bool.self),
            .field("creationDate", String.self),
            .field("profilePictureURL", String?.self),
            .field("lastUpdated", String.self),
            .field("notificationsEnabled", Bool.self),
            .field("profileTasks", [ProfileTask].self),
            .field("referralCode", String.self),
          ] }

          public var id: FonciiSchema.ID { __data["id"] }
          public var fullName: String { __data["fullName"] }
          public var username: String { __data["username"] }
          public var email: String { __data["email"] }
          public var phoneNumber: String { __data["phoneNumber"] }
          public var authProviders: [FonciiSchema.ID] { __data["authProviders"] }
          public var isPhoneNumberVerified: Bool { __data["isPhoneNumberVerified"] }
          public var creationDate: String { __data["creationDate"] }
          public var profilePictureURL: String? { __data["profilePictureURL"] }
          public var lastUpdated: String { __data["lastUpdated"] }
          public var notificationsEnabled: Bool { __data["notificationsEnabled"] }
          public var profileTasks: [ProfileTask] { __data["profileTasks"] }
          public var referralCode: String { __data["referralCode"] }

          /// CreateUser.NewUser.ProfileTask
          ///
          /// Parent Type: `ProfileTask`
          public struct ProfileTask: FonciiSchema.SelectionSet {
            public let __data: DataDict
            public init(_dataDict: DataDict) { __data = _dataDict }

            public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.ProfileTask }
            public static var __selections: [ApolloAPI.Selection] { [
              .field("__typename", String.self),
              .field("id", FonciiSchema.ID.self),
              .field("isComplete", Bool.self),
            ] }

            public var id: FonciiSchema.ID { __data["id"] }
            public var isComplete: Bool { __data["isComplete"] }
          }
        }
      }
    }
  }

}