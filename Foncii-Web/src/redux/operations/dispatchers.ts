"use client";
// Dependencies
// Types
import {
  CoordinatePoint,
  FmUserPost,
  FmUser,
  AuthProviders,
  FmIntegrationCredential,
  FmIntegrationProviders,
  FonciiRestaurant,
  ReservationSearchInput,
  ArticlePublication,
  Restaurant,
  AutoCompleteSuggestion,
  AnalyticsTimespan,
  UserMapAnalyticsDashboard,
  UserBusinessWebsiteAnalyticsDashboard,
  UserReservationIntentsAnalyticsDashboard
} from "../../__generated__/graphql";

// Action Dispatchers
import * as fonciiUserSliceActions from "../entities/slices/fonciiUser";
import * as notificationCenterSliceActions from "../entities/slices/notifications";
import * as mapboxSliceActions from "../entities/slices/mapboxSlice";
import * as visitedUserSliceActions from "../entities/slices/visitedUser";
import * as postFiltersSliceActions from "../entities/slices/postFilters";
import * as userPostsSliceActions from "../entities/slices/userPosts";
import * as fonciiRestaurantsSliceActions from "../entities/slices/fonciiRestaurants";

// Redux Global App Store Reference
import store from "../store";

// Services
import { FonciiAPIClientAdapter } from "../../services/foncii-api/adapters/fonciiAPIClientAdapter";
import AnalyticsService, {
  AnalyticsEvents,
} from "../../services/analytics/analyticsService";
import MediaService from "../../services/media/mediaService";

// Managers
import UserSessionManager from "../../managers/userSessionManager";

// Notifications
import { NotificationTemplates } from "../../core-foncii-maps/repositories/NotificationTemplates";

// Navigation
import { currentPageCanonicalURL } from "../../core-foncii-maps/properties/NavigationProperties";

// Utilities
import { delay } from "../../utilities/common/scheduling";
import { DateFormatter } from "../../utilities/formatting/miscFormatters";
import { convertNumericPriceLevelToDollarSigns } from "../../extensions/Restaurant+Extensions";
import { calculateMapSearchAreaDiameter } from "../../utilities/math/euclideanGeometryMath";
import { convertMSTimeToISODate } from "../../utilities/common/convenienceUtilities";

// Service Definition
const fonciiAPIService = () => new FonciiAPIClientAdapter(),
  mediaService = () => new MediaService();

// Foncii User actions to dispatch
export class FonciiUserActions {
  /**
   * Creates a new blank user post for the user to customize
   * from scratch.
   *
   * @async
   *
   * @returns -> The newly created user post
   */
  static createNewUserPost = async (): Promise<FmUserPost | null> => {
    const fonciiUser = store.getState().fonciiUser,
      userID = fonciiUser.user?.id;

    if (!userID) return null;

    // This method creates, appends, and organizes the new post with existing user posts already
    // no need to do that here as well
    const newPost = await fonciiAPIService().createUserPost({ userID });

    return newPost;
  };

  /**
   * @async
   * @param tasteProfileInput
   *
   * @returns -> True if the taste profile was created successfully,
   * false otherwise
   */
  static createTasteProfile = async (tasteProfileInput: {
    adventureLevel?: number;
    ambiancePreference?: number;
    diningPurpose?: number;
    dietaryRestrictions?: string[];
    distancePreferenceLevel?: number;
    drinkPreference?: number;
    preferredCuisines?: string[];
    preferredPriceRange?: number;
    spicePreferenceLevel?: number;
  }): Promise<boolean> => {
    // Parsing from app state
    const fonciiUser = store.getState().fonciiUser,
      userID = fonciiUser.user?.id;

    // User must be logged in to create a taste profile
    if (!userID) return false;

    const didSucceed =
      (await fonciiAPIService().performCreateTasteProfile({
        ...tasteProfileInput,
        userID,
      })) != undefined;

    // Refresh the current taste profile data attached to the user
    if (didSucceed) await this.refreshUserProfile();

    return didSucceed;
  };

