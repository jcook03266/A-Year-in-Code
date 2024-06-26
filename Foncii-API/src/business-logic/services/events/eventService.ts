// Dependencies
// Types
import {
  AggregationSortOrders,
  FonciiDBCollections
} from "../../../types/namespaces/database-api";
import {
  AnalyticsTimespan,
  FMIntegrationProviders,
  FonciiEvents,
  ReservationIntentOutcome,
  ReservationProviders,
  ShareEventType,
  ShareSheetDestination,
} from "../../../types/common";
import { SupportedFonciiPlatforms } from "../../../types/namespaces/microservice-api";

// Models
import PostDeletionEventModel from "../../../models/events/postDeletionEventModel";
import RestaurantSaveEventModel from "../../../models/events/restaurantSaveEventModel";
import PostCreationEventModel from "../../../models/events/postCreationEventModel";
import UserGalleryViewEventModel from "../../../models/events/userGalleryViewEventModel";
import ReservationIntentEventModel from "../../../models/events/reservationIntentEventModel";
import PostViewEventModel from "../../../models/events/postViewEventModel";
import RestaurantViewEventModel from "../../../models/events/restaurantViewEventModel";
import PostClickEventModel from "../../../models/events/postClickEventModel";
import RestaurantClickEventModel from "../../../models/events/restaurantClickEventModel";
import MapPinClickEventModel from "../../../models/events/mapPinClickEventModel";
import PostSourceLinkClickEventModel from "../../../models/events/postSourceLinkClickEventModel";
import ArticlePublicationClickEventModel from "../../../models/events/articlePublicationClickEventModel";
import BusinessWebiteClickEventModel from "../../../models/events/businessWebsiteClickEventModel";
import PostUpdateEventModel from "../../../models/events/postUpdateEventModel";
import UserProfilePictureUpdateEventModel from "../../../models/events/userProfilePictureUpdateEventModel";
import TasteProfileUpdateEventModel from "../../../models/events/tasteProfileUpdateEventModel";
import TasteProfileCreationEventModel from "../../../models/events/tasteProfileCreationEventModel";
import TasteProfileDeletionEventModel from "../../../models/events/tasteProfileDeletionEventModel";
import ShareEventModel from "../../../models/events/shareEventModel";
import ExploreSearchEventModel from "../../../models/events/exploreSearchEventModel";
import UserGallerySearchEventModel from "../../../models/events/userGallerySearchEventModel";
import ReservationSearchEventModel from "../../../models/events/reservationSearchEventModel";

// Services
import { DatabaseServiceAdapter } from "../database/databaseService";

// Utilities
import { UnitsOfTimeInMS } from "../../../foncii-toolkit/utilities/time";

// Local Types
export type FonciiEventSortOptions<T extends FonciiEvent> = {
  [K in keyof Partial<T>]: AggregationSortOrders;
};
export type FonciiEventPropertyOptions<T extends FonciiEvent> = {
  [K in keyof Partial<T>]: any;
};

/**
 * The basis for our event driven architecture. This service resolves
 * incoming event requests and persists the event data to the database
 * and or further resolves the events based on the requirements at hand.
 */
export default class EventService {
  // Services
  private database = new DatabaseServiceAdapter();

  // Properties
  private EVENT_OBSERVATION_LIMITS = {
    [FonciiEvents.POST_VIEW]: {
      eventType: FonciiEvents.USER_GALLERY_VIEW,
      maximumEventFrequency: 5,
      observationPeriod: UnitsOfTimeInMS.day,
    },
    [FonciiEvents.RESTAURANT_VIEW]: {
      eventType: FonciiEvents.USER_GALLERY_VIEW,
      maximumEventFrequency: 5,
      observationPeriod: UnitsOfTimeInMS.day,
    },
  } as { [Event in FonciiEvents]: FonciiEventObservationLimit | undefined };

