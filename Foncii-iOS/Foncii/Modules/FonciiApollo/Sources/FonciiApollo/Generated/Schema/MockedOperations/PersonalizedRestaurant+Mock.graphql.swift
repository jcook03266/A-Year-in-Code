// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class PersonalizedRestaurant: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.PersonalizedRestaurant
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<PersonalizedRestaurant>>

  public struct MockFields {
    @Field<Bool>("isFavorited") public var isFavorited
    @Field<Double>("percentMatch") public var percentMatch
    @Field<Restaurant>("restaurant") public var restaurant
  }
}

public extension Mock where O == PersonalizedRestaurant {
  convenience init(
    isFavorited: Bool? = nil,
    percentMatch: Double? = nil,
    restaurant: Mock<Restaurant>? = nil
  ) {
    self.init()
    self.isFavorited = isFavorited
    self.percentMatch = percentMatch
    self.restaurant = restaurant
  }
}
