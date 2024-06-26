// Dependencies
// Inheritance
import FonciiMicroservice from "./protocol/fonciiMicroservice";

// Types
import {
  SentimentAnalysisServiceResponseKeys,
  SentimentAnalysisServiceTypes,
} from "../../types/namespaces/microservice-api";
import { FonciiDBCollections } from "../../types/namespaces/database-api";

// Services
import { DatabaseServiceAdapter } from "../../business-logic/services/database/databaseService";
import RestaurantAggregator from "../../business-logic/services/shared/restaurants/restaurantAggregator";

// Logging
import logger from "../../foncii-toolkit/debugging/debugLogger";

// Networking
import fetch from "node-fetch";

// Utilities
import { isNumber } from "lodash";
import { currentDateAsISOString } from "../../foncii-toolkit/utilities/convenienceUtilities";

/**
 * Service class used to interface with the Foncii sentiment analysis service API
 * Allows us to perform sentiment analysis on restaurant reviews and article publications
 */
export default class SentimentAnalysisMicroservice extends FonciiMicroservice {
  // Properties
  /** Max and min values for all possible sentiment analysis scores, anything outside of this range is invalid */
  static SentimentAnalysisScoreRange = { max: 5, min: 1 };

  /**
   * Computes and returns the sentiment score for the given review by talking to the Foncii sentiment analysis service API
   *
   * @async
   * @param review - A single {text: "text"} review object to perform sentiment analysis on.
   *
   * @returns -> An integer depicting the sentiment score from 1 - 5 of the passed review
   */
  async getSentimentScoreForRestaurantReview(
    review: RestaurantReview
  ): Promise<SentimentAnalysisServiceTypes.SentimentScore | undefined> {
    const requestMethod = "POST", // Note: Post requests only in order to submit body data.
      jsonDataString = JSON.stringify(review);

    return fetch(this.serviceEndpoints.SentimentAnalysisService.AnalyzeReview, {
      method: requestMethod,
      headers: this.sharedHeader,
      body: jsonDataString,
    })
      .then((response) => {
        return response.json();
      })
      .then((reviewSentimentScoreData) => {
        // Parse the actual score from the JSON
        return reviewSentimentScoreData[
          SentimentAnalysisServiceResponseKeys.SentimentScore
        ];
      })
      .catch((error) => {
        logger.error(error);
        return undefined;
      });
  }

  /**
   * Computes and returns the average sentiment score for an array of review objects
   * by talking to the Foncii sentiment analysis service API
   *
   * @async
   * @param reviews -> An array of {text: "text"} review objects to perform sentiment analysis on
   *
   * @returns -> A double depicting the average sentiment score from 1 - 5 of the passed array of reviews
   */
  async getAverageSentimentScoreForRestaurantReviews(
    reviews: RestaurantReview[]
  ): Promise<number | undefined> {
    let promises: Promise<
        SentimentAnalysisServiceTypes.SentimentScore | undefined
      >[] = [],
      totalSentimentScore = 0,
      totalReviews = reviews.length,
      averageSentimentScore = 0;

    // Gather promises
    reviews.forEach((review) => {
      promises.push(this.getSentimentScoreForRestaurantReview(review));
    });

    // Await promises
    const reviewSentimentScores = await Promise.all(promises);

    // Sum up the scores
    reviewSentimentScores.forEach((score, index) => {
      if (isNumber(score)) {
        totalSentimentScore += score;
      } else {
        logger.error(
          `Index[${index}] Invalid review sentiment score: ${score}. Check Review Dump:`
        );
        console.table(reviews);

        totalReviews -= 1;
      }
    });

    // Return undefined if there are no reviews to prevent a NaN error
    if (totalReviews == 0 || totalSentimentScore == 0) {
      return undefined;
    }

    // Average the scores and return the average up to 2 decimal places
    averageSentimentScore = totalSentimentScore / totalReviews;

    return Number(averageSentimentScore.toFixed(2));
  }
}

/**
 * Service layer that interacts with the database to retrieve cached computationally expensive
 * computed data points such as a sentiment analysis score for a restaurant's latest reviews.
 * This service layer is also responsible for populating and invalidating cached restaurant computations when
 * they expire.
 *
 * TODO: - Implement Article computations when articles become available
 */
export class CachedRestaurantComputationsService {
  // Services
  database = new DatabaseServiceAdapter();
  restaurantAggregator = new RestaurantAggregator();
  sentimentAnalysisService = new SentimentAnalysisMicroservice();

