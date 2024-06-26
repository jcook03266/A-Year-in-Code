// Dependencies
// GraphQL Types
import { gql } from "@apollo/client";

// Reusable Data fragments for simplifying type definitions
/** Only return these fields in the creator object for user posts */
const POST_CREATOR_FIELDS = gql`
  fragment PostCreatorFields on FMUser {
    id
    firstName
    username
    profilePictureURL
  }
`;

const CORE_CUSTOM_POST_PROPERTY_FIELDS = gql`
  fragment CoreCustomPostPropertyFields on CustomUserPostProperties {
    notes
    rating
    categories
  }
`;

const COORDINATE_POINT_FIELDS = gql`
  fragment CoordinatePointFields on CoordinatePoint {
    lat
    lng
  }
`;

const CORE_MEDIA_FIELDS = gql`
  fragment CoreMediaFields on FMUserPostMedia {
    mediaURL
    videoMediaThumbnailURL
    mediaType
  }
`;

const CORE_POST_DATA_SOURCE_FIELDS = gql`
  ${CORE_MEDIA_FIELDS}
  fragment CorePostDataSourceFields on PostDataSource {
    provider
    sourceUID
    caption
    permalink
    creationDate
    media {
      ...CoreMediaFields
    }
    secondaryMedia {
      ...CoreMediaFields
    }
  }
`;

const CORE_USER_SESSION_FIELDS = gql`
  fragment CoreUserSessionFields on UserSession {
    id
    userID
    deviceID
    creationDate
    lastUpdated
    sessionDuration
    terminated
    isAlive
    isActive
    isSuspicious
  }
`;

const CORE_TASTE_PROFILE_FIELDS = gql`
  fragment CoreTasteProfileFields on TasteProfile {
    id
    spicePreferenceLevel
    preferredPriceRange
    preferredCuisines
    drinkPreference
    distancePreferenceLevel
    diningPurpose
    dietaryRestrictions
    ambiancePreference
    adventureLevel
  }
`;

const CORE_RESTAURANT_FIELDS = gql`
  ${COORDINATE_POINT_FIELDS}
  fragment CoreRestaurantFields on Restaurant {
    id
    creationDate
    lastUpdated
    googleID
    yelpID
    name
    heroImageURL
    imageCollectionURLs
    description
    categories
    priceLevel
    phoneNumber
    operatingHours {
      Monday
      Tuesday
      Wednesday
      Thursday
      Friday
      Saturday
      Sunday
    }
    servesAlcohol
    website
    coordinates {
      ...CoordinatePointFields
    }
    addressProperties {
      formattedAddress
      streetAddress
      zipCode
      city
      neighborhood
      stateCode
      countryCode
    }
    googleProperties {
      rating
      externalURL
    }
    yelpProperties {
      rating
      externalURL
    }
    utcOffset
  }
`;

/** Main user data can contain all relevant information as it's fetched only by an authorized client */
const MAIN_USER_FIELDS = gql`
  ${CORE_TASTE_PROFILE_FIELDS}
  fragment MainUserFields on FMUser {
    id
    firstName
    lastName
    username
    email
    authProviders
    profilePictureURL
    creationDate
    lastUpdated
    referralCode
    lastLogin {
      authProvider
      loginDate
    }
    lastSignOut
    mapName
    primaryTasteProfile {
      ...CoreTasteProfileFields
    }
    profileTasks {
      id
      isComplete
    }
    role
  }
`;

/** Visited user data must be limited in order to protect their private information and metadata */
const VISITED_USER_FIELDS = gql`
  fragment VisitedUserFields on FMUser {
    id
    username
    firstName
    profilePictureURL
    mapName
  }
`;

const CORE_INTEGRATION_CREDENTIAL_FIELDS = gql`
  fragment CoreIntegrationCredentialFields on FMIntegrationCredential {
    id
    userID
    creationDate
    lastUpdated
    staleDate
    provider
    autoRefresh
    expiresSoon
    expired
    canRefresh
    appUsername
  }
`;

const RESERVATION_AVAILABILITY_FIELDS = gql`
  fragment ReservationAvailabilityFields on ReservationAvailability {
    date
    timeSlot
    provider
    venueID
    fonciiRestaurantID
    externalURL
    parameterizedLink
    lastChecked
  }
`;

const AVAILABLE_RESERVATION_DAYS_FIELDS = gql`
  fragment AvailableReservationDaysFields on AvailableReservationDays {
    daysWithAvailability
    lastDayAvailable
    provider
    venueID
    lastChecked
  }
`;

const CORE_ASSOCIATED_ARTICLE_PUBLICATION_FIELDS = gql`
  fragment CoreAssociatedArticlePublicationFields on ArticlePublication {
    id
    title
    venueName
    publication
    publishDate
    scrapeDate
    url
    websiteDomain
    faviconLink
  }
`;

