"use client";
// Dependencies
// Types
import {
  ArticlePublicationClickEventPayload,
  BusinessWebsiteClickEventPayload,
  CoordinatePoint,
  ExploreSearchEventPayload,
  FonciiAnalyticsEventPayloads,
  FonciiEvents,
  MapPinClickEventPayload,
  PostClickEventPayload,
  PostSourceLinkClickEventPayload,
  PostViewEventPayload,
  ReservationSearchEventPayload,
  RestaurantClickEventPayload,
  RestaurantViewEventPayload,
  ShareEventPayload,
  UserGallerySearchEventPayload,
  UserGalleryViewEventPayload,
} from "../../__generated__/graphql";

// Amplitude Browser SDK
import * as amplitude from "@amplitude/analytics-browser";

// App Properties
import { nonProductionEnvironment } from "../../core-foncii-maps/properties/AppProperties";

// Services
import { FonciiAPIClientAdapter } from "../foncii-api/adapters/fonciiAPIClientAdapter";

// Managers
import UserManager from "../../managers/userManager";

// Navigation
import { currentPageCanonicalURL } from "../../core-foncii-maps/properties/NavigationProperties";

// Utilities
import { UnitsOfTimeInMS } from "../../utilities/common/time";
import { v4 as uuidv4 } from "uuid";

// Events
export enum AnalyticsEvents {
  // Event Categories
  // AUTH
  USER_CREATED = "user-created",
  USER_CREATION_NEEDED = "user-creation-needed",
  USER_CREATION_FAILED = "user-creation-failed",
  USER_LOG_IN = "user-log-in",
  USER_LOG_IN_FAILED = "user-log-in-failed",
  USER_SIGN_OUT = "user-sign-out",

  // BUTTONS
  GET_DIRECTIONS_BUTTON_CLICKED = "get-directions-button-clicked",
  CLAIM_YOUR_MAP_BUTTON_CLICKED = "claim-your-map-button-clicked",
  JOIN_FONCII_MAPS_BUTTON_CLICKED = "join-foncii-maps-button-clicked",

  // LINKS
  DETAIL_VIEW_WEBSITE_LINK_CLICKED = "detail-view-website-link-clicked",
  DETAIL_VIEW_PHONE_LINK_CLICKED = "detail-view-phone-link-clicked",
  DETAIL_VIEW_CREATOR_GALLERY_LINK_CLICKED = "detail-view-creator-gallery-link-clicked",

  // SHARING
  SHARE_SHEET_LINK_COPIED = "share-sheet-link-copied",
  SHARE_SHEET_LINK_SHARED_TO_REDDIT = "share-sheet-link-shared-to-reddit",
  SHARE_SHEET_LINK_SHARED_TO_FACEBOOK = "share-sheet-link-shared-to-facebook",
  SHARE_SHEET_LINK_SHARED_TO_TWITTER = "share-sheet-link-shared-to-twitter",
  SHARE_SHEET_LINK_SHARED_TO_WHATSAPP = "share-sheet-link-shared-to-whatsapp",
  SHARE_SHEET_LINK_SHARED_TO_LINKEDIN = "share-sheet-link-shared-to-linkedin",

  // USER REFERRALS
  USER_REFERRAL_CODE_COPIED = "user-referral-code-copied",
  USER_REFERRAL_CODE_SHARED_TO_REDDIT = "user-referral-code-shared-to-reddit",
  USER_REFERRAL_CODE_SHARED_TO_FACEBOOK = "user-referral-code-shared-to-facebook",
  USER_REFERRAL_CODE_SHARED_TO_TWITTER = "user-referral-code-shared-to-twitter",
  USER_REFERRAL_CODE_SHARED_TO_WHATSAPP = "user-referral-code-shared-to-whatsapp",
  USER_REFERRAL_CODE_SHARED_TO_LINKEDIN = "user-referral-code-shared-to-linkedin",

