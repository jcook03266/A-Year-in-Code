// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class GoogleRestaurantProperties: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.GoogleRestaurantProperties
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<GoogleRestaurantProperties>>

  public struct MockFields {
    @Field<Double>("rating") public var rating
  }
}

public extension Mock where O == GoogleRestaurantProperties {
  convenience init(
    rating: Double? = nil
  ) {
    self.init()
    self.rating = rating
  }
}
