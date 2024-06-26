// Dependencies
// Inheritance
import FonciiMicroservice from "./protocol/fonciiMicroservice";

// Networking
import fetch from "node-fetch";

// Logging
import logger from "../../foncii-toolkit/debugging/debugLogger";

/**
 * This service is responsible for interfacing with the Foncii Insta-scraper
 * microservice which allows us to scrape and transform Instagram users into
 * Foncii users, as well as their posts which we can also then classify with
 * place IDs and automatically build out Foncii maps for both prospective users,
 * and active users.
 */
export default class InstascraperMicroservice extends FonciiMicroservice {
  /**
   * Scrapes the specified Instagram user for posts which are
   * then ingested into the Foncii ecosystem alongside their place
   * classifications which are used to associate the posts with restaurants.
   *
   * Note: Use this for post importation as it automatically classifies user posts
   * with places to a high degree of accuracy
   *
   * @async
   * @param instagramUsername -> The handle of the Instagram account to scrape
   * @param fonciiUsername -> The username of the foncii user to associate the ingested posts with
   * @param postAmount -> The amount of posts to scrape from the Instagram account. Please keep this at a reasonable amount.
   * For new accounts the limit should follow the same limit for importing through Basic Display, and for existing accounts
   * the limit should be less as only a few new posts need to be ingested as people update their pages sparingly.
   *
   * @returns -> True if the request succeeded (status code 200), false otherwise.
   */
  async classifyAndIngestPosts({
    instagramUsername,
    fonciiUsername,
    postAmount,
  }: {
    instagramUsername: string;
    fonciiUsername: string;
    postAmount: number;
  }) {
    const requestMethod = "POST",
      jsonDataString = JSON.stringify({
        instagramUsername,
        fonciiUsername,
        postAmount,
      });

    logger.info("[classifyAndIngestPosts] Invoked");

    const response = await fetch(
        this.serviceEndpoints.InstascraperService.ClassifyAndIngestPosts,
        {
          method: requestMethod,
          headers: this.sharedHeader,
          body: jsonDataString,
        }
      ),
      successfulStatusCodes = [200, 201];

    return successfulStatusCodes.includes(response.status);
  }

  /**
   * Scrapes the specified Instagram user for posts which are
   * then ingested into the Foncii ecosystem.
   *
   * Note: Don't use this for post importation, this doesn't classify user posts.
   *
   * @async
   * @param instagramUsername -> The handle of the Instagram account to scrape
   * @param fonciiUsername -> The username of the foncii user to associate the ingested posts with
   * @param postAmount -> The amount of posts to scrape from the Instagram account. Please keep this at a reasonable amount.
   * For new accounts the limit should follow the same limit for importing through Basic Display, and for existing accounts
   * the limit should be less as only a few new posts need to be ingested as people update their pages sparingly.
   *
   * @returns -> True if the request succeeded (status code 200), false otherwise.
   */
  async ingestPosts({
    instagramUsername,
    fonciiUsername,
    postAmount,
  }: {
    instagramUsername: string;
    fonciiUsername: string;
    postAmount: number;
  }) {
    const requestMethod = "POST",
      jsonDataString = JSON.stringify({
        instagramUsername,
        fonciiUsername,
        postAmount,
      });

    logger.info("[ingestPosts] Invoked");

    const response = await fetch(
        this.serviceEndpoints.InstascraperService.IngestPosts,
        {
          method: requestMethod,
          headers: this.sharedHeader,
          body: jsonDataString,
        }
      ),
      successfulStatusCodes = [200, 201];

    return successfulStatusCodes.includes(response.status);
  }

  /**
   * Scrapes the specified Instagram user for user information in order
   * to create a corresponding Foncii user with + the user's posts which are
   * then ingested into the Foncii ecosystem alongside their place
   * classifications which are used to associate the posts with restaurants.
   *
   * @async
   * @param instagramUsername -> The handle of the Instagram account to scrape for user information to create a new Foncii user, and for posts.
   * @param postAmount -> The amount of posts to scrape from the Instagram account. Please keep this at a reasonable amount.
   *
   * @returns -> True if the request succeeded (status code 200), false otherwise.
   */
  async ingestNewUserAndClassifiedPosts({
    instagramUsername,
    postAmount,
  }: {
    instagramUsername: string;
    postAmount: number;
  }) {
    const requestMethod = "POST",
      jsonDataString = JSON.stringify({
        instagramUsername,
        postAmount,
      });

    logger.info("[ingestNewUserAndClassifiedPosts] Invoked");

    const response = await fetch(
        this.serviceEndpoints.InstascraperService
          .IngestNewUserAndClassifiedPosts,
        {
          method: requestMethod,
          headers: this.sharedHeader,
          body: jsonDataString,
        }
      ),
      successfulStatusCodes = [200, 201];

    return successfulStatusCodes.includes(response.status);
  }

  /**
   * Scrapes the specified Instagram user for user information in order
   * to create a corresponding Foncii user with + the user's posts which are
   * then ingested into the Foncii ecosystem.
   *
   * @async
   * @param instagramUsername -> The handle of the Instagram account to scrape for user information to create a new Foncii user, and for posts.
   * @param postAmount -> The amount of posts to scrape from the Instagram account. Please keep this at a reasonable amount.
   *
   * @returns -> True if the request succeeded (status code 200), false otherwise.
   */
  async ingestNewUserAndPosts({
    instagramUsername,
    postAmount,
  }: {
    instagramUsername: string;
    fonciiUsername: string;
    postAmount: number;
  }) {
    const requestMethod = "POST",
      jsonDataString = JSON.stringify({
        instagramUsername,
        postAmount,
      });

    logger.info("[ingestNewUserAndPosts] Invoked");

    const response = await fetch(
        this.serviceEndpoints.InstascraperService.IngestNewUserAndPosts,
        {
          method: requestMethod,
          headers: this.sharedHeader,
          body: jsonDataString,
        }
      ),
      successfulStatusCodes = [200, 201];

    return successfulStatusCodes.includes(response.status);
  }

  /**
   * Scrapes the specified Instagram user for user information in order
   * to create a corresponding Foncii user with.
   *
   * @async
   * @param instagramUsername -> The handle of the Instagram account to scrape for user information in order
   * to create a corresponding Foncii user with.
   *
   * @returns -> True if the request succeeded (status code 200), false otherwise.
   */
  async ingestNewUser({ instagramUsername }: { instagramUsername: string }) {
    const requestMethod = "POST",
      jsonDataString = JSON.stringify({
        instagramUsername,
      });

    logger.info("[ingestNewUser] Invoked");

    const response = await fetch(
        this.serviceEndpoints.InstascraperService.IngestNewUser,
        {
          method: requestMethod,
          headers: this.sharedHeader,
          body: jsonDataString,
        }
      ),
      successfulStatusCodes = [200, 201];

    return successfulStatusCodes.includes(response.status);
  }
}