  /**
   * @async
   * @param tasteProfileID
   * @param tasteProfileInput
   *
   * @returns -> True if the taste profile was updated successfully,
   * false otherwise
   */
  static updateTasteProfile = async (
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
    }
  ): Promise<boolean> => {
    // Parsing from app state
    const fonciiUser = store.getState().fonciiUser,
      userID = fonciiUser.user?.id;

    // User must be logged in to update their taste profile
    if (!userID) return false;

    const didSucceed = await fonciiAPIService().performUpdateTasteProfile(
      tasteProfileID,
      {
        ...tasteProfileInput,
        userID,
      }
    );

    // Refresh the current taste profile data attached to the user
    if (didSucceed) await this.refreshUserProfile();

    return didSucceed;
  };

  /**
   * Note: A user can always auto-generate a taste profile and have it become their primary,
   * even if they already have a taste profile generated and or equipped already.
   *
   * @async
   * @param selectedRestaurantIDs -> IDs of the restaurants selected by the user as favorites
   *
   * @returns -> True if the taste profile was auto-generated successfully,
   * false otherwise
   */
  static autoGenerateTasteProfile = async (
    selectedRestaurantIDs: string[]
  ): Promise<boolean> => {
    // Parsing from app state
    const fonciiUser = store.getState().fonciiUser,
      userID = fonciiUser.user?.id;

    // User must be logged in to auto-generate a taste profile
    if (!userID) return false;

    const didSucceed =
      (await fonciiAPIService().performAutoGenerateTasteProfile({
        userID,
        selectedRestaurantIDs,
      })) != undefined;

    return didSucceed;
  };

  /**
   * @param signingOut -> True if the user is currently signing out, false otherwise
   */
  static setSignOutState = (signingOut: boolean) => {
    store.dispatch(fonciiUserSliceActions.setSignOutState({ signingOut }));
  };

  /**
   * @param signingIn -> True if the user is currently signing in, false otherwise
   */
  static setSignInState = (signingIn: boolean) => {
    store.dispatch(fonciiUserSliceActions.setSignInState({ signingIn }));
  };

  /**
   * Use this when the use first signs up to prompt the FTUE flow
   */
  static startFTUE = () => {
    store.dispatch(fonciiUserSliceActions.startFTUE({}));
  };

  /**
   * Use this when the user completes the FTUE flow (onboarding)
   */
  static completeFTUE = () => {
    store.dispatch(fonciiUserSliceActions.completeFTUE({}));
  };

  /**
   * Sets the user's last known physical coordinates
   *
   * @param clientCoordinates -> The physical latitude and longitude coordinate point to set the
   * current user's client coordinates state with.
   */
  static setClientCoordinates = (
    clientCoordinates: CoordinatePoint | undefined
  ) => {
    store.dispatch(
      fonciiUserSliceActions.setClientCoordinates({ clientCoordinates })
    );

    AnalyticsService.shared.identifyUserLocation(clientCoordinates);
  };

  /**
   * Refreshes the user's profile data with the latest from the backend, can be used when the user
   * reloads the page, or opens the application while in a cached `logged in` state
   */
  static refreshUserProfile = async () => {
    const fonciiUser = store.getState().fonciiUser,
      isLoggedIn = fonciiUser.isLoggedIn,
      userID = fonciiUser.user?.id;

    // If the user isn't logged in, don't attempt to refresh their data
    if (!isLoggedIn || userID == undefined) {
      return;
    }

    await fonciiAPIService().fetchMainUser(userID);
  };

  /**
   * Refreshes all of the user's data (profile and posts) with the latest from the backend, can be used when the user
   * reloads the page, or opens the application while in a cached `logged in` state.
   */
  static refreshAllUserData = async () => {
    const fonciiUser = store.getState().fonciiUser,
      isLoggedIn = fonciiUser.isLoggedIn,
      userID = fonciiUser.user?.id;

    // If the user isn't logged in, don't attempt to refresh their data
    if (!isLoggedIn || userID == undefined) {
      return;
    }

    FonciiUserActions.refreshUserProfile();

    // Integration Credentials
    FonciiUserActions.setIntegrationConnectionInProgressState(false);
    FonciiUserActions.fetchIntegrationCredentials();

    // Saved Restaurants
    FonciiRestaurantActions.removeAllSavedRestaurants();
    FonciiRestaurantActions.fetchSavedRestaurants(true);

    // User Posts
    UserPostsActions.fetchMainUserPosts();
  };

  /**
   * @param user -> The current authenticated user's data to set the foncii user slice's state with
   */
  static setUser = (user: FmUser) => {
    store.dispatch(fonciiUserSliceActions.setUser({ user }));
  };

  /**
   * @param impersonatedUser -> The impersonated user's data to set the foncii user slice's state with
   */
  static setImpersonatedUser = (impersonatedUser: FmUser) => {
    store.dispatch(
      fonciiUserSliceActions.setImpersonatedUser({ impersonatedUser })
    );
  };

  /**
   * @param isLoggedIn -> True the user is currently logged in with valid auth creds, false otherwise
   */
  static setLoginState = (isLoggedIn: boolean) => {
    store.dispatch(fonciiUserSliceActions.setLoginState({ isLoggedIn }));
  };

  /**
   * Triggered when the user's login attempt fails, or if their access token is invalid when importing posts
   * Can be used in conjunction with the sign out method because the user's auth state is invalidated by the occurrence
   * of this error.
   */
  static authErrorOccurred = () => {
    store.dispatch(fonciiUserSliceActions.authErrorOccurred({}));
  };

  /**
   * Log in the user and fetch their required account data
   * on success.
   *
   * @async
   * @param authProvider -> Provider used to log in. If new the database updates the user's connected auth provider list automatically
   * @param userID -> ID of the user logging in, provided by firebase auth service
   * @param firstLogin -> Used to trigger the new account notif, and restrict the login notif to existing users only, default is false
   */
  static async login(
    authProvider: AuthProviders,
    userID: string,
    firstLogin: boolean = false
  ) {
    FonciiUserActions.setSignInState(true);
    FonciiUserActions.setLoadingState(true);

    const isClaimed = await fonciiAPIService().isAccountClaimed(userID),
      didSucceed = await fonciiAPIService().performLoginUser(
        authProvider,
        userID,
        firstLogin
      );

    // Remove any stale / unauthorized auth state locally, clear the current store
    if (!didSucceed) {
      this.signOut();
      return;
    }

    // For first manual logins and newly claimed accounts the FTUE (first time user experience) must be completed
    if (firstLogin || !isClaimed) {
      FonciiUserActions.startFTUE();

      // The user has just created an account, the next import should be marked as their first import.
      if (firstLogin) UserPostsActions.setFirstImportState(true);
    } else {
      // Mark FTUE as complete just in case any lingering FTUE state is around from an incomplete onboarding session from a prior login
      const fonciiUser = store.getState().fonciiUser,
        isFTUE = fonciiUser.isFTUE;

      if (isFTUE) FonciiUserActions.completeFTUE();
    }

    // Analytics
    AnalyticsService.shared.identifyUser(userID);
    AnalyticsService.shared.trackGenericEvent(AnalyticsEvents.USER_LOG_IN, {
      authProvider,
      firstLogin,
    });

    // Session Management
    await UserSessionManager.shared.createSession();

    // Initial Integration Credentials
    FonciiUserActions.fetchIntegrationCredentials();
  }

  /**
   * @param newMapName -> The pending new map name for the user's personal map of posts.
   * Note: Validation of this input is to be done outside of this function, specifically before calling
   * this method.
   */
  static updateMapName = (newMapName: string) => {
    const fonciiUser = store.getState().fonciiUser,
      userID = fonciiUser.user?.id;

    // Reject blank map name changes because map names aren't supposed to be blank
    // And reject if a user isn't logged in
    if (newMapName == "" || userID == undefined) {
      return;
    }

    FonciiUserActions.setLoadingState(true);
    fonciiAPIService().performUpdateUserMapName(newMapName, userID);
  };

  /**
   * @param isLoading -> True some async process is in progress, false otherwise
   */
  static setLoadingState = (isLoading: boolean) => {
    store.dispatch(fonciiUserSliceActions.setLoadingState({ isLoading }));
  };

  /**
   * Signs the user out by clearing all data and notifying the backend of the sign out event
   */
  static signOut = async (): Promise<void> => {
    const fonciiUser = store.getState().fonciiUser,
      userID = fonciiUser.user?.id;

    // Clear the local storage of any stored state tree data, since the user has signed out
    localStorage.clear();

    // Clear session storage as well
    sessionStorage.clear();

    // Stop all state tree persistence operations
    FonciiUserActions.setSignOutState(true);
    FonciiUserActions.setLoadingState(true);

    // Add a slight stylistic delay
    await delay(async () => {
      // Track sign out in the backend
      if (userID != undefined) {
        await fonciiAPIService().performSignOutUser(userID);
      }

      // Analytics
      AnalyticsService.shared.trackGenericEvent(AnalyticsEvents.USER_SIGN_OUT);
      AnalyticsService.shared.anonymizeUser();

      // Clear the user's posts and any cached visitor data since this state transition is effectively
      // resetting the client's entire state to it's initial state
      UserPostsActions.clear();
      FonciiRestaurantActions.clear();
      VisitedUserActions.clear();
      PostFiltersActions.clear();
      FonciiUserActions.clear();

      // Session Management
      await UserSessionManager.shared.endSession(true);
    }, 2000);
  };

  /**
   * @async
   * @param args
   *
   * @returns -> The defined integration credential if
   */
  static async connectIntegration(args: {
    authToken: string;
    redirectURI: string;
    integrationProvider: FmIntegrationProviders;
  }): Promise<FmIntegrationCredential | null> {
    const fonciiUser = store.getState().fonciiUser,
      isLoggedIn = fonciiUser.isLoggedIn,
      connectionInProgress = fonciiUser.integrationConnectionInProgress,
      userID = fonciiUser.user?.id;

    // If the user isn't logged in fall back; this is for authenticated users only
    // and don't disturb in-flight connection requests, this can cause duplicate credentials to be created.
    if (!isLoggedIn || userID == undefined || connectionInProgress) {
      return null;
    }

    FonciiUserActions.setIntegrationConnectionInProgressState(true);
    FonciiUserActions.setLoadingState(true);
    const newIntegrationCredential =
      await fonciiAPIService().performConnectIntegration({
        ...args,
        userID,
      });

    const didSucceed = newIntegrationCredential != null;

    AnalyticsService.shared.trackGenericEvent(
      didSucceed
        ? AnalyticsEvents.FONCII_MAPS_INTEGRATION_CONNECTED
        : AnalyticsEvents.FONCII_MAPS_INTEGRATION_CONNECTION_FAILED,
      {
        integrationCredential: newIntegrationCredential,
        integrationProvider: args.integrationProvider,
        redirectURI: args.redirectURI,
      }
    );

    return newIntegrationCredential;
  }

  static fetchIntegrationCredentials = async () => {
    const fonciiUser = store.getState().fonciiUser,
      isLoggedIn = fonciiUser.isLoggedIn,
      userID = fonciiUser.user?.id;

    // If the user isn't logged in fall back; this is for authenticated users only
    if (!isLoggedIn || userID == undefined) {
      return;
    }

    FonciiUserActions.setLoadingState(true);
    await fonciiAPIService().performGetUserIntegrationCredentials(userID);
  };

  static setIntegrationCredentials = (
    integrationCredentials: FmIntegrationCredential[]
  ) => {
    store.dispatch(
      fonciiUserSliceActions.setIntegrationCredentials({
        integrationCredentials,
      })
    );
  };

  static setIntegrationConnectionInProgressState = (
    integrationConnectionInProgress: boolean
  ) => {
    store.dispatch(
      fonciiUserSliceActions.setIntegrationConnectionInProgressState({
        integrationConnectionInProgress,
      })
    );
  };

  static revokeIntegrationCredential = async (
    integrationCredential: FmIntegrationCredential
  ): Promise<void> => {
    FonciiUserActions.setLoadingState(true);
    const didSucceed =
      await fonciiAPIService().performRevokeIntegrationCredential(
        integrationCredential
      );

    // Note: The credential is stripped of any sensitive information before being sent to this client
    AnalyticsService.shared.trackGenericEvent(
      didSucceed
        ? AnalyticsEvents.FONCII_MAPS_INTEGRATION_DISCONNECTED
        : AnalyticsEvents.FONCII_MAPS_INTEGRATION_DISCONNECTION_FAILED,
      { integrationCredential }
    );
  };

  static revokeAllIntegrationCredentials = async (): Promise<void> => {
    const fonciiUser = store.getState().fonciiUser,
      isLoggedIn = fonciiUser.isLoggedIn,
      userID = fonciiUser.user?.id;

    // If the user isn't logged in fall back; this is for authenticated users only
    if (!isLoggedIn || userID == undefined) {
      return;
    }

    FonciiUserActions.setLoadingState(true);
    const didSucceed =
      await fonciiAPIService().performRevokeAllIntegrationCredentials(userID);

    AnalyticsService.shared.trackGenericEvent(
      didSucceed
        ? AnalyticsEvents.FONCII_MAPS_INTEGRATIONS_REVOKED
        : AnalyticsEvents.FONCII_MAPS_INTEGRATIONS_REVOCATION_FAILED
    );
  };

  static refreshIntegrationCredential = async (
    integrationCredential: FmIntegrationCredential
  ) => {
    FonciiUserActions.setLoadingState(true);
    FonciiUserActions.setIntegrationConnectionInProgressState(true);

    const refreshedIntegrationCredential =
      await fonciiAPIService()
        .performRefreshIntegration(integrationCredential),
      didSucceed = refreshedIntegrationCredential != null;

    AnalyticsService.shared.trackGenericEvent(
      didSucceed
        ? AnalyticsEvents.FONCII_MAPS_INTEGRATION_REFRESHED
        : AnalyticsEvents.FONCII_MAPS_INTEGRATION_REFRESH_FAILED,
      { integrationCredential }
    );
  };

  static setAutoRefreshStateForCredential = async (
    integrationCredential: FmIntegrationCredential,
    autoRefreshEnabled: boolean
  ): Promise<void> => {
    FonciiUserActions.setLoadingState(true);
    const didSucceed =
      await fonciiAPIService().performSetAutoRefreshStateForCredential(
        integrationCredential,
        autoRefreshEnabled
      );

    AnalyticsService.shared.trackGenericEvent(
      didSucceed
        ? AnalyticsEvents.FONCII_MAPS_INTEGRATION_AUTO_REFRESH_UPDATED
        : AnalyticsEvents.FONCII_MAPS_INTEGRATION_AUTO_REFRESH_UPDATE_FAILED,
      { integrationCredential, autoRefreshEnabled }
    );
  };

  static updateIntegrationCredential = (
    updatedIntegrationCredential: FmIntegrationCredential
  ) => {
    store.dispatch(
      fonciiUserSliceActions.updateIntegrationCredential({
        updatedIntegrationCredential,
      })
    );
  };

  static insertIntegrationCredential = (
    newIntegrationCredential: FmIntegrationCredential
  ) => {
    store.dispatch(
      fonciiUserSliceActions.insertIntegrationCredential({
        newIntegrationCredential,
      })
    );
  };

  static removeIntegrationCredential = (integrationCredentialID: string) => {
    store.dispatch(
      fonciiUserSliceActions.removeIntegrationCredential({
        integrationCredentialID,
      })
    );
  };

  static clearAllIntegrationCredentials = () => {
    store.dispatch(fonciiUserSliceActions.clearAllIntegrationCredentials({}));
  };

  /**
   * Fetches and returns the various analytics dashboards viewable by 
   * Foncii creators specific to the currently logged in user.
   * 
   * @async
   * @param timespan -> The timespan to compute the dashboards relative to.
   * 
   * @returns -> All user analytics dashboards accessible by name
   */
  static fetchAnalyticsDashboards = async ({ timespan }: { timespan: AnalyticsTimespan }) => {
    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      userID = currentUser.user?.id;

    // Properties
    let userMapAnalyticsDashboard: UserMapAnalyticsDashboard | undefined,
      businessWebsiteAnalyticsDashboard: UserBusinessWebsiteAnalyticsDashboard | undefined,
      reservationIntentsAnalyticsDashboard: UserReservationIntentsAnalyticsDashboard | undefined;

    // Precondition failure, a current user ID is required
    if (!userID) return {
      userMapAnalyticsDashboard,
      businessWebsiteAnalyticsDashboard,
      reservationIntentsAnalyticsDashboard
    };

    [
      userMapAnalyticsDashboard,
      businessWebsiteAnalyticsDashboard,
      reservationIntentsAnalyticsDashboard
    ] = await Promise.all([
      fonciiAPIService().fetchUserMapAnalyticsDashboard({ userID, timespan }),
      fonciiAPIService().fetchBusinessWebsiteAnalyticsDashboard({ userID, timespan }),
      fonciiAPIService().fetchReservationIntentsAnalyticsDashboard({ userID, timespan })
    ]);

    return {
      userMapAnalyticsDashboard,
      businessWebsiteAnalyticsDashboard,
      reservationIntentsAnalyticsDashboard
    };
  }

  /**
   * Clears out this slice, removing all user post data with it (should be used when the user signs out)
   */
  static clear = () => {
    store.dispatch(fonciiUserSliceActions.clear());
  };
}

