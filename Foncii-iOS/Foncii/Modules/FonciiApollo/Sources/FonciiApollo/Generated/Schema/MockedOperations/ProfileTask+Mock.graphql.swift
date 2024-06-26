// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class ProfileTask: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.ProfileTask
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<ProfileTask>>

  public struct MockFields {
    @Field<FonciiSchema.ID>("id") public var id
    @Field<Bool>("isComplete") public var isComplete
  }
}

public extension Mock where O == ProfileTask {
  convenience init(
    id: FonciiSchema.ID? = nil,
    isComplete: Bool? = nil
  ) {
    self.init()
    self.id = id
    self.isComplete = isComplete
  }
}
