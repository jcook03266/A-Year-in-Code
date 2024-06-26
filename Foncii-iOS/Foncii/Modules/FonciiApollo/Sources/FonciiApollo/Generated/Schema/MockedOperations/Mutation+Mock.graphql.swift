// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class Mutation: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.Mutation
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<Mutation>>

  public struct MockFields {
    @Field<FavoritedRestaurantResponse>("addFavoriteRestaurant") public var addFavoriteRestaurant
    @Field<GenericMutationResponse>("addFirstFavoriteRestaurants") public var addFirstFavoriteRestaurants
    @Field<RestaurantAggregationResponse>("aggregateRestaurantsAround") public var aggregateRestaurantsAround
    @Field<CreateUserResponse>("createUser") public var createUser
    @Field<GenericMutationResponse>("deleteUser") public var deleteUser
    @Field<SetTasteProfileResponse>("inferUserTasteProfileUsingFirstFavorites") public var inferUserTasteProfileUsingFirstFavorites
    @Field<GenericMutationResponse>("loginUser") public var loginUser
    @Field<FavoritedRestaurantResponse>("removeFavoriteRestaurant") public var removeFavoriteRestaurant
    @Field<GenericMutationResponse>("requestPasswordResetEmail") public var requestPasswordResetEmail
    @Field<GenericMutationResponse>("requestUsernameReminderEmail") public var requestUsernameReminderEmail
    @Field<GenericMutationResponse>("setLastActive") public var setLastActive
    @Field<SetTasteProfileResponse>("setUserTasteProfile") public var setUserTasteProfile
    @Field<GenericMutationResponse>("signOutUser") public var signOutUser
    @Field<GenericMutationResponse>("trackRestaurantPersonalizationEvent") public var trackRestaurantPersonalizationEvent
    @Field<GenericMutationResponse>("trackUserEvent") public var trackUserEvent
    @Field<UserNotificationPreferenceUpdateResponse>("updateUserNotificationPreference") public var updateUserNotificationPreference
    @Field<GenericMutationResponse>("updateUserPhoneNumberVerificationStatus") public var updateUserPhoneNumberVerificationStatus
  }
}

public extension Mock where O == Mutation {
  convenience init(
    addFavoriteRestaurant: Mock<FavoritedRestaurantResponse>? = nil,
    addFirstFavoriteRestaurants: Mock<GenericMutationResponse>? = nil,
    aggregateRestaurantsAround: Mock<RestaurantAggregationResponse>? = nil,
    createUser: Mock<CreateUserResponse>? = nil,
    deleteUser: Mock<GenericMutationResponse>? = nil,
    inferUserTasteProfileUsingFirstFavorites: Mock<SetTasteProfileResponse>? = nil,
    loginUser: Mock<GenericMutationResponse>? = nil,
    removeFavoriteRestaurant: Mock<FavoritedRestaurantResponse>? = nil,
    requestPasswordResetEmail: Mock<GenericMutationResponse>? = nil,
    requestUsernameReminderEmail: Mock<GenericMutationResponse>? = nil,
    setLastActive: Mock<GenericMutationResponse>? = nil,
    setUserTasteProfile: Mock<SetTasteProfileResponse>? = nil,
    signOutUser: Mock<GenericMutationResponse>? = nil,
    trackRestaurantPersonalizationEvent: Mock<GenericMutationResponse>? = nil,
    trackUserEvent: Mock<GenericMutationResponse>? = nil,
    updateUserNotificationPreference: Mock<UserNotificationPreferenceUpdateResponse>? = nil,
    updateUserPhoneNumberVerificationStatus: Mock<GenericMutationResponse>? = nil
  ) {
    self.init()
    self.addFavoriteRestaurant = addFavoriteRestaurant
    self.addFirstFavoriteRestaurants = addFirstFavoriteRestaurants
    self.aggregateRestaurantsAround = aggregateRestaurantsAround
    self.createUser = createUser
    self.deleteUser = deleteUser
    self.inferUserTasteProfileUsingFirstFavorites = inferUserTasteProfileUsingFirstFavorites
    self.loginUser = loginUser
    self.removeFavoriteRestaurant = removeFavoriteRestaurant
    self.requestPasswordResetEmail = requestPasswordResetEmail
    self.requestUsernameReminderEmail = requestUsernameReminderEmail
    self.setLastActive = setLastActive
    self.setUserTasteProfile = setUserTasteProfile
    self.signOutUser = signOutUser
    self.trackRestaurantPersonalizationEvent = trackRestaurantPersonalizationEvent
    self.trackUserEvent = trackUserEvent
    self.updateUserNotificationPreference = updateUserNotificationPreference
    self.updateUserPhoneNumberVerificationStatus = updateUserPhoneNumberVerificationStatus
  }
}
