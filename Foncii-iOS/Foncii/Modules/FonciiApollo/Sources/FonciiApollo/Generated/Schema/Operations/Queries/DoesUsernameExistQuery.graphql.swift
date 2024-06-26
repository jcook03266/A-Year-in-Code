// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class DoesUsernameExistQuery: GraphQLQuery {
    public static let operationName: String = "DoesUsernameExist"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "5e69e33d43afb7efbbf482a46ff292752902608f919c6487ccde09927a843b31",
      definition: .init(
        #"""
        query DoesUsernameExist($username: String!) {
          doesUsernameExist(username: $username)
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
        .field("doesUsernameExist", Bool.self, arguments: ["username": .variable("username")]),
      ] }

      public var doesUsernameExist: Bool { __data["doesUsernameExist"] }
    }
  }

}