// Notification Center actions to dispatch
export class NotificationCenterActions {
  /**
   * Triggers a basic global system notification
   * @param title
   * @param message
   * @param isError
   * @param link
   */
  static triggerSystemNotification = (
    systemNotification: SystemNotificationProtocol
  ) => {
    store.dispatch(
      notificationCenterSliceActions.triggerSystemNotification({
        systemNotification,
      })
    );
  };

  /**
   * Dismisses any global system notification currently presented
   */
  static dismissSystemNotification = () => {
    store.dispatch(
      notificationCenterSliceActions.dismissSystemNotification({})
    );
  };
}

export class MapboxActions {
  static updateGalleryState = (galleryState: GalleryStates) => {
    store.dispatch(mapboxSliceActions.updateGalleryState({ galleryState }));
  };

  static updateMapState = (mapState: MapStates) => {
    store.dispatch(mapboxSliceActions.updateMapState({ mapState }));
  };

  /**
   * Sets the user's last known virtual coordinates
   *
   * @param virtualCoordinates -> The virtual latitude and longitude coordinate point to set the
   * current user's virtual coordinates state with.
   */
  static setVirtualCoordinates = (virtualCoordinates: CoordinatePoint) => {
    store.dispatch(
      mapboxSliceActions.setVirtualCoordinates({ virtualCoordinates })
    );
  };
  /**
   * Sets the user's virtual zoom level reported by the mapbox component.
   *
   * @param virtualZoomLevel -> Numeric zoom level pre-clamped by the mapbox widget.
   */
  static setVirtualZoomLevel = (virtualZoomLevel: number) => {
    store.dispatch(
      mapboxSliceActions.setVirtualZoomLevel({ virtualZoomLevel })
    );
  };
}

