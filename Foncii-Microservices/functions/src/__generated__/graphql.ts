/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AddressProperties = {
  __typename?: 'AddressProperties';
  city?: Maybe<Scalars['String']['output']>;
  countryCode?: Maybe<Scalars['String']['output']>;
  formattedAddress?: Maybe<Scalars['String']['output']>;
  neighborhood?: Maybe<Scalars['String']['output']>;
  stateCode?: Maybe<Scalars['String']['output']>;
  streetAddress?: Maybe<Scalars['String']['output']>;
  zipCode?: Maybe<Scalars['String']['output']>;
};

export type AggregateRestaurantInput = {
  googlePlaceID: Scalars['String']['input'];
};

/** Input for dynamically aggregating and transforming restaurant data around a specified coordinate point from multiple data sources */
export type AggregateRestaurantsAroundInput = {
  coordinates: CoordinatePointInput;
};

/**
 * Different possible timespans to use to compute dashboard graph
 * data with.
 */
export enum AnalyticsTimespan {
  OneMonth = 'ONE_MONTH',
  OneWeek = 'ONE_WEEK',
  OneYear = 'ONE_YEAR',
  SixMonths = 'SIX_MONTHS',
  TwoWeeks = 'TWO_WEEKS',
  TwoYears = 'TWO_YEARS'
}

export type ArticlePublication = Identifiable & Publication & {
  __typename?: 'ArticlePublication';
  /** Optional restaurant address string in case provided by the article */
  address?: Maybe<Scalars['String']['output']>;
  /** City associated with the publication, in case no full address information is provided */
  city?: Maybe<Scalars['String']['output']>;
  /** The description meta tag of the article's web page loaded and parsed by this server (can't be done client side due to cross site blocks) */
  description?: Maybe<Scalars['String']['output']>;
  /** [Computed] The favicon for the website (may not exist, depends on the website) but usually located at 'example.com/favicon.ico', uses the parsed web domain */
  faviconLink: Scalars['String']['output'];
  /** Hashed combination of the url and referenced venue name to keep it unique and deterministic */
  id: Scalars['ID']['output'];
  /** The publication this article was published on (i.e Timeout Eater etc.) */
  publication: Scalars['String']['output'];
  /** When the article was first published in ISO-8601 format (ex. 2023-11-19) */
  publishDate: Scalars['String']['output'];
  /** The time when this article was scraped by our bot */
  scrapeDate: Scalars['String']['output'];
  /** Optional text content parsed from the article to store for this publication. Can be used for text embeddings */
  textContent?: Maybe<Scalars['String']['output']>;
  /** The title of the online article publication */
  title: Scalars['String']['output'];
  /**
   * The url of the article that was scraped, links users back to the source when they click on it in the client
   * Meta tags from the article are pulled from the URL (page title etc)
   */
  url: Scalars['String']['output'];
  /** Name of the restaurant or bar the article directly references, used in the backend to search for articles by restaurant name */
  venueName: Scalars['String']['output'];
  /** [Computed] The domain name of the website provided by the article's URL */
  websiteDomain: Scalars['String']['output'];
};

export type ArticlePublicationClickEventPayload = {
  authorUID?: InputMaybe<Scalars['ID']['input']>;
  destinationURL: Scalars['String']['input'];
  fonciiRestaurantID: Scalars['ID']['input'];
  percentMatchScore?: InputMaybe<Scalars['Float']['input']>;
  postID?: InputMaybe<Scalars['ID']['input']>;
  publication: Scalars['String']['input'];
  qualityScore: Scalars['Float']['input'];
  sourceURL: Scalars['String']['input'];
};

export type ArticlePublicationDetailInput = {
  /** Optional restaurant address string in case provided by the article */
  address?: InputMaybe<Scalars['String']['input']>;
  /** City associated with the publication, in case no full address information is provided */
  city?: InputMaybe<Scalars['String']['input']>;
  /** Optional description meta tag of the article's web page loaded and parsed by this server (can't be done client side due to cross site blocks) */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Hashed combination of the url and referenced venue name to keep it unique and deterministic  */
  id: Scalars['String']['input'];
  /** The publication this article was published on (i.e Timeout Eater etc.) */
  publication: Scalars['String']['input'];
  /** When the article was first published in ISO-8601 format (ex. 2023-11-19) */
  publishDate: Scalars['String']['input'];
  /** The time when this article was scraped by our bot */
  scrapeDate: Scalars['String']['input'];
  /** Optional text content parsed from the article to store for this publication. Can be used for text embeddings */
  textContent?: InputMaybe<Scalars['String']['input']>;
  /** Optional title of the published online article / webpage */
  title?: InputMaybe<Scalars['String']['input']>;
  /** The direct URL linking to the article publication itself */
  url: Scalars['String']['input'];
  /** Name of the restaurant or bar the article directly references, used in the backend to search for articles by restaurant name */
  venueName: Scalars['String']['input'];
};

/** An output for article publications queried outside of Foncii Restaurant based resolvers. */
export type ArticlePublicationStandaloneOutput = {
  __typename?: 'ArticlePublicationStandaloneOutput';
  /** [Computed] Aggregated articles that mention this restaurant by name. Limited to 10 (Update when needed) */
  associatedArticlePublicationEdges: Array<ArticlePublication>;
};

/**
 * The different kinds of authentication providers the user
 * can choose from to gain access to Foncii's services.
 */
export enum AuthProviders {
  Apple = 'APPLE',
  Default = 'DEFAULT',
  Facebook = 'FACEBOOK',
  Google = 'GOOGLE',
  Twitter = 'TWITTER'
}

export type AutoCompleteSuggestion = {
  /** Human-readable description [business name + location properties] | [username] */
  description: Scalars['String']['output'];
  /** Optional preview image for this search result */
  previewImageURL?: Maybe<Scalars['String']['output']>;
  /** The string to match search queries with, used for sorting */
  title: Scalars['String']['output'];
};

/**  Object describing the timeslot when a reservation is presently available given the reservation search criteria  */
export type AvailableReservationDays = {
  __typename?: 'AvailableReservationDays';
  /** Days with availability */
  daysWithAvailability: Array<Scalars['String']['output']>;
  /** The time when this availability was last fetched from the provider */
  lastChecked: Scalars['String']['output'];
  /** Provider dependent - will communicate when the last possible date is  */
  lastDayAvailable: Scalars['String']['output'];
  /** The provider of the reservatio (ex. Resy) */
  provider: ReservationProviders;
  /** The provider specific identifier for the restaurant in question  */
  venueID: Scalars['String']['output'];
};

export type AvailableReservationDaysInput = {
  /** ISO-8601 formatted date string in the format of YYYY-mm-dd ex.) 2023-12-02 */
  endDate: Scalars['String']['input'];
  /** Size of the party from [min] 1 - 20 [max] */
  partySize: Scalars['Int']['input'];
  /** ISO-8601 formatted date string in the format of YYYY-mm-dd ex.) 2023-12-02 */
  startDate: Scalars['String']['input'];
};

export type BusinessWebsiteClickEventPayload = {
  authorUID?: InputMaybe<Scalars['ID']['input']>;
  destinationURL: Scalars['String']['input'];
  fonciiRestaurantID: Scalars['ID']['input'];
  percentMatchScore?: InputMaybe<Scalars['Float']['input']>;
  postID?: InputMaybe<Scalars['ID']['input']>;
  qualityScore: Scalars['Float']['input'];
  sourceURL: Scalars['String']['input'];
};

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type ClassifiedDiscoveredInstagramPostInput = {
  dataSource: InstagramPostDataSourceInput;
  googlePlaceIDs: Array<Scalars['String']['input']>;
  gpidToInstagramHandleMappings: Array<GpidToInstagramHandleMappingInput>;
};

export type ClassifiedDiscoveredInstagramPostsInput = {
  posts: Array<ClassifiedDiscoveredInstagramPostInput>;
  username: Scalars['String']['input'];
};

/** Defines error types to be parsed by the client when an operation goes wrong */
export type ClientError = {
  __typename?: 'ClientError';
  description: Scalars['String']['output'];
  errorCode: Scalars['String']['output'];
};

export type ConnectIntegrationInput = {
  /** Code provided by the client to connect to the given integration provider */
  authToken: Scalars['String']['input'];
  provider: FmIntegrationProviders;
  /** Required for Instagram integration */
  redirectURI: Scalars['String']['input'];
  /** ID of the user sending the connection request */
  userID: Scalars['ID']['input'];
};

/**
 * Simple type that defines a physical location
 * Based on real world coordinates
 */
export type CoordinatePoint = {
  __typename?: 'CoordinatePoint';
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
};

/** Input representing a typical coordinate point struct */
export type CoordinatePointInput = {
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
};

export type Creatable = {
  /** ISO-8601 Formatted Date String, when this entity was first created */
  creationDate: Scalars['String']['output'];
};

export type CreateFmUserPostInput = {
  userID: Scalars['ID']['input'];
};

export type CreateNewFmUserInput = {
  authProvider: AuthProviders;
  email: Scalars['String']['input'];
  externalReferralCode?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  /**
   * Optional photo URL of the user's profile picture tied to an OAuth provider if the user
   * signs in with any of those methods.
   */
  oAuthProfilePictureURL?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  userID: Scalars['ID']['input'];
  username: Scalars['String']['input'];
};

export type CreateUserSessionInput = {
  /**
   * Optional Amplitude session ID passed from the client to track occurrences across our own session management system
   * and Amplitude's.
   */
  amplitudeSessionID?: InputMaybe<Scalars['Float']['input']>;
  /**
   * The user's current physical location, to be recorded and used to track their movement
   * history throughout the session.
   */
  clientGeolocation?: InputMaybe<CoordinatePointInput>;
  /**
   * Always available and can be used to track user sign up conversions /
   * retention rates based on anonymous users (users without userIDs / accounts)
   *  using the application before having an established account. This period before
   * having an account is the time before the creation date of the user's account, and
   * if the creation date of this session falls within that period then this can be
   * used to say the person was converted into a user account, and what they did prior
   * to creating an account was XY and Z based on what we track in Amplitude and in our DB.
   *
   * Provided by Amplitude, since that's easier than setting it up from scratch which can
   * be tedious and unreliable and a hassle to maintain and verify.
   */
  deviceID: Scalars['ID']['input'];
  /** The preferred language of the user 'the browser's current language' */
  language: Scalars['String']['input'];
  /** The platform this user session is currently hosted on. */
  platform: SupportedFonciiPlatforms;
  /**
   * Referrer URL Information: Track where users are coming from (e.g., referral links, social media, direct traffic)
   * to understand your platform's sources of traffic. Useful to see where a user starts their session from,
   * (Instagram, or Twitter, or Reddit, our App, or just google)
   */
  referrer?: InputMaybe<Scalars['String']['input']>;
  /** Optional because not all users are logged in when a session is created */
  userID?: InputMaybe<Scalars['ID']['input']>;
};

export type Cuisine = {
  __typename?: 'Cuisine';
  id: Scalars['ID']['output'];
  imageURL: Scalars['String']['output'];
  localizedNames: SupportedLocalizations;
};

/**
 * Allows for individual 'pages' of data to be returned with a specified
 * number of elements returned per page (limit), as well as a sort order 'ascending or descending'
 * [Not Used]
 */
export type CursorPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  paginationCursor?: InputMaybe<Scalars['ID']['input']>;
  sortOrder?: InputMaybe<SortOrders>;
};

/** User defined properties attributed to this post */
export type CustomUserPostProperties = {
  __typename?: 'CustomUserPostProperties';
  /**
   * User defined tags that best describe the establishment as well as their unique experience.
   * Auto-filled from imported posts if the post has a caption with hashtags
   */
  categories?: Maybe<Array<Scalars['String']['output']>>;
  /**
   * Notes defined by the user. Also auto-filled by post captions from imported user posts from Instagram and other
   * applicable sources if available.
   */
  notes?: Maybe<Scalars['String']['output']>;
  /** A user rating from 1 - 5, rating their experience at the establishment associated with the post */
  rating?: Maybe<Scalars['Float']['output']>;
};

export type DietaryRestriction = {
  __typename?: 'DietaryRestriction';
  id: Scalars['ID']['output'];
  imageURL: Scalars['String']['output'];
  localizedNames: SupportedLocalizations;
};

export type DiscoveredInstagramPostInput = {
  dataSource: InstagramPostDataSourceInput;
};

export type DiscoveredInstagramPostsInput = {
  posts: Array<DiscoveredInstagramPostInput>;
  username: Scalars['String']['input'];
};

export type DiscoveredInstagramUserInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  fullName: Scalars['String']['input'];
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  profilePictureURL?: InputMaybe<Scalars['String']['input']>;
  username: Scalars['String']['input'];
};

export type Expirable = {
  /** Stale date in ISO format that marks when the entity goes 'stale' / expires */
  staleDate: Scalars['String']['output'];
};

/**
 * Describes the possible outputs that will be mixed together in the explore search suggestions
 * Restaurant suggestions for the user to click on, user suggestions, and or popular search terms / queries
 */
export type ExploreSearchAutoCompleteSuggestion = PopularSearchQuerySuggestion | RestaurantAutoCompleteSuggestion | UserAutoCompleteSuggestion | UserPostAutoCompleteSuggestion;

export type ExploreSearchAutoCompleteSuggestionsInput = {
  /** Relevant popular search terms based on analytics [Not used for now, need to setup amplitude pipeline + need more data too] */
  includePopularSearchTerms?: InputMaybe<Scalars['Boolean']['input']>;
  /** True if public user post suggestions should be included in the suggestions, false otherwise */
  includeUserPostSuggestions?: InputMaybe<Scalars['Boolean']['input']>;
  /** True if user suggestions should be included in the suggestions, false otherwise */
  includeUserSuggestions?: InputMaybe<Scalars['Boolean']['input']>;
  injectExternalSuggestions?: InputMaybe<Scalars['Boolean']['input']>;
  searchQuery?: Scalars['String']['input'];
};

