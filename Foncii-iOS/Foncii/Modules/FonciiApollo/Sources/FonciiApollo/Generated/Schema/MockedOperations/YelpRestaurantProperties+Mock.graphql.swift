// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class YelpRestaurantProperties: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.YelpRestaurantProperties
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<YelpRestaurantProperties>>

  public struct MockFields {
    @Field<Double>("rating") public var rating
  }
}

public extension Mock where O == YelpRestaurantProperties {
  convenience init(
    rating: Double? = nil
  ) {
    self.init()
    self.rating = rating
  }
}
