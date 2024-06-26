// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  ### Queries / Mutations / Inputs ###
  # These type defs are reusable for all Foncii users, Foncii Maps and or Foncii Biz

  ## Queries ##
  type Query {
    # Analytics Dashboards
    """
    Returns a combination of analytics metrics specific to the user's map. Note: If the timespan
    selected is older than the user's account then null is returned as the request is invalid and won't
    return valid data.
    """
    fetchUserMapAnalyticsDashboard(
      input: UserAnalyticsDashboardInput!
    ): UserMapAnalyticsDashboard
    fetchUserBusinessWebsiteAnalyticsDashboard(
      input: UserAnalyticsDashboardInput!
    ): UserBusinessWebsiteAnalyticsDashboard
    fetchUserReservationsIntentsAnalyticsDashboard(
      input: UserAnalyticsDashboardInput!
    ): UserReservationIntentsAnalyticsDashboard
  }

  ## Mutations ##
  type Mutation {
    trackFonciiEvent(input: FonciiAnalyticsEventInput!): Boolean!
    trackFonciiBizEvent(input: FonciiBizAnalyticsEventInput!): Boolean!
  }

  ## Inputs ##
  input FonciiAnalyticsEventInput {
    """
    User ID of the user who performed the event (if done by a registered user)
    """
    userID: ID
    """
    Valid BSON UTC datetime value, UTC date time,
    the time when this event was recorded. Not used for now.
    Will be used when event driven architecture is implemented and events
    are ingested at a delayed rate.
    """
    timestamp: String!
    """
    The event that was performed.
    """
    event: FonciiEvents!
    """
    The payload of the event.
    """
    payload: FonciiAnalyticsEventPayloads!
  }

  input FonciiBizAnalyticsEventInput {
    """
    User ID of the user who performed the event (if done by a registered user)
    """
    userID: ID
    """
    Valid BSON UTC datetime value, UTC date time,
    the time when this event was recorded. Not used for now.
    Will be used when event driven architecture is implemented and events
    are ingested at a delayed rate.
    """
    timestamp: String!
    """
    The event that was performed.
    """
    event: FonciiBizEvents!
    """
    The payload of the event.
    """
    payload: FonciiBizAnalyticsEventPayloads!
  }

  """
  A collection of the different possible inputs to pass as payloads for
  the associated event types.
  """
  input FonciiAnalyticsEventPayloads {
    exploreSearchEventPayload: ExploreSearchEventPayload
    userGallerySearchEventPayload: UserGallerySearchEventPayload
    reservationSearchEventPayload: ReservationSearchEventPayload
    reservationIntentEventPayload: ReservationIntentEventPayload
    userGalleryViewEventPayload: UserGalleryViewEventPayload
    postViewEventPayload: PostViewEventPayload
    restaurantViewEventPayload: RestaurantViewEventPayload
    postClickEventPayload: PostClickEventPayload
    restaurantClickEventPayload: RestaurantClickEventPayload
    mapPinClickEventPayload: MapPinClickEventPayload
    postSourceLinkClickEventPayload: PostSourceLinkClickEventPayload
    articlePublicationClickEventPayload: ArticlePublicationClickEventPayload
    businessWebsiteClickEventPayload: BusinessWebsiteClickEventPayload
    shareEventPayload: ShareEventPayload
  }

  input FonciiBizAnalyticsEventPayloads {
    placeholder: String = Null
  }

  input ExploreSearchEventPayload {
    queryID: String
    query: String!
    searchLocation: CoordinatePointInput!
    zoomLevel: Float!
    clientLocation: CoordinatePointInput
    tags: [String!]!
    cuisines: [String!]!
    prices: [Int!]!
    isManualSearch: Boolean!
    partySize: Int!
    reservationDate: String!
    sourceURL: String!
    candidateIDs: [String!]!
    autoCompleteSuggestions: [String!]!
    averagePercentMatchScore: Float
    averageQualityScore: Float!
  }

  input UserGallerySearchEventPayload {
    authorUID: String!
    query: String!
    searchLocation: CoordinatePointInput!
    zoomLevel: Float!
    clientLocation: CoordinatePointInput
    tags: [String!]!
    cuisines: [String!]!
    prices: [Int!]!
    partySize: Int!
    reservationDate: String!
    sourceURL: String!
    candidateIDs: [String!]!
    autoCompleteSuggestions: [String!]!
    averagePercentMatchScore: Float
    averageQualityScore: Float!
  }

  input ReservationSearchEventPayload {
    fonciiRestaurantID: String!
    authorID: String
    clientLocation: CoordinatePointInput
    partySize: Int!
    reservationDate: String!
    sourceURL: String!
  }

  input ReservationIntentEventPayload {
    outcome: ReservationIntentOutcome!
    venueID: String!
    """
    The user post the reservation is intending to be made from + author UID, can be used to measure influencer conversion rates relative
    to successful reservations.
    """
    authorUID: String
    postID: String
    fonciiRestaurantID: String!
    percentMatchScore: Float
    qualityScore: Float!
    timeSlot: String!
    reservationDate: String!
    provider: ReservationProviders!
    externalURL: String!
  }

  input UserGalleryViewEventPayload {
    authorUID: ID!
    userSimilarityScore: Float
    sharedEventID: ID
    referrer: String
  }

  input PostViewEventPayload {
    postID: ID!
    authorUID: ID!
    fonciiRestaurantID: ID!
    percentMatchScore: Float
    qualityScore: Float!
    sharedEventID: ID
    referrer: String
  }

  input RestaurantViewEventPayload {
    fonciiRestaurantID: ID!
    percentMatchScore: Float
    qualityScore: Float!
    sharedEventID: ID
    referrer: String
  }

  input PostClickEventPayload {
    postID: ID!
    authorUID: ID!
    fonciiRestaurantID: ID!
    percentMatchScore: Float
    qualityScore: Float!
    sourcePostID: ID
    sourceFonciiRestaurantID: ID
    sourceURL: String
    autoCompleteQuery: String
  }

  input RestaurantClickEventPayload {
    fonciiRestaurantID: ID!
    percentMatchScore: Float
    qualityScore: Float!
    sourcePostID: ID
    sourceFonciiRestaurantID: ID
    sourceURL: String
    autoCompleteQuery: String
    queryID: ID
  }

  input MapPinClickEventPayload {
    fonciiRestaurantID: ID!
    postID: ID
    authorUID: ID
    percentMatchScore: Float
    qualityScore: Float!
    sourceURL: String!
  }

  input PostSourceLinkClickEventPayload {
    fonciiRestaurantID: ID!
    postID: ID!
    authorUID: ID!
    percentMatchScore: Float
    qualityScore: Float!
    sourceURL: String!
    destinationURL: String!
    destinationPlatform: FMIntegrationProviders!
  }

  input ArticlePublicationClickEventPayload {
    fonciiRestaurantID: ID!
    postID: ID
    authorUID: ID
    percentMatchScore: Float
    qualityScore: Float!
    sourceURL: String!
    destinationURL: String!
    publication: String!
  }

  input BusinessWebsiteClickEventPayload {
    fonciiRestaurantID: ID!
    postID: ID
    authorUID: ID
    percentMatchScore: Float
    qualityScore: Float!
    sourceURL: String!
    destinationURL: String!
  }

  input ShareEventPayload {
    """
    Generated UID used to track the shared URL generated by the client
    """
    shareEventID: String!
    shareEventType: ShareEventType!
    destination: ShareSheetDestination!
    sourceURL: String!
  }

  input UserAnalyticsDashboardInput {
    userID: ID!
    timespan: AnalyticsTimespan!
  }
`;

export default typeDef;
