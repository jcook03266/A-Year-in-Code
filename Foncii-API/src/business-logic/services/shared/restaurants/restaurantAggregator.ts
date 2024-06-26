// Dependencies
// Inheritance
import PerformanceObserverable from "../../../../core-foncii/protocols/performanceObservable";

// Types
import { Google, Yelp } from "../../../../types/namespaces/third-party-api";
import { WeekDays } from "../../../../types/common";

// Models
import RestaurantModel from "../../../../models/shared/restaurantModel";

// Services
import RestaurantService from "./restaurantService";

// Third Party API
import YelpService from "../../third-party-api/place-information/yelpAPIService";
import GooglePlacesService from "../../third-party-api/place-information/googleAPIService";

// Logging
import logger from "../../../../foncii-toolkit/debugging/debugLogger";

// Utilities
import { deduplicateArray } from "../../../../foncii-toolkit/math/commonMath";
import { currentDateAsISOString } from "../../../../foncii-toolkit/utilities/convenienceUtilities";

/**
 * Service layer that aggregates high level restaurant place data from Google
 * and Yelp.
 */
export default class RestaurantAggregator extends PerformanceObserverable {
  // Properties
  googlePlacesService: GooglePlacesService = new GooglePlacesService();
  yelpService: YelpService = new YelpService();
  restaurantService: RestaurantService = new RestaurantService();

  // Performance Metrics
  private PerformanceMetricKeys = {
    // Functions
    ARA: {
      // aggregateRestaurantsAround
      // Async Tasks
      fetchBusinessesAround: "fetchBusinessesAround",
      getPlaceIDFromTextAndLocation: "getPlaceIDFromTextAndLocation",
      findRestaurantWithGoogleID: "findRestaurantWithGoogleID",
      googlePlacePromises: "googlePlacePromises",
      aggregateRestaurantsAroundLoop: "aggregateRestaurantsAroundLoop",
    },
  };

  constructor() {
    super({});
  }

