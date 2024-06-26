// Dependencies
// Services
import { CachePolicy, FonciiAPIClient } from "../fonciiAPIService";

// GraphQL Schema Type Definitions
import { Queries } from "./operations/queries";

// Types
import {
  FmUserPost,
  FmUser,
  HtmlMetadataResponse,
  Query,
  FonciiRestaurant,
  CoordinatePoint,
  ReservationSearchInput,
  ArticlePublicationStandaloneOutput,
} from "../../../__generated__/graphql";

// User Defaults
import { defaultMapBoxCenter } from "../../../core-foncii-maps/default-values/UserDefaults";

/**
 * Server specific API service adapter isolated from the client side redux operations
 * This service is focused on returning data rather than dispatching actions and doesn't
 * cause webpack errors when using it in server rendered components and pages
 */
export class FonciiAPIServerAdapter extends FonciiAPIClient {
  constructor({ sessionID }: { sessionID?: string }) {
    super({ sessionID });
  }

  /// Queries
  // Site Map Related Queries
  /**
   * Fetches a list of public Foncii Maps posts to be used for sitemap
   * generation purposes.
   * 
   * @async
   * @param limit -> The amount of elements to return. The max is unlimited as the
   * server auto-paginates. Minimal data is returned by this query so the response
   * size isn't that large, but do be reasonable with the limitation of this method
   * to prevent performance or memory issues.
   * 
   * @returns -> A list of public Foncii Maps posts.
   */
  async performGetAllPublicPosts({
    limit,
    pageIndex = 0
  }: {
    limit: number,
    pageIndex?: number
  }) {
    const query = Queries.GET_ALL_PUBLIC_POSTS,
      variables = {
        limit,
        pageIndex
      };

    // Fetch and cache since results are deterministic
    const result = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataElseFetch
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const users = result.getAllPublicPosts;
      return users;
    } catch (error) {
      console.error(
        `[performGetAllPublicPosts] Error encountered, error: ${error}`
      );

      return [];
    }
  }

  /**
   * Fetches a list of Foncii restaurants to be used for sitemap
   * generation purposes.
   * 
   * @async
   * @param limit -> ~
   * 
   * @returns -> A list of Foncii restaurants.
   */
  async performGetAllRestaurants({
    limit,
    pageIndex = 0
  }: {
    limit: number,
    pageIndex?: number
  }) {
    const query = Queries.GET_ALL_RESTAURANTS,
      variables = {
        limit,
        pageIndex
      };

    // Fetch and cache since results are deterministic
    const result = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataElseFetch
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const users = result.getAllRestaurants;
      return users;
    } catch (error) {
      console.error(
        `[performGetAllRestaurants] Error encountered, error: ${error}`
      );

      return [];
    }
  }

  /**
   * Fetches a list of Foncii Maps users to be used for sitemap
   * generation purposes.
   * 
   * @async
   * @param limit -> ~
   * 
   * @returns -> A list of Foncii Maps users.
   */
  async performGetAllUsers({
    limit,
    pageIndex = 0
  }: {
    limit: number,
    pageIndex?: number
  }) {
    const query = Queries.GET_ALL_USERS,
      variables = {
        limit,
        pageIndex
      };

    // Fetch and cache since results are deterministic
    const result = await this.performQuery({
      query,
      variables,
      cachePolicy: CachePolicy.returnCacheDataElseFetch
    });

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      const users = result.getAllUsers;
      return users;
    } catch (error) {
      console.error(
        `[performGetAllUsers] Error encountered, error: ${error}`
      );

      return [];
    }
  }

  // HTML Metadata
  /**
   * @async
   * @param username
   *
   * @returns -> Formatted dynamic HTML metadata for user galleries
   */
  async performGetUserGalleryHTMLMetadata(
    username: string
  ): Promise<HtmlMetadataResponse | undefined> {
    const query = Queries.GET_USER_GALLERY_HTML_METADATA_QUERY,
      variables = {
        username: username,
      };

    const result = await this.performQuery({ query, variables });
    let metadata = undefined;

    try {
      // Parse the data from the result, error is thrown if the data isn't defined
      metadata = result.getUserGalleryHTMLMetadata;
    } catch (error) {
      console.error(
        `Error encountered while fetching metadata tags for user: ${username}, error: ${error}`
      );
    }

    return metadata ?? undefined;
  }

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
    postsToExclude = [],
    includeAssociatedArticles,
    includeAssociatedRestaurantAwards,
    includeInfluencerInsights,
    includeReservations,
  }: {
    postID: string;
    currentUserID?: string;
    clientCoordinates?: CoordinatePoint;
    reservationSearchInput?: ReservationSearchInput;
    postsToExclude?: string[];
    includeAssociatedArticles?: boolean;
    includeAssociatedRestaurantAwards?: boolean;
    includeInfluencerInsights?: boolean;
    includeReservations?: boolean;
  }): Promise<FmUserPost | undefined> {
    const query = Queries.FIND_POST_BY_ID_QUERY,
      variables = {
        postID,
        userPersonalizationInput: {
          userID: currentUserID,
          coordinates: clientCoordinates,
          reservationSearchInput,
          includeAssociatedArticles,
          includeAssociatedRestaurantAwards,
          includeInfluencerInsights,
          includeReservations,
        },
        postsToExclude,
      };

    const result = await this.performQuery({ query, variables }),
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
    includeReservations = true,
  }: {
    fonciiRestaurantID: string;
    currentUserID?: string;
    clientCoordinates?: CoordinatePoint;
    reservationSearchInput?: ReservationSearchInput;
    includeAssociatedArticles?: boolean;
    includeAssociatedRestaurantAwards?: boolean;
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
          includeReservations,
        },
      };

    const result = await this.performQuery({ query, variables }),
      fonciiRestaurant = result?.getFonciiRestaurantByID ?? undefined;

    return fonciiRestaurant;
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
   * Fetches a user's data from the database (if it exists) using their
   * username, and returns limited data for that. Typically used to determine
   * whether or not the owner of a gallery exists when routing to the
   * user gallery page.
   *
   * @async
   * @param username -> Username of the target user to getch
   */
  async performFindUserByUsername(
    username: string
  ): Promise<FmUser | undefined> {
    const query = Queries.FIND_USER_BY_USERNAME_FM_QUERY,
      variables = {
        username,
      };

    const result: Query = await this.performQuery({ query, variables }),
      user = result?.findUserByUsernameFM ?? undefined;

    return user;
  }
}
