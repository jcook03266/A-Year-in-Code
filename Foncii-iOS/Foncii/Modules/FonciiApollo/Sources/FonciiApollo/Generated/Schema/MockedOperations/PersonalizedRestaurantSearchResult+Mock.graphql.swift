// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class PersonalizedRestaurantSearchResult: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.PersonalizedRestaurantSearchResult
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<PersonalizedRestaurantSearchResult>>

  public struct MockFields {
    @Field<String>("queryID") public var queryID
    @Field<[PersonalizedRestaurant]>("restaurants") public var restaurants
  }
}

public extension Mock where O == PersonalizedRestaurantSearchResult {
  convenience init(
    queryID: String? = nil,
    restaurants: [Mock<PersonalizedRestaurant>]? = nil
  ) {
    self.init()
    self.queryID = queryID
    self.restaurants = restaurants
  }
}