// User Posts actions to dispatch
export class UserPostsActions {
  static updatePostMedia = async (args: {
    userID: string;
    postID: string;
    mediaFileDataBuffer?: Uint8Array | undefined;
    videoThumbnailFileDataBuffer?: Uint8Array | undefined;
  }) => {
    NotificationCenterActions.triggerSystemNotification(
      NotificationTemplates.PostMediaUploadInProgress
    );

    const didSucceed = await mediaService().updatePostMedia(args);

    // If the upload is successful then reload the user's posts to display the updated post
    // with its new media
    if (didSucceed) {
      await UserPostsActions.fetchMainUserPosts();
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostMediaUploadSuccessful
      );
    } else {
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostMediaUploadError
      );
    }
  };

  /**
   * Imports and aggregate posts from the target Foncii Maps Integration
   * as well as return those aggregated posts back to this client to be
   * resolved locally with the existing post data.
   *
   * @static
   * @async
   * @param integrationCredential -> A credential authorizing the target Foncii Maps Integration
   * to import and aggregate posts from as well as return those aggregated posts back to this
   * client to be resolved locally with the existing post data.
   * @param manualImport -> True if posts are being imported manually by the user, if so the user should be notified via
   * some notification of the outcome of the import request, false otherwise (imported by some automatic process (new user session for ex))
   */
  static importUserPosts = async ({
    integrationCredential,
    manualImport = true,
  }: {
    integrationCredential: FmIntegrationCredential;
    manualImport?: boolean;
  }) => {
    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      userPosts = store.getState().userPosts,
      userID = currentUser.user?.id,
      isFirstImport = userPosts.isFirstImport;

    // Precondition failure, only authenticated users can import posts
    if (!userID) return;

    const didSucceed = await fonciiAPIService()
      .performImportPosts(
        integrationCredential,
        {
          manualImport,
          isFirstImport,
        }
      );

    AnalyticsService.shared.trackGenericEvent(
      didSucceed
        ? AnalyticsEvents.FONCII_MAPS_INTEGRATION_IMPORT_SUCCEEDED
        : AnalyticsEvents.FONCII_MAPS_INTEGRATION_IMPORT_FAILED,
      { integrationCredential }
    );

    // Load posts normally, the imported data will come through here
    if (didSucceed) await UserPostsActions.fetchMainUserPosts();

    return didSucceed;
  };

  /**
   * Fetches all of the main (currently logged in) user's posts.
   * Triggered when they enter their gallery and on subsequent
   * reloads.
   */
  static fetchMainUserPosts = async () => {
    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      entityFilters = store.getState().postFilters,
      userID = currentUser.user?.id,
      clientCoordinates = currentUser.clientCoordinates;

    // Precondition failure, only authorized (main) users can access all posts (visible and hidden)
    if (!userID) return;

    UserPostsActions.setLoadingState(true);

    // Chunking Process
    const chunkSize = 10;

    async function fetchNextChunk(page: number = 0) {
      return await fonciiAPIService().performFindAllPostsByUser({
        userID: userID!,
        currentUserID: userID,
        clientCoordinates,
        fonciiRestaurantSearchFilterInput: {
          reservableOnly: entityFilters.reservableOnly,
        },
        reservationSearchInput: {
          targetDate: new Date(
            entityFilters.targetReservationDate
          ).toISOString(),
          partySize: entityFilters.targetReservationPartySize,
        },
        paginationInput: {
          limit: chunkSize,
          page,
        },
      });
    }

    // Initial fetch
    let { posts: accumulatedPosts, totalPosts } = await fetchNextChunk(),
      totalChunks = totalPosts / chunkSize;

    // Sequential Successive fetches, [1] -> [1,2]...
    for (let index = 0; index < totalChunks; index++) {
      const page = index + 1,
        response = await fetchNextChunk(page),
        posts = response.posts;

      // Update post accumulator
      accumulatedPosts = [...new Set([...accumulatedPosts, ...posts])];

      // Update the state with the data from the API call
      UserPostsActions.setPosts(accumulatedPosts);

      // Populate filter data providers first, then organize and filter against these providers
      PostFiltersActions.synchronizePostFiltersWithPostsUpdate(
        accumulatedPosts
      );
      UserPostsActions.organizePosts();

      if (index == 0) UserPostsActions.setLoadingState(false);
    }

    UserPostsActions.setLoadingState(false);
  };

  /**
   * Separates and sorts the user's posts into their own individual categories (hidden and visible)
   * as well as optionally filters them.
   *
   * @param selectedPostID -> Optional selected post to boost to the top of the collection
   * @param filters -> Optional filters to pass to sort and filter the currently stored posts, default is the current
   * filters supported by the local store
   * @param query -> Optional search query, default is the current value from the store. Pass null to
   * mark the query as undefined and ignore its existing store value.
   */
  static organizePosts = (
    selectedPostID?: string | null,
    filters?: PostFilters,
    query: string | undefined | null = undefined
  ) => {
    const postFiltersState = store.getState().postFilters,
      storedFilters = postFiltersState,
      computedPostTextContentMappings =
        postFiltersState.computedPostTextContentMappings,
      storedSearchQuery = postFiltersState.searchQuery;

    // Search state clear flag parsing
    const shouldClear = query === null; // === to catch null only, == is a falsy so it catches null and undefined (bad)

    const fonciiUser = store.getState().fonciiUser,
      currentUserCoordinates = fonciiUser.clientCoordinates,
      postFilters: PostFilters = filters ?? storedFilters,
      searchQuery: string | undefined = shouldClear
        ? undefined
        : query ?? storedSearchQuery,
      postID = selectedPostID ?? postFiltersState.currentlySelectedPostID;

    store.dispatch(
      userPostsSliceActions.organizePosts({
        currentUserCoordinates,
        postFilters,
        computedPostTextContentMappings,
        searchQuery,
        selectedPostID: postID,
      })
    );
  };

  /**
   * Updates the currently selected post's restaurant data, or sets it if it's wasn't defined prior to this interaction
   * @param selectedGooglePlaceID -> The id of the google place to associate with the user's currently selected post, pass
   * an undefined value to remove the associated restaurant from the post
   * @param postID -> ID of the post to mutate
   *
   * @returns -> True if the operation succeeded, and false otherwise
   */
  static setRestaurantForPost = async (
    selectedGooglePlaceID: string | undefined,
    postID: string
  ): Promise<Boolean> => {
    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      entityFilters = store.getState().postFilters,
      userID = currentUser.user?.id,
      clientCoordinates = currentUser.clientCoordinates;

    // Verify that the user is logged in
    if (!userID) {
      return false;
    }

    UserPostsActions.setLoadingState(true);

    const didSucceed = await fonciiAPIService().performUpdatePostRestaurantData(
      {
        postID,
        userID,
        googlePlaceID: selectedGooglePlaceID,
      },
      {
        clientCoordinates,
        reservationSearchInput: {
          targetDate: new Date(
            entityFilters.targetReservationDate
          ).toISOString(),
          partySize: entityFilters.targetReservationPartySize,
        },
      }
    );

    AnalyticsService.shared.trackGenericEvent(
      didSucceed
        ? AnalyticsEvents.POST_ASSOCIATED_RESTAURANT_UPDATED
        : AnalyticsEvents.POST_ASSOCIATED_RESTAURANT_UPDATE_FAILED,
      { postID, selectedGooglePlaceID }
    );

    return didSucceed;
  };

  /**
   * @async
   * @param postID -> The post to update
   * @param rating -> The rating to associate with the post
   * @param review (Optional review for the creator to define) | Not being used as of 8/23
   * @param notes
   * @param customCategories -> List of custom categories to associate with the post
   * false otherwise (only visible to you, in your hidden posts gallery)
   */
  static updatePostCustomUserProperties = async (args: {
    postID: string;
    rating?: number;
    notes?: string;
    categories?: string[];
  }) => {
    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      entityFilters = store.getState().postFilters,
      userID = currentUser.user?.id,
      clientCoordinates = currentUser.clientCoordinates;

    // Verify that the user is logged in
    if (!userID) {
      return;
    }

    UserPostsActions.setLoadingState(true);

    await fonciiAPIService().performUpdatePostCustomUserProperties(
      {
        ...args,
        userID,
      },
      {
        clientCoordinates,
        reservationSearchInput: {
          targetDate: new Date(
            entityFilters.targetReservationDate
          ).toISOString(),
          partySize: entityFilters.targetReservationPartySize,
        },
      }
    );
  };

  /**
   * @param isImportingPosts -> True if the user posts are currently being imported, false otherwise
   */
  static setIsImportingPosts = (isImportingPosts: boolean) => {
    store.dispatch(
      userPostsSliceActions.setIsImportingPosts({ isImportingPosts })
    );
  };

  /**
   * @param posts -> List of posts to overwrite the current list of posts with
   */
  static setPosts = (posts: FmUserPost[]) => {
    store.dispatch(userPostsSliceActions.setPosts({ posts }));
  };

  /**
   * @param updatedPost -> The existing user post to update in the list of posts
   */
  static updatePost = (updatedPost: FmUserPost) => {
    store.dispatch(userPostsSliceActions.updatePost({ updatedPost }));

    PostFiltersActions.synchronizePostFiltersWithPostsUpdate();
  };

  static updatePostsWithRestaurant = (
    updatedFonciiRestaurant: FonciiRestaurant
  ) => {
    const userPostsState = store.getState().userPosts,
      userPosts = userPostsState.posts,
      targetFonciiRestaurantID = updatedFonciiRestaurant.restaurant.id;

    // Filter out the posts to update
    const postsWithTargetRestaurant = userPosts.filter((post) => {
      return post.fonciiRestaurant?.restaurant.id == targetFonciiRestaurantID;
    });

    // Update the target posts
    postsWithTargetRestaurant.map((post) => {
      const updatedPost: FmUserPost = {
        ...post,
        fonciiRestaurant: updatedFonciiRestaurant,
      };

      this.updatePost(updatedPost);
    });

    // Organize the store with the updated posts
    this.organizePosts();
  };

  /**
   * Updates all posts with the foncii restaurant with the target restaurant ID
   * using the given associated article publication data.
   *
   * @param restaurantID
   * @param associatedArticlePublicationEdges
   */
  static updateRestaurantWithAssociatedArticles = (args: {
    restaurantID: string;
    associatedArticlePublicationEdges: ArticlePublication[];
  }) => {
    store.dispatch(
      userPostsSliceActions.updateRestaurantWithAssociatedArticles(args)
    );

    UserPostsActions.organizePosts();
  };

  /**
   *  Appends a new post to the list of posts, used when downloading a post outside
   * of the current dataset, i.e detail views
   *
   * @param newPost
   */
  static appendPost = (newPost: FmUserPost) => {
    store.dispatch(userPostsSliceActions.appendPost({ newPost }));

    PostFiltersActions.synchronizePostFiltersWithPostsUpdate();
  };

  /**
   * Removes the post with the specified id from the user posts store,
   * usually used when deleting a post
   *
   * @param postID
   */
  static removePost = (postID: string) => {
    store.dispatch(userPostsSliceActions.removePost({ postID }));

    PostFiltersActions.synchronizePostFiltersWithPostsUpdate();
  };

  /**
   * @param postID
   * @param isFavorited -> True if you favorited the post, false otherwise,
   * note: favorited posts are pushed to the top of the gallery and are given special map markers
   */
  static setFavoritedStateForPost = async (
    post: FmUserPost,
    isFavorited: boolean
  ) => {
    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      userID = currentUser.user?.id;

    // Verify that the user is logged in
    if (!userID) {
      return;
    }

    UserPostsActions.setLoadingState(true);
    const didSucceed = await fonciiAPIService().performUpdatePostFavoriteState(
      post,
      userID,
      isFavorited
    );

    AnalyticsService.shared.trackGenericEvent(
      didSucceed
        ? AnalyticsEvents.POST_FAVORITE_STATE_UPDATED
        : AnalyticsEvents.POST_CUSTOM_USER_PROPERTIES_UPDATE_FAILED,
      { postID: post.id, isFavorited, pathname: location.pathname }
    );

    return didSucceed;
  };

  /**
   * @param isLoading -> True some async process is in progress, false otherwise
   */
  static setLoadingState = (isLoading: boolean) => {
    store.dispatch(userPostsSliceActions.setLoadingState({ isLoading }));
  };

  /**
   * @param isFirstImport -> True if the user is importing their posts for the first time (when they
   * first create an account and login), false otherwise
   */
  static setFirstImportState = (isFirstImport: boolean) => {
    store.dispatch(
      userPostsSliceActions.setFirstImportState({ isFirstImport })
    );
  };

  /**
   * @param importFailed -> True if the user posts import failed, false otherwise
   */
  static setImportFailedState = (importFailed: boolean) => {
    store.dispatch(
      userPostsSliceActions.setImportFailedState({ importFailed })
    );
  };

  /**
   * Clears out this slice, removing all user post data with it (should be used when the user signs out)
   */
  static clear = () => {
    store.dispatch(userPostsSliceActions.clear());
  };
}

