// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  struct SearchForRestaurantsInput: InputObject {
    public private(set) var __data: InputDict

    public init(_ data: InputDict) {
      __data = data
    }

    public init(
      query: GraphQLNullable<String> = nil,
      optionalCityToFilterBy: GraphQLNullable<String> = nil,
      searchFilterInput: GraphQLNullable<SearchFilterInput> = nil,
      paginationInput: GraphQLNullable<SearchPaginationInput> = nil,
      geoLocationSearchInput: GraphQLNullable<GeoLocationSearchInput> = nil,
      personalize: Bool?
    ) {
      __data = InputDict([
        "query": query,
        "optionalCityToFilterBy": optionalCityToFilterBy,
        "searchFilterInput": searchFilterInput,
        "paginationInput": paginationInput,
        "geoLocationSearchInput": geoLocationSearchInput,
        "personalize": personalize
      ])
    }

    public var query: GraphQLNullable<String> {
      get { __data["query"] }
      set { __data["query"] = newValue }
    }

    public var optionalCityToFilterBy: GraphQLNullable<String> {
      get { __data["optionalCityToFilterBy"] }
      set { __data["optionalCityToFilterBy"] = newValue }
    }

    public var searchFilterInput: GraphQLNullable<SearchFilterInput> {
      get { __data["searchFilterInput"] }
      set { __data["searchFilterInput"] = newValue }
    }

    public var paginationInput: GraphQLNullable<SearchPaginationInput> {
      get { __data["paginationInput"] }
      set { __data["paginationInput"] = newValue }
    }

    public var geoLocationSearchInput: GraphQLNullable<GeoLocationSearchInput> {
      get { __data["geoLocationSearchInput"] }
      set { __data["geoLocationSearchInput"] = newValue }
    }

    public var personalize: Bool? {
      get { __data["personalize"] }
      set { __data["personalize"] = newValue }
    }
  }

}