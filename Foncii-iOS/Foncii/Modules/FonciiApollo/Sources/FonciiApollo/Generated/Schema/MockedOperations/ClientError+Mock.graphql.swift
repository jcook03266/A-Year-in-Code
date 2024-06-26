// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class ClientError: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.ClientError
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<ClientError>>

  public struct MockFields {
    @Field<String>("description") public var description
    @Field<String>("errorCode") public var errorCode
  }
}

public extension Mock where O == ClientError {
  convenience init(
    description: String? = nil,
    errorCode: String? = nil
  ) {
    self.init()
    self.description = description
    self.errorCode = errorCode
  }
}
