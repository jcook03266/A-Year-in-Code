// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct PhoneNumberInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      countryCode: String,
      nsn: String
    ) {
      __data = InputDict([
        "countryCode": countryCode,
        "nsn": nsn
      ])
    }

    public var countryCode: String {
      get { __data["countryCode"] }
      set { __data["countryCode"] = newValue }
    }

    public var nsn: String {
      get { __data["nsn"] }
      set { __data["nsn"] = newValue }
    }
  }

}