// Dependencies
// Types
import { Restaurant } from "../../__generated__/graphql";

// App Properties
import { integrationOAuthRedirectURI } from "./AppProperties";

// Utilities
import { NetworkingInformation } from "./NetworkingInformation";

// Redux
import store from "../../redux/store";

// Query parsing and encoding
import queryString from "query-string";

// Parameter Types
type SearchParameterKey = string;
/// Supports singular and list values
type SearchParameterValue =
  | string
  | boolean
  | number
  | string[]
  | boolean[]
  | number[]
  | undefined;
// Key value pair type
type SearchParameterRecords = Record<SearchParameterKey, SearchParameterValue>;

/**
 * Useful definitions and functions that simplify linking to
 * navigation and routing pathways within the application.
 * Note: Home Page aka Root == Explore Page at '/'
 */
export enum AppRoutes {
  logInPage = "login",
  signUpPage = "signup",
  onboardingPage = "onboarding",
  tasteProfilePage = "taste-profile",
  explorePage = "",
  homePage = explorePage,
  galleryPage = "",
  postPage = "p",
  restaurantPage = "r",
  notFoundPage = "404",
}

/**
 * Numeric identifiers are used instead of strings for
 * separating identical routes from each other
 */
export enum IdentifiableAppRoutes {
  logInPage,
  signUpPage,
  onboardingPage,
  tasteProfilePage,
  explorePage,
  homePage = explorePage,
  galleryPage,
  postPage,
  restaurantPage,
  notFoundPage,
}

// URL State Management
// Parameters shared between multiple pages
export enum SharedURLParameters {
  gallerySection = "gsec", // Enum value indicating the current section the user's gallery is displaying
  galleryTab = "gtab", // Enum value indicating the current section tab the user's gallery is displaying
  mapPosition = "pos", // String value indicating the center of the current map component's view port
  zoomLevel = "z", // Integer value indicating the current zoom level of the current map component's view port
  selectedPost = "sel", // For selecting posts in explore or gallery
  detailViewForPost = "p", // p=1234567... triggers the detail view for the post in question
  detailViewForRestaurant = "r", // p=1234567... triggers the detail view for the post in question
  search = "search", // Search bar initial input / output stream
  displaySideMenu = "sm", // Boolean, true if the side menu should be displayed, false otherwise
  displayUserReferralModal = "ur", // Boolean, true if the user referral modal should be displayed, false otherwise
  displayAuthModal = "auth", // Boolean, true if the auth modal should be displayed, false otherwise
  currentAuthForm = "af", // Any of the corresponding Auth Modal Form enum values, undefined otherwise
  galleryListFormatToggled = "list", // Boolean, true if the current gallery / explore page should be displayed as a list, false if it should be displayed as a usual map
  isEditingPost = "edit", // Boolean, true if the user wants to edit their current post by clicking the post edit button, false or undefined otherwise
  returnURL = "ret", // Some valid URL string to navigate to from some applicable context
  sharedEventID = "seid", // Share event ID that's passed in a shared URL to tie the URL to some share event tracked on the backend which will can be used to track conversions from that share event
  displayReservationConfirmationModal = "rsc" // Boolean, true if the reservation confirmation modal should be displayed
}

// Gallery + Explore Page Filter Parameters
export enum PostFilterURLParameters {
  cuisineTypes = "ct", // String Array
  targetReservationDate = "rvd", // Number (date in MS)
  targetReservationPartySize = "rvp", // Number
  creatorRating = "crt", // Number
  creatorUIDs = "creator", // String Array
  publications = "pub", // String Array
  restaurantAwards = "awr", // String Array
  yelpRating = "yrt", // Number
  googleRating = "grt", // Number
  priceLevels = "pl", // Number Array
  customUserTags = "tg", // String Array
  creationDateRange = "cdr", // Number Array, [Not used right now]
  newestToOldestSort = "datesort", // Boolean
  closestToFarthestSort = "distsort", // Boolean
  trendingSort = "tsort", // Boolean
  qualitySort = "qsort", // Boolean
  percentMatchSort = "psort", // Boolean
  favoritePostsOnly = "fav", // Boolean
  reservableOnly = "rsvo", // Boolean
  openNow = "opn", // Boolean
  focusedSubmenu = "submenu", // Any various enum value associated with the menu's submenus
}

export enum SignUpURLParameters {
  referralCode = "referral", // Code used when signing up to link the new user to a referral made by another user
}

