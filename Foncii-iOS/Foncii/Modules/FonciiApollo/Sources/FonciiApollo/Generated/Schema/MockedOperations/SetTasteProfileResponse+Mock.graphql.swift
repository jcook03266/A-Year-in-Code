// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class SetTasteProfileResponse: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.SetTasteProfileResponse
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<SetTasteProfileResponse>>

  public struct MockFields {
    @Field<[ClientError]>("errors") public var errors
    @Field<Int>("statusCode") public var statusCode
    @Field<TasteProfile>("tasteProfile") public var tasteProfile
  }
}

public extension Mock where O == SetTasteProfileResponse {
  convenience init(
    errors: [Mock<ClientError>]? = nil,
    statusCode: Int? = nil,
    tasteProfile: Mock<TasteProfile>? = nil
  ) {
    self.init()
    self.errors = errors
    self.statusCode = statusCode
    self.tasteProfile = tasteProfile
  }
}
