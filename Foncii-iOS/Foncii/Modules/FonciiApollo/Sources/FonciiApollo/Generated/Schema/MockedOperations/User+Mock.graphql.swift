// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class User: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.User
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<User>>

  public struct MockFields {
    @Field<[FonciiSchema.ID]>("authProviders") public var authProviders
    @Field<String>("creationDate") public var creationDate
    @Field<String>("email") public var email
    @Field<[Restaurant]>("firstFavorites") public var firstFavorites
    @Field<String>("fullName") public var fullName
    @Field<FonciiSchema.ID>("id") public var id
    @Field<Bool>("isPhoneNumberVerified") public var isPhoneNumberVerified
    @Field<String>("lastUpdated") public var lastUpdated
    @Field<Bool>("notificationsEnabled") public var notificationsEnabled
    @Field<String>("phoneNumber") public var phoneNumber
    @Field<String>("profilePictureURL") public var profilePictureURL
    @Field<[ProfileTask]>("profileTasks") public var profileTasks
    @Field<String>("referralCode") public var referralCode
    @Field<String>("username") public var username
  }
}

public extension Mock where O == User {
  convenience init(
    authProviders: [FonciiSchema.ID]? = nil,
    creationDate: String? = nil,
    email: String? = nil,
    firstFavorites: [Mock<Restaurant>]? = nil,
    fullName: String? = nil,
    id: FonciiSchema.ID? = nil,
    isPhoneNumberVerified: Bool? = nil,
    lastUpdated: String? = nil,
    notificationsEnabled: Bool? = nil,
    phoneNumber: String? = nil,
    profilePictureURL: String? = nil,
    profileTasks: [Mock<ProfileTask>]? = nil,
    referralCode: String? = nil,
    username: String? = nil
  ) {
    self.init()
    self.authProviders = authProviders
    self.creationDate = creationDate
    self.email = email
    self.firstFavorites = firstFavorites
    self.fullName = fullName
    self.id = id
    self.isPhoneNumberVerified = isPhoneNumberVerified
    self.lastUpdated = lastUpdated
    self.notificationsEnabled = notificationsEnabled
    self.phoneNumber = phoneNumber
    self.profilePictureURL = profilePictureURL
    self.profileTasks = profileTasks
    self.referralCode = referralCode
    self.username = username
  }
}