export type ExploreSearchEventPayload = {
  autoCompleteSuggestions: Array<Scalars['String']['input']>;
  averagePercentMatchScore?: InputMaybe<Scalars['Float']['input']>;
  averageQualityScore: Scalars['Float']['input'];
  candidateIDs: Array<Scalars['String']['input']>;
  clientLocation?: InputMaybe<CoordinatePointInput>;
  cuisines: Array<Scalars['String']['input']>;
  isManualSearch: Scalars['Boolean']['input'];
  partySize: Scalars['Int']['input'];
  prices: Array<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
  queryID?: InputMaybe<Scalars['String']['input']>;
  reservationDate: Scalars['String']['input'];
  searchLocation: CoordinatePointInput;
  sourceURL: Scalars['String']['input'];
  tags: Array<Scalars['String']['input']>;
  zoomLevel: Scalars['Float']['input'];
};

export type FmIntegrationCredential = Expirable & Identifiable & Updatable & {
  __typename?: 'FMIntegrationCredential';
  /** Some expirable access token, either short lived or long lived depending on the integration */
  accessToken: Scalars['String']['output'];
  /** App-scoped user identifier */
  appUID: Scalars['String']['output'];
  /** User's platform specific username provided by the integration (if any) */
  appUsername?: Maybe<Scalars['String']['output']>;
  /**
   * When enabled the auth token is automatically refreshed when the user starts a new session,
   * (if the token needs to be refreshed in the first place). Default is true.
   * This is so we don't waste operations on users that don't log in for extended periods of time, plus
   * it's bad practice to persist auth tokens indefinitely without some input / interaction from the user.
   */
  autoRefresh: Scalars['Boolean']['output'];
  /**
   * True if the credential is old enough to be refreshed (~ 24 hours or older),
   * false otherwise.
   */
  canRefresh: Scalars['Boolean']['output'];
  creationDate: Scalars['String']['output'];
  /**
   * True the credential is now older than its expiration date and cannot be refreshed. The user must
   * now reconnect the credential in order to use it again, they can also remove it from their existing
   * credentials by revoking it from the client side in case they no longer need to use the integration.
   */
  expired: Scalars['Boolean']['output'];
  /**
   * True if the credential expires within the next 3 days or so, false otherwise.
   * Three days is our arbitrary grace period for the user to manually refresh the credential
   * or mark it as auto-refreshable, but this can change as needed.
   */
  expiresSoon: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  /**
   * The timestamp when the user's last import occurred. This is undefined when
   * the credential is first provisioned, and updated upon successful imports.
   * ISO-8601 formatted date string
   */
  lastImport?: Maybe<Scalars['String']['output']>;
  lastUpdated: Scalars['String']['output'];
  provider: FmIntegrationProviders;
  staleDate: Scalars['String']['output'];
  /** Foncii User ID used to fetch this integration credential */
  userID: Scalars['String']['output'];
};

/** Integration providers that Foncii Maps users can use to import posts from. */
export enum FmIntegrationProviders {
  GoogleMaps = 'GOOGLE_MAPS',
  Instagram = 'INSTAGRAM',
  Tiktok = 'TIKTOK'
}

/** Foncii Maps User */
export type FmUser = Identifiable & Updatable & UserAccount & {
  __typename?: 'FMUser';
  authProviders: Array<AuthProviders>;
  creationDate: Scalars['String']['output'];
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /**
   * False if a person still needs to claim an autogenerated account, true otherwise.
   * Used to trigger the onboarding flow for new users that are just getting access to their unclaimed account.
   */
  isClaimed: Scalars['Boolean']['output'];
  isLoggedIn: Scalars['Boolean']['output'];
  lastLogin: UserLogin;
  lastName: Scalars['String']['output'];
  lastSignOut?: Maybe<Scalars['String']['output']>;
  lastUpdated: Scalars['String']['output'];
  mapName: Scalars['String']['output'];
  phoneNumber?: Maybe<Scalars['String']['output']>;
  /**
   * [Computed] User's primary taste profile's data (if they have a current taste profile or any taste profile for that matter)
   * Null until they create one / if they've deleted all of their existing taste profiles
   */
  primaryTasteProfile?: Maybe<TasteProfile>;
  profilePictureURL?: Maybe<Scalars['String']['output']>;
  /**
   * [Computed] various profile tasks for the user to complete. These are computed and resolved at request
   * time and aren't tied to an updatable state in the DB because some of these tasks can be undone by the user
   * so it's important to keep track of their dynamic states without overcomplicating other services and parts of the user ecosystem.
   */
  profileTasks: Array<ProfileTask>;
  referralCode: Scalars['String']['output'];
  role: UserRoles;
  /** [Computed] All of the target user's taste profiles as edges (an array) */
  tasteProfileEdges: Array<TasteProfile>;
  /**
   * [Computed] Score from 0 - 100 that measures the similarity between the primary user and the
   * secondary user in terms of their taste profiles using the generated embeddings that reside within
   * the taste profile's data model as well as in the database.
   */
  tasteProfileSimilarityScore?: Maybe<Scalars['Float']['output']>;
  username: Scalars['String']['output'];
};


/** Foncii Maps User */
export type FmUserTasteProfileSimilarityScoreArgs = {
  userToCompare?: InputMaybe<Scalars['ID']['input']>;
};

/** Foncii Maps User Post */
export type FmUserPost = Identifiable & Updatable & {
  __typename?: 'FMUserPost';
  creationDate: Scalars['String']['output'];
  /** [Denormalized] Fetched using 'userID' field */
  creator: FmUser;
  /** User rating + notes + custom tags */
  customUserProperties: CustomUserPostProperties;
  /** Data source is optional as posts can be imported and created manually */
  dataSource?: Maybe<PostDataSource>;
  /** [Optional] True if the post should be deleted asynchronously, null otherwise */
  deletionPending?: Maybe<Scalars['Boolean']['output']>;
  /** [Computed] An extension of the 'restaurant' field with reservation times, articles, influencer insights etc as specified by the 'userPersonalizationInput' input */
  fonciiRestaurant?: Maybe<FonciiRestaurant>;
  id: Scalars['ID']['output'];
  /** [Computed] True if parent post ID is defined. Simplifies the process of checking if a post is a child post or not on the client side */
  isChildPost: Scalars['Boolean']['output'];
  /** True if marked as favorited by the author, false otherwise */
  isFavorited: Scalars['Boolean']['output'];
  /** True by default since newly imported posts lack restaurant data */
  isHidden: Scalars['Boolean']['output'];
  lastUpdated: Scalars['String']['output'];
  /** Optional Foncii hosted media, updated after the post is created and the corresponding media is uploaded Foncii's storage containers */
  media?: Maybe<FmUserPostMedia>;
  /** [Computed] True if the post is a video, false otherwise. */
  mediaIsVideo: Scalars['Boolean']['output'];
  /** Optional identifier for identifying which post this post was copied from (if it's a copy), if it's not a copy this field remains undefined */
  parentPostID?: Maybe<Scalars['String']['output']>;
  /** [Denormalized] Fetched using 'fonciiRestaurantID' field, optional because restaurants are associated with posts only after the post is created */
  restaurant?: Maybe<Restaurant>;
  /** [Optional] UTC time in MS indicating the date at midnight (UTC) the post should be deleted, null if the post isn't marked for deletion */
  scheduledDeletionTimestamp?: Maybe<Scalars['Float']['output']>;
  /** ~ Main media field. Only populated if the post is a carousel */
  secondaryMedia?: Maybe<Array<FmUserPostMedia>>;
  /** ID of the user that created the post (Author / Creator) */
  userID: Scalars['String']['output'];
};

/**
 * Modular media encapsulation for Foncii Maps Posts, allows for video and image media resource locators
 * to be stored without breaking changes. Also allows for media edges to also be stored if supported later on.
 */
export type FmUserPostMedia = {
  __typename?: 'FMUserPostMedia';
  mediaType?: Maybe<PostMediaTypes>;
  /** URL pointing towards the hosted media file. */
  mediaURL?: Maybe<Scalars['String']['output']>;
  /** Thumbnail image for video media */
  videoMediaThumbnailURL?: Maybe<Scalars['String']['output']>;
};

/** Generic protocol for typical file uploads to conform to. */
export type FileUploadRequestInput = {
  /** UInt8Array String, defined if uploading, undefined if deleting */
  fileDataBuffer?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the user the upload belongs to */
  userID: Scalars['String']['input'];
};

export type FonciiAnalyticsEventInput = {
  /** The event that was performed. */
  event: FonciiEvents;
  /** The payload of the event. */
  payload: FonciiAnalyticsEventPayloads;
  /**
   * Valid BSON UTC datetime value, UTC date time,
   * the time when this event was recorded. Not used for now.
   * Will be used when event driven architecture is implemented and events
   * are ingested at a delayed rate.
   */
  timestamp: Scalars['String']['input'];
  /** User ID of the user who performed the event (if done by a registered user) */
  userID?: InputMaybe<Scalars['ID']['input']>;
};

/**
 * A collection of the different possible inputs to pass as payloads for
 * the associated event types.
 */
export type FonciiAnalyticsEventPayloads = {
  articlePublicationClickEventPayload?: InputMaybe<ArticlePublicationClickEventPayload>;
  businessWebsiteClickEventPayload?: InputMaybe<BusinessWebsiteClickEventPayload>;
  exploreSearchEventPayload?: InputMaybe<ExploreSearchEventPayload>;
  mapPinClickEventPayload?: InputMaybe<MapPinClickEventPayload>;
  postClickEventPayload?: InputMaybe<PostClickEventPayload>;
  postSourceLinkClickEventPayload?: InputMaybe<PostSourceLinkClickEventPayload>;
  postViewEventPayload?: InputMaybe<PostViewEventPayload>;
  reservationIntentEventPayload?: InputMaybe<ReservationIntentEventPayload>;
  reservationSearchEventPayload?: InputMaybe<ReservationSearchEventPayload>;
  restaurantClickEventPayload?: InputMaybe<RestaurantClickEventPayload>;
  restaurantViewEventPayload?: InputMaybe<RestaurantViewEventPayload>;
  shareEventPayload?: InputMaybe<ShareEventPayload>;
  userGallerySearchEventPayload?: InputMaybe<UserGallerySearchEventPayload>;
  userGalleryViewEventPayload?: InputMaybe<UserGalleryViewEventPayload>;
};

export type FonciiBizAnalyticsEventInput = {
  /** The event that was performed. */
  event: FonciiBizEvents;
  /** The payload of the event. */
  payload: FonciiBizAnalyticsEventPayloads;
  /**
   * Valid BSON UTC datetime value, UTC date time,
   * the time when this event was recorded. Not used for now.
   * Will be used when event driven architecture is implemented and events
   * are ingested at a delayed rate.
   */
  timestamp: Scalars['String']['input'];
  /** User ID of the user who performed the event (if done by a registered user) */
  userID?: InputMaybe<Scalars['ID']['input']>;
};

export type FonciiBizAnalyticsEventPayloads = {
  placeholder?: InputMaybe<Scalars['String']['input']>;
};

/** Foncii business platform events */
export enum FonciiBizEvents {
  Placeholder = 'PLACEHOLDER'
}

/** Foncii consumer platform events */
export enum FonciiEvents {
  ArticlePublicationClick = 'ARTICLE_PUBLICATION_CLICK',
  /** Fired when a user clicks on a restaurant's website link */
  BusinessWebsiteClick = 'BUSINESS_WEBSITE_CLICK',
  ExploreSearch = 'EXPLORE_SEARCH',
  MapPinClick = 'MAP_PIN_CLICK',
  PostClick = 'POST_CLICK',
  PostCreation = 'POST_CREATION',
  PostDeletion = 'POST_DELETION',
  PostSourceLinkClick = 'POST_SOURCE_LINK_CLICK',
  PostUpdate = 'POST_UPDATE',
  PostView = 'POST_VIEW',
  /**
   * A reservation intent is an action intended by a user to make a reservation at an establishment.
   * If the user successfully makes a reservation and reports it to our services then a successful
   * reservation is registered in our system. A reservation is able to be transitioned by
   * external inputs such as a user cancelling a reservation and informing us (or anything we see fit down the line).
   */
  ReservationIntent = 'RESERVATION_INTENT',
  ReservationSearch = 'RESERVATION_SEARCH',
  RestaurantClick = 'RESTAURANT_CLICK',
  RestaurantView = 'RESTAURANT_VIEW',
  SavedRestaurant = 'SAVED_RESTAURANT',
  Share = 'SHARE',
  TasteProfileCreation = 'TASTE_PROFILE_CREATION',
  TasteProfileDeletion = 'TASTE_PROFILE_DELETION',
  TasteProfileUpdate = 'TASTE_PROFILE_UPDATE',
  UnsavedRestaurant = 'UNSAVED_RESTAURANT',
  UserGallerySearch = 'USER_GALLERY_SEARCH',
  /** A view of a user / influencer's map / post gallery */
  UserGalleryView = 'USER_GALLERY_VIEW',
  UserProfilePictureUpdate = 'USER_PROFILE_PICTURE_UPDATE'
}

export type FonciiPostFilterInput = {
  /** Groups posts by restaurant with latest post, as determined by creation date */
  latestByRestaurant?: InputMaybe<Scalars['Boolean']['input']>;
};

