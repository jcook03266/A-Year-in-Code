// Dependencies
// Types
import {
  AnalyticsTimespan,
  FonciiBizEvents,
  FonciiEvents,
  ReservationIntentOutcome,
} from "../../../../../../types/common";
import { ServerContext } from "../../../../../../types/namespaces/gql-server-api";

// Services
import EventService from "../../../../../../business-logic/services/events/eventService";
import FonciiMapsPostService from "../../../../../../business-logic/services/foncii-maps/user-posts/fmPostService";

// Error Coding
import ErrorCodeDispatcher from "../../../../../../core-foncii/error-coding/errorCodeDispatcher";

// Shared
import { UserAPIMiddleware } from "../../users/resolvers/userResolvers";

// Service Definitions
const eventService = () => new EventService(),
  postService = () => new FonciiMapsPostService();

// Local Types
interface UserAnalyticsDashboardInput {
  userID: string;
  timespan: AnalyticsTimespan;
}

type FonciiAnalyticsEventPayload = {
  exploreSearchEventPayload: ExploreSearchEvent;
  userGallerySearchEventPayload: UserGallerySearchEvent;
  reservationSearchEventPayload: ReservationSearchEvent;
  reservationIntentEventPayload: ReservationIntentEvent;
  userGalleryViewEventPayload: UserGalleryViewEvent;
  postViewEventPayload: PostViewEvent;
  restaurantViewEventPayload: RestaurantViewEvent;
  postClickEventPayload: PostClickEvent;
  restaurantClickEventPayload: RestaurantClickEvent;
  mapPinClickEventPayload: MapPinClickEvent;
  postSourceLinkClickEventPayload: PostSourceLinkClickEvent;
  articlePublicationClickEventPayload: ArticlePublicationClickEvent;
  businessWebsiteClickEventPayload: BusinessWebsiteClickEvent;
  shareEventPayload: ShareEvent;
};

type FonciiBizAnalyticsEventPayloads = {};

interface FonciiAnalyticsEventInput {
  userID?: string;
  timestamp: string;
  event: FonciiEvents;
  payload: FonciiAnalyticsEventPayload;
}

interface FonciiBizAnalyticsEventInput {
  userID?: string;
  timestamp: string;
  event: FonciiBizEvents;
  payload: FonciiBizAnalyticsEventPayloads;
}