// Foncii Restaurant actions to dispatch
export class FonciiRestaurantActions {
  /**
   * @async
   * @returns -> A list of posts directly associated with the given Foncii restaurant ID
   */
  static findAssociatedPostsFor = async (args: {
    fonciiRestaurantID: string;
    creatorID?: string;
    postsToExclude?: string[];
  }) => {
    // Current state of the Redux foncii restaurants posts slice
    const clientCoordinates = store.getState().fonciiUser.clientCoordinates;

    // Current state of logged in foncii user (if any)
    const fonciiUserState = store.getState().fonciiUser,
      userID = fonciiUserState.user?.id;

    return await fonciiAPIService().performFindAssociatedPostsFor({
      ...args,
      currentUserID: userID,
      clientCoordinates,
    });
  };

  /**
   * @async
   * @param restaurantID
   *
   * @returns -> A list of restaurants similar to the one with the given ID
   */
  static findRestaurantsSimilarTo = async (restaurantID: string) => {
    // Current state of the Redux foncii restaurants posts slice
    const clientCoordinates = store.getState().fonciiUser.clientCoordinates;

    // Current state of logged in foncii user (if any)
    const fonciiUserState = store.getState().fonciiUser,
      userID = fonciiUserState.user?.id;

    const restaurants =
      await fonciiAPIService().performFindRestaurantsSimilarTo({
        restaurantID,
        currentUserID: userID,
        clientCoordinates,
      });

    return restaurants;
  };

  /**
   * @async
   * @param searchQuery
   * @param coordinates
   * @param zoomLevel
   */
  static search = async ({
    searchQuery = "",
    coordinates,
    zoomLevel,
    reservationSearchInput,
    searchHereTriggered = false,
  }: {
    searchQuery?: string;
    coordinates?: CoordinatePoint;
    zoomLevel?: number;
    reservationSearchInput?: ReservationSearchInput;
    searchHereTriggered?: boolean;
  }) => {
    // Current state of the Redux foncii restaurants posts slice
    const fonciiRestaurantsState = store.getState().fonciiRestaurants,
      mapBoxState = store.getState().mapbox,
      entityFilters = store.getState().postFilters,
      currentSearchQuery =
        searchQuery != "" ? searchQuery : fonciiRestaurantsState.searchQuery,
      currentVirtualCoordinates = coordinates ?? mapBoxState.virtualCoordinates,
      currentVirtualZoomLevel =
        zoomLevel != undefined ? zoomLevel : mapBoxState.virtualZoomLevel,
      currentClientCoordinates = store.getState().fonciiUser.clientCoordinates;

    // Conditions
    const searchResultPageActive = currentSearchQuery != "";

    // Current state of logged in foncii user (if any)
    const fonciiUserState = store.getState().fonciiUser,
      userID = fonciiUserState.user?.id;

    // Don't interrupt in-flight search requests
    if (fonciiRestaurantsState.isLoading) return;

    // Calculate search area radius relative to zoom level
    // Diameter (in meters) = (40075016.686 * cos(latitude)) / (2^zoom)
    // Radius = Diameter / 2
    const searchAreaDiameter = calculateMapSearchAreaDiameter(
      currentVirtualCoordinates,
      currentVirtualZoomLevel
    ),
      minimumSearchAreaInKM = 0.804672, // ~ 0.5 Miles, minimum search area to prevent the search area from becoming too small
      minimumSearchAreaInMeters = minimumSearchAreaInKM * 1000,
      searchRadius = Math.max(minimumSearchAreaInMeters, searchAreaDiameter);

    FonciiRestaurantActions.setLoadingState(true);

    const { fonciiRestaurants, queryID } =
      await fonciiAPIService().performFonciiRestaurantSearch({
        userID,
        searchQuery: currentSearchQuery,
        searchCoordinates: currentVirtualCoordinates,
        clientCoordinates: currentClientCoordinates,
        searchRadius,
        fonciiRestaurantSearchFilterInput: {
          reservableOnly: entityFilters.reservableOnly,
        },
        reservationSearchInput,
      });

    // Analytics
    const reservationDate = convertMSTimeToISODate(
      entityFilters.targetReservationDate
    ),
      percentMatchScores = fonciiRestaurants.map(
        (fonciiRestaurant) => fonciiRestaurant.percentMatchScore ?? 0
      ),
      averagePercentMatchScore =
        percentMatchScores.length > 0
          ? percentMatchScores.reduce((a, b) => a + b, 0) /
          percentMatchScores.length
          : 0,
      qualityScores = fonciiRestaurants.map(
        (fonciiRestaurant) => fonciiRestaurant.qualityScore ?? 0
      ),
      averageQualityScore =
        qualityScores.length > 0
          ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
          : 0,
      candidateIDs = fonciiRestaurants.map(
        (fonciiRestaurant) => fonciiRestaurant.restaurant.id
      ),
      autoCompleteSuggestions =
        fonciiRestaurantsState.autocompleteSuggestions.map(
          (suggestion) => suggestion.description
        ),
      sourceURL = currentPageCanonicalURL(location),
      /** True if the search was from the user pressing the manual 'search here' button, false otherwise */
      isManualSearch = searchHereTriggered;

    AnalyticsService.shared.trackExploreSearch({
      query: currentSearchQuery,
      clientLocation: currentClientCoordinates,
      searchLocation: currentVirtualCoordinates,
      zoomLevel: currentVirtualZoomLevel,
      isManualSearch,
      reservationDate,
      partySize: entityFilters.targetReservationPartySize,
      prices: entityFilters.priceLevels,
      cuisines: entityFilters.cuisineTypes,
      tags: entityFilters.customCategories,
      autoCompleteSuggestions,
      averagePercentMatchScore,
      averageQualityScore,
      candidateIDs,
      sourceURL,
      queryID
    });

    // Only organize restaurants when the SRP is inactive, this is not needed as the SRP relies on semantic similarity to sort via the API
    if (!searchResultPageActive) {
      FonciiRestaurantActions.organizeRestaurants();
    }

    return fonciiRestaurants;
  };

  /**
   * Separates and sorts the user's posts into their own individual categories (hidden and visible)
   * as well as optionally filters them.
   *
   * @param selectedPostID -> Optional selected post to boost to the top of the collection
   * @param filters -> Optional filters to pass to sort and filter the currently stored posts, default is the current
   * filters supported by the local store
   * @param query -> Optional search query, default is the current value from the store. Pass null to
   * mark the query as undefined and ignore its existing store value.
   */
  static organizeRestaurants = (
    selectedFonciiRestaurantID?: string | null,
    filters?: PostFilters
  ) => {
    const postFiltersState = store.getState().postFilters,
      storedFilters = postFiltersState;

    const fonciiUser = store.getState().fonciiUser,
      currentUserCoordinates = fonciiUser.clientCoordinates,
      postFilters: PostFilters = filters ?? storedFilters;

    store.dispatch(
      fonciiRestaurantsSliceActions.organizeRestaurants({
        currentUserCoordinates,
        postFilters,
        selectedFonciiRestaurantID:
          selectedFonciiRestaurantID ??
          postFiltersState.currentlySelectedPostID,
      })
    );
  };

  /**
   * @param fonciiRestaurants -> List of foncii restaurants to update the current list of foncii restaurants with
   */
  static setRestaurants = (fonciiRestaurants: FonciiRestaurant[]) => {
    const postFiltersState = store.getState().postFilters,
      currentFonciiRestaurants =
        store.getState().fonciiRestaurants.fonciiRestaurants,
      selectedFonciiRestaurantID = postFiltersState.currentlySelectedPostID,
      currentlySelectedFonciiRestaurant = currentFonciiRestaurants.find(
        (fonciiRestaurant) =>
          fonciiRestaurant.restaurant.id == selectedFonciiRestaurantID
      ),
      updatedFonciiRestaurants = [...fonciiRestaurants],
      searchPageActive =
        postFiltersState.searchQuery != undefined &&
        postFiltersState.searchQuery != "";
    /**
     * The selected post is persisted amongst any new changes as the user is currently focused on it.
     * Only if the search page isn't active. If the SRP is active then the selected restaurant is thrown out.
     */
    if (currentlySelectedFonciiRestaurant) {
      if (
        !updatedFonciiRestaurants.find(
          (fonciiRestaurant) =>
            fonciiRestaurant.restaurant.id ==
            currentlySelectedFonciiRestaurant.restaurant.id
        )
      ) {
        updatedFonciiRestaurants.push(currentlySelectedFonciiRestaurant);
      }
    } else {
      // Deselect any selected entity ID
      // PostFiltersActions.clearCurrentlySelectedPostID();
    }

    store.dispatch(
      fonciiRestaurantsSliceActions.setRestaurants({ updatedFonciiRestaurants })
    );
  };

