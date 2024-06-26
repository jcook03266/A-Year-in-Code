// Dependencies
// GraphQL Document Node 
import gql from 'graphql-tag';

const typeDef = gql` 
# Trending Restaurant Types #
""" 
Used when fetching trending restaurants
This restaurant type returns with a computed set of trending attributes
""" 
type TrendingRestaurant implements Identifiable {
    id: ID!
    restaurant: FonciiRestaurant!
    rank: Int!
    impressions: Int!
}

# Foncii Restaurants #
type FonciiRestaurant {
    # Foncii Specific Restaurant data
    """
    Foncii restaurant data aggregated, pre-processed, and post-processed from various sources
    external sources.
    """
    restaurant: Restaurant!

    """
    Average rating for this restaurant across the Foncii Maps platform (null if no ratings yet)
    """
    averageFonciiRating: Float @cacheControl(maxAge: 600)

    # Open Now / Operating Hours State 
    """
    [Computed] True if the restaurant is currently open using UTC offset time, false if it's not open, and null if this 
    can't be computed ~ missing UTC offset time
    """
    isOpen: Boolean

    # Reservations / Reservation Availability
    """
    [Computed] A list of fresh time slots (availabilities) directly from the reservation provider(s) 
    connected to the restaurant's reservation integration (if any). An empty list if no availabilities 
    are present from any of the connected providers, or if a reservation integration does not exist
    for the restaurant yet.
    """
    reservationAvailabilityEdges(userPersonalizationInput: UserPersonalizationInput): [ReservationAvailability!]!

    """
    [Computed] True if there are reservations available for target time frame (desired time frame passed
    into resolver), false otherwise and also when the restaurant doesn't have a reservation integration yet.
    """
    reservationsAvailable(userPersonalizationInput: UserPersonalizationInput): Boolean!

    """
    [Computed] True if the restaurant has a supported reservation integration connected to it, false otherwise.
    """
    isReservable: Boolean!

    # Percent Match
    """
    [Computed] The percent match score for a single user, namely the primary user conducting the query.
    Only available for registered users.
    """
    percentMatchScore(userPersonalizationInput: UserPersonalizationInput): Float

    # """
    # [Computed] The average percent match score for all users in a group query if querying as a group
    # """
    averagePercentMatchScore(userIDs: [ID!], coordinates: CoordinatePointInput): Float

     """
     [Computed] A metric representing the quality of the restaurant itself. This is 
     essentially half of the percent match score; it's only missing the user taste profile component
     from the recommendation score. This can be used to sort restaurants based on quality 
     for users that don't have an account yet, a preview to percent match if you will.
     """
    qualityScore: Float! @cacheControl(maxAge: 600)
    
    # Associated Content Edges
    # User Posts
    """
    [Computed] Influencer insights / Foncii Maps user posts that are directly tied to / associated with this restaurant. 
    This differs from 'associatedPostEdges' in the sense that only posts by users with notes or ratings for the given restaurant
    are returned. Limited to 10
    """
    influencerInsightEdges(postsToExclude: [ID!]): [FMUserPost!]! @cacheControl(maxAge: 240)

    """
    [Computed] Foncii Maps user posts that are directly tied to / associated with this restaurant. Limited to 10
    """
    associatedPostEdges(postsToExclude: [ID!]): [FMUserPost!]! @cacheControl(maxAge: 240)
  
    # Article Publications
    """
    [Computed] Aggregated articles that mention this restaurant by name. Limited to 10 (Update when needed)
    """
    associatedArticlePublicationEdges: [ArticlePublication!]! @cacheControl(maxAge: 600)

    # Restaurant Awards
    """
    [Computed] Aggregated articles that mention this restaurant by name. Limited to 10 (Update when needed)
    """
    associatedRestaurantAwardEdges: [RestaurantAward!]! @cacheControl(maxAge: 600)

    """
    True if the restaurant was saved by the target user, false otherwise
    """
    isSaved(userPersonalizationInput: UserPersonalizationInput): Boolean!
}

type ArticlePublication implements Identifiable & Publication @cacheControl(maxAge: 600) {
    # Interface Implementations
    """
    Hashed combination of the url and referenced venue name to keep it unique and deterministic
    """
    id: ID!
    """
    The title of the online article publication
    """
    title: String!
    """
    The url of the article that was scraped, links users back to the source when they click on it in the client
    Meta tags from the article are pulled from the URL (page title etc)
    """
    url: String!
    """
    [Computed] The domain name of the website provided by the article's URL
    """
    websiteDomain: String!
    """
    [Computed] The favicon for the website (may not exist, depends on the website) but usually located at 'example.com/favicon.ico', uses the parsed web domain
    """
    faviconLink: String!
    """
    The description meta tag of the article's web page loaded and parsed by this server (can't be done client side due to cross site blocks)
    """
    description: String

    # Article Publication Fields
    """
    Name of the restaurant or bar the article directly references, used in the backend to search for articles by restaurant name
    """
    venueName: String!
    """
    The publication this article was published on (i.e Timeout Eater etc.)
    """
    publication: String!
    """
    When the article was first published in ISO-8601 format (ex. 2023-11-19)
    """
    publishDate: String!
    """
    The time when this article was scraped by our bot
    """
    scrapeDate: String!
    """
    City associated with the publication, in case no full address information is provided
    """
    city: String
    """
    Optional restaurant address string in case provided by the article
    """
    address: String
    """
    Optional text content parsed from the article to store for this publication. Can be used for text embeddings
    """
    textContent: String
}

type RestaurantAward implements Identifiable @cacheControl(maxAge: 600) {
    # Interface Implementations
    id: ID!
    """
    The title of the award
    """
    title: String!
    """
    The url of the award that was scraped, links users back to the source when they click on it in the client
    Meta tags from the award are pulled from the URL (page title etc)
    """
    url: String!
    """
    [Computed] The domain name of the website provided by the article's URL
    """
    websiteDomain: String!
    """
    [Computed] The favicon for the website (may not exist, depends on the website) but usually located at 'example.com/favicon.ico', uses the parsed web domain
    """
    faviconLink: String!
    """
    The description meta tag of the awards's web page loaded and parsed by this server (can't be done client side due to cross site blocks)
    """
    description: String

    # Restaurant Award Fields
    """ 
    Name of the restaurant or bar the article directly references, used in the backend to geocode to our restaurants 
    """
    venueName: String!
    """
    Location of the restaurant or bar the article directly references, used in the backend to geocode to our restaurants 
    """
    venueLocaiton: String!
    """ 
    [Computed] Post geocoded retaurant ID 
    """
    restaurantID: String!
    """
    The organization this award was published on (i.e Michelin Guides etc.)
    """
    organization: String!
    """
    When the article was first published in ISO-8601 format (ex. 2023-11-19)
    """
    awardDate: String!
    """
    The time when this award was scraped by our bot (or csv was ingested)
    """
    scrapeDate: String!
}

""" Object describing the timeslot when a reservation is presently available given the reservation search criteria """
type ReservationAvailability {
    """
    The date / day of the availability formatted in ISO-8601 (ex. 2023-11-26T00:00:00.000Z)
    """
    date: String!
    """
    The time of the reservation.
    Formatted as 24h time (ex. 22:00:00) hh:mm:ss
    """
    timeSlot: String!
    """
    The provider of the reservatio (ex. Resy)
    """
    provider: ReservationProviders!
    """
    The provider specific identifier for the restaurant in question 
    """
    venueID: String!
    fonciiRestaurantID: String!
    """
    Generic link to the restaurant's detail page on the provider's platform (ex. https://resy.com/cities/ny/borrachito-taqueria-spirits) without parameters
    """
    externalURL: String!
    """
    A link to the reservation page which will be used to direct the user to their specified reservation time slot based on the party size and desired date
    """
    parameterizedLink: String!
    """
    The time when this availability was last fetched from the provider
    """
    lastChecked: String!
}

""" Object describing the timeslot when a reservation is presently available given the reservation search criteria """
type AvailableReservationDays {
    """
    Days with availability
    """
    daysWithAvailability: [String!]!
    """
    Provider dependent - will communicate when the last possible date is 
    """
    lastDayAvailable: String!
    """
    The provider of the reservatio (ex. Resy)
    """
    provider: ReservationProviders!
    """
    The provider specific identifier for the restaurant in question 
    """
    venueID: String!
    """
    The time when this availability was last fetched from the provider
    """
    lastChecked: String!
}

# Base Restaurant Data #
type Restaurant implements Identifiable & Updatable & Expirable @cacheControl(maxAge: 600) {
    # Interface Implementations
    id: ID!
    creationDate: String!
    lastUpdated: String!
    staleDate: String!

    # Restaurant Fields
    googleID: String!
    """ 
    Nullable b/c Foncii Maps uses Google as a data anchor
    """ 
    yelpID: String
    name: String!
    """
    Optional because some restaurants lack Yelp data + Google image collections, so we really can't source anything for them unless manually done.
    """
    heroImageURL: String
    imageCollectionURLs: [String!]
    description: String
    categories: [String!]
    priceLevel: Int!
    phoneNumber: String
    operatingHours: OperatingHours
    servesAlcohol: Boolean!
    website: String
    """
    Clean and decodable representation of this place's physical location. Sent back to the client.
    A GeoJSON point object with exists only on the backend data for this restaurant to allow for geospatial queries.
    """
    coordinates: CoordinatePoint! 
    addressProperties: AddressProperties!
    googleProperties: GoogleRestaurantProperties
    yelpProperties: YelpRestaurantProperties
    """
    [Optional] This location's offset from UTC (in minutes), used to determine whether or not the restaurant is open relative to some time zone.
    """
    utcOffset: Int

    """
    [Optional] Social media handles associated with this restaurant
    """
    socialMediaHandles: RestaurantSocialMediaHandles
}

"""
An entity that signifies a user with the given user ID has saved
the restaurant with the given restaurant ID, which is also optionally associated with some
user post with the given post ID (if the restaurant was saved via a user post)
"""
type SavedFonciiRestaurant implements Savable {
    # Interfaces
    id: ID!
    userID: ID!
    creationDate: String!

    # Saved Foncii Restaurant Fields
    """
    ID of the foncii restaurant saved
    """
    fonciiRestaurantID: String!
    """
    Optional post ID used when the restaurant was saved via a user post
    """
    postID: String
}

type RestaurantSocialMediaHandles {
    instagram: String
}

type OperatingHours {
    Monday: String
    Tuesday: String
    Wednesday: String
    Thursday: String
    Friday: String
    Saturday: String
    Sunday: String
}

type AddressProperties {
    formattedAddress: String
    streetAddress: String
    zipCode: String
    city: String
    neighborhood: String
    stateCode: String
    countryCode: String
}

type GoogleRestaurantProperties implements PlaceProperties {
    # Interface Implementations
    rating: Float
    externalURL: String
}

type YelpRestaurantProperties implements PlaceProperties {
    # Interface Implementations
    rating: Float
    externalURL: String
}

type RestaurantAutoCompleteSuggestion implements AutoCompleteSuggestion {
    """
    Note: 'fonciiRestaurantID' is not available when injecting suggestions from Google Places API / when the Source is 'GOOGLE'
    """
    fonciiRestaurantID: ID 
    googlePlaceID: ID!
    source: RestaurantAutoCompleteSuggestionSources!
    """
    Cuisines / other categories attributed to aggregated restaurants | Optional for non-aggregated restaurants
    """
    categories: [String!]

    # Interface Implementation
    title: String!
    """ Human-readable description [business name + location properties]  """
    description: String!
    """ Optional preview image for this search result """
    previewImageURL: String
}

type UserPostAutoCompleteSuggestion implements AutoCompleteSuggestion {
    postID: ID!
    fonciiRestaurantID: ID!

    # Interface Implementation
    title: String!
    """ Human-readable description [business name + location properties]  """
    description: String!
    """ Optional preview image for this search result """
    previewImageURL: String
}

type UserAutoCompleteSuggestion implements AutoCompleteSuggestion {
    userID: ID!

    # Interface Implementation
    title: String!
    """ Human-readable description [username] """
    description: String!
    """ Optional preview image for this search result """
    previewImageURL: String
}

type PopularSearchQuerySuggestion implements AutoCompleteSuggestion {
    # Interface Implementation
    title: String!
    """ Human-readable description [popular search term] """
    description: String!
    """ Not used for this type, just implemented for protocol conformance """
    previewImageURL: String
}
`;

export default typeDef;