export class NavigationProperties {
  // Dynamic Reusable Links
  static onboardingPageLink = (userID?: string): string => {
    if (!userID) return "#";

    const onboardingPageURL = NetworkingInformation.GetPathToRoute(
        AppRoutes.onboardingPage
      ),
      targetDirectory = userID;

    return this.joinDirectoryToPath(onboardingPageURL, targetDirectory);
  };

  static tasteProfilePageLink = (userID?: string): string => {
    if (!userID) return "#";

    const tasteProfilePageURL = NetworkingInformation.GetPathToRoute(
        AppRoutes.tasteProfilePage
      ),
      targetDirectory = userID;

    return this.joinDirectoryToPath(tasteProfilePageURL, targetDirectory);
  };

  /**
   * A crawlable link to the associated creator's gallery
   *
   * @param username - Default is the currently logged in user's username if not provided, 404 error if undefined
   *
   * @returns A localized link to the target user's gallery page
   */
  static userGalleryPageLink = (
    username: string | undefined = undefined
  ): string => {
    const mainUser = store.getState().fonciiUser,
      targetUsername = username ?? mainUser.user?.username ?? "404";

    const galleryPageURL = NetworkingInformation.GetPathToRoute(
        AppRoutes.galleryPage
      ),
      targetDirectory = targetUsername;

    return this.joinDirectoryToPath(galleryPageURL, targetDirectory);
  };

  /**
   * @returns -> A provisioned link using the current visited gallery's author (if any) details
   * to generate a crawlable link to their page
   */
  static visitedGalleryPageLink = (): string => {
    const visitedGalleryAuthor = store.getState().visitedUser,
      authorUsername = visitedGalleryAuthor.user?.username;

    return this.userGalleryPageLink(authorUsername);
  };

  // Various ways to present a post detail view //

  // Modally presented post detail view
  // 1.) Modally in the gallery / foncii.com/?p=12345678 | Gallery | Used in production
  // Default includes current search params, pass false to exclude these params if needed
  // Use the return URL when navigating to this detail view from the explore page or any other applicable context (location.href)
  static galleryPageModalPostDetailViewLink = ({
    username,
    postID,
    includeCurrentParams = false,
    returnURL,
  }: {
    username: string;
    postID: string;
    includeCurrentParams?: boolean;
    returnURL?: string;
  }): string => {
    const galleryPageURL = this.userGalleryPageLink(username),
      currentParams = includeCurrentParams
        ? queryString.parse(location.search)
        : {},
      params = {
        ...currentParams,
        [SharedURLParameters.returnURL]: returnURL,
        [AppRoutes.postPage]: postID,
      }; // This ordering in order to overwrite any old post parameter

    return this.setParamsToPath(galleryPageURL, params);
  };

  // Full screen page presented gallery post detail view
  // 2.) Full screen in the gallery / foncii.com/testuser123/p/12345678 | Gallery | Used in production
  static galleryPostDetailViewPageLink = (
    username: string,
    postID: string,
    includeCurrentParams: boolean = false
  ): string => {
    const galleryPageURL = this.userGalleryPageLink(username),
      currentParams = (
        includeCurrentParams ? queryString.parse(location.search) : {}
      ) as SearchParameterRecords,
      postDirectory = NetworkingInformation.GetPathToRoute(AppRoutes.postPage),
      targetPostDirectory = postID,
      updatedPath = this.joinDirectoryToPath(galleryPageURL, postDirectory),
      targetPath = this.joinDirectoryToPath(updatedPath, targetPostDirectory);

    if (includeCurrentParams) {
      return this.setParamsToPath(targetPath, currentParams);
    } else {
      return targetPath;
    }
  };

  // Full screen page presented post detail view
  // 3.) Full screen post detail view page / foncii.com/p/12345678 | Used in production
  static postDetailViewPageLink = (
    postID: string,
    includeCurrentParams: boolean = false
  ): string => {
    const currentParams = (
        includeCurrentParams ? queryString.parse(location.search) : {}
      ) as SearchParameterRecords,
      postDirectory = NetworkingInformation.GetPathToRoute(AppRoutes.postPage),
      targetPostDirectory = postID,
      targetPath = this.joinDirectoryToPath(postDirectory, targetPostDirectory);

    if (includeCurrentParams) {
      return this.setParamsToPath(targetPath, currentParams);
    } else {
      return targetPath;
    }
  };

