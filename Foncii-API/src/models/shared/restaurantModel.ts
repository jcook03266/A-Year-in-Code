// Dependencies
// Inheritance
import UpdatableModel from "./protocols/updatableModel";

// Categorical Data Managers
import CuisineManager from "../../business-logic/managers/static-resources/cuisine-manager/cuisineManager";
import DietaryRestrictionManager from "../../business-logic/managers/static-resources/dietaryRestrictionManager";
import { SupportedCuisines } from "../../business-logic/managers/static-resources/cuisine-manager/cuisines";

// Services
import { CachedRestaurantComputationsService } from "../../core-foncii/microservices/sentimentAnalysisMicroservice";
import { DatabaseServiceAdapter } from "../../business-logic/services/database/databaseService";
import FonciiMapsPostService from "../../business-logic/services/foncii-maps/user-posts/fmPostService";

// Utilities
import {
  currentDateAsMSTime,
  dateToISOString,
  getMSTimeFromDateString,
} from "../../foncii-toolkit/utilities/convenienceUtilities";
import { clampNumber } from "../../foncii-toolkit/math/commonMath";
import { sha256Hash } from "../../foncii-toolkit/utilities/security";

/**
 * A high level restaurant data model used to store restaurant data aggregated from
 * google and yelp, as well as custom attributes specific to the Foncii platform.
 */
