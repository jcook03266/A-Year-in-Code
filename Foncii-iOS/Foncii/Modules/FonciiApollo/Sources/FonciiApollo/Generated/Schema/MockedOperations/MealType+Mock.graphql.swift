// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class MealType: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.MealType
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<MealType>>

  public struct MockFields {
    @Field<FonciiSchema.ID>("id") public var id
    @Field<SupportedLocalizations>("localizedNames") public var localizedNames
  }
}

public extension Mock where O == MealType {
  convenience init(
    id: FonciiSchema.ID? = nil,
    localizedNames: Mock<SupportedLocalizations>? = nil
  ) {
    self.init()
    self.id = id
    self.localizedNames = localizedNames
  }
}
