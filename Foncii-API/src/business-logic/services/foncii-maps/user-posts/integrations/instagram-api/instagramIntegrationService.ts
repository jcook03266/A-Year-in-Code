// Dependencies
// Inheritance
import FMIntegrationService from "../protocol/fmIntegrationService";

// Models
import FMUserPostModel from "../../../../../../models/foncii/post-models/fmUserPostModel";
import FMIntegrationCredentialModel from "../../../../../../models/foncii/user-models/fmIntegrationCredentialModel";

// Types
import { FMIntegrationServiceProtocol } from "../../../../../../types/namespaces/protocols";
import { FMIntegrationProviders } from "../../../../../../types/common";

// Services
import InstagramAPIService from "./instagramAPIService";
import UserService from "../../../../shared/users/userService";
import FMIntegrationCredentialService from "../../../users/fmIntegrationCredentialService";
import { MicroserviceRepository } from "../../../../../../core-foncii/microservices/repository/microserviceRepository";

// Logging
import logger from "../../../../../../foncii-toolkit/debugging/debugLogger";

// Utilities
import {
  currentDateAsISOString,
  currentDateAsMSTime,
  getMSTimeFromDateString,
  getObjectKeyForValue,
} from "../../../../../../foncii-toolkit/utilities/convenienceUtilities";
import { UnitsOfTimeInMS } from "../../../../../../foncii-toolkit/utilities/time";
import { lowerCase } from "lodash";
import { convertSecondsToMS } from "../../../../../../foncii-toolkit/math/unitConversion";

/**
 * Instagram integration service that imports and parses posts from Instagram's Basic Display API.
 */