  // Analytics Queries
  /**
   * Computes a time series for the designated event type where the output is a 
   * time series object containing the corresponding timestamps and data points for the 
   * designated time series category (optional).
   * 
   * @async
   * @param event -> The event to create a time series for
   * @param properties -> Properties to match / filter events by
   * @param categoryName -> Optional category name, used when a single chart is used 
   * to display various categories. Ex.) Reservations chart: Yes, Just Looking, No, has 3 different
   * categories, so this method is used 3x to get data for those 3 time series to combine them into one chart.
   * @param timespan -> How far to offset the observation period start date. Ex.) one week -> 7 days from observation start
   * @param observationStartDate -> When the observation period starts, ex.) today - last week, 04/17/24 -> last week,
   * observation start date is today ~ 04/17/24
   * 
   * @returns -> A time series object containing the corresponding timestamps and data points for the 
   * designated time series category (optional).
   */
  async computeTimeSeriesFor<T extends FonciiEvent>({
    event,
    properties,
    categoryName = "",
    timespan,
    observationStartDate
  }: {
    event: FonciiEvents;
    properties: FonciiEventPropertyOptions<T>;
    categoryName?: string;
    timespan: AnalyticsTimespan;
    observationStartDate: Date;
  }): Promise<AnalyticsTimeSeriesEntry> {
    // Computing
    const observationEndDate =
      EventService.offsetObservationStartDateByTimespan({
        observationStartDate,
        timespan,
      });

    // Dynamic timespan data point labeling
    let timeIntervalRangeUnit:
      | "millisecond"
      | "second"
      | "minute"
      | "hour"
      | "day"
      | "week"
      | "month"
      | "quarter"
      | "year" = "day",
      // Docs: https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateToString/
      groupTimestampFormat = "%Y-%m-%d";

    switch (timespan) {
      // Jump by days when densifying + group by days when grouping by timestamps
      case AnalyticsTimespan.ONE_WEEK:
      case AnalyticsTimespan.TWO_WEEKS:
      case AnalyticsTimespan.ONE_MONTH:
        timeIntervalRangeUnit = "day";
        groupTimestampFormat = "%Y-%m-%d";

        break;
      // Jump by months when densifying + group by months when grouping by timestamps
      case AnalyticsTimespan.SIX_MONTHS:
      case AnalyticsTimespan.ONE_YEAR:
      case AnalyticsTimespan.TWO_YEARS:
        timeIntervalRangeUnit = "month";
        groupTimestampFormat = "%Y-%m";

        break;
    };

    const pipelineStages = [
      // Stage 1: Match any explicit properties + the required timespan and event type to retrieve all required data points
      // to aggregate and group
      {
        $match: {
          eventType: event,
          timestamp: {
            $gte: observationEndDate,
            $lte: observationStartDate,
          },
          ...properties,
        },
      },
      // Stage 2: Create a 'group' timestamp to group all data points that occur during the same block of time together
      // block of time referring to day or week or month or year, based on the format of the timestamp itself and how
      // granular it is.
      {
        $set: {
          groupTimestamp: {
            $dateToString: {
              format: groupTimestampFormat,
              date: "$timestamp",
            },
          },
        },
      },
      // Stage 3: Create a normalized group date to use to sort the data points by, fill in any data gaps, and create
      // a formatted timestamp string with later on.
      {
        $set: {
          normalizedTimestamp: {
            $dateFromString: {
              dateString: "$groupTimestamp",
            },
          },
        },
      },
      // Stage 4: Group each event by its normalized timestamp (mapped to the _id for grouping) + (the timestamps are normalized in order
      // to allow the densify stage to work without creating duplicate documents for existing timestamps since
      // densify looks to match 1:1 with the field it's applied to) and sum up the event's occurrences to compute the event frequency
      {
        $group: {
          _id: "$normalizedTimestamp",
          count: {
            $sum: 1,
          },
        },
      },
      // Stage 5: Fill in the data gaps for time blocks where no events were measured ~ no frequency / data points / documents exist for
      // that block of time therefore the time series will be incomplete due to missing time intervals.
      {
        $densify: {
          field: "_id",
          range: {
            step: 1,
            unit: timeIntervalRangeUnit,
            bounds: [
              observationEndDate,
              observationStartDate,
            ],
          },
        },
      },
      // Stage 6: Fill in the blank time blocks with a count of 0 since no data points exist for it
      {
        $fill: {
          output: {
            count: {
              value: 0,
            },
          },
        },
      }
    ];

    const timeSeries = await this.database
      .resolveGenericAggregationPipelineOn<{
        _id: string // Timestamp of the observation
        count: number
      }>(
        FonciiDBCollections.TrackedEvents,
        pipelineStages
      );

    const timestamps: string[] = [],
      data: number[] = [],
      category = categoryName;

    const timeSeriesEntries: {
      [timestamp: string]: number
    } = {};

    // Deduplicate any duplicate time series entries (duplicates will happen because of the densification stage and also 
    // in the case of leap years and other edge cases, but we can handle them here on the server) by mapping the timestamp to the event count
    timeSeries.map((entry) => {
      // Parsing
      const eventCount = entry.count;

      // Format time stamp to required date format
      let formattedTimestamp = entry._id;

      switch (timespan) {
        case AnalyticsTimespan.ONE_WEEK:
          formattedTimestamp = new Date(formattedTimestamp)
            .toLocaleDateString("en-US", {
              weekday: "short"
            }); // Weekday (e.g., Mon, Tue, Wed...)

          break;
        case AnalyticsTimespan.TWO_WEEKS:
        case AnalyticsTimespan.ONE_MONTH:
          formattedTimestamp = new Date(formattedTimestamp)
            .toLocaleDateString("en-US", {
              month: "2-digit", // Month as two digits (e.g., 04)
              day: "2-digit"    // Day as two digits (e.g., 15)
            }); // Month/Day (e.g., 04/15)

          break;
        case AnalyticsTimespan.SIX_MONTHS:
        case AnalyticsTimespan.ONE_YEAR:
        case AnalyticsTimespan.TWO_YEARS:
          formattedTimestamp = new Date(formattedTimestamp)
            .toLocaleDateString("en-US", {
              month: "2-digit", // Month as two digits (e.g., 04)
              year: "numeric"   // Year as four digits (e.g., 2024)
            }); // Month/Year (e.g., 04/2024)

          break;
      };

      // Aggregation
      const updatedEventCount = (timeSeriesEntries[formattedTimestamp] ?? 0) + eventCount;
      timeSeriesEntries[formattedTimestamp] = updatedEventCount;
    });

    // Aggregate the data and timestamps from each time series entry into their appropriate arrays
    Object.entries(timeSeriesEntries).map(([timestamp, eventCount]) => {
      timestamps.push(timestamp);
      data.push(eventCount);
    });

    return {
      timestamps,
      data,
      category
    };
  }