  // NAVIGATION
  RESTAURANT_DETAIL_VIEW_OPENED = "restaurant-detail-view-opened",
  POST_DETAIL_VIEW_OPENED = "post-detail-view-opened",
  POST_EDITOR_DETAIL_VIEW_OPENED = "post-editor-detail-view-opened",

  // USER ACCOUNT
  USER_PROFILE_PICTURE_UPDATED = "user-profile-picture-updated",
  USER_PROFILE_PICTURE_UPDATE_FAILED = "user-profile-picture-updated",

  // POSTS
  POST_FAVORITE_STATE_UPDATED = "post-favorited-state-updated",
  POST_FAVORITE_STATE_UPDATE_FAILED = "post-favorite-state-update-failed",
  POST_VIDEO_VIEWED = "post-video-viewed",
  POST_SOURCE_PERMALINK_CLICKED = "post-source-permalink-clicked",
  POST_ASSOCIATED_RESTAURANT_UPDATED = "post-associated-restaurant-updated",
  POST_ASSOCIATED_RESTAURANT_UPDATE_FAILED = "post-associated-restaurant-update-failed",
  POST_DUPLICATED = "post-duplicated",
  POST_DUPLICATION_FAILED = "post-duplication-failed",
  POST_CUSTOM_USER_PROPERTIES_UPDATED = "post-custom-user-properties-updated",
  POST_CUSTOM_USER_PROPERTIES_UPDATE_FAILED = "post-custom-user-properties-update-failed",
  POST_SELECTED = "post-selected", // Post selected either via gallery or map pin
  POST_VIEWED = "post-viewed",
  POST_CREATED = "post-created",
  POST_CREATION_FAILED = "post-created-failed",
  POST_DELETED = "post-deleted",
  POST_DELETION_FAILED = "post-deletion-failed",

  // FONCII RESTAURANTS
  FONCII_RESTAURANT_SELECTED = "foncii-restaurant-selected", // Foncii restaurant selected either via gallery or map pin
  FONCII_RESTAURANT_SAVED = "foncii-restaurant-saved",
  FONCII_RESTAURANT_UNSAVED = "foncii-restaurant-unsaved",

  // SEARCH
  EXPLORE_SEARCH_PERFORMED = "explore-search-performed",
  GALLERY_SEARCH_PERFORMED = "gallery-search-performed",
  GALLERY_FILTERS_UPDATED = "gallery-filters-updated",

  // FONCII MAPS INTEGRATIONS
  FONCII_MAPS_INTEGRATION_IMPORT_SUCCEEDED = "foncii-maps-integration-import-succeeded",
  FONCII_MAPS_INTEGRATION_IMPORT_FAILED = "foncii-maps-integration-import-failed",
  FONCII_MAPS_INTEGRATION_CONNECTED = "foncii-maps-integration-connected",
  FONCII_MAPS_INTEGRATION_DISCONNECTED = "foncii-maps-integration-disconnected",
  FONCII_MAPS_INTEGRATION_REFRESHED = "foncii-maps-integration-refreshed",
  FONCII_MAPS_INTEGRATION_REFRESH_FAILED = "foncii-maps-integration-refresh-failed",
  FONCII_MAPS_INTEGRATION_AUTO_REFRESH_UPDATED = "foncii-maps-auto-refresh-updated",
  FONCII_MAPS_INTEGRATION_AUTO_REFRESH_UPDATE_FAILED = "foncii-maps-auto-refresh-update-failed",
  FONCII_MAPS_INTEGRATIONS_REVOKED = "foncii-maps-integrations-revoked",
  FONCII_MAPS_INTEGRATIONS_REVOCATION_FAILED = "foncii-maps-integration-revocation-failed",
  FONCII_MAPS_INTEGRATION_CONNECTION_FAILED = "foncii-maps-integration-connection-failed",
  FONCII_MAPS_INTEGRATION_DISCONNECTION_FAILED = "foncii-maps-integration-disconnection-failed",
}

