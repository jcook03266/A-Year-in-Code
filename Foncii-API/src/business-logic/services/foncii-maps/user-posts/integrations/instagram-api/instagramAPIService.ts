// Dependencies
// Logging
import logger from "../../../../../../foncii-toolkit/debugging/debugLogger";

// Namespaces
import { Instagram } from "../../../../../../types/namespaces/third-party-api";

// Cryptography
import crypto from "crypto";

// Utils
import { getMSTimeFromDateString } from "../../../../../../foncii-toolkit/utilities/convenienceUtilities";
import { UnitsOfTimeInMS } from "../../../../../../foncii-toolkit/utilities/time";

/** Service layer for interfacing with the Instagram API */
export default class InstagramAPIService {
  // Properties
  private clientSecret = () => process.env.INSTAGRAM_CLIENT_SECRET;
  private clientID = () => process.env.INSTAGRAM_CLIENT_ID;

  // Limits
  // Note: API max is 10,000, newest to last
  static readonly MAX_POSTS_PER_REQUEST_BASIC_DISPLAY = 1000;

  /**
   * For first imports do the maximum possible import (hopefully it doesn't get blocked, for other imports do ~ 20 posts ~ 1 request or so)
   * This should be more than enough to ensure the user's gallery is up to date consistently, unless the user goes away for a long period of time
   * and the integration credential expires etc
   */
  static readonly MAX_POSTS_PER_REQUEST_SCRAPER_FTUE = 500;
  static readonly MAX_POSTS_PER_REQUEST_SCRAPER_NON_FTUE = 20;

  // The supported endpoints used by this service to interface with the IG API
  static Endpoints = {
    baseGraphAPI: "https://graph.instagram.com/",
    getAccessToken: "https://api.instagram.com/oauth/access_token",
    exchangeAccessToken: "https://graph.instagram.com/access_token",
    refreshAccessToken: "https://graph.instagram.com/refresh_access_token",
    userMedia: "https://graph.instagram.com/me/media",
    mediaChildren: (postID: string) =>
      `https://graph.instagram.com/${postID}/children`,
    OAuthModal: "https://api.instagram.com/oauth/authorize",
  };