  // 4.) Modally in the explore gallery /
  // Default includes current search params, pass false to exclude these params if needed
  static explorePageModalPostDetailViewLink = ({
    postID,
    includeCurrentParams = false,
    returnURL,
  }: {
    postID: string;
    includeCurrentParams: boolean;
    returnURL?: string;
  }): string => {
    const explorePageURL = this.explorePageLink(),
      currentParams = includeCurrentParams
        ? queryString.parse(location.search)
        : {},
      params = {
        ...currentParams,
        [SharedURLParameters.returnURL]: returnURL,
        [AppRoutes.postPage]: postID,
      }; // This ordering in order to overwrite any old post parameter

    return this.setParamsToPath(explorePageURL, params);
  };

  // 1.) Modally in the explore gallery / foncii.com/?p=FNCII12345678 | Explore | Used in production
  // Default includes current search params, pass false to exclude these params if needed
  static explorePageModalRestaurantDetailViewLink = ({
    restaurantID,
    includeCurrentParams = false,
    returnURL,
  }: {
    restaurantID: string;
    includeCurrentParams?: boolean;
    returnURL?: string;
  }): string => {
    const explorePageURL = this.explorePageLink(),
      currentParams = includeCurrentParams
        ? queryString.parse(location.search)
        : {},
      params = {
        ...currentParams,
        [SharedURLParameters.returnURL]: returnURL,
        [AppRoutes.restaurantPage]: restaurantID,
      }; // This ordering in order to overwrite any old restaurant parameter

    return this.setParamsToPath(explorePageURL, params);
  };

  // Full screen page presented restaurant detail view
  // 2.) Full screen restaurant detail view page / foncii.com/r/FNCII12345678 | Explore | Used in production
  static restaurantDetailViewPageLink = (
    restaurantID: string,
    includeCurrentParams: boolean = false
  ): string => {
    const currentParams = (
        includeCurrentParams ? queryString.parse(location.search) : {}
      ) as SearchParameterRecords,
      restaurantDirectory = NetworkingInformation.GetPathToRoute(
        AppRoutes.restaurantPage
      ),
      targetPostDirectory = restaurantID,
      targetPath = this.joinDirectoryToPath(
        restaurantDirectory,
        targetPostDirectory
      );

    if (includeCurrentParams) {
      return this.setParamsToPath(targetPath, currentParams);
    } else {
      return targetPath;
    }
  };

  /// Link back to the homepage / root directory
  static homePageLink = (): string => {
    const homePageURL = NetworkingInformation.GetPathToRoute(
        AppRoutes.homePage
      ),
      targetDirectory = "";

    return this.joinDirectoryToPath(homePageURL, targetDirectory);
  };

  static logInPageLink = (): string => {
    const loginPageURL = NetworkingInformation.GetPathToRoute(
        AppRoutes.logInPage
      ),
      targetDirectory = "";

    return this.joinDirectoryToPath(loginPageURL, targetDirectory);
  };

  static signUpPageLink = (): string => {
    const loginPageURL = NetworkingInformation.GetPathToRoute(
        AppRoutes.signUpPage
      ),
      targetDirectory = "";

    return this.joinDirectoryToPath(loginPageURL, targetDirectory);
  };

  /// Essentially a proxy link to the homepage / root directory page
  static explorePageLink = (): string => {
    return this.homePageLink();
  };

  // Misc Routes
  /// Link for contacting Foncii support directly via email
  static supportLink = (username: string = "Anonymous Foncii User"): string => {
    // Access current state and get logged in user's details
    let mainUser = store.getState().fonciiUser,
      targetUsername = mainUser.user?.username ?? username;

    return `mailto:support@foncii.com?subject=Foncii Support Request - ${targetUsername}`;
  };

  // Insert into href to resolve the full path
  static fonciiFounderAbsoluteGalleryLink = () => "/fonciiceo";

  // Utility Methods
  static joinDirectoryToPath = (path: string, directory: string): string => {
    return `${path}${directory}`;
  };

  // Sets the given parameters to the target path, ex.) foncii.com/testuser -> foncii.com/testuser?p=1234
  static setParamsToPath = (
    path: string,
    params: SearchParameterRecords
  ): string => {
    const updatedSearchParams = queryString.stringify(params),
      updatedhref = `${path}?${updatedSearchParams}`;

    return updatedhref;
  };
}