export default class AnalyticsService {
  // Limits
  // 3 Seconds minimum are required in order to register a valid view for restaurant and user post detail view content
  MIN_VIEW_DURATION_FOR_DETAIL_VIEW_CONTENT = UnitsOfTimeInMS.second * 3;

  // Singleton
  static shared: AnalyticsService = new AnalyticsService();

  // Services
  apiService = () => new FonciiAPIClientAdapter();

  // Managers
  userManager = () => UserManager.shared;

  // Properties
  currentUserID = () => this.userManager().currentUser()?.id;

  setup() {
    // Init SDK with the target Project's API key given the current environment
    // + The current logged in user's ID (if available)
    amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY, {
      userId: this.currentUserID(),
      defaultTracking: true,
    });
  }

  // Convenience
  getDeviceID() {
    return amplitude.getDeviceId();
  }

  getSessionID() {
    return amplitude.getSessionId();
  }

  // Business Logic
  identifyUser(userID?: string) {
    if (!userID) return;
    amplitude.setUserId(userID);
  }

  identifyUserLocation(coordinates: CoordinatePoint | undefined) {
    if (!coordinates) return;
    const identifyEvent = new amplitude.Identify();

    identifyEvent.set("Latitude", coordinates.lat);
    identifyEvent.set("Longitude", coordinates.lng);

    amplitude.identify(identifyEvent);
  }

  /**
   * Tracks generic events through Amplitude for simple user metrics
   *
   * @async
   * @param event
   * @param properties
   */
  trackGenericEvent(
    event: AnalyticsEvents | FonciiEvents,
    properties?: { [x: string]: any }
  ) {
    // Development only debugging for analytics
    if (nonProductionEnvironment) {
      console.log(`Tracking ${event}, Properties:`);
      console.table(properties);
    }

    amplitude.track(event, properties);
  }

  /**
   * Tracks specialized Foncii events with both our own specialized analytics pipeline for analyzing advanced user and platform metrics
   * and Amplitude for data parity.
   *
   * @async
   * @param event -> The type of event to track
   * @param payload -> The data associated with the specified event (must correspond to the provided event type or else an error will be thrown)
   */
  private async trackFonciiEvent({
    event,
    payload,
  }: {
    event: FonciiEvents;
    payload: FonciiAnalyticsEventPayloads;
  }) {
    // Properties
    // The UID of the user currently logged in and invoking events
    const userID = this.userManager().currentUser()?.id;

    const didSucceed = await this.apiService().performTrackFonciiEvent({
      userID,
      event,
      payload,
    });

    // Reject unsuccessful events
    if (didSucceed) {
      // Parse the event properties from the defined payload object (there should only be one defined, the rest are for other event types)
      const eventProperties = Object.values(payload).filter(Boolean)[0] ?? {};

      this.trackGenericEvent(event, eventProperties);
    }
  }

  /**
   * Resets the userID and device ID of the current user when they log out,
   * effectively making the user appear as a brand new user in dashboard.
   */
  anonymizeUser() {
    amplitude.reset();
  }

  // Specialized Events
  generateShareEventID = () => uuidv4();
  // The full URL of the user's current location / state
  getSourceURL = () => currentPageCanonicalURL(location);

  private isViewEventValid({
    viewDuration,
    threshold,
  }: {
    viewDuration: number;
    threshold: number;
  }) {
    return viewDuration >= threshold;
  }

  // /**
  //  * A reservation intent is an action intended by a user to make a reservation at an establishment.
  //  * If the user successfully makes a reservation and reports it to our services then a successful
  //  * reservation is registered in our system. A reservation is able to be transitioned by
  //  * external inputs such as a user cancelling a reservation and informing us (or anything we see fit down the line).
  //  */
  // ReservationIntent = 'RESERVATION_INTENT',
  // ReservationSearch = 'RESERVATION_SEARCH'

  // Reservation

  // Search
  async trackReservationSearch(payload: ReservationSearchEventPayload) { }

  async trackUserGallerySearch(payload: UserGallerySearchEventPayload) {
    return await this.trackFonciiEvent({
      event: FonciiEvents.UserGallerySearch,
      payload: {
        userGallerySearchEventPayload: {
          ...payload,
        },
      },
    });
  }

  async trackExploreSearch(payload: ExploreSearchEventPayload) {
    return await this.trackFonciiEvent({
      event: FonciiEvents.ExploreSearch,
      payload: {
        exploreSearchEventPayload: {
          ...payload,
        },
      },
    });
  }

  // Clicks
  async trackArticlePublicationClick(
    payload: ArticlePublicationClickEventPayload
  ) {
    return await this.trackFonciiEvent({
      event: FonciiEvents.ArticlePublicationClick,
      payload: {
        articlePublicationClickEventPayload: {
          ...payload,
        },
      },
    });
  }

  async trackBusinessWebsiteClick(payload: BusinessWebsiteClickEventPayload) {
    return await this.trackFonciiEvent({
      event: FonciiEvents.BusinessWebsiteClick,
      payload: {
        businessWebsiteClickEventPayload: {
          ...payload,
          sourceURL: this.getSourceURL()
        },
      },
    });
  }

  async trackRestaurantClick(payload: RestaurantClickEventPayload) {
    return await this.trackFonciiEvent({
      event: FonciiEvents.RestaurantClick,
      payload: {
        restaurantClickEventPayload: {
          ...payload,
          sourceURL: this.getSourceURL()
        },
      },
    });
  }

  async trackMapPinClick(payload: MapPinClickEventPayload) {
    return await this.trackFonciiEvent({
      event: FonciiEvents.MapPinClick,
      payload: {
        mapPinClickEventPayload: {
          ...payload
        },
      },
    });
  }

  async trackPostClick(payload: PostClickEventPayload) {
    return await this.trackFonciiEvent({
      event: FonciiEvents.PostClick,
      payload: {
        postClickEventPayload: {
          ...payload,
        },
      },
    });
  }

  async trackSourceLinkClick(payload: PostSourceLinkClickEventPayload) {
    return await this.trackFonciiEvent({
      event: FonciiEvents.PostSourceLinkClick,
      payload: {
        postSourceLinkClickEventPayload: {
          ...payload,
        },
      },
    });
  }

  // Views
  async trackUserGalleryView(payload: UserGalleryViewEventPayload) {
    return await this.trackFonciiEvent({
      event: FonciiEvents.UserGalleryView,
      payload: {
        userGalleryViewEventPayload: {
          ...payload,
          referrer: document.referrer,
        },
      },
    });
  }

  async trackRestaurantView(payload: RestaurantViewEventPayload) {
    return await this.trackFonciiEvent({
      event: FonciiEvents.RestaurantView,
      payload: {
        restaurantViewEventPayload: {
          ...payload,
          referrer: document.referrer,
        },
      },
    });
  }

  async trackPostView(payload: PostViewEventPayload) {
    return await this.trackFonciiEvent({
      event: FonciiEvents.PostView,
      payload: {
        postViewEventPayload: {
          ...payload,
          referrer: document.referrer,
        },
      },
    });
  }

  // Sharing
  async trackShareEvent({
    destination,
    shareEventID,
    shareEventType,
  }: Partial<ShareEventPayload>) {
    // Precondition failure, ensure all required types are defined
    if (!destination || !shareEventID || !shareEventType) return false;

    return await this.trackFonciiEvent({
      event: FonciiEvents.Share,
      payload: {
        shareEventPayload: {
          destination,
          shareEventID,
          shareEventType,
          sourceURL: this.getSourceURL(),
        },
      },
    });
  }
}
