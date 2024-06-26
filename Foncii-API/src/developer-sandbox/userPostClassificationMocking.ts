// Dependencies
// File System / CSV Parsing
import fs from "fs";
import csvParser from "csv-parser";

// Services
import UserService from "../business-logic/services/shared/users/userService";
import FonciiMapsPostService from "../business-logic/services/foncii-maps/user-posts/fmPostService";

// Logging
import logger from "../foncii-toolkit/debugging/debugLogger";

// Utilities
import { delay } from "../foncii-toolkit/utilities/scheduling";

// Instantiations
const userService = new UserService();
const userPostService = new FonciiMapsPostService();

export async function createShadowUserFor(userID: string) {
  return await userService.createShadowUserFor(userID);
}

/**
 * Copies posts from the original user to the shadow user and assigns restaurants to the
 * posts that need them from the csv file containing the post to restaurant classifications.
 * This is only for shadow users / testing scenarios, and shouldn't be used on real users.
 *
 * ex.) CSV file in the root directory pass in `filename.csv` for the csvFilePath param
 *
 * @async
 * @param originalUserID
 * @param shadowUserID
 * @param csvFilePath
 */
export async function runMockPostClassificationForShadowUser({
  originalUserID,
  shadowUserID,
  csvFilePath,
}: {
  originalUserID: string;
  shadowUserID: string;
  csvFilePath: string;
}) {
  const postIDToGooglePlaceIDMapping = await parseCSVIntoPIDToGPIDMapping(
    csvFilePath
  );
  await assignRestaurantsToMockPosts({
    originalUserID,
    shadowUserID,
    postIDToGooglePlaceIDMapping,
  });
}

/**
 * Assigns restaurants to the posts for the target user that lack a restaurant classification
 * based on the csv file containing the post to restaurant classifications. This is for live
 * users and should be used with caution.
 *
 * ex.) CSV file in the root directory pass in `filename.csv` for the csvFilePath param
 *
 * @async
 * @param originalUserID
 * @param csvFilePath
 */
export async function runPostClassificationForLiveUser({
  originalUserID,
  csvFilePath,
}: {
  originalUserID: string;
  csvFilePath: string;
}) {
  const postIDToGooglePlaceIDMapping = await parseCSVIntoPIDToGPIDMapping(
    csvFilePath
  );
  await assignRestaurantsToLivePosts({
    originalUserID,
    postIDToGooglePlaceIDMapping,
  });
}

async function parseCSVIntoPIDToGPIDMapping(
  csvFilePath: string
): Promise<{ [postID: string]: string[] }> {
  // Parse the CSV data
  const mapping: { [postID: string]: string[] } = {};

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on("data", (data: { postID: string; place_id: string }) => {
        const placeIDs = data.place_id
          .replaceAll("[", "")
          .replaceAll("]", "")
          .replaceAll(`'`, "")
          .split(",")
          .map((string) => string.trim())
          .filter(Boolean);

        placeIDs.forEach((placeID) => {
          if (!mapping[data.postID]) {
            // Init array of place IDs
            mapping[data.postID] = [placeID];
          } else {
            // Push ID into existing array
            mapping[data.postID].push(placeID);
          }
        });
      })
      .on("end", () => {
        resolve(mapping);
      })
      .on("error", (error: any) => {
        reject(error);
      });
  });
}

async function assignRestaurantsToMockPosts({
  originalUserID,
  shadowUserID,
  postIDToGooglePlaceIDMapping,
}: {
  originalUserID: string;
  shadowUserID: string;
  postIDToGooglePlaceIDMapping: { [postID: string]: string[] };
}) {
  const unclassifiedPosts = (
      await userPostService.findPostsWith({
        properties: {
          userID: originalUserID,
          fonciiRestaurantID: { $exists: false },
        },
        resultsPerPage: 0, // Unlimit, return all (not safe for very large amount of posts, but good for now, run locally though)
      })
    ),
    classifiedPosts = (
      await userPostService.findPostsWith({
        properties: {
          userID: originalUserID,
          fonciiRestaurantID: { $exists: true },
        },
        resultsPerPage: 0,
      })
    ),
    joinedPosts = [...new Set([...unclassifiedPosts, ...classifiedPosts])];

  const mockedPosts = await userPostService.joinMockPostsWithUser({
    posts: joinedPosts,
    userID: shadowUserID,
  });

  // Synchronously update each entry to prevent Google Place API timeouts
  mockedPosts.forEach(async (post) => {
    const postID = post.id,
      permalink = post.dataSource?.permalink ?? "",
      originalPostID = Object.keys(postIDToGooglePlaceIDMapping).find(
        (postID) => permalink.includes(postID)
      ),
      googlePlaceIDs = originalPostID
        ? postIDToGooglePlaceIDMapping[originalPostID]
        : [];

    // Only update the associated restaurant if the associated google place IDs and original post ID are available
    if (googlePlaceIDs.length > 0) {
      googlePlaceIDs.forEach(async (googlePlaceID, index) => {
        if (index == 0) {
          // Original post
          await userPostService.updateAssociatedRestaurantData({
            postID,
            googlePlaceID,
          });
        } else {
          // Duplicate the original post and assign the other restaurant IDs to the duplicate / child post
          const duplicatePost = await userPostService.duplicateFMPost(postID),
            duplicatePostID = duplicatePost?.id;

          if (duplicatePostID) {
            await userPostService.updateAssociatedRestaurantData({
              postID: duplicatePostID,
              googlePlaceID,
            });
          }
        }

        // 0.1 Second delay to prevent API timeouts
        await delay(async () => {}, 100);
      });

      // 0.1 Second delay to prevent API timeouts
      await delay(async () => {}, 100);
    }
  });

  logger.info("[assignRestaurantsToMockPosts] Finished");
}

async function assignRestaurantsToLivePosts({
  originalUserID,
  postIDToGooglePlaceIDMapping,
}: {
  originalUserID: string;
  postIDToGooglePlaceIDMapping: { [postID: string]: string[] };
}) {
  const unclassifiedPosts = (
    await userPostService.findPostsWith({
      properties: {
        userID: originalUserID,
        fonciiRestaurantID: { $exists: false },
      },
      resultsPerPage: 0, // Unlimit, return all (not safe for very large amount of posts, but good for now, run locally though)
    })
  );

  // Synchronously update each entry to prevent Google Place API timeouts
  unclassifiedPosts.forEach(async (post) => {
    const postID = post.id,
      permalink = post.dataSource?.permalink ?? "",
      liveSourceUID = post.dataSource?.liveSourceUID,
      originalPostID = Object.keys(postIDToGooglePlaceIDMapping).find(
        (postID) => permalink.includes(postID) || postID == liveSourceUID
      ),
      googlePlaceIDs = originalPostID
        ? postIDToGooglePlaceIDMapping[originalPostID]
        : [];

    // Only update the associated restaurant if the associated google place IDs and original post ID are available
    if (googlePlaceIDs.length > 0) {
      googlePlaceIDs.forEach(async (googlePlaceID, index) => {
        if (index == 0) {
          // Original post
          await userPostService.updateAssociatedRestaurantData({
            postID,
            googlePlaceID,
          });
        } else {
          // Duplicate the original post and assign the other restaurant IDs it to the duplicate / child post
          const duplicatePost = await userPostService.duplicateFMPost(postID),
            duplicatePostID = duplicatePost?.id;

          if (duplicatePostID) {
            await userPostService.updateAssociatedRestaurantData({
              postID: duplicatePostID,
              googlePlaceID,
            });
          }
        }

        // 0.1 Second delay to prevent API timeouts
        await delay(async () => {}, 100);
      });

      // 0.1 Second delay to prevent API timeouts
      await delay(async () => {}, 100);
    }
  });

  logger.info("[assignRestaurantsToLivePosts] Finished");
}