// Links to domains directly tied to this domain (foncii.com, i.e foncii.com)
export class OriginAssociatedDomainLinks {
  static FonciiDomainLink = (): string => {
    return "https://foncii.com";
  };

  // The production domain name URL for reference
  static FonciiMapsProductionDomainLink = (): string => "https://foncii.com";

  // Foncii Maps / Foncii Privacy Policy Link
  static PrivacyPolicy = (): string =>
    "https://docs.google.com/document/d/e/2PACX-1vTDjBI4SKdEu3HY9GivsEPfiHDVaY5fnaZhskWOd45boxQyYK3r6T569UrRS3NX4LhAf3GBDzemwug3/pub";
}

/// Links to external endpoints and resources that are not part of this domain
export class ExternalLinks {
  // Links to instagram's OAuth endpoint to provide a login token via a successful callback to this website
  // Note: Staging has its own redirect for testing purposes outside of production
  static instagramOAuthRedirectLink = (originDomainURL: string): string => {
    const redirectURI = integrationOAuthRedirectURI(originDomainURL),
      clientID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

    // Configuration
    const desiredPermissions = "user_profile,user_media",
      responseType = "code";

    return `https://api.instagram.com/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectURI}&scope=${desiredPermissions}&response_type=${responseType}`;
  };

  // Foncii Social Media Links
  static fonciiInstagramSocialLink = (): string => {
    return "https://www.instagram.com/feelfoncii/";
  };

  static fonciiTwitterSocialLink = (): string => {
    return "https://twitter.com/feelfoncii";
  };

  static fonciiMediumSocialLink = (): string => {
    return "https://medium.com/@jaipalsilla";
  };

  // Dynamic Links
  // Creates a google maps link with directions to the restaurant's location
  static createGoogleMapsLinkForRestaurant = (
    restaurant: Restaurant | undefined
  ): string => {
    // No location to direct the user to
    if (!restaurant) {
      return "#";
    }

    // Get restaurant name and address
    const restaurantName = restaurant.name,
      restaurantAddress = restaurant.addressProperties?.formattedAddress;

    const encodedQuery = encodeURI(`${restaurantName}, ${restaurantAddress}`),
      searchURL = `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`;

    return searchURL;
  };

  // Creates a personalized google search link in case the restaurant doesn't have a website
  static createGoogleSearchLinkForRestaurant = (
    restaurant: Restaurant | undefined
  ): string => {
    if (!restaurant) {
      return "#";
    }

    const restaurantName = restaurant?.name,
      restaurantAddress = restaurant?.addressProperties?.formattedAddress;

    const encodedQuery = encodeURIComponent(
        `${restaurantName}, ${restaurantAddress}`
      ),
      searchURL = `https://www.google.com/search?q=${encodedQuery}`;

    return searchURL;
  };

  // Used when the yelp page URL for the restaurant is not available
  static createYelpSearchLinkForRestaurant = (
    restaurant: Restaurant | undefined
  ): string => {
    if (!restaurant) {
      return "#";
    }

    const restaurantName = restaurant?.name,
      restaurantAddress = restaurant?.addressProperties?.formattedAddress;

    const encodedRestaurant = encodeURIComponent(`${restaurantName}`),
      encodedLoc = encodeURIComponent(`${restaurantAddress}`),
      searchURL = `https://www.yelp.com/search?find_desc=${encodedRestaurant}&find_loc=${encodedLoc}`;

    return searchURL;
  };

  static createPhoneNumberLink = (formattedPhoneNumber: string): string => {
    return "tel:" + formattedPhoneNumber;
  };
}

/**
 * Reusable function for building dynamic links.
 *
 * @param baseURL
 * @param parameters
 *
 * @returns -> A dynamically built link, ex.) https://www.foncii.com/ -> https://www.foncii.com/?auth=true
 */
export const buildDynamicLink = (
  baseURL: string,
  parameters: { [x: string]: any }
) => {
  const queryString = Object.entries(parameters)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  return `${baseURL}?${queryString}`;
};

/**
 * Returns the current page location without the URL parameters
 * aka the canonical URL. Used for deduplicating URLs with unique
 * search parameters such that search engines can return a single
 * preferred URL for a given page.
 *
 * @param location
 *
 * @returns -> A canonical URL string of the current web page location.
 */
export const currentPageCanonicalURL = (location: Location): string => {
  return location.href.split("?")[0];
};