  /**
   * Geospatial aggregation pipeline
   *
   * @async
   * @param coordinatePoint
   *
   * @returns -> An array of unique fetched (and updated if needed) or newly provisioned Foncii restaurants
   * sourced from around the given coordinate point.
   */
  async aggregateRestaurantsAround(
    coordinatePoint: CoordinatePoint
  ): Promise<Restaurant[]> {
    // Local Metrics Logging
    // The number of restaurants that couldn't be aggregated (missed due to missing Google data)
    let missedRestaurants: number = 0;

    logger.info(`[aggregateRestaurantsAround] Aggregation Started\n`);

    /// New / updated restaurants to push to the database in a batch write operation
    const aggregatedRestaurants: Restaurant[] = [],
      staleExistingRestaurantsToUpdate: Restaurant[] = [],
      freshExistingRestaurants: Restaurant[] = [];

    // Yelp Geospatial Business Search
    const yelpBusinessSearchResults = await this.measurePerformance(
      this.PerformanceMetricKeys.ARA.fetchBusinessesAround,
      () => this.yelpService.fetchBusinessesAround(coordinatePoint)
    );

    // Guard: Return if no search results found
    if (!yelpBusinessSearchResults || yelpBusinessSearchResults.length == 0) {
      logger.warn(`Restaurant Aggregation Failed. No results found for search area: ${coordinatePoint}`);
      return aggregatedRestaurants;
    }

    await this.measurePerformance(
      this.PerformanceMetricKeys.ARA.aggregateRestaurantsAroundLoop,
      () =>
        Promise.all(
          yelpBusinessSearchResults.map(async (yelpBusinessSearchResult) => {
            const businessName = yelpBusinessSearchResult.name,
              address = yelpBusinessSearchResult.location.display_address.join(" "),
              coordinatePoint: CoordinatePoint = {
                lat: yelpBusinessSearchResult.coordinates.latitude,
                lng: yelpBusinessSearchResult.coordinates.longitude,
              };

            // Find this business' data twin in Google's places database (if any), using the name and address of the current yelp business.
            const googlePlaceID = await this.measurePerformance(
              this.PerformanceMetricKeys.ARA.getPlaceIDFromTextAndLocation,
              () =>
                this.googlePlacesService.getPlaceIDFromTextAndLocation(
                  businessName,
                  address,
                  coordinatePoint
                )
            );

            // Guard: Throw out aggregation if no Google Place ID found for this business, Google is our data anchor so any result excluding this mandatory information is incomplete.
            if (!googlePlaceID) {
              logger.warn(
                `No Google Place ID found for restaurant: ${businessName} at address: ${address} at coordinates: ${coordinatePoint}. Tossing out incomplete aggregation.`
              );
              missedRestaurants++;

              return;
            }

            // Fetch any existing restaurant data using the Google Place ID since all Foncii Restaurants are anchored to Google's data
            const foundFonciiRestaurant = await this.measurePerformance(
              this.PerformanceMetricKeys.ARA.findRestaurantWithGoogleID,
              () => this.restaurantService.findRestaurantWithGoogleID(googlePlaceID)
            ),
              restaurantAlreadyAggregated = foundFonciiRestaurant != null,
              restaurantDataStale = foundFonciiRestaurant
                ? RestaurantModel.isRestaurantDataStale(
                  foundFonciiRestaurant.staleDate
                )
                : false;

            /**
             * If a restaurant already exists then use its existing data, and if the existing restaurant's data is fresh
             * then use it and jump forward, else if the data is stale then update it following this conditional branch.
             */
            if (restaurantAlreadyAggregated && !restaurantDataStale) {
              freshExistingRestaurants.push(foundFonciiRestaurant);
              return;
            }

            // Get detailed information about this restaurant from Google
            const googlePlacePromises = [
              this.googlePlacesService.getAddressComponents(googlePlaceID),
              this.googlePlacesService.getPlaceDetails(googlePlaceID)
            ],
              [googleAddressComponents, detailedGoogleRestaurantMatch] =
                await this.measurePerformance(
                  this.PerformanceMetricKeys.ARA.googlePlacePromises,
                  () => Promise.all(googlePlacePromises)
                );

            // Guard: If the restaurant has no high level data then skip it
            if (
              detailedGoogleRestaurantMatch == undefined ||
              googleAddressComponents == undefined
            ) {
              logger.warn(
                `No detailed Google places data match found for restaurant: ${businessName} at address: ${address} at coordinates: ${coordinatePoint}. Tossing out incomplete aggregation.`
              );
              missedRestaurants++;
              return;
            }

            const yelpDataStub = this.parseYelpDataIntoStub(yelpBusinessSearchResult),
              googleDataStub = this.parseGoogleDataIntoStub(
                googleAddressComponents as Google.ParsedAddressComponentAttributes,
                detailedGoogleRestaurantMatch as Partial<Google.ParsedPlaceDetails>,
                googlePlaceID
              );

            // Merge both data stubs into a single restaurant data frame
            const mergedRestaurantDataFrame = Object.assign(
              {},
              yelpDataStub,
              googleDataStub
            );

            // If the restaurant is missing its hero image for some reason, fill in the gap with the google data stub
            if (!mergedRestaurantDataFrame.heroImageURL) {
              // Select a donor hero image URL from the parsed google image collection.
              // If no hero image is found, then manually add a photo to the restaurant later on to maintain data integrity and quality.
              const imageCollectionURLs =
                mergedRestaurantDataFrame.imageCollectionURLs ?? [],
                selectedHeroImageURL = imageCollectionURLs[0];

              mergedRestaurantDataFrame.heroImageURL = selectedHeroImageURL;

              // Log lack of hero Image for metrics and move on
              if (selectedHeroImageURL == undefined) {
                logger.warn(
                  `[aggregateRestaurantsAround] No hero image found for restaurant with Google Place ID: ${googlePlaceID}. Manually adding a photo will be necessary.`
                );
              }
            }

            /// Create a new restaurant data model and append it to the restaurants array
            // Persist the restaurant's id and, creation date, these are static properties and shouldn't be altered when updating it
            const aggregatedFonciiRestaurant = RestaurantModel.fromObject({
              ...mergedRestaurantDataFrame,
              id: foundFonciiRestaurant?.id, // Overwrite id and creation date with their persistent values from the existing restaurant (if any)
              creationDate: foundFonciiRestaurant?.creationDate,
              priceLevel: googleDataStub.priceLevel ?? yelpDataStub.priceLevel // In case Yelp has the missing price level, set it here
            }),
              compiledFonciiRestaurantData: RestaurantModel | undefined =
                aggregatedFonciiRestaurant?.toObject();

            // Push the new / updated restaurant data to the appropriate queues to be pushed to the database with
            if (compiledFonciiRestaurantData) {
              // Generate embedding for restaurant | Vector Search
              compiledFonciiRestaurantData.collective_embedding =
                await compiledFonciiRestaurantData.generateEmbedding();

              restaurantAlreadyAggregated
                ? staleExistingRestaurantsToUpdate.push(
                  compiledFonciiRestaurantData
                )
                : aggregatedRestaurants.push(compiledFonciiRestaurantData);
            } else {
              // Very unlikely to occur, but still good to catch incase anything in the instance implementation breaks.
              logger.error(
                `[aggregateRestaurantsAround][toObject] Error: Failed to compile Foncii restaurant data for restaurant: ${businessName} at address: ${address} at coordinates: ${coordinatePoint}. Tossing out failed aggregation.`
              );
              missedRestaurants++;
            }
          })
        )
    );

    // Create new documents for the aggregated restaurants
    if (aggregatedRestaurants.length > 0) {
      this.restaurantService.createRestaurants(aggregatedRestaurants);
    }

    // Update existing document data for the stale restaurants
    if (staleExistingRestaurantsToUpdate.length > 0) {
      this.restaurantService.bulkUpdateRestaurants(
        staleExistingRestaurantsToUpdate
      );
    }

    // Metrics Logging
    logger.info(`[aggregateRestaurantsAround] Aggregation Finished\n`);
    logger.info(`[aggregateRestaurantsAround] Metrics\n`);
    // Averages
    this.logAverageDurationOfTasks([
      this.PerformanceMetricKeys.ARA.findRestaurantWithGoogleID,
      this.PerformanceMetricKeys.ARA.getPlaceIDFromTextAndLocation,
      this.PerformanceMetricKeys.ARA.googlePlacePromises,
    ]);

    // Totals
    this.logTotalDurationOfTasks([
      this.PerformanceMetricKeys.ARA.findRestaurantWithGoogleID,
      this.PerformanceMetricKeys.ARA.getPlaceIDFromTextAndLocation,
      this.PerformanceMetricKeys.ARA.googlePlacePromises,
    ]);

    // Latest / Most Recent
    this.logLatestDurationOfTasks([
      this.PerformanceMetricKeys.ARA.aggregateRestaurantsAroundLoop,
      this.PerformanceMetricKeys.ARA.fetchBusinessesAround,
    ]);

    console.table({
      targetCoordinates: coordinatePoint,
      totalResponseTime: this.getLatestDurationOfTask(this.PerformanceMetricKeys.ARA.aggregateRestaurantsAroundLoop),
      missedRestaurants,
      freshExistingRestaurantsFound: freshExistingRestaurants.length,
      staleRestaurantsUpdated: staleExistingRestaurantsToUpdate.length,
      newRestaurantsCreated: aggregatedRestaurants.length,
      totalRestaurantsFound:
        aggregatedRestaurants.length +
        staleExistingRestaurantsToUpdate.length +
        freshExistingRestaurants.length,
      totalRestaurantsAggregated:
        aggregatedRestaurants.length + staleExistingRestaurantsToUpdate.length,
      totalRestaurantsFetched:
        staleExistingRestaurantsToUpdate.length +
        freshExistingRestaurants.length,
      ratioOfNewRestaurantsCreatedToTotalFetched: (
        aggregatedRestaurants.length /
        (aggregatedRestaurants.length +
          staleExistingRestaurantsToUpdate.length +
          freshExistingRestaurants.length)
      ).toFixed(2),
      timeStamp: currentDateAsISOString(),
    });

    // Concatenate and deduplicate the various pools of restaurant data into one to return to the client
    return deduplicateArray([
      ...aggregatedRestaurants,
      ...staleExistingRestaurantsToUpdate,
      ...freshExistingRestaurants,
    ]);
  }

