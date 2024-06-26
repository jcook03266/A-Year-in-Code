// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class MainRestaurantSearchQuery: GraphQLQuery {
    public static let operationName: String = "MainRestaurantSearch"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "db3c78ab06faded373d3219707a95af2d812f2d7c7f16b03f7351ed293f6bde1",
      definition: .init(
        #"""
        query MainRestaurantSearch($input: SearchForRestaurantsInput) {
          searchForRestaurants(input: $input) {
            __typename
            restaurants {
              __typename
              restaurant {
                __typename
                id
                name
                heroImageURL
                imageCollectionURLs
                description
                priceLevel
                phoneNumber
                operatingHours {
                  __typename
                  Monday
                  Tuesday
                  Wednesday
                  Thursday
                  Friday
                  Saturday
                  Sunday
                }
                servesAlcohol
                website
                _geoloc {
                  __typename
                  lat
                  lng
                }
                googleProperties {
                  __typename
                  rating
                }
                yelpProperties {
                  __typename
                  rating
                }
                categories
                addressProperties {
                  __typename
                  formattedAddress
                  streetAddress
                  zipCode
                  city
                  stateCode
                  countryCode
                }
              }
              percentMatch
              isFavorited
            }
            queryID
          }
        }
        """#
      ))

    public var input: GraphQLNullable<SearchForRestaurantsInput>

    public init(input: GraphQLNullable<SearchForRestaurantsInput>) {
      self.input = input
    }

    public var __variables: Variables? { ["input": input] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Query }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("searchForRestaurants", SearchForRestaurants?.self, arguments: ["input": .variable("input")]),
      ] }

      public var searchForRestaurants: SearchForRestaurants? { __data["searchForRestaurants"] }

      /// SearchForRestaurants
      ///
      /// Parent Type: `PersonalizedRestaurantSearchResult`
      public struct SearchForRestaurants: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.PersonalizedRestaurantSearchResult }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("restaurants", [Restaurant]?.self),
          .field("queryID", String.self),
        ] }

        public var restaurants: [Restaurant]? { __data["restaurants"] }
        public var queryID: String { __data["queryID"] }

        /// SearchForRestaurants.Restaurant
        ///
        /// Parent Type: `PersonalizedRestaurant`
        public struct Restaurant: FonciiSchema.SelectionSet {
          public let __data: DataDict
          public init(_dataDict: DataDict) { __data = _dataDict }

          public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.PersonalizedRestaurant }
          public static var __selections: [ApolloAPI.Selection] { [
            .field("__typename", String.self),
            .field("restaurant", Restaurant.self),
            .field("percentMatch", Double?.self),
            .field("isFavorited", Bool?.self),
          ] }

          public var restaurant: Restaurant { __data["restaurant"] }
          public var percentMatch: Double? { __data["percentMatch"] }
          public var isFavorited: Bool? { __data["isFavorited"] }

          /// SearchForRestaurants.Restaurant.Restaurant
          ///
          /// Parent Type: `Restaurant`
          public struct Restaurant: FonciiSchema.SelectionSet {
            public let __data: DataDict
            public init(_dataDict: DataDict) { __data = _dataDict }

            public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Restaurant }
            public static var __selections: [ApolloAPI.Selection] { [
              .field("__typename", String.self),
              .field("id", FonciiSchema.ID.self),
              .field("name", String.self),
              .field("heroImageURL", String?.self),
              .field("imageCollectionURLs", [String]?.self),
              .field("description", String?.self),
              .field("priceLevel", String?.self),
              .field("phoneNumber", String?.self),
              .field("operatingHours", OperatingHours?.self),
              .field("servesAlcohol", Bool.self),
              .field("website", String?.self),
              .field("_geoloc", _Geoloc.self),
              .field("googleProperties", GoogleProperties?.self),
              .field("yelpProperties", YelpProperties?.self),
              .field("categories", [String]?.self),
              .field("addressProperties", AddressProperties.self),
            ] }

            public var id: FonciiSchema.ID { __data["id"] }
            public var name: String { __data["name"] }
            public var heroImageURL: String? { __data["heroImageURL"] }
            public var imageCollectionURLs: [String]? { __data["imageCollectionURLs"] }
            public var description: String? { __data["description"] }
            public var priceLevel: String? { __data["priceLevel"] }
            public var phoneNumber: String? { __data["phoneNumber"] }
            public var operatingHours: OperatingHours? { __data["operatingHours"] }
            public var servesAlcohol: Bool { __data["servesAlcohol"] }
            public var website: String? { __data["website"] }
            public var _geoloc: _Geoloc { __data["_geoloc"] }
            public var googleProperties: GoogleProperties? { __data["googleProperties"] }
            public var yelpProperties: YelpProperties? { __data["yelpProperties"] }
            public var categories: [String]? { __data["categories"] }
            public var addressProperties: AddressProperties { __data["addressProperties"] }

            /// SearchForRestaurants.Restaurant.Restaurant.OperatingHours
            ///
            /// Parent Type: `OperatingHours`
            public struct OperatingHours: FonciiSchema.SelectionSet {
              public let __data: DataDict
              public init(_dataDict: DataDict) { __data = _dataDict }

              public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.OperatingHours }
              public static var __selections: [ApolloAPI.Selection] { [
                .field("__typename", String.self),
                .field("Monday", String?.self),
                .field("Tuesday", String?.self),
                .field("Wednesday", String?.self),
                .field("Thursday", String?.self),
                .field("Friday", String?.self),
                .field("Saturday", String?.self),
                .field("Sunday", String?.self),
              ] }

              public var monday: String? { __data["Monday"] }
              public var tuesday: String? { __data["Tuesday"] }
              public var wednesday: String? { __data["Wednesday"] }
              public var thursday: String? { __data["Thursday"] }
              public var friday: String? { __data["Friday"] }
              public var saturday: String? { __data["Saturday"] }
              public var sunday: String? { __data["Sunday"] }
            }

            /// SearchForRestaurants.Restaurant.Restaurant._Geoloc
            ///
            /// Parent Type: `CoordinatePoint`
            public struct _Geoloc: FonciiSchema.SelectionSet {
              public let __data: DataDict
              public init(_dataDict: DataDict) { __data = _dataDict }

              public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.CoordinatePoint }
              public static var __selections: [ApolloAPI.Selection] { [
                .field("__typename", String.self),
                .field("lat", Double.self),
                .field("lng", Double.self),
              ] }

              public var lat: Double { __data["lat"] }
              public var lng: Double { __data["lng"] }
            }

            /// SearchForRestaurants.Restaurant.Restaurant.GoogleProperties
            ///
            /// Parent Type: `GoogleRestaurantProperties`
            public struct GoogleProperties: FonciiSchema.SelectionSet {
              public let __data: DataDict
              public init(_dataDict: DataDict) { __data = _dataDict }

              public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.GoogleRestaurantProperties }
              public static var __selections: [ApolloAPI.Selection] { [
                .field("__typename", String.self),
                .field("rating", Double?.self),
              ] }

              public var rating: Double? { __data["rating"] }
            }

            /// SearchForRestaurants.Restaurant.Restaurant.YelpProperties
            ///
            /// Parent Type: `YelpRestaurantProperties`
            public struct YelpProperties: FonciiSchema.SelectionSet {
              public let __data: DataDict
              public init(_dataDict: DataDict) { __data = _dataDict }

              public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.YelpRestaurantProperties }
              public static var __selections: [ApolloAPI.Selection] { [
                .field("__typename", String.self),
                .field("rating", Double?.self),
              ] }

              public var rating: Double? { __data["rating"] }
            }

            /// SearchForRestaurants.Restaurant.Restaurant.AddressProperties
            ///
            /// Parent Type: `AddressProperties`
            public struct AddressProperties: FonciiSchema.SelectionSet {
              public let __data: DataDict
              public init(_dataDict: DataDict) { __data = _dataDict }

              public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.AddressProperties }
              public static var __selections: [ApolloAPI.Selection] { [
                .field("__typename", String.self),
                .field("formattedAddress", String?.self),
                .field("streetAddress", String?.self),
                .field("zipCode", String?.self),
                .field("city", String?.self),
                .field("stateCode", String?.self),
                .field("countryCode", String?.self),
              ] }

              public var formattedAddress: String? { __data["formattedAddress"] }
              public var streetAddress: String? { __data["streetAddress"] }
              public var zipCode: String? { __data["zipCode"] }
              public var city: String? { __data["city"] }
              public var stateCode: String? { __data["stateCode"] }
              public var countryCode: String? { __data["countryCode"] }
            }
          }
        }
      }
    }
  }

}