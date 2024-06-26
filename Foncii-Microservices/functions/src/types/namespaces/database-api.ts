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
    FMIntegrationCredentials = "FM Integration Credentials",
    // Shared
    UserSessions = "User Sessions",
    ReservationIntegrations = "Reservation Integrations",
    ArticlePublications = "Article Publications", 
    UserReferrals = "User Referrals",
    Restaurants = "Restaurants",
    TasteProfiles = "Taste Profiles",
    CachedReviewSentimentAnalysisComputations = "CRSA Computations",
    CachedArticleSentimentAnalysisComputations = "CASA Computations",
    // Foncii Biz [To Update]
    FonciiUsers = "Users",

    /// Events
    UserEvents = "User Events",
    RestaurantEvents = "Restaurant Events",
    PostEvents = "Post Events",
    SearchEvents = "Search Events",
    GalleryEvents = "Gallery Events",
    ShareEvents = "Share Events",
    ReservationEvents = "Reservation Events",
    TasteProfileEvents = "Taste Profile Events",

    // Reservations
    Reservations = "Reservations",
}

export enum FonciiDatabases {
    Fediverse = "FonciiFediverseDB",
    TestDB = "Foncii-Test-DB"
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

/** Operators for constructing query clauses */
export enum FirestoreQueryOperators {
    equals = "==",
    doesNotEqual = "!=",
    greaterThanOrEqualTo = ">=",
    lessThanOrEqualTo = "<=",
    greaterThan = ">",
    lessThan = "<",
    /** Filters base on multiple items using OR operator */
    arrayContainsAny = "array-contains-any",
    /** Filters based on single item */
    arrayContains = "array-contains",
    in = "in"
}

export enum AggregationSortOrders {
    ascending = 1,
    descending = -1
}