  /**
  * @async
  * @param event
  * @param sortOrder -> Default is descending (highest to lowest, ex.) most to least viewed experiences)
  * @param limit -> Default is 10 ~ 10 different distributions in one array. Results must be limited
  * @param properties
  * 
  * @returns -> A limited and sorted array of distributions referencing the given event type 
  * and properties.
  */
  async computeEventDistributionGroupedByRestaurantName<T extends FonciiEvent>({
    event,
    limit = 10,
    sortOrder = AggregationSortOrders.descending,
    properties
  }: {
    event: FonciiEvents,
    limit?: number,
    sortOrder?: AggregationSortOrders,
    properties?: FonciiEventPropertyOptions<T>
  }): Promise<AnalyticsDistribution[]> {
    const pipelineStages = [
      // Stage 1: Match on the event type itself
      {
        $match:
        {
          eventType: event,
          ...properties
        },
      },
      // Stage 2: Group by the restaurant id field, fonciiRestaurantID to 
      // accumulate the total event count per restaurant 
      {
        $group:
        {
          _id: "$fonciiRestaurantID",
          count: {
            $sum: 1,
          },
        },
      },
      // Stage 3: Sort by the total count, from highest to lowest
      {
        $sort:
        {
          count: sortOrder
        },
      },
      // Stage 4: Limit the total amount of documents, this will make a lookup / join more performant as less documents 
      // need to be joined with the lookup data
      {
        $limit: limit
      },
      // Stage 5: Join with restaurants collection to project the required data as a category
      {
        $lookup:
        {
          from: FonciiDBCollections.Restaurants,
          localField: "_id",
          foreignField: "id",
          as: "restaurant",
        },
      },
      // Stage 6: Unwind the restaurant array to get the first restaurant document to project
      {
        $unwind:
        {
          path: "$restaurant",
          preserveNullAndEmptyArrays: false,
        },
      },
      // Stage 7: Isolate the required data to project
      {
        $set:
        {
          category: "$restaurant.name",
        }
      },
      // Stage 8: Project the required data
      {
        $project:
        {
          _id: null,
          count: 1,
          category: 1,
        },
      },
    ];

    const distributions = await this.database
      .resolveGenericAggregationPipelineOn<{
        _id: null,
        category: string,
        count: number
      }>(
        FonciiDBCollections.TrackedEvents,
        pipelineStages
      );

    return distributions;
  }

