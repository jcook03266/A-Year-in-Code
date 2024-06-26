// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  """
  Foncii consumer platform events
  """
  enum FonciiEvents {
    EXPLORE_SEARCH
    USER_GALLERY_SEARCH
    RESERVATION_SEARCH
    """
    A reservation intent is an action intended by a user to make a reservation at an establishment.
    If the user successfully makes a reservation and reports it to our services then a successful
    reservation is registered in our system. A reservation is able to be transitioned by
    external inputs such as a user cancelling a reservation and informing us (or anything we see fit down the line).
    """
    RESERVATION_INTENT
    """
    Fired when a user clicks on a restaurant's website link
    """
    BUSINESS_WEBSITE_CLICK
    RESTAURANT_CLICK
    POST_CLICK
    MAP_PIN_CLICK
    POST_SOURCE_LINK_CLICK
    ARTICLE_PUBLICATION_CLICK
    """
    A view of a user / influencer's map / post gallery
    """
    USER_GALLERY_VIEW
    POST_VIEW
    RESTAURANT_VIEW
    TASTE_PROFILE_CREATION
    TASTE_PROFILE_UPDATE
    TASTE_PROFILE_DELETION
    USER_PROFILE_PICTURE_UPDATE
    POST_CREATION
    POST_UPDATE
    POST_DELETION
    SAVED_RESTAURANT
    UNSAVED_RESTAURANT
    SHARE
  }

  """
  Foncii business platform events
  """
  enum FonciiBizEvents {
    PLACEHOLDER
  }

  """
  Supported share events used across Foncii to identify
  the source of a share event
  """
  enum ShareEventType {
    USER_GALLERY
    RESTAURANT
    USER_POST
    REFERRAL
  }

  enum ShareSheetDestination {
    CLIPBOARD
    REDDIT
    TWITTER
    FACEBOOK
    WHATSAPP
    LINKEDIN
    SYSTEM
  }

  enum ReservationIntentOutcome {
    CONFIRMED
    PASSIVE
    FAILED
  }

  type UserMapAnalyticsDashboard {
    # Map
    totalMapViews: Int!
    """
    How much the total amount of views have gone up or down relative to
    the last week or 2 weeks / specified timespan.
    """
    relativeMapViewChange: Int!
    mapViewsTimeSeries: [UserAnalyticsDashboardTimeSeriesEntry!]!

    # Tags
    totalTags: Int!
    topTagsDistribution: [UserAnalyticsDashboardEntityDistribution!]!

    # Locations
    totalLocations: Int!
    topLocationsDistribution: [UserAnalyticsDashboardEntityDistribution!]!

    # Experiences
    totalExperienceViews: Int!
    mostViewedExperienceDistribution: [UserAnalyticsDashboardEntityDistribution!]!
  }

  type UserBusinessWebsiteAnalyticsDashboard {
    # Business Website Clicks
    totalBusinessWebsiteClicks: Int!
    relativeBusinessWebsiteClicksChange: Int!
    businessWebsiteClicksTimeSeries: [UserAnalyticsDashboardTimeSeriesEntry!]!
    mostClickedBusinessWebsitesDistribution: [UserAnalyticsDashboardEntityDistribution!]!
  }

  type UserReservationIntentsAnalyticsDashboard {
    # Reservation Intents
    totalReservationIntents: Int!
    relativeReservationIntentsChange: Int!
    reservationIntentsTimeSeries: [UserAnalyticsDashboardTimeSeriesEntry!]!
    topReservedRestaurantsDistribution: [UserAnalyticsDashboardEntityDistribution!]!
  }

  type UserAnalyticsDashboardTimeSeriesEntry {
    """
    Optional category value / name to identify this time series entry with in order
    to group other similar entries together or differentiate entries from one another
    """
    category: String
    """
    A list of data points spread across some timeline indicated by the labels field
    """
    data: [Int!]!
    """
    A list of formatted date strings that indicate when each data point in this time series
    was observed / recorded
    """
    timestamps: [String!]
  }

  type UserAnalyticsDashboardEntityDistribution {
    """
    The categorical name to display for this entity (restaurant name or anything else that identifies what this metric
    quantitatively identifies)
    """
    category: String!
    """
    The total count of this entity. This is used to determine the percentage this entity represents out of some
    larger dataset.
    """
    count: Int!
  }
`;

export default typeDef;