export type FonciiRestaurant = {
  __typename?: 'FonciiRestaurant';
  /** [Computed] Aggregated articles that mention this restaurant by name. Limited to 10 (Update when needed) */
  associatedArticlePublicationEdges: Array<ArticlePublication>;
  /** [Computed] Foncii Maps user posts that are directly tied to / associated with this restaurant. Limited to 10 */
  associatedPostEdges: Array<FmUserPost>;
  /** [Computed] Aggregated articles that mention this restaurant by name. Limited to 10 (Update when needed) */
  associatedRestaurantAwardEdges: Array<RestaurantAward>;
  /** Average rating for this restaurant across the Foncii Maps platform (null if no ratings yet) */
  averageFonciiRating?: Maybe<Scalars['Float']['output']>;
  averagePercentMatchScore?: Maybe<Scalars['Float']['output']>;
  /**
   * [Computed] Influencer insights / Foncii Maps user posts that are directly tied to / associated with this restaurant.
   * This differs from 'associatedPostEdges' in the sense that only posts by users with notes or ratings for the given restaurant
   * are returned. Limited to 10
   */
  influencerInsightEdges: Array<FmUserPost>;
  /**
   * [Computed] True if the restaurant is currently open using UTC offset time, false if it's not open, and null if this
   * can't be computed ~ missing UTC offset time
   */
  isOpen?: Maybe<Scalars['Boolean']['output']>;
  /** [Computed] True if the restaurant has a supported reservation integration connected to it, false otherwise. */
  isReservable: Scalars['Boolean']['output'];
  /** True if the restaurant was saved by the target user, false otherwise */
  isSaved: Scalars['Boolean']['output'];
  /**
   * [Computed] The percent match score for a single user, namely the primary user conducting the query.
   * Only available for registered users.
   */
  percentMatchScore?: Maybe<Scalars['Float']['output']>;
  /**
   * [Computed] A metric representing the quality of the restaurant itself. This is
   * essentially half of the percent match score; it's only missing the user taste profile component
   * from the recommendation score. This can be used to sort restaurants based on quality
   * for users that don't have an account yet, a preview to percent match if you will.
   */
  qualityScore: Scalars['Float']['output'];
  /**
   * [Computed] A list of fresh time slots (availabilities) directly from the reservation provider(s)
   * connected to the restaurant's reservation integration (if any). An empty list if no availabilities
   * are present from any of the connected providers, or if a reservation integration does not exist
   * for the restaurant yet.
   */
  reservationAvailabilityEdges: Array<ReservationAvailability>;
  /**
   * [Computed] True if there are reservations available for target time frame (desired time frame passed
   * into resolver), false otherwise and also when the restaurant doesn't have a reservation integration yet.
   */
  reservationsAvailable: Scalars['Boolean']['output'];
  /**
   * Foncii restaurant data aggregated, pre-processed, and post-processed from various sources
   * external sources.
   */
  restaurant: Restaurant;
};