  /**
   * Exchanges a short lived access token that lasts for ~ 1 hour, for a long lived access token that lasts for
   * ~ 60 day ~ 2 months, allowing users to access Instagram's API without having to re-authenticate every hour
   * Documentation: https://developers.facebook.com/docs/instagram-basic-display-api/reference/access_token
   *
   * @async
   * @param shortLivedAccessToken -> The access token to exchange
   *
   * @returns -> The long lived access token string if the SL access token is valid, undefined otherwise
   */
  async exchangeSLATForLLAT(
    shortLivedAccessToken: string
  ): Promise<Instagram.LongLivedAccessTokenResponse | undefined> {
    let url = InstagramAPIService.Endpoints.exchangeAccessToken;

    const urlParams = new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: this.clientSecret(),
      access_token: shortLivedAccessToken,
    });

    const options = {
      method: "GET",
    };

    // Append the query parameters to the URL
    url += "?" + urlParams.toString();

    return await fetch(url, options)
      .then((response) => response.json())
      .then((data) => {
        return data as Instagram.LongLivedAccessTokenResponse;
      })
      .catch((error) => {
        // Log error and continue
        logger.error(
          `Error occurred while attempting to exchange a short-lived access token for a long lived access token: ${error}`
        );
        return undefined;
      });
  }

  /**
   * Refreshes a long-lived access token that's at least 24-hours old. This refresh process can be done indefinitely,
   * allowing a user to stay authenticated without having to sign back in and re-authenticate with Instagram's auth process.
   * Documentation: https://developers.facebook.com/docs/instagram-basic-display-api/reference/refresh_access_token
   *
   * @async
   * @param longLivedAccessToken
   *
   * @returns -> The refreshed long lived access token string if the given LL access token is valid, undefined otherwise
   */
  async refreshLongLivedAccessToken(
    longLivedAccessToken: string
  ): Promise<Instagram.LongLivedAccessTokenResponse | undefined> {
    let url = InstagramAPIService.Endpoints.refreshAccessToken;

    const urlParams = new URLSearchParams({
      grant_type: "ig_refresh_token",
      client_secret: this.clientSecret(),
      access_token: longLivedAccessToken,
    });

    const options = {
      method: "GET",
    };

    // Append the query parameters to the URL
    url += "?" + urlParams.toString();

    return await fetch(url, options)
      .then((response) => response.json())
      .then((data) => {
        return data as Instagram.LongLivedAccessTokenResponse;
      })
      .catch((error) => {
        // Log error and continue
        logger.error(
          `Error occurred while attempting to refresh a long-lived access token: ${error}`
        );
        return undefined;
      });
  }

  /**
   * Exchanges an Instagram authorization code for a short lived access token
   * Documentation: https://developers.facebook.com/docs/instagram-basic-display-api/reference/oauth-access-token
   *
   * @async
   * @param authToken -> An authorization code produced by the frontend when
   * the user authenticates with IG's auth modal
   * @param redirectURI -> A custom redirect URI approved in the developer panel
   * Note: URI is basically an identifier, URL is used when requesting a resource.
   *
   * @returns -> UserID and a short lived access token that expires ~ 1 hour after being provisioned
   */
  async getInstagramAccessToken(
    authToken: string,
    redirectURI: string
  ): Promise<Instagram.InstagramAccessTokenResponse | undefined> {
    const url = InstagramAPIService.Endpoints.getAccessToken;

    const postRequestData = {
      client_id: this.clientID(),
      client_secret: this.clientSecret(),
      grant_type: "authorization_code",
      redirect_uri: redirectURI,
      code: authToken,
    };

    // URL Form encoded Post request
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(postRequestData),
    };

    return await fetch(url, options)
      .then((response) => response.json())
      .then((data) => {
        return data as Instagram.InstagramAccessTokenResponse;
      })
      .catch((error) => {
        // Log error and continue
        logger.error(
          `Error occurred while attempting to obtain Instagram access token: ${error}`
        );
        return undefined;
      });
  }

  /**
   * Attempts to find the Instagram user data corresponding to the given userID and access token
   * Documentation: https://developers.facebook.com/docs/instagram-basic-display-api/reference/user
   *
   * @async
   * @param userID -> The id of the user to fetch account data from
   * @param accessToken -> Short-lived access token granted by the `getAccessToken` endpoint
   *
   * @returns -> Limited data pertaining to the given user ~ username, undefined if the user is not found or the access token is invalid
   */
  async getInstagramUser(
    userID: string,
    accessToken: string
  ): Promise<Instagram.InstagramUserResponse | undefined> {
    let url = InstagramAPIService.Endpoints.baseGraphAPI;

    const urlParams = new URLSearchParams({
      fields: "id,username",
      access_token: accessToken,
    });

    const options = {
      method: "GET",
    };

    // Append the user's UID to the URL to reference their specific account
    url += userID;

    // Append the query parameters to the URL
    url += "?" + urlParams.toString();

    return await fetch(url, options)
      .then((response) => response.json())
      .then((data) => {
        return data as Instagram.InstagramUserResponse;
      })
      .catch((error) => {
        // Log error and continue
        logger.error(
          `Error occurred while attempting to locate Instagram User: ${error}`
        );
        return undefined;
      });
  }

  /**
   * Fetches a paginated list of Instagram user posts corresponding to the given user and valid access token
   *
   * @async
   * @param accessToken -> Short lived access token needed to access to associated user's posts
   * @returns -> An array of instagram posts
   */
  async fetchUserInstagramPosts(
    accessToken: string
  ): Promise<Instagram.InstagramMediaResponse[] | undefined> {
    let url = InstagramAPIService.Endpoints.userMedia;
    const limit: string = "100"; // Max per request is 100 by inspection, documentation doesn't state this number

    const urlParams = new URLSearchParams({
      fields:
        "id,caption,thumbnail_url,media_type,media_url,username,timestamp,permalink",
      client_secret: this.clientSecret(),
      access_token: accessToken,
      limit: limit,
    });

    const options = {
      method: "GET",
    };

    // Append the query parameters to the URL
    url += "?" + urlParams.toString();

    return await this.aggregateInstagramPostsFromURL({
      url,
      options,
      accessToken,
    });
  }

  /**
   * Paginates the sequentially fetched Instagram posts and aggregates them into an array of unique instagram media
   * responses.
   *
   * @param url -> The URL to fetch the posts from.
   * @param options -> Options for this fetch request
   *
   * @returns -> A promise that resolves to an array of instagram posts. The posts are aggregated from
   * sequential pagination.
   */
  async aggregateInstagramPostsFromURL({
    url,
    options,
    accessToken,
  }: {
    url: string;
    options: { [x: string]: string };
    accessToken: string;
  }): Promise<Instagram.InstagramMediaResponse[] | undefined> {
    // Properties + accumulator
    let nextPageURL = url,
      instagramPosts: Instagram.InstagramMediaResponse[] = [];

    // Limits
    // Reject posts older than 2 years from now and break out of the loop if one is detected
    const MAX_POST_AGE_MS = Date.now() - UnitsOfTimeInMS.year * 2;
    let postIsTooOld: Boolean = false;

    while (
      nextPageURL != undefined &&
      instagramPosts.length <=
        InstagramAPIService.MAX_POSTS_PER_REQUEST_BASIC_DISPLAY
    ) {
      if (nextPageURL == undefined || postIsTooOld == true) break;

      await fetch(nextPageURL, options)
        .then((response) => response.json())
        .then(async (result) => {
          let posts = result.data,
            pagination = result.paging,
            mappedPosts: Instagram.InstagramMediaResponse[] = [];

          // Continue to the next page (if any)
          nextPageURL = pagination?.next;

          await Promise.all(
            posts?.map(async (post: Instagram.InstagramMediaResponse) => {
              // Properties
              const postID = post.id,
                postCreationDate = post.timestamp,
                postAgeInMS = getMSTimeFromDateString(postCreationDate);

              // Post max age rejection condition
              postIsTooOld = postAgeInMS < MAX_POST_AGE_MS;

              // Don't map anymore posts, an old post was detected
              if (postIsTooOld) return;

              // Fetch media children (if any)
              const mediaChildren = await this.fetchInstagramPostMediaChildren({
                accessToken,
                postID,
              });

              mappedPosts.push({
                ...post,
                mediaChildren,
              });
            })
          );

          instagramPosts.push(...mappedPosts);
        })
        .catch((error) => {
          // Log error and continue
          logger.error(
            `Error occurred while attempting to fetch Instagram Media: ${error}, GET REQUEST URL: ${nextPageURL}`
          );
        });
    }

    // Remove any undefined posts
    instagramPosts.filter(Boolean);

    // Deduplicate any posts
    return [...new Set(instagramPosts)];
  }

  /**
   * Fetches a paginated list of Instagram user post children media
   *  corresponding to the given user, instagram post, and valid access token
   *
   * @async
   * @param accessToken -> Short lived access token needed to access to associated user's posts
   * @param postID
   *
   * @returns -> An array of instagram post media children
   */
  async fetchInstagramPostMediaChildren({
    accessToken,
    postID,
  }: {
    accessToken: string;
    postID: string;
  }): Promise<Instagram.InstagramMediaResponse[] | undefined> {
    let url = InstagramAPIService.Endpoints.mediaChildren(postID);

    const urlParams = new URLSearchParams({
      fields: "thumbnail_url,media_type,media_url",
      client_secret: this.clientSecret(),
      access_token: accessToken,
    });

    const options = {
      method: "GET",
    };

    // Append the query parameters to the URL
    url += "?" + urlParams.toString();

    return await this.aggregateInstagramMediaChildrenFromURL(url, options);
  }

  /**
   * Paginates the sequentially fetched Instagram post media children and aggregates them into an
   * array of unique media children responses.
   *
   * @async
   * @param url -> The URL to fetch the media children from.
   * @param options -> Options for this fetch request
   *
   * @returns -> A promise that resolves to an array of media children. The media children are aggregated from
   * sequential pagination.
   */
  async aggregateInstagramMediaChildrenFromURL(
    url: string,
    options: { [x: string]: string }
  ): Promise<Instagram.InstagramMediaResponse[] | undefined> {
    let nextPageURL = url,
      mediaChildren: Instagram.InstagramMediaResponse[] = [];

    while (nextPageURL != undefined) {
      if (nextPageURL == undefined) break;

      await fetch(nextPageURL, options)
        .then((response) => response.json())
        .then((result) => {
          const media = result.data as Instagram.InstagramMediaResponse[],
            pagination = result.paging;

          // Continue to the next page (if any)
          nextPageURL = pagination?.next;

          mediaChildren.push(...media);
        })
        .catch((error) => {
          // Log error and continue
          logger.error(
            `[aggregateInstagramMediaChildrenFromURL] Error occurred while attempting to fetch Instagram Media: ${error}, GET REQUEST URL: ${nextPageURL}`
          );
        });
    }

    // Remove any undefined elements
    mediaChildren.filter(Boolean);

    // Remove the first element from the carousel array, that's the first media, this is given by the original post object
    mediaChildren.shift();

    // Deduplicate any elements
    return [...new Set(mediaChildren)];
  }

  /**
   * Reserved for dev use only
   * Fast DEBUG:
   * Get an auth token by clicking triggering the constructed URL from this function
   * and signing in with Instagram which redirects you back to the url provided with the auth token in the url
   * This functionality is triggered by the login button on the frontend, but for debugging purposes you can
   * use this function
   *
   * @param redirectURI
   */
  openInstagramAuthModalInBrowser(redirectURI: string) {
    let authModalTriggerURL = InstagramAPIService.Endpoints.OAuthModal;

    const urlParams = new URLSearchParams({
      client_id: this.clientID(),
      redirect_uri: redirectURI,
      scope: "user_profile,user_media,", // The elements to request access to
      response_type: "code",
    });

    // Append the query parameters to the URL
    authModalTriggerURL += "?" + urlParams.toString();

    logger.info(
      "Open Instagram Auth Modal By Clicking this linke: " + authModalTriggerURL
    );
  }

  // Utility Methods
  /**
   * @param signedRequest
   *
   * @returns -> A parsed unique identifier that describes the user ID of the
   * user that sent the signed request.
   */
  static parseUIDFromSignedRequestPayload(
    signedRequest: string
  ): string | undefined {
    // Properties
    const appSecret = process.env.INSTAGRAM_CLIENT_SECRET;

    const parsedSignedRequest = signedRequest.split("."),
      encoded_sig = parsedSignedRequest[0],
      payload = parsedSignedRequest[1],
      data = JSON.parse(Buffer.from(payload, "base64").toString());

    // Precondition failure
    if (data.algorithm.toUpperCase() !== "HMAC-SHA256") return undefined;

    const hmac = crypto.createHmac("sha256", appSecret),
      encoded_payload = hmac
        .update(payload)
        .digest("base64")
        .replace(/\//g, "_")
        .replace(/\+/g, "-")
        .replace(/={1,2}$/, "");

    // Verify the payload and signature encodings against each other
    if (encoded_sig !== encoded_payload) return undefined;
    else return data;
  }
}
