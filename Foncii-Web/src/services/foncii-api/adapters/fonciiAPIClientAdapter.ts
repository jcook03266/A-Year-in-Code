"use client";
// Dependencies
// Redux
import {
  FonciiUserActions,
  UserPostsActions,
  VisitedUserActions,
  PostFiltersActions,
  NotificationCenterActions,
  FonciiRestaurantActions,
} from "../../../redux/operations/dispatchers";

// Services
import { CachePolicy, FonciiAPIClient } from "../fonciiAPIService";

// GraphQL Schema Type Definitions
import { Mutations } from "./operations/mutations";
import { Queries } from "./operations/queries";

// Redux Global App Store Reference
import store from "../../../redux/store";

// Types
import {
  ArticlePublicationStandaloneOutput,
  AuthProviders,
  AvailableReservationDays,
  AvailableReservationDaysInput,
  CoordinatePoint,
  ExploreSearchAutoCompleteSuggestionsInput,
  FmIntegrationCredential,
  FmIntegrationProviders,
  FmUser,
  FmUserPost,
  FmUserPostMedia,
  FonciiAnalyticsEventPayloads,
  FonciiEvents,
  FonciiRestaurant,
  FonciiRestaurantSearchFilterInput,
  FonciiRestaurantSearchInput,
  ImpersonateUserInput,
  GetSavedRestaurantsForInput,
  IsAccountClaimedInput,
  PaginationInput,
  Query,
  ReservationAvailability,
  ReservationSearchInput,
  RestaurantAutoCompleteSuggestionsInput,
  SupportedFonciiPlatforms,
  UpdateFmUserPostCustomUserPropertiesInput,
  UpdateFmUserPostMediaInput,
  UserPostGalleryOutput,
  UserAnalyticsDashboardInput,
  AnalyticsTimespan
} from "../../../__generated__/graphql";

// Notifications
import { NotificationTemplates } from "../../../core-foncii-maps/repositories/NotificationTemplates";

// Services
import AnalyticsService, {
  AnalyticsEvents,
} from "../../../services/analytics/analyticsService";

// Managers
import UserSessionManager from "../../../managers/userSessionManager";

// User Defaults
import { defaultMapBoxCenter } from "../../../core-foncii-maps/default-values/UserDefaults";

// Utilities
import { uppercaseFirstLetter } from "../../../utilities/formatting/textContentFormatting";
import { currentDateAsISOString } from "../../../utilities/common/convenienceUtilities";
import { nonProductionEnvironment } from "../../../core-foncii-maps/properties/AppProperties";
import { EARTH_CIRCUMFERENCE_METERS } from "../../../utilities/math/euclideanGeometryMath";

/**
 * Extends the functionality of the Foncii API client by allowing the
 * execution of defined operations from a single source. Note: This service is
 * meant for directly interfacing with the local Redux store and shouldn't be
 * used in the SSR environment due to build collisions with Redux definitions.
 */
export class FonciiAPIClientAdapter extends FonciiAPIClient {
  constructor() {
    super({ sessionID: UserSessionManager.getUserSessionID() });
  }

