// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class Query: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.Query
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<Query>>

  public struct MockFields {
    @Field<Bool>("doesEmailExist") public var doesEmailExist
    @Field<Bool>("doesPhoneNumberExist") public var doesPhoneNumberExist
    @Field<Bool>("doesUserHaveATasteProfile") public var doesUserHaveATasteProfile
    @Field<Bool>("doesUsernameExist") public var doesUsernameExist
    @Field<[Cuisine]>("fetchAllCuisines") public var fetchAllCuisines
    @Field<[FoodRestriction]>("fetchAllFoodRestrictions") public var fetchAllFoodRestrictions
    @Field<[MajorCity]>("fetchAllMajorCities") public var fetchAllMajorCities
    @Field<[MealType]>("fetchAllMealTypes") public var fetchAllMealTypes
    @Field<[FavoritedRestaurant]>("fetchFavoriteRestaurantsFor") public var fetchFavoriteRestaurantsFor
    @Field<User>("getUser") public var getUser
    @Field<String>("getUserEmailFromPhoneNumber") public var getUserEmailFromPhoneNumber
    @Field<String>("getUserEmailFromUsername") public var getUserEmailFromUsername
    @Field<TasteProfile>("getUserTasteProfile") public var getUserTasteProfile
    @Field<PersonalizedRestaurantSearchResult>("searchForRestaurants") public var searchForRestaurants
  }
}

public extension Mock where O == Query {
  convenience init(
    doesEmailExist: Bool? = nil,
    doesPhoneNumberExist: Bool? = nil,
    doesUserHaveATasteProfile: Bool? = nil,
    doesUsernameExist: Bool? = nil,
    fetchAllCuisines: [Mock<Cuisine>]? = nil,
    fetchAllFoodRestrictions: [Mock<FoodRestriction>]? = nil,
    fetchAllMajorCities: [Mock<MajorCity>]? = nil,
    fetchAllMealTypes: [Mock<MealType>]? = nil,
    fetchFavoriteRestaurantsFor: [Mock<FavoritedRestaurant>]? = nil,
    getUser: Mock<User>? = nil,
    getUserEmailFromPhoneNumber: String? = nil,
    getUserEmailFromUsername: String? = nil,
    getUserTasteProfile: Mock<TasteProfile>? = nil,
    searchForRestaurants: Mock<PersonalizedRestaurantSearchResult>? = nil
  ) {
    self.init()
    self.doesEmailExist = doesEmailExist
    self.doesPhoneNumberExist = doesPhoneNumberExist
    self.doesUserHaveATasteProfile = doesUserHaveATasteProfile
    self.doesUsernameExist = doesUsernameExist
    self.fetchAllCuisines = fetchAllCuisines
    self.fetchAllFoodRestrictions = fetchAllFoodRestrictions
    self.fetchAllMajorCities = fetchAllMajorCities
    self.fetchAllMealTypes = fetchAllMealTypes
    self.fetchFavoriteRestaurantsFor = fetchFavoriteRestaurantsFor
    self.getUser = getUser
    self.getUserEmailFromPhoneNumber = getUserEmailFromPhoneNumber
    self.getUserEmailFromUsername = getUserEmailFromUsername
    self.getUserTasteProfile = getUserTasteProfile
    self.searchForRestaurants = searchForRestaurants
  }
}
