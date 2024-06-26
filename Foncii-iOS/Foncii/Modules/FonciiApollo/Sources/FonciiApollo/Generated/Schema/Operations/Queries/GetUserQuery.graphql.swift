// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class GetUserQuery: GraphQLQuery {
    public static let operationName: String = "GetUser"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "c77837afbc32c6fb0ea58e1578334ce4af61eda08a55c134977ca5da7de3a8e0",
      definition: .init(
        #"""
        query GetUser($userId: ID!) {
          getUser(userID: $userId) {
            __typename
            id
            fullName
            username
            email
            phoneNumber
            authProviders
            profilePictureURL
            isPhoneNumberVerified
            creationDate
            lastUpdated
            notificationsEnabled
            profileTasks {
              __typename
              id
              isComplete
            }
            referralCode
            firstFavorites {
              __typename
              id
            }
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
        .field("getUser", GetUser?.self, arguments: ["userID": .variable("userId")]),
      ] }

      public var getUser: GetUser? { __data["getUser"] }

      /// GetUser
      ///
      /// Parent Type: `User`
      public struct GetUser: FonciiSchema.SelectionSet {
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
          .field("profilePictureURL", String?.self),
          .field("isPhoneNumberVerified", Bool.self),
          .field("creationDate", String.self),
          .field("lastUpdated", String.self),
          .field("notificationsEnabled", Bool.self),
          .field("profileTasks", [ProfileTask].self),
          .field("referralCode", String.self),
          .field("firstFavorites", [FirstFavorite]?.self),
        ] }

        public var id: FonciiSchema.ID { __data["id"] }
        public var fullName: String { __data["fullName"] }
        public var username: String { __data["username"] }
        public var email: String { __data["email"] }
        public var phoneNumber: String { __data["phoneNumber"] }
        public var authProviders: [FonciiSchema.ID] { __data["authProviders"] }
        public var profilePictureURL: String? { __data["profilePictureURL"] }
        public var isPhoneNumberVerified: Bool { __data["isPhoneNumberVerified"] }
        public var creationDate: String { __data["creationDate"] }
        public var lastUpdated: String { __data["lastUpdated"] }
        public var notificationsEnabled: Bool { __data["notificationsEnabled"] }
        public var profileTasks: [ProfileTask] { __data["profileTasks"] }
        public var referralCode: String { __data["referralCode"] }
        public var firstFavorites: [FirstFavorite]? { __data["firstFavorites"] }

        /// GetUser.ProfileTask
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

        /// GetUser.FirstFavorite
        ///
        /// Parent Type: `Restaurant`
        public struct FirstFavorite: FonciiSchema.SelectionSet {
          public let __data: DataDict
          public init(_dataDict: DataDict) { __data = _dataDict }

          public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Restaurant }
          public static var __selections: [ApolloAPI.Selection] { [
            .field("__typename", String.self),
            .field("id", FonciiSchema.ID.self),
          ] }

          public var id: FonciiSchema.ID { __data["id"] }
        }
      }
    }
  }

}