// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class RestaurantAggregationResponse: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.RestaurantAggregationResponse
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<RestaurantAggregationResponse>>

  public struct MockFields {
    @Field<[ClientError]>("errors") public var errors
    @Field<Int>("statusCode") public var statusCode
  }
}

public extension Mock where O == RestaurantAggregationResponse {
  convenience init(
    errors: [Mock<ClientError>]? = nil,
    statusCode: Int? = nil
  ) {
    self.init()
    self.errors = errors
    self.statusCode = statusCode
  }
}
