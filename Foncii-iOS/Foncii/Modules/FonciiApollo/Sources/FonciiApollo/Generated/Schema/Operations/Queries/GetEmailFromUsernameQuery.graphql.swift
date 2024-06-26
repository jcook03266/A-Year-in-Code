// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class GetEmailFromUsernameQuery: GraphQLQuery {
    public static let operationName: String = "GetEmailFromUsername"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "01ccf3682a57a50414135e3bd95c7946bd59221c01268e814263ed4547e529ae",
      definition: .init(
        #"""
        query GetEmailFromUsername($username: String!) {
          getUserEmailFromUsername(username: $username)
        }
        """#
      ))

    public var username: String

    public init(username: String) {
      self.username = username
    }

    public var __variables: Variables? { ["username": username] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Query }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("getUserEmailFromUsername", String?.self, arguments: ["username": .variable("username")]),
      ] }

      public var getUserEmailFromUsername: String? { __data["getUserEmailFromUsername"] }
    }
  }

}