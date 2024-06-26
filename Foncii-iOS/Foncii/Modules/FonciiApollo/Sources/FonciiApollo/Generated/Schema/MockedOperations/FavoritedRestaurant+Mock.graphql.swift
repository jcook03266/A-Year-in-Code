// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class FavoritedRestaurant: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.FavoritedRestaurant
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<FavoritedRestaurant>>

  public struct MockFields {
    @Field<String>("creationDate") public var creationDate
    @Field<PersonalizedRestaurant>("favoritedRestaurant") public var favoritedRestaurant
    @Field<FonciiSchema.ID>("id") public var id
    @Field<FonciiSchema.ID>("userID") public var userID
  }
}

public extension Mock where O == FavoritedRestaurant {
  convenience init(
    creationDate: String? = nil,
    favoritedRestaurant: Mock<PersonalizedRestaurant>? = nil,
    id: FonciiSchema.ID? = nil,
    userID: FonciiSchema.ID? = nil
  ) {
    self.init()
    self.creationDate = creationDate
    self.favoritedRestaurant = favoritedRestaurant
    self.id = id
    self.userID = userID
  }
}
