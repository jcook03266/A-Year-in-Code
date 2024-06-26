// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

/**
 * Shared inputs used across multiple queries and mutations.
 */
const typeDef = gql`
  input UserPersonalizationInput {
    """
    Optional personalization criteria to apply when resolving the Foncii restaurant
    for attributes such as percent match and reservations
    """
    userID: ID
    coordinates: CoordinatePointInput!

    """
    Optional search criteria for reservations, if not provided then
    the default reservation search criteria is used (party of 2, target date is today)
    """
    reservationSearchInput: ReservationSearchInput
    includeReservations: Boolean = false
    includeInfluencerInsights: Boolean = false
    includeAssociatedPosts: Boolean = false
    includeAssociatedArticles: Boolean = false
    includeAssociatedRestaurantAwards: Boolean = false
  }

  input RestaurantReservationDetailInput {
    name: String!
    venueID: String!
    venueAlias: String!
    """
    A link to the reservation page which will be used to direct the user to their specified reservation time slot
    """
    externalURL: String!
    """
    CSV string with the restaurant name, address details, state etc.
    Can be used to match the reservation details with a restaurant in our database
    or dynamically aggregate a new restaurant to match the one that's missing.
    """
    locationDetails: String!
  }

  input ArticlePublicationDetailInput {
    """
    Hashed combination of the url and referenced venue name to keep it unique and deterministic 
    """
    id: String!
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
    Optional title of the published online article / webpage
    """
    title: String
    """
    Optional description meta tag of the article's web page loaded and parsed by this server (can't be done client side due to cross site blocks)
    """
    description: String
    """
    The direct URL linking to the article publication itself
    """
    url: String!
    """
    Name of the restaurant or bar the article directly references, used in the backend to search for articles by restaurant name
    """
    venueName: String!
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

  input RestaurantAwardDetailInput {
    title: String!
    organization: String!
    url: String!
    venueName: String!
    venueLocation: String!
    awardDate: String!
    scrapeDate: String!
  }

  # Auth Inputs #
  input UserLoginInput {
    userID: ID!
    authProvider: AuthProviders!
  }

  input ImpersonateUserInput {
    userID: ID!
    impersonatedFirebaseID: String
    impersonatedUserName: String
    impersonatedEmail: String
    impersonatedPhoneNumber: String
  }

  """
  Input representing a typical coordinate point struct
  """
  input CoordinatePointInput {
    lng: Float!
    lat: Float!
  }

  input UserProfilePictureUpdateInput {
    """
    UInt8Array String, Required input is PNG or JPG/JPEG format, max size is 4MB
    """
    fileUploadRequest: FileUploadRequestInput!
    platform: SupportedFonciiPlatforms!
  }

  """
  Generic protocol for typical file uploads to conform to.
  """
  input FileUploadRequestInput {
    """
    The ID of the user the upload belongs to
    """
    userID: String!
    """
    UInt8Array String, defined if uploading, undefined if deleting
    """
    fileDataBuffer: String
  }

  input UserPostMediaInput {
    """
    URL of the new media (uploaded to the Foncii CDN from the client)
    """
    mediaURL: String!
    """
    Not applicable for image media, and required for video media (the operation will be rejected if a video
    thumbnail image is not provided for video-media based updates)
    """
    videoMediaThumbnailURL: String
    mediaType: PostMediaTypes!
  }

  """
  A simple data model that allows users to match their unique cuisine tastes with other users as well
  as match with restaurants that fit their 'taste profile'. This data model can be represented as an
  embedding and used with numerous ML algorithms such as KNN to provide super fast recommendations
  based on vector database search operations.
  """
  input TasteProfileInput {
    """
    ID of the user this taste profile belongs to, before this was the id, but this will allow for the possibility of switching taste profiles for users by allowing multiple taste profiles for a single user
    """
    userID: ID!
    """
    0 - 2 | Optional integer from 0 - 2 - default value if undefined if no value is given
    """
    spicePreferenceLevel: Int
    """
    0 - 2 | ~
    """
    adventureLevel: Int
    """
    0 - 2 | ~
    """
    distancePreferenceLevel: Int
    """
    0 - 3 | Optional integer from 0 - 3 - default value is undefined if no value is given
    """
    diningPurpose: Int
    """
    0 - 3 | ~
    """
    ambiancePreference: Int
    """
    0 - 3 | Optional integer from 0 - 3 - default value if undefined if no value is given, Option 4 aka 'Non-alcoholic beverages only' indicates a non-alcoholic beverage preference i.e no alcohol, the others ~ yes alcohol
    """
    drinkPreference: Int
    """
    A set of unique cuisine IDs, (any duplicates are removed)
    """
    preferredCuisines: [ID!]
    """
    A set of unique ID strings associated with the dietary restrictions that the user has - default value is an empty array if no value is given
    """
    dietaryRestrictions: [ID!]
    """
    0 - 3 | Optional integer from 0 - 3 - default value is undefined if no value is given | 0.) 4 ($$$$) and below ($$$$), ($$$), ($$), ($) 1.) 3 ($$$) and below ($$$), ($$), ($) 2.) ($$) and below ($$), ($), 1.) ($) and below ($)
    """
    preferredPriceRange: Int
  }
`;

export default typeDef;
