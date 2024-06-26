// Dependencies
// Types
import { PostMediaTypes } from "../../../__generated__/graphql";

// Inheritance
import {
  CloudStorageService,
  PostMediaUpdateResponse,
} from "../cloud-storage/cloudStorageService";

// App Properties
import { nonProductionEnvironment } from "../../../core-foncii-maps/properties/AppProperties";

// Utilities
import { encodeStringToURLSafeBase64 } from "../../../utilities/common/convenienceUtilities";

// Media Service Specific Types
/** Default Storage Bucket Subdirectories */
export enum DefaultCSBucketSubdirectories {
  /** For objects used universally across Foncii's platforms */
  foncii = "foncii-universal",
  /** For objects used specifically for Foncii Maps */
  fonciiMaps = "foncii-maps",
}

/** Subdirectory References */
export enum FonciiSubdirectories {
  media = "media",
  userGeneratedMedia = "user-generated-media",
  profilePicture = "profile-picture",
}

export enum FonciiMapsSubdirectories {
  media = "media",
  userGeneratedMedia = "user-generated-media",
  posts = "posts",
  thumbnails = "thumbnails",
}

/** File Types */
export enum SupportedFileTypes {
  /** Smaller size, good for optimizations */
  jpg = ".jpg",
  jpeg = ".jpeg",
  webp = ".webp",
  heif = ".heif",
  /** Supports transparency, good for quality */
  png = ".png",
  mp4 = ".mp4",
  /** Lossless file format used by Apple */
  mov = ".mov",
}

/**
 * The only allowed content types for Foncii Maps Posts,
 * reject any media that doesn't fall under any of these categories
 */
export enum SupportedFonciiMapsPostContentTypes {
  jpg = "image/jpg",
  jpeg = "image/jpeg",
  png = "image/png",
  mp4 = "video/mp4",
  mov = "video/mov",
}

export enum FileContentTypes {
  jpg = "image/jpg",
  jpeg = "image/jpeg",
  webp = "image/webp",
  png = "image/png",
  heif = "image/heif",
  mp4 = "video/mp4",
  mov = "video/mov",
  txt = "text/plain",
}

export enum MediaServerResizingParams {
  height = "h",
  width = "w",
  quality = "q",
  fit = "it",
  format = "at",
}

export enum MediaServerImageFitParams {
  contain = "cn",
  cover = "co",
  fill = "fl",
  inside = "in",
  outside = "ou",
}

/**
 * Formats to convert the input image data to
 */
export enum MediaServerImageFormatParams {
  /** jpg */
  f1 = "f1",
  /** jpeg */
  f2 = "f2",
  /** webp */
  f3 = "f3",
  /** png */
  f4 = "f4",
  /** heif */
  f5 = "f5",
}
/**
 * An extension of the cloud storage service with specialized endpoint and file path
 * enumerations for uploading files in a structured and deterministic way.
 */
export default class CloudStorageServiceAdapter extends CloudStorageService {
  // Media Limitations
  private static USER_PROFILE_PICTURE_MEDIA_MAX_SIZE = 4 * 1024 * 1024; // 4MB, images
  private static USER_POST_IMAGE_MEDIA_MAX_SIZE = 30 * 1024 * 1024; // 30MB, images / video thumbnails
  private static USER_POST_VIDEO_MEDIA_MAX_SIZE = 200 * 1024 * 1024; // 200MB, videos

  // Shared
  // Foncii Maps
  /**
   * Updates (uploads / deletes) the media for the post with the given id belonging to the user
   * with the provided user ID using the given file data (video or image), alongside any thumbnail
   * for video media.
   *
   * @param userID
   * @param postID
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
    postID,
    mediaFileDataBuffer,
    videoThumbnailFileDataBuffer,
  }: {
    userID: string;
    postID: string;
    mediaFileDataBuffer?: Uint8Array | undefined;
    videoThumbnailFileDataBuffer?: Uint8Array | undefined;
  }): Promise<PostMediaUpdateResponse> {
    // Update Operation Branching Results
    let didUploadSucceed: boolean, didDeletionSucceed: boolean;

    // Parsing
    const mediaIsVideo = videoThumbnailFileDataBuffer != undefined,
      fileName = postID;

    // File Paths
    // Thumbnail
    const videoThumbnailFilePath = this.createFilePathFor(
      DefaultCSBucketSubdirectories.fonciiMaps,
      [
        FonciiMapsSubdirectories.media,
        FonciiMapsSubdirectories.userGeneratedMedia,
        userID,
        FonciiMapsSubdirectories.posts,
        FonciiMapsSubdirectories.thumbnails,
      ],
      fileName
    );

    // Main Media
    const mediaFilePath = this.createFilePathFor(
      DefaultCSBucketSubdirectories.fonciiMaps,
      [
        FonciiMapsSubdirectories.media,
        FonciiMapsSubdirectories.userGeneratedMedia,
        userID,
        FonciiMapsSubdirectories.posts,
      ],
      fileName
    );

    if (mediaFileDataBuffer != undefined) {
      // Video Media Thumbnail Image Upload
      if (mediaIsVideo) {
        await this.uploadFile(
          videoThumbnailFilePath,
          FileContentTypes.jpg,
          videoThumbnailFileDataBuffer
        );
      }

      // Main Media Upload
      const contentType = mediaIsVideo
        ? CloudStorageServiceAdapter.determineSupportedVideoMediaContentType(
            mediaFileDataBuffer
          )
        : CloudStorageServiceAdapter.determineSupportedImageMediaContentType(
            mediaFileDataBuffer
          );

      didUploadSucceed = await this.uploadFile(
        mediaFilePath,
        contentType,
        mediaFileDataBuffer
      );

      // Construct the permalink URL for the uploaded file
      const encodedMediaFilePath = encodeStringToURLSafeBase64(mediaFilePath),
        mediaPermalinkURL = this.generatePermalinkToFile(encodedMediaFilePath),
        encodedVideoThumbnailFilePath = encodeStringToURLSafeBase64(
          videoThumbnailFilePath
        ),
        thumbnailPermalinkURL = mediaIsVideo
          ? this.generatePermalinkToFile(encodedVideoThumbnailFilePath)
          : undefined;

      return {
        operationSucceeded: didUploadSucceed,
        media: didUploadSucceed
          ? {
              mediaType: mediaIsVideo
                ? PostMediaTypes.Video
                : PostMediaTypes.Image,
              mediaURL: mediaPermalinkURL,
              videoMediaThumbnailURL: thumbnailPermalinkURL,
            }
          : undefined,
      };
    } else {
      didDeletionSucceed = await this.deleteMediaForFMPost({ userID, postID });

      return {
        operationSucceeded: didDeletionSucceed,
        media: undefined,
      };
    }
  }

  /**
   * Deletes all of the media associated with the given post, including
   * thumbnails (regardless if the media is an image or video)
   *
   * @async
   * @param userID
   * @param postID
   *
   * @returns -> True if the deletion was successful, false otherwise (exclusive of thumbnail deletion result)
   */
  async deleteMediaForFMPost({
    userID,
    postID,
  }: {
    userID: string;
    postID: string;
  }): Promise<boolean> {
    // Parsing
    const fileName = postID;

    // Video Media Deletion
    // Thumbnail
    const thumbnailFilePath = this.createFilePathFor(
      DefaultCSBucketSubdirectories.fonciiMaps,
      [
        FonciiMapsSubdirectories.media,
        FonciiMapsSubdirectories.userGeneratedMedia,
        userID,
        FonciiMapsSubdirectories.posts,
        FonciiMapsSubdirectories.thumbnails,
      ],
      fileName
    );

    await this.deleteFile(thumbnailFilePath);

    // Main Media
    const mediaFilePath = this.createFilePathFor(
      DefaultCSBucketSubdirectories.fonciiMaps,
      [
        FonciiMapsSubdirectories.media,
        FonciiMapsSubdirectories.userGeneratedMedia,
        userID,
        FonciiMapsSubdirectories.posts,
      ],
      fileName
    );

    return await this.deleteFile(mediaFilePath);
  }

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
  async uploadFMPostMediaFromURL(
    url: string | undefined,
    postID: string | undefined,
    userID: string | undefined
  ): Promise<string | undefined> {
    // Precondition failure
    if (url == undefined || postID == undefined || userID == undefined) {
      return;
    }

    const fileData = await this.downloadFileDataFrom(url),
      fileDataBuffer = fileData ? fileData.fileDataBuffer : undefined,
      contentType = fileData?.contentType ?? "",
      isContentTypeSupported = Object.values<string>(
        SupportedFonciiMapsPostContentTypes
      ).includes(contentType);

    // The wrong type of file was downloaded (usually .txt indicating some XML file due to an expired source media URL)
    if (!isContentTypeSupported) {
      if (nonProductionEnvironment)
        console.error(
          `A file located at ${url} for the post ${postID}, produced a file download with an unexpected type of ${contentType}.`
        );
      return undefined;
    }

    // Early exception handling in case the file can't be downloaded
    if (!fileData) {
      if (nonProductionEnvironment)
        console.error(
          `A file located at ${url} for the post ${postID}, failed to download`
        );
      return undefined;
    }

    /// Example: foncii-maps/media/user-generated-media/123456/posts/A1z29282...
    /// Organizing media like this makes deletions easier in the long run by enabling folder based deletions
    const fileName = postID,
      filePath = this.createFilePathFor(
        DefaultCSBucketSubdirectories.fonciiMaps,
        [
          FonciiMapsSubdirectories.media,
          FonciiMapsSubdirectories.userGeneratedMedia,
          userID,
          FonciiMapsSubdirectories.posts,
        ],
        fileName
      );

    const didUpload = await this.uploadFile(
      filePath,
      contentType,
      fileDataBuffer
    );

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
   * @param postID -> The ID of the post to which the following media belongs to that will also be used
   * as the identifier for this file
   *
   * @returns -> Returns the URL String of the uploaded file
   * if the file upload was successful, or undefined if the upload failed.
   */
  async uploadFMPostVideoThumbnailMedia(
    url: string | undefined,
    postID: string | undefined,
    userID: string | undefined
  ): Promise<string | undefined> {
    // Precondition failure
    if (url == undefined || postID == undefined || userID == undefined) {
      return;
    }

    const fileData = await this.downloadFileDataFrom(url),
      fileDataBuffer = fileData ? fileData.fileDataBuffer : undefined,
      contentType = fileData?.contentType ?? "",
      isContentTypeSupported = Object.values<string>(
        SupportedFonciiMapsPostContentTypes
      ).includes(contentType);

    // The wrong type of file was downloaded (usually .txt indicating some XML file due to an expired source media URL)
    if (!isContentTypeSupported) {
      if (nonProductionEnvironment)
        console.error(
          `A file located at ${url} for the post ${postID}, produced a file download with an unexpected type of ${contentType}`
        );
      return undefined;
    }

    // Early exception handling in case the file can't be downloaded
    if (!fileData) {
      if (nonProductionEnvironment)
        console.error(
          `A file located at ${url} for the post ${postID}, failed to download`
        );
      return undefined;
    }

    /// Example: foncii-maps/media/user-generated-media/123456/posts/thumbnails/A1z29282...
    /// Organizing media like this makes deletions easier in the long run by enabling folder based deletions
    const fileName = postID,
      filePath = this.createFilePathFor(
        DefaultCSBucketSubdirectories.fonciiMaps,
        [
          FonciiMapsSubdirectories.media,
          FonciiMapsSubdirectories.userGeneratedMedia,
          userID,
          FonciiMapsSubdirectories.posts,
          FonciiMapsSubdirectories.thumbnails,
        ],
        fileName
      );

    const didUpload = await this.uploadFile(
      filePath,
      contentType,
      fileDataBuffer
    );

    // Construct the permalink URL for the uploaded file
    const encodedFilePath = encodeStringToURLSafeBase64(filePath),
      permalinkURL = this.generatePermalinkToFile(encodedFilePath);

    return didUpload ? permalinkURL : undefined;
  }

  // Media Validation Handlers
  // Shared
  static isProfilePictureMediaInJPEGFormat(
    fileDataBuffer: Uint8Array | undefined
  ): boolean {
    if (fileDataBuffer == undefined) {
      if (nonProductionEnvironment)
        console.error(
          "This profile picture upload's file data is not defined and cannot be resolved."
        );
      return false;
    }

    // Certify that the file format is of JPEG/JPG using the magic numbers
    return fileDataBuffer[0] === 0xff && fileDataBuffer[1] === 0xd8;
  }

  static isProfilePictureMediaValid(
    fileDataBuffer: Uint8Array | undefined
  ): boolean {
    if (fileDataBuffer == undefined) {
      if (nonProductionEnvironment)
        console.error(
          "This profile picture upload's file data is not defined and cannot be resolved."
        );
      return false;
    }

    // Validate the file format
    const fileType =
      this.determineSupportedImageMediaContentType(fileDataBuffer);

    // Requirements
    const fileSizeLimitFulfilled =
        fileDataBuffer.length <= this.USER_PROFILE_PICTURE_MEDIA_MAX_SIZE,
      fileTypeSupported =
        fileType == SupportedFonciiMapsPostContentTypes.jpg ||
        fileType == SupportedFonciiMapsPostContentTypes.png;

    if (!fileSizeLimitFulfilled) {
      if (nonProductionEnvironment)
        console.error(
          "This profile picture upload exceeds the file size limit and cannot be resolved."
        );
    } else if (!fileTypeSupported) {
      if (nonProductionEnvironment)
        console.error(
          "This profile picture upload is not a valid JPEG or PNG file and cannot be resolved."
        );
    }

    return fileSizeLimitFulfilled && fileTypeSupported;
  }

  // Foncii Maps
  // Supported Image Format Validators
  static isImageMediaInJPEGFormat(
    fileDataBuffer: Uint8Array | undefined
  ): boolean {
    if (fileDataBuffer == undefined) {
      if (nonProductionEnvironment)
        console.error(
          "This user post image upload's file data is not defined and cannot be resolved."
        );
      return false;
    }

    // Certify that the file format is of JPEG/JPG using the magic numbers
    return fileDataBuffer[0] === 0xff && fileDataBuffer[1] === 0xd8;
  }

  static isImageMediaInPNGFormat(
    fileDataBuffer: Uint8Array | undefined
  ): boolean {
    if (fileDataBuffer == undefined) {
      if (nonProductionEnvironment)
        console.error(
          "This user post image upload's file data is not defined and cannot be resolved."
        );
      return false;
    }

    // Certify that the file format is of PNG using the magic numbers
    return (
      fileDataBuffer[0] === 0x89 &&
      fileDataBuffer[1] === 0x50 &&
      fileDataBuffer[2] === 0x4e &&
      fileDataBuffer[3] === 0x47
    );
  }

  static isUserPostImageMediaValid(
    fileDataBuffer: Uint8Array | undefined
  ): boolean {
    if (fileDataBuffer == undefined) {
      if (nonProductionEnvironment)
        console.error(
          "This user post image upload's file data is not defined and cannot be resolved."
        );
      return false;
    }

    // Validate the file format
    const fileType =
      this.determineSupportedImageMediaContentType(fileDataBuffer);

    // Requirements
    const fileSizeLimitFulfilled =
        fileDataBuffer.length <= this.USER_POST_IMAGE_MEDIA_MAX_SIZE,
      fileTypeSupported =
        fileType == SupportedFonciiMapsPostContentTypes.jpg ||
        fileType == SupportedFonciiMapsPostContentTypes.png;

    if (!fileSizeLimitFulfilled) {
      if (nonProductionEnvironment)
        console.error(
          "This user post image upload exceeds the file size limit and cannot be resolved."
        );
    } else if (!fileTypeSupported) {
      if (nonProductionEnvironment)
        console.error(
          "This user post image upload is not a valid JPEG or PNG file and cannot be resolved."
        );
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
  static isVideoMediaInMP4Format(
    fileDataBuffer: Uint8Array | undefined
  ): boolean {
    if (fileDataBuffer == undefined) {
      if (nonProductionEnvironment)
        console.error(
          "This user post video upload's file data is not defined and cannot be resolved."
        );
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

  static isVideoMediaInQuickTimeFormat(
    fileDataBuffer: Uint8Array | undefined
  ): boolean {
    if (fileDataBuffer == undefined) {
      if (nonProductionEnvironment)
        console.error(
          "This user post video upload's file data is not defined and cannot be resolved."
        );
      return false;
    }

    // Certify that the file format is of .MOV using the magic numbers
    // Check for .MOV/QuickTime magic numbers
    const quickTimeMagicNumbers = [0x6d, 0x6f, 0x6f, 0x76];
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
  static determineSupportedVideoMediaContentType(
    fileDataBuffer: Uint8Array | undefined
  ): SupportedFonciiMapsPostContentTypes | undefined {
    if (this.isVideoMediaInMP4Format(fileDataBuffer))
      return SupportedFonciiMapsPostContentTypes.mp4;
    else if (this.isVideoMediaInQuickTimeFormat(fileDataBuffer))
      return SupportedFonciiMapsPostContentTypes.mov;
    else return;
  }

  /**
   * @param fileDataBuffer
   *
   * @returns -> A supported content type of the image media, or undefined if the file data buffer is undefined / of an unsupported content type.
   */
  static determineSupportedImageMediaContentType(
    fileDataBuffer: Uint8Array | undefined
  ): SupportedFonciiMapsPostContentTypes | undefined {
    if (this.isImageMediaInJPEGFormat(fileDataBuffer))
      return SupportedFonciiMapsPostContentTypes.jpg;
    else if (this.isImageMediaInPNGFormat(fileDataBuffer))
      return SupportedFonciiMapsPostContentTypes.png;
    else return;
  }

  static isUserPostVideoMediaValid(
    fileDataBuffer: Uint8Array | undefined
  ): boolean {
    if (fileDataBuffer == undefined) {
      if (nonProductionEnvironment)
        console.error(
          "This user post video upload's file data is not defined and cannot be resolved."
        );
      return false;
    }

    // Validate the file format
    const fileType =
      this.determineSupportedVideoMediaContentType(fileDataBuffer);

    // Requirements
    const fileSizeLimitFulfilled =
        fileDataBuffer.length <= this.USER_POST_VIDEO_MEDIA_MAX_SIZE,
      fileTypeSupported =
        fileType == SupportedFonciiMapsPostContentTypes.mp4 ||
        fileType == SupportedFonciiMapsPostContentTypes.mov;

    return fileSizeLimitFulfilled && fileTypeSupported;
  }
}
