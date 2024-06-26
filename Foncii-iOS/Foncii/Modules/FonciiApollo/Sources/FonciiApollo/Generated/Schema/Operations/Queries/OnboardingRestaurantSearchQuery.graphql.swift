// @generated
// This file was automatically generated and should not be edited.

@_exported import ApolloAPI

public extension FonciiSchema {
  class OnboardingRestaurantSearchQuery: GraphQLQuery {
    public static let operationName: String = "OnboardingRestaurantSearch"
    public static let document: ApolloAPI.DocumentType = .automaticallyPersisted(
      operationIdentifier: "12e23e1b8f032d8af031005b1965de0b6604ad86b88b8adcbb0feadfbee65a44",
      definition: .init(
        #"""
        query OnboardingRestaurantSearch($input: SearchForRestaurantsInput) {
          searchForRestaurants(input: $input) {
            __typename
            queryID
            restaurants {
              __typename
              restaurant {
                __typename
                id
                name
                heroImageURL
                categories
              }
            }
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
          .field("queryID", String.self),
          .field("restaurants", [Restaurant]?.self),
        ] }

        public var queryID: String { __data["queryID"] }
        public var restaurants: [Restaurant]? { __data["restaurants"] }

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
          ] }

          public var restaurant: Restaurant { __data["restaurant"] }

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
              .field("categories", [String]?.self),
            ] }

            public var id: FonciiSchema.ID { __data["id"] }
            public var name: String { __data["name"] }
            public var heroImageURL: String? { __data["heroImageURL"] }
            public var categories: [String]? { __data["categories"] }
          }
        }
      }
    }
  }

}