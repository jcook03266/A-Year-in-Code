// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class DoesPhoneNumberExistQuery: GraphQLQuery {
    public static let operationName: String = "DoesPhoneNumberExist"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "301479e35569f34c0d597c49b9cb71c42401a68f9a21a5716eafc365ab69505b",
      definition: .init(
        #"""
        query DoesPhoneNumberExist($phoneNumberInput: PhoneNumberInput!) {
          doesPhoneNumberExist(phoneNumberInput: $phoneNumberInput)
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
        .field("doesPhoneNumberExist", Bool.self, arguments: ["phoneNumberInput": .variable("phoneNumberInput")]),
      ] }

      public var doesPhoneNumberExist: Bool { __data["doesPhoneNumberExist"] }
    }
  }

}