  /**
   * @param updatedFonciiRestaurant -> The existing foncii restaurant to update in the store's collection
   */
  static updateRestaurant = (updatedFonciiRestaurant: FonciiRestaurant) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.updateRestaurant({
        updatedFonciiRestaurant,
      })
    );

    PostFiltersActions.synchronizePostFiltersWithPostsUpdate();
  };

  /**
   * Appends a new post to the list of posts, used when downloading a post outside
   * of the current dataset, i.e detail views
   *
   * @param newPost
   */
  static appendRestaurant = (newFonciiRestaurant: FonciiRestaurant) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.appendRestaurant({ newFonciiRestaurant })
    );

    PostFiltersActions.synchronizeRestaurantFiltersWithRestaurantsUpdate();
  };

  /**
   * Saves the target foncii restaurant for the current user (if any), if the
   * restaurant wasn't saved already, and unsaves it if has been saved previously
   * by the user.
   *
   * @async
   * @param fonciiRestaurant -> Target restaurant to save for the current user to view later
   * @param post -> Optional post the restaurant was saved from
   *
   * @returns -> True if the operation succeeded, false otherwise
   */
  static handleRestaurantSave = async ({
    fonciiRestaurant,
    post,
  }: {
    fonciiRestaurant: FonciiRestaurant;
    post?: FmUserPost;
  }): Promise<boolean> => {
    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      userID = currentUser.user?.id;

    // Required
    if (!userID) return false;

    return await fonciiAPIService().handleRestaurantSave({
      userID,
      post,
      fonciiRestaurant,
    });
  };

  /**
   * @async
   * @param resetPagination -> Boolean flag used to reset pagination
   *
   * @returns Fetches and inserts the saved foncii restaurants to the saved restaurants collection
   */
  static fetchSavedRestaurants = async (resetPagination: boolean = false) => {
    // Constants
    const TOTAL_SAVED_RESTAURANTS_PER_PAGE = 10;

    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      entityFilters = store.getState().postFilters,
      savedFonciiRestaurantCount =
        store.getState().fonciiRestaurants.savedFonciiRestaurants.length,
      userID = currentUser.user?.id,
      clientCoordinates = currentUser.clientCoordinates,
      // Ex.) 10/10 -> page 1, so go to page 1 from page 0, 20/10 -> page 2 and so on. The
      paginationPageIndex = resetPagination
        ? 0
        : Math.floor(
          savedFonciiRestaurantCount / TOTAL_SAVED_RESTAURANTS_PER_PAGE
        );

    // Precondition failure, userID required
    if (!userID) return;

    await fonciiAPIService().performGetSavedRestaurantsFor(
      {
        userID,
        paginationPageIndex,
        resultsPerPage: TOTAL_SAVED_RESTAURANTS_PER_PAGE
      },
      {
        clientCoordinates,
        reservationSearchInput: {
          targetDate: new Date(
            entityFilters.targetReservationDate
          ).toISOString(),
          partySize: entityFilters.targetReservationPartySize,
        },
      }
    );
  };

  /**
   * Paginates forward if the saved restaurants collection can be paginated further. The pagination
   * stop flag is false by default until a subsequent query marks it as true by having a remaining document count > 0.
   * Note: [fetchSavedRestaurants] must be performed before this operation in order to flip the flag to true.
   */
  static paginateSavedRestaurants = async () => {
    const fonciiRestaurantState = store.getState().fonciiRestaurants,
      isLoading = fonciiRestaurantState.loadingSavedRestaurants,
      canPaginate = fonciiRestaurantState.canPaginateSavedRestaurants,
      paginationAllowed = !isLoading && canPaginate;

    if (paginationAllowed)
      await FonciiRestaurantActions.fetchSavedRestaurants();
  };

  /**
   * @param canPaginateSavedRestaurants -> True if the saved restaurants collection can be paginated further, false otherwise ~ false by default
   * until a subsequent query marks it as true by having a remaining document count > 0
   */
  static setCanPaginateSavedRestaurants = (
    canPaginateSavedRestaurants: Boolean
  ) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.setCanPaginateSavedRestaurants({
        canPaginateSavedRestaurants,
      })
    );
  };

  /**
   * @param savedFonciiRestaurants -> List of saved foncii restaurants to update the current list of saved foncii restaurants with
   */
  static setSavedRestaurants = (savedFonciiRestaurants: FonciiRestaurant[]) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.setSavedRestaurants({
        savedFonciiRestaurants,
      })
    );
  };

  /**
   * @param savedFonciiRestaurantsToInsert -> List of saved foncii restaurants to insert into the current list of saved foncii restaurants
   */
  static insertSavedRestaurants = (
    savedFonciiRestaurants: FonciiRestaurant[]
  ) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.insertSavedRestaurants({
        savedFonciiRestaurants,
      })
    );
  };

  static appendSavedRestaurant = (savedFonciiRestaurant: FonciiRestaurant) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.appendSavedRestaurant({
        savedFonciiRestaurant,
      })
    );
  };

  static removeSavedRestaurant = (fonciiRestaurantID: string) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.removeSavedRestaurant({
        fonciiRestaurantID,
      })
    );
  };

  /**
   * Used when refreshing the user's data
   */
  static removeAllSavedRestaurants = () => {
    store.dispatch(fonciiRestaurantsSliceActions.removeAllSavedRestaurants({}));
  };

  /**
   * Sets the search query to use for semantic search
   *
   * @param searchQuery -> The last search query typed by the user
   */
  static setSearchQuery = (searchQuery: string) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.setSearchQuery({ searchQuery })
    );
  };

  /**
   * Sets the id of last successful search query. Allows us to pass around
   * the current search query id to other methods and associate other 
   * unrelated events with the query that made their invocation possible.
   *
   * @param queryID -> The id of last successful search query.
   */
  static setQueryID = (queryID?: string) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.setQueryID({ queryID })
    );
  };

  /**
   * Updates the foncii restaurant with the target restaurant ID
   * with the given associated article publication data.
   *
   * @param restaurantID
   * @param associatedArticlePublicationEdges
   */
  static updateRestaurantWithAssociatedArticles = (args: {
    restaurantID: string;
    associatedArticlePublicationEdges: ArticlePublication[];
  }) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.updateRestaurantWithAssociatedArticles(args)
    );

    // Update visible elements, same goes for the gallery counterparts of this
    FonciiRestaurantActions.organizeRestaurants();
  };

  static cacheSearchQuery = (searchQuery: string) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.cacheSearchQuery({ searchQuery })
    );
  };

  static evictCachedSearchQuery = (searchQuery: string) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.evictCachedSearchQuery({ searchQuery })
    );
  };

  static invalidateSearchQueryCache = () => {
    store.dispatch(
      fonciiRestaurantsSliceActions.invalidateSearchQueryCache({})
    );
  };

  static setAutocompleteSuggestions = (
    autocompleteSuggestions: AutoCompleteSuggestion[]
  ) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.setAutocompleteSuggestions({
        autocompleteSuggestions,
      })
    );
  };

  static clearAutocompleteSuggestions = () => {
    store.dispatch(
      fonciiRestaurantsSliceActions.clearAutocompleteSuggestions({})
    );
  };

  /**
   * @param isLoading -> True some async process is in progress, false otherwise
   */
  static setLoadingState = (isLoading: boolean) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.setLoadingState({ isLoading })
    );
  };

  /**
   * @param isLoading -> True saved restaurants are being loaded up, false otherwise.
   */
  static setLoadingSavedRestaurantsState = (
    loadingSavedRestaurants: boolean
  ) => {
    store.dispatch(
      fonciiRestaurantsSliceActions.setLoadingSaveRestaurantsState({
        loadingSavedRestaurants,
      })
    );
  };

  /**
   * Clears out this slice, removing all explore post data with it.
   */
  static clear = () => {
    store.dispatch(fonciiRestaurantsSliceActions.clear());
  };
}

// Visited User actions to dispatch
export class VisitedUserActions {
  /**
   * Refreshes the visited user's data, useful when reloading the page for instance
   */
  static refreshVisitedUser = () => {
    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      userID = currentUser.user?.id;

    const visitedUser = store.getState().visitedUser,
      username = visitedUser.user?.username;

    // Precondition failure
    if (!username) {
      return;
    }

    VisitedUserActions.setLoadingState(true);
    fonciiAPIService().fetchVisitedUser(username, userID);
  };

