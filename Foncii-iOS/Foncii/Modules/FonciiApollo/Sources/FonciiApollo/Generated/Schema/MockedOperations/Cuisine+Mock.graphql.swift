// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class Cuisine: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.Cuisine
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<Cuisine>>

  public struct MockFields {
    @Field<FonciiSchema.ID>("id") public var id
    @Field<String>("imageURL") public var imageURL
    @Field<SupportedLocalizations>("localizedNames") public var localizedNames
  }
}

public extension Mock where O == Cuisine {
  convenience init(
    id: FonciiSchema.ID? = nil,
    imageURL: String? = nil,
    localizedNames: Mock<SupportedLocalizations>? = nil
  ) {
    self.init()
    self.id = id
    self.imageURL = imageURL
    self.localizedNames = localizedNames
  }
}
