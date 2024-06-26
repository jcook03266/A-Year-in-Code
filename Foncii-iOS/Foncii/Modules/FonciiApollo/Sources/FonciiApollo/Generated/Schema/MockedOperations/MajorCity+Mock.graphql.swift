// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class MajorCity: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.MajorCity
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<MajorCity>>

  public struct MockFields {
    @Field<String>("abbreviatedState") public var abbreviatedState
    @Field<FonciiSchema.ID>("id") public var id
    @Field<String>("name") public var name
  }
}

public extension Mock where O == MajorCity {
  convenience init(
    abbreviatedState: String? = nil,
    id: FonciiSchema.ID? = nil,
    name: String? = nil
  ) {
    self.init()
    self.abbreviatedState = abbreviatedState
    self.id = id
    self.name = name
  }
}
