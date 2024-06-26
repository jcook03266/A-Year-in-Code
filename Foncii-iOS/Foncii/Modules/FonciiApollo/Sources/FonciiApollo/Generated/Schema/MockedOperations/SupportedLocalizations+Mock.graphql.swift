// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class SupportedLocalizations: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.SupportedLocalizations
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<SupportedLocalizations>>

  public struct MockFields {
    @Field<String>("en") public var en
  }
}

public extension Mock where O == SupportedLocalizations {
  convenience init(
    en: String? = nil
  ) {
    self.init()
    self.en = en
  }
}
