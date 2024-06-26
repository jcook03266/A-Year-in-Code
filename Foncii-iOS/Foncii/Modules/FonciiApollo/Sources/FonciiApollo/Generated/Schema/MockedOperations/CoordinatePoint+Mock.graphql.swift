// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class CoordinatePoint: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.CoordinatePoint
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<CoordinatePoint>>

  public struct MockFields {
    @Field<Double>("lat") public var lat
    @Field<Double>("lng") public var lng
  }
}

public extension Mock where O == CoordinatePoint {
  convenience init(
    lat: Double? = nil,
    lng: Double? = nil
  ) {
    self.init()
    self.lat = lat
    self.lng = lng
  }
}
