// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class DoesUserHaveATasteProfileQuery: GraphQLQuery {
    public static let operationName: String = "DoesUserHaveATasteProfile"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "26873c14f6486b9c89f3100c6909bc78b76da3f67019264b95860cf4b98b280a",
      definition: .init(
        #"""
        query DoesUserHaveATasteProfile($userId: ID!) {
          doesUserHaveATasteProfile(userID: $userId)
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
        .field("doesUserHaveATasteProfile", Bool.self, arguments: ["userID": .variable("userId")]),
      ] }

      public var doesUserHaveATasteProfile: Bool { __data["doesUserHaveATasteProfile"] }
    }
  }

}