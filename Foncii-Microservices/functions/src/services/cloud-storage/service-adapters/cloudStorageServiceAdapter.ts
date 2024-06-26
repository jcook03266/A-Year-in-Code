// Dependencies
// Types
import { PostMediaTypes } from '../../../__generated__/graphql.js';

// Logging
import { logger } from '../../logging/debugLoggingService.js';

// Services
import { CloudStorageService } from '../cloudStorageService.js';

// Namespace Declarations
import * as common from '../../../types/common.js';

// Utilities
import { encodeStringToURLSafeBase64 } from '../../../foncii-toolkit/utilities/convenienceUtilities.js';

export class FonciiCloudStorageServiceAdapter extends CloudStorageService {
    // Media Limitations
    private static USER_PROFILE_PICTURE_MEDIA_MAX_SIZE = 4 * 1024 * 1024; // 4MB, images
    private static USER_POST_IMAGE_MEDIA_MAX_SIZE = 30 * 1024 * 1024; // 30MB, images / video thumbnails
    private static USER_POST_VIDEO_MEDIA_MAX_SIZE = 200 * 1024 * 1024; // 200MB, videos

    // Shared
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
    async updateUserProfilePicture(
        fileDataBuffer: Uint8Array | undefined,
        userID: string
    ): Promise<MediaUpdateResponse> {
        const contentType = common.FileContentTypes.jpg,
            fileName = userID + Date.now().toString(), // UID + Timestamp allows for frequent client side changes of this object as the URL changes
            filePath = this.createFilePathFor(
                common.DefaultCSBucketSubdirectories.foncii,
                [common.FonciiSubdirectories.media,
                common.FonciiSubdirectories.userGeneratedMedia,
                    userID, // Each folder belongs to a unique user to simplify deleting user data when needed
                common.FonciiSubdirectories.profilePicture
                ],
                fileName
            );

        // Update Operation Branching Logic
        let didUploadSucceed: boolean,
            didDeletionSucceed: boolean;

        // Delete any objects in the folder prior to any upload as only one image is supposed to 
        // occupy the profile picture folder.
        const folderPath = this.createFolderPathFor(
            common.DefaultCSBucketSubdirectories.foncii,
            [common.FonciiSubdirectories.media,
            common.FonciiSubdirectories.userGeneratedMedia,
                userID, // Each folder belongs to a unique user to simplify deleting user data when needed
            common.FonciiSubdirectories.profilePicture
            ]
        );

        // Delete the entire folder to remove the unique profile picture URL without directly referencing it
        didDeletionSucceed = await this.deleteFolder(folderPath);

        if (fileDataBuffer != undefined) {
            // Upload
            didUploadSucceed = await this.uploadFile(
                filePath,
                contentType,
                fileDataBuffer,
                common.SimpleCacheControlPolicies.noCache
            );

            // Construct the permalink URL for the uploaded file
            const encodedFilePath = encodeStringToURLSafeBase64(filePath),
                permalinkURL = this.generatePermalinkToFile(encodedFilePath);

            return {
                operationSucceeded: didUploadSucceed,
                permalinkURL: permalinkURL
            }
        }
        else {
            return {
                operationSucceeded: didDeletionSucceed,
                permalinkURL: undefined
            }
        }
    }

    // Foncii Maps
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
    async updatePostMedia({
        userID,
        fileName,
        mediaFileDataBuffer,
        videoThumbnailFileDataBuffer
    }: {
        userID: string,
        fileName: string,
        mediaFileDataBuffer?: Uint8Array | undefined,
        videoThumbnailFileDataBuffer?: Uint8Array | undefined
    }): Promise<PostMediaUpdateResponse> {
        // Update Operation Branching Results
        let didUploadSucceed: boolean,
            didDeletionSucceed: boolean;

        // Parsing
        const mediaIsVideo = videoThumbnailFileDataBuffer != undefined;

        // File Paths
        // Thumbnail
        const videoThumbnailFilePath = this.createFilePathFor(
            common.DefaultCSBucketSubdirectories.fonciiMaps,
            [common.FonciiMapsSubdirectories.media,
            common.FonciiMapsSubdirectories.userGeneratedMedia,
                userID,
            common.FonciiMapsSubdirectories.posts,
            common.FonciiMapsSubdirectories.thumbnails],
            fileName
        );

        // Main Media
        const mediaFilePath = this.createFilePathFor(
            common.DefaultCSBucketSubdirectories.fonciiMaps,
            [common.FonciiMapsSubdirectories.media,
            common.FonciiMapsSubdirectories.userGeneratedMedia,
                userID,
            common.FonciiMapsSubdirectories.posts],
            fileName
        );

        if (mediaFileDataBuffer != undefined) {
            // Video Media Thumbnail Image Upload
            if (mediaIsVideo) {
                await this.uploadFile(
                    videoThumbnailFilePath,
                    common.FileContentTypes.jpg,
                    videoThumbnailFileDataBuffer,
                )
            }

            // Main Media Upload
            const contentType = mediaIsVideo ? FonciiCloudStorageServiceAdapter.determineSupportedVideoMediaContentType(mediaFileDataBuffer)
                : FonciiCloudStorageServiceAdapter.determineSupportedImageMediaContentType(mediaFileDataBuffer);

            didUploadSucceed = await this.uploadFile(
                mediaFilePath,
                contentType,
                mediaFileDataBuffer
            )

            // Construct the permalink URL for the uploaded file
            const encodedMediaFilePath = encodeStringToURLSafeBase64(mediaFilePath),
                mediaPermalinkURL = this.generatePermalinkToFile(encodedMediaFilePath),
                encodedVideoThumbnailFilePath = encodeStringToURLSafeBase64(videoThumbnailFilePath),
                thumbnailPermalinkURL = mediaIsVideo ? this.generatePermalinkToFile(encodedVideoThumbnailFilePath) : undefined;

            return {
                operationSucceeded: didUploadSucceed,
                media: didUploadSucceed ? {
                    mediaType: mediaIsVideo ? PostMediaTypes.Video : PostMediaTypes.Image,
                    mediaURL: mediaPermalinkURL,
                    videoMediaThumbnailURL: thumbnailPermalinkURL
                } : undefined
            };
        }
        else {
            didDeletionSucceed = await this.deleteMediaForFMPost({ userID, fileName });

            return {
                operationSucceeded: didDeletionSucceed,
                media: undefined
            };
        }
    }

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
    async deleteMediaForFMPost({
        userID,
        fileName
    }: { userID: string, fileName: string }): Promise<boolean> {
        // Video Media Deletion
        // Thumbnail
        const thumbnailFilePath = this.createFilePathFor(
            common.DefaultCSBucketSubdirectories.fonciiMaps,
            [common.FonciiMapsSubdirectories.media,
            common.FonciiMapsSubdirectories.userGeneratedMedia,
                userID,
            common.FonciiMapsSubdirectories.posts,
            common.FonciiMapsSubdirectories.thumbnails,
            ],
            fileName
        );

        await this.deleteFile(thumbnailFilePath);

        // Main Media
        const mediaFilePath = this.createFilePathFor(
            common.DefaultCSBucketSubdirectories.fonciiMaps,
            [common.FonciiMapsSubdirectories.media,
            common.FonciiMapsSubdirectories.userGeneratedMedia,
                userID,
            common.FonciiMapsSubdirectories.posts,
            ],
            fileName
        );

        return await this.deleteFile(mediaFilePath);
    }

    /**
     * Deletes all user post media uploaded by the user with the specified user ID
     * including thumbnails.
     * 
     * @async
     * @param userID 
     * 
     * @returns -> True if the deletion was successful, false otherwise
     */
    async deleteAllFMPostMedia(userID: string): Promise<boolean> {
        // All Main User Post Media (Videos and Images) + Video Media Thumbnails
        const postMediaFolderPath = this.createFolderPathFor(
            common.DefaultCSBucketSubdirectories.fonciiMaps,
            [common.FonciiMapsSubdirectories.media,
            common.FonciiMapsSubdirectories.userGeneratedMedia,
                userID]
        );

        return await this.deleteFolder(postMediaFolderPath);
    }

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
    async uploadFMPostMediaFromURL(
        url: string | undefined,
        fileName: string | undefined,
        userID: string | undefined
    ): Promise<string | undefined> {
        // Precondition failure
        if (url == undefined || fileName == undefined || userID == undefined) { return; }

        const fileData = await this.downloadFileDataFrom(url),
            fileDataBuffer = fileData ? fileData.fileDataBuffer : undefined,
            contentType = fileData?.contentType ?? '',
            isContentTypeSupported = Object.values<string>(common.SupportedFonciiMapsPostContentTypes).includes(contentType);

        // The wrong type of file was downloaded (usually .txt indicating some XML file due to an expired source media URL)
        if (!isContentTypeSupported) {
            logger.error(`[uploadFMPostMediaFromURL] A file located at ${url} with the file name ${fileName}, produced a file download with an unexpected type of ${contentType}.`);
            return undefined;
        }

        // Early exception handling in case the file can't be downloaded
        if (!fileData) {
            logger.error(`[uploadFMPostMediaFromURL] A file located at ${url} with the file name ${fileName}, failed to download`);
            return undefined;
        }

        /// Example: foncii-maps/media/user-generated-media/123456/posts/A1z29282...
        /// Organizing media like this makes deletions easier in the long run by enabling folder based deletions
        const filePath = this.createFilePathFor(
                common.DefaultCSBucketSubdirectories.fonciiMaps,
                [common.FonciiMapsSubdirectories.media,
                common.FonciiMapsSubdirectories.userGeneratedMedia,
                    userID,
                common.FonciiMapsSubdirectories.posts,
                ],
                fileName
            );

        const didUpload = await this.uploadFile(filePath, contentType, fileDataBuffer);

        // Construct the permalink URL for the uploaded file
        const encodedFilePath = encodeStringToURLSafeBase64(filePath),
            permalinkURL = this.generatePermalinkToFile(encodedFilePath);

        return didUpload ? permalinkURL : undefined;
    }

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
    async uploadFMPostVideoThumbnailMedia(
        url: string | undefined,
        fileName: string | undefined,
        userID: string | undefined
    ): Promise<string | undefined> {
        // Precondition failure
        if (url == undefined || fileName == undefined || userID == undefined) { return; }

        const fileData = await this.downloadFileDataFrom(url),
            fileDataBuffer = fileData ? fileData.fileDataBuffer : undefined,
            contentType = fileData?.contentType ?? '',
            isContentTypeSupported = Object.values<string>(common.SupportedFonciiMapsPostContentTypes).includes(contentType);

        // The wrong type of file was downloaded (usually .txt indicating some XML file due to an expired source media URL)
        if (!isContentTypeSupported) {
            logger.error(`[uploadFMPostVideoThumbnailMedia] A file located at ${url} with the file name ${fileName}, produced a file download with an unexpected type of ${contentType}`);
            return undefined;
        }

        // Early exception handling in case the file can't be downloaded
        if (!fileData) {
            logger.error(`[uploadFMPostVideoThumbnailMedia] A file located at ${url} with the file name ${fileName}, failed to download`);
            return undefined;
        }

        /// Example: foncii-maps/media/user-generated-media/123456/posts/thumbnails/A1z29282...
        /// Organizing media like this makes deletions easier in the long run by enabling folder based deletions
        const filePath = this.createFilePathFor(
                common.DefaultCSBucketSubdirectories.fonciiMaps,
                [common.FonciiMapsSubdirectories.media,
                common.FonciiMapsSubdirectories.userGeneratedMedia,
                    userID,
                common.FonciiMapsSubdirectories.posts,
                common.FonciiMapsSubdirectories.thumbnails,
                ],
                fileName
            );

        const didUpload = await this.uploadFile(filePath, contentType, fileDataBuffer);

        // Construct the permalink URL for the uploaded file
        const encodedFilePath = encodeStringToURLSafeBase64(filePath),
            permalinkURL = this.generatePermalinkToFile(encodedFilePath);

        return didUpload ? permalinkURL : undefined;
    }

    // Media Validation Handlers
    // Shared
    static isProfilePictureMediaInJPEGFormat(fileDataBuffer: Uint8Array | undefined): boolean {
        if (fileDataBuffer == undefined) {
            logger.error("This profile picture upload's file data is not defined and cannot be resolved.");
            return false;
        }

        // Certify that the file format is of JPEG/JPG using the magic numbers
        return (fileDataBuffer[0] === 0xFF && fileDataBuffer[1] === 0xD8);
    }

    static isProfilePictureMediaValid(fileDataBuffer: Uint8Array | undefined): boolean {
        if (fileDataBuffer == undefined) {
            logger.error("This profile picture upload's file data is not defined and cannot be resolved.");
            return false;
        }

        // Validate the file format
        const fileType = this.determineSupportedImageMediaContentType(fileDataBuffer);

        // Requirements
        const fileSizeLimitFulfilled = fileDataBuffer.length <= this.USER_PROFILE_PICTURE_MEDIA_MAX_SIZE,
            fileTypeSupported = fileType == common.SupportedFonciiMapsPostContentTypes.jpg || fileType == common.SupportedFonciiMapsPostContentTypes.png;

        if (!fileSizeLimitFulfilled) {
            logger.error("This profile picture upload exceeds the file size limit and cannot be resolved.");
        }
        else if (!fileTypeSupported) {
            logger.error("This profile picture upload is not a valid JPEG or PNG file and cannot be resolved.");
        }

        return fileSizeLimitFulfilled && fileTypeSupported;
    }

    // Foncii Maps
    // Supported Image Format Validators
    static isImageMediaInJPEGFormat(fileDataBuffer: Uint8Array | undefined): boolean {
        if (fileDataBuffer == undefined) {
            return false;
        }

        // Certify that the file format is of JPEG/JPG using the magic numbers
        return fileDataBuffer[0] === 0xFF && fileDataBuffer[1] === 0xD8;
    }

    static isImageMediaInPNGFormat(fileDataBuffer: Uint8Array | undefined): boolean {
        if (fileDataBuffer == undefined) {
            return false;
        }

        // Certify that the file format is of PNG using the magic numbers
        return fileDataBuffer[0] === 0x89 && fileDataBuffer[1] === 0x50 && fileDataBuffer[2] === 0x4E && fileDataBuffer[3] === 0x47;
    }

    static isUserPostImageMediaValid(fileDataBuffer: Uint8Array | undefined): boolean {
        if (fileDataBuffer == undefined) {
            return false;
        }

        // Validate the file format
        const fileType = this.determineSupportedImageMediaContentType(fileDataBuffer);

        // Requirements
        const fileSizeLimitFulfilled = fileDataBuffer.length <= this.USER_POST_IMAGE_MEDIA_MAX_SIZE,
            fileTypeSupported = fileType == common.SupportedFonciiMapsPostContentTypes.jpg || fileType == common.SupportedFonciiMapsPostContentTypes.png;

        if (!fileSizeLimitFulfilled) {
            logger.error("This profile picture upload exceeds the file size limit and cannot be resolved.");
        }
        else if (!fileTypeSupported) {
            logger.error("This profile picture upload is not a valid JPEG or PNG file and cannot be resolved.");
        }

        return fileSizeLimitFulfilled && fileTypeSupported;
    }

    // Supported Video Format Validators
    /**
     * MP4 files typically start with the hexadecimal sequence 00 00 00 18 66 74 79 70 in their file headers.
     * 
     * @param fileDataBuffer 
     * 
     * @returns -> True if the file data buffer is of type MP4, false otherwise.
     */
    static isVideoMediaInMP4Format(fileDataBuffer: Uint8Array | undefined): boolean {
        if (fileDataBuffer == undefined) {
            logger.error("This user post video upload's file data is not defined and cannot be resolved.");
            return false;
        }

        // Certify that the file format is of MP4 using the magic numbers
        // Check for MP4/MPEG-4 magic numbers
        const MP4MagicNumbers = [0x66, 0x74, 0x79, 0x70]; // [ 'f', 't', 'y', 'p' ]
        for (let i = 0; i < MP4MagicNumbers.length; i++) {
            if (fileDataBuffer[i + 4] !== MP4MagicNumbers[i]) {
                return false;
            }
        }

        return true;
    }

    static isVideoMediaInQuickTimeFormat(fileDataBuffer: Uint8Array | undefined): boolean {
        if (fileDataBuffer == undefined) {
            logger.error("This user post video upload's file data is not defined and cannot be resolved.");
            return false;
        }

        // Certify that the file format is of .MOV using the magic numbers
        // Check for .MOV/QuickTime magic numbers
        const quickTimeMagicNumbers = [0x6D, 0x6F, 0x6F, 0x76];
        for (let i = 0; i < quickTimeMagicNumbers.length; i++) {
            if (fileDataBuffer[i] !== quickTimeMagicNumbers[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param fileDataBuffer 
     * 
     * @returns -> A supported content type of the video media, or undefined if the file data buffer is undefined / of an unsupported content type.
     */
    static determineSupportedVideoMediaContentType(fileDataBuffer: Uint8Array | undefined): common.SupportedFonciiMapsPostContentTypes | undefined {
        if (this.isVideoMediaInMP4Format(fileDataBuffer)) return common.SupportedFonciiMapsPostContentTypes.mp4
        else if (this.isVideoMediaInQuickTimeFormat(fileDataBuffer)) return common.SupportedFonciiMapsPostContentTypes.mov
        else return;
    }

    /**
     * @param fileDataBuffer 
     * 
     * @returns -> A supported content type of the image media, or undefined if the file data buffer is undefined / of an unsupported content type.
     */
    static determineSupportedImageMediaContentType(fileDataBuffer: Uint8Array | undefined): common.SupportedFonciiMapsPostContentTypes | undefined {
        if (this.isImageMediaInJPEGFormat(fileDataBuffer)) return common.SupportedFonciiMapsPostContentTypes.jpg
        else if (this.isImageMediaInPNGFormat(fileDataBuffer)) return common.SupportedFonciiMapsPostContentTypes.png
        else return;
    }

    static isUserPostVideoMediaValid(fileDataBuffer: Uint8Array | undefined): boolean {
        if (fileDataBuffer == undefined) {
            logger.error("This user post video upload's file data is not defined and cannot be resolved.");
            return false;
        }

        // Validate the file format
        const fileType = this.determineSupportedVideoMediaContentType(fileDataBuffer);

        // Requirements
        const fileSizeLimitFulfilled = fileDataBuffer.length <= this.USER_POST_VIDEO_MEDIA_MAX_SIZE,
            fileTypeSupported = fileType == common.SupportedFonciiMapsPostContentTypes.mp4 || fileType == common.SupportedFonciiMapsPostContentTypes.mov;

        if (!fileSizeLimitFulfilled) {
            logger.error("This user post video upload exceeds the file size limit and cannot be resolved.");
        }
        else if (!fileTypeSupported) {
            logger.error("This user post video upload is not a valid MP4 or MOV file and cannot be resolved.");
        }

        return fileSizeLimitFulfilled && fileTypeSupported;
    }
}