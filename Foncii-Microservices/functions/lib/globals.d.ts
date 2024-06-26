/** Endpoint Inputs */
interface UserPfpMediaUploadInput extends UserRequestInput {
    fileDataBuffer: Uint8Array | undefined;
    platform: string | undefined;
}
interface UserPostMediaUploadInput extends UserRequestInput {
}
/** Generic interface for user specific endpoints' input data shape to conform to */
interface UserRequestInput {
    userID: string | undefined;
}
interface UserProfilePictureUpdateResponse {
    operationSucceeded: boolean;
    permalinkURL?: string;
}
/** Supported Platforms, allows one endpoint to serve users of different Foncii platforms */
declare enum SupportedFonciiPlatforms {
    foncii = "FONCII",
    fonciiMaps = "FONCII-MAPS"
}
/** Default Storage Bucket Subdirectories */
declare enum DefaultCSBucketSubdirectories {
    /** For objects used universally across Foncii's platforms */
    foncii = "foncii-universal",
    /** For objects used specifically for Foncii Maps */
    fonciiMaps = "foncii-maps"
}
/** Subdirectory References */
declare enum FonciiSubdirectories {
    media = "media",
    userGeneratedMedia = "user-generated-media",
    profilePicture = "profile-picture"
}
declare enum FonciiMapsSubdirectories {
    media = "media",
    userGeneratedMedia = "user-generated-media",
    posts = "posts",
    thumbnails = "thumbnails"
}
/** File Types */
declare enum SupportedFileTypes {
    /** Smaller size, good for optimizations */
    jpg = ".jpg",
    /** Supports transparency, good for quality */
    png = ".png",
    mp4 = ".mp4"
}
/**
 * The only allowed content types for Foncii Maps Posts,
 * reject any media that doesn't fall under any of these categories
 */
declare enum SupportFonciiMapsPostContentTypes {
    jpg = "image/jpeg",
    png = "image/png",
    mp4 = "video/mp4"
}
declare enum FileContentTypes {
    jpg = "image/jpeg",
    png = "image/png",
    mp4 = "video/mp4",
    txt = "text/plain"
}
interface CSFileDataModel {
    fileDataBuffer: Uint8Array;
    contentType: string | null;
}
