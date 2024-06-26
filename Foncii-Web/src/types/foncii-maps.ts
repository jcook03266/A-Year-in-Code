// Dependencies
// Types
import * as gql from "../__generated__/graphql";

declare global {
  // Global Types Specific to Foncii Maps
  /** A generic protocol for sending some titled correspondence */
  interface MessageProtocol {
    title: string;
    message: string;
  }

  /** Template for confirmation dialog modals */
  interface ConfirmationDialog extends MessageProtocol {
    onCancel: () => void;
    onConfirm: () => void;
    isDestructive: boolean;
  }

  /** A generic template to use for most rich notifications, can be extended if needed */
  interface SystemNotificationProtocol extends MessageProtocol {
    isError: boolean;
    link: string | undefined;
  }

  // Redux Slice States
  interface FonciiUserSliceState {
    user: gql.FmUser | undefined;
    impersonatingUser: gql.FmUser | undefined;
    integrationCredentials: gql.FmIntegrationCredential[];
    integrationConnectionInProgress: boolean;
    /** Optional because the user can choose whether or not to expose their location to us */
    clientCoordinates?: gql.CoordinatePoint;
    locationPermissionGranted: boolean;
    isLoggedIn: boolean;
    isLoading: boolean;
    authErrorDidOccur: boolean;
    signingOut: boolean;
    signingIn: boolean;
    /** True if the user has just signed up, set to false when they complete onboarding or log out and log in again */
    isFTUE: boolean;
  }

  interface NotificationCenterSliceState {
    /** Simple notification with message, title, and optional link */
    systemNotification: SystemNotificationProtocol | null;
    /** Display state */
    systemNotificationTriggered: boolean;
  }

  // Possible User Interaction States For Map and Gallery UI
  type GalleryStates = "idle" | "scrolling" | "scrolling-to-element";
  type MapStates = "idle" | "moving";

  interface MapboxSliceState {
    galleryState: GalleryStates;
    mapState: MapStates;
    virtualCoordinates: gql.CoordinatePoint;
    virtualZoomLevel: number;
  }

  interface PostFiltersSliceState {
    // Collective filters
    priceLevels: number[];
    cuisineTypes: string[];
    creatorUIDs: string[];
    publications: string[];
    restaurantAwards: string[];
    customCategories: string[];
    mealTypes: string[];
    yelpRating: number;
    googleRating: number;
    creatorRating: number;
    /** Dates in UTC, in milliseconds since midnight, January 1, 1970 UTC. */
    dateRange: [number, number];
    /** Sorts by distance from the user's location */
    closestToFarthestSort: boolean;
    /** Sorts by the original creation date of the post / restaurant */
    newestToOldestSort: boolean;
    /** Sort by trendiness of the restaurant */
    trendingSort: boolean;
    /** Sorts by the quality score of the restaurant */
    qualitySort: boolean;
    /** Sorts by the percent match score of the restaurant associated with the sortable data point in question */
    percentMatchSort: boolean;
    showFavoritesOnly: boolean;
    openNowOnly: boolean;

    // Reservation Criteria
    /** True if only restaurant entities with available reservations should be returned in search results, false otherwise*/
    reservableOnly: boolean;
    /** In UTC, in milliseconds since midnight, January 1, 1970 UTC. */
    targetReservationDate: number;
    /** Min is 1, max is 20 */
    targetReservationPartySize: number;

    // Sorts
    currentlySelectedPostID: string | null;

    // Filter Data Providers, populated by the current posts being displayed
    categoriesToFilterBy: string[];
    tagsToFilterBy: string[];
    priceLevelsToFilterBy: number[];
    mealTypesToFilterBy: string[];
    ratingsToFilterBy: number[];
    dateFilterRange: [number, number];

    // In-memory / Local full-text search data provider
    /** Mapping of all posts by ID to their aggregated stringified fields */
    computedPostTextContentMappings: { [postID: string]: string };

    // Searching
    searchQuery?: string;
  }

  interface FonciiRestaurantsSliceState {
    fonciiRestaurants: gql.FonciiRestaurant[];
    savedFonciiRestaurants: gql.FonciiRestaurant[];
    canPaginateSavedRestaurants: boolean;
    searchQuery: string;
    queryID?: string;
    cachedSearchQueries: CachedSearchQuery[];
    autocompleteSuggestions: gql.AutoCompleteSuggestion[];
    visibleFonciiRestaurants: gql.FonciiRestaurant[];
    isLoading: boolean;
    loadingSavedRestaurants: boolean;
  }

  /**
   * An object that allows search queries to be cached in the user's local storage and displayed when they
   * type matching characters when searching on the explore page
   */
  interface CachedSearchQuery {
    /** String of characters the user entered previously to search for establishments on the explore page */
    query: string;
    /** Time when the query was last cached, in milliseconds since midnight, January 1, 1970 UTC. This is used to evict the oldest tenants when the cache is updated */
    timestamp: number;
  }

  interface UserPostsSliceState {
    posts: gql.FmUserPost[];
    visiblePosts: gql.FmUserPost[];
    hiddenPosts: gql.FmUserPost[];
    hasImportedPostsAlready: boolean;
    isImportingPosts: boolean;
    isLoading: boolean;
    isFirstImport: boolean;
    importFailed: boolean;
  }

  interface VisitedUserSliceState {
    user: gql.FmUser | undefined;
    integrationCredentials: gql.FmIntegrationCredential[];
    posts: gql.FmUserPost[];
    visiblePosts: gql.FmUserPost[];
    isLoading: boolean;
  }

  // Redux Related Types
  /** Standard type definition for easily passing around a bundle of post filter attributes such as price levels etc. */
  interface PostFilters {
    priceLevels: number[];
    cuisineTypes: string[];
    creatorUIDs: string[];
    publications: string[];
    restaurantAwards: string[];
    customCategories: string[];
    mealTypes: string[];
    yelpRating: number;
    googleRating: number;
    creatorRating: number;
    /** Dates in UTC, in milliseconds since midnight, January 1, 1970 UTC. */
    dateRange: [number, number];
    /** Sorts by distance from the user's location */
    closestToFarthestSort: boolean;
    /** Sorts by the original creation date of the post / restaurant */
    newestToOldestSort: boolean;
    /** Sort by trendiness of the restaurant */
    trendingSort: boolean;
    /** Sorts by the quality score of the restaurant */
    qualitySort: boolean;
    /** Sorts by the percent match score of the restaurant associated with the sortable data point in question */
    percentMatchSort: boolean;
    showFavoritesOnly: boolean;
    openNowOnly: boolean;

    // Reservation Criteria
    /** True if only restaurant entities with available reservations should be returned in search results, false otherwise*/
    reservableOnly: boolean;
    /** In UTC, in milliseconds since midnight, January 1, 1970 UTC. */
    targetReservationDate: number;
    /** Min is 1, max is 20 */
    targetReservationPartySize: number;
  }

  // Local Storage
  interface LocalStorageContents {
    ReduxAppStateTree: any;
    AppDevelopmentVersion: string | undefined;
    EncryptedStagingAuthorizationCode: string | undefined;
    LogInCoolDownExpirationDate: Date | undefined;
  }

  // Session Storage
  interface SessionStorageContents {
    UserSessionID: string | undefined;
  }
}

export enum SearchBarPlaceholders {
  gallery = "What are you looking for?",
  explore = "What are you looking for?",
  generic = "Search",
}