const DETAILED_ASSOCIATED_ARTICLE_PUBLICATION_FIELDS = gql`
  ${CORE_ASSOCIATED_ARTICLE_PUBLICATION_FIELDS}
  fragment DetailedAssociatedArticlePublicationFields on ArticlePublication {
    ...CoreAssociatedArticlePublicationFields
    description
  }
`;

const CORE_ASSOCIATED_RESTAURANT_AWARD_FIELDS = gql`
  fragment CoreAssociatedRestaurantAwardFields on RestaurantAward {
    id
    title
    organization
    awardDate
    restaurantID
    url
    websiteDomain
    faviconLink
  }
`;

const DETAILED_ASSOCIATED_RESTAURANT_AWARD_FIELDS = gql`
  ${CORE_ASSOCIATED_RESTAURANT_AWARD_FIELDS}
  fragment DetailedAssociatedRetaurantAwardFields on RestaurantAward {
    ...CoreAssociatedRestaurantAwardFields
    description
  }
`;

const CORE_INFLUENCER_EDGE_FIELDS = gql`
  ${POST_CREATOR_FIELDS}
  ${CORE_CUSTOM_POST_PROPERTY_FIELDS}
  ${CORE_MEDIA_FIELDS}
  fragment CoreInfluencerEdgeFields on FMUserPost {
    id
    media {
      ...CoreMediaFields
    }
    secondaryMedia {
      ...CoreMediaFields
    }
    mediaIsVideo
    creator {
      ...PostCreatorFields
    }
    customUserProperties {
      ...CoreCustomPostPropertyFields
    }
  }
`;

const FONCII_RESTAURANT_SEARCH_FIELDS = gql`
  ${CORE_RESTAURANT_FIELDS}
  ${RESERVATION_AVAILABILITY_FIELDS}
  ${CORE_INFLUENCER_EDGE_FIELDS}
  ${CORE_ASSOCIATED_ARTICLE_PUBLICATION_FIELDS}
  ${CORE_ASSOCIATED_RESTAURANT_AWARD_FIELDS}
  fragment FonciiRestaurantSearchFields on FonciiRestaurant {
    restaurant {
      ...CoreRestaurantFields
    }
    percentMatchScore
    qualityScore
    isSaved
    isOpen
    reservationsAvailable
    averageFonciiRating
    influencerInsightEdges {
      ...CoreInfluencerEdgeFields
    }
    isReservable
    reservationAvailabilityEdges {
      ...ReservationAvailabilityFields
    }
    associatedArticlePublicationEdges {
      ...CoreAssociatedArticlePublicationFields
    }
    associatedRestaurantAwardEdges {
      ...CoreAssociatedRestaurantAwardFields
    }
  }
`;

const FONCII_RESTAURANT_DETAIL_FIELDS = gql`
  ${CORE_RESTAURANT_FIELDS}
  ${RESERVATION_AVAILABILITY_FIELDS}
  ${CORE_INFLUENCER_EDGE_FIELDS}
  ${DETAILED_ASSOCIATED_ARTICLE_PUBLICATION_FIELDS}
  ${DETAILED_ASSOCIATED_RESTAURANT_AWARD_FIELDS}
  fragment FonciiRestaurantDetailFields on FonciiRestaurant {
    restaurant {
      ...CoreRestaurantFields
    }
    isSaved(userPersonalizationInput: $userPersonalizationInput)
    isOpen
    percentMatchScore(userPersonalizationInput: $userPersonalizationInput)
    qualityScore
    averageFonciiRating
    influencerInsightEdges(postsToExclude: $postsToExclude) {
      ...CoreInfluencerEdgeFields
      isFavorited
    }
    isReservable
    reservationsAvailable(userPersonalizationInput: $userPersonalizationInput)
    reservationAvailabilityEdges(
      userPersonalizationInput: $userPersonalizationInput
    ) {
      ...ReservationAvailabilityFields
    }
    associatedArticlePublicationEdges {
      ...DetailedAssociatedArticlePublicationFields
    }
    associatedRestaurantAwardEdges {
      ...DetailedAssociatedRetaurantAwardFields
    }
  }
`;

const SIMILAR_FONCII_RESTAURANT_FIELDS = gql`
  ${CORE_RESTAURANT_FIELDS}
  ${CORE_INFLUENCER_EDGE_FIELDS}
  ${CORE_ASSOCIATED_ARTICLE_PUBLICATION_FIELDS}
  ${CORE_ASSOCIATED_RESTAURANT_AWARD_FIELDS}
  fragment SimilarFonciiRestaurantFields on FonciiRestaurant {
    restaurant {
      ...CoreRestaurantFields
    }
    isSaved(userPersonalizationInput: $userPersonalizationInput)
    isOpen
    percentMatchScore(userPersonalizationInput: $userPersonalizationInput)
    qualityScore
    averageFonciiRating
    influencerInsightEdges {
      ...CoreInfluencerEdgeFields
    }
    associatedArticlePublicationEdges {
      ...CoreAssociatedArticlePublicationFields
    }
    associatedRestaurantAwardEdges {
      ...CoreAssociatedRestaurantAwardFields
    }
  }
`;