  // Reusable / Modular Methods
  /**
   * @async
   * @param event
   *
   * @returns -> True if the event was resolved successfully, false otherwise.
   */
  private async resolveEvent<T extends FonciiEvent>(
    event: T
  ): Promise<boolean> {
    // Precondition failure
    if (this.shouldEventBeDiscarded(event)) return false;

    // Note: The timestamp is stringified by toObject, this makes it a date object again in order for it to be inserted into the time series collection
    return await this.database.createNewTimeSeriesDocumentWithID(
      FonciiDBCollections.TrackedEvents,
      event.id,
      {
        ...event,
      },
      {
        timestamp: new Date(event.timestamp),
      }
    );
  }

  /**
   * Computes the total frequency of the event's occurrence given some specific properties (if any)
   * over the specified observation time period
   *
   * @async
   * @param eventType -> The specific tracked event to look for
   * @param observationStartDate -> The start of the event observation period / timespan query, ex.) Now
   * @param observationEndDate -> The end of the event observation period / timespan query (must be earlier than the start date)
   * @param properties -> Optional additional properties to provide to narrow down the search
   *
   * @returns -> A number indicating how many times the event specified has been tracked within the target timespan
   */
  async getEventFrequency<T extends FonciiEvent>({
    eventType,
    observationStartDate,
    observationEndDate,
    properties
  }: {
    eventType: FonciiEvents;
    observationStartDate: Date;
    observationEndDate: Date;
    properties?: FonciiEventPropertyOptions<T>;
  }): Promise<number> {
    return await this.database.countTotalDocumentsWithProperties(
      FonciiDBCollections.TrackedEvents,
      {
        timestamp: { $gte: observationEndDate, $lte: observationStartDate },
        eventType,
        ...properties,
      }
    );
  }

  /**
   * Computes the total count / sum of the event's occurrence given some specific properties (if any)
   * for all time.
   *
   * @async
   * @param eventType -> The specific tracked event to look for
   * @param properties -> Optional additional properties to provide to narrow down the search
   *
   * @returns -> A number indicating how many times the event specified has been tracked
   * over the course of all time.
   */
  async getTotalEventCount<T extends FonciiEvent>({
    eventType,
    properties
  }: {
    eventType: FonciiEvents;
    properties?: FonciiEventPropertyOptions<T>;
  }): Promise<number> {
    return await this.database.countTotalDocumentsWithProperties(
      FonciiDBCollections.TrackedEvents,
      {
        eventType,
        ...properties,
      }
    );
  }


  // Flow Control Methods
  /**
   * Observability handler that determines whether or not an event can be observed presently based on an observation
   * limit designated for events of its type (if any exist).
   *
   * @async
   * @param eventType
   * @param properties
   *
   * @returns -> True if the event can be observed (tracked), false if the event can't be tracked (violates
   * some time-based observation limitation set in place to limit event tracking for sensitive business metrics (views on posts or restaurants for instance))
   */
  async isEventCurrentlyObservable<T extends FonciiEvent>({
    eventType,
    properties,
  }: {
    eventType: FonciiEvents;
    properties?: FonciiEventPropertyOptions<T>;
  }): Promise<boolean> {
    const observationLimit = this.EVENT_OBSERVATION_LIMITS[eventType];

    // Precondition failure, event is not limited and be observed at any time
    if (!observationLimit) return true;

    const observationStartDate = new Date(),
      observationEndDate =
        EventService.offsetObservationStartDateByTimespanInMS({
          observationStartDate,
          timespanInMS: observationLimit.observationPeriod,
        });

    const eventFrequency = await this.getEventFrequency({
      eventType,
      observationStartDate,
      observationEndDate,
      properties,
    });

    return eventFrequency < observationLimit.maximumEventFrequency;
  }

