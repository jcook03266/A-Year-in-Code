/**
 * Type definitions specific to our database implementation
 * and other database-related code.
 */
/** Various supported NoSQL collections in our database */
export enum FonciiDBCollections {
  // Foncii Fediverse / Test-DB
  // Foncii
  FMUsers = "Foncii Maps Users",
  FMPosts = "Foncii Maps Posts",
  SavedRestaurants = "Saved Restaurants",
  FMIntegrationCredentials = "FM Integration Credentials",
  // Shared
  UserSessions = "User Sessions",
  ReservationIntegrations = "Reservation Integrations",
  ArticlePublications = "Article Publications",
  RestaurantAwards = "Restaurant Awards",
  UserReferrals = "User Referrals",
  Restaurants = "Restaurants",
  TasteProfiles = "Taste Profiles",
  CachedReviewSentimentAnalysisComputations = "CRSA Computations",
  CachedArticleSentimentAnalysisComputations = "CASA Computations",

  // Auth
  AuthRefreshTokens = "Auth Refresh Tokens",

  // Foncii Biz [To Update]
  FonciiUsers = "Users",

  /// Events
  TrackedEvents = "Tracked Events",

  // Reservations
  Reservations = "Reservations",
}

export enum FonciiDatabases {
  Fediverse = "FonciiFediverseDB",
  TestDB = "Foncii-Test-DB",
}

/**
 * Built Indexes for full text search
 * See all indexes here: https://cloud.mongodb.com/v2/6500cad1a2317e0f32b576a6#/clusters/atlasSearch/Foncii-D-Cluster?showIndexCreatedModal=true
 */
export enum FullTextSearchIndexes {
  FMUsers = "Foncii-Maps-Users",
  FMPosts = "Foncii-Maps-User-Posts",
  Restaurants = "Foncii-Restaurants",
}

export enum SortOrders {
  ASCENDING = "ASCENDING",
  DESCENDING = "DESCENDING",
}

export enum AggregationSortOrders {
  ascending = 1,
  descending = -1,
}
