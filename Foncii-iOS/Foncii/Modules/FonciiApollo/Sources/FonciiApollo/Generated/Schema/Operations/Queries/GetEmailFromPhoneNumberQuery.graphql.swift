// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class GetEmailFromPhoneNumberQuery: GraphQLQuery {
    public static let operationName: String = "GetEmailFromPhoneNumber"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "7b6724f5ebd41119580b9270311bf88d70b2915719dbbfa456d5ec77c85457e9",
      definition: .init(
        #"""
        query GetEmailFromPhoneNumber($phoneNumberInput: PhoneNumberInput!) {
          getUserEmailFromPhoneNumber(phoneNumberInput: $phoneNumberInput)
        }
        """#
      ))

    public var phoneNumberInput: PhoneNumberInput

    public init(phoneNumberInput: PhoneNumberInput) {
      self.phoneNumberInput = phoneNumberInput
    }

    public var __variables: Variables? { ["phoneNumberInput": phoneNumberInput] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Query }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("getUserEmailFromPhoneNumber", String?.self, arguments: ["phoneNumberInput": .variable("phoneNumberInput")]),
      ] }

      public var getUserEmailFromPhoneNumber: String? { __data["getUserEmailFromPhoneNumber"] }
    }
  }

}