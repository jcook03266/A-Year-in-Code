// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  ### Queries / Mutations / Inputs ###

  ## Queries ##
  type Query {
    # Statistics #
    """
    Lists the integer amount representing the total amount of restaurants stored by our database
    """
    getTotalRestaurantCount: Int!

    # Percentage Match #
    """
    Compute and return the percentage match for the given user and restaurant
    """
    getPercentageMatch(userID: ID!, restaurantID: ID!): Float

    """
    Compute and return the average percentage match for the users listed and the restaurant in question
    Used for DWF, map feature via sorting the fetch restaurants by a map of averaged percentage matches for the current group of friends
    """
    getAverageGroupPercentageMatch(userIDs: [ID!]!, restaurantID: ID!): Float

    """
    Finds and returns the Foncii restaurant data associated with the given ID, and its various computed properties
    """
    getFonciiRestaurantByID(
      id: ID!
      userPersonalizationInput: UserPersonalizationInput
    ): FonciiRestaurant

    ## Semantic search + Geospatial Search ##
    """
    Advanced search using semantic or geospatial search to find restaurants within the given search area that also match
    the text search query and any additional properties to filter the results by. Returns denormalized foncii restaurants with
    creator, post, and restaurant data attached from the appropriate database aggregation pipelines.
    """
    fonciiRestaurantSearch(
      input: FonciiRestaurantSearchInput!
    ): FonciiRestaurantSearchOutput!

    """
    Used to refresh reservation availabilities for a given restaurant when the user is in the detail view of a restaurant / post.
    This is used to ensure that the reservation availability data is up-to-date and accurate when the user is viewing the time table.
    """
    findReservationAvailabilitiesFor(
      fonciiRestaurantID: ID!
      reservationSearchInput: ReservationSearchInput!
    ): [ReservationAvailability!]!

    """
    Used to find the days that are available for reservation used in the calendar rendering and next available table day
    """
    findAvailableReservationDaysFor(
      fonciiRestaurantID: ID!
      availableReservationDaysInput: AvailableReservationDaysInput!
    ): AvailableReservationDays

    """
    A standalone operation for querying article publications outside of Foncii Restaurant based resolvers.
    """
    findAssociatedArticlesFor(
      restaurantID: String!
    ): ArticlePublicationStandaloneOutput!

    """
    A standalone operation for querying restuarant awards outside of Foncii Restaurant based resolvers.
    """
    findAssociatedRestaurantAwardsFor(
      restaurantID: String!
    ): RestaurantAwardStandaloneOutput!

    """
    Returns a list of posts that are directly associated with the given restaurant if the restaurant
    exists. A list of post IDs to exclude from the query is also allowed to avoid returning unwanted edges.
    """
    findAssociatedPostsFor(
      fonciiRestaurantID: ID!
      creatorID: ID
      postsToExclude: [ID!]
    ): [FMUserPost!]!

    """
    Provides a list of user post auto-complete suggestions for the target user's gallery. Note: No popular search terms
    are injectable for user galleries at this time, but this feature may be added in the future with a simple addition to
    the existing resolver code.
    """
    gallerySearchAutoCompleteSuggestions(
      input: GallerySearchAutoCompleteSuggestionsInput!
    ): [UserPostAutoCompleteSuggestion!]!

    """
    Queries our restaurant database to find the Foncii restaurant that best matches the given query (if possible), and returns the
    google Place ID associated with it. If no match can be found from our database then we use the Google Places autocomplete functionality
    to find it the best we can return the best result from that strategy (again, if possible). The Google Places is a fallback method
    in this situation since this is designed to lean on our own data for cost purposes. As an extra step for cost mitigation the google places
    fetch can be turned off entirely such that only our database is used to search and return the best possible candidate.

    Note: useGoogleFallback is set to 'True' by default if not given.
    """
    findGooglePlaceIDForPlaceSearchQuery(
      searchQuery: String!
      useGoogleFallback: Boolean
    ): PlaceSearchOutput

    """
    Queries our restaurant database and Google's place API for auto-complete suggestions for the given search query.
    This is used by users when selecting their favorite restaurants when first auto-generating their taste profile,
    and also when a user is associating a restaurant with their post. This is a much more efficient and secure
    approach to accessing the auto-complete suggestions endpoint as client side requests can be easily abused with
    no control on our end.
    """
    restaurantAutoCompleteSuggestions(
      input: RestaurantAutoCompleteSuggestionsInput!
    ): [RestaurantAutoCompleteSuggestion!]!

    """
    Provides a list of auto-complete suggestions for restaurants / users / popular search terms based on the given search query.
    The auto-complete suggestions in the list are injected from multiple sources (Foncii's own database as well as Google's places API),
    and these origins are also enumerated in the returned data to keep track of where the suggestion is coming from.
    This is used by users when selecting their favorite restaurants when first auto-generating their taste profile,
    specifically the search bar's autocomplete drop down menu where the user can select a restaurant directly and then
    trigger the full search for restaurants based on the selected auto-complete suggestion.
    """
    exploreSearchAutoCompleteSuggestions(
      input: ExploreSearchAutoCompleteSuggestionsInput!
    ): [ExploreSearchAutoCompleteSuggestion!]!

    """
    Finds and returns a list of restaurants that are similar to the given restaurant ID via ANN vector embedding search.
    """
    findRestaurantsSimilarTo(restaurantID: ID!): [FonciiRestaurant!]!

    """
    Returns a list of saved restaurants for the given user. Note: This is a list of restaurants that are saved by the user,
    not the posts that the user has saved. Any saved restaurants that were saved from a user post also have the ID of the post
    the save was made from.
    """
    getSavedRestaurantsFor(
      input: GetSavedRestaurantsForInput!
    ): [FonciiRestaurant!]!

    """
    Returns a list of all restaurants up to the specified limit.
    Provide pageIndex to skip a specific amount of pages when
    paginating. So +1 to go to the next page of results and so on.
    +1 with a limit of 10,000 would return the next 10,000. 20,000 in total
    but the first 10,000 was skipped due to the +1 page index
    """
    getAllRestaurants(limit: Int!, pageIndex: Int): [Restaurant!]!
  }

  ## Mutations ##
  type Mutation {
    """
    Locates restaurants around the given coordinate point, fetches data points from multiple external data providers
    transforms the retrieved data, aggregates all the candidates from within the search area and pushes them
    to our database where they're cached for ~ 3 months, and refreshed after that in order to ensure that up-to-date information is being displayed
    A maximum of 50 restaurants are aggregated by this operation and returned as output for any external usage of the immediate data
    Note: The limit is capped at 50 to reduce the time it takes to aggregate restaurant data to the database ~ 6 seconds vs ~ 12 seconds for 100 entries
    """
    aggregateRestaurantsAround(
      input: AggregateRestaurantsAroundInput
    ): [Restaurant!]!

    """
    Method used to aggregate a singular restaurant based on the given input. This can be triggered by users
    when they select a restaurant from a search bar's autocomplete drop down menu if the restaurant doesn't already exist in our
    database.
    """
    aggregateRestaurant(input: AggregateRestaurantInput): Restaurant

    """
    Used to ingest aggregated reservation detail information from the reservation scraper
    Matches reservation details to existing foncii restaurants and creates / updates reservation integrations
    based on the ingested data. If a match doesn't exist within the database already then a match is
    aggregated using our aggregation pipeline combined with Google place search.
    """
    ingestRestaurantReservationDetails(
      input: IngestRestaurantReservationDetailsInput
    ): Boolean!

    """
    Ingests article data from the publication scrapers and stores them in our database for fast access
    as these documents will be indexed as opposed to a federated approach with S3 which is much slower.
    """
    ingestArticlePublicationDetails(
      input: IngestArticlePublicationDetailsInput
    ): Boolean!

    """
    Ingests award data from the award scrapers (or CSV) and stores them in our database for fast access
    as these documents will be indexed as opposed to a federated approach with S3 which is much slower.
    """
    ingestRestaurantAwardDetails(
      input: IngestRestaurantAwardDetailsInput
    ): Boolean!

    """
    Saves the target restaurant to the user's collection of saved restaurants (if not already present). Also
    attributes the saved restaurant to a specific post if the restaurant was saved from a user post.
    """
    saveRestaurant(input: RestaurantSaveInput): Boolean!

    """
    Unsaves the target restaurant from the user's collection of saved restaurants (if present).
    """
    unsaveRestaurant(input: RestaurantSaveInput): Boolean!
  }

  ## Inputs ##
  input GetSavedRestaurantsForInput {
    userPersonalizationInput: UserPersonalizationInput!
    """
    The index of the current pagination page
    """
    paginationPageIndex: Int! = 0
    """
    The amount of saved restaurants to return, this will
    also be used client side to determine the pagination offset and
    next page index based on the amount of items returned.
    """
    resultsPerPage: Int!
  }

  input RestaurantSaveInput {
    userID: ID!
    fonciiRestaurantID: ID!
    """
    Optional post id included when a user saves or unsaves a restaurant from a user post
    """
    postID: ID
  }

  input RestaurantAutoCompleteSuggestionsInput {
    searchQuery: String! = ""
    injectExternalSuggestions: Boolean = false
  }

  input GallerySearchAutoCompleteSuggestionsInput {
    galleryAuthorID: String!
    searchQuery: String! = ""
  }

  input ExploreSearchAutoCompleteSuggestionsInput {
    searchQuery: String! = ""
    injectExternalSuggestions: Boolean = false
    """
    True if public user post suggestions should be included in the suggestions, false otherwise
    """
    includeUserPostSuggestions: Boolean = false
    """
    True if user suggestions should be included in the suggestions, false otherwise
    """
    includeUserSuggestions: Boolean = false
    """
    Relevant popular search terms based on analytics [Not used for now, need to setup amplitude pipeline + need more data too]
    """
    includePopularSearchTerms: Boolean = false
  }

  input FonciiRestaurantSearchInput {
    userPersonalizationInput: UserPersonalizationInput!

    searchQuery: String! = ""
    searchRadius: Float!
    coordinates: CoordinatePointInput!

    """
    Allows client side filters to be applied to the search process
    """
    fonciiRestaurantSearchFilterInput: FonciiRestaurantSearchFilterInput
  }

  input ReservationSearchInput {
    """
    Size of the party from [min] 1 - 20 [max]
    """
    partySize: Int!
    """
    ISO-8601 formatted date string in the format of YYYY-mm-dd ex.) 2023-12-02
    """
    targetDate: String!
  }

  input AvailableReservationDaysInput {
    """
    Size of the party from [min] 1 - 20 [max]
    """
    partySize: Int!
    """
    ISO-8601 formatted date string in the format of YYYY-mm-dd ex.) 2023-12-02
    """
    startDate: String!
    """
    ISO-8601 formatted date string in the format of YYYY-mm-dd ex.) 2023-12-02
    """
    endDate: String!
  }

  input FonciiPostFilterInput {
    """
    Groups posts by restaurant with latest post, as determined by creation date
    """
    latestByRestaurant: Boolean
  }

  input FonciiRestaurantSearchFilterInput {
    """
    Only return restaurants that are currently available for reservation
    """
    reservableOnly: Boolean! = false
  }

  """
  Input for dynamically aggregating and transforming restaurant data around a specified coordinate point from multiple data sources
  """
  input AggregateRestaurantsAroundInput {
    coordinates: CoordinatePointInput!
  }

  input AggregateRestaurantInput {
    googlePlaceID: String!
  }

  input IngestRestaurantReservationDetailsInput {
    provider: ReservationProviders
    restaurantReservationDetails: [RestaurantReservationDetailInput!]!
  }

  input IngestArticlePublicationDetailsInput {
    articlePublicationDetails: [ArticlePublicationDetailInput!]!
  }

  input IngestRestaurantAwardDetailsInput {
    restaurantAwardDetails: [RestaurantAwardDetailInput!]!
  }
`;

export default typeDef;
