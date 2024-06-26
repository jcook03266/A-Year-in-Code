// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class GenericMutationResponse: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.GenericMutationResponse
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<GenericMutationResponse>>

  public struct MockFields {
    @Field<[ClientError]>("errors") public var errors
    @Field<Int>("statusCode") public var statusCode
  }
}

public extension Mock where O == GenericMutationResponse {
  convenience init(
    errors: [Mock<ClientError>]? = nil,
    statusCode: Int? = nil
  ) {
    self.init()
    self.errors = errors
    self.statusCode = statusCode
  }
}