export default class RestaurantModel
  extends UpdatableModel
  implements Restaurant, Objectable<Restaurant>
{
  // Constants
  static PriceLevelNumericRange = { max: 4, min: 0 }; // Note: 0 ~ Free for Google, but usually the accepted price levels are from 1 - 4 dollar signs, 0 can also indicate a missing value for the price field
  static RatingNumericRange = { max: 5, min: 1 }; // Google and Yelp use 1 - 5 star ratings, and we also do so as well, this is the expected range for all user ratings external and internal

  // Properties
  id; // -> Document Identifier
  yelpID; // -> Optional
  googleID; // -> Required | Aggregation Data Anchor
  name; // -> Required
  heroImageURL; // Optional but mandatory, required to display on the client side. Optional because some restaurants lack Yelp data + Google image collections, so we really can't source anything for them unless manually done.
  imageCollectionURLs; // Empty array if nothing is provided
  description; // Optional because not every restaurant has a google editorial summary
  categories; // -> Cuisines, Meal Types etc, optional, but resolves to an empty array to simplify handling on the client-side
  priceLevel; // Optional, but can be resolved to .none to simplify handling on the client-side
  phoneNumber; // Optional, some places don't provide this info.
  operatingHours; // Optional, not available in some foreign countries sometimes.
  reservable; // -> Tells us whether or not this restaurant can be reserved
  website; // -> Optional
  servesAlcohol; // Optional, resolves to false by default if not provided
  /** Clean and decodable representation of this place's physical location. Sent back to the client */
  coordinates; // Mandatory
  /** Used specifically for geospatial queries, and not easily parsed, so don't send this back to the client */
  location;
  addressProperties;
  googleProperties;
  yelpProperties; // -> Optional since Yelp data can be undefined
  utcOffset; // Optional, some places may not have this attribute specified, in minutes
  staleDate; // Computed when first instantiated and updated during the staleness detection process

  /** Optional computed embedding encoded by the server when the restaurant is aggregated/updated and stored in the database for vector search */
  collective_embedding?: number[];

  /**
   * Note: Since generating embeddings for restaurants is an async process, if no embedding is passed, it's not
   * automatically generated here at the constructor. Please generate it when creating the restaurant via the aggregator
   * and or when updating it, also via the aggregator.
   */
  constructor({
    id,
    yelpID,
    googleID,
    name,
    heroImageURL,
    imageCollectionURLs,
    description,
    categories,
    priceLevel,
    phoneNumber,
    operatingHours,
    reservable,
    website,
    servesAlcohol,
    coordinates,
    addressProperties,
    googleProperties,
    yelpProperties,
    utcOffset,
    creationDate,
    lastUpdated,
    staleDate,
    collective_embedding,
  }: Partial<Restaurant>) {
    super({ creationDate, lastUpdated });

    // Restaurant Properties
    this.id = id ?? this.generateRestaurantUID(googleID);
    this.yelpID = yelpID;
    this.googleID = googleID!;
    this.name = name!;
    this.heroImageURL = heroImageURL;
    this.imageCollectionURLs = imageCollectionURLs ?? [];
    this.description = description;
    this.categories = categories ?? [];
    this.priceLevel = priceLevel ?? 0; // If no price level then none (0 aka free / undetermined) is the default, this N/A on the client side
    this.phoneNumber = phoneNumber;
    this.operatingHours = operatingHours;
    this.reservable = reservable ?? false; // Default is false if not specified.
    this.website = website;
    this.servesAlcohol = servesAlcohol ?? false; // Default is false if not specified.
    this.coordinates = coordinates!;
    this.location = this.#generateGeoJSONPoint(); // This is a complex computed field so it really shouldn't be passed in via args.
    this.addressProperties = addressProperties!;
    this.googleProperties = googleProperties!;
    this.yelpProperties = yelpProperties;
    this.utcOffset = utcOffset;
    this.staleDate = staleDate ?? RestaurantModel.generateNewStaleDate();
    this.collective_embedding = collective_embedding;
  }

  // Restaurant Embedding Generation | Machine Learning Techniques
  async generateEmbedding() {
    // Computed
    // Recompute and cache restaurant review average sentiment analysis scores, invalidating any previous cache
    const restaurantReviewSentimentComputation =
      await new CachedRestaurantComputationsService().computeAndSetAvgRestaurantReviewSentimentScores(
        {
          restaurantID: this.id,
          yelpID: this.yelpID,
          googleID: this.googleID
        }
      ),
      yelpAverageReviewSentimentScore =
        restaurantReviewSentimentComputation?.yelpAvgReviewSentimentScore,
      googleAverageReviewSentimentScore =
        restaurantReviewSentimentComputation?.googleAvgReviewSentimentScore,
      articleAverageSentimentScore = undefined, // Computed from the aggregated articles | 0 if no articles are available | not factored into the algo for now
      fonciiMapsRating =
        (await new FonciiMapsPostService().computeAverageFonciiRatingForRestaurant(
          this.id
        )) ?? 0; // Computed from Foncii Maps Posts | 0 if no posts are available | not factored into the algo for now

    // Numeric feature averaging to mitigate feature overdominance in the case of optionally missing values such as yelp ratings etc
    const sentimentScores = [
      yelpAverageReviewSentimentScore,
      googleAverageReviewSentimentScore,
      articleAverageSentimentScore
    ].filter(Boolean) as number[],
      averageSentimentScore =
        sentimentScores.reduce((accumulator, score) => {
          return accumulator + score;
        }, 0) / Math.max(sentimentScores.length, 1),
      ratings = [
        this.yelpProperties?.rating,
        this.googleProperties?.rating,
        fonciiMapsRating,
      ].filter(Boolean) as number[],
      averageRating =
        ratings.reduce((accumulator, rating) => {
          return accumulator + rating;
        }, 0) / Math.max(ratings.length, 1);

    // Features to include in the embedding
    const numericFeatures = [
      this.priceLevel,
      this.reservable ? 1 : 0,
      this.servesAlcohol ? 1 : 0,
      this.description != undefined ? 1 : 0, // Indicates whether a restaurant has a description / Google editorial
      this.heroImageURL != undefined ? 1 : 0, // Images indicate a standard quality restaurant
      this.imageCollectionURLs.length > 0 ? 1 : 0, // A collection of images and other information is vital to the quality of an establishment
      this.website != undefined ? 1 : 0, // Indicates whether a restaurant has a website. This can be important for users who prefer to view menus or make reservations online.
      averageSentimentScore,
      averageRating,
    ];

    const categoricalFeatures = [this.categories],
      // Fill the array for the one-hot encoded categorical features
      supportedCuisinesFeatureDimension =
        Object.values(SupportedCuisines).length,
      supportedDietaryRestrictionsFeatureDimension = Object.values(
        DietaryRestrictionManager.SupportedDietaryRestrictions
      ).length,
      categoricalFeaturesVectorDimension =
        supportedCuisinesFeatureDimension +
        supportedDietaryRestrictionsFeatureDimension,
      categoricalFeaturesVector = new Array(
        categoricalFeaturesVectorDimension
      ).fill(0);

    // One-hot encoding
    // Read more here: https://www.geeksforgeeks.org/ml-one-hot-encoding-of-datasets-in-python/
    categoricalFeatures[0].forEach((category) => {
      const closestCuisineID =
        CuisineManager.findClosestSupportedCuisineForAlias(category),
        closestDietaryRestrictionID =
          DietaryRestrictionManager.findClosestSupportedDietaryRestrictionForAlias(
            category
          );

      // Cuisine Matching
      if (closestCuisineID) {
        const index = Number(closestCuisineID) + 0; // The zero is symbolic, just showing that the cuisines go first before dietary restrictions

        // Index is valid and within the supported bounds, encode the feature at that index
        if (index != undefined && index < supportedCuisinesFeatureDimension)
          categoricalFeaturesVector[index] = 1;
      }

      // Dietary restriction Matching
      if (closestDietaryRestrictionID) {
        const index =
          Number(closestDietaryRestrictionID) +
          supportedCuisinesFeatureDimension; // Dietary restrictions are offset by cuisines

        // Index is valid and within the supported bounds, encode the feature at that index
        if (
          index != undefined &&
          index < supportedDietaryRestrictionsFeatureDimension
        )
          categoricalFeaturesVector[index] = 1;
      }
    });

    // Optionally, normalize the features to a common scale (e.g., [0, 1])
    const normalizedNumericFeatures = numericFeatures.map((feature) => {
      // Default to 0 if the feature is undefined for some reason, i.e the price level which is missing sometimes
      return feature ?? 0;
    });

    // Concatenating all feature vectors (numeric and categorical)
    return [...normalizedNumericFeatures, ...categoricalFeaturesVector];
  }

  // Helpers
  static convertDollarSignPriceLevelToNumeric(
    dollarSignPriceLevel: string
  ): number {
    return clampNumber(
      dollarSignPriceLevel?.length ?? 0,
      this.PriceLevelNumericRange.min,
      this.PriceLevelNumericRange.max
    );
  }

  // Dynamic Data Generation Methods
  /**
   * Generates a unique and optionally deterministic Foncii restaurant uid
   * 
   * @param googlePlaceID -> [Optional] GPID to create a deterministic UID from. This will further prevent any duplicates
         * from arising upon insertion of restaurants into the database. If not provided a random hex UID is generated.
   * 
   * @returns -> A Foncii restaurant specific unique identifier string, prefixed with the 'FNCII' substring identifier
   */
  generateRestaurantUID(googlePlaceID?: string): string {
    const restaurantIdentifierPrefix = "FNCII",
      uid = googlePlaceID ? sha256Hash(googlePlaceID) : DatabaseServiceAdapter.generateUUIDHexString(),
      restaurantID = restaurantIdentifierPrefix + uid;

    return restaurantID;
  }

  /**
   * Creates a GeoJSON point object with the restaurant's coordinates.
   *
   * @returns -> A GeoJSON point object representing the restaurant's coordinates
   * in the expected [lng, lat] GeoJSON format required to conduct geospatial queries
   * with.
   */
  #generateGeoJSONPoint(): GeoJSONPoint {
    return {
      type: "Point",
      coordinates: [this.coordinates.lng, this.coordinates.lat],
    };
  }

  // Staleness Methods
  /**
   * Creates a new stale / expiration date for a restaurant's data
   * The expiration date is `three months` from the given date respectively. This
   * offset is completely subjective and can be changed as needed.
   *
   * @returns -> The future date when this restaurant's data needs to be refreshed,
   * offset by the specified amount as an ISO string;
   */
  static generateNewStaleDate(): string {
    const monthOffset = 3,
      date = new Date();

    const staleDate = new Date(
      date.getFullYear(),
      date.getMonth() + monthOffset,
      date.getDate()
    );

    return dateToISOString(staleDate);
  }

  /**
   * Determines if the given stale date is older than the current date
   * The input is an ISO-8601 formatted date string.
   *
   * @param staleDate
   *
   * @returns -> True if the stale date is older (less than or equal to) than or equal to the current date,
   * false otherwise.
   */
  static isRestaurantDataStale(staleDateString: string): boolean {
    return currentDateAsMSTime() >= getMSTimeFromDateString(staleDateString);
  }

  /**
   * @returns An object converted from JSON format representing
   * the restaurant model's data.
   */
  toObject<Restaurant>(): Restaurant {
    return JSON.parse(JSON.stringify(this));
  }

  /**
   * @param object
   * @returns -> An instantiated Foncii restaurant object if the object's fields satisfy
   * the requirements to instantiate a Foncii restaurant object, undefined otherwise.
   */
  static fromObject(object: Partial<Restaurant>): RestaurantModel | undefined {
    if (object == undefined) return undefined;

    return new RestaurantModel(object);
  }
}
