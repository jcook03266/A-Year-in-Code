import { CloudStorageService } from '../cloudStorageService.js';
export declare class FonciiCloudStorageServiceAdapter extends CloudStorageService {
    /**
     * Updates the file data associated with the specified user's profile picture.
     * If adding a new profile picture or updating a previous one, pass in a defined array
     * of Uint8 bytes; if removing a profile picture, pass undefined.
     *
     * @async
     * @param fileDataBuffer -> Array of Uint8 bytes representing the file's data, or undefined if a file deletion is required
     * @param userID -> The unique UID to use for the file to prevent
     * multiple profile pictures from being associated with the same user.
     *
     * @returns -> Returns the URL String of the uploaded file
     * if the file upload was successful, or undefined if the upload failed.
     */
    updateUserProfilePicture(fileDataBuffer: Uint8Array | undefined, userID: string): Promise<UserProfilePictureUpdateResponse>;
    /**
     * Supports uploading any media from a Foncii Maps post to the
     * Foncii Cloud Storage bucket subdirectory where it's then referenced by the post's UUID.
     *
     * @async
     * @param url -> The URL of the expirable content served by the Instagram CDN (content-distribution-network)
     * to be uploaded and stored permanently in our dedicated storage bucket
     * @param postID -> The ID of the post to which the following media belongs to that will also be used
     * as the identifier for this file
     *
     * @returns -> Returns the URL String of the uploaded file
     * if the file upload was successful, or undefined if the upload failed.
     */
    uploadFMPostMedia(url: string | undefined, postID: string | undefined, userID: string | undefined): Promise<string | undefined>;
    /**
     * Uploads thumbnail images for video content to the Foncii Cloud Storage
     * bucket subdirectory where it's then referenced by the post's UUID. Loading thumbnails
     * instead of full videos offers an obvious performance benefit.
     *
     * @async
     * @param url -> The URL of the video's expirable Instagram thumbnail image to be uploaded and stored
     *  permanently in our dedicated storage bucket
     * @param postID -> The ID of the post to which the following media belongs to that will also be used
     * as the identifier for this file
     *
     * @returns -> Returns the URL String of the uploaded file
     * if the file upload was successful, or undefined if the upload failed.
     */
    uploadFMPostVideoThumbnailMedia(url: string | undefined, postID: string | undefined, userID: string | undefined): Promise<string | undefined>;
}
