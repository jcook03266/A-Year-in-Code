import { CloudStorageService } from '../cloudStorageService.js';
import * as common from '../../../types/common.js';
export declare class FonciiCloudStorageServiceAdapter extends CloudStorageService {
    private static USER_PROFILE_PICTURE_MEDIA_MAX_SIZE;
    private static USER_POST_IMAGE_MEDIA_MAX_SIZE;
    private static USER_POST_VIDEO_MEDIA_MAX_SIZE;
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
    updateUserProfilePicture(fileDataBuffer: Uint8Array | undefined, userID: string): Promise<MediaUpdateResponse>;
    /**
     * Updates (uploads / deletes) the media for the post with the given id belonging to the user
     * with the provided user ID using the given file data (video or image), alongside any thumbnail
     * for video media.
     *
     * @param userID
     * @param fileName -> The ID of the post to which the following media belongs to that will also be used
     * as the identifier for this file, or some other meaningful name. Can also be an incremented post ID in the case of
     * secondary media uploads.
     * @param mediaFileDataBuffer (Required) Optimized and or validated media file data
     * @param videoThumbnailFileDataBuffer (Optional) only required when uploading video media data; its
     * presence implies the media file being uploaded is a video, and vice versa for images. The thumbnail image
     * data is validated, optimized and or validated before being passed to this method; same with the main
     * media file data
     *
     * @returns -> A response containing the outcome of the update (upload / deletion) and the resulting
     * post media object containing required urls and metadata.
     */
    updatePostMedia({ userID, fileName, mediaFileDataBuffer, videoThumbnailFileDataBuffer }: {
        userID: string;
        fileName: string;
        mediaFileDataBuffer?: Uint8Array | undefined;
        videoThumbnailFileDataBuffer?: Uint8Array | undefined;
    }): Promise<PostMediaUpdateResponse>;
    /**
     * Deletes all of the media associated with the given post, including
     * thumbnails (regardless if the media is an image or video)
     *
     * @async
     * @param userID
     * @param fileName -> The ID of the post to which the following media belongs to that will also be used
     * as the identifier for this file, or some other meaningful name. Can also be an incremented post ID in the case of
     * secondary media uploads.
     *
     * @returns -> True if the deletion was successful, false otherwise (exclusive of thumbnail deletion result)
     */
    deleteMediaForFMPost({ userID, fileName }: {
        userID: string;
        fileName: string;
    }): Promise<boolean>;
    /**
     * Deletes all user post media uploaded by the user with the specified user ID
     * including thumbnails.
     *
     * @async
     * @param userID
     *
     * @returns -> True if the deletion was successful, false otherwise
     */
    deleteAllFMPostMedia(userID: string): Promise<boolean>;
    /**
     * Supports uploading any media from a Foncii Maps post to the
     * Foncii Cloud Storage bucket subdirectory where it's then referenced by the post's UUID.
     *
     * @async
     * @param url -> The URL of the expirable content served by the Instagram CDN (content-distribution-network)
     * to be uploaded and stored permanently in our dedicated storage bucket
     * @param fileName -> The ID of the post to which the following media belongs to that will also be used
     * as the identifier for this file, or some other meaningful name. Can also be an incremented post ID in the case of
     * secondary media uploads.
     *
     * @returns -> Returns the URL String of the uploaded file
     * if the file upload was successful, or undefined if the upload failed.
     */
    uploadFMPostMediaFromURL(url: string | undefined, fileName: string | undefined, userID: string | undefined): Promise<string | undefined>;
    /**
     * Uploads thumbnail images for video content to the Foncii Cloud Storage
     * bucket subdirectory where it's then referenced by the post's UUID. Loading thumbnails
     * instead of full videos offers an obvious performance benefit.
     *
     * @async
     * @param url -> The URL of the video's expirable Instagram thumbnail image to be uploaded and stored
     *  permanently in our dedicated storage bucket
     * @param fileName -> The ID of the post to which the following media belongs to that will also be used
     * as the identifier for this file, or some other meaningful name. Can also be an incremented post ID in the case of
     * secondary media uploads.
     *
     * @returns -> Returns the URL String of the uploaded file
     * if the file upload was successful, or undefined if the upload failed.
     */
    uploadFMPostVideoThumbnailMedia(url: string | undefined, fileName: string | undefined, userID: string | undefined): Promise<string | undefined>;
    static isProfilePictureMediaInJPEGFormat(fileDataBuffer: Uint8Array | undefined): boolean;
    static isProfilePictureMediaValid(fileDataBuffer: Uint8Array | undefined): boolean;
    static isImageMediaInJPEGFormat(fileDataBuffer: Uint8Array | undefined): boolean;
    static isImageMediaInPNGFormat(fileDataBuffer: Uint8Array | undefined): boolean;
    static isUserPostImageMediaValid(fileDataBuffer: Uint8Array | undefined): boolean;
    /**
     * MP4 files typically start with the hexadecimal sequence 00 00 00 18 66 74 79 70 in their file headers.
     *
     * @param fileDataBuffer
     *
     * @returns -> True if the file data buffer is of type MP4, false otherwise.
     */
    static isVideoMediaInMP4Format(fileDataBuffer: Uint8Array | undefined): boolean;
    static isVideoMediaInQuickTimeFormat(fileDataBuffer: Uint8Array | undefined): boolean;
    /**
     * @param fileDataBuffer
     *
     * @returns -> A supported content type of the video media, or undefined if the file data buffer is undefined / of an unsupported content type.
     */
    static determineSupportedVideoMediaContentType(fileDataBuffer: Uint8Array | undefined): common.SupportedFonciiMapsPostContentTypes | undefined;
    /**
     * @param fileDataBuffer
     *
     * @returns -> A supported content type of the image media, or undefined if the file data buffer is undefined / of an unsupported content type.
     */
    static determineSupportedImageMediaContentType(fileDataBuffer: Uint8Array | undefined): common.SupportedFonciiMapsPostContentTypes | undefined;
    static isUserPostVideoMediaValid(fileDataBuffer: Uint8Array | undefined): boolean;
}
