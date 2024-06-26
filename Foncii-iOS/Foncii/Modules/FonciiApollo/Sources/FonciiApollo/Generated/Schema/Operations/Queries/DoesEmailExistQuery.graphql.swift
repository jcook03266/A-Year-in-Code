// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class DoesEmailExistQuery: GraphQLQuery {
    public static let operationName: String = "DoesEmailExist"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "bc8a7d1d4c523613be7cd30733a937a09e0fd6a1223d7558650266e33ee0e22b",
      definition: .init(
        #"""
        query DoesEmailExist($email: String!) {
          doesEmailExist(email: $email)
        }
        """#
      ))

    public var email: String

    public init(email: String) {
      self.email = email
    }

    public var __variables: Variables? { ["email": email] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Query }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("doesEmailExist", Bool.self, arguments: ["email": .variable("email")]),
      ] }

      public var doesEmailExist: Bool { __data["doesEmailExist"] }
    }
  }

}