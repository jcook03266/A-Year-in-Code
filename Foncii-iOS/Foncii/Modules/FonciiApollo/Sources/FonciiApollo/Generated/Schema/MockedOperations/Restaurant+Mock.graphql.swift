// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class Restaurant: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.Restaurant
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<Restaurant>>

  public struct MockFields {
    @Field<CoordinatePoint>("_geoloc") public var _geoloc
    @Field<AddressProperties>("addressProperties") public var addressProperties
    @Field<[String]>("categories") public var categories
    @Field<String>("description") public var description
    @Field<GoogleRestaurantProperties>("googleProperties") public var googleProperties
    @Field<String>("heroImageURL") public var heroImageURL
    @Field<FonciiSchema.ID>("id") public var id
    @Field<[String]>("imageCollectionURLs") public var imageCollectionURLs
    @Field<String>("name") public var name
    @Field<OperatingHours>("operatingHours") public var operatingHours
    @Field<String>("phoneNumber") public var phoneNumber
    @Field<String>("priceLevel") public var priceLevel
    @Field<Bool>("servesAlcohol") public var servesAlcohol
    @Field<String>("website") public var website
    @Field<YelpRestaurantProperties>("yelpProperties") public var yelpProperties
  }
}

public extension Mock where O == Restaurant {
  convenience init(
    _geoloc: Mock<CoordinatePoint>? = nil,
    addressProperties: Mock<AddressProperties>? = nil,
    categories: [String]? = nil,
    description: String? = nil,
    googleProperties: Mock<GoogleRestaurantProperties>? = nil,
    heroImageURL: String? = nil,
    id: FonciiSchema.ID? = nil,
    imageCollectionURLs: [String]? = nil,
    name: String? = nil,
    operatingHours: Mock<OperatingHours>? = nil,
    phoneNumber: String? = nil,
    priceLevel: String? = nil,
    servesAlcohol: Bool? = nil,
    website: String? = nil,
    yelpProperties: Mock<YelpRestaurantProperties>? = nil
  ) {
    self.init()
    self._geoloc = _geoloc
    self.addressProperties = addressProperties
    self.categories = categories
    self.description = description
    self.googleProperties = googleProperties
    self.heroImageURL = heroImageURL
    self.id = id
    self.imageCollectionURLs = imageCollectionURLs
    self.name = name
    self.operatingHours = operatingHours
    self.phoneNumber = phoneNumber
    self.priceLevel = priceLevel
    self.servesAlcohol = servesAlcohol
    self.website = website
    self.yelpProperties = yelpProperties
  }
}
