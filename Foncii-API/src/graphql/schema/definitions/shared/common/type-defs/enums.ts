// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

/**
 * Shared enums that allow for tighter structuring of the schema.
 */
const typeDef = gql`
  """
  Different possible timespans to use to compute dashboard graph
  data with.
  """
  enum AnalyticsTimespan {
    ONE_WEEK
    TWO_WEEKS
    ONE_MONTH
    SIX_MONTHS
    ONE_YEAR
    TWO_YEARS
  }

  """
  The different possible roles for all Foncii users
  """
  enum UserRoles {
    TEST
    CREATOR
    BUSINESS
    BASIC
    ADMIN
  }

  """
  The different possible categories for the influencer leaderboard
  """
  enum InfluencerLeaderboardCategory {
    TOP_RATED
    TRENDING
    NEW
  }

  """
  Keeps track of the different tasks that a new user
  can complete for their Foncii user profile.
  """
  enum FonciiUserProfileTasks {
    CREATE_ACCOUNT
    CONNECT_SOCIAL_MEDIA
    CREATE_TAST_PROFILE
    INVITE_FRIEND
  }

  """
  Keeps track of where a specific auto-complete search suggestion was
  derived from since multiple sources can be combined to produce a single set of suggestions.
  """
  enum RestaurantAutoCompleteSuggestionSources {
    FONCII
    GOOGLE
  }

  """
  Reservation providers currently supported by Foncii's open reservation
  integration platform, right now only Resy is supported.
  """
  enum ReservationProviders {
    RESY
  }

  """
  Integration providers that Foncii Maps users can use to import posts from.
  """
  enum FMIntegrationProviders {
    INSTAGRAM
    TIKTOK
    GOOGLE_MAPS
  }

  """
  The different kinds of authentication providers the user
  can choose from to gain access to Foncii's services.
  """
  enum AuthProviders {
    GOOGLE
    FACEBOOK
    TWITTER
    APPLE
    DEFAULT
  }

  """
  All supported media formats that a Foncii Maps post can have.
  """
  enum PostMediaTypes {
    IMAGE
    VIDEO
    CAROUSEL_ALBUM
  }

  enum SortOrders {
    ASCENDING
    DESCENDING
  }

  """
  Enum that describes the different kinds of supported Foncii platforms.
  This is used for routing requests from multiple platforms to singular endpoints that
  can handle platform agnostic inputs.
  """
  enum SupportedFonciiPlatforms {
    FONCII
    FONCII_BIZ
  }
`;

export default typeDef;