const CORE_POST_FIELDS = gql`
  ${POST_CREATOR_FIELDS}
  ${CORE_CUSTOM_POST_PROPERTY_FIELDS}
  ${CORE_RESTAURANT_FIELDS}
  ${FONCII_RESTAURANT_SEARCH_FIELDS}
  ${CORE_MEDIA_FIELDS}
  ${CORE_POST_DATA_SOURCE_FIELDS}
  fragment CorePostFields on FMUserPost {
    id
    creationDate
    lastUpdated
    userID
    dataSource {
      ...CorePostDataSourceFields
    }
    customUserProperties {
      ...CoreCustomPostPropertyFields
    }
    isHidden
    isFavorited
    media {
      ...CoreMediaFields
    }
    secondaryMedia {
      ...CoreMediaFields
    }
    parentPostID
    isChildPost
    mediaIsVideo
    deletionPending
    scheduledDeletionTimestamp
    creator {
      ...PostCreatorFields
    }
    restaurant {
      ...CoreRestaurantFields
    }
    fonciiRestaurant {
      ...FonciiRestaurantSearchFields
    }
  }
`;

const PERSONALIZED_CORE_POST_FIELDS = gql`
  ${POST_CREATOR_FIELDS}
  ${CORE_CUSTOM_POST_PROPERTY_FIELDS}
  ${CORE_RESTAURANT_FIELDS}
  ${CORE_MEDIA_FIELDS}
  ${CORE_POST_DATA_SOURCE_FIELDS}
  ${CORE_INFLUENCER_EDGE_FIELDS}
  ${FONCII_RESTAURANT_DETAIL_FIELDS}
  fragment PersonalizedCorePostFields on FMUserPost {
    id
    creationDate
    lastUpdated
    userID
    dataSource {
      ...CorePostDataSourceFields
    }
    customUserProperties {
      ...CoreCustomPostPropertyFields
    }
    isHidden
    isFavorited
    media {
      ...CoreMediaFields
    }
    secondaryMedia {
      ...CoreMediaFields
    }
    parentPostID
    isChildPost
    mediaIsVideo
    deletionPending
    scheduledDeletionTimestamp
    creator {
      ...PostCreatorFields
    }
    restaurant {
      ...CoreRestaurantFields
    }
    fonciiRestaurant {
      ...FonciiRestaurantDetailFields
    }
  }
`;

const ASSOCIATED_POST_FIELDS = gql`
  ${POST_CREATOR_FIELDS}
  ${CORE_CUSTOM_POST_PROPERTY_FIELDS}
  ${CORE_RESTAURANT_FIELDS}
  ${SIMILAR_FONCII_RESTAURANT_FIELDS}
  ${CORE_MEDIA_FIELDS}
  ${CORE_POST_DATA_SOURCE_FIELDS}
  fragment AssociatedPostFields on FMUserPost {
    id
    creationDate
    lastUpdated
    userID
    dataSource {
      ...CorePostDataSourceFields
    }
    customUserProperties {
      ...CoreCustomPostPropertyFields
    }
    isHidden
    isFavorited
    media {
      ...CoreMediaFields
    }
    secondaryMedia {
      ...CoreMediaFields
    }
    parentPostID
    isChildPost
    mediaIsVideo
    deletionPending
    scheduledDeletionTimestamp
    creator {
      ...PostCreatorFields
    }
    restaurant {
      ...CoreRestaurantFields
    }
    fonciiRestaurant {
      ...SimilarFonciiRestaurantFields
    }
  }
`;

export const OperationFragments = {
  POST_CREATOR_FIELDS,
  CORE_CUSTOM_POST_PROPERTY_FIELDS,
  COORDINATE_POINT_FIELDS,
  CORE_MEDIA_FIELDS,
  CORE_POST_DATA_SOURCE_FIELDS,
  CORE_USER_SESSION_FIELDS,
  CORE_TASTE_PROFILE_FIELDS,
  CORE_RESTAURANT_FIELDS,
  MAIN_USER_FIELDS,
  VISITED_USER_FIELDS,
  CORE_INTEGRATION_CREDENTIAL_FIELDS,
  RESERVATION_AVAILABILITY_FIELDS,
  AVAILABLE_RESERVATION_DAYS_FIELDS,
  CORE_ASSOCIATED_ARTICLE_PUBLICATION_FIELDS,
  DETAILED_ASSOCIATED_ARTICLE_PUBLICATION_FIELDS,
  CORE_ASSOCIATED_RESTAURANT_AWARD_FIELDS,
  DETAILED_ASSOCIATED_RESTAURANT_AWARD_FIELDS,
  FONCII_RESTAURANT_SEARCH_FIELDS,
  FONCII_RESTAURANT_DETAIL_FIELDS,
  SIMILAR_FONCII_RESTAURANT_FIELDS,
  CORE_POST_FIELDS,
  PERSONALIZED_CORE_POST_FIELDS,
  ASSOCIATED_POST_FIELDS,
};