  /**
   * Determines if an event actually counts (an event must originate from a
   * valid user or session ID).
   *
   * @param userID
   * @param sessionID
   *
   * @returns -> True if the event shouldn't be tracked (discarded), false otherwise.
   */
  shouldEventBeDiscarded({
    userID,
    sessionID,
  }: {
    userID?: string;
    sessionID?: string;
  }) {
    return !userID && !sessionID;
  }

  // Unique Methods
  async resolveExploreSearchEvent(args: {
    userID?: string;
    query: string;
    searchLocation: CoordinatePoint;
    zoomLevel: number;
    clientLocation?: CoordinatePoint;
    tags: string[];
    cuisines: string[];
    prices: number[];
    isManualSearch: boolean;
    partySize: number;
    reservationDate: string;
    sourceURL: string;
    candidateIDs: string[];
    autoCompleteSuggestions: string[];
    averagePercentMatchScore?: number;
    averageQualityScore: number;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new ExploreSearchEventModel(args).toObject<ExploreSearchEvent>()
    );
  }

  async resolveUserGallerySearchEvent(args: {
    userID?: string;
    authorUID: string;
    query: string;
    searchLocation: CoordinatePoint;
    zoomLevel: number;
    clientLocation?: CoordinatePoint;
    tags: string[];
    cuisines: string[];
    prices: number[];
    partySize: number;
    reservationDate: string;
    sourceURL: string;
    candidateIDs: string[];
    autoCompleteSuggestions: string[];
    averagePercentMatchScore?: number;
    averageQualityScore: number;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new UserGallerySearchEventModel(args).toObject<UserGallerySearchEvent>()
    );
  }

  async resolveReservationSearchEvent(args: {
    userID?: string;
    fonciiRestaurantID: string;
    authorID?: string;
    clientLocation?: CoordinatePoint;
    partySize: number;
    reservationDate: string;
    sourceURL: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new ReservationSearchEventModel(args).toObject<ReservationSearchEvent>()
    );
  }

  /**
   * @async
   * @param userID -> User ID of the user who performed the event
   * @param sessionID
   *
   * @returns -> True if the event was resolved successfully, false otherwise
   */
  async resolvePostCreationEvent(args: {
    userID: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new PostCreationEventModel(args).toObject<PostCreationEvent>()
    );
  }

  /**
   * @async
   * @param userID -> User ID of the user who performed the event
   * @param userPostData -> The latest user post data to keep a record of
   * @param sessionID
   *
   * @returns -> True if the event was resolved successfully, false otherwise
   */
  async resolvePostUpdateEvent(args: {
    userID: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new PostUpdateEventModel(args).toObject<PostUpdateEvent>()
    );
  }

  /**
   * @async
   * @param userID -> User ID of the user who performed the event
   * @param userPostData -> A copy of the user post data that was deleted
   * @param sessionID
   *
   * @returns -> True if the event was resolved successfully, false otherwise
   */
  async resolvePostDeletionEvent(args: {
    userID: string;
    userPostData: FMUserPost;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new PostDeletionEventModel(args).toObject<PostDeletionEvent>()
    );
  }

  /**
   * @async
   * @param userID -> User ID of the user who performed the event
   * @param tasteProfileData -> A copy of the user's taste profile data that was created
   * @param sessionID
   *
   * @returns -> True if the event was resolved successfully, false otherwise
   */
  async resolveTasteProfileCreationEvent(args: {
    userID: string;
    tasteProfileData: TasteProfile;
    autoGenerated: boolean;
    isDefault: boolean;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new TasteProfileCreationEventModel(
        args
      ).toObject<TasteProfileCreationEvent>()
    );
  }

  /**
   * @async
   * @param userID -> User ID of the user who performed the event
   * @param tasteProfileData -> A copy of the user's taste profile data that was updated
   * @param sessionID
   *
   * @returns -> True if the event was resolved successfully, false otherwise
   */
  async resolveTasteProfileUpdateEvent(args: {
    userID: string;
    tasteProfileData: TasteProfile;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new TasteProfileUpdateEventModel(args).toObject<TasteProfileUpdateEvent>()
    );
  }