export default class InstagramIntegrationService
  extends FMIntegrationService
  implements FMIntegrationServiceProtocol {
  // Properties
  static provider: FMIntegrationProviders = FMIntegrationProviders.Instagram;

  // Services
  static instagramAPIService = new InstagramAPIService();

  private userService = () => new UserService();
  private integrationCredentialService = () =>
    new FMIntegrationCredentialService();

  // Ad-hoc properties
  // A list of users by user id to not do post classification for, only ingestion (if allowed)
  private static postClassificationUserUIDBlackList = {
    jasmineRuiz: "Y3ppdiHxJnaj8bu737Jgc4bHc6E2",
  };

  constructor(integrationCredential: FMIntegrationCredential) {
    super(integrationCredential);
  }

  /// Documentation: https://developers.facebook.com/docs/instagram-basic-display-api/reference/oauth-access-token
  /// Long-lived tokens are valid for up to 60 days, including after they're refreshed.
  /**
   * Generates a new Foncii Maps Integration Credential using the provided data
   *
   * @static
   * @async
   * @param userID
   * @param provider
   * @param authToken
   * @param redirectURI -> Used when generating Instagram credentials
   *
   * @returns -> A valid credential, or null if the credential could not be provisioned.
   */
  static async provisionCredential({
    userID,
    provider,
    authToken,
    redirectURI,
  }: {
    userID: string;
    provider: FMIntegrationProviders;
    authToken: string;
    redirectURI: string;
  }): Promise<FMIntegrationCredential | null> {
    // Initial authorization
    const accessTokenRequestResponse =
      await this.instagramAPIService.getInstagramAccessToken(
        authToken,
        redirectURI
      ),
      shortLivedAccessToken = accessTokenRequestResponse?.access_token,
      appUID = accessTokenRequestResponse?.user_id;

    // Precondition failure
    if (!shortLivedAccessToken || !appUID) {
      logger.warn(
        `Failed to obtain a short-lived access token for ${getObjectKeyForValue(
          FMIntegrationProviders,
          provider
        )} integration.`
      );
      return null;
    }

    // Authorization upgrade
    const accessTokenExchangeRequestResponse =
      await this.instagramAPIService.exchangeSLATForLLAT(
        shortLivedAccessToken
      ),
      longLivedAccessToken = accessTokenExchangeRequestResponse?.access_token,
      tokenExpirationInSeconds = accessTokenExchangeRequestResponse?.expires_in, // Number of seconds (from now) till the token expires
      tokenExpirationInMS = convertSecondsToMS((tokenExpirationInSeconds || 0));

    // Calculate the expiration timestamp in milliseconds
    const currentTimestampInMilliseconds = currentDateAsMSTime(),
      expirationTimestampInMilliseconds =
        currentTimestampInMilliseconds + tokenExpirationInMS,
      normalizedExpirationDate = new Date(
        expirationTimestampInMilliseconds
      ).toISOString(); // Numeric date converted to ISO timestamp for ease of use with other formatted dates

    // Precondition failure
    if (!longLivedAccessToken || !normalizedExpirationDate) {
      logger.warn(
        `Failed to fetch long-lived access token for ${getObjectKeyForValue(
          FMIntegrationProviders,
          provider
        )} integration.`
      );
      return null;
    }

    // Supplementary data fetching
    // Fetch user profile information (if available, not required)
    const instagramUser = await this.instagramAPIService.getInstagramUser(
      appUID,
      longLivedAccessToken
    ),
      appUsername = instagramUser?.username;

    const integrationCredential = new FMIntegrationCredentialModel({
      userID: userID,
      provider: this.provider,
      accessToken: longLivedAccessToken,
      appUID,
      appUsername,
      staleDate: normalizedExpirationDate,
    }),
      compiledIntegrationCredential =
        integrationCredential.toObject<FMIntegrationCredential>();

    return compiledIntegrationCredential;
  }

  /// Documentation: https://developers.facebook.com/docs/instagram-basic-display-api/reference/refresh_access_token
  /// This method can refresh the long-lived access token indefinitely until the provider revokes it when the user logs out of the provider's platform or invalidates their auth credentials on their platform.
  /// Long-lived access tokens must be at least 24 hours old to be refreshed. Long-lived tokens are valid for up to 60 days, including after they're refreshed.
  /**
   * Validates and refreshes the provided integration credential's access token, and
   * updates the rest of the fields as needed including the expiration (stale) date.
   *
   * @static
   * @async
   * @param integrationCredential
   *
   * @returns -> A valid credential, or null if the credential could not be refreshed.
   */
  static async refreshCredential(
    integrationCredential: FMIntegrationCredential
  ): Promise<FMIntegrationCredential | null> {
    // Precondition failure
    if (integrationCredential.provider != this.provider) {
      logger.warn(`Provider mismatch, you can't refresh an auth credential using a different provider. 
            Implementing Provider: ${getObjectKeyForValue(
        FMIntegrationProviders,
        this.provider
      )}
            Provider Referenced By Credential: ${getObjectKeyForValue(
        FMIntegrationProviders,
        integrationCredential.provider
      )}
            `);

      return null;
    }

    const storedLongLivedAccessToken = integrationCredential.accessToken,
      lastUpdated = integrationCredential.lastUpdated,
      expirationDate = integrationCredential.staleDate,
      isExpired =
        currentDateAsMSTime() >= getMSTimeFromDateString(expirationDate),
      isOldEnoughToBeRefreshed =
        getMSTimeFromDateString(lastUpdated) <=
        currentDateAsMSTime() - UnitsOfTimeInMS.day; // The long-lived token must be AT LEAST 24 hours old, in [ms]

    // Validation
    if (!isOldEnoughToBeRefreshed) {
      logger.warn(`The passed credential is not old enough to be refreshed.`);
      return null;
    } else if (isExpired) {
      logger.warn(
        `The passed credential is expired and cannot be refreshed, please revoke the old one and generate a new one.`
      );
      return null;
    }

    // Refresh request
    const refreshLongLivedAccessTokenRequest =
      await this.instagramAPIService.refreshLongLivedAccessToken(
        storedLongLivedAccessToken
      ),
      refreshedLongLivedAccessToken =
        refreshLongLivedAccessTokenRequest?.access_token,
      newTokenExpirationInSeconds =
        refreshLongLivedAccessTokenRequest?.expires_in, // Number of seconds (from now) till the token expires
      newTokenExpirationInMS = convertSecondsToMS((newTokenExpirationInSeconds || 0));

    // Calculate the new expiration timestamp in milliseconds
    const currentTimestampInMilliseconds = currentDateAsMSTime(),
      expirationTimestampInMilliseconds =
        currentTimestampInMilliseconds + newTokenExpirationInMS,
      newNormalizedExpirationDate = new Date(
        expirationTimestampInMilliseconds
      ).toISOString(); // Numeric date converted to ISO timestamp for ease of use with other formatted dates

    // Precondition failure
    if (!refreshedLongLivedAccessToken || !newNormalizedExpirationDate) {
      logger.warn(
        `Failed to refresh long-lived access token for ${getObjectKeyForValue(
          FMIntegrationProviders,
          this.provider
        )} integration.`
      );
      return null;
    }

    // Supplementary data fetching
    // Fetch user profile information (if available, not required)
    const instagramUser = await this.instagramAPIService.getInstagramUser(
      integrationCredential.appUID,
      refreshedLongLivedAccessToken
    ),
      appUsername = instagramUser?.username;

    const refreshedIntegrationCredential = new FMIntegrationCredentialModel({
      ...integrationCredential,
      provider: this.provider,
      accessToken: refreshedLongLivedAccessToken,
      appUsername,
      staleDate: newNormalizedExpirationDate,
    }),
      compiledIntegrationCredential =
        refreshedIntegrationCredential.toObject<FMIntegrationCredential>();

    return compiledIntegrationCredential;
  }

  async import({
    useAuxillaryService = true,
    classificationEnabled = true,
    isFirstImport = false,
  }: {
    useAuxillaryService?: boolean;
    classificationEnabled?: boolean;
    isFirstImport?: boolean;
  }): Promise<Boolean> {
    // User properties
    const accessToken = this.integrationCredential.accessToken,
      integrationCredentialID = this.integrationCredential.id,
      userID = this.userID();

    // Update the integration credential remotely with the lastest import timestamp
    this.integrationCredentialService().updateLastImportTimestamp({
      id: integrationCredentialID,
      lastImport: currentDateAsISOString(),
    });

    // Default to the auxillary scraper service when specified and when the service isn't in a 30 minute
    // overusage prevention cool down window
    if (
      useAuxillaryService &&
      !InstagramIntegrationService.isAuxillaryServiceInCoolDown(
        this.integrationCredential
      )
    ) {
      // Fetch the creator's user data
      const user = await this.userService().findUserWithID(userID);

      // Parsing
      const instagramUsername = this.integrationCredential.appUsername,
        fonciiUsername = user?.username;

      // Properties
      const postAmount = isFirstImport
        ? InstagramAPIService.MAX_POSTS_PER_REQUEST_SCRAPER_FTUE
        : InstagramAPIService.MAX_POSTS_PER_REQUEST_SCRAPER_NON_FTUE;

      // Run the auxillary importation service to both import collaborator posts
      // and auto-associate places with user posts
      if (instagramUsername && fonciiUsername) {
        if (
          classificationEnabled &&
          InstagramIntegrationService.isPostClassificationEnabledForUser(userID)
        ) {
          // Ingest + classify posts
          return await MicroserviceRepository.fonciiInstascraper().classifyAndIngestPosts(
            {
              instagramUsername,
              fonciiUsername,
              postAmount,
            }
          );
        } else {
          // Only ingest posts, don't classify them
          return await MicroserviceRepository.fonciiInstascraper().ingestPosts({
            instagramUsername,
            fonciiUsername,
            postAmount,
          });
        }
      } else {
        logger.error(
          `Failed to import posts for user ${userID}, missing username data.`,
          "IG Username: ",
          instagramUsername,
          "Foncii Username: ",
          fonciiUsername
        );

        return false;
      }
    } else {
      // Fallback on basic display when the scraper isn't being used
      const instagramPosts =
        await InstagramIntegrationService.instagramAPIService
          .fetchUserInstagramPosts(accessToken),
        dedupedInstagramPosts = [...new Set(instagramPosts)];

      // Iterate through the array of posts returned from the Basic Display API and check if they exist in our database,
      // if they do then try to update them if needed, if not then create the new posts with the imported data.
      await Promise.all(
        dedupedInstagramPosts.map(async (instagramPost) => {
          const appScopedSourceUID = instagramPost.id,
            permalink = instagramPost.permalink,
            liveSourceUID =
              InstagramIntegrationService.parseLiveUIDFromPermalink(permalink);

          const secondaryMedia = (instagramPost.mediaChildren ?? []).map(
            (media): FMUserPostMedia => {
              return {
                mediaURL: media.media_url,
                videoMediaThumbnailURL: media.thumbnail_url,
                mediaType: media.media_type,
              };
            }
          );

          const importedPost = await this.fetchParentPostWithSourceUID({
            appScopedSourceUID,
            liveSourceUID,
            userID,
          });

          // If the post doesn't exist, then create it
          if (importedPost == null) {
            const newPost = new FMUserPostModel({
              userID,
              dataSource: {
                provider: FMIntegrationProviders.Instagram,
                permalink,
                liveSourceUID,
                sourceUID: instagramPost.id,
                caption: instagramPost.caption,
                creationDate: instagramPost.timestamp,
                media: {
                  mediaURL: instagramPost.media_url,
                  videoMediaThumbnailURL: instagramPost.thumbnail_url,
                  mediaType: instagramPost.media_type,
                },
                secondaryMedia,
              },
            });

            const newPostData = newPost.toObject(),
              createdPost = await this.createPost(newPostData);

            // Error logging in case the post creation step doesn't succeed
            if (!createdPost) {
              logger.error(
                `[InstagramIntegrationService] Failed to create a new post for the user with ID: ${userID} and app-scoped data source UID: ${appScopedSourceUID} || live UID ${liveSourceUID}`
              );
              logger.error(
                `Instagram Post Data: ${JSON.stringify(instagramPost)}`
              );
              logger.error(`New Post Data: ${JSON.stringify(newPostData)}`);
            }
          } else {
            // If the post does exist, try to update it with fresh data from the integration (if any)
            const parsedImportedPost = FMUserPostModel.fromObject(importedPost);

            const secondaryMedia = (instagramPost.mediaChildren ?? []).map(
              (media): FMUserPostMedia => {
                return {
                  mediaURL: media.media_url,
                  videoMediaThumbnailURL: media.thumbnail_url,
                  mediaType: media.media_type,
                };
              }
            );

            // Precondition failure and error logging
            if (!parsedImportedPost) {
              logger.error(
                `[InstagramIntegrationService] Failed to parse the existing imported post with ID: ${appScopedSourceUID}`
              );
              logger.error(
                `Post Data Model Dump: ${JSON.stringify(importedPost)}`
              );
              return;
            }

            // IMPORTANT:
            // Only update the data provided by the data source, IMPORTANT: Do not reassign any user
            // identification parameters, doing that will enable cross-account takeovers
            // because users can take ownership over all of another user's posts by simply
            // importing posts through their compromised Instagram account.
            parsedImportedPost.dataSource = {
              provider: FMIntegrationProviders.Instagram,
              permalink: instagramPost.permalink,
              liveSourceUID:
                InstagramIntegrationService.parseLiveUIDFromPermalink(
                  instagramPost.permalink
                ),
              sourceUID: instagramPost.id,
              caption: instagramPost.caption,
              creationDate: instagramPost.timestamp,
              media: {
                mediaURL: instagramPost.media_url,
                videoMediaThumbnailURL: instagramPost.thumbnail_url,
                mediaType: instagramPost.media_type,
              },
              secondaryMedia,
            };

            const updatedPost = parsedImportedPost.toObject(),
              didSucceed = await this.updatePost(updatedPost.id, updatedPost);

            if (!didSucceed) {
              logger.error(
                `[InstagramIntegrationService] Failed to update an imported post for the user with ID: ${userID} and app-scoped data source UID: ${appScopedSourceUID} || live UID ${liveSourceUID}`
              );
              logger.error(
                `Post Data Model Dump: ${JSON.stringify(updatedPost)}`
              );
            }
          }
        })
      );
    }

    // Import process succeeded
    return true;
  }

  // Helper Methods
  /**
   * Determines whether or not user posts can be scraped currently. The post scraper
   * is locked behind a cool down duration to prevent overusage and abuse since it's
   * an expensive data-sensitive, high time and space complexity process to run.
   *
   * @param integrationCredential
   *
   * @returns -> True if the post scraper can't be used right now, false otherwise.
   */
  private static isAuxillaryServiceInCoolDown(
    integrationCredential: FMIntegrationCredential
  ): boolean {
    // Parsing
    const lastImportTimestamp = integrationCredential.lastImport;

    // Precondition failure, return true if the timestamp is undefined (no last import on record with this credential)
    if (!lastImportTimestamp) return false;

    // 30 minute cool-down
    const minDurationBetweenImports = UnitsOfTimeInMS.hour / 2,
      lastImportTimestampInMS = getMSTimeFromDateString(lastImportTimestamp),
      timeSinceLastImport = currentDateAsMSTime() - lastImportTimestampInMS;

    // <= 30 Minutes -> Cool down active | > 30 Minutes Cool down inactive
    return timeSinceLastImport <= minDurationBetweenImports;
  }

  /**
   * Determines if the specific user's posts can be classified or not.
   * For right now some users are blacklisted from the post classification
   * feature until further notice.
   *
   * @param userID
   *
   * @returns -> True if the user's posts can be classified, false otherwise.
   */
  private static isPostClassificationEnabledForUser(userID: string): boolean {
    const userIDs = Object.values(
      InstagramIntegrationService.postClassificationUserUIDBlackList
    );
    return !userIDs.map(lowerCase).includes(lowerCase(userID));
  }

  /**
   * Converts https://www.instagram.com/reel/CqohUwaLSuE/ -> CqohUwaLSuE
   *
   * @param permalink
   * @returns Parsed live post UID from the provided permalink, or undefined if the permalink is invalid.
   */
  private static parseLiveUIDFromPermalink(
    permalink?: string
  ): string | undefined {
    // Precondition failure
    if (!permalink) return undefined;

    const characters: string[] = [...permalink];

    // Remove the slash at the end of the link (if any)
    if (permalink[permalink.length - 1] == "/") characters.pop();

    // Parsed live UID
    return characters.join("").split("/").pop();
  }
}
