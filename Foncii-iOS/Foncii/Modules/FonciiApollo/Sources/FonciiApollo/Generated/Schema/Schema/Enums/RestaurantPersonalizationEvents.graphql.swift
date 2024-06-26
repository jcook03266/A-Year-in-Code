// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public extension FonciiSchema {
  enum RestaurantPersonalizationEvents: String, EnumType {
    case userClickedOnRestaurant = "USER_CLICKED_ON_RESTAURANT"
    case userClickedOnRestaurantAfterSearch = "USER_CLICKED_ON_RESTAURANT_AFTER_SEARCH"
    case userViewedRestaurantDetailView = "USER_VIEWED_RESTAURANT_DETAIL_VIEW"
    case userFavoritedRestaurant = "USER_FAVORITED_RESTAURANT"
    case userFavoritedRestaurantAfterSearch = "USER_FAVORITED_RESTAURANT_AFTER_SEARCH"
    case userFavoritedRestaurantAfterFiltering = "USER_FAVORITED_RESTAURANT_AFTER_FILTERING"
    case userReservedRestaurant = "USER_RESERVED_RESTAURANT"
    case userReservedRestaurantAfterSearch = "USER_RESERVED_RESTAURANT_AFTER_SEARCH"
    case userReservedRestaurantAfterFiltering = "USER_RESERVED_RESTAURANT_AFTER_FILTERING"
    case userClickedFilters = "USER_CLICKED_FILTERS"
    case userViewedFilters = "USER_VIEWED_FILTERS"
    case userRecommendedRestaurant = "USER_RECOMMENDED_RESTAURANT"
    case userRecommendedRestaurantAfterRequest = "USER_RECOMMENDED_RESTAURANT_AFTER_REQUEST"
    case userAcceptedRestaurantRecommendation = "USER_ACCEPTED_RESTAURANT_RECOMMENDATION"
  }

}