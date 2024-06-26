// Dependencies
// Services
import { FonciiAPIClientAdapter } from "../foncii-api/adapters/fonciiAPIClientAdapter";
import CloudStorageServiceAdapter from "./service-adapters/cloudStorageServiceAdapter";

// App Properties
import { nonProductionEnvironment } from "../../core-foncii-maps/properties/AppProperties";

// Utils
import { UnitsOfTimeInMS } from "../../utilities/common/time";

/**
 * Client based media service responsible for uploading media (large or small)
 * directly to our file storage service provider (Google Cloud). Before we
 * relied on cloud functions and external media service functionality, but a
 * bottleneck occurred; the API can't support requests larger than 10MB or so,
 * so this is the obvious solution.
 *
 * This service essentially functions like this: Upload a file directly from the client, and then update
 * the associated information in the database with a regular API call instead of passing the file to a
 * separate service to be uploaded and then updating in the database.
 */
export default class MediaService {
  // Services
  private cloudStorageService = new CloudStorageServiceAdapter();
  private apiService = new FonciiAPIClientAdapter();

  // User Post Media
  /**
   * Updates the post's media in the cloud storage bucket, and updates the post's record in the database
   * with new permalink(s) (if uploading, removed if media is deleted).
   *
   * @async
   * @param userID
   * @param postID
   * @param mediaFileDataBuffer (Optional) Left undefined if the desired media file(s) should be removed from storage
   * @param videoThumbnailFileDataBuffer (Optional) Only required if the file being uploaded is a video
   *
   * @returns -> True if the post's media was updated successfully across all mediums, false otherwise.
   */
  async updatePostMedia({
    userID,
    postID,
    mediaFileDataBuffer,
    videoThumbnailFileDataBuffer,
  }: {
    userID: string;
    postID: string;
    mediaFileDataBuffer?: Uint8Array | undefined;
    videoThumbnailFileDataBuffer?: Uint8Array | undefined;
  }): Promise<boolean> {
    // File Deletion
    if (mediaFileDataBuffer == undefined) {
      return await this.setPostMedia({ userID, postID });
    }

    // Input Validation
    // If the input is neither a valid image or video of a supported type then fail gracefully
    if (
      !CloudStorageServiceAdapter.isUserPostVideoMediaValid(
        mediaFileDataBuffer
      ) &&
      !CloudStorageServiceAdapter.isUserPostImageMediaValid(mediaFileDataBuffer)
    ) {
      return false;
    }

    // Image / Video Media
    let fileDataBufferToUpload: Uint8Array | undefined = mediaFileDataBuffer;

    // Media Type Branching
    const mediaIsVideo =
      CloudStorageServiceAdapter.isUserPostVideoMediaValid(mediaFileDataBuffer);

    // Conversion / Optimization
    if (!mediaIsVideo) {
      fileDataBufferToUpload = mediaFileDataBuffer;

      return await this.setPostMedia({
        userID,
        postID,
        mediaFileDataBuffer: fileDataBufferToUpload,
      });
    } else {
      // Thumbnail image required for video media uploads, fail if none provided
      if (!videoThumbnailFileDataBuffer) return false;

      const videoThumbnailFileDataBufferToUpload = videoThumbnailFileDataBuffer;

      return await this.setPostMedia({
        userID,
        postID,
        mediaFileDataBuffer: fileDataBufferToUpload,
        videoThumbnailFileDataBuffer: videoThumbnailFileDataBufferToUpload,
      });
    }
  }

  /**
   * A passthrough function for updating the post's media in the cloud storage bucket
   * via the cloud storage service, and updating its record in the database via the
   * database service.
   *
   * @async
   * @param userID
   * @param postID
   * @param mediaFileDataBuffer (Optional) Left undefined if the desired media file(s) should be removed from storage
   * @param videoThumbnailFileDataBuffer (Optional) Only required if the file being uploaded is a video
   *
   * @returns -> True if the post's media was updated successfully in the cloud storage bucket, false otherwise.
   */
  private async setPostMedia({
    userID,
    postID,
    mediaFileDataBuffer,
    videoThumbnailFileDataBuffer,
  }: {
    userID: string;
    postID: string;
    mediaFileDataBuffer?: Uint8Array | undefined;
    videoThumbnailFileDataBuffer?: Uint8Array | undefined;
  }): Promise<boolean> {
    // Logging Metrics
    let startTime: number = Date.now(),
      elapsedTime: number;

    const { operationSucceeded, media } =
      await this.cloudStorageService.updatePostMedia({
        userID,
        postID,
        mediaFileDataBuffer,
        videoThumbnailFileDataBuffer,
      });

    // Update the post data in the DB
    if (operationSucceeded && media) {
      await this.apiService.performUpdatePostMedia({
        userInput: {
          userID,
          postID,
        },
        mediaInput: media,
      });
    }

    // Metrics
    elapsedTime = (Date.now() - startTime) / UnitsOfTimeInMS.second; // In seconds [s]

    if (nonProductionEnvironment) {
      operationSucceeded
        ? console.info(
            `\nPost Media Update Complete. \nTime Elapsed: ${elapsedTime}[s]`
          )
        : console.info(
            `\nPost Media Update Failed. \nTime Elapsed: ${elapsedTime}[s]`
          );
    }

    return operationSucceeded;
  }
}