  /**
   * @param username -> The visited user's username, present in the location path
   * of the visitor page to indicate to the user that they're viewing data specific to the user with that handle.
   * Their publicly available Foncii Maps data is fetched and returned to this authorized client using their username.
   */
  static getVisitedUser = (username: string) => {
    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      userID = currentUser.user?.id;

    VisitedUserActions.setLoadingState(true);
    fonciiAPIService().fetchVisitedUser(username, userID);
  };

  /**
   * @param user -> User data from the visited user
   */
  static setVisitedUser = (user: FmUser) => {
    store.dispatch(visitedUserSliceActions.setVisitedUser({ user }));
  };

  /**
   * Fetches the visited user's public posts
   */
  static getVisitedUserPosts = async () => {
    const visitedUser = store.getState().visitedUser,
      username = visitedUser.user?.username;

    // Abort fetching any more data and appending it to the store if the visited user changes (if the
    // current user switches between user maps)
    const shouldAbortFetch = (
      originalVisitedUserState: VisitedUserSliceState
    ): boolean => {
      // Properties
      const currVisitedUserState = store.getState().visitedUser,
        currVisitedUser = currVisitedUserState.user;

      // Parsing
      const originalVisitedUser = originalVisitedUserState.user;

      return currVisitedUser?.id != originalVisitedUser?.id;
    };

    // Precondition failure
    if (!username) return;

    // Current state of the Redux foncii user slice
    const currentUser = store.getState().fonciiUser,
      entityFilters = store.getState().postFilters,
      userID = currentUser.user?.id,
      clientCoordinates = currentUser.clientCoordinates;

    VisitedUserActions.setLoadingState(true);

    // Chunking Process
    const chunkSize = 10;

    async function fetchNextChunk(page: number = 0) {
      return await fonciiAPIService().performFindPublicPostsByUser({
        username: username!,
        currentUserID: userID,
        clientCoordinates,
        fonciiRestaurantSearchFilterInput: {
          reservableOnly: entityFilters.reservableOnly,
        },
        reservationSearchInput: {
          targetDate: new Date(
            entityFilters.targetReservationDate
          ).toISOString(),
          partySize: entityFilters.targetReservationPartySize,
        },
        paginationInput: {
          limit: chunkSize,
          page,
        },
      });
    }

    // Initial fetch
    let { posts: accumulatedPosts, totalPosts } = await fetchNextChunk(),
      totalChunks = totalPosts / chunkSize;

    // Sequential Successive fetches, [1] -> [1,2]...
    for (let index = 0; index < totalChunks; index++) {
      const page = index + 1,
        response = await fetchNextChunk(page),
        posts = response.posts;

      // Update post accumulator`
      accumulatedPosts = [...new Set([...accumulatedPosts, ...posts])];

      // Abort fetching and adding the fetched data to the store, the visited user has changed
      if (shouldAbortFetch(visitedUser)) break;

      // Update the state with the data from the API call
      VisitedUserActions.setPosts(accumulatedPosts);

      // Populate filter data providers first, then organize and filter against these providers
      PostFiltersActions.synchronizePostFiltersWithPostsUpdate(
        accumulatedPosts
      );
      VisitedUserActions.organizePosts();

      if (index == 0) VisitedUserActions.setLoadingState(false);
    }

    // Persist the loading state until the next required fetch turns it off
    if (shouldAbortFetch(visitedUser)) return;

    // Reset loading state here as well in case the user has 0 posts ~ User Posts counterpart of this method
    VisitedUserActions.setLoadingState(false);
  };

  static fetchIntegrationCredentials = async () => {
    const visitedUser = store.getState().visitedUser,
      userID = visitedUser.user?.id;

    // Precondition failure, visited user must be defined
    if (userID == undefined) {
      return;
    }

    VisitedUserActions.setLoadingState(true);
    await fonciiAPIService().performGetNonUserIntegrationCredentials(userID);
  };

  static setIntegrationCredentials = (
    integrationCredentials: FmIntegrationCredential[]
  ) => {
    store.dispatch(
      visitedUserSliceActions.setIntegrationCredentials({
        integrationCredentials,
      })
    );
  };

  /**
   * @param posts -> Public user posts
   */
  static setPosts = (posts: FmUserPost[]) => {
    store.dispatch(visitedUserSliceActions.setPosts({ posts }));
  };

  /**
   * @param updatedPost -> The existing user post to update in the list of posts
   */
  static updatePost = (updatedPost: FmUserPost) => {
    store.dispatch(visitedUserSliceActions.updatePost({ updatedPost }));

    PostFiltersActions.synchronizePostFiltersWithPostsUpdate();
  };

  static updatePostsWithRestaurant = (
    updatedFonciiRestaurant: FonciiRestaurant
  ) => {
    const visitedUserState = store.getState().visitedUser,
      visitedUserPosts = visitedUserState.posts,
      targetFonciiRestaurantID = updatedFonciiRestaurant.restaurant.id;

    // Filter out the posts to update
    const postsWithTargetRestaurant = visitedUserPosts.filter((post) => {
      return post.fonciiRestaurant?.restaurant.id == targetFonciiRestaurantID;
    });

    // Update the target posts
    postsWithTargetRestaurant.map((post) => {
      const updatedPost: FmUserPost = {
        ...post,
        fonciiRestaurant: updatedFonciiRestaurant,
      };

      this.updatePost(updatedPost);
    });

    // Organize the store with the updated posts
    this.organizePosts();
  };

  /**
   * Organizes the visited user's posts by distance from the current user (if their location is enabled)
   * as well as optionally filters them.
   *
   * @param selectedPostID -> Optional selected post to boost to the top of the collection
   * @param filters -> Optional filters to pass to sort and filter the currently stored posts, default is the current
   * filters supported by the local store
   * @param query -> Optional search query, default is the current value from the store. Pass null to
   * mark the query as undefined and ignore its existing store value.
   */
  static organizePosts = (
    selectedPostID?: string | null,
    filters?: PostFilters,
    query: string | undefined | null = undefined
  ) => {
    const postFiltersState = store.getState().postFilters,
      storedFilters = postFiltersState,
      computedPostTextContentMappings =
        postFiltersState.computedPostTextContentMappings,
      storedSearchQuery = postFiltersState.searchQuery;

    // Search state clear flag parsing
    const shouldClear = query === null; // === to catch null only, == is a falsy so it catches null and undefined (bad)

    const fonciiUser = store.getState().fonciiUser,
      currentUserCoordinates = fonciiUser.clientCoordinates,
      postFilters: PostFilters = filters ?? storedFilters,
      searchQuery: string | undefined = shouldClear
        ? undefined
        : query ?? storedSearchQuery,
      postID = selectedPostID ?? postFiltersState.currentlySelectedPostID;

    store.dispatch(
      visitedUserSliceActions.organizePosts({
        currentUserCoordinates,
        postFilters,
        computedPostTextContentMappings,
        searchQuery,
        selectedPostID: postID,
      })
    );
  };

  /**
   * Updates all posts with the foncii restaurant with the target restaurant ID
   * using the given associated article publication data.
   *
   * @param restaurantID
   * @param associatedArticlePublicationEdges
   */
  static updateRestaurantWithAssociatedArticles = (args: {
    restaurantID: string;
    associatedArticlePublicationEdges: ArticlePublication[];
  }) => {
    store.dispatch(
      visitedUserSliceActions.updateRestaurantWithAssociatedArticles(args)
    );

    VisitedUserActions.organizePosts();
  };

  /**
   *  Appends a new post to the list of posts, used when downloading a post outside
   * of the current dataset, i.e detail views
   *
   * @param newPost
   */
  static appendPost = (newPost: FmUserPost) => {
    store.dispatch(visitedUserSliceActions.appendPost({ newPost }));
  };

  /**
   * @param isLoading -> True some async process is in progress, false otherwise
   */
  static setLoadingState = (isLoading: boolean) => {
    store.dispatch(visitedUserSliceActions.setLoadingState({ isLoading }));
  };

  static clearAllIntegrationCredentials = () => {
    store.dispatch(visitedUserSliceActions.clearAllIntegrationCredentials({}));
  };

  /**
   * Clear the visited user's data when it's no longer needed i.e when switching back to the home page
   */
  static clear = () => {
    store.dispatch(visitedUserSliceActions.clear());
  };
}

// Restaurant Filter Actions to dispatch
export class PostFiltersActions {
  /**
   * Stores the currently selected post ID in the local store
   * @param selectedPostID
   */
  static setCurrentlySelectedPostID = (selectedPostID: string): void => {
    store.dispatch(
      postFiltersSliceActions.setCurrentlySelectedPostID({ selectedPostID })
    );
  };

  /**
   * Clears the currently selected post ID from the local store
   */
  static clearCurrentlySelectedPostID = (): void => {
    store.dispatch(postFiltersSliceActions.clearCurrentlySelectedPostID({}));
  };