  /**
   * @async
   * @param userID -> User ID of the user who performed the event
   * @param tasteProfileData -> A copy of the user's taste profile data that was deleted
   * @param sessionID
   *
   * @returns -> True if the event was resolved successfully, false otherwise
   */
  async resolveTasteProfileDeletionEvent(args: {
    userID: string;
    tasteProfileData: TasteProfile;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new TasteProfileDeletionEventModel(
        args
      ).toObject<TasteProfileDeletionEvent>()
    );
  }

  /**
   * @async
   * @param saved -> True if the post was saved, false otherwise (unsaved)
   * @param userID -> User ID of the user who performed the event
   * @param fonciiRestaurantID
   * @param postID -> Optional post ID used when the restaurant was saved via a user post
   * @param sessionID
   *
   * @returns -> True if the event was resolved successfully, false otherwise
   */
  async resolveRestaurantSaveEvent(args: {
    userID: string;
    saved: boolean;
    fonciiRestaurantID: string;
    postID?: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new RestaurantSaveEventModel(args).toObject<RestaurantSaveEvent>()
    );
  }

  async resolveReservationIntentEvent(args: {
    userID?: string;
    outcome: ReservationIntentOutcome;
    venueID: string;
    authorUID?: string
    postID?: string;
    fonciiRestaurantID: string;
    percentMatchScore?: number;
    qualityScore: number;
    timeSlot: string;
    reservationDate: string;
    provider: ReservationProviders;
    externalURL: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new ReservationIntentEventModel(args).toObject<ReservationIntentEvent>()
    );
  }

  /**
   * Note: Users can view a user gallery an unlimited amount of times, this metric isn't
   * limited like posts or restaurant views which are direct conversions.
   *
   * @async
   * @param userID -> User ID of the user who performed the event
   * @param authorUID
   * @param userSimilarityScore
   * @param shareEventID
   * @param referrer
   * @param sessionID
   *
   * @returns -> True if the event was resolved successfully, false otherwise
   */
  async resolveUserGalleryViewEvent(args: {
    userID?: string;
    authorUID: string;
    userSimilarityScore?: number;
    shareEventID?: string;
    referrer?: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new UserGalleryViewEventModel(args).toObject<UserGalleryViewEvent>()
    );
  }

  /**
   * @async
   * @param userID -> User ID of the user who performed the event
   * @param postID
   * @param percentMatchScore
   * @param qualityScore
   * @param shareEventID
   * @param referrer
   * @param sessionID
   *
   * @returns -> True if the event was resolved successfully, false otherwise
   */
  async resolvePostViewEvent(args: {
    userID?: string;
    postID: string;
    authorUID: string;
    fonciiRestaurantID: string;
    percentMatchScore?: number;
    qualityScore: number;
    shareEventID?: string;
    referrer?: string;
    sessionID?: string;
  }): Promise<boolean> {
    // Properties
    const { userID, postID, sessionID } = args,
      identifiedUser = { userID },
      userSession = { sessionID },
      // Match post ID + identified user or user session
      orConditionalProperties = { postID, $or: [identifiedUser, userSession] };

    const canEventBeTracked =
      await this.isEventCurrentlyObservable<PostViewEvent>({
        eventType: FonciiEvents.POST_VIEW,
        properties: orConditionalProperties as any,
      });

    // Acting user has reached observation period limit, subsequent events won't count until the observation window slides forward
    if (!canEventBeTracked) return false;

    return await this.resolveEvent(
      new PostViewEventModel(args).toObject<PostViewEvent>()
    );
  }

