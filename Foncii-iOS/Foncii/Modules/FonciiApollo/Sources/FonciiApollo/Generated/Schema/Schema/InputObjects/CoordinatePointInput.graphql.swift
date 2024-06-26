// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct CoordinatePointInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      lat: Double,
      lng: Double
    ) {
      __data = InputDict([
        "lat": lat,
        "lng": lng
      ])
    }

    public var lat: Double {
      get { __data["lat"] }
      set { __data["lat"] = newValue }
    }

    public var lng: Double {
      get { __data["lng"] }
      set { __data["lng"] = newValue }
    }
  }

}