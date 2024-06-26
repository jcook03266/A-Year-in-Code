// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class UserNotificationPreferenceUpdateResponse: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.UserNotificationPreferenceUpdateResponse
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<UserNotificationPreferenceUpdateResponse>>

  public struct MockFields {
    @Field<[ClientError]>("errors") public var errors
    @Field<Bool>("notificationsEnabled") public var notificationsEnabled
    @Field<Int>("statusCode") public var statusCode
  }
}

public extension Mock where O == UserNotificationPreferenceUpdateResponse {
  convenience init(
    errors: [Mock<ClientError>]? = nil,
    notificationsEnabled: Bool? = nil,
    statusCode: Int? = nil
  ) {
    self.init()
    self.errors = errors
    self.notificationsEnabled = notificationsEnabled
    self.statusCode = statusCode
  }
}
