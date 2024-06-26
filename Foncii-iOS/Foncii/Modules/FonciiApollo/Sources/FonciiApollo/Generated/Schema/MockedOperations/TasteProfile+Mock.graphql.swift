// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class TasteProfile: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.TasteProfile
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<TasteProfile>>

  public struct MockFields {
    @Field<Int>("adventureLevel") public var adventureLevel
    @Field<String>("creationDate") public var creationDate
    @Field<Int>("distancePreferenceLevel") public var distancePreferenceLevel
    @Field<[FonciiSchema.ID]>("favoriteCuisines") public var favoriteCuisines
    @Field<[FonciiSchema.ID]>("foodRestrictions") public var foodRestrictions
    @Field<FonciiSchema.ID>("id") public var id
    @Field<String>("lastUpdated") public var lastUpdated
    @Field<[FonciiSchema.ID]>("preferredMealTypes") public var preferredMealTypes
    @Field<[Int]>("preferredPriceLevels") public var preferredPriceLevels
    @Field<Bool>("prefersDrinks") public var prefersDrinks
    @Field<Int>("restaurantRatingImportanceLevel") public var restaurantRatingImportanceLevel
  }
}

public extension Mock where O == TasteProfile {
  convenience init(
    adventureLevel: Int? = nil,
    creationDate: String? = nil,
    distancePreferenceLevel: Int? = nil,
    favoriteCuisines: [FonciiSchema.ID]? = nil,
    foodRestrictions: [FonciiSchema.ID]? = nil,
    id: FonciiSchema.ID? = nil,
    lastUpdated: String? = nil,
    preferredMealTypes: [FonciiSchema.ID]? = nil,
    preferredPriceLevels: [Int]? = nil,
    prefersDrinks: Bool? = nil,
    restaurantRatingImportanceLevel: Int? = nil
  ) {
    self.init()
    self.adventureLevel = adventureLevel
    self.creationDate = creationDate
    self.distancePreferenceLevel = distancePreferenceLevel
    self.favoriteCuisines = favoriteCuisines
    self.foodRestrictions = foodRestrictions
    self.id = id
    self.lastUpdated = lastUpdated
    self.preferredMealTypes = preferredMealTypes
    self.preferredPriceLevels = preferredPriceLevels
    self.prefersDrinks = prefersDrinks
    self.restaurantRatingImportanceLevel = restaurantRatingImportanceLevel
  }
}
