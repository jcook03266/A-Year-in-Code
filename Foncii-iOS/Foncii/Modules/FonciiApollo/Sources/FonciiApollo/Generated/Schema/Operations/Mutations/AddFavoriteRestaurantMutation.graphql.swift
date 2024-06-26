// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class AddFavoriteRestaurantMutation: GraphQLMutation {
    public static let operationName: String = "AddFavoriteRestaurant"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "85614b7d8c91333e0ebaad515404ab20cda81360bf45b704b6f59987523b56f2",
      definition: .init(
        #"""
        mutation AddFavoriteRestaurant($input: FavoritedRestaurantInput!) {
          addFavoriteRestaurant(input: $input) {
            __typename
            statusCode
            errors {
              __typename
              errorCode
              description
            }
            updatedPersonalizedRestaurant {
              __typename
              restaurant {
                __typename
                id
                name
                heroImageURL
                imageCollectionURLs
                description
                categories
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
                addressProperties {
                  __typename
                  formattedAddress
                  streetAddress
                  zipCode
                  city
                  stateCode
                  countryCode
                }
                googleProperties {
                  __typename
                  rating
                }
                yelpProperties {
                  __typename
                  rating
                }
              }
              percentMatch
              isFavorited
            }
          }
        }
        """#
      ))

    public var input: FavoritedRestaurantInput

    public init(input: FavoritedRestaurantInput) {
      self.input = input
    }

    public var __variables: Variables? { ["input": input] }

    public struct Data: FonciiSchema.SelectionSet {
      public let __data: DataDict
      public init(_dataDict: DataDict) { __data = _dataDict }

      public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.Mutation }
      public static var __selections: [ApolloAPI.Selection] { [
        .field("addFavoriteRestaurant", AddFavoriteRestaurant.self, arguments: ["input": .variable("input")]),
      ] }

      public var addFavoriteRestaurant: AddFavoriteRestaurant { __data["addFavoriteRestaurant"] }

      /// AddFavoriteRestaurant
      ///
      /// Parent Type: `FavoritedRestaurantResponse`
      public struct AddFavoriteRestaurant: FonciiSchema.SelectionSet {
        public let __data: DataDict
        public init(_dataDict: DataDict) { __data = _dataDict }

        public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.FavoritedRestaurantResponse }
        public static var __selections: [ApolloAPI.Selection] { [
          .field("__typename", String.self),
          .field("statusCode", Int.self),
          .field("errors", [Error]?.self),
          .field("updatedPersonalizedRestaurant", UpdatedPersonalizedRestaurant.self),
        ] }

        public var statusCode: Int { __data["statusCode"] }
        public var errors: [Error]? { __data["errors"] }
        public var updatedPersonalizedRestaurant: UpdatedPersonalizedRestaurant { __data["updatedPersonalizedRestaurant"] }

        /// AddFavoriteRestaurant.Error
        ///
        /// Parent Type: `ClientError`
        public struct Error: FonciiSchema.SelectionSet {
          public let __data: DataDict
          public init(_dataDict: DataDict) { __data = _dataDict }

          public static var __parentType: ApolloAPI.ParentType { FonciiSchema.Objects.ClientError }
          public static var __selections: [ApolloAPI.Selection] { [
            .field("__typename", String.self),
            .field("errorCode", String.self),
            .field("description", String.self),
          ] }

          public var errorCode: String { __data["errorCode"] }
          public var description: String { __data["description"] }
        }

        /// AddFavoriteRestaurant.UpdatedPersonalizedRestaurant
        ///
        /// Parent Type: `PersonalizedRestaurant`
        public struct UpdatedPersonalizedRestaurant: FonciiSchema.SelectionSet {
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

          /// AddFavoriteRestaurant.UpdatedPersonalizedRestaurant.Restaurant
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
              .field("categories", [String]?.self),
              .field("priceLevel", String?.self),
              .field("phoneNumber", String?.self),
              .field("operatingHours", OperatingHours?.self),
              .field("servesAlcohol", Bool.self),
              .field("website", String?.self),
              .field("_geoloc", _Geoloc.self),
              .field("addressProperties", AddressProperties.self),
              .field("googleProperties", GoogleProperties?.self),
              .field("yelpProperties", YelpProperties?.self),
            ] }

            public var id: FonciiSchema.ID { __data["id"] }
            public var name: String { __data["name"] }
            public var heroImageURL: String? { __data["heroImageURL"] }
            public var imageCollectionURLs: [String]? { __data["imageCollectionURLs"] }
            public var description: String? { __data["description"] }
            public var categories: [String]? { __data["categories"] }
            public var priceLevel: String? { __data["priceLevel"] }
            public var phoneNumber: String? { __data["phoneNumber"] }
            public var operatingHours: OperatingHours? { __data["operatingHours"] }
            public var servesAlcohol: Bool { __data["servesAlcohol"] }
            public var website: String? { __data["website"] }
            public var _geoloc: _Geoloc { __data["_geoloc"] }
            public var addressProperties: AddressProperties { __data["addressProperties"] }
            public var googleProperties: GoogleProperties? { __data["googleProperties"] }
            public var yelpProperties: YelpProperties? { __data["yelpProperties"] }

            /// AddFavoriteRestaurant.UpdatedPersonalizedRestaurant.Restaurant.OperatingHours
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

            /// AddFavoriteRestaurant.UpdatedPersonalizedRestaurant.Restaurant._Geoloc
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

            /// AddFavoriteRestaurant.UpdatedPersonalizedRestaurant.Restaurant.AddressProperties
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

            /// AddFavoriteRestaurant.UpdatedPersonalizedRestaurant.Restaurant.GoogleProperties
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

            /// AddFavoriteRestaurant.UpdatedPersonalizedRestaurant.Restaurant.YelpProperties
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
          }
        }
      }
    }
  }

}