  // Data Parsing Methods
  /**
   * Parses the passed Yelp Business data points into the required components
   * to be used in the Foncii Restaurant data model, including the hero image and
   * categories which are sourced from Yelp in the search aggregation pipeline due to Yelp being
   * the discovery data anchor, thus we know it will always be defined. Google on the other
   * hand is our primary data anchor, and if no matching Google Place data is found then the entire
   * aggregation result is thrown out.
   *
   * @param yelpBusinessSearchResult
   *
   * @returns -> Partial Foncii restaurant data frame fulfilled by Yelp's
   * data points.
   */
  parseYelpDataIntoStub(
    yelpBusinessSearchResult: Yelp.Business | undefined
  ): Partial<Restaurant> {
    // Yelp data is optional when aggregating outside of the geospatial pipeline so an empty object works.
    if (!yelpBusinessSearchResult) return {};

    const parsedCategories = yelpBusinessSearchResult.categories?.map(
      (category) => {
        // Creates categories based only on their titles rather than aliases for simplicity.
        return category.title;
      }
    );

    return {
      yelpID: yelpBusinessSearchResult.id,
      priceLevel: RestaurantModel.convertDollarSignPriceLevelToNumeric(
        yelpBusinessSearchResult.price
      ) as PriceLevels,
      heroImageURL: yelpBusinessSearchResult.image_url,
      yelpProperties: {
        rating: yelpBusinessSearchResult.rating,
        externalURL: yelpBusinessSearchResult.url,
      },
      categories: parsedCategories
    };
  }

  /**
   * Parses the passed Google Place data points into the appropriate components
   * to be used in the Foncii Restaurant data model.
   *
   * @param googleAddressComponents
   * @param detailedGoogleRestaurantMatch
   * @param googlePlaceID
   *
   * @returns -> Partial Foncii restaurant data frame fulfilled by Google's
   * data points.
   */
  parseGoogleDataIntoStub(
    googleAddressComponents: Google.ParsedAddressComponentAttributes,
    detailedGoogleRestaurantMatch: Partial<Google.ParsedPlaceDetails>,
    googlePlaceID: string
  ): Partial<Restaurant> {
    // Parse Operating Hours
    const openingHours = detailedGoogleRestaurantMatch.openingHours;
    let operatingHours: OperatingHours | undefined = {} as OperatingHours,
      parsedOperatingHours: OperatingHours = {} as OperatingHours;

    /// Parses operating hours by: transforming 'Monday: 11:30 AM – 12:00 AM' -> { Monday : "11:30 AM - 12:00 AM" }
    if (openingHours) {
      openingHours.map((operatingHoursInterval) => {
        // Iterate through the week days until the current week day in the 'operatingHoursInterval' string is found.
        for (let weekDay of Object.values(WeekDays)) {
          // Map the current week day key to its operating hours string from 'operatingHoursInterval'
          if (operatingHoursInterval.includes(weekDay)) {
            // Remove the day from the time interval string: Monday: 11:30 AM – 12:00 AM -> 11:30 AM – 12:00 AM
            const trimmedOperatingHoursInterval =
              operatingHoursInterval.substring(
                operatingHoursInterval.indexOf(":") + 1
              );

            // { Monday : "11:30 AM - 12:00 AM" }
            parsedOperatingHours[weekDay] = trimmedOperatingHoursInterval;
          }
        }
      });

      operatingHours = parsedOperatingHours;
    }

    // Determine whether or not the restaurant serves alcohol
    const servesBeer = detailedGoogleRestaurantMatch.servesBeer,
      servesWine = detailedGoogleRestaurantMatch.servesWine,
      restaurantServesAlcohol = servesBeer || servesWine;

    return {
      name: detailedGoogleRestaurantMatch.name,
      googleID: googlePlaceID,
      googleProperties: {
        rating: detailedGoogleRestaurantMatch.rating ?? 0,
      },
      coordinates: {
        lat: googleAddressComponents.geometry.location.lat,
        lng: googleAddressComponents.geometry.location.lng,
      },
      addressProperties: {
        neighborhood: googleAddressComponents.neighborhood,
        city: googleAddressComponents.city,
        countryCode: googleAddressComponents.country,
        stateCode: googleAddressComponents.state,
        streetAddress: googleAddressComponents.streetAddress,
        zipCode: googleAddressComponents.postalCode,
        formattedAddress: googleAddressComponents.formattedAddress
      },
      description: detailedGoogleRestaurantMatch.editorialSummary,
      imageCollectionURLs: detailedGoogleRestaurantMatch.photos,
      website: detailedGoogleRestaurantMatch.website,
      reservable: detailedGoogleRestaurantMatch.reservable,
      phoneNumber: detailedGoogleRestaurantMatch.internationalPhoneNumber,
      staleDate: RestaurantModel.generateNewStaleDate(),
      priceLevel: detailedGoogleRestaurantMatch.priceLevel as PriceLevels,
      servesAlcohol: restaurantServesAlcohol,
      operatingHours: operatingHours,
      utcOffset: detailedGoogleRestaurantMatch.utc_offset
        ? Number(detailedGoogleRestaurantMatch.utc_offset) ?? undefined
        : undefined
    };
  }

