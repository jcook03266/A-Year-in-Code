import { FmUserPostMedia } from "../__generated__/graphql"

// Various type definitions used across this microservice
declare global {
    // Endpoint Inputs
    interface UserPFPMediaUploadInput extends UserRequestInput {
        /** UInt8Array String to be parsed to a Uint8Array */
        fileDataBuffer: string | undefined,
        platform: string | undefined,
    }

    interface UserPFPMediaURLUploadInput extends UserRequestInput {
        /** The URL of the image to be downloaded and uploaded to Foncii */
        imageURL: string | undefined,
        platform: string | undefined,
    }


    /** The expected input for user media upload / removal requests */
    interface SetUserPostMediaInput extends UserRequestInput {
        postID: string | undefined,
        /** Optional field, should be fulfilled when uploading video media content */
        videoThumbnailFileDataBuffer?: string | undefined,
        mediaFileDataBuffer: string | undefined,
    }

    /** Defines the ID of the post with media that should be deleted */
    interface UserPostMediaDeleteInput extends UserRequestInput {
        postID: string | undefined
    }

    /** Generic interface for user specific endpoints' input data shape to conform to */
    interface UserRequestInput {
        userID: string | undefined
    }

    interface FindResyAvailableDaysInput {
        /** The ID of the venue within Resy's database to search for availabilities for  */
        resyVenueID: string
        /** The desired party size for the reservation. Note: max is 20, min is 1 */
        partySize: number
        /** Starting date of the reservation availability sliding window search in milliseconds [ms]*/
        startDateInMS: number
        /** End date of the reservation availability sliding window search in milliseconds [ms]*/
        endDateInMS: number
    }

    interface FindResyAvailabilitiesForDateInput {
        /** The ID of the venue within Resy's database to search for availabilities for  */
        resyVenueID: string
        /** The desired party size for the reservation. Note: max is 20, min is 1 */
        partySize: number
        /** The desired date of the reservation in milliseconds [ms] */
        dateOfReservationInMS: number
    }

    // Cloud Storage Service Types
    interface MediaUpdateResponse {
        operationSucceeded: boolean,
        permalinkURL?: string
    }

    interface PostMediaUpdateResponse {
        operationSucceeded: boolean,
        media?: FmUserPostMedia
    }

    interface CSFileDataModel {
        fileDataBuffer: Uint8Array
        contentType: string | null
    }

    interface ImageSizeProps {
        width: number,
        height: number
    }
}
/** 
* Simple cache control policies to specify for media uploads 
* more complex and personalized policies can be found here:
* https://www.imperva.com/learn/performance/cache-control/#:~:text=Cache%2Dcontrol%20is%20an%20HTTP,i.e.%2C%20time%20to%20live).
*/
export enum SimpleCacheControlPolicies {
    /** 
     * This directive instructs caches not to store the resource at all.
     * It prevents the resource from being cached in any form, and every request will go directly to the server. 
     * This is a more aggressive caching control that eliminates any caching, even revalidation. 
     * It might result in more server requests, which could be unnecessary if the image is updated frequently 
     * but not constantly. 
     */
    noStore = "no-store",
    /**
     * This directive tells caches to revalidate the resource with the origin server before serving it, 
     * even if the cached copy appears to be valid. When you set Cache-Control: no-cache, 
     * it means that the client (e.g., web browser) or intermediate caches (e.g., CDN) 
     * can cache the image, but they must check with the server to see if the image has changed before serving it. 
     * If the image has been updated on the server, the updated version will be fetched and served.
     */
    noCache = "no-cache"
}

// Various type definitions used for interfacing with proprietary Foncii Microservices
/** Supported Platforms, allows one endpoint to serve users of different Foncii platforms */
export enum SupportedFonciiPlatforms {
    foncii = 'FONCII',
    fonciiBiz = 'FONCII-BIZ'
}

/** Default Storage Bucket Subdirectories */
export enum DefaultCSBucketSubdirectories {
    /** For objects used universally across Foncii's platforms */
    foncii = 'foncii-universal',
    /** For objects used specifically for Foncii Maps */
    fonciiMaps = 'foncii-maps'
}

/** Subdirectory References */
export enum FonciiSubdirectories {
    media = 'media',
    userGeneratedMedia = 'user-generated-media',
    profilePicture = 'profile-picture'
}

export enum FonciiMapsSubdirectories {
    media = 'media',
    userGeneratedMedia = 'user-generated-media',
    posts = 'posts',
    thumbnails = 'thumbnails',
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
    mov = ".mov"
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
    mov = "video/mov"
}

export enum FileContentTypes {
    jpg = "image/jpg",
    jpeg = "image/jpeg",
    webp = "image/webp",
    png = "image/png",
    heif = "image/heif",
    mp4 = "video/mp4",
    mov = "video/mov",
    txt = "text/plain"
}

export enum MediaServerResizingParams {
    height = 'h',
    width = 'w',
    quality = 'q',
    fit = 'it',
    format = 'at'
}

export enum MediaServerImageFitParams {
    contain = 'cn',
    cover = 'co',
    fill = 'fl',
    inside = 'in',
    outside = 'ou'
}

/**
 * Formats to convert the input image data to
 */
export enum MediaServerImageFormatParams {
    /** jpg */
    f1 = 'f1',
    /** jpeg */
    f2 = 'f2',
    /** webp */
    f3 = 'f3',
    /** png */
    f4 = 'f4',
    /** heif */
    f5 = 'f5'
}