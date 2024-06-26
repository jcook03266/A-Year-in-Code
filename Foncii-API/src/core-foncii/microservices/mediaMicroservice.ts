// Dependencies
// Inheritance
import FonciiMicroservice from "./protocol/fonciiMicroservice";

// Types
import { SupportedFonciiPlatforms } from "../../types/namespaces/microservice-api";

// Networking
import fetch from "node-fetch";

// Logging
import logger from "../../foncii-toolkit/debugging/debugLogger";

// TODO: - Migrate user profile picture uploads to the client
/**
 * Responsible for uploading/downloading video and image media across Foncii
 * and any other supported Foncii platform.
 */
export default class MediaMicroservice extends FonciiMicroservice {
  /**
   * Uploads any required user post media for the specified user. This is not for uploading
   * individual files, it's for downloading and storing imported post media. Individual files
   * are uploaded from the client due to HTTP file size limits, and then their updated media
   * properties are sent to the backend to be updated in the database instead of passing the
   * whole file to the API. Albeit client side uploads are more efficient than uploading the same media
   * twice.
   *
   * Note: This is a long running task so waiting for its resolution is not possible.
   *
   * @async
   * @param userID - The Foncii user to upload any required user post media for. This process is long lasting
   * so this microservice will spin up and handle each request as they come and go. This specific service does not support concurrency
   * as handling multiple long lasting tasks will impede on the experience of other users, it makes more sense to spin up more cloud function instances
   * as needed.
   */
  async uploadUserPostMediaFor(userID: string) {
    const requestMethod = "POST",
      jsonDataString = JSON.stringify({
        userID,
      });

    fetch(this.serviceEndpoints.MediaService.UploadUserPostMedia, {
      method: requestMethod,
      headers: this.sharedHeader,
      body: jsonDataString,
    });

    logger.info("[uploadUserPostMediaFor] Invoked");
  }

  /**
   * Triggers the deletion of the media files associated with the post with the given ID.
   * The post ID must be a parent post's ID as child posts don't have custom media
   * files uploaded for them. When deleting child posts make sure to use their parent ID
   * and make sure no other dependencies exist for the media referenced by the post at hand.
   *
   * @async
   * @param userID -> ID of the user the post belongs to, to verify the integrity of this request
   * @param postID -> ID of the post to delete all media for (has to be a parent post)
   */
  async deleteUserPostMediaFor({
    userID,
    postID,
  }: {
    userID: string;
    postID: string;
  }) {
    const requestMethod = "POST",
      jsonDataString = JSON.stringify({
        userID,
        postID,
      });

    fetch(this.serviceEndpoints.MediaService.DeleteUserPostMedia, {
      method: requestMethod,
      headers: this.sharedHeader,
      body: jsonDataString,
    });

    logger.info("[deleteUserPostMediaFor] Invoked");
  }

  /**
   * Triggers the deletion of all media files for the user with the given ID.
   * This is suitable for account deletions. It's a long running process and will
   * resolve asynchronously. When deleting a user's account this process will
   * probably still be running after their account is deleted. This is highly
   * destructive and shouldn't be used outside of a secure internal process.
   *
   * @async
   * @param userID -> ID of the user to delete all post media for.
   */
  async deleteAllUserPostMediaFor(userID: string) {
    const requestMethod = "POST",
      jsonDataString = JSON.stringify({
        userID,
      });

    fetch(this.serviceEndpoints.MediaService.DeleteAllUserPostMedia, {
      method: requestMethod,
      headers: this.sharedHeader,
      body: jsonDataString,
    });

    logger.info("[deleteAllUserPostMediaFor] Invoked");
  }

  /**
   * Updates the profile picture for the specified user. This endpoint can be used across multiple
   * Foncii platforms (Foncii and Foncii Biz) by simply passing in the platform identifier. Undefined to delete,
   * defined UInt8Array to update the profile picture. Only PNG and JPEG/JPG types are allowed; these limitations
   * are strictly enforced within the media service so don't worry about that here.
   *
   * Note: No encoded file buffer data allowed, the buffer string is passed to the endpoint as is.
   *
   * @async
   * @param userID -> Platform agnostic id of the user to upload the profile picture for.
   * @param platform -> The Foncii platform to which the provided user belongs to
   * @param fileDataBufferString -> Raw decimal array formatted binary data of the file to upload in string form, do not encode
   * this data before passing it to the endpoint, only raw data is permissible. Pass in undefined if deletion of the user's media is
   * intended.
   *
   * @returns -> True if upload was successful (status code 200 or 201 etc.), false otherwise.
   */
  async setUserProfilePicture(
    userID: string,
    platform: SupportedFonciiPlatforms,
    fileDataBufferString?: string
  ): Promise<Boolean> {
    const requestMethod = "POST",
      fileDataBufferField = fileDataBufferString
        ? { fileDataBuffer: fileDataBufferString }
        : null,
      jsonDataString = JSON.stringify({
        userID,
        platform,
        ...fileDataBufferField,
      });

    logger.info("[setUserProfilePicture] Invoked");

    const response = await fetch(
        this.serviceEndpoints.MediaService.SetUserProfilePicture,
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
   * Uploads a profile picture image for the user from the given image URL.
   *
   * @async
   * @param userID
   * @param platform
   * @param imageURL -> The URL of the image to download and upload to Foncii for the specified user
   *
   * @returns -> True if upload was successful (status code 200 or 201 etc.), false otherwise.
   */
  async setUserProfilePictureFromURL(
    userID: string,
    platform: SupportedFonciiPlatforms,
    imageURL: string
  ): Promise<Boolean> {
    const requestMethod = "POST",
      jsonDataString = JSON.stringify({
        userID,
        platform,
        imageURL,
      });

    logger.info("[setUserProfilePictureFromURL] Invoked");

    const response = await fetch(
        this.serviceEndpoints.MediaService.SetUserProfilePictureFromURL,
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
