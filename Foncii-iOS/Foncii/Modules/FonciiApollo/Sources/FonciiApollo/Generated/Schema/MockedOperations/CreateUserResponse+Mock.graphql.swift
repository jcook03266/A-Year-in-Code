// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class CreateUserResponse: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.CreateUserResponse
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<CreateUserResponse>>

  public struct MockFields {
    @Field<[ClientError]>("errors") public var errors
    @Field<User>("newUser") public var newUser
    @Field<Int>("statusCode") public var statusCode
  }
}

public extension Mock where O == CreateUserResponse {
  convenience init(
    errors: [Mock<ClientError>]? = nil,
    newUser: Mock<User>? = nil,
    statusCode: Int? = nil
  ) {
    self.init()
    self.errors = errors
    self.newUser = newUser
    self.statusCode = statusCode
  }
}
