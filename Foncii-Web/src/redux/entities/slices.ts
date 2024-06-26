// A record of all Redux slice names to maintain a single source of truth
export enum SliceNames {
  FonciiUserSliceName = "Foncii User",
  NotificationCenterSliceName = "Notification Center",
  VisitedUserSliceName = "Visited User",
  PostFiltersSliceName = "Post Filters",
  UserPostsSliceName = "User Posts",
  FonciiRestaurantsSliceName = "Foncii Restaurants",
}

// Names of the reducers for each entity
export enum ReducerNames {
  FonciiUserReducerName = "fonciiUser",
  NotificationReducerName = "notificationCenter",
  VisitedUserReducerName = "visitedUser",
  PostFiltersReducerName = "postFilters",
  UserPostsReducerName = "userPosts",
  FonciiRestaurantsReducerName = "fonciiRestaurants",
  MapboxReducerName = "mapbox",
}