  /**
   * Google Place ID restaurant aggregation pipeline. Finds and aggregates restaurant data from Google and Yelp
   * (if available), and combines both into high level Foncii restaurant data to be pushed to the database
   * (if needed) and returned to the caller.
   *
   * Note: This method will exclude Yelp data if the data cannot be found as Google is the primary
   * data anchor. The hero image will be sourced from Google if Yelp isn't available. Sourcing the hero
   * image from Yelp is simpler and more reliable versus parsing from a collection of available
   * images in the case of Google, which is why we use it in the geospatial aggregation pipeline.
   *
   * @async
   * @param userID -> The user ID of the user that is requesting the restaurant data
   * @param googlePlaceID -> The google place ID of the restaurant to be aggregated, usually obtained from Google Autocomplete in the Foncii Maps client or App
   * @param forceUpdate -> Optional special flag used to force update a restaurant when it's not stale
   *
   * @returns -> Fetched (and updated if needed) or newly provisioned Foncii restaurant data (if the
   * google place ID passed is valid), or undefined if some error occurs while provisioning the data
   * or if the passed google place ID is invalid.
   */
  async aggregateRestaurant(
    googlePlaceID: string,
    forceUpdate: boolean = false
  ): Promise<Restaurant | undefined> {
    // Query database to see if the restaurant exists on our servers before proceeding
    const foundFonciiRestaurant =
      await this.restaurantService.findRestaurantWithGoogleID(googlePlaceID),
      restaurantAlreadyAggregated = foundFonciiRestaurant != null,
      restaurantDataStale = foundFonciiRestaurant
        ? RestaurantModel.isRestaurantDataStale(foundFonciiRestaurant.staleDate)
        : false;

    // Operation success flag
    let didSucceed = false;

    /**
     * If a restaurant already exists then use its existing data, and if the existing restaurant's data is fresh
     * then use it and jump forward, else if the data is stale then update it following this conditional branch.
     */
    if (restaurantAlreadyAggregated && !restaurantDataStale && !forceUpdate) {
      return foundFonciiRestaurant;
    }

    // Restaurant doesn't exist or is stale and needs to be updated
    // Get detailed information about this restaurant from Google and or Yelp (if available)
    const promises = [
      this.googlePlacesService.getAddressComponents(googlePlaceID),
      this.googlePlacesService.getPlaceDetails(googlePlaceID),
      this.yelpService.findYelpMatchWithGooglePlaceID(googlePlaceID),
    ],
      [
        googleAddressComponents,
        detailedGoogleRestaurantMatch,
        yelpBusiness
      ] = await Promise.all(promises);

    // If no match is found or the data is incomplete then return undefined
    if (!detailedGoogleRestaurantMatch || !googleAddressComponents) {
      return undefined;
    }

    // Parsed yelp business data (if any)
    const yelpID = yelpBusiness
      ? (yelpBusiness as Yelp.Business).id
      : undefined,
      yelpData = yelpID
        ? await this.yelpService.findYelpBusinessByID(yelpID)
        : undefined;

    // Merge both data stubs into a single restaurant data frame
    const mergedRestaurantDataFrame = Object.assign(
      {},
      this.parseYelpDataIntoStub(yelpData),
      this.parseGoogleDataIntoStub(
        googleAddressComponents as Google.ParsedAddressComponentAttributes,
        detailedGoogleRestaurantMatch as Partial<Google.ParsedPlaceDetails>,
        googlePlaceID
      )
    ) as Restaurant;

    // If the yelp data is undefined or if the restaurant is missing its hero image for some reason, fill in the minor gaps with the google data stub
    if (!yelpData || !mergedRestaurantDataFrame.heroImageURL) {
      // Select a donor hero image URL from the parsed google image collection.
      // If no hero image is found, then manually add a photo to the restaurant later on to maintain data integrity and quality.
      const imageCollectionURLs = mergedRestaurantDataFrame.imageCollectionURLs,
        selectedHeroImageURL = imageCollectionURLs?.[0];

      mergedRestaurantDataFrame.heroImageURL = selectedHeroImageURL;

      // Log lack of hero Image for metrics and move on
      if (selectedHeroImageURL == undefined) {
        logger.warn(
          `[aggregateRestaurant] No hero image found for restaurant with Google Place ID: ${googlePlaceID}. Manually adding a photo will be necessary.`
        );
      }
    }

    // Create a new restaurant data model and append it to the restaurants array
    // Persist the restaurant's id and, creation date, these are static properties and shouldn't be altered when updating it
    const aggregatedFonciiRestaurant = RestaurantModel.fromObject({
      ...mergedRestaurantDataFrame,
      id: foundFonciiRestaurant?.id, // Overwrite id and creation date with their persistent values from the existing restaurant (if any)
      creationDate: foundFonciiRestaurant?.creationDate,
    }),
      compiledFonciiRestaurantData: Restaurant | undefined =
        aggregatedFonciiRestaurant?.toObject();

    // Update the database with the new / updated aggregated restaurant data.
    if (compiledFonciiRestaurantData && aggregatedFonciiRestaurant) {
      const fonciiRestaurantID = compiledFonciiRestaurantData.id;

      // Generate embedding for restaurant | Vector Search
      compiledFonciiRestaurantData.collective_embedding =
        await aggregatedFonciiRestaurant.generateEmbedding();

      // Logging
      restaurantAlreadyAggregated
        ? logger.info(
          `[aggregateRestaurant] Restaurant: ${fonciiRestaurantID} Updated`
        )
        : logger.info(
          `[aggregateRestaurant] Restaurant: ${fonciiRestaurantID} Created`
        );

      didSucceed = restaurantAlreadyAggregated
        ? await this.restaurantService.updateRestaurant(
          fonciiRestaurantID,
          compiledFonciiRestaurantData
        )
        : (await this.restaurantService.createRestaurant(
          compiledFonciiRestaurantData
        )) != null;
    } else {
      // Very unlikely to occur, but still good to catch incase anything in the instance implementation breaks.
      logger.error(
        `[aggregateRestaurant][toObject] Error: Failed to compile Foncii restaurant data for restaurant. Tossing out failed aggregation.`
      );
    }

    return didSucceed ? compiledFonciiRestaurantData : undefined;
  }