const resolvers = {
  // Enums - Important: Make sure enums match the Foncii-API type definition documentation in common.ts,
  // that's the single source of truth.
  FonciiEvents: {
    EXPLORE_SEARCH: "EXPLORE_SEARCH",
    USER_GALLERY_SEARCH: "USER_GALLERY_SEARCH",
    RESERVATION_SEARCH: "RESERVATION_SEARCH",
    RESERVATION_INTENT: "RESERVATION_INTENT",
    BUSINESS_WEBSITE_CLICK: "BUSINESS_WEBSITE_CLICK",
    RESTAURANT_CLICK: "RESTAURANT_CLICK",
    POST_CLICK: "POST_CLICK",
    MAP_PIN_CLICK: "MAP_PIN_CLICK",
    POST_SOURCE_LINK_CLICK: "POST_SOURCE_LINK_CLICK",
    ARTICLE_PUBLICATION_CLICK: "ARTICLE_PUBLICATION_CLICK",
    USER_GALLERY_VIEW: "USER_GALLERY_VIEW",
    POST_VIEW: "POST_VIEW",
    RESTAURANT_VIEW: "RESTAURANT_VIEW",
    TASTE_PROFILE_CREATION: "TASTE_PROFILE_CREATION",
    TASTE_PROFILE_UPDATE: "TASTE_PROFILE_UPDATE",
    TASTE_PROFILE_DELETION: "TASTE_PROFILE_DELETION",
    USER_PROFILE_PICTURE_UPDATE: "USER_PROFILE_PICTURE_UPDATE",
    POST_CREATION: "POST_CREATION",
    POST_UPDATE: "POST_UPDATE",
    POST_DELETION: "POST_DELETION",
    SAVED_RESTAURANT: "SAVED_RESTAURANT",
    UNSAVED_RESTAURANT: "UNSAVED_RESTAURANT",
    SHARE: "SHARE"
  },

  FonciiBizEvents: {
    PLACEHOLDER: "PLACEHOLDER",
  },

  ShareEventType: {
    USER_GALLERY: 0,
    RESTAURANT: 1,
    USER_POST: 2,
    REFERRAL: 3,
  },

  ShareSheetDestination: {
    CLIPBOARD: 0,
    REDDIT: 1,
    TWITTER: 2,
    FACEBOOK: 3,
    WHATSAPP: 4,
    LINKEDIN: 5,
    SYSTEM: 6,
  },

  ReservationIntentOutcome: {
    CONFIRMED: 0,
    PASSIVE: 1,
    FAILED: 2
  },

  AnalyticsTimespan: {
    ONE_WEEK: "ONE_WEEK",
    TWO_WEEKS: "TWO_WEEKS",
    ONE_MONTH: "ONE_MONTH",
    SIX_MONTHS: "SIX_MONTHS",
    ONE_YEAR: "ONE_YEAR",
    TWO_YEARS: "TWO_YEARS"
  },

  Query: {
    async fetchUserMapAnalyticsDashboard(
      _: any,
      args: { input: UserAnalyticsDashboardInput },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      // Parsing
      const { userID, timespan } = args.input;

      // Limits
      // Limits the distribution array to 3 possible distributions to display on the client
      const MAX_DISTRIBUTION_LIMIT = 3;

      // Properties
      // Observation Period
      const observationStartDate = new Date(),
        observationEndDate = EventService.offsetObservationStartDateByTimespan({
          observationStartDate,
          timespan
        });

      // Map Views
      let totalMapViews = 0,
        relativeMapViewChange = 0,
        mapViewsTimeSeries: AnalyticsTimeSeriesEntry[] = [],
        mapViewsTimeSeriesEntry: AnalyticsTimeSeriesEntry;

      // Tags
      let totalTags = 0,
        topTagsDistribution: AnalyticsDistribution[] = [];

      // Locations
      let totalLocations = 0,
        topLocationsDistribution: AnalyticsDistribution[] = [];

      let totalExperienceViews = 0,
        mostViewedExperienceDistribution: AnalyticsDistribution[] = [];

      // Promises
      const totalMapViewsPromise = eventService()
        .getEventFrequency<UserGalleryViewEvent>({
          eventType: FonciiEvents.USER_GALLERY_VIEW,
          observationStartDate,
          observationEndDate,
          properties: {
            authorUID: userID
          }
        }),
        relativeMapViewChangePromise = eventService()
          .computeRelativeChangeOfEventFrequency<UserGalleryViewEvent>({
            eventType: FonciiEvents.USER_GALLERY_VIEW,
            observationStartDate,
            observationEndDate,
            properties: {
              authorUID: userID
            }
          }),
        mapViewsTimeSeriesEntryPromise = eventService()
          .computeTimeSeriesFor<UserGalleryViewEvent>({
            event: FonciiEvents.USER_GALLERY_VIEW,
            timespan,
            properties: {
              authorUID: userID,
            },
            observationStartDate
          }),
        totalTagsPromise = postService()
          .countTotalUniqueTagsByUser(userID),
        topTagsDistributionPromise = postService()
          .fetchTopTagDistribution({ userID, limit: MAX_DISTRIBUTION_LIMIT }),
        totalLocationsPromise = postService()
          .countTotalPostsWithProperties({
            userID,
            fonciiRestaurantID: { $exists: true }
          }),
        topLocationsDistributionPromise = postService()
          .fetchTopExperienceLocationsDistribution({ userID, limit: MAX_DISTRIBUTION_LIMIT }),
        totalExperienceViewsPromise = eventService()
          .getTotalEventCount<PostViewEvent>({
            eventType: FonciiEvents.POST_VIEW,

            properties: {
              authorUID: userID
            }
          }),
        mostViewedExperienceDistributionPromise = eventService()
          .computeEventDistributionGroupedByRestaurantName<PostViewEvent>({
            event: FonciiEvents.POST_VIEW,
            properties: {
              authorUID: userID
            },
            limit: MAX_DISTRIBUTION_LIMIT
          });

      // Promise Resolution
      [
        totalMapViews,
        relativeMapViewChange,
        mapViewsTimeSeriesEntry,
        totalTags,
        topTagsDistribution,
        totalLocations,
        topLocationsDistribution,
        totalExperienceViews,
        mostViewedExperienceDistribution
      ] = await Promise.all([
        totalMapViewsPromise,
        relativeMapViewChangePromise,
        mapViewsTimeSeriesEntryPromise,
        totalTagsPromise,
        topTagsDistributionPromise,
        totalLocationsPromise,
        topLocationsDistributionPromise,
        totalExperienceViewsPromise,
        mostViewedExperienceDistributionPromise
      ]);

      // Accumulate time series entries
      mapViewsTimeSeries.push(mapViewsTimeSeriesEntry);

      return {
        totalMapViews,
        relativeMapViewChange,
        mapViewsTimeSeries,
        totalTags,
        topTagsDistribution,
        totalLocations,
        topLocationsDistribution,
        totalExperienceViews,
        mostViewedExperienceDistribution
      };
    },

    async fetchUserBusinessWebsiteAnalyticsDashboard(
      _: any,
      args: { input: UserAnalyticsDashboardInput },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      // Parsing
      const { userID, timespan } = args.input;

      // Limits
      // Limits the distribution array to 3 possible distributions to display on the client
      const MAX_DISTRIBUTION_LIMIT = 3;

      // Properties
      // Observation Period
      const observationStartDate = new Date(),
        observationEndDate = EventService.offsetObservationStartDateByTimespan({
          observationStartDate,
          timespan
        });

      // Business Website Clicks
      let totalBusinessWebsiteClicks = 0,
        relativeBusinessWebsiteClicksChange = 0,
        businessWebsiteClicksTimeSeries: AnalyticsTimeSeriesEntry[] = [],
        businessWebsiteClicksTimeSeriesEntry: AnalyticsTimeSeriesEntry,
        mostClickedBusinessWebsitesDistribution: AnalyticsDistribution[] = [];

      // Promises
      const totalBusinessWebsiteClicksPromise = eventService()
        .getEventFrequency<BusinessWebsiteClickEvent>({
          eventType: FonciiEvents.BUSINESS_WEBSITE_CLICK,
          observationStartDate,
          observationEndDate,
          properties: {
            authorUID: userID
          }
        }),
        relativeBusinessWebsiteClicksChangePromise = eventService()
          .computeRelativeChangeOfEventFrequency<BusinessWebsiteClickEvent>({
            eventType: FonciiEvents.BUSINESS_WEBSITE_CLICK,
            observationStartDate,
            observationEndDate,
            properties: {
              authorUID: userID
            }
          }),
        businessWebsiteClicksTimeSeriesEntryPromise = eventService()
          .computeTimeSeriesFor<BusinessWebsiteClickEvent>({
            event: FonciiEvents.BUSINESS_WEBSITE_CLICK,
            timespan,
            properties: {
              authorUID: userID
            },
            observationStartDate
          }),
        mostClickedBusinessWebsitesDistributionPromise = eventService()
          .computeEventDistributionGroupedByRestaurantName<BusinessWebsiteClickEvent>({
            event: FonciiEvents.BUSINESS_WEBSITE_CLICK,
            properties: {
              authorUID: userID
            },
            limit: MAX_DISTRIBUTION_LIMIT
          });

      // Promise Resolution
      [
        totalBusinessWebsiteClicks,
        relativeBusinessWebsiteClicksChange,
        businessWebsiteClicksTimeSeriesEntry,
        mostClickedBusinessWebsitesDistribution
      ] = await Promise.all([
        totalBusinessWebsiteClicksPromise,
        relativeBusinessWebsiteClicksChangePromise,
        businessWebsiteClicksTimeSeriesEntryPromise,
        mostClickedBusinessWebsitesDistributionPromise
      ]);

      // Accumulate time series entries
      businessWebsiteClicksTimeSeries.push(businessWebsiteClicksTimeSeriesEntry);

      return {
        totalBusinessWebsiteClicks,
        relativeBusinessWebsiteClicksChange,
        businessWebsiteClicksTimeSeries,
        mostClickedBusinessWebsitesDistribution
      };
    },

    async fetchUserReservationsIntentsAnalyticsDashboard(
      _: any,
      args: { input: UserAnalyticsDashboardInput },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      // Parsing
      const { userID, timespan } = args.input;

      // Limits
      // Limits the distribution array to 3 possible distributions to display on the client
      const MAX_DISTRIBUTION_LIMIT = 3;

      // Properties
      // Observation Period
      const observationStartDate = new Date(),
        observationEndDate = EventService.offsetObservationStartDateByTimespan({
          observationStartDate,
          timespan
        });

      // Business Website Clicks
      let totalReservationIntents = 0,
        relativeReservationIntentsChange = 0,
        reservationIntentsTimeSeries: AnalyticsTimeSeriesEntry[] = [],
        reservationIntentsTimeSeriesYes: AnalyticsTimeSeriesEntry,
        reservationIntentsTimeSeriesJustLooking: AnalyticsTimeSeriesEntry,
        reservationIntentsTimeSeriesNo: AnalyticsTimeSeriesEntry,
        topReservedRestaurantsDistribution: AnalyticsDistribution[] = [];

      // Promises
      const totalReservationIntentsPromise = eventService()
        .getEventFrequency<ReservationIntentEvent>({
          eventType: FonciiEvents.RESERVATION_INTENT,
          observationStartDate,
          observationEndDate,
          properties: {
            authorUID: userID
          }
        }),
        relativeReservationIntentsChangePromise = eventService()
          .computeRelativeChangeOfEventFrequency<ReservationIntentEvent>({
            eventType: FonciiEvents.RESERVATION_INTENT,
            observationStartDate,
            observationEndDate,
            properties: {
              authorUID: userID
            }
          }),
        reservationIntentsTimeSeriesYesPromise = eventService()
          .computeTimeSeriesFor<ReservationIntentEvent>({
            event: FonciiEvents.RESERVATION_INTENT,
            timespan,
            properties: {
              authorUID: userID,
              outcome: ReservationIntentOutcome.confirmed
            },
            observationStartDate
          }),
        reservationIntentsTimeSeriesJustLookingPromise = eventService()
          .computeTimeSeriesFor<ReservationIntentEvent>({
            event: FonciiEvents.RESERVATION_INTENT,
            timespan,
            properties: {
              authorUID: userID,
              outcome: ReservationIntentOutcome.passive
            },
            observationStartDate
          }),
        reservationIntentsTimeSeriesNoPromise = eventService()
          .computeTimeSeriesFor<ReservationIntentEvent>({
            event: FonciiEvents.RESERVATION_INTENT,
            timespan,
            properties: {
              authorUID: userID,
              outcome: ReservationIntentOutcome.failed
            },
            observationStartDate
          }),
        topReservedRestaurantsDistributionPromise = eventService()
          .computeEventDistributionGroupedByRestaurantName<ReservationIntentEvent>({
            event: FonciiEvents.RESERVATION_INTENT,
            properties: {
              authorUID: userID
            },
            limit: MAX_DISTRIBUTION_LIMIT
          });

      // Promise Resolution
      [
        totalReservationIntents,
        relativeReservationIntentsChange,
        reservationIntentsTimeSeriesYes,
        reservationIntentsTimeSeriesJustLooking,
        reservationIntentsTimeSeriesNo,
        topReservedRestaurantsDistribution
      ] = await Promise.all([
        totalReservationIntentsPromise,
        relativeReservationIntentsChangePromise,
        reservationIntentsTimeSeriesYesPromise,
        reservationIntentsTimeSeriesJustLookingPromise,
        reservationIntentsTimeSeriesNoPromise,
        topReservedRestaurantsDistributionPromise
      ]);

      // Join all time series entries together to display 3 possible categories
      // inside 1 chart
      reservationIntentsTimeSeries.push(
        reservationIntentsTimeSeriesYes,
        reservationIntentsTimeSeriesJustLooking,
        reservationIntentsTimeSeriesNo
      );

      return {
        totalReservationIntents,
        relativeReservationIntentsChange,
        reservationIntentsTimeSeries,
        topReservedRestaurantsDistribution
      };
    },
  },

  Mutation: {
    async trackFonciiEvent(
      _: any,
      args: { input: FonciiAnalyticsEventInput },
      context: ServerContext
    ) {
      const { userID, event, payload } = args.input,
        sessionID = context.requesterSessionID;

      // Verify events from registered user accounts are actually coming from those accounts
      if (userID)
        UserAPIMiddleware.userAuthorizationGateway({ userID, context });

      // Event handlers
      switch (event) {
        case FonciiEvents.EXPLORE_SEARCH:
          return await eventService().resolveExploreSearchEvent({
            userID,
            sessionID,
            ...payload.exploreSearchEventPayload,
          });

        case FonciiEvents.USER_GALLERY_SEARCH:
          return await eventService().resolveUserGallerySearchEvent({
            userID,
            sessionID,
            ...payload.userGallerySearchEventPayload,
          });

        case FonciiEvents.RESERVATION_SEARCH:
          return await eventService().resolveReservationSearchEvent({
            userID,
            sessionID,
            ...payload.reservationSearchEventPayload,
          });

        case FonciiEvents.RESERVATION_INTENT:
          return await eventService().resolveReservationIntentEvent({
            userID,
            sessionID,
            ...payload.reservationIntentEventPayload,
          });

        case FonciiEvents.USER_GALLERY_VIEW:
          return await eventService().resolveUserGalleryViewEvent({
            userID,
            sessionID,
            ...payload.userGalleryViewEventPayload,
          });

        case FonciiEvents.POST_VIEW:
          return await eventService().resolvePostViewEvent({
            userID,
            sessionID,
            ...payload.postViewEventPayload,
          });

        case FonciiEvents.RESTAURANT_VIEW:
          return await eventService().resolveRestaurantViewEvent({
            userID,
            sessionID,
            ...payload.restaurantViewEventPayload,
          });

        case FonciiEvents.POST_CLICK:
          return await eventService().resolvePostClickEvent({
            userID,
            sessionID,
            ...payload.postClickEventPayload,
          });

        case FonciiEvents.RESTAURANT_CLICK:
          return await eventService().resolveRestaurantClickEvent({
            userID,
            sessionID,
            ...payload.restaurantClickEventPayload,
          });

        case FonciiEvents.MAP_PIN_CLICK:
          return await eventService().resolveMapPinClickEvent({
            userID,
            sessionID,
            ...payload.mapPinClickEventPayload,
          });

        case FonciiEvents.POST_SOURCE_LINK_CLICK:
          return await eventService().resolvePostSourceLinkClickEvent({
            userID,
            sessionID,
            ...payload.postSourceLinkClickEventPayload,
          });

        case FonciiEvents.ARTICLE_PUBLICATION_CLICK:
          return await eventService().resolveArticlePublicationClickEvent({
            userID,
            sessionID,
            ...payload.articlePublicationClickEventPayload,
          });

        case FonciiEvents.BUSINESS_WEBSITE_CLICK:
          return await eventService().resolveBusinessWebsiteClickEvent({
            userID,
            sessionID,
            ...payload.businessWebsiteClickEventPayload,
          });

        case FonciiEvents.SHARE:
          return await eventService().resolveShareEvent({
            userID,
            sessionID,
            ...payload.shareEventPayload,
          });

        default:
          ErrorCodeDispatcher.throwGraphQLError(
            ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST.toString(),
            `This event type is not supported: ${event}`,
            ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
          );

          // Event tracking request not fulfilled | won't be triggered, the error dispatcher will throw
          return false;
      }
    },

    async trackFonciiBizEvent(
      _: any,
      args: { input: FonciiBizAnalyticsEventInput },
      context: ServerContext
    ) {
      // Not yet implemented, throw an error
      ErrorCodeDispatcher.throwGraphQLError(
        ErrorCodeDispatcher.HTTPStatusCodes.FORBIDDEN.toString(),
        `This operation is forbidden.`,
        ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
      );
    },
  },
};

export default resolvers;