  // Business Logic
  // Queries
  /**
   * Singular fetch endpoint for fetching a post with the given identifier, usually
   * used for post detail view when the post data isn't locally available.
   *
   * @async
   * @param postID -> ID of the singular post to fetch from the database
   * @param currentUserID
   * @param clientCoordinates
   * @param reservationSearchInput
   * @param postsToExclude -> An optional array of post IDs to exclude from the associated post and influencer edges,
   * because having the same post / creator as an influencer / associated post is counter intuitive
   *
   * @returns A promise containing the post data from the database or undefined if the
   * post could not be found.
   */
  async performFindPostByID({
    postID,
    currentUserID,
    clientCoordinates = defaultMapBoxCenter,
    reservationSearchInput,
    includeAssociatedArticles = true,
    includeAssociatedRestaurantAwards = true,
    includeInfluencerInsights = true,
    includeReservations = true
  }: {
    postID: string;
    currentUserID?: string;
    clientCoordinates?: CoordinatePoint;
    reservationSearchInput?: ReservationSearchInput;
    includeAssociatedArticles?: boolean;
    includeAssociatedRestaurantAwards?: boolean,
    includeInfluencerInsights?: boolean;
    includeReservations?: boolean;
  }): Promise<FmUserPost | undefined> {
    const query = Queries.FIND_POST_BY_ID_QUERY,
      variables = {
        postID,
        postsToExclude: [postID],
        userPersonalizationInput: {
          userID: currentUserID,
          coordinates: clientCoordinates,
          reservationSearchInput,
          includeAssociatedArticles,
          includeAssociatedRestaurantAwards,
          includeInfluencerInsights,
          includeReservations
        },
      };

    const result = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataAndFetch,
    }),
      post = result?.findPostByID ?? undefined;

    return post;
  }

  /**
   * Singular fetch endpoint for fetching a foncii restaurant with the given identifier,
   * used for restaurant detail view when the restaurant data isn't locally available.
   *
   * Note: Articles are excluded from the schema for this query as resolving them takes a lot
   * of time, fetch them separately and cache them like done with the gallery to prevent slow downs.
   *
   * @async
   * @param fonciiRestaurantID
   * @param currentUserID
   * @param clientCoordinates
   * @param reservationSearchInput
   *
   * @returns -> Foncii restaurant entity if the given ID is valid, undefined otherwise
   */
  async performGetFonciiRestaurantByID({
    fonciiRestaurantID,
    currentUserID,
    clientCoordinates = defaultMapBoxCenter,
    reservationSearchInput,
    includeAssociatedArticles = true,
    includeAssociatedRestaurantAwards = true,
    includeInfluencerInsights = true,
    includeReservations = true
  }: {
    fonciiRestaurantID: string;
    currentUserID?: string;
    clientCoordinates?: CoordinatePoint;
    reservationSearchInput?: ReservationSearchInput;
    includeAssociatedArticles?: boolean;
    includeAssociatedRestaurantAwards?: boolean,
    includeInfluencerInsights?: boolean;
    includeReservations?: boolean;
  }): Promise<FonciiRestaurant | undefined> {
    const query = Queries.GET_FONCII_RESTAURANT_BY_ID_QUERY,
      variables = {
        id: fonciiRestaurantID,
        postsToExclude: [],
        userPersonalizationInput: {
          userID: currentUserID,
          coordinates: clientCoordinates,
          reservationSearchInput,
          includeAssociatedArticles,
          includeAssociatedRestaurantAwards,
          includeInfluencerInsights,
          includeReservations
        },
      };

    const result = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataAndFetch,
    }),
      fonciiRestaurant = result?.getFonciiRestaurantByID ?? undefined;

    return fonciiRestaurant;
  }

  /**
   * Fetches the main user's data from the database (if it exists) using their
   * user ID, performed for page reloads and other context switching events.
   * Only for the main user, not for visited users.
   *
   * @async
   * @param userID -> The ID of the user to retrieve from the database
   */
  async fetchMainUser(userID: string): Promise<void> {
    const query = Queries.FIND_USER_BY_ID_FM_QUERY,
      variables = {
        userID: userID,
      };

    FonciiUserActions.setLoadingState(true);

    const result = await this.performQuery({ query, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const data = result.findUserByIDFM!;

      // Update the state with the data from the API call
      FonciiUserActions.setUser(data);
      FonciiUserActions.setLoginState(true);
      FonciiUserActions.setLoadingState(false);
    } catch (error) {
      FonciiUserActions.setLoadingState(false);

      console.error(
        `The user's account data could not be refreshed at this time. ${error}`
      );
    }
  }

  /**
   * Fetches a visited user's data from the database (if it exists) using their
   * username, and returns limited data for that person since the person
   * fetching their data is only a visitor and doesn't have access to the visited user's private data,
   * only public data. Not for main user data fetching, visited users only.
   *
   * @async
   * @param username -> The username of the visited user to retrieve from the database
   */
  async fetchVisitedUser(
    username: string,
    currentUserID?: string
  ): Promise<void> {
    const query = Queries.FIND_USER_BY_USERNAME_FM_QUERY,
      variables = {
        username,
        userToCompare: currentUserID,
      };

    const result: Query = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataAndFetch,
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined by force unwrapping
      const user = result.findUserByUsernameFM!;

      // Update the state with the data from the API call
      VisitedUserActions.setVisitedUser(user);
      VisitedUserActions.setLoadingState(false);

      // Fetch the user's posts since they're needed for display
      VisitedUserActions.getVisitedUserPosts();
      VisitedUserActions.fetchIntegrationCredentials();
    } catch (error) {
      VisitedUserActions.setLoadingState(false);

      console.error(`The visited user's data could not be fetched at this time. Their username might be invalid, or the server
            might be experiencing issues, please try again later or check their username. ${error}`);
    }
  }

  /**
   * Fetches public posts by the specified user to display for visitors
   * of their wall. Visited users only, doesn't include hidden posts so
   * can't be used by the main user for their own wall.
   *
   * @async
   * @param username -> The username of the user to fetch public posts from
   * @param currentUserID -> user ID of the user currently logged into the client
   * @param clientCoordinates
   * @param reservationSearchInput
   * @param fonciiRestaurantSearchFilterInput
   * @param paginationInput
   */
  async performFindPublicPostsByUser({
    username,
    currentUserID,
    clientCoordinates,
    reservationSearchInput,
    fonciiRestaurantSearchFilterInput,
    paginationInput,
  }: {
    username: string;
    currentUserID?: string;
    clientCoordinates?: CoordinatePoint;
    reservationSearchInput?: ReservationSearchInput;
    fonciiRestaurantSearchFilterInput?: FonciiRestaurantSearchFilterInput;
    paginationInput: PaginationInput;
  }): Promise<UserPostGalleryOutput> {
    const query = Queries.FIND_PUBLIC_POSTS_BY_USERNAME_QUERY,
      variables = {
        username,
        fonciiPostFilterInput: {
          latestByRestaurant: true,
        },
        fonciiRestaurantSearchFilterInput,
        userPersonalizationInput: {
          userID: currentUserID,
          coordinates: clientCoordinates ?? defaultMapBoxCenter,
          reservationSearchInput,
          includeAssociatedArticles: true,
          includeAssociatedRestaurantAwards: true,
          includeInfluencerInsights: true,
          includeReservations: true
        },
        paginationInput,
      };

    const result = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataAndFetch,
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      return result.findPublicPostsByUsername!;
    } catch (error) {
      console.error(`Fetching the visited user's public posts is not available at this time, please try again later or make sure the user's
             username is valid. ${error} | ${paginationInput}`);

      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.UserPostFetchError
      );

      return { posts: [], totalPosts: 0 } as UserPostGalleryOutput;
    }
  }

  /**
   * Performs geospatial + semantic search to find foncii restaurants for the explore page
   * relevant to the user's current location and search preferences.
   *
   * @async
   * @param userID -> Optional User ID to pass in case the user is logged in, this allows the percent match algorithm to function
   * @param searchCoordinates
   * @param clientCoordinates -> Physical position of the user's client
   * @param searchQuery
   * @param searchRadius -> Max search radius in meters [m], max on the server is ~ 40,075 Kilometers [km] ~ 24,902 Miles aka the entire circumference of the earth, this can be updated as needed.
   * this can be adapted as needed, but is a good reference point for now.
   * @param reservationSearchInput -> Desired reservation search criteria
   * @param fonciiRestaurantSearchFilterInput
   *
   * @return -> An array of foncii restaurants
   */
  async performFonciiRestaurantSearch({
    userID,
    searchCoordinates,
    clientCoordinates,
    searchQuery,
    searchRadius,
    reservationSearchInput,
    fonciiRestaurantSearchFilterInput,
  }: {
    userID?: string;
    searchCoordinates: CoordinatePoint;
    clientCoordinates?: CoordinatePoint;
    searchQuery: string;
    searchRadius: number;
    reservationSearchInput?: ReservationSearchInput;
    fonciiRestaurantSearchFilterInput?: FonciiRestaurantSearchFilterInput;
  }): Promise<{ fonciiRestaurants: FonciiRestaurant[], queryID?: string }> {
    const query = Queries.FONCII_RESTAURANT_SEARCH,
      variables = {
        input: {
          searchQuery,
          searchRadius,
          coordinates: searchCoordinates,
          fonciiRestaurantSearchFilterInput,
          userPersonalizationInput: {
            userID,
            coordinates: clientCoordinates ?? defaultMapBoxCenter,
            reservationSearchInput,
            includeAssociatedArticles: true,
            includeAssociatedRestaurantAwards: true,
            includeInfluencerInsights: true,
            includeReservations: true
          },
        } as FonciiRestaurantSearchInput,
      };

    const result = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataAndFetch,
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const { fonciiRestaurants, queryID } = result.fonciiRestaurantSearch!;

      // Update the state with the data from the API call
      FonciiRestaurantActions.setRestaurants(fonciiRestaurants);

      // Populate filter data providers first, then organize and filter against these providers
      PostFiltersActions.synchronizeRestaurantFiltersWithRestaurantsUpdate(
        fonciiRestaurants
      );

      FonciiRestaurantActions.organizeRestaurants();
      FonciiRestaurantActions.setLoadingState(false);

      return { fonciiRestaurants, queryID };
    } catch (error) {
      FonciiRestaurantActions.setLoadingState(false);

      console.error(
        `Error encountered while fetching restaurants, please try again soon, the server might be experiencing issues. ${error}`
      );

      return { fonciiRestaurants: [] };
    }
  }

  /**
   * Performs geospatial + semantic search to find foncii restaurants
   * for the onboarding screen.
   *
   * @async
   * @param searchQuery
   *
   * @return -> An array of foncii restaurants
   */
  async performOnboardingFonciiRestaurantSearch({
    searchQuery,
    clientCoordinates,
  }: {
    searchQuery: string;
    clientCoordinates?: CoordinatePoint;
  }): Promise<FonciiRestaurant[]> {
    const maxSearchRadius = EARTH_CIRCUMFERENCE_METERS,
      coordinates = clientCoordinates ?? defaultMapBoxCenter;

    const query = Queries.ONBOARDING_FONCII_RESTAURANT_SEARCH,
      variables = {
        input: {
          searchQuery,
          searchRadius: maxSearchRadius,
          coordinates,
          userPersonalizationInput: {
            coordinates,
          },
        } as FonciiRestaurantSearchInput,
      };

    const result = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataElseFetch,
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const { fonciiRestaurants } = result.fonciiRestaurantSearch!;
      return fonciiRestaurants;
    } catch (error) {
      console.error(
        `Error encountered while fetching restaurants, please try again soon, the server might be experiencing issues. ${error}`
      );
      return [];
    }
  }

  /**
   * For gallery authors only. Fetches all public and hidden posts.
   *
   * @async
   * @param userID
   */
  async performFindAllPostsByUser({
    userID,
    currentUserID,
    clientCoordinates,
    reservationSearchInput,
    fonciiRestaurantSearchFilterInput,
    paginationInput,
  }: {
    userID: string;
    currentUserID?: string;
    clientCoordinates?: CoordinatePoint;
    reservationSearchInput?: ReservationSearchInput;
    fonciiRestaurantSearchFilterInput?: FonciiRestaurantSearchFilterInput;
    paginationInput: PaginationInput;
  }): Promise<UserPostGalleryOutput> {
    const query = Queries.FIND_ALL_POSTS_BY_USER_ID_QUERY,
      variables = {
        userID,
        fonciiRestaurantSearchFilterInput,
        postsToExclude: [],
        userPersonalizationInput: {
          userID: currentUserID,
          coordinates: clientCoordinates ?? defaultMapBoxCenter,
          reservationSearchInput,
          includeAssociatedArticles: true,
          includeAssociatedRestaurantAwards: true,
          includeInfluencerInsights: true,
          includeReservations: true
        },
        paginationInput,
      };

    const result = await this.performQuery({ query, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      return result.findAllPostsByUserID;
    } catch (error) {
      console.error(`Fetching the current user's posts is not possible at this time, please try again. 
            The following error has been encountered: ${error} | ${paginationInput}`);

      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.UserPostFetchError
      );

      return { posts: [], totalPosts: 0 } as UserPostGalleryOutput;
    }
  }

  /**
   * Finds available reservations for the given restaurant with
   * the specified reservation search criteria. This is used to refresh
   * detail view data periodically to keep the time table up to date when
   * the user views it.
   *
   * @async
   * @param fonciiRestaurantID
   * @param reservationSearchInput
   *
   * @returns -> An array of reservation availabilities for the target
   * restaurant
   */
  async performFindReservationAvailabilitiesFor({
    fonciiRestaurantID,
    reservationSearchInput,
  }: {
    fonciiRestaurantID: string;
    reservationSearchInput?: ReservationSearchInput;
  }): Promise<ReservationAvailability[]> {
    const query = Queries.FIND_RESERVATION_AVAILABILITIES_FOR_QUERY,
      variables = {
        fonciiRestaurantID,
        reservationSearchInput,
      };

    const result = await this.performQuery({ query, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const reservationAvailabilities = result.findReservationAvailabilitiesFor;

      return reservationAvailabilities;
    } catch (error) {
      console.error(
        `An error occurred while finding reservation availabilities for: ${fonciiRestaurantID}. Error: ${error}`
      );

      return [];
    }
  }

  /**
   * Finds available reservation days for the given restaurant with
   * the specified reservation search criteria. This is used to gray out calendar days
   * as well as obtain next available table
   *
   * @async
   * @param fonciiRestaurantID
   * @param reservationSearchInput
   *
   * @returns -> An array of reservation availabilities for the target
   * restaurant
   */
  async performFindAvailableReservationDaysFor({
    fonciiRestaurantID,
    availableReservationDaysInput,
  }: {
    fonciiRestaurantID: string;
    availableReservationDaysInput?: AvailableReservationDaysInput;
  }): Promise<AvailableReservationDays | undefined> {
    const query = Queries.FIND_AVAILABLE_RESERVATION_DAYS_FOR_QUERY,
      variables = {
        fonciiRestaurantID,
        availableReservationDaysInput,
      };

    const result = await this.performQuery({ query, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const reservationAvailabilities = result.findAvailableReservationDaysFor;

      return reservationAvailabilities ?? undefined;
    } catch (error) {
      console.error(
        `An error occurred while finding reservation availabilities for: ${fonciiRestaurantID}. Error: ${error}`
      );
      return undefined;
    }
  }

  /**
   * Fetches the associated articles for the given
   * restaurant ID.
   *
   * @async
   * @param restaurantID
   *
   * @returns -> The full result containing the article publications
   */
  async performFindAssociatedArticlesFor(
    restaurantID: string
  ): Promise<ArticlePublicationStandaloneOutput> {
    const query = Queries.FIND_ASSOCIATED_ARTICLES_FOR_QUERY,
      variables = {
        restaurantID
      };

    // Articles are federated from S3 and take a longer time to resolve, if cached, return them immediately, else fetch if not available to speed up this functionality
    const result = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataElseFetch,
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const associatedArticlesOutput = result.findAssociatedArticlesFor!;

      return associatedArticlesOutput;
    } catch (error) {
      console.error(
        `An error occurred while finding associated articles for Foncii restaurant: ${restaurantID}. Error: ${error}`
      );

      return { associatedArticlePublicationEdges: [] };
    }
  }

  /**
   * @async
   * @param galleryAuthorID
   * @param searchQuery
   *
   * @returns -> A sorted array of mixed user post suggestions from various sources
   */
  async performGallerySearchAutoCompleteSuggestions({
    galleryAuthorID,
    searchQuery,
  }: {
    galleryAuthorID: string;
    searchQuery: string;
  }) {
    const query = Queries.GALLERY_SEARCH_AUTO_COMPLETE_SUGGESTIONS_QUERY,
      variables = {
        input: {
          galleryAuthorID,
          searchQuery,
        },
      };

    return (
      await this.performQuery({
        query,
        variables,
        cachePolicy: CachePolicy.returnCacheDataElseFetch,
      })
    ).gallerySearchAutoCompleteSuggestions;
  }

  /**
   * @async
   * @param searchQuery
   * @param isUserLoggedIn // Only registered users can access google auto-complete search results due to the billing costs associated with them
   *
   * @returns -> A sorted array of mixed restaurant suggestions from various sources
   */
  async performRestaurantAutoCompleteSuggestions({
    searchQuery,
  }: {
    searchQuery: string;
  }) {
    const query = Queries.RESTAURANT_AUTO_COMPLETE_SUGGESTIONS_QUERY,
      variables = {
        input: {
          searchQuery,
          injectExternalSuggestions: true,
        } as RestaurantAutoCompleteSuggestionsInput,
      };

    return (
      await this.performQuery({
        query,
        variables,
        cachePolicy: CachePolicy.returnCacheDataElseFetch,
      })
    ).restaurantAutoCompleteSuggestions;
  }

  /**
   * @async
   * @param searchQuery
   * @param isUserLoggedIn // Only registered users can access google auto-complete search results due to the billing costs associated with them
   *
   * @returns -> A sorted array of mixed restaurant, user post, user, popular search term suggestions from various sources
   */
  async performExploreSearchAutoCompleteSuggestions({
    searchQuery,
    isUserLoggedIn,
  }: {
    searchQuery: string;
    isUserLoggedIn: boolean;
  }) {
    const query = Queries.EXPLORE_SEARCH_AUTO_COMPLETE_SUGGESTIONS_QUERY,
      variables = {
        input: {
          searchQuery,
          injectExternalSuggestions: true,
          includeUserPostSuggestions: true,
          includeUserSuggestions: true,
          includePopularSearchTerms: true,
        } as ExploreSearchAutoCompleteSuggestionsInput,
      };

    return (
      await this.performQuery({
        query,
        variables,
        cachePolicy: CachePolicy.returnCacheDataElseFetch,
      })
    ).exploreSearchAutoCompleteSuggestions;
  }

  /**
   * Usually used when the user logs in with a username + password. Since the default
   * auth provider is the email + password approach this solution just uses the
   * username as a proxy for obtaining the right account information given its
   * association with the respective email address.
   *
   * @async
   * @param username
   *
   * @returns -> The email associated with the username (if any), undefined if the
   * username given does not have an email associated with it in our database.
   */
  async performGetUserEmailFromUsername(
    username: string
  ): Promise<string | undefined> {
    const query = Queries.GET_USER_EMAIL_FROM_USERNAME_FM_QUERY,
      variables = {
        username,
      };

    return (
      (await this.performQuery({ query, variables }))
        .getUserEmailFromUsernameFM ?? undefined
    );
  }

  /**
   * @async
   * @param username
   *
   * @returns -> True if the username exists already, false otherwise.
   */
  async performDoesUsernameExist(username: string): Promise<Boolean> {
    const query = Queries.DOES_USERNAME_EXIST_FM_QUERY,
      variables = {
        username,
      };

    return (await this.performQuery({ query, variables })).doesUsernameExistFM;
  }

  /**
   * @async
   * @param username
   *
   * @returns -> True if the email exists already, false otherwise.
   */
  async performDoesEmailExist(email: string): Promise<Boolean> {
    const query = Queries.DOES_EMAIL_EXIST_FM_QUERY,
      variables = {
        email,
      };

    return (await this.performQuery({ query, variables })).doesEmailExistFM;
  }

  /**
   * @async
   * @param userID
   *
   * @returns -> Unique set of integration credentials belonging to the user associated with the given
   * user ID.
   */
  async performGetUserIntegrationCredentials(
    userID: string
  ): Promise<FmIntegrationCredential[] | undefined> {
    const query = Queries.GET_USER_INTEGRATION_CREDENTIALS_QUERY,
      variables = {
        userID,
      };

    const result = await this.performQuery({ query, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const integrationCredentials = result.getUserIntegrationCredentials!;

      FonciiUserActions.setIntegrationCredentials(integrationCredentials);
      FonciiUserActions.setLoadingState(false);

      return integrationCredentials;
    } catch (error) {
      // Don't reset the current integration credentials stored in the user store (if any) since this is
      // fetch failure and not a defined result.
      FonciiUserActions.setLoadingState(false);

      console.error(
        `[performGetUserIntegrationCredentials] An error occurred while fetching the user's integration credentials. Error: ${error}`
      );
      return undefined;
    }
  }

  /**
   * Used to fetch partial integration credential information for visited users
   * (non-primary user accounts) for the purpose of parsing their social media links
   * from their existing providers.
   *
   * @async
   * @param userID
   *
   * @returns -> Unique set of integration credentials belonging to the user (preferably a non-user / non-primary user)
   * associated with the given user ID.
   */
  async performGetNonUserIntegrationCredentials(
    userID: string
  ): Promise<FmIntegrationCredential[] | undefined> {
    const query = Queries.GET_NON_USER_INTEGRATION_CREDENTIALS_QUERY,
      variables = {
        userID,
      };

    const result = await this.performQuery({ query, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const integrationCredentials = result.getUserIntegrationCredentials!;

      VisitedUserActions.setIntegrationCredentials(integrationCredentials);

      return integrationCredentials;
    } catch (error) {
      // Clear the current integration credentials stored in the visited user store (if any) since this is
      // fetch failure and not a defined result.
      VisitedUserActions.clearAllIntegrationCredentials();

      console.error(
        `[performGetNonUserIntegrationCredentials] An error occurred while fetching the user's integration credentials. Error: ${error}`
      );
      return undefined;
    }
  }

  /**
   * @async
   *
   * @returns -> An array of cuisines
   */
  async performFetchAllCuisines() {
    const query = Queries.FETCH_ALL_CUISINES,
      result = await this.performQuery({
        query,
        cachePolicy: CachePolicy.returnCacheDataElseFetch,
      });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const cuisines = result.fetchAllCuisines!;
      return cuisines;
    } catch (error) {
      console.error(
        `An error occurred while fetching cuisines. Error: ${error}`
      );

      return [];
    }
  }

  /**
   * @async
   *
   * @returns -> An array of dietary restrictions
   */
  async performFetchAllDietaryRestrictions() {
    const query = Queries.FETCH_ALL_DIETARY_RESTRICTIONS,
      result = await this.performQuery({
        query,
        cachePolicy: CachePolicy.returnCacheDataElseFetch,
      });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const dietaryRestrictions = result.fetchAllDietaryRestrictions!;
      return dietaryRestrictions;
    } catch (error) {
      console.error(
        `An error occurred while fetching dietary restrictions. Error: ${error}`
      );

      return [];
    }
  }

  /**
   * @async
   * @param restaurantID
   * @param currentUserID
   * @param clientCoordinates
   *
   * @returns -> A list of similar restaurants given the restaurant ID passed as argument
   */
  async performFindRestaurantsSimilarTo({
    restaurantID,
    currentUserID,
    clientCoordinates,
  }: {
    restaurantID: string;
    currentUserID?: string;
    clientCoordinates?: CoordinatePoint;
  }): Promise<FonciiRestaurant[]> {
    const query = Queries.FIND_RESTAURANTS_SIMILAR_TO,
      variables = {
        restaurantID,
        userPersonalizationInput: {
          userID: currentUserID,
          coordinates: clientCoordinates ?? defaultMapBoxCenter,
          includeAssociatedArticles: true,
          includeAssociatedRestaurantAwards: true,
          includeInfluencerInsights: true,
          includeReservations: false
        },
      };

    const result = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataAndFetch,
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const restaurants = result.findRestaurantsSimilarTo!;

      return restaurants;
    } catch (error) {
      console.error(
        `Error encountered while fetching similar restaurants. ${error}`
      );

      return [];
    }
  }

  /**
   * @async
   * @param fonciiRestaurantID
   * @param postsToExclude -> Use to exclude the actual user post itself when using this with user posts
   *
   * @returns -> A list of associated user posts given the Foncii restaurant ID passed as argument
   */
  async performFindAssociatedPostsFor({
    fonciiRestaurantID,
    creatorID,
    postsToExclude,
    currentUserID,
    clientCoordinates,
  }: {
    fonciiRestaurantID: string;
    creatorID?: string;
    postsToExclude?: string[];
    currentUserID?: string;
    clientCoordinates?: CoordinatePoint;
  }): Promise<FmUserPost[]> {
    const query = Queries.FIND_ASSOCIATED_POSTS_FOR,
      variables = {
        fonciiRestaurantID,
        creatorID,
        postsToExclude,
        userPersonalizationInput: {
          userID: currentUserID,
          coordinates: clientCoordinates ?? defaultMapBoxCenter,
          includeAssociatedArticles: true,
          includeAssociatedRestaurantAwards: true,
          includeInfluencerInsights: false,
          includeReservations: false,
        },
      };

    const result = await this.performQuery({ query, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const posts = result.findAssociatedPostsFor!;

      return posts;
    } catch (error) {
      console.error(
        `Error encountered while fetching associated posts. ${error}`
      );

      return [];
    }
  }

  /**
   * @async
   * @param coordinates
   * @param searchRadius
   * @param currentUserID -> ID of the current user (if any) to use to generate a % match score between the user
   * and the influencer
   *
   * @returns -> The influencer leaderboard for the given area of interest (coordinates + radius)
   */
  async fetchLocalInfluencerLeaderboard({
    coordinates,
    searchRadius,
    currentUserID,
  }: {
    coordinates: CoordinatePoint;
    searchRadius: number;
    currentUserID?: string;
  }) {
    const query = Queries.FETCH_LOCAL_INFLUENCER_LEADERBOARD_QUERY,
      variables = {
        input: {
          coordinates,
          searchRadius,
        },
        userToCompare: currentUserID,
      };

    // This data won't change frequently so it's best to cache it and just return the cache if a request hits
    const result: Query = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataElseFetch,
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined by force unwrapping
      const influencerLeaderboard = result.fetchLocalInfluencerLeaderboard!;

      return influencerLeaderboard;
    } catch (error) {
      console.error(
        `[fetchLocalInfluencerLeaderboard] Error encountered. ${error}`
      );
    }
  }

  /**
   * @async
   *
   * @returns -> A list of the most frequently used user tags
   */
  async fetchPopularUserTags() {
    const query = Queries.FETCH_POPULAR_USER_TAGS_QUERY;

    // This data won't change frequently so it's best to cache it and just return the cache if a request hits
    const result: Query = await this.performQuery({
      query,
      cachePolicy: CachePolicy.returnCacheDataElseFetch,
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined by force unwrapping
      const popularUserTags = result.fetchPopularUserTags!;

      return popularUserTags;
    } catch (error) {
      console.error(`[fetchPopularUserTags] Error encountered. ${error}`);

      return [];
    }
  }

  /**
   * @async
   * @param searchQuery
   *
   * @returns -> A list of matching user tags that match the suggested auto-complete criteria
   * of the search query
   */
  async userTagAutoCompleteSuggestions(searchQuery: string) {
    const query = Queries.USER_TAG_AUTO_COMPLETE_SUGGESTIONS_QUERY,
      variables = {
        searchQuery,
      };

    // This data won't change frequently so it's best to cache it and just return the cache if a request hits
    const result: Query = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataElseFetch,
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined by force unwrapping
      const autocompleteSuggestions = result.userTagAutoCompleteSuggestions!;

      return autocompleteSuggestions;
    } catch (error) {
      console.error(
        `[userTagAutoCompleteSuggestions] Error encountered. ${error}`
      );

      return [];
    }
  }

  /**
   * @async
   * @param userID -> The user to fetch saved restaurants for
   * @param paginationOffset -> The number of elements to offset the query by to `paginate` to the next `page` of elements
   *
   * @returns -> A collection of restaurants saved by the target user
   */
  async performGetSavedRestaurantsFor(
    {
      userID,
      paginationPageIndex = 0,
      resultsPerPage,
    }: {
      userID: string;
      paginationPageIndex?: number;
      resultsPerPage: number;
    },
    {
      reservationSearchInput,
      clientCoordinates,
    }: {
      reservationSearchInput?: ReservationSearchInput;
      clientCoordinates?: CoordinatePoint;
    }
  ) {
    const query = Queries.GET_SAVED_RESTAURANTS_QUERY,
      variables = {
        input: {
          userPersonalizationInput: {
            userID,
            coordinates: clientCoordinates ?? defaultMapBoxCenter,
            reservationSearchInput,
            includeAssociatedArticles: true,
            includeAssociatedRestaurantAwards: true,
            includeInfluencerInsights: true,
            includeReservations: true
          },
          paginationPageIndex,
          resultsPerPage,
        } as GetSavedRestaurantsForInput,
      };

    FonciiRestaurantActions.setLoadingSavedRestaurantsState(true);

    const result: Query = await this.performQuery({ query, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined by force unwrapping
      const savedFonciiRestaurants = result.getSavedRestaurantsFor!,
        savedFonciiRestaurantCount = savedFonciiRestaurants.length,
        canPaginateFurther = savedFonciiRestaurantCount > 0;

      // Update the state with the data from the API call
      // Initial data fetch and set
      if (paginationPageIndex == 0) {
        FonciiRestaurantActions.setSavedRestaurants(savedFonciiRestaurants);
      } else {
        // Append the paginated saved foncii restaurants
        FonciiRestaurantActions.insertSavedRestaurants(savedFonciiRestaurants);
      }

      // Update pagination state for the saved foncii restaurants collection
      FonciiRestaurantActions.setCanPaginateSavedRestaurants(canPaginateFurther);
      FonciiRestaurantActions.setLoadingSavedRestaurantsState(false);

      return savedFonciiRestaurants;
    } catch (error) {
      console.error(
        `[performGetSavedRestaurantsFor] Error encountered: `,
        error
      );
      FonciiRestaurantActions.setLoadingSavedRestaurantsState(false);

      return [];
    }
  }

  /**
   * Determines whether or not a user's account has been claimed yet. An account is marked as `claimed` if the user has access
   * to the account and has logged in normally, and unclaimed if the account is auto-generated and the user hasn't logged into
   * their account for the first time manually yet.
   *
   * @async
   * @param userID
   *
   * @returns -> True if the account has been marked as claimed (user has access to the account and has logged in normally),
   * false otherwise (account auto-generated and the user hasn't logged into their account for the first time manually yet).
   */
  async isAccountClaimed(userID: string): Promise<boolean> {
    const query = Queries.IS_ACCOUNT_CLAIMED,
      variables = {
        input: {
          userID,
          platform: SupportedFonciiPlatforms.Foncii,
        } as IsAccountClaimedInput
      };

    // Can't cache, result must be the latest representation of the current remote user state
    const result: Query = await this.performQuery({ query, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined by force unwrapping
      const isAccountClaimed = result.isAccountClaimed!;

      return isAccountClaimed;
    } catch (error) {
      console.error(`[isAccountClaimed] Error encountered. ${error}`);

      return false;
    }
  }

  /**
   * Fetches and returns the data for the analytics dashboard in question.
   * 
   * @async
   * @param userID -> The user to compute the dashboard relative to.
   * @param timespan -> The timespan to compute the dashboard for.
   * 
   * @returns -> The data for the analytics dashboard in question.
   */
  async fetchUserMapAnalyticsDashboard({
    userID,
    timespan
  }: {
    userID: string,
    timespan: AnalyticsTimespan
  }) {
    const query = Queries.FETCH_USER_MAP_ANALYTICS_DASHBOARD,
      variables = {
        input: {
          userID,
          timespan
        } as UserAnalyticsDashboardInput
      };

    // Return cache (if any) and fetch the latest data to return as a cache the next time
    // The caching policy is cache prioritized because these dashboards don't update frequently
    const result: Query = await this.performQuery({ query, variables, cachePolicy: CachePolicy.returnCacheDataAndFetch });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined by force unwrapping
      const data = result.fetchUserMapAnalyticsDashboard!;

      return data;
    } catch (error) {
      console.error(`[fetchUserMapAnalyticsDashboard] Error encountered. ${error}`);

      return undefined;
    }
  }

  /**
   * Fetches and returns the data for the analytics dashboard in question.
   * 
   * @async
   * @param userID -> The user to compute the dashboard relative to.
   * @param timespan -> The timespan to compute the dashboard for.
   * 
   * @returns -> The data for the analytics dashboard in question.
   */
  async fetchBusinessWebsiteAnalyticsDashboard({
    userID,
    timespan
  }: {
    userID: string,
    timespan: AnalyticsTimespan
  }) {
    const query = Queries.FETCH_USER_BUSINESS_WEBSITE_ANALYTICS_DASHBOARD,
      variables = {
        input: {
          userID,
          timespan
        } as UserAnalyticsDashboardInput
      };

    // Return cache (if any) and fetch the latest data to return as a cache the next time
    // The caching policy is cache prioritized because these dashboards don't update frequently
    const result: Query = await this.performQuery({ query, variables, cachePolicy: CachePolicy.returnCacheDataAndFetch });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined by force unwrapping
      const data = result.fetchUserBusinessWebsiteAnalyticsDashboard!;

      return data;
    } catch (error) {
      console.error(`[fetchBusinessWebsiteAnalyticsDashboard] Error encountered. ${error}`);

      return undefined;
    }
  }

  /**
   * Fetches and returns the data for the analytics dashboard in question.
   * 
   * @async
   * @param userID -> The user to compute the dashboard relative to.
   * @param timespan -> The timespan to compute the dashboard for.
   * 
   * @returns -> The data for the analytics dashboard in question.
   */
  async fetchReservationIntentsAnalyticsDashboard({
    userID,
    timespan
  }: {
    userID: string,
    timespan: AnalyticsTimespan
  }) {
    const query = Queries.FETCH_USER_RESERVATIONS_INTENTS_ANALYTICS_DASHBOARD,
      variables = {
        input: {
          userID,
          timespan
        } as UserAnalyticsDashboardInput
      };

    // Return cache (if any) and fetch the latest data to return as a cache the next time
    // The caching policy is cache prioritized because these dashboards don't update frequently
    const result: Query = await this.performQuery({ query, variables, cachePolicy: CachePolicy.returnCacheDataAndFetch });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined by force unwrapping
      const data = result.fetchUserReservationsIntentsAnalyticsDashboard!;

      return data;
    } catch (error) {
      console.error(`[fetchReservationIntentsAnalyticsDashboard] Error encountered. ${error}`);

      return undefined;
    }
  }

  /// Mutations
  /**
   * Creates a new post for the user to customize from scratch.
   * This is obviously different from imported posts in the sense
   * that the user has to upload their media for the post manually
   * through the client.
   *
   * @async
   * @param userID
   *
   * @returns -> The newly created manually added post.
   */
  async createUserPost(args: { userID: string }) {
    const mutation = Mutations.CREATE_USER_POST_MUTATION,
      variables = {
        input: {
          ...args,
        },
      };

    UserPostsActions.setLoadingState(true);

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const newPost = result.createUserPost!;

      UserPostsActions.appendPost(newPost);
      UserPostsActions.organizePosts();
      UserPostsActions.setLoadingState(false);

      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostCreated
      );

      return newPost;
    } catch (error) {
      UserPostsActions.setLoadingState(false);

      AnalyticsService.shared.trackGenericEvent(
        AnalyticsEvents.POST_CREATION_FAILED,
        { userID: args.userID }
      );

      console.error(
        `An error was encountered while creating a new user post: ${error}`
      );
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostCreationError
      );

      return null;
    }
  }

  async performCreateUserSession(args: {
    userID?: string;
    deviceID: string;
    referrer: string;
    clientGeolocation?: CoordinatePoint;
    language: string;
    amplitudeSessionID?: number;
  }) {
    const mutation = Mutations.CREATE_USER_SESSION_MUTATION,
      variables = {
        input: {
          ...args,
          platform: SupportedFonciiPlatforms.Foncii,
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const userSession = result.createUserSession!;
      return userSession;
    } catch (error) {
      console.error(
        `Error encountered while trying to create a new user session: ${error}`
      );
      return null;
    }
  }

  async performSendUserSessionHeartBeat({
    sessionID,
    clientGeolocation,
  }: {
    sessionID: string;
    clientGeolocation?: CoordinatePoint;
  }) {
    const mutation = Mutations.SEND_USER_SESSION_HEART_BEAT_MUTATION,
      variables = {
        input: {
          sessionID,
          clientGeolocation,
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const userSession = result.sendUserSessionHeartBeat!;
      return userSession;
    } catch (error) {
      console.error(
        `Error encountered while sending heart beat signal for user session: ${error}`
      );
      return null;
    }
  }

  async performEndUserSession(sessionID: string): Promise<boolean> {
    const mutation = Mutations.END_USER_SESSION_MUTATION,
      variables = { sessionID };

    const result = await this.performMutation({ mutation, variables });

    return result.endUserSession;
  }

  /**
   * Tracks the user's sign out event in the backend
   *
   * @async
   * @param {String} userID -> The user to track sign outs from
   */
  async performSignOutUser(userID: string): Promise<void> {
    const mutation = Mutations.SIGN_OUT_USER_FM_MUTATION,
      variables = {
        userId: userID,
      };

    const result = await this.performMutation({ mutation, variables });

    if (result != undefined) {
      // No parsing required, this closure symbolizes a successful sign out, thus we continue.
      FonciiUserActions.setLoadingState(false);
    } else {
      FonciiUserActions.setLoadingState(false);

      console.error(`The user sign out operation is currently unavailable.`);
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.UnknownError
      );
    }
  }

  /**
   * Sets the user's profile picture using the passed file data (if any) and user credentials.
   *
   * @param userID -> ID of the user to update the profile picture for
   * @param fileDataBufferString -> Stringified raw UInt8Array, do not pass an encoded string. Pass undefined to
   * delete the user's profile picture.
   *
   * @returns -> True if the operation succeeded, false otherwise.
   */
  async performSetUserProfilePicture(
    userID: string,
    fileDataBufferString: string | undefined
  ): Promise<boolean> {
    const mutation = Mutations.SET_USER_PROFILE_PICTURE_MUTATION,
      variables = {
        input: {
          fileUploadRequest: {
            userID,
            fileDataBuffer: fileDataBufferString,
          },
          platform: SupportedFonciiPlatforms.Foncii,
        },
      };

    // Inform store of on-going async user related process
    FonciiUserActions.setLoadingState(true);

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const didSucceed = result.setUserProfilePicture;

      // Force throw
      if (!didSucceed) throw new Error("Operation Failed");

      // Refresh the user's data entirely to match the updated remote data entity
      await FonciiUserActions.refreshUserProfile();
      FonciiUserActions.setLoadingState(false);

      AnalyticsService.shared.trackGenericEvent(
        didSucceed
          ? AnalyticsEvents.USER_PROFILE_PICTURE_UPDATED
          : AnalyticsEvents.USER_PROFILE_PICTURE_UPDATE_FAILED,
        { removal: fileDataBufferString == undefined }
      );

      return didSucceed;
    } catch (error) {
      FonciiUserActions.setLoadingState(false);

      console.error(
        `An error occurred while updating the user's profile picture, please try again later ${error}`
      );
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.UserProfileUpdateError
      );

      AnalyticsService.shared.trackGenericEvent(
        AnalyticsEvents.USER_PROFILE_PICTURE_UPDATE_FAILED,
        { removal: fileDataBufferString == undefined }
      );

      return false;
    }
  }

  /**
   * Updates the user's map name (if available), if not then an error
   * is passed back from the API call
   *
   * @async
   * @param newMapName -> Valid and unique new map name to replace the user's current map name
   * @param userID
   *
   * @returns -> True if the map name was updated successfully, false otherwise
   */
  async performUpdateUserMapName(
    newMapName: string,
    userID: string
  ): Promise<Boolean> {
    const mutation = Mutations.UPDATE_MAP_NAME_FM_MUTATION,
      variables = {
        input: {
          newMapName,
          userID,
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const didSucceed = result.updateMapNameFM;

      // Force throw
      if (!didSucceed) throw new Error("Operation Failed");

      // Refresh the user's data entirely to match the updated remote data entity
      FonciiUserActions.refreshUserProfile();
      FonciiUserActions.setLoadingState(false);

      return didSucceed;
    } catch (error) {
      FonciiUserActions.setLoadingState(false);

      console.error(`The current user's map name could not be updated at this time, either the new name is invalid or not unique,
            or the server is currently experiencing issues. The following error has been encountered: ${error}`);
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.UserProfileUpdateError
      );

      return false;
    }
  }

  /**
   * Updates the post's restaurant data using the passed google place ID from the autocomplete modal
   * which the user uses to find the restaurant associated with their post/
   *
   * @async
   * @param postID -> The id of the post to update
   * @param userID -> The user the post belongs to (required)
   * @param googlePlaceID -> The google place ID to use to update the post's restaurant data, pass
   * an undefined value to remove the associated restaurant from the post
   *
   * @returns -> True if the operation succeeded, and false otherwise
   */
  async performUpdatePostRestaurantData(
    {
      postID,
      userID,
      googlePlaceID,
    }: {
      postID: string;
      userID: string;
      googlePlaceID: string | undefined;
    },
    {
      reservationSearchInput,
      clientCoordinates,
    }: {
      reservationSearchInput?: ReservationSearchInput;
      clientCoordinates?: CoordinatePoint;
    }
  ): Promise<Boolean> {
    const mutation = Mutations.UPDATE_POST_RESTAURANT_DATA_MUTATION,
      variables = {
        input: {
          googlePlaceID: googlePlaceID,
          userInput: {
            postID: postID,
            userID: userID,
          },
        },
        postsToExclude: [postID],
        userPersonalizationInput: {
          userID,
          coordinates: clientCoordinates ?? defaultMapBoxCenter,
          reservationSearchInput,
          includeAssociatedArticles: true,
          includeAssociatedRestaurantAwards: true,
          includeInfluencerInsights: true,
          includeReservations: true
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const data = result.updatePostRestaurantData,
        updatedPost = data!;

      UserPostsActions.updatePost(updatedPost);
      UserPostsActions.organizePosts();
      UserPostsActions.setLoadingState(false);

      return true;
    } catch (error) {
      UserPostsActions.setLoadingState(false);

      console.error(`Updating the currently selected post's associated restaurant data is not possible at this time, please try again. 
            The following error has been encountered: ${error}`);
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostUpdateError
      );

      return false;
    }
  }

  /**
   * Updates the user post's media properties in the database using the
   * given properties from the client-based upload process. Files are uploaded
   * from the client and their properties (URLs etc) are simply pushed to
   * the API to update the database with.
   *
   * @async
   * @param postID
   * @param userID
   * @param mediaInput
   *
   * @returns -> True if the update was successful, false otherwise.
   */
  async performUpdatePostMedia(args: {
    userInput: {
      postID: string;
      userID: string;
    };
    mediaInput: FmUserPostMedia;
  }): Promise<Boolean> {
    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      entityFilters = store.getState().postFilters,
      clientCoordinates = currentUser.clientCoordinates;

    // Reservation search input
    const targetDate = new Date(
      entityFilters.targetReservationDate
    ).toISOString(),
      partySize = entityFilters.targetReservationPartySize;

    const reservationSearchInput = {
      targetDate,
      partySize,
    };

    const mutation = Mutations.UPDATE_POST_MEDIA_MUTATION,
      variables = {
        input: {
          ...args,
        } as UpdateFmUserPostMediaInput,
        postsToExclude: [args.userInput.postID],
        userPersonalizationInput: {
          userID: args.userInput.userID,
          coordinates: clientCoordinates ?? defaultMapBoxCenter,
          reservationSearchInput,
          includeAssociatedArticles: true,
          includeAssociatedRestaurantAwards: true,
          includeInfluencerInsights: true,
          includeReservations: true
        },
      };

    UserPostsActions.setLoadingState(true);

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const data = result.updatePostMedia,
        updatedPost = data!;

      UserPostsActions.updatePost(updatedPost);
      UserPostsActions.organizePosts();
      UserPostsActions.setLoadingState(false);

      return true;
    } catch (error) {
      UserPostsActions.setLoadingState(false);

      console.error(
        `An error was encountered while updating the post's media: ${error}`
      );
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostUpdateError
      );

      return false;
    }
  }

  /**
   * Updates the favorited state of the post using the passed boolean value, this state is used to sort the user's posts
   * with favorited posts being pushed to the top of the user's list of posts
   *
   * @async
   * @param post -> The id of the post to update
   * @param userID -> The user the post belongs to (required)
   * @param isFavorited -> True the post is favorited, false the post is not favorited,
   * favorited posts are displayed at the top of the user's posts
   *
   * @returns -> True if the update was successful, false otherwise
   */
  async performUpdatePostFavoriteState(
    post: FmUserPost,
    userID: string,
    isFavorited: boolean
  ): Promise<Boolean> {
    const mutation = Mutations.UPDATE_POST_FAVORITE_STATE_MUTATION,
      variables = {
        input: {
          isFavorited: isFavorited,
          userInput: {
            postID: post.id,
            userID: userID,
          },
        },
      };

    // Optimistic Updates, roll back if the update fails
    const updatedPost: FmUserPost = {
      ...post,
      isFavorited,
    };
    UserPostsActions.updatePost(updatedPost);
    UserPostsActions.organizePosts();

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const didSucceed = result.updatePostFavoriteState!;

      // Force throw
      if (!didSucceed) throw new Error("Operation Failed");

      UserPostsActions.setLoadingState(false);

      return didSucceed;
    } catch (error) {
      // Roll back the optimistic update
      UserPostsActions.updatePost(post);
      UserPostsActions.organizePosts();
      UserPostsActions.setLoadingState(false);

      console.error(`Updating the target post's favorited state is not possible at this time, please try again. 
            The following error has been encountered: ${error}`);
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostUpdateError
      );

      return false;
    }
  }

  /**
   * Saves the target restaurant + user post (if any) if the restaurant wasn't already saved
   * by the given user, and unsaves the restaurant if it was already saved. This performs an
   * optimistic update which is rolled back in case the operation fails. User posts +
   * restaurants are organized following the optimistic update / rollback.
   *
   * @async
   * @param userID -> The user to save the restaurant for. Allows them to view it later in their own saved collection.
   * @param post -> The post associated with the restaurant (if the restaurant was saved from a post)
   * @param fonciiRestaurant -> The target restaurant to be saved
   *
   * @returns -> True if the operation was successful, false otherwise
   */
  async handleRestaurantSave({
    userID,
    post,
    fonciiRestaurant,
  }: {
    userID: string;
    post?: FmUserPost;
    fonciiRestaurant: FonciiRestaurant;
  }): Promise<boolean> {
    // Parsing
    const postID = post?.id,
      fonciiRestaurantID = fonciiRestaurant.restaurant.id,
      // Invert the current save state
      isSaved: boolean = !fonciiRestaurant.isSaved;

    const mutation = isSaved
      ? Mutations.SAVE_RESTAURANT_MUTATION
      : Mutations.UNSAVE_RESTAURANT_MUTATION,
      variables = {
        input: {
          userID,
          postID,
          fonciiRestaurantID,
        },
      };

    // Optimistic Updates, roll back if the update fails
    const updatedRestaurant: FonciiRestaurant = {
      ...fonciiRestaurant,
      isSaved,
    };

    // Optimistic updates for restaurant content and user post (if any)
    FonciiRestaurantActions.updateRestaurant(updatedRestaurant);
    FonciiRestaurantActions.organizeRestaurants();

    VisitedUserActions.updatePostsWithRestaurant(updatedRestaurant);
    UserPostsActions.updatePostsWithRestaurant(updatedRestaurant);

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const didSucceed = isSaved
        ? result.saveRestaurant!
        : result.unsaveRestaurant!;

      // Force throw
      if (!didSucceed) throw new Error("Operation Failed");

      // Update or remove the saved restaurant from the saved restaurants collection
      isSaved
        ? FonciiRestaurantActions.appendSavedRestaurant(updatedRestaurant)
        : FonciiRestaurantActions.removeSavedRestaurant(fonciiRestaurantID);

      // Event logging
      AnalyticsService.shared.trackGenericEvent(
        isSaved
          ? AnalyticsEvents.FONCII_RESTAURANT_SAVED
          : AnalyticsEvents.FONCII_RESTAURANT_UNSAVED,
        { userID, postID, fonciiRestaurantID }
      );

      return didSucceed;
    } catch (error) {
      // Roll back the optimistic update
      FonciiRestaurantActions.updateRestaurant(fonciiRestaurant);
      FonciiRestaurantActions.organizeRestaurants();

      VisitedUserActions.updatePostsWithRestaurant(fonciiRestaurant);
      UserPostsActions.updatePostsWithRestaurant(fonciiRestaurant);

      console.error(`[performSaveRestaurant] Error encountered: `, error);
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.FonciiRestaurantSaveError
      );

      return false;
    }
  }

  async performConnectIntegration({
    authToken,
    redirectURI,
    integrationProvider,
    userID,
  }: {
    authToken: string;
    redirectURI: string;
    integrationProvider: FmIntegrationProviders;
    userID: string;
  }): Promise<FmIntegrationCredential | null> {
    const mutation = Mutations.CONNECT_INTEGRATION_MUTATION,
      variables = {
        input: {
          authToken,
          redirectURI,
          provider: integrationProvider,
          userID,
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      const data = result.connectIntegration,
        integrationCredential = data!;

      FonciiUserActions.insertIntegrationCredential(integrationCredential);
      FonciiUserActions.setIntegrationConnectionInProgressState(false);
      FonciiUserActions.setLoadingState(false);

      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.IntegrationConnectionSuccessful(
          integrationProvider
        )
      );

      return integrationCredential;
    } catch (error) {
      FonciiUserActions.setIntegrationConnectionInProgressState(false);
      FonciiUserActions.setLoadingState(false);

      console.error(`Integration connection attempt failed, Error: ${error}`);
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.IntegrationConnectionFailed(integrationProvider)
      );

      return null;
    }
  }

  async performRevokeIntegrationCredential(
    integrationCredential: FmIntegrationCredential
  ): Promise<boolean> {
    const mutation = Mutations.REVOKE_INTEGRATION_CREDENTIAL_MUTATION,
      variables = {
        userID: integrationCredential.userID,
        provider: integrationCredential.provider,
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      const didSucceed = result.revokeIntegrationCredential;

      // Force throw
      if (!didSucceed) throw new Error("Operation Failed");

      FonciiUserActions.clearAllIntegrationCredentials();
      FonciiUserActions.setLoadingState(false);

      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.IntegrationCredentialRemovalSuccessful
      );

      return didSucceed;
    } catch (error) {
      FonciiUserActions.setLoadingState(false);

      console.error(
        `Revoking ${integrationCredential.provider} integration credential failed, Error: ${error}`
      );
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.IntegrationCredentialRemovalFailed
      );

      return false;
    }
  }

  async performRevokeAllIntegrationCredentials(
    userID: string
  ): Promise<boolean> {
    const mutation = Mutations.REVOKE_ALL_INTEGRATION_CREDENTIALS_MUTATION,
      variables = {
        userID,
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      const didSucceed = result.revokeAllIntegrationCredentials;

      // Force throw
      if (!didSucceed) throw new Error("Operation Failed");

      FonciiUserActions.clearAllIntegrationCredentials();
      FonciiUserActions.setLoadingState(false);

      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.IntegrationCredentialRevocationSuccessful
      );

      return didSucceed;
    } catch (error) {
      FonciiUserActions.setLoadingState(false);

      console.error(
        `Revoking all integration credentials failed, Error: ${error}`
      );
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.IntegrationCredentialRevocationFailed
      );

      return false;
    }
  }

  async performRefreshIntegration(
    integrationCredential: FmIntegrationCredential
  ): Promise<FmIntegrationCredential | null> {
    const mutation = Mutations.REFRESH_INTEGRATION_MUTATION,
      variables = {
        integrationProvider: integrationCredential.provider,
        userID: integrationCredential.userID,
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      const data = result.refreshIntegration,
        refreshedIntegrationCredential = data!;

      FonciiUserActions.insertIntegrationCredential(
        refreshedIntegrationCredential
      );
      FonciiUserActions.setLoadingState(false);
      FonciiUserActions.setIntegrationConnectionInProgressState(false);

      return refreshedIntegrationCredential;
    } catch (error) {
      FonciiUserActions.setIntegrationConnectionInProgressState(false);
      FonciiUserActions.setLoadingState(false);

      console.error(
        `An error was encountered while refreshing the integration credential associated with the provider ${integrationCredential.provider}. Error: ${error}`
      );
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.IntegrationCredentialUpdateError
      );

      return null;
    }
  }

  async performSetAutoRefreshStateForCredential(
    integrationCredential: FmIntegrationCredential,
    autoRefreshEnabled: boolean
  ): Promise<boolean> {
    const mutation = Mutations.SET_AUTO_REFRESH_STATE_FOR_MUTATION,
      variables = {
        integrationCredentialID: integrationCredential.id,
        autoRefreshEnabled,
      };

    // Optimistic Updates, roll back if the update fails
    const updatedCredential: FmIntegrationCredential = {
      ...integrationCredential,
      autoRefresh: autoRefreshEnabled,
    };

    FonciiUserActions.updateIntegrationCredential(updatedCredential);
    const result = await this.performMutation({ mutation, variables });

    try {
      const didSucceed = result.setAutoRefreshStateForCredential;

      // Force throw
      if (!didSucceed) throw new Error("Operation Failed");

      FonciiUserActions.setLoadingState(false);

      return didSucceed;
    } catch (error) {
      // Rollback the optimistic update
      FonciiUserActions.updateIntegrationCredential(integrationCredential);
      FonciiUserActions.setLoadingState(false);

      console.error(`Updating the target integration credential's auto refresh state is not possible at this time, please try again. 
        The following error has been encountered: ${error}`);
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.IntegrationCredentialUpdateError
      );

      return false;
    }
  }

  /**
   * Tracks the user's login, fetches and sets their current account data
   * after a successful login.
   *
   * @async
   * @param authProvider -> Auth provider used by the user when logging in
   * @param userID -> ID of the user, obtained from the firebase auth manager when logging in
   * @param firstLogin -> Used to trigger the new account notif, and restrict the login notif to existing users only, default is false
   *
   * @returns -> True if the login event was successful, false otherwise.
   */
  async performLoginUser(
    authProvider: AuthProviders,
    userID: string,
    firstLogin: boolean = false
  ): Promise<boolean> {
    const mutation = Mutations.LOG_IN_USER_FM_MUTATION,
      variables = {
        input: {
          authProvider,
          userID,
        },
      };

    // Update the Redux store with the new states
    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const data = result.loginUserFM,
        user = data!;

      // Update the state with the data from the API call
      FonciiUserActions.setUser(user);
      FonciiUserActions.setLoginState(true);
      FonciiUserActions.setSignInState(false);
      FonciiUserActions.setLoadingState(false);

      // Welcome back message
      if (!firstLogin) {
        const firstName = uppercaseFirstLetter(user.firstName);
        NotificationCenterActions.triggerSystemNotification(
          NotificationTemplates.LogInSuccessful(firstName)
        );
      }

      return true;
    } catch (error) {
      FonciiUserActions.setSignInState(false);
      FonciiUserActions.setLoadingState(false);

      // Auth error occurred, user can't sign in for some reason, i.e server issues
      FonciiUserActions.authErrorOccurred();

      console.error(
        `Log in attempt failed. The server may be experiencing issues. Please try again later. ${error}`
      );
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.LogInFailed
      );

      return false;
    }
  }

  async fetchImpersonatedUser(
    impersonateInput: ImpersonateUserInput
  ): Promise<FmUser | undefined> {
    const mutation = Mutations.FETCH_IMPERSONATED_USER_FM_MUTATION,
      variables = {
        input: impersonateInput,
      };

    // Update the Redux store with the new states
    const result = (await this.performMutation({ mutation, variables }))
      .fetchImpersonatedUserFM;
    if (!result) {
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.ImpersonationFailed
      );
      return;
    }

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const user = result;

      // Update the state with the data from the API call
      FonciiUserActions.setImpersonatedUser(user);
      const firstName = uppercaseFirstLetter(user.firstName);
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.ImpersonationSuccessful(firstName)
      );

      return user;
    } catch (error) {
      console.error(`Impersonation failed: ${error}`);
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.ImpersonationFailed
      );

      return;
    }
  }

  /**
   * Tracks the user's login, fetches and sets their current account data
   * after a successful login.
   *
   * @async
   * @param email
   * @param authProvider -> Auth provider used by the user when creating their new account.
   * @param externalReferralCode -> Optional, only used when a user has been referred to sign up by another user via referral link
   * @param OAuthProfilePictureURL -> Optional photo URL of the user's profile picture tied to an OAuth provider if the user signs in with any of those methods.
   * @param userID -> ID of the user, obtained from the Firebase user auth credential generated when a new Firebase Auth account is created.
   * @param username -> Required even when using OAuth providers because usernames are necessary for Foncii Maps to function
   *
   * @returns -> Newly created Foncii Maps user if the account creation was successful, undefined otherwise.
   */
  async performCreateUser(args: {
    firstName: string;
    lastName: string;
    email: string;
    authProvider: AuthProviders;
    externalReferralCode?: string;
    oAuthProfilePictureURL?: string;
    userID: string;
    username: string;
  }): Promise<FmUser | undefined> {
    const mutation = Mutations.CREATE_USER_FM_MUTATION,
      variables = {
        input: { ...args },
      };

    return (
      (await this.performMutation({ mutation, variables })).createUserFM ??
      undefined
    );
  }

  /**
   * Imports the user's posts from the target Foncii Maps Integration into the Foncii ecosystem and returns
   * the success status of the import process; true if the importation was successful, false otherwise.
   *
   * @async
   * @param integrationCredential -> The integration credential to use to import the user's posts and uniquely
   * aggregate them to their current pool of posts.
   * @param manualImport -> True if posts are being imported manually by the user, if so the user should be notified via
   * some notification of the outcome of the import request, false otherwise (imported by some automatic process (new user session for ex.))
   * @param isFirstImport -> True if the user is importing their posts for the first time (usually following sign up and onboarding), false otherwise.
   *
   * @returns -> True if the importation was successful, false otherwise.
   */
  async performImportPosts(
    integrationCredential: FmIntegrationCredential,
    {
      manualImport = true,
      isFirstImport = false,
    }: {
      manualImport?: boolean;
      isFirstImport?: boolean;
    }
  ): Promise<Boolean> {
    // Reset import status states
    UserPostsActions.setIsImportingPosts(true);
    UserPostsActions.setImportFailedState(false);

    // No other integration providers are supported at this time. Won't trigger until unsupported services are added abstractly, but good to have.
    if (integrationCredential.provider != FmIntegrationProviders.Instagram) {
      UserPostsActions.setIsImportingPosts(false);
      UserPostsActions.setImportFailedState(true);

      console.warn(
        "Importing posts from other integration providers is not possible at this time."
      );

      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostImportFailed(integrationCredential.provider)
      );

      return false;
    }

    // Instagram and other supported Integration Providers Handler
    const mutation = Mutations.IMPORT_POSTS_MUTATION,
      variables = {
        input: {
          integrationCredentialID: integrationCredential.id,
          classifyPosts: true,
          straddleImport: true,
          isFirstImport,
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const didSucceed = result.importPosts!;

      // Update various loading status states
      UserPostsActions.setIsImportingPosts(false);

      // The user's first import was successful. If it wasn't then the user can simply try again
      // to trigger the same intended behavior
      if (isFirstImport && didSucceed) {
        UserPostsActions.setFirstImportState(false);

        // Display this notif once for first imports only, so that the user knows they have to go to their 'my map' to view imported posts
        NotificationCenterActions.triggerSystemNotification(
          NotificationTemplates.PostImportSuccessful(
            integrationCredential.provider
          )
        );
      }

      return didSucceed;
    } catch (error) {
      UserPostsActions.setIsImportingPosts(false);
      UserPostsActions.setImportFailedState(true);

      console.error(
        `Importing user posts is not possible at this time, please try again. Error: ${error}`
      );

      // Update loading status state
      // Notify user of error when automatic import fails, just so we can catch it when it occurs
      if (!manualImport)
        NotificationCenterActions.triggerSystemNotification(
          NotificationTemplates.PostImportFailed(integrationCredential.provider)
        );

      return false;
    }
  }

  /**
   * Updates the target post's custom user properties, and refreshes the user's posts
   * after a successful mutation.
   *
   * @async
   * @param userID
   * @param postID
   * @param rating
   * @param notes
   * @param categories
   */
  async performUpdatePostCustomUserProperties(
    {
      userID,
      postID,
      rating,
      notes,
      categories,
    }: {
      userID: string;
      postID: string;
      rating?: number;
      notes?: string;
      categories?: string[];
    },
    {
      clientCoordinates,
      reservationSearchInput,
    }: {
      clientCoordinates?: CoordinatePoint;
      reservationSearchInput?: ReservationSearchInput;
    }
  ): Promise<void> {
    const mutation = Mutations.UPDATE_POST_CUSTOM_USER_PROPERTIES_MUTATION,
      variables = {
        input: {
          rating,
          notes,
          categories,
          userInput: {
            postID,
            userID,
          },
        } as UpdateFmUserPostCustomUserPropertiesInput,
        postsToExclude: [postID],
        userPersonalizationInput: {
          userID,
          coordinates: clientCoordinates ?? defaultMapBoxCenter,
          reservationSearchInput,
          includeAssociatedArticles: true,
          includeAssociatedRestaurantAwards: true,
          includeInfluencerInsights: true,
          includeReservations: true
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const data = result.updatePostCustomUserProperties,
        updatedPost = data!;

      UserPostsActions.updatePost(updatedPost);
      UserPostsActions.organizePosts();
      UserPostsActions.setLoadingState(false);

      AnalyticsService.shared.trackGenericEvent(
        AnalyticsEvents.POST_CUSTOM_USER_PROPERTIES_UPDATED,
        { rating, notes, categories, postID }
      );
    } catch (error) {
      UserPostsActions.setLoadingState(false);

      console.error(`Updating the currently selected post's custom user properties is not possible at this time, please try again. 
            The following error has been encountered: ${error}`);

      AnalyticsService.shared.trackGenericEvent(
        AnalyticsEvents.POST_CUSTOM_USER_PROPERTIES_UPDATE_FAILED,
        { rating, notes, categories, postID }
      );

      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostUpdateError
      );
    }
  }

  /**
   * @async
   * @param sourcePostID
   *
   * @returns -> The new child post duplicated from the source post with the given ID,
   * undefined if the duplication failed
   */
  async performDuplicatePost(
    sourcePostID: string
  ): Promise<FmUserPost | undefined> {
    const mutation = Mutations.DUPLICATE_POST_MUTATION,
      variables = {
        sourcePostId: sourcePostID,
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const data = result.duplicatePost,
        newPost = data!;

      UserPostsActions.appendPost(newPost);
      UserPostsActions.organizePosts();
      UserPostsActions.setLoadingState(false);

      AnalyticsService.shared.trackGenericEvent(
        AnalyticsEvents.POST_DUPLICATED,
        { sourcePostID }
      );

      return newPost;
    } catch (error) {
      UserPostsActions.setLoadingState(false);

      AnalyticsService.shared.trackGenericEvent(
        AnalyticsEvents.POST_DUPLICATION_FAILED,
        { sourcePostID }
      );

      console.error(
        `Duplication of the post with the ID: ${sourcePostID} could not be done at this time.`
      );
      return undefined;
    }
  }

  /**
   * @async
   * @param userID -> Owner of the post
   * @param postID -> Post to mark for deletion
   *
   * @returns -> True if the post was marked for deletion, false otherwise
   */
  async performMarkPostForDeletion(
    userID: string,
    postID: string
  ): Promise<boolean> {
    const mutation = Mutations.DELETE_POST_MUTATION,
      variables = {
        input: {
          postID,
          userID,
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      const didSucceed = result.deletePost!;

      // Force throw
      if (!didSucceed) throw new Error("Operation Failed");

      // Re-fetch the updated posts and organize them
      UserPostsActions.removePost(postID);
      UserPostsActions.organizePosts();
      UserPostsActions.fetchMainUserPosts();

      return didSucceed;
    } catch (error) {
      UserPostsActions.setLoadingState(false);

      AnalyticsService.shared.trackGenericEvent(
        AnalyticsEvents.POST_DELETION_FAILED,
        { postID, userID }
      );

      console.error(
        `Force deletion of the post with the ID: ${postID} could not be done at this time. Error: ${error}`
      );

      return false;
    }
  }

  /**
   * @async
   * @param userID -> Owner of the post
   * @param postID -> Post to unmark for deletion (undelete)
   *
   * @returns -> True if the post was unmarked for deletion successfully, false otherwise
   */
  async performUndeletePost(userID: string, postID: string): Promise<boolean> {
    const mutation = Mutations.UNDELETE_POST_MUTATION,
      variables = {
        input: {
          postID,
          userID,
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      const didSucceed = result.undeletePost!;

      // Force throw
      if (!didSucceed) throw new Error("Operation Failed");

      // Re-fetch user posts and reorganize them so that the target post is in the correct section again
      // now that it's no longer being deleted
      UserPostsActions.fetchMainUserPosts();

      return didSucceed;
    } catch (error) {
      UserPostsActions.setLoadingState(false);

      console.error(
        `Undeleting the post with the ID: ${postID} could not be done at this time. Error: ${error}`
      );

      return false;
    }
  }

  /**
   * @async
   * @param userID -> Owner of the post
   * @param postID -> Post to delete permanently
   *
   * @returns -> True if the post was permanently deleted, false otherwise
   */
  async performForceDeletePost(
    userID: string,
    postID: string
  ): Promise<boolean> {
    const mutation = Mutations.FORCE_DELETE_POST_MUTATION,
      variables = {
        input: {
          postID,
          userID,
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      const didSucceed = result.forceDeletePost!;

      // Force throw
      if (!didSucceed) throw new Error("Operation Failed");

      UserPostsActions.removePost(postID);
      UserPostsActions.organizePosts();
      UserPostsActions.setLoadingState(false);

      AnalyticsService.shared.trackGenericEvent(AnalyticsEvents.POST_DELETED, {
        postID,
        userID,
      });

      return didSucceed;
    } catch (error) {
      UserPostsActions.setLoadingState(false);

      AnalyticsService.shared.trackGenericEvent(
        AnalyticsEvents.POST_DELETION_FAILED,
        { postID, userID }
      );

      console.error(
        `Marking the post with the ID: ${postID} for deletion could not be done at this time. Error: ${error}`
      );

      return false;
    }
  }

  /**
   * Aggregates and returns the restaurant associated with the given google place ID if it doesn't
   * already exist in our database, or updates and returns the existing restaurant record if it's out of data,
   * or returns the up to date restaurant from our own database.
   *
   * @async
   * @param googlePlaceID
   *
   * @returns -> The aggregated / found restaurant data associated with the given google place ID
   * and transformed by foncii into a foncii restaurant, undefined if the google place ID is invalid
   * or an error occurred.
   */
  async performAggregateRestaurant(googlePlaceID: string) {
    const mutation = Mutations.AGGREGATE_RESTAURANT_MUTATION,
      variables = {
        input: {
          googlePlaceID,
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      const restaurant = result.aggregateRestaurant!;
      return restaurant;
    } catch (error) {
      console.error(
        `An error occurred while aggregating a restaurant with the ID ${googlePlaceID}, Error: ${error}`
      );

      return undefined;
    }
  }

  async performCreateTasteProfile(tasteProfileInput: {
    adventureLevel?: number;
    ambiancePreference?: number;
    diningPurpose?: number;
    dietaryRestrictions?: string[];
    distancePreferenceLevel?: number;
    drinkPreference?: number;
    preferredCuisines?: string[];
    preferredPriceRange?: number;
    spicePreferenceLevel?: number;
    userID: string;
  }) {
    const mutation = Mutations.CREATE_TASTE_PROFILE_MUTATION,
      variables = {
        tasteProfileInput,
      };

    FonciiUserActions.setLoadingState(true);

    const result = await this.performMutation({ mutation, variables });

    try {
      const tasteProfile = result.createTasteProfile!;
      FonciiUserActions.setLoadingState(false);

      return tasteProfile;
    } catch (error) {
      console.error(
        `An error occurred while creating a user taste profile, Error: ${error}`
      );
      FonciiUserActions.setLoadingState(false);

      return undefined;
    }
  }

  /**
   * @async
   * @param tasteProfileID
   * @param tasteProfileInput
   *
   * @returns -> True if the update succeeded, false otherwise
   */
  async performUpdateTasteProfile(
    tasteProfileID: string,
    tasteProfileInput: {
      adventureLevel?: number;
      ambiancePreference?: number;
      diningPurpose?: number;
      dietaryRestrictions?: string[];
      distancePreferenceLevel?: number;
      drinkPreference?: number;
      preferredCuisines?: string[];
      preferredPriceRange?: number;
      spicePreferenceLevel?: number;
      userID: string;
    }
  ) {
    const mutation = Mutations.UPDATE_TASTE_PROFILE_MUTATION,
      variables = {
        tasteProfileID,
        tasteProfileInput,
      };

    FonciiUserActions.setLoadingState(true);

    const result = await this.performMutation({ mutation, variables });

    try {
      const didSucceed = result.updateTasteProfile!;
      FonciiUserActions.setLoadingState(false);

      return didSucceed;
    } catch (error) {
      console.error(
        `An error occurred while updating a user taste profile, Error: ${error}`
      );
      FonciiUserActions.setLoadingState(false);

      return false;
    }
  }

  async performAutoGenerateTasteProfile(args: {
    userID: string;
    selectedRestaurantIDs: string[];
  }) {
    const mutation = Mutations.AUTO_GENERATE_TASTE_PROFILE_MUTATION,
      variables = {
        ...args,
      };

    FonciiUserActions.setLoadingState(true);

    const result = await this.performMutation({ mutation, variables });

    try {
      const tasteProfile = result.autoGenerateTasteProfile!;

      FonciiUserActions.setLoadingState(false);
      FonciiUserActions.refreshAllUserData();
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.TasteProfileAutoGenerated
      );

      return tasteProfile;
    } catch (error) {
      console.error(
        `An error occurred while auto-generating a user taste profile, Error: ${error}`
      );
      FonciiUserActions.setLoadingState(false);

      return undefined;
    }
  }

  /**
   * Gateway for tracking specialized Foncii specific events.
   *
   * @async
   * @param userID -> The UID of the user that invoked the event being tracked
   * @param event -> The type of event being tracked
   * @param payload -> The payload of the event being tracked. This is dependent on the event type.
   *
   * @returns -> True if the event was successfully tracked, false otherwise.
   *
   * @see {@link FonciiEvents}
   */
  async performTrackFonciiEvent(args: {
    userID?: string;
    event: FonciiEvents;
    payload: FonciiAnalyticsEventPayloads;
  }) {
    const mutation = Mutations.TRACK_FONCII_EVENT,
      variables = {
        input: {
          timestamp: currentDateAsISOString(),
          ...args,
        },
      };

    const result = await this.performMutation({ mutation, variables });

    try {
      const didSucceed = result.trackFonciiEvent!;

      return didSucceed;
    } catch (error) {
      if (nonProductionEnvironment)
        console.error(`[performTrackFonciiEvent] Error occurred: ${error}`);

      return false;
    }
  }
}