  // Restaurant Reviews //
  /**
   * Fetches and parses the yelp reviews for the given Yelp Business ID.
   *
   * @async
   * @param {String} yelpID
   *
   * @returns -> An array of reviews mapped to a specific key value pair to make transporting and parsing them simpler.
   */
  async getYelpReviewsForRestaurant(
    yelpID?: string
  ): Promise<RestaurantReview[]> {
    // Precondition failure
    if (!yelpID) return [];

    const rawReviews = (await this.yelpService.getYelpReviewsForBusiness(yelpID)) ?? [],
      parsedReviews: RestaurantReview[] = [];

    rawReviews.map((rawReview) => {
      const isReviewEmpty = rawReview.text == "";

      // Only acknowledge and push non-empty reviews
      if (!isReviewEmpty) {
        parsedReviews.push({
          text: rawReview.text,
        });
      }
    });

    return parsedReviews;
  }

  /**
   * Fetches and parses the google reviews for the given Google Place ID.
   *
   * @async
   * @param googleID
   *
   * @returns -> An array of reviews mapped to a specific key value pair to make transporting and parsing them simpler.
   */
  async getGoogleReviewsForRestaurant(
    googleID: string
  ): Promise<RestaurantReview[]> {
    const response = await this.googlePlacesService
      .getGoogleReviewsForBusiness(googleID),
      rawReviews = response ? response.reviews ?? [] : [],
      parsedReviews: RestaurantReview[] = [];

    rawReviews.map((rawReview) => {
      const text = rawReview.text.trim();

      // Only acknowledge and push non-empty reviews
      if (text) {
        parsedReviews.push({ text });
      }
    });

    return parsedReviews;
  }
}