  /**
   * Fetches the cached restaurant review sentiment analysis computed properties for Yelp and Google (if any),
   * if none or if the cache is expired, a new cache is provisioned with a new expiration date in the future, and
   * new computed Yelp and Google review sentiment analysis scores
   *
   * @async
   * @param restaurantID
   *
   * @returns -> Cached restaurant review sentiment analysis data for Yelp and Google
   */
  async fetchCachedReviewSentimentComputation({
    restaurantID,
    yelpID,
    googleID,
  }: {
    restaurantID: string;
    yelpID?: string;
    googleID: string;
  }) {
    const collectionName =
      FonciiDBCollections.CachedReviewSentimentAnalysisComputations;

    let cachedRestaurantReviewSentimenComputation: CachedReviewSentimentComputation | null =
      await this.database.findDocumentWithID<CachedReviewSentimentComputation>(
        collectionName,
        restaurantID
      );

    // Log when a cache hasn't been provisioned yet and don't provision it in this method as some restaurant caches will fail due to no reviews
    // being available, thus wasting compute time on caches that will be never be computed properly. Caches must now be generated when the restaurant
    // is created / updated, namely through the embedding generation process
    if (!cachedRestaurantReviewSentimenComputation) {
      logger.warn(`A restaurant review sentiment computation cache with the ID: ${restaurantID}, 
            could not be found in the collection: ${collectionName}, please provision a cache with [computeAndSetAvgRestaurantReviewSentimentScores]`);
    } else {
      // Determine if the current cache is stale or not, if stale then replace the old one
      // Log this behavior to keep a log of successful invalidations to verify system functionality
      const expirationDate =
        cachedRestaurantReviewSentimenComputation.staleDate;

      if (this.isComputationExpired(expirationDate)) {
        logger.warn(`The restaurant review sentiment computation cache with the ID: ${restaurantID} has expired
                Invalidating old cache and provisioning a new cache now...`);

        // Invalidate the old cache, but don't force the caller to wait, this will take some time and shouldn't slow down the caller as the
        // previous cache will host similar results, the next caller will receive the updated computation
        this.computeAndSetAvgRestaurantReviewSentimentScores({
          restaurantID,
          yelpID,
          googleID,
        });
      }
    }

    return cachedRestaurantReviewSentimenComputation;
  }

  /**
   * Computes new sentiment analysis scores for Yelp and Google reviews through the sentiment analysis API,
   * updates the database with the newly cached data, and returns this computed information after these
   * processes are done, to be used locally immediately.
   *
   * @async
   * @param restaurantID
   * @param yelpID
   * @param googleID
   *
   * @returns -> CachedReviewSentimentComputation object if the operation succeeded, undefined otherwise
   */
  async computeAndSetAvgRestaurantReviewSentimentScores({
    restaurantID,
    yelpID,
    googleID,
  }: {
    restaurantID: string;
    yelpID?: string;
    googleID: string;
  }) {
    // Gather latest reviews from Yelp and Google
    const reviewPromises = [
        this.restaurantAggregator.getYelpReviewsForRestaurant(yelpID),
        this.restaurantAggregator.getGoogleReviewsForRestaurant(googleID),
      ],
      reviews = await Promise.all(reviewPromises),
      yelpReviews = reviews[0],
      googleReviews = reviews[1];

    // Compute the average sentiment analysis scores for the yelp and google review sets
    const [yelpAvgReviewSentimentScore, googleAvgReviewSentimentScore] =
      await Promise.all([
        this.sentimentAnalysisService.getAverageSentimentScoreForRestaurantReviews(
          yelpReviews
        ),
        this.sentimentAnalysisService.getAverageSentimentScoreForRestaurantReviews(
          googleReviews
        ),
      ]);

    // Cache and return the computed review sentiment scores
    const cachedRestaurantReviewSentimentScores =
      await this.setReviewSentimentScoreCache({
        restaurantID,
        yelpAvgReviewSentimentScore,
        googleAvgReviewSentimentScore,
      });

    return cachedRestaurantReviewSentimentScores;
  }

  /**
   * Creates / updates a cached restaurant review sentiment analysis document in the
   * target document collection.
   *
   * @async
   * @param restaurantID
   * @param yelpAvgReviewSentimentScore
   * @param googleAvgReviewSentimentScore
   *
   * @returns -> CachedReviewSentimentComputation object if the operation succeeded, undefined otherwise
   */
  private async setReviewSentimentScoreCache({
    restaurantID,
    yelpAvgReviewSentimentScore,
    googleAvgReviewSentimentScore,
  }: {
    restaurantID: string;
    yelpAvgReviewSentimentScore?: number;
    googleAvgReviewSentimentScore?: number;
  }) {
    // Don't cache invalid computations (both scores are missing or are 0 ~ invalid)
    if (!yelpAvgReviewSentimentScore && !googleAvgReviewSentimentScore)
      return null;

    const documentID = restaurantID,
      data: CachedReviewSentimentComputation = {
        id: restaurantID,
        yelpAvgReviewSentimentScore,
        googleAvgReviewSentimentScore,
        creationDate: currentDateAsISOString(),
        staleDate: this.provisionNewExpirationDate().toISOString(),
      },
      collectionName =
        FonciiDBCollections.CachedReviewSentimentAnalysisComputations;

    // Delete the existing document (if any) and create a new one in its place with the latest computed properties to fetch later
    await this.database.deleteDocumentWithID(collectionName, documentID);
    const creationSucceeded = await this.database.createNewDocumentWithID(
      collectionName,
      documentID,
      data
    );

    return creationSucceeded ? data : null;
  }

  /**
   * Determines if the passed expiration date has exceeded the 90 day cache period specified
   * for each cache
   *
   * @param expirationDate
   *
   * @returns -> True if the given expiration date is invalid, false otherwise
   */
  private isComputationExpired(expirationDate: string) {
    return new Date().getTime() > new Date(expirationDate).getTime();
  }

  /**
   * Creates a new expiration date for a restaurant's cached computational properties
   * ~ 3 Months ~ 90 days
   *
   * @returns -> The future date offset by the amount specified in this functino
   */
  private provisionNewExpirationDate() {
    const monthOffset = 3,
      date = new Date();

    return new Date(
      date.getFullYear(),
      date.getMonth() + monthOffset,
      date.getDate()
    );
  }
}