export type FonciiRestaurantAssociatedPostEdgesArgs = {
  postsToExclude?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type FonciiRestaurantAveragePercentMatchScoreArgs = {
  coordinates?: InputMaybe<CoordinatePointInput>;
  userIDs?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type FonciiRestaurantInfluencerInsightEdgesArgs = {
  postsToExclude?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type FonciiRestaurantIsSavedArgs = {
  userPersonalizationInput?: InputMaybe<UserPersonalizationInput>;
};


export type FonciiRestaurantPercentMatchScoreArgs = {
  userPersonalizationInput?: InputMaybe<UserPersonalizationInput>;
};


export type FonciiRestaurantReservationAvailabilityEdgesArgs = {
  userPersonalizationInput?: InputMaybe<UserPersonalizationInput>;
};


export type FonciiRestaurantReservationsAvailableArgs = {
  userPersonalizationInput?: InputMaybe<UserPersonalizationInput>;
};

export type FonciiRestaurantSearchFilterInput = {
  /** Only return restaurants that are currently available for reservation */
  reservableOnly?: Scalars['Boolean']['input'];
};

export type FonciiRestaurantSearchInput = {
  coordinates: CoordinatePointInput;
  /** Allows client side filters to be applied to the search process */
  fonciiRestaurantSearchFilterInput?: InputMaybe<FonciiRestaurantSearchFilterInput>;
  searchQuery?: Scalars['String']['input'];
  searchRadius: Scalars['Float']['input'];
  userPersonalizationInput: UserPersonalizationInput;
};

export type FonciiRestaurantSearchOutput = {
  __typename?: 'FonciiRestaurantSearchOutput';
  fonciiRestaurants: Array<FonciiRestaurant>;
  /**
   * An id that links this output to a search event recorded in the database. This allows the client
   * to attribute this query to other conversion events that stem from this search event, further allowing
   * us to track and analyze user activity pathways, behavioral patterns, and UX KPIs.
   */
  queryID: Scalars['String']['output'];
};

/** Foncii User */
export type FonciiUser = Identifiable & Updatable & UserAccount & {
  __typename?: 'FonciiUser';
  authProviders: Array<AuthProviders>;
  creationDate: Scalars['String']['output'];
  email: Scalars['String']['output'];
  firstFavorites?: Maybe<Array<Restaurant>>;
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isLoggedIn: Scalars['Boolean']['output'];
  isPhoneNumberVerified: Scalars['Boolean']['output'];
  lastLogin: UserLogin;
  lastSignOut?: Maybe<Scalars['String']['output']>;
  lastUpdated: Scalars['String']['output'];
  notificationsEnabled: Scalars['Boolean']['output'];
  phoneNumber?: Maybe<Scalars['String']['output']>;
  profilePictureURL?: Maybe<Scalars['String']['output']>;
  referralCode: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

/**
 * Keeps track of the different tasks that a new user
 * can complete for their Foncii user profile.
 */
export enum FonciiUserProfileTasks {
  ConnectSocialMedia = 'CONNECT_SOCIAL_MEDIA',
  CreateAccount = 'CREATE_ACCOUNT',
  CreateTastProfile = 'CREATE_TAST_PROFILE',
  InviteFriend = 'INVITE_FRIEND'
}

export type FullTextGeospatialPostSearchInput = {
  coordinates: CoordinatePointInput;
  searchQuery?: Scalars['String']['input'];
  searchRadius: Scalars['Float']['input'];
};

export type GallerySearchAutoCompleteSuggestionsInput = {
  galleryAuthorID: Scalars['String']['input'];
  searchQuery?: Scalars['String']['input'];
};

/** Defines a basic response for understanding the outcome of a mutation operation */
export type GenericMutationResponse = {
  __typename?: 'GenericMutationResponse';
  errors?: Maybe<Array<ClientError>>;
  statusCode: Scalars['Int']['output'];
};

export type GetSavedRestaurantsForInput = {
  /** The index of the current pagination page */
  paginationPageIndex?: Scalars['Int']['input'];
  /**
   * The amount of saved restaurants to return, this will
   * also be used client side to determine the pagination offset and
   * next page index based on the amount of items returned.
   */
  resultsPerPage: Scalars['Int']['input'];
  userPersonalizationInput: UserPersonalizationInput;
};

export type GoogleRestaurantProperties = PlaceProperties & {
  __typename?: 'GoogleRestaurantProperties';
  externalURL?: Maybe<Scalars['String']['output']>;
  rating?: Maybe<Scalars['Float']['output']>;
};

export type HtmlMetadataResponse = {
  __typename?: 'HTMLMetadataResponse';
  description: Scalars['String']['output'];
  keywords: Array<Scalars['String']['output']>;
  /** Optional because the user can have 0 posts sometimes */
  previewImageURL?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

/**
 * Simple interface that necessitates the use of an identifier for entities
 * that must be differentiated from other similar entities.
 */
export type Identifiable = {
  id: Scalars['ID']['output'];
};

export type ImpersonateUserInput = {
  impersonatedEmail?: InputMaybe<Scalars['String']['input']>;
  impersonatedFirebaseID?: InputMaybe<Scalars['String']['input']>;
  impersonatedPhoneNumber?: InputMaybe<Scalars['String']['input']>;
  impersonatedUserName?: InputMaybe<Scalars['String']['input']>;
  userID: Scalars['ID']['input'];
};

export type ImportPostsInput = {
  classifyPosts?: InputMaybe<Scalars['Boolean']['input']>;
  integrationCredentialID: Scalars['String']['input'];
  isFirstImport?: InputMaybe<Scalars['Boolean']['input']>;
  straddleImport?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The different possible categories for the influencer leaderboard */
export enum InfluencerLeaderboardCategory {
  New = 'NEW',
  TopRated = 'TOP_RATED',
  Trending = 'TRENDING'
}

export type IngestArticlePublicationDetailsInput = {
  articlePublicationDetails: Array<ArticlePublicationDetailInput>;
};

export type IngestRestaurantAwardDetailsInput = {
  restaurantAwardDetails: Array<RestaurantAwardDetailInput>;
};

export type IngestRestaurantReservationDetailsInput = {
  provider?: InputMaybe<ReservationProviders>;
  restaurantReservationDetails: Array<RestaurantReservationDetailInput>;
};

export type InstagramPostDataSourceInput = {
  caption?: InputMaybe<Scalars['String']['input']>;
  creationDate: Scalars['String']['input'];
  liveSourceUID: Scalars['String']['input'];
  media: UserPostMediaInput;
  permalink: Scalars['String']['input'];
  secondaryMedia?: InputMaybe<Array<UserPostMediaInput>>;
  sourceUID: Scalars['String']['input'];
};

export type LocalInfluencerLeaderboardEntry = {
  __typename?: 'LocalInfluencerLeaderboardEntry';
  category: InfluencerLeaderboardCategory;
  /**
   * The total amount of restaurants the influencer has visited in
   * the given search area
   */
  totalLocalRestaurantsVisited: Scalars['Int']['output'];
  user: FmUser;
};

export type LocalInfluencerLeaderboardInput = {
  coordinates: CoordinatePointInput;
  searchRadius: Scalars['Float']['input'];
};

export type MajorCity = {
  __typename?: 'MajorCity';
  abbreviatedState: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  state: Scalars['String']['output'];
};

export type MapPinClickEventPayload = {
  authorUID?: InputMaybe<Scalars['ID']['input']>;
  fonciiRestaurantID: Scalars['ID']['input'];
  percentMatchScore?: InputMaybe<Scalars['Float']['input']>;
  postID?: InputMaybe<Scalars['ID']['input']>;
  qualityScore: Scalars['Float']['input'];
  sourceURL: Scalars['String']['input'];
};

export type MealType = {
  __typename?: 'MealType';
  id: Scalars['ID']['output'];
  localizedNames: SupportedLocalizations;
};

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Method used to aggregate a singular restaurant based on the given input. This can be triggered by users
   * when they select a restaurant from a search bar's autocomplete drop down menu if the restaurant doesn't already exist in our
   * database.
   */
  aggregateRestaurant?: Maybe<Restaurant>;
  /**
   * Locates restaurants around the given coordinate point, fetches data points from multiple external data providers
   * transforms the retrieved data, aggregates all the candidates from within the search area and pushes them
   * to our database where they're cached for ~ 3 months, and refreshed after that in order to ensure that up-to-date information is being displayed
   * A maximum of 50 restaurants are aggregated by this operation and returned as output for any external usage of the immediate data
   * Note: The limit is capped at 50 to reduce the time it takes to aggregate restaurant data to the database ~ 6 seconds vs ~ 12 seconds for 100 entries
   */
  aggregateRestaurantsAround: Array<Restaurant>;
  autoGenerateTasteProfile: TasteProfile;
  /**
   * Connects a new integration credential for the given user ID and integration provider if one doesn't already exist
   * or refreshes a prexisting one using the new input when a user chooses to manually refresh the credential.
   * Note: The backend tries to refresh this credential automatically when the user is active, manual refreshes are
   * up to the user and are required when the credential eventually expires.
   */
  connectIntegration?: Maybe<FmIntegrationCredential>;
  createTasteProfile: TasteProfile;
  /** Creates the user with the given input and returns the created user if the operation was successful, null otherwise */
  createUserFM?: Maybe<FmUser>;
  /**
   * Creates a new Foncii Maps user post for the user with provided ID. After being created the
   * user can simply update their post with the information they wish including a custom image or video
   * to be displayed. The post will be hidden until they upload the appropriate media to accompany the post.
   */
  createUserPost?: Maybe<FmUserPost>;
  /**
   * Creates a new session for the user with the given information
   * and returns a session ID if the session was created successfully,
   * and null if a new session could not be created at this time.
   */
  createUserSession?: Maybe<UserSession>;
  deleteAllTasteProfilesForUser: Scalars['Boolean']['output'];
  /**
   * Marks the target user post for async deletion from the database alongside its corresponding media from the cloud storage bucket. Any child posts
   * will still be attached to the parent post in a many-to-one relationship, even if the parent post is deleted.
   */
  deletePost: Scalars['Boolean']['output'];
  deleteTasteProfile: Scalars['Boolean']['output'];
  /**
   * Deletes the given FM User and all of their posts, erasing their digital footprint from our services excluding analytics
   * True if the operation was successful, false otherwise.
   */
  deleteUserFM: Scalars['Boolean']['output'];
  /**
   * Copy and create a new post from another post's attributes. The parent post is referenced by the child via ID
   * and any children of the child automatically become children of the parent post in a many-to-one relationship.
   */
  duplicatePost?: Maybe<FmUserPost>;
  /**
   * Marks the user session as terminated when the user closes their
   * client or logs out. User sessions that die out due to lack of heart
   * beat are not marked as terminated.
   */
  endUserSession: Scalars['Boolean']['output'];
  /** Endpoint for impersonating a user. Currently fetches the user object */
  fetchImpersonatedUserFM?: Maybe<FmUser>;
  /**
   * Forcibly deletes the post and skips over the allotted 30 day grace period for the user to choose to
   * undo deletion of their post. Note: This is only for posts marked for deletion by the user that haven't already been deleted yet.
   */
  forceDeletePost: Scalars['Boolean']['output'];
  generateDefaultTasteProfile: TasteProfile;
  /**
   * Imports the user's posts using the target Foncii Maps integration.
   * Returns true if the import process succeeded, and false if it doesn't / throws
   *
   * input:
   * integrationCredentialID: ID! // ID of the integration credential to use for importing posts
   * straddleImport?: boolean, // True if all supported import methods should be used (ex.) Basic Display + Scraper), true by default
   * classifyPosts?: boolean, // True if posts should be automatically classified, false otherwise, true by default
   * isFirstImport?: boolean, // // True if the user just created their account and are importing posts for the first time, false by default
   */
  importPosts: Scalars['Boolean']['output'];
  /**
   * Ingests article data from the publication scrapers and stores them in our database for fast access
   * as these documents will be indexed as opposed to a federated approach with S3 which is much slower.
   */
  ingestArticlePublicationDetails: Scalars['Boolean']['output'];
  /**
   * Processes aggregated posts from Instagram that are also classified with Google Place IDs and
   * ingests them into the Foncii ecosystem if they don't already exist within. For those that already
   * exist they're simply updated with the new data (if any). And any pending or new media that should be
   * uploaded are also handled. Note: This is used for the automatic post import functionality such that users
   * essentially won't have to touch their map at all (ideally).
   */
  ingestClassifiedDiscoveredInstagramPosts: Array<FmUserPost>;
  /**
   * Processes aggregated posts from Instagram and ingests them into the Foncii ecosystem if they don't
   * already exist within. For those that already exist they're simply updated with the new data (if any).
   * And any pending or new media that should be uploaded are also handled.
   */
  ingestDiscoveredInstagramPosts: Array<FmUserPost>;
  ingestDiscoveredInstagramUser?: Maybe<FmUser>;
  /**
   * Ingests award data from the award scrapers (or CSV) and stores them in our database for fast access
   * as these documents will be indexed as opposed to a federated approach with S3 which is much slower.
   */
  ingestRestaurantAwardDetails: Scalars['Boolean']['output'];
  /**
   * Used to ingest aggregated reservation detail information from the reservation scraper
   * Matches reservation details to existing foncii restaurants and creates / updates reservation integrations
   * based on the ingested data. If a match doesn't exist within the database already then a match is
   * aggregated using our aggregation pipeline combined with Google place search.
   */
  ingestRestaurantReservationDetails: Scalars['Boolean']['output'];
  /**
   * Tracks a client based user login event, not actually responsible for signing a user in and generating an auth credential.
   * Returns the logged in user's data since this mutation is supposed to only be triggered when the user logs in successfully,
   * null if an error occurs for some external reason.
   */
  loginUserFM?: Maybe<FmUser>;
  /**
   * Allows the user to manually refresh the integration credential associated with the given
   * input (if the credential is mature ~ 24 hours or older)
   */
  refreshIntegration?: Maybe<FmIntegrationCredential>;
  removePrimaryUserTasteProfile: Scalars['Boolean']['output'];
  /** Revokes all integration credentials for the given user ID. */
  revokeAllIntegrationCredentials: Scalars['Boolean']['output'];
  /**
   * Revokes the target integration credential for the given user ID and integration provider,
   * effectively cutting off Foncii Maps' access to the user's data source until they reconnect the integration
   */
  revokeIntegrationCredential: Scalars['Boolean']['output'];
  /**
   * Saves the target restaurant to the user's collection of saved restaurants (if not already present). Also
   * attributes the saved restaurant to a specific post if the restaurant was saved from a user post.
   */
  saveRestaurant: Scalars['Boolean']['output'];
  /**
   * Keeps the user session alive by sending a periodic heart beat
   * from the client here to the server. If a heart beat isn't received within
   * a certain period of time the session is assumed to be not alive anymore.
   * When the user tries to send a new heart beat for an unalive session
   * the dead session is retired and a new one is created represented by the
   * ID output. If the input is invalid and a session does not exist for the given
   * ID
   */
  sendUserSessionHeartBeat?: Maybe<UserSession>;
  /**
   * Updates the auto refresh attribute associated with integration credentials to
   * be true if enabled, and false if disabled. This attribute controls the background behavior
   * associated with each credential (i.e whether or not to refresh the credential automatically)
   */
  setAutoRefreshStateForCredential: Scalars['Boolean']['output'];
  /**
   * Uploads a universal Foncii profile picture to use across the different platform based on a single permalink,
   * or deletes the user's existing profile picture. A verbose error is thrown if the update fails for some reason,
   * so if the response is defined / true that means the update was successful.
   */
  setUserProfilePicture: Scalars['Boolean']['output'];
  /**
   * Tracks a Foncii Maps client based user sign out event, not responsible for physically signing a user out and revoking auth credentials
   * True if the operation was successful, false otherwise.
   */
  signOutUserFM: Scalars['Boolean']['output'];
  switchPrimaryUserTasteProfile: Scalars['Boolean']['output'];
  trackFonciiBizEvent: Scalars['Boolean']['output'];
  trackFonciiEvent: Scalars['Boolean']['output'];
  /** Unmarks the post for deletion. Note: This is only for posts marked for deletion by the user that haven't already been deleted yet. */
  undeletePost: Scalars['Boolean']['output'];
  /** Unsaves the target restaurant from the user's collection of saved restaurants (if present). */
  unsaveRestaurant: Scalars['Boolean']['output'];
  /**
   * Updates the user's map name given the new map name provided, an error is thrown if the map name is already taken or if the user doesn't exist
   * True if the operation was successful, false otherwise.
   */
  updateMapNameFM: Scalars['Boolean']['output'];
  /** Updates the post's custom user properties all at once to keep parity between the individual properties */
  updatePostCustomUserProperties?: Maybe<FmUserPost>;
  /**
   * Marks the post as favorited or not favorited
   * True if the operation was successful, false otherwise.
   */
  updatePostFavoriteState?: Maybe<Scalars['Boolean']['output']>;
  /**
   * Updates the post's media information with the provided media URL and type. Note: This is only for
   * media uploaded through the client to the Foncii CDN. Do not pass in a URL that points to an object
   * that's not of the supported type and or is not hosted in the Foncii CDN storage bucket.
   */
  updatePostMedia?: Maybe<FmUserPost>;
  /** Updates the post's restaurant data by adding corresponding Google and Yelp data by using Google Autocomplete as a data anchor */
  updatePostRestaurantData?: Maybe<FmUserPost>;
  updateTasteProfile: Scalars['Boolean']['output'];
  /**
   * Updates the user's email address with the given valid email address string, please run REGEX in the client before submitting email addresses,
   * REGEX is also ran here, but doing so on the client is good practice and allows the user to makes instant edits.
   * True if the operation was successful, false otherwise.
   */
  updateUserEmailFM: Scalars['Boolean']['output'];
  /** True if the password update succeeded in the external auth system, false otherwise (hashes are the same) */
  updateUserPasswordFM: Scalars['Boolean']['output'];
  updateUserPhoneNumberFM: Scalars['Boolean']['output'];
};


export type MutationAggregateRestaurantArgs = {
  input?: InputMaybe<AggregateRestaurantInput>;
};


export type MutationAggregateRestaurantsAroundArgs = {
  input?: InputMaybe<AggregateRestaurantsAroundInput>;
};


export type MutationAutoGenerateTasteProfileArgs = {
  selectedRestaurantIDs: Array<Scalars['ID']['input']>;
  userID: Scalars['ID']['input'];
};


export type MutationConnectIntegrationArgs = {
  input: ConnectIntegrationInput;
};


export type MutationCreateTasteProfileArgs = {
  tasteProfileInput: TasteProfileInput;
};


export type MutationCreateUserFmArgs = {
  input: CreateNewFmUserInput;
};


export type MutationCreateUserPostArgs = {
  input: CreateFmUserPostInput;
};


export type MutationCreateUserSessionArgs = {
  input?: InputMaybe<CreateUserSessionInput>;
};


export type MutationDeleteAllTasteProfilesForUserArgs = {
  userID: Scalars['ID']['input'];
};


export type MutationDeletePostArgs = {
  input: UpdateFmUserPostUserInput;
};


export type MutationDeleteTasteProfileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserFmArgs = {
  userID: Scalars['ID']['input'];
};


export type MutationDuplicatePostArgs = {
  sourcePostID: Scalars['ID']['input'];
};


export type MutationEndUserSessionArgs = {
  sessionID: Scalars['ID']['input'];
};


export type MutationFetchImpersonatedUserFmArgs = {
  input: ImpersonateUserInput;
};


export type MutationForceDeletePostArgs = {
  input: UpdateFmUserPostUserInput;
};


export type MutationGenerateDefaultTasteProfileArgs = {
  userID: Scalars['ID']['input'];
};


export type MutationImportPostsArgs = {
  input: ImportPostsInput;
};


export type MutationIngestArticlePublicationDetailsArgs = {
  input?: InputMaybe<IngestArticlePublicationDetailsInput>;
};


export type MutationIngestClassifiedDiscoveredInstagramPostsArgs = {
  input?: InputMaybe<ClassifiedDiscoveredInstagramPostsInput>;
};


export type MutationIngestDiscoveredInstagramPostsArgs = {
  input?: InputMaybe<DiscoveredInstagramPostsInput>;
};


export type MutationIngestDiscoveredInstagramUserArgs = {
  input: DiscoveredInstagramUserInput;
};


export type MutationIngestRestaurantAwardDetailsArgs = {
  input?: InputMaybe<IngestRestaurantAwardDetailsInput>;
};


export type MutationIngestRestaurantReservationDetailsArgs = {
  input?: InputMaybe<IngestRestaurantReservationDetailsInput>;
};


export type MutationLoginUserFmArgs = {
  input: UserLoginInput;
};


export type MutationRefreshIntegrationArgs = {
  input: IntegrationCredentialForUserInput;
};


export type MutationRemovePrimaryUserTasteProfileArgs = {
  userID: Scalars['ID']['input'];
};


export type MutationRevokeAllIntegrationCredentialsArgs = {
  userID: Scalars['ID']['input'];
};


export type MutationRevokeIntegrationCredentialArgs = {
  provider: FmIntegrationProviders;
  userID: Scalars['ID']['input'];
};


export type MutationSaveRestaurantArgs = {
  input?: InputMaybe<RestaurantSaveInput>;
};


export type MutationSendUserSessionHeartBeatArgs = {
  input?: InputMaybe<UserSessionHeartBeatInput>;
};


export type MutationSetAutoRefreshStateForCredentialArgs = {
  autoRefreshEnabled: Scalars['Boolean']['input'];
  integrationCredentialID: Scalars['ID']['input'];
};


export type MutationSetUserProfilePictureArgs = {
  input: SetUserProfilePictureInput;
};


export type MutationSignOutUserFmArgs = {
  userID: Scalars['ID']['input'];
};


export type MutationSwitchPrimaryUserTasteProfileArgs = {
  tasteProfileID: Scalars['ID']['input'];
  userID: Scalars['ID']['input'];
};


export type MutationTrackFonciiBizEventArgs = {
  input: FonciiBizAnalyticsEventInput;
};


export type MutationTrackFonciiEventArgs = {
  input: FonciiAnalyticsEventInput;
};


export type MutationUndeletePostArgs = {
  input: UpdateFmUserPostUserInput;
};


export type MutationUnsaveRestaurantArgs = {
  input?: InputMaybe<RestaurantSaveInput>;
};


export type MutationUpdateMapNameFmArgs = {
  input: UpdateFmUserMapNameInput;
};


export type MutationUpdatePostCustomUserPropertiesArgs = {
  input: UpdateFmUserPostCustomUserPropertiesInput;
};


export type MutationUpdatePostFavoriteStateArgs = {
  input: UpdateFmUserPostFavoriteStateInput;
};


export type MutationUpdatePostMediaArgs = {
  input: UpdateFmUserPostMediaInput;
};


export type MutationUpdatePostRestaurantDataArgs = {
  input: UpdateFmUserPostRestaurantDataInput;
};


export type MutationUpdateTasteProfileArgs = {
  id: Scalars['ID']['input'];
  tasteProfileInput: TasteProfileInput;
};


export type MutationUpdateUserEmailFmArgs = {
  email: Scalars['String']['input'];
  userID: Scalars['ID']['input'];
};


export type MutationUpdateUserPasswordFmArgs = {
  password: Scalars['String']['input'];
  userID: Scalars['ID']['input'];
};


export type MutationUpdateUserPhoneNumberFmArgs = {
  phoneNumber: Scalars['String']['input'];
  userID: Scalars['ID']['input'];
};

export type OperatingHours = {
  __typename?: 'OperatingHours';
  Friday?: Maybe<Scalars['String']['output']>;
  Monday?: Maybe<Scalars['String']['output']>;
  Saturday?: Maybe<Scalars['String']['output']>;
  Sunday?: Maybe<Scalars['String']['output']>;
  Thursday?: Maybe<Scalars['String']['output']>;
  Tuesday?: Maybe<Scalars['String']['output']>;
  Wednesday?: Maybe<Scalars['String']['output']>;
};

/**
 * Paginates a list of results based on the specified page, limit,
 * sort key, and sort order parameters to ensure each following page is
 * successive of the previous page.
 */
export type PaginationInput = {
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
  sortKey?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<SortOrders>;
};

/** Properties shared between Google and Yelp */
export type PlaceProperties = {
  /** An external link to the site where the data was sourced for this place (i.e Yelp or Google) */
  externalURL?: Maybe<Scalars['String']['output']>;
  /** The average rating for this place provided by the external platform these properties are attributed to */
  rating?: Maybe<Scalars['Float']['output']>;
};

export type PlaceSearchOutput = {
  __typename?: 'PlaceSearchOutput';
  /** The name + location description for the place found with the search query (if any) */
  description: Scalars['String']['output'];
  /** The corresponding Google Place ID of the place found with the search query (if any) */
  googlePlaceID: Scalars['String']['output'];
  /**
   * The similarity between the search query and the found place's name. With a higher
   * similarity indicating a closer relationship between the search query string and the
   * restaurant name string, and the inverse for dissimilar query to place name comparisons.
   *
   * This can be used to further gauge whether or not the found place is what was truly
   */
  similarityScore: Scalars['Float']['output'];
};

export type PopularSearchQuerySuggestion = AutoCompleteSuggestion & {
  __typename?: 'PopularSearchQuerySuggestion';
  /**  Human-readable description [popular search term]  */
  description: Scalars['String']['output'];
  /**  Not used for this type, just implemented for protocol conformance  */
  previewImageURL?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type PostClickEventPayload = {
  authorUID: Scalars['ID']['input'];
  autoCompleteQuery?: InputMaybe<Scalars['String']['input']>;
  fonciiRestaurantID: Scalars['ID']['input'];
  percentMatchScore?: InputMaybe<Scalars['Float']['input']>;
  postID: Scalars['ID']['input'];
  qualityScore: Scalars['Float']['input'];
  sourceFonciiRestaurantID?: InputMaybe<Scalars['ID']['input']>;
  sourcePostID?: InputMaybe<Scalars['ID']['input']>;
  sourceURL?: InputMaybe<Scalars['String']['input']>;
};

/** Modular data source populated by Foncii Maps Integrations that aggregate social media posts from external sources. */
export type PostDataSource = Creatable & {
  __typename?: 'PostDataSource';
  /** Simple description of the post generated by the user, optional b/c some sources might not support captions or they may be optional there as well */
  caption?: Maybe<Scalars['String']['output']>;
  /** ISO-8601 formatted original creation date of the post sourced from the data source. */
  creationDate: Scalars['String']['output'];
  /**
   * The real non-app-scoped UID of the post's data source. This is the same UID you'd see when viewing the data source on the
   * provider's production site. This is either populated when scraping some data provider instead of directly connecting to
   * their dedicated integration API service. Or when parsing the permalink of newly imported posts from a dedicated integration. The
   * purpose of this field is to prevent duplicate data from being inserted into the database by having a permanent source of truth alongside
   * the existing sourceUID field which is used to compare integration imported posts to other integration imported posts; now both
   * scraped and imported posts can now be compared and deduplicated freely.
   */
  liveSourceUID?: Maybe<Scalars['String']['output']>;
  /**
   * Third-party media source, expirable in 1-2 days if Instagram is the source provider.
   * Any media sourced from here must be persisted to our storage containers immediately.
   */
  media: FmUserPostMedia;
  /** Non-expirable link to the original post, optional in the case of Instagram where posts include Copyrighted media / audio */
  permalink?: Maybe<Scalars['String']['output']>;
  /** Source Identifier */
  provider: FmIntegrationProviders;
  /**
   * Secondary media / media edges. Populated in the case of carousel post types
   * Any media sourced from here must be persisted to our storage containers immediately,
   * expirable in 1-2 days if Instagram is the source provider.
   */
  secondaryMedia?: Maybe<Array<FmUserPostMedia>>;
  /** The app-scoped (Facebook) or global unique identifier (UID) of the post directly from the original data source */
  sourceUID: Scalars['String']['output'];
};

/** All supported media formats that a Foncii Maps post can have. */
export enum PostMediaTypes {
  CarouselAlbum = 'CAROUSEL_ALBUM',
  Image = 'IMAGE',
  Video = 'VIDEO'
}

export type PostSourceLinkClickEventPayload = {
  authorUID: Scalars['ID']['input'];
  destinationPlatform: FmIntegrationProviders;
  destinationURL: Scalars['String']['input'];
  fonciiRestaurantID: Scalars['ID']['input'];
  percentMatchScore?: InputMaybe<Scalars['Float']['input']>;
  postID: Scalars['ID']['input'];
  qualityScore: Scalars['Float']['input'];
  sourceURL: Scalars['String']['input'];
};

export type PostViewEventPayload = {
  authorUID: Scalars['ID']['input'];
  fonciiRestaurantID: Scalars['ID']['input'];
  percentMatchScore?: InputMaybe<Scalars['Float']['input']>;
  postID: Scalars['ID']['input'];
  qualityScore: Scalars['Float']['input'];
  referrer?: InputMaybe<Scalars['String']['input']>;
  sharedEventID?: InputMaybe<Scalars['ID']['input']>;
};

/**
 * User Profile Tasks
 * Computed on a field level to determine if each task was fulfilled.
 */
export type ProfileTask = {
  __typename?: 'ProfileTask';
  id: FonciiUserProfileTasks;
  isComplete: Scalars['Boolean']['output'];
};

export type Publication = {
  /** The description meta tag of the article's web page loaded and parsed by this server (can't be done client side due to cross site blocks) */
  description?: Maybe<Scalars['String']['output']>;
  /** [Computed] The favicon for the website (may not exist, depends on the website) but usually located at 'example.com/favicon.ico', uses the parsed web domain */
  faviconLink: Scalars['String']['output'];
  /** The title of the article */
  title?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
  /** [Computed] The domain name of the website provided by the article's URL */
  websiteDomain: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  /**
   * Computes similarity score between the two users with the given IDs if both
   * have a valid primary taste profile associated with their account. Null if no
   * taste profiles exist for either.
   */
  computeTasteProfileSimilarity?: Maybe<Scalars['Float']['output']>;
  doesEmailExistFM: Scalars['Boolean']['output'];
  doesPhoneNumberExistFM: Scalars['Boolean']['output'];
  doesUserHaveATasteProfile: Scalars['Boolean']['output'];
  doesUsernameExistFM: Scalars['Boolean']['output'];
  /**
   * Provides a list of auto-complete suggestions for restaurants / users / popular search terms based on the given search query.
   * The auto-complete suggestions in the list are injected from multiple sources (Foncii's own database as well as Google's places API),
   * and these origins are also enumerated in the returned data to keep track of where the suggestion is coming from.
   * This is used by users when selecting their favorite restaurants when first auto-generating their taste profile,
   * specifically the search bar's autocomplete drop down menu where the user can select a restaurant directly and then
   * trigger the full search for restaurants based on the selected auto-complete suggestion.
   */
  exploreSearchAutoCompleteSuggestions: Array<ExploreSearchAutoCompleteSuggestion>;
  /** Returns a non-paginated full list of all supported cuisines */
  fetchAllCuisines: Array<Cuisine>;
  /** Returns a non-paginated full list of all supported food restrictions */
  fetchAllDietaryRestrictions: Array<DietaryRestriction>;
  /** Returns a non-paginated full list of all supported major cities */
  fetchAllMajorCities: Array<MajorCity>;
  /** Returns a non-paginated full list of all supported meal types */
  fetchAllMealTypes: Array<MealType>;
  /** Returns the computed influencer map leaderboard for the given area of interest */
  fetchLocalInfluencerLeaderboard: Array<LocalInfluencerLeaderboardEntry>;
  /** Returns the most commonly used tags amongst users */
  fetchPopularUserTags: Array<Scalars['String']['output']>;
  fetchUserBusinessWebsiteAnalyticsDashboard?: Maybe<UserBusinessWebsiteAnalyticsDashboard>;
  /**
   * Returns a combination of analytics metrics specific to the user's map. Note: If the timespan
   * selected is older than the user's account then null is returned as the request is invalid and won't
   * return valid data.
   */
  fetchUserMapAnalyticsDashboard?: Maybe<UserMapAnalyticsDashboard>;
  fetchUserReservationsIntentsAnalyticsDashboard?: Maybe<UserReservationIntentsAnalyticsDashboard>;
  /** Fetches all posts (visible and hidden) made by the user with the specified user ID | For populating author galleries */
  findAllPostsByUserID: UserPostGalleryOutput;
  /** A standalone operation for querying article publications outside of Foncii Restaurant based resolvers. */
  findAssociatedArticlesFor: ArticlePublicationStandaloneOutput;
  /**
   * Returns a list of posts that are directly associated with the given restaurant if the restaurant
   * exists. A list of post IDs to exclude from the query is also allowed to avoid returning unwanted edges.
   */
  findAssociatedPostsFor: Array<FmUserPost>;
  /** A standalone operation for querying restuarant awards outside of Foncii Restaurant based resolvers. */
  findAssociatedRestaurantAwardsFor: RestaurantAwardStandaloneOutput;
  /** Used to find the days that are available for reservation used in the calendar rendering and next available table day */
  findAvailableReservationDaysFor?: Maybe<AvailableReservationDays>;
  /**
   * Queries our restaurant database to find the Foncii restaurant that best matches the given query (if possible), and returns the
   * google Place ID associated with it. If no match can be found from our database then we use the Google Places autocomplete functionality
   * to find it the best we can return the best result from that strategy (again, if possible). The Google Places is a fallback method
   * in this situation since this is designed to lean on our own data for cost purposes. As an extra step for cost mitigation the google places
   * fetch can be turned off entirely such that only our database is used to search and return the best possible candidate.
   *
   * Note: useGoogleFallback is set to 'True' by default if not given.
   */
  findGooglePlaceIDForPlaceSearchQuery?: Maybe<PlaceSearchOutput>;
  /** Queries a single post using the provided post ID, used for detail views to fetch isolated data when sharing links */
  findPostByID?: Maybe<FmUserPost>;
  /** Fetches public posts made by the user with the specified username (if any) | For populating visited post galleries */
  findPublicPostsByUsername: UserPostGalleryOutput;
  /**
   * Used to refresh reservation availabilities for a given restaurant when the user is in the detail view of a restaurant / post.
   * This is used to ensure that the reservation availability data is up-to-date and accurate when the user is viewing the time table.
   */
  findReservationAvailabilitiesFor: Array<ReservationAvailability>;
  /** Finds and returns a list of restaurants that are similar to the given restaurant ID via ANN vector embedding search. */
  findRestaurantsSimilarTo: Array<FonciiRestaurant>;
  findTasteProfilesForUser?: Maybe<Array<TasteProfile>>;
  findUserByIDFM?: Maybe<FmUser>;
  findUserByUsernameFM?: Maybe<FmUser>;
  /**
   * Advanced search using semantic or geospatial search to find restaurants within the given search area that also match
   * the text search query and any additional properties to filter the results by. Returns denormalized foncii restaurants with
   * creator, post, and restaurant data attached from the appropriate database aggregation pipelines.
   */
  fonciiRestaurantSearch: FonciiRestaurantSearchOutput;
  /**
   * Provides a list of user post auto-complete suggestions for the target user's gallery. Note: No popular search terms
   * are injectable for user galleries at this time, but this feature may be added in the future with a simple addition to
   * the existing resolver code.
   */
  gallerySearchAutoCompleteSuggestions: Array<UserPostAutoCompleteSuggestion>;
  getAllActiveUserSessions: Array<UserSession>;
  getAllAliveUserSessions: Array<UserSession>;
  getAllDeviceSessionsForUser: Array<UserSession>;
  /** Returns a list of all posts marked for deletion */
  getAllPostsMarkedForDeletion: Array<FmUserPost>;
  /**
   * Returns a list of all users up to the specified limit.
   * Provide pageIndex to skip a specific amount of pages when
   * paginating. So +1 to go to the next page of results and so on.
   * +1 with a limit of 10,000 would return the next 10,000. 20,000 in total
   * but the first 10,000 was skipped due to the +1 page index
   */
  getAllPublicPosts: Array<FmUserPost>;
  /**
   * Returns a list of all restaurants up to the specified limit.
   * Provide pageIndex to skip a specific amount of pages when
   * paginating. So +1 to go to the next page of results and so on.
   * +1 with a limit of 10,000 would return the next 10,000. 20,000 in total
   * but the first 10,000 was skipped due to the +1 page index
   */
  getAllRestaurants: Array<Restaurant>;
  getAllSessionsForDeviceWithID: Array<UserSession>;
  getAllSessionsForUserWithID: Array<UserSession>;
  /**
   * Returns a list of all users up to the specified limit.
   * Provide pageIndex to skip a specific amount of pages when
   * paginating. So +1 to go to the next page of results and so on.
   * +1 with a limit of 10,000 would return the next 10,000. 20,000 in total
   * but the first 10,000 was skipped due to the +1 page index
   */
  getAllUsers: Array<FmUser>;
  /**
   * Compute and return the average percentage match for the users listed and the restaurant in question
   * Used for DWF, map feature via sorting the fetch restaurants by a map of averaged percentage matches for the current group of friends
   */
  getAverageGroupPercentageMatch?: Maybe<Scalars['Float']['output']>;
  getCurrentSessionForDeviceWithID?: Maybe<UserSession>;
  getCurrentSessionForUserWithID?: Maybe<UserSession>;
  /** Finds and returns the Foncii restaurant data associated with the given ID, and its various computed properties */
  getFonciiRestaurantByID?: Maybe<FonciiRestaurant>;
  /**
   * Fetches the specific integration credential associated with the given user ID and integration
   * provider, and automatically refreshes the credential if it's marked for auto-refresh.
   */
  getIntegrationCredentialForUser?: Maybe<FmIntegrationCredential>;
  /** Compute and return the percentage match for the given user and restaurant */
  getPercentageMatch?: Maybe<Scalars['Float']['output']>;
  getPrimaryUserTasteProfile?: Maybe<TasteProfile>;
  /**
   * Returns a list of saved restaurants for the given user. Note: This is a list of restaurants that are saved by the user,
   * not the posts that the user has saved. Any saved restaurants that were saved from a user post also have the ID of the post
   * the save was made from.
   */
  getSavedRestaurantsFor: Array<FonciiRestaurant>;
  getTasteProfile?: Maybe<TasteProfile>;
  /** Lists the integer amount representing the total amount of restaurants stored by our database */
  getTotalRestaurantCount: Scalars['Int']['output'];
  getUserEmailFromPhoneNumberFM?: Maybe<Scalars['String']['output']>;
  /**
   * Fetches the user's email from various associated attributes | used for fetching the user's email in order to enable dynamic login using username and phone number
   * via firebase auth, which both boil down to email + password login, OTP is an option, but it's not going to be supported right now beyond one time verification on sign up
   */
  getUserEmailFromUsernameFM?: Maybe<Scalars['String']['output']>;
  /**
   * Provisions all the necessary components for creating an HTML preview for a user's gallery including
   * description, title, keywords, and an applicable thumbnail image. A clean, fast and optimized way of generating better SEO#
   * through SSR (server-side rendering)
   */
  getUserGalleryHTMLMetadata?: Maybe<HtmlMetadataResponse>;
  /**
   * Fetches all integration credentials for a given user ID, and optionally automatically
   * refreshes the fetched credentials that are marked for auto-refresh.
   */
  getUserIntegrationCredentials: Array<FmIntegrationCredential>;
  getUserSessionByID?: Maybe<UserSession>;
  isAccountClaimed: Scalars['Boolean']['output'];
  /**
   * Queries our restaurant database and Google's place API for auto-complete suggestions for the given search query.
   * This is used by users when selecting their favorite restaurants when first auto-generating their taste profile,
   * and also when a user is associating a restaurant with their post. This is a much more efficient and secure
   * approach to accessing the auto-complete suggestions endpoint as client side requests can be easily abused with
   * no control on our end.
   */
  restaurantAutoCompleteSuggestions: Array<RestaurantAutoCompleteSuggestion>;
  /**
   * Advanced search using full-text and geospatial search to find public posts within the given search area that also match
   * the text search query and any additional properties to filter the results by. Returns denormalized posts with
   * creator and restaurant data attached from the appropriate database aggregation pipelines. Note: Posts returned by
   * this query are implicitly public because they have restaurant data which is used by the geospatial search pipeline.
   *
   * Note: This was previously used for the explore page, but is no longer in use, so it doesn't support percent match etc.
   */
  searchForPosts: Array<FmUserPost>;
  /**
   * Simplifies adding custom tags to user posts by suggesting tags that match
   * what they're typing in real time, like when you're typing a hashtag on IG or other social medias
   */
  userTagAutoCompleteSuggestions: Array<Scalars['String']['output']>;
};


export type QueryComputeTasteProfileSimilarityArgs = {
  userID1: Scalars['ID']['input'];
  userID2: Scalars['ID']['input'];
};


export type QueryDoesEmailExistFmArgs = {
  email: Scalars['String']['input'];
};


export type QueryDoesPhoneNumberExistFmArgs = {
  phoneNumber: Scalars['String']['input'];
};


export type QueryDoesUserHaveATasteProfileArgs = {
  userID: Scalars['ID']['input'];
};


export type QueryDoesUsernameExistFmArgs = {
  username: Scalars['String']['input'];
};


export type QueryExploreSearchAutoCompleteSuggestionsArgs = {
  input: ExploreSearchAutoCompleteSuggestionsInput;
};


export type QueryFetchLocalInfluencerLeaderboardArgs = {
  input?: InputMaybe<LocalInfluencerLeaderboardInput>;
};


export type QueryFetchUserBusinessWebsiteAnalyticsDashboardArgs = {
  input: UserAnalyticsDashboardInput;
};


export type QueryFetchUserMapAnalyticsDashboardArgs = {
  input: UserAnalyticsDashboardInput;
};


export type QueryFetchUserReservationsIntentsAnalyticsDashboardArgs = {
  input: UserAnalyticsDashboardInput;
};


export type QueryFindAllPostsByUserIdArgs = {
  fonciiRestaurantSearchFilterInput?: InputMaybe<FonciiRestaurantSearchFilterInput>;
  paginationInput: PaginationInput;
  userID: Scalars['String']['input'];
  userPersonalizationInput?: InputMaybe<UserPersonalizationInput>;
};


export type QueryFindAssociatedArticlesForArgs = {
  restaurantID: Scalars['String']['input'];
};


export type QueryFindAssociatedPostsForArgs = {
  creatorID?: InputMaybe<Scalars['ID']['input']>;
  fonciiRestaurantID: Scalars['ID']['input'];
  postsToExclude?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type QueryFindAssociatedRestaurantAwardsForArgs = {
  restaurantID: Scalars['String']['input'];
};


export type QueryFindAvailableReservationDaysForArgs = {
  availableReservationDaysInput: AvailableReservationDaysInput;
  fonciiRestaurantID: Scalars['ID']['input'];
};


export type QueryFindGooglePlaceIdForPlaceSearchQueryArgs = {
  searchQuery: Scalars['String']['input'];
  useGoogleFallback?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryFindPostByIdArgs = {
  postID: Scalars['String']['input'];
};


export type QueryFindPublicPostsByUsernameArgs = {
  fonciiPostFilterInput?: InputMaybe<FonciiPostFilterInput>;
  fonciiRestaurantSearchFilterInput?: InputMaybe<FonciiRestaurantSearchFilterInput>;
  paginationInput: PaginationInput;
  userPersonalizationInput?: InputMaybe<UserPersonalizationInput>;
  username: Scalars['String']['input'];
};


export type QueryFindReservationAvailabilitiesForArgs = {
  fonciiRestaurantID: Scalars['ID']['input'];
  reservationSearchInput: ReservationSearchInput;
};


export type QueryFindRestaurantsSimilarToArgs = {
  restaurantID: Scalars['ID']['input'];
};


export type QueryFindTasteProfilesForUserArgs = {
  userID: Scalars['ID']['input'];
};


export type QueryFindUserByIdfmArgs = {
  userID: Scalars['ID']['input'];
};


export type QueryFindUserByUsernameFmArgs = {
  username: Scalars['String']['input'];
};


export type QueryFonciiRestaurantSearchArgs = {
  input: FonciiRestaurantSearchInput;
};


export type QueryGallerySearchAutoCompleteSuggestionsArgs = {
  input: GallerySearchAutoCompleteSuggestionsInput;
};


export type QueryGetAllDeviceSessionsForUserArgs = {
  deviceID: Scalars['ID']['input'];
  userID: Scalars['ID']['input'];
};


export type QueryGetAllPublicPostsArgs = {
  limit: Scalars['Int']['input'];
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetAllRestaurantsArgs = {
  limit: Scalars['Int']['input'];
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetAllSessionsForDeviceWithIdArgs = {
  userID: Scalars['ID']['input'];
};


export type QueryGetAllSessionsForUserWithIdArgs = {
  userID: Scalars['ID']['input'];
};


export type QueryGetAllUsersArgs = {
  limit: Scalars['Int']['input'];
  pageIndex?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetAverageGroupPercentageMatchArgs = {
  restaurantID: Scalars['ID']['input'];
  userIDs: Array<Scalars['ID']['input']>;
};


export type QueryGetCurrentSessionForDeviceWithIdArgs = {
  deviceID: Scalars['ID']['input'];
};


export type QueryGetCurrentSessionForUserWithIdArgs = {
  userID: Scalars['ID']['input'];
};


export type QueryGetFonciiRestaurantByIdArgs = {
  id: Scalars['ID']['input'];
  userPersonalizationInput?: InputMaybe<UserPersonalizationInput>;
};


export type QueryGetIntegrationCredentialForUserArgs = {
  input: IntegrationCredentialForUserInput;
};


export type QueryGetPercentageMatchArgs = {
  restaurantID: Scalars['ID']['input'];
  userID: Scalars['ID']['input'];
};


export type QueryGetPrimaryUserTasteProfileArgs = {
  userID: Scalars['ID']['input'];
};


export type QueryGetSavedRestaurantsForArgs = {
  input: GetSavedRestaurantsForInput;
};


export type QueryGetTasteProfileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserEmailFromPhoneNumberFmArgs = {
  phoneNumber: Scalars['String']['input'];
};


export type QueryGetUserEmailFromUsernameFmArgs = {
  username: Scalars['String']['input'];
};


export type QueryGetUserGalleryHtmlMetadataArgs = {
  username: Scalars['String']['input'];
};


export type QueryGetUserIntegrationCredentialsArgs = {
  userID: Scalars['ID']['input'];
};


export type QueryGetUserSessionByIdArgs = {
  sessionID: Scalars['ID']['input'];
};


export type QueryIsAccountClaimedArgs = {
  input: IsAccountClaimedInput;
};


export type QueryRestaurantAutoCompleteSuggestionsArgs = {
  input: RestaurantAutoCompleteSuggestionsInput;
};


export type QuerySearchForPostsArgs = {
  fonciiRestaurantSearchFilterInput?: InputMaybe<FonciiRestaurantSearchFilterInput>;
  input: FullTextGeospatialPostSearchInput;
  userPersonalizationInput?: InputMaybe<UserPersonalizationInput>;
};


export type QueryUserTagAutoCompleteSuggestionsArgs = {
  searchQuery: Scalars['String']['input'];
};

/**  Object describing the timeslot when a reservation is presently available given the reservation search criteria  */
export type ReservationAvailability = {
  __typename?: 'ReservationAvailability';
  /** The date / day of the availability formatted in ISO-8601 (ex. 2023-11-26T00:00:00.000Z) */
  date: Scalars['String']['output'];
  /** Generic link to the restaurant's detail page on the provider's platform (ex. https://resy.com/cities/ny/borrachito-taqueria-spirits) without parameters */
  externalURL: Scalars['String']['output'];
  fonciiRestaurantID: Scalars['String']['output'];
  /** The time when this availability was last fetched from the provider */
  lastChecked: Scalars['String']['output'];
  /** A link to the reservation page which will be used to direct the user to their specified reservation time slot based on the party size and desired date */
  parameterizedLink: Scalars['String']['output'];
  /** The provider of the reservatio (ex. Resy) */
  provider: ReservationProviders;
  /**
   * The time of the reservation.
   * Formatted as 24h time (ex. 22:00:00) hh:mm:ss
   */
  timeSlot: Scalars['String']['output'];
  /** The provider specific identifier for the restaurant in question  */
  venueID: Scalars['String']['output'];
};

export type ReservationIntentEventPayload = {
  /**
   * The user post the reservation is intending to be made from + author UID, can be used to measure influencer conversion rates relative
   * to successful reservations.
   */
  authorUID?: InputMaybe<Scalars['String']['input']>;
  externalURL: Scalars['String']['input'];
  fonciiRestaurantID: Scalars['String']['input'];
  outcome: ReservationIntentOutcome;
  percentMatchScore?: InputMaybe<Scalars['Float']['input']>;
  postID?: InputMaybe<Scalars['String']['input']>;
  provider: ReservationProviders;
  qualityScore: Scalars['Float']['input'];
  reservationDate: Scalars['String']['input'];
  timeSlot: Scalars['String']['input'];
  venueID: Scalars['String']['input'];
};

export enum ReservationIntentOutcome {
  Confirmed = 'CONFIRMED',
  Failed = 'FAILED',
  Passive = 'PASSIVE'
}

/**
 * Reservation providers currently supported by Foncii's open reservation
 * integration platform, right now only Resy is supported.
 */
export enum ReservationProviders {
  Resy = 'RESY'
}

export type ReservationSearchEventPayload = {
  authorID?: InputMaybe<Scalars['String']['input']>;
  clientLocation?: InputMaybe<CoordinatePointInput>;
  fonciiRestaurantID: Scalars['String']['input'];
  partySize: Scalars['Int']['input'];
  reservationDate: Scalars['String']['input'];
  sourceURL: Scalars['String']['input'];
};

export type ReservationSearchInput = {
  /** Size of the party from [min] 1 - 20 [max] */
  partySize: Scalars['Int']['input'];
  /** ISO-8601 formatted date string in the format of YYYY-mm-dd ex.) 2023-12-02 */
  targetDate: Scalars['String']['input'];
};

export type Restaurant = Expirable & Identifiable & Updatable & {
  __typename?: 'Restaurant';
  addressProperties: AddressProperties;
  categories?: Maybe<Array<Scalars['String']['output']>>;
  /**
   * Clean and decodable representation of this place's physical location. Sent back to the client.
   * A GeoJSON point object with exists only on the backend data for this restaurant to allow for geospatial queries.
   */
  coordinates: CoordinatePoint;
  creationDate: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  googleID: Scalars['String']['output'];
  googleProperties?: Maybe<GoogleRestaurantProperties>;
  /** Optional because some restaurants lack Yelp data + Google image collections, so we really can't source anything for them unless manually done. */
  heroImageURL?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageCollectionURLs?: Maybe<Array<Scalars['String']['output']>>;
  lastUpdated: Scalars['String']['output'];
  name: Scalars['String']['output'];
  operatingHours?: Maybe<OperatingHours>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  priceLevel: Scalars['Int']['output'];
  servesAlcohol: Scalars['Boolean']['output'];
  /** [Optional] Social media handles associated with this restaurant */
  socialMediaHandles?: Maybe<RestaurantSocialMediaHandles>;
  staleDate: Scalars['String']['output'];
  /** [Optional] This location's offset from UTC (in minutes), used to determine whether or not the restaurant is open relative to some time zone. */
  utcOffset?: Maybe<Scalars['Int']['output']>;
  website?: Maybe<Scalars['String']['output']>;
  /** Nullable b/c Foncii Maps uses Google as a data anchor */
  yelpID?: Maybe<Scalars['String']['output']>;
  yelpProperties?: Maybe<YelpRestaurantProperties>;
};

export type RestaurantAutoCompleteSuggestion = AutoCompleteSuggestion & {
  __typename?: 'RestaurantAutoCompleteSuggestion';
  /** Cuisines / other categories attributed to aggregated restaurants | Optional for non-aggregated restaurants */
  categories?: Maybe<Array<Scalars['String']['output']>>;
  /**  Human-readable description [business name + location properties]   */
  description: Scalars['String']['output'];
  /** Note: 'fonciiRestaurantID' is not available when injecting suggestions from Google Places API / when the Source is 'GOOGLE' */
  fonciiRestaurantID?: Maybe<Scalars['ID']['output']>;
  googlePlaceID: Scalars['ID']['output'];
  /**  Optional preview image for this search result  */
  previewImageURL?: Maybe<Scalars['String']['output']>;
  source: RestaurantAutoCompleteSuggestionSources;
  title: Scalars['String']['output'];
};

/**
 * Keeps track of where a specific auto-complete search suggestion was
 * derived from since multiple sources can be combined to produce a single set of suggestions.
 */
export enum RestaurantAutoCompleteSuggestionSources {
  Foncii = 'FONCII',
  Google = 'GOOGLE'
}

export type RestaurantAutoCompleteSuggestionsInput = {
  injectExternalSuggestions?: InputMaybe<Scalars['Boolean']['input']>;
  searchQuery?: Scalars['String']['input'];
};

export type RestaurantAward = Identifiable & {
  __typename?: 'RestaurantAward';
  /** When the article was first published in ISO-8601 format (ex. 2023-11-19) */
  awardDate: Scalars['String']['output'];
  /** The description meta tag of the awards's web page loaded and parsed by this server (can't be done client side due to cross site blocks) */
  description?: Maybe<Scalars['String']['output']>;
  /** [Computed] The favicon for the website (may not exist, depends on the website) but usually located at 'example.com/favicon.ico', uses the parsed web domain */
  faviconLink: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** The organization this award was published on (i.e Michelin Guides etc.) */
  organization: Scalars['String']['output'];
  /** [Computed] Post geocoded retaurant ID  */
  restaurantID: Scalars['String']['output'];
  /** The time when this award was scraped by our bot (or csv was ingested) */
  scrapeDate: Scalars['String']['output'];
  /** The title of the award */
  title: Scalars['String']['output'];
  /**
   * The url of the award that was scraped, links users back to the source when they click on it in the client
   * Meta tags from the award are pulled from the URL (page title etc)
   */
  url: Scalars['String']['output'];
  /** Location of the restaurant or bar the article directly references, used in the backend to geocode to our restaurants  */
  venueLocaiton: Scalars['String']['output'];
  /** Name of the restaurant or bar the article directly references, used in the backend to geocode to our restaurants  */
  venueName: Scalars['String']['output'];
  /** [Computed] The domain name of the website provided by the article's URL */
  websiteDomain: Scalars['String']['output'];
};

export type RestaurantAwardDetailInput = {
  awardDate: Scalars['String']['input'];
  organization: Scalars['String']['input'];
  scrapeDate: Scalars['String']['input'];
  title: Scalars['String']['input'];
  url: Scalars['String']['input'];
  venueLocation: Scalars['String']['input'];
  venueName: Scalars['String']['input'];
};

/** An output for restaurant awards queried outside of Foncii Restaurant based resolvers. */
export type RestaurantAwardStandaloneOutput = {
  __typename?: 'RestaurantAwardStandaloneOutput';
  /** [Computed] Aggregated articles that mention this restaurant by name. Limited to 10 (Update when needed) */
  associatedRestaurantAwardEdges: Array<RestaurantAward>;
};

export type RestaurantClickEventPayload = {
  autoCompleteQuery?: InputMaybe<Scalars['String']['input']>;
  fonciiRestaurantID: Scalars['ID']['input'];
  percentMatchScore?: InputMaybe<Scalars['Float']['input']>;
  qualityScore: Scalars['Float']['input'];
  queryID?: InputMaybe<Scalars['ID']['input']>;
  sourceFonciiRestaurantID?: InputMaybe<Scalars['ID']['input']>;
  sourcePostID?: InputMaybe<Scalars['ID']['input']>;
  sourceURL?: InputMaybe<Scalars['String']['input']>;
};

export type RestaurantReservationDetailInput = {
  /** A link to the reservation page which will be used to direct the user to their specified reservation time slot */
  externalURL: Scalars['String']['input'];
  /**
   * CSV string with the restaurant name, address details, state etc.
   * Can be used to match the reservation details with a restaurant in our database
   * or dynamically aggregate a new restaurant to match the one that's missing.
   */
  locationDetails: Scalars['String']['input'];
  name: Scalars['String']['input'];
  venueAlias: Scalars['String']['input'];
  venueID: Scalars['String']['input'];
};

export type RestaurantSaveInput = {
  fonciiRestaurantID: Scalars['ID']['input'];
  /** Optional post id included when a user saves or unsaves a restaurant from a user post */
  postID?: InputMaybe<Scalars['ID']['input']>;
  userID: Scalars['ID']['input'];
};

export type RestaurantSocialMediaHandles = {
  __typename?: 'RestaurantSocialMediaHandles';
  instagram?: Maybe<Scalars['String']['output']>;
};

export type RestaurantViewEventPayload = {
  fonciiRestaurantID: Scalars['ID']['input'];
  percentMatchScore?: InputMaybe<Scalars['Float']['input']>;
  qualityScore: Scalars['Float']['input'];
  referrer?: InputMaybe<Scalars['String']['input']>;
  sharedEventID?: InputMaybe<Scalars['ID']['input']>;
};

/**
 * Generic interface for saving entities, saves are attributed to users
 * via their user ID.
 */
export type Savable = {
  /** When this entity was created / saved */
  creationDate: Scalars['String']['output'];
  /** Unique identifier for this entity */
  id: Scalars['ID']['output'];
  /** The user who saved the entity */
  userID: Scalars['ID']['output'];
};

/**
 * An entity that signifies a user with the given user ID has saved
 * the restaurant with the given restaurant ID, which is also optionally associated with some
 * user post with the given post ID (if the restaurant was saved via a user post)
 */
export type SavedFonciiRestaurant = Savable & {
  __typename?: 'SavedFonciiRestaurant';
  creationDate: Scalars['String']['output'];
  /** ID of the foncii restaurant saved */
  fonciiRestaurantID: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** Optional post ID used when the restaurant was saved via a user post */
  postID?: Maybe<Scalars['String']['output']>;
  userID: Scalars['ID']['output'];
};

export type SetUserProfilePictureInput = {
  /** UInt8Array String, Required input is PNG or JPG/JPEG format, max size is 4MB */
  fileUploadRequest: FileUploadRequestInput;
  platform: SupportedFonciiPlatforms;
};

export type ShareEventPayload = {
  destination: ShareSheetDestination;
  /** Generated UID used to track the shared URL generated by the client */
  shareEventID: Scalars['String']['input'];
  shareEventType: ShareEventType;
  sourceURL: Scalars['String']['input'];
};

/**
 * Supported share events used across Foncii to identify
 * the source of a share event
 */
export enum ShareEventType {
  Referral = 'REFERRAL',
  Restaurant = 'RESTAURANT',
  UserGallery = 'USER_GALLERY',
  UserPost = 'USER_POST'
}

export enum ShareSheetDestination {
  Clipboard = 'CLIPBOARD',
  Facebook = 'FACEBOOK',
  Linkedin = 'LINKEDIN',
  Reddit = 'REDDIT',
  System = 'SYSTEM',
  Twitter = 'TWITTER',
  Whatsapp = 'WHATSAPP'
}

export enum SortOrders {
  Ascending = 'ASCENDING',
  Descending = 'DESCENDING'
}

export type Subscription = {
  __typename?: 'Subscription';
  userSessionEnded: Scalars['ID']['output'];
};

/**
 * Enum that describes the different kinds of supported Foncii platforms.
 * This is used for routing requests from multiple platforms to singular endpoints that
 * can handle platform agnostic inputs.
 */
export enum SupportedFonciiPlatforms {
  Foncii = 'FONCII',
  FonciiBiz = 'FONCII_BIZ'
}

/**
 * Follows the language codes defined in the localizations data model
 * Keep both synchronized
 */
export type SupportedLocalizations = {
  __typename?: 'SupportedLocalizations';
  /** English is the default language therefore it's required, other languages are optionally supported */
  en: Scalars['String']['output'];
  es?: Maybe<Scalars['String']['output']>;
  fr?: Maybe<Scalars['String']['output']>;
};

/** User Taste Profile */
export type TasteProfile = Identifiable & Updatable & {
  __typename?: 'TasteProfile';
  /** 0 - 2 | ~ */
  adventureLevel?: Maybe<Scalars['Int']['output']>;
  /** 0 - 3 | ~ */
  ambiancePreference?: Maybe<Scalars['Int']['output']>;
  creationDate: Scalars['String']['output'];
  /** A set of unique ID strings associated with the dietary restrictions that the user has - default value is an empty array if no value is given */
  dietaryRestrictions?: Maybe<Array<Scalars['ID']['output']>>;
  /** 0 - 3 | Optional integer from 0 - 3 - default value is undefined if no value is given */
  diningPurpose?: Maybe<Scalars['Int']['output']>;
  /** 0 - 2 | ~ */
  distancePreferenceLevel?: Maybe<Scalars['Int']['output']>;
  /** 0 - 3 | Optional integer from 0 - 3 - default value if undefined if no value is given, Option 4 aka 'Non-alcoholic beverages only' indicates a non-alcoholic beverage preference i.e no alcohol, the others ~ yes alcohol */
  drinkPreference?: Maybe<Scalars['Int']['output']>;
  /**
   * UID of this taste profile, a single user can have multiple taste profiles
   * associated with their account via the userID field
   */
  id: Scalars['ID']['output'];
  lastUpdated: Scalars['String']['output'];
  /** A set of unique cuisine IDs, (any duplicates are removed) */
  preferredCuisines?: Maybe<Array<Scalars['ID']['output']>>;
  /** 0 - 3 | Optional integer from 0 - 3 - default value is undefined if no value is given | 0.) 4 ($$$$) and below ($$$$), ($$$), ($$), ($) 1.) 3 ($$$) and below ($$$), ($$), ($) 2.) ($$) and below ($$), ($), 1.) ($) and below ($) */
  preferredPriceRange?: Maybe<Scalars['Int']['output']>;
  /** 0 - 2 | Optional integer from 0 - 2 - default value if undefined if no value is given */
  spicePreferenceLevel?: Maybe<Scalars['Int']['output']>;
  /** ID of the user this taste profile belongs to, before this was the id, but this will allow for the possibility of switching taste profiles for users by allowing multiple taste profiles for a single user */
  userID: Scalars['String']['output'];
};

/**
 * A simple data model that allows users to match their unique cuisine tastes with other users as well
 * as match with restaurants that fit their 'taste profile'. This data model can be represented as an
 * embedding and used with numerous ML algorithms such as KNN to provide super fast recommendations
 * based on vector database search operations.
 */
export type TasteProfileInput = {
  /** 0 - 2 | ~ */
  adventureLevel?: InputMaybe<Scalars['Int']['input']>;
  /** 0 - 3 | ~ */
  ambiancePreference?: InputMaybe<Scalars['Int']['input']>;
  /** A set of unique ID strings associated with the dietary restrictions that the user has - default value is an empty array if no value is given */
  dietaryRestrictions?: InputMaybe<Array<Scalars['ID']['input']>>;
  /** 0 - 3 | Optional integer from 0 - 3 - default value is undefined if no value is given */
  diningPurpose?: InputMaybe<Scalars['Int']['input']>;
  /** 0 - 2 | ~ */
  distancePreferenceLevel?: InputMaybe<Scalars['Int']['input']>;
  /** 0 - 3 | Optional integer from 0 - 3 - default value if undefined if no value is given, Option 4 aka 'Non-alcoholic beverages only' indicates a non-alcoholic beverage preference i.e no alcohol, the others ~ yes alcohol */
  drinkPreference?: InputMaybe<Scalars['Int']['input']>;
  /** A set of unique cuisine IDs, (any duplicates are removed) */
  preferredCuisines?: InputMaybe<Array<Scalars['ID']['input']>>;
  /** 0 - 3 | Optional integer from 0 - 3 - default value is undefined if no value is given | 0.) 4 ($$$$) and below ($$$$), ($$$), ($$), ($) 1.) 3 ($$$) and below ($$$), ($$), ($) 2.) ($$) and below ($$), ($), 1.) ($) and below ($) */
  preferredPriceRange?: InputMaybe<Scalars['Int']['input']>;
  /** 0 - 2 | Optional integer from 0 - 2 - default value if undefined if no value is given */
  spicePreferenceLevel?: InputMaybe<Scalars['Int']['input']>;
  /** ID of the user this taste profile belongs to, before this was the id, but this will allow for the possibility of switching taste profiles for users by allowing multiple taste profiles for a single user */
  userID: Scalars['ID']['input'];
};

/**
 * Used when fetching trending restaurants
 * This restaurant type returns with a computed set of trending attributes
 */
export type TrendingRestaurant = Identifiable & {
  __typename?: 'TrendingRestaurant';
  id: Scalars['ID']['output'];
  impressions: Scalars['Int']['output'];
  rank: Scalars['Int']['output'];
  restaurant: FonciiRestaurant;
};

export type Updatable = {
  /** ISO-8601 Formatted Date String, when this entity was first created */
  creationDate: Scalars['String']['output'];
  /** ISO-8601 Formatted Date String, when this entity was last updated */
  lastUpdated: Scalars['String']['output'];
};

export type UpdateFmUserMapNameInput = {
  newMapName: Scalars['String']['input'];
  userID: Scalars['ID']['input'];
};

export type UpdateFmUserPostCustomUserPropertiesInput = {
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  notes?: InputMaybe<Scalars['String']['input']>;
  rating?: InputMaybe<Scalars['Float']['input']>;
  userInput: UpdateFmUserPostUserInput;
};

export type UpdateFmUserPostFavoriteStateInput = {
  isFavorited: Scalars['Boolean']['input'];
  userInput: UpdateFmUserPostUserInput;
};

export type UpdateFmUserPostMediaInput = {
  mediaInput: UserPostMediaInput;
  userInput: UpdateFmUserPostUserInput;
};

export type UpdateFmUserPostRestaurantDataInput = {
  /**
   * Note: The absence of the place ID indicates the restaurant associated with the post at hand
   * should be removed from the post's data and deassociated with it. If the place ID is defined then
   * the restaurant is then associated with the post by ID in a one-to-many (restaurant-to-post) relationship.
   */
  googlePlaceID?: InputMaybe<Scalars['ID']['input']>;
  userInput: UpdateFmUserPostUserInput;
};

/**
 * Reusable input for updating a post's data, posts are owned by users so a user ID has to be passed to verify if the user has the
 * rights to edit the post.
 */
export type UpdateFmUserPostUserInput = {
  postID: Scalars['ID']['input'];
  userID: Scalars['ID']['input'];
};

/** Boilerplate for all Foncii user accounts */
export type UserAccount = {
  authProviders: Array<AuthProviders>;
  creationDate: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** [Computed] true if the last sign in date is after the last sign out date */
  isLoggedIn: Scalars['Boolean']['output'];
  lastLogin: UserLogin;
  /** Optional because a user doesn't sign out until after they login, thus this date is null until that dependent event is triggered */
  lastSignOut?: Maybe<Scalars['String']['output']>;
  lastUpdated: Scalars['String']['output'];
  phoneNumber?: Maybe<Scalars['String']['output']>;
  /** Optional to have, most people might not want to use a profile picture */
  profilePictureURL?: Maybe<Scalars['String']['output']>;
  referralCode: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type UserAnalyticsDashboardEntityDistribution = {
  __typename?: 'UserAnalyticsDashboardEntityDistribution';
  /**
   * The categorical name to display for this entity (restaurant name or anything else that identifies what this metric
   * quantitatively identifies)
   */
  category: Scalars['String']['output'];
  /**
   * The total count of this entity. This is used to determine the percentage this entity represents out of some
   * larger dataset.
   */
  count: Scalars['Int']['output'];
};

export type UserAnalyticsDashboardInput = {
  timespan: AnalyticsTimespan;
  userID: Scalars['ID']['input'];
};

export type UserAnalyticsDashboardTimeSeriesEntry = {
  __typename?: 'UserAnalyticsDashboardTimeSeriesEntry';
  /**
   * Optional category value / name to identify this time series entry with in order
   * to group other similar entries together or differentiate entries from one another
   */
  category?: Maybe<Scalars['String']['output']>;
  /** A list of data points spread across some timeline indicated by the labels field */
  data: Array<Scalars['Int']['output']>;
  /**
   * A list of formatted date strings that indicate when each data point in this time series
   * was observed / recorded
   */
  timestamps?: Maybe<Array<Scalars['String']['output']>>;
};

export type UserAutoCompleteSuggestion = AutoCompleteSuggestion & {
  __typename?: 'UserAutoCompleteSuggestion';
  /**  Human-readable description [username]  */
  description: Scalars['String']['output'];
  /**  Optional preview image for this search result  */
  previewImageURL?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  userID: Scalars['ID']['output'];
};

export type UserBusinessWebsiteAnalyticsDashboard = {
  __typename?: 'UserBusinessWebsiteAnalyticsDashboard';
  businessWebsiteClicksTimeSeries: Array<UserAnalyticsDashboardTimeSeriesEntry>;
  mostClickedBusinessWebsitesDistribution: Array<UserAnalyticsDashboardEntityDistribution>;
  relativeBusinessWebsiteClicksChange: Scalars['Int']['output'];
  totalBusinessWebsiteClicks: Scalars['Int']['output'];
};

export type UserGallerySearchEventPayload = {
  authorUID: Scalars['String']['input'];
  autoCompleteSuggestions: Array<Scalars['String']['input']>;
  averagePercentMatchScore?: InputMaybe<Scalars['Float']['input']>;
  averageQualityScore: Scalars['Float']['input'];
  candidateIDs: Array<Scalars['String']['input']>;
  clientLocation?: InputMaybe<CoordinatePointInput>;
  cuisines: Array<Scalars['String']['input']>;
  partySize: Scalars['Int']['input'];
  prices: Array<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
  reservationDate: Scalars['String']['input'];
  searchLocation: CoordinatePointInput;
  sourceURL: Scalars['String']['input'];
  tags: Array<Scalars['String']['input']>;
  zoomLevel: Scalars['Float']['input'];
};

export type UserGalleryViewEventPayload = {
  authorUID: Scalars['ID']['input'];
  referrer?: InputMaybe<Scalars['String']['input']>;
  sharedEventID?: InputMaybe<Scalars['ID']['input']>;
  userSimilarityScore?: InputMaybe<Scalars['Float']['input']>;
};

/** Describes a user login event handled by the client and tracked by the backend */
export type UserLogin = {
  __typename?: 'UserLogin';
  authProvider: AuthProviders;
  loginDate: Scalars['String']['output'];
};

export type UserLoginInput = {
  authProvider: AuthProviders;
  userID: Scalars['ID']['input'];
};

export type UserMapAnalyticsDashboard = {
  __typename?: 'UserMapAnalyticsDashboard';
  mapViewsTimeSeries: Array<UserAnalyticsDashboardTimeSeriesEntry>;
  mostViewedExperienceDistribution: Array<UserAnalyticsDashboardEntityDistribution>;
  /**
   * How much the total amount of views have gone up or down relative to
   * the last week or 2 weeks / specified timespan.
   */
  relativeMapViewChange: Scalars['Int']['output'];
  topLocationsDistribution: Array<UserAnalyticsDashboardEntityDistribution>;
  topTagsDistribution: Array<UserAnalyticsDashboardEntityDistribution>;
  totalExperienceViews: Scalars['Int']['output'];
  totalLocations: Scalars['Int']['output'];
  totalMapViews: Scalars['Int']['output'];
  totalTags: Scalars['Int']['output'];
};

export type UserPersonalizationInput = {
  coordinates: CoordinatePointInput;
  includeAssociatedArticles?: InputMaybe<Scalars['Boolean']['input']>;
  includeAssociatedPosts?: InputMaybe<Scalars['Boolean']['input']>;
  includeAssociatedRestaurantAwards?: InputMaybe<Scalars['Boolean']['input']>;
  includeInfluencerInsights?: InputMaybe<Scalars['Boolean']['input']>;
  includeReservations?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Optional search criteria for reservations, if not provided then
   * the default reservation search criteria is used (party of 2, target date is today)
   */
  reservationSearchInput?: InputMaybe<ReservationSearchInput>;
  /**
   * Optional personalization criteria to apply when resolving the Foncii restaurant
   * for attributes such as percent match and reservations
   */
  userID?: InputMaybe<Scalars['ID']['input']>;
};

export type UserPostAutoCompleteSuggestion = AutoCompleteSuggestion & {
  __typename?: 'UserPostAutoCompleteSuggestion';
  /**  Human-readable description [business name + location properties]   */
  description: Scalars['String']['output'];
  fonciiRestaurantID: Scalars['ID']['output'];
  postID: Scalars['ID']['output'];
  /**  Optional preview image for this search result  */
  previewImageURL?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type UserPostGalleryOutput = {
  __typename?: 'UserPostGalleryOutput';
  /** An array of applicable posts that fulfill some query criteria */
  posts: Array<FmUserPost>;
  /** A count of all of the user's total posts that fulfill the query criteria */
  totalPosts: Scalars['Int']['output'];
};

export type UserPostMediaInput = {
  mediaType: PostMediaTypes;
  /** URL of the new media (uploaded to the Foncii CDN from the client) */
  mediaURL: Scalars['String']['input'];
  /**
   * Not applicable for image media, and required for video media (the operation will be rejected if a video
   * thumbnail image is not provided for video-media based updates)
   */
  videoMediaThumbnailURL?: InputMaybe<Scalars['String']['input']>;
};

export type UserProfilePictureUpdateInput = {
  /** UInt8Array String, Required input is PNG or JPG/JPEG format, max size is 4MB */
  fileUploadRequest: FileUploadRequestInput;
  platform: SupportedFonciiPlatforms;
};

export type UserReferral = Identifiable & Updatable & {
  __typename?: 'UserReferral';
  creationDate: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastUpdated: Scalars['String']['output'];
  refereeCode: Scalars['String']['output'];
  referrerCode: Scalars['String']['output'];
};

export type UserReservationIntentsAnalyticsDashboard = {
  __typename?: 'UserReservationIntentsAnalyticsDashboard';
  relativeReservationIntentsChange: Scalars['Int']['output'];
  reservationIntentsTimeSeries: Array<UserAnalyticsDashboardTimeSeriesEntry>;
  topReservedRestaurantsDistribution: Array<UserAnalyticsDashboardEntityDistribution>;
  totalReservationIntents: Scalars['Int']['output'];
};

/** The different possible roles for all Foncii users */
export enum UserRoles {
  Admin = 'ADMIN',
  Basic = 'BASIC',
  Business = 'BUSINESS',
  Creator = 'CREATOR',
  Test = 'TEST'
}

export type UserSession = Identifiable & Updatable & {
  __typename?: 'UserSession';
  /**
   * Optional Amplitude session ID passed from the client to track occurrences across our own session management system
   * and Amplitude's.
   */
  amplitudeSessionID?: Maybe<Scalars['Float']['output']>;
  /**
   * An array tracking the user's physical location throughout the session's duration (if provided)
   * via coordinate points
   */
  clientGeolocationHistory: Array<CoordinatePoint>;
  creationDate: Scalars['String']['output'];
  currentClientGeolocation?: Maybe<CoordinatePoint>;
  /**
   * Always available and can be used to track user sign up conversions /
   * retention rates based on anonymous users (users without userIDs / accounts)
   *  using the application before having an established account. This period before
   * having an account is the time before the creation date of the user's account, and
   * if the creation date of this session falls within that period then this can be
   * used to say the person was converted into a user account, and what they did prior
   * to creating an account was XY and Z based on what we track in Amplitude and in our DB.
   *
   * Provided by Amplitude, since that's easier than setting it up from scratch which can
   * be tedious and unreliable and a hassle to maintain and verify.
   */
  deviceID: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /**
   * Optional. Storing IP addresses help in fraud detection, location-based personalization, and security.
   * Can also be used to determine the user's location using the MaxMind DB: https://www.maxmind.com/en/geoip-databases
   */
  ipAddress?: Maybe<Scalars['String']['output']>;
  /**
   * [Computed] True if the user's client has sent a heart beat signal within the last minute, false otherwise
   * or if the session is not alive anymore.
   */
  isActive: Scalars['Boolean']['output'];
  /**
   * [Computed] True if the session's last heart beat aka update occurred
   * within the max time threshold, false otherwise (session ended).
   *
   * Also false if the session was terminated by the user or some internal
   * service.
   */
  isAlive: Scalars['Boolean']['output'];
  /**
   * True if the latest location does not match up with the latest history
   * ~ the user is hundreds of miles away from their last reported location.
   * Doesn't do anything for now, but good logic to maintain for security purposes down the line.
   */
  isSuspicious: Scalars['Boolean']['output'];
  /** The preferred language of the user 'the browser's current language' */
  language: Scalars['String']['output'];
  /** The last time the session received a heart beat signal */
  lastUpdated: Scalars['String']['output'];
  /** The operating system the user's client is operating on */
  operatingSystem: Scalars['String']['output'];
  /** The platform this user session is currently hosted on. */
  platform: SupportedFonciiPlatforms;
  /**
   * Referrer URL Information: Track where users are coming from (e.g., referral links, social media, direct traffic)
   * to understand your platform's sources of traffic. Useful to see where a user starts their session from,
   * (Instagram, or Twitter, or Reddit, our App, or just google)
   */
  referrer?: Maybe<Scalars['String']['output']>;
  /**
   * In milliseconds [ms]
   * Calculating and storing the session duration can provide insights into user engagement.
   * Computed and stored when the session ends.
   */
  sessionDuration: Scalars['Float']['output'];
  /**
   * User sessions are marked as terminated when the user closes their client or logs out or if a
   * new session is created on the same device that a live session is already being used on.
   *
   * Note: User sessions that die out due to lack of heart beat are not marked as terminated.
   */
  terminated: Scalars['Boolean']['output'];
  /**
   * String that stores information about the user's device, browser, or app version. This data can help optimize
   * the platform for different devices and identify any compatibility issues.
   */
  userAgent: Scalars['String']['output'];
  /** Optional because not all users are logged in when a session is created */
  userID?: Maybe<Scalars['String']['output']>;
};

export type UserSessionHeartBeatInput = {
  /**
   * The user's current physical location, to be recorded and used to track their movement
   * history throughout the session.
   */
  clientGeolocation?: InputMaybe<CoordinatePointInput>;
  sessionID: Scalars['ID']['input'];
};

export type YelpRestaurantProperties = PlaceProperties & {
  __typename?: 'YelpRestaurantProperties';
  externalURL?: Maybe<Scalars['String']['output']>;
  rating?: Maybe<Scalars['Float']['output']>;
};

export type GpidToInstagramHandleMappingInput = {
  googlePlaceID: Scalars['String']['input'];
  instagramHandle: Scalars['String']['input'];
};

export type IntegrationCredentialForUserInput = {
  integrationProvider: FmIntegrationProviders;
  userID: Scalars['ID']['input'];
};

export type IsAccountClaimedInput = {
  /** The platform this user account belongs to. */
  platform: SupportedFonciiPlatforms;
  /** The user's account uid. */
  userID: Scalars['ID']['input'];
};