  /**
   * @async
   * @param userID -> User ID of the user who performed the event
   * @param percentMatchScore
   * @param qualityScore
   * @param shareEventID
   * @param referrer
   * @param sessionID
   *
   * @returns -> True if the event was resolved successfully, false otherwise
   */
  async resolveRestaurantViewEvent(args: {
    userID?: string;
    fonciiRestaurantID: string;
    percentMatchScore?: number;
    qualityScore: number;
    shareEventID?: string;
    referrer?: string;
    sessionID?: string;
  }): Promise<boolean> {
    // Properties
    const { userID, sessionID, fonciiRestaurantID } = args,
      identifiedUser = { userID },
      userSession = { sessionID },
      // Match restaurant ID + identified user or user session
      orConditionalProperties = {
        fonciiRestaurantID,
        $or: [identifiedUser, userSession],
      };

    const canEventBeTracked =
      await this.isEventCurrentlyObservable<RestaurantViewEvent>({
        eventType: FonciiEvents.RESTAURANT_VIEW,
        properties: orConditionalProperties as any,
      });

    // Acting user has reached observation period limit, subsequent events won't count until the observation window slides forward
    if (!canEventBeTracked) return false;

    return await this.resolveEvent(
      new RestaurantViewEventModel(args).toObject<RestaurantViewEvent>()
    );
  }

  async resolveUserProfilePictureUpdateEvent(args: {
    userID: string;
    platform: SupportedFonciiPlatforms;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new UserProfilePictureUpdateEventModel(
        args
      ).toObject<UserProfilePictureUpdateEvent>()
    );
  }

  async resolvePostClickEvent(args: {
    userID?: string;
    postID: string;
    authorUID: string;
    fonciiRestaurantID: string;
    percentMatchScore?: number;
    qualityScore: number;
    sourcePostID?: string;
    sourceFonciiRestaurantID?: string;
    sourceURL?: string;
    autoCompleteQuery?: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new PostClickEventModel(args).toObject<PostClickEvent>()
    );
  }

  async resolveRestaurantClickEvent(args: {
    userID?: string;
    fonciiRestaurantID: string;
    percentMatchScore?: number;
    qualityScore: number;
    sourcePostID?: string;
    sourceFonciiRestaurantID?: string;
    sourceURL?: string;
    autoCompleteQuery?: string;
    queryID?: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new RestaurantClickEventModel(args).toObject<RestaurantClickEvent>()
    );
  }

  async resolveMapPinClickEvent(args: {
    userID?: string;
    fonciiRestaurantID: string;
    postID?: string;
    authorUID?: string;
    percentMatchScore?: number;
    qualityScore: number;
    sourceURL: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new MapPinClickEventModel(args).toObject<MapPinClickEvent>()
    );
  }

  async resolvePostSourceLinkClickEvent(args: {
    userID?: string;
    fonciiRestaurantID: string;
    postID: string;
    authorUID: string;
    percentMatchScore?: number;
    qualityScore: number;
    sourceURL: string;
    destinationURL: string;
    destinationPlatform: FMIntegrationProviders;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new PostSourceLinkClickEventModel(
        args
      ).toObject<PostSourceLinkClickEvent>()
    );
  }

  async resolveArticlePublicationClickEvent(args: {
    userID?: string;
    fonciiRestaurantID: string;
    postID?: string;
    authorUID?: string;
    percentMatchScore?: number;
    qualityScore: number;
    sourceURL: string;
    destinationURL: string;
    publication: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new ArticlePublicationClickEventModel(
        args
      ).toObject<ArticlePublicationClickEvent>()
    );
  }

  async resolveBusinessWebsiteClickEvent(args: {
    userID?: string;
    fonciiRestaurantID: string;
    postID?: string;
    authorUID?: string;
    percentMatchScore?: number;
    qualityScore: number;
    sourceURL: string;
    destinationURL: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new BusinessWebiteClickEventModel(
        args
      ).toObject<ArticlePublicationClickEvent>()
    );
  }

  async resolveShareEvent(args: {
    userID?: string;
    shareEventID: string;
    shareEventType: ShareEventType;
    destination: ShareSheetDestination;
    sourceURL: string;
    sessionID?: string;
  }): Promise<boolean> {
    return await this.resolveEvent(
      new ShareEventModel(args).toObject<ShareEvent>()
    );
  }