  /**
   * Sets all filters at once instead of one by one to maintain
   * simplicity
   *
   * @param postFilters
   */
  static setFilters = (postFilters: PostFilters): void => {
    store.dispatch(postFiltersSliceActions.setFilters({ postFilters }));
  };

  /**
   * Sets the current search query to query posts against.
   *
   * @param searchQuery
   */
  static setSearchQuery = (searchQuery?: string): void => {
    store.dispatch(postFiltersSliceActions.setSearchQuery({ searchQuery }));
  };

  /**
   * @param restaurants -> An array of restaurants to extract filterable categories from
   */
  static setCategoriesToFilterBy = (restaurants: Restaurant[]) => {
    let accumulatedCategories: string[] = [];

    restaurants.forEach((restaurant) => {
      const categories: string[] = restaurant.categories ?? [];
      accumulatedCategories.push(...categories);
    });

    store.dispatch(
      postFiltersSliceActions.setCategoriesToFilterBy({
        categories: accumulatedCategories,
      })
    );
  };

  /**
   * @param posts -> An array of posts (visible or hidden) with
   * custom user property data attached to provide filterable categories / tags from
   */
  static setTagsToFilterBy = (posts: FmUserPost[]) => {
    let accumulatedTags: string[] = [];

    posts.forEach((post) => {
      const customCategories = post.customUserProperties?.categories ?? [];

      accumulatedTags.push(...customCategories);
    });

    store.dispatch(
      postFiltersSliceActions.setTagsToFilterBy({
        customCategories: accumulatedTags,
      })
    );
  };

  /**
   * @param allPosts -> An array of all current posts to
   * determine the min and max date ranges to filter by
   */
  static setDateRangeToFilterBy = (allPosts: FmUserPost[]) => {
    const postCreationDates = allPosts.map((post) => {
      const originalCreationDateTimestamp =
        post.dataSource?.creationDate ?? post.creationDate,
        originalCreationDate = new Date(originalCreationDateTimestamp);

      return originalCreationDate.getTime();
    });

    // [Max, Min] Max is the most recent date (newest), and min the oldest date
    const oldestDate = Math.min(...postCreationDates) ?? new Date().getTime(),
      newestDate = Math.max(...postCreationDates) ?? new Date().getTime(),
      dateRange = [newestDate, oldestDate];

    store.dispatch(
      postFiltersSliceActions.setDateRangeToFilterBy({ dateRange })
    );
  };

  /**
   * @param allPosts -> An array of all current posts to destructure into
   * computed stringified mappings for in-memory full text search.
   */
  static setComputedPostTextContentMappings = (allPosts: FmUserPost[]) => {
    const computedMappings = this.computePostTextContentMappings(allPosts);

    store.dispatch(
      postFiltersSliceActions.setComputedPostTextContentMappings({
        computedMappings,
      })
    );
  };

  static computePostTextContentMappings = (posts: FmUserPost[]) => {
    const computedMappings: { [key: string]: string } = {};

    posts.forEach((post) => {
      const fieldContentAccumulator: string[] = [];

      // Parsing
      // Formatted Dates
      const postOriginalCreationDateString = DateFormatter.formatDateToMDY(
        new Date(post.dataSource?.creationDate ?? post.creationDate)
      );

      // Video vs Image Content
      const postMediaContent = post.mediaIsVideo ? "Video" : "Image";

      // Misc Post Metadata Keywords
      const childPostKeywords = post.isChildPost ? ["Duplicate"] : [],
        favoritedPostKeywords = post.isFavorited ? ["Favorite"] : [];

      // Resource Identifiers
      fieldContentAccumulator.push(
        post.id,
        post.userID,
        post.parentPostID ?? "",
        post.restaurant?.id ?? ""
      );

      // Restaurant Data (if any)
      if (post.restaurant) {
        // Restaurant Metadata
        const servesAlcoholKeywords = post.restaurant?.servesAlcohol
          ? [
            "alcohol",
            "drinks",
            "beer",
            "wine",
            "liquor",
            "spirits",
            "bar",
            "pub",
          ]
          : [], // Keywords to inject for alcohol query matching
          priceLevel =
            convertNumericPriceLevelToDollarSigns(
              post.restaurant.priceLevel ?? 0
            ) ?? "",
          priceLevelKeywords =
            {
              0: [], // No specific keywords for price level 0
              1: ["cheap", "budget-friendly", "economical", "cost-effective"],
              2: [
                "affordable",
                "moderate",
                "reasonable",
                "mid-priced",
                "fair-priced",
              ],
              3: ["pricey", "higher-priced", "costly", "upscale", "premium"],
              4: ["expensive", "luxury", "high-end", "exclusive", "opulent"],
            }[post.restaurant.priceLevel ?? 0] ?? [],
          addressProps = Object.values(
            post.restaurant.addressProperties ?? {}
          ).map((value) => value ?? ""); // Destructured address properties

        fieldContentAccumulator.push(
          post.restaurant.name,
          post.restaurant.description ?? "",
          [
            post.restaurant.coordinates.lat,
            post.restaurant.coordinates.lng,
          ].toString(),
          ...(post.restaurant.categories ?? []),
          post.restaurant.website ?? "",
          post.restaurant.phoneNumber ?? "",
          post.restaurant.yelpID ?? "",
          post.restaurant.googleID ?? "",
          post.restaurant.yelpProperties?.rating?.toString() ?? "",
          post.restaurant.googleProperties?.rating?.toString() ?? "",
          ...servesAlcoholKeywords,
          ...addressProps,
          priceLevel,
          ...priceLevelKeywords
        );
      }

      // Post Data Source
      fieldContentAccumulator.push(
        post.dataSource?.permalink ?? "",
        post.dataSource?.caption ?? ""
      );

      // Creator Data
      fieldContentAccumulator.push(post.creator.username, post.creator.mapName);

      // Custom User Post Properties Data
      fieldContentAccumulator.push(
        ...(post.customUserProperties.categories ?? []),
        post.customUserProperties.notes ?? "",
        post.customUserProperties.rating?.toString() ?? ""
      );

      // Misc Metadata
      fieldContentAccumulator.push(
        postMediaContent,
        postOriginalCreationDateString,
        ...childPostKeywords,
        ...favoritedPostKeywords
      );

      const cleanedUpAccumulatedFieldContent = fieldContentAccumulator
        .filter(Boolean) // Remove any falsy values (false, 0, null, undefined, NaN, "" or '' or ``)
        .join("") // Join all values into a single string blob
        .toString()
        .toLowerCase()
        .trim();

      computedMappings[post.id] = cleanedUpAccumulatedFieldContent;
    });

    return computedMappings;
  };

  /**
   * Updates the filter data providers when a post is updated, removed, or
   * appended to the store.
   *
   * @param passedPosts -> Optional list of posts to sync the filter data providers
   * with, if not provided then the latest posts in the store are used by default.
   */
  static synchronizePostFiltersWithPostsUpdate = (
    passedPosts?: FmUserPost[]
  ) => {
    const userPosts = store.getState().userPosts,
      posts = passedPosts ?? userPosts.posts,
      // Only visible posts with defined restaurant data have their categories extracted for filters to use
      restaurants = posts
        .filter((post) => !post.isHidden)
        .map((post) => {
          return post.restaurant;
        })
        .filter(Boolean) as Restaurant[];

    // Update all post dependent filters when a single post is updated
    PostFiltersActions.setTagsToFilterBy(posts);
    PostFiltersActions.setCategoriesToFilterBy(restaurants);
    PostFiltersActions.setDateRangeToFilterBy(posts);
    PostFiltersActions.setComputedPostTextContentMappings(posts);
  };

  /**
   * Updates the filter data providers when a restaurant is removed, or
   * appended to the store. Persistent updates to restaurant data aren't possible
   * on the client side so this isn't used for situations such as 'updateRestaurantWithAssociatedArticles'.
   *
   * @param passedFonciiRestaurants -> Optional list of restaurants to sync the filter data providers
   * with, if not provided then the latest restaurants in the store are used by default.
   */
  static synchronizeRestaurantFiltersWithRestaurantsUpdate = (
    passedFonciiRestaurants?: FonciiRestaurant[]
  ) => {
    const fonciiRestaurantsState = store.getState().fonciiRestaurants,
      fonciiRestaurants =
        passedFonciiRestaurants ?? fonciiRestaurantsState.fonciiRestaurants,
      restaurants = fonciiRestaurants.map((fonciiRestaurant) => {
        return fonciiRestaurant.restaurant;
      });

    // Update all restaurant dependent filters when a single restaurant is updated
    PostFiltersActions.setCategoriesToFilterBy(restaurants);

    // Note: probably going to set up an aggregate field for custom restaurant tags populated by posts later on, but not right now
  };

  static clear = () => {
    store.dispatch(postFiltersSliceActions.clear());
  };
}