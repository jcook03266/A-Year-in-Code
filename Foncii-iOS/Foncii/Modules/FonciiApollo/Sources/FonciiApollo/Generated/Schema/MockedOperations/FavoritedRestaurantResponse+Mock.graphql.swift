// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class FavoritedRestaurantResponse: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.FavoritedRestaurantResponse
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<FavoritedRestaurantResponse>>

  public struct MockFields {
    @Field<[ClientError]>("errors") public var errors
    @Field<Int>("statusCode") public var statusCode
    @Field<PersonalizedRestaurant>("updatedPersonalizedRestaurant") public var updatedPersonalizedRestaurant
  }
}

public extension Mock where O == FavoritedRestaurantResponse {
  convenience init(
    errors: [Mock<ClientError>]? = nil,
    statusCode: Int? = nil,
    updatedPersonalizedRestaurant: Mock<PersonalizedRestaurant>? = nil
  ) {
    self.init()
    self.errors = errors
    self.statusCode = statusCode
    self.updatedPersonalizedRestaurant = updatedPersonalizedRestaurant
  }
}