  // Helper Methods
  /**
   * Computes the relative change of the event frequency over the timespan
   * enumerated by the start and end observation dates as an integer. This is
   * not the percent change, this the total change (curr - prev), to get the percent change this
   * value must be divided by the prev total.
   * Ex.) 100 | Today till last week -> 60 | Last week till 2 weeks ago => 100 - 60 = +40 relative change
   *
   * @async
   * @param eventType -> The specific tracked event to look for
   * @param observationStartDate -> The start of the event observation period / timespan query, ex.) Now
   * @param observationEndDate -> The end of the event observation period / timespan query (must be earlier than the start date)
   * @param properties -> Optional additional properties to provide to narrow down the search
   *
   * @returns -> The relative change of the event frequency over the timespan
   * enumerated by the start and end observation dates as an integer. This is
   * not the percent change, this the total change (curr - prev), to get the percent change this
   * value must be divided by the prev total.
   *
   */
  async computeRelativeChangeOfEventFrequency<T extends FonciiEvent>({
    eventType,
    observationStartDate,
    observationEndDate,
    properties,
  }: {
    eventType: FonciiEvents;
    observationStartDate: Date;
    observationEndDate: Date;
    properties?: FonciiEventPropertyOptions<T>;
  }): Promise<number> {
    // Computing time difference
    const timeDiffInMS =
      observationStartDate.getTime() - observationEndDate.getTime(),
      prevObservationStartDate = observationEndDate,
      prevObservationEndDate =
        EventService.offsetObservationStartDateByTimespanInMS({
          observationStartDate: prevObservationStartDate,
          timespanInMS: timeDiffInMS,
        });

    // Promises
    const currentEventFrequencyPromise = this.getEventFrequency<T>({
      eventType,
      observationStartDate,
      observationEndDate,
      properties,
    }),
      prevEventFrequencyPromise = this.getEventFrequency<T>({
        eventType,
        observationStartDate: prevObservationStartDate,
        observationEndDate: prevObservationEndDate,
        properties,
      });

    // Promise Resolution
    const [currentEventFrequency, prevEventFrequency] = await Promise.all([
      currentEventFrequencyPromise,
      prevEventFrequencyPromise,
    ]);

    // Ex.) 100 | Today till last week -> 60 | Last week till 2 weeks ago => 100 - 60 = +40 relative change
    return currentEventFrequency - prevEventFrequency;
  }

  /**
   * Computes the end date of an observation period by offsetting the observation
   * start date by the required amount;
   *
   * @param observationStartDate -> The date to start observations from, ex.) Now, and the end date will be some time in the past
   * @param timespan -> The timespan to offset the start date by, ex.) One week
   *
   * @returns -> The observation end date ~ the observation start date offset by the specified
   * timespan.
   */
  static offsetObservationStartDateByTimespan({
    observationStartDate,
    timespan,
  }: {
    observationStartDate: Date;
    timespan: AnalyticsTimespan;
  }): Date {
    let timespanInMS = 0;

    switch (timespan) {
      case AnalyticsTimespan.ONE_WEEK:
        timespanInMS = UnitsOfTimeInMS.week;
        break;
      case AnalyticsTimespan.TWO_WEEKS:
        timespanInMS = UnitsOfTimeInMS.week * 2;
        break;
      case AnalyticsTimespan.ONE_MONTH:
        timespanInMS = UnitsOfTimeInMS.month;
        break;
      case AnalyticsTimespan.SIX_MONTHS:
        timespanInMS = UnitsOfTimeInMS.month * 6;
        break;
      case AnalyticsTimespan.ONE_YEAR:
        timespanInMS = UnitsOfTimeInMS.year;
        break;
      case AnalyticsTimespan.TWO_YEARS:
        timespanInMS = UnitsOfTimeInMS.year * 2;
        break;
    }

    // Subtract timespan from observation start date to get the observation end date
    // ex.) Now -> Last week = Now - UnitsOfTimeInMS.week
    const observationEndDateInMS =
      EventService.offsetObservationStartDateByTimespanInMS({
        observationStartDate,
        timespanInMS,
      }),
      observationEndDate = new Date(observationEndDateInMS);

    return observationEndDate;
  }

  static offsetObservationStartDateByTimespanInMS({
    observationStartDate,
    timespanInMS,
  }: {
    observationStartDate: Date;
    timespanInMS: number;
  }): Date {
    // Subtract timespan from observation start date to get the observation end date
    // ex.) Now -> Last week = Now - UnitsOfTimeInMS.week
    const observationEndDateInMS =
      observationStartDate.getTime() - timespanInMS,
      observationEndDate = new Date(observationEndDateInMS);

    return observationEndDate;
  }
}
