// Dependencies
// Cloud Functions V2
import { onRequest } from "firebase-functions/v2/https";

// Types
import { FileContentTypes, MediaServerResizingParams, SupportedFonciiMapsPostContentTypes, SupportedFonciiPlatforms } from './types/common.js';

// V1 Types
import { Request, Response } from "firebase-functions/v1";

// Logging
import { logger } from "./services/logging/debugLoggingService.js";

// Services
import FMPostService from "./services/foncii-maps/fmPostService.js";
import UserService from "./services/foncii-universal/userService.js";
import { CloudStorageService } from "./services/cloud-storage/cloudStorageService.js";

// Namespace Declarations
import * as RESTAPI from './types/namespaces/rest-api.js'

// API Gateway
import { authorizeRequest, authorizeUserRequest, validateCrossPlatformRequest } from "./api-gateway-functions.js";
import { FonciiCloudStorageServiceAdapter } from "./services/cloud-storage/service-adapters/cloudStorageServiceAdapter.js";
import { decodeFromBase64 } from "./foncii-toolkit/utilities/convenienceUtilities.js";
import ReservationService from "./services/foncii-maps/reservationService.js";

/**
 * Resizable URL request typically looks like:
 * URL-Safe Base64 Encoded file path
 * Size Parameters
 * https://cdn.foncii.com/Zm9uY2lpLW1hcHMvbWVkaWEvdXNlci1nZW5lcmF0ZWQtbWVkaWEvMjJ4NDBlNFo3SVkwRlR5c0tnbDIvcG9zdHMvMm5mQTY4ZkJacnRYWmJQYmxGbzA=h1600-w1200
 * 
 * Size Parameters + image fit
 * https://cdn.foncii.com/Zm9uY2lpLW1hcHMvbWVkaWEvdXNlci1nZW5lcmF0ZWQtbWVkaWEvMjJ4NDBlNFo3SVkwRlR5c0tnbDIvcG9zdHMvMm5mQTY4ZkJacnRYWmJQYmxGbzA=h1600-w1200-itou
 * 
 * Size Parameters + desired format + quality + image fit
 * Production:
 * https://cdn.foncii.com/Zm9uY2lpLW1hcHMvbWVkaWEvdXNlci1nZW5lcmF0ZWQtbWVkaWEvMjJ4NDBlNFo3SVkwRlR5c0tnbDIvcG9zdHMvMm5mQTY4ZkJacnRYWmJQYmxGbzA=h1600-w1200-atf3-q50-itou
 * 
 * Local:
 * http://127.0.0.1:5001/foncii-app/us-central1/mediaserver/Zm9uY2lpLW1hcHMvbWVkaWEvdXNlci1nZW5lcmF0ZWQtbWVkaWEvMjJ4NDBlNFo3SVkwRlR5c0tnbDIvcG9zdHMvMm5mQTY4ZkJacnRYWmJQYmxGbzA=h1600-w1200-f3-q50-ou
 * 
 * Base64 Decoded URL file path
 * foncii-maps/media/user-generated-media/22x40e4Z7IY0FTysKgl2/posts/2nfA68fBZrtXZbPblFo0
 * 
 * Generic media request
 * https://cdn.foncii.com/Zm9uY2lpLW1hcHMvbWVkaWEvdXNlci1nZW5lcmF0ZWQtbWVkaWEvMjJ4NDBlNFo3SVkwRlR5c0tnbDIvcG9zdHMvMm5mQTY4ZkJacnRYWmJQYmxGbzA
 * 
 * Base64 Decoded URL file path
 * foncii-maps/media/user-generated-media/22x40e4Z7IY0FTysKgl2/posts/2nfA68fBZrtXZbPblFo0
 * 
 * Notice the resize URL parameters separated by the '=' aren't attached the end, this prevents the image file (if any) from
 * being resized by the server dynamically and just serves the basic image file itself
 * 
 * Note: Cloud functions have a maximum response size of 32MB so the response size of this function must stay below said threshold, therefore 
 * all image media downloaded and transformed and served by this function must also be within those dimensions.
 */
exports.mediaserver = onRequest({
    timeoutSeconds: 120, // 2 mins to respond max
    concurrency: 30, // 30 max concurrent requests to limit memory usage, ~30MB of memory per simultaneous request ~ 1GB total
    maxInstances: 1000,
    minInstances: 0,
    memory: '1GiB'
}, async (request: Request, response: Response) => {
    // Services
    const cloudStorageService = new CloudStorageService();

    // Parse the requested media's encoded file path
    let encodedMediaFilePath: string | string[] = request.url.split('/');
    // Remove the first '/'
    encodedMediaFilePath.shift();
    // Join the path back up into a single string
    encodedMediaFilePath = encodedMediaFilePath.join('/');

    // Decode the path to the requested media
    // Ex.) foncii-maps/media/user-generated-media/22x40e4Z7IY0FTysKgl2/posts/2nfA68fBZrtXZbPblFo0 contains multiple slashes, 
    // Zm9uY2lpLW1hcHMvbWVkaWEvdXNlci1nZW5lcmF0ZWQtbWVkaWEvMjJ4NDBlNFo3SVkwRlR5c0tnbDIvcG9zdHMvMm5mQTY4ZkJacnRYWmJQYmxGbzA contains none, therefore it's most likely encoded
    // so use the input media file path
    const isMediaFilePathEncoded = encodedMediaFilePath.split('/').length <= 1,
        decodedMediaFilePath = (isMediaFilePathEncoded ? decodeFromBase64(encodedMediaFilePath) : encodedMediaFilePath).split('=')[0];

    // Parse media parameters
    // ex.) [h_1600, w_1200]
    // Note: Max size is 8000x8000, min size is 1x1.
    const mediaParameters = (encodedMediaFilePath.split('=')[1] ?? '').split('-'),
        imageResizeHeight = Number(mediaParameters.find(param => param.includes(MediaServerResizingParams.height))?.replace(MediaServerResizingParams.height, '')),
        optionalWidth = mediaParameters.find(param => param.includes(MediaServerResizingParams.width))?.replace(MediaServerResizingParams.width, ''),
        imageResizeWidth = optionalWidth ? Number(optionalWidth) : undefined,
        imageResizeFit = mediaParameters.find(param => param.includes(MediaServerResizingParams.fit))?.replace(MediaServerResizingParams.fit, ''),
        imageConversionFormat = mediaParameters.find(param => param.includes(MediaServerResizingParams.format))?.replace(MediaServerResizingParams.format, ''),
        optionalQuality = mediaParameters.find(param => param.includes(MediaServerResizingParams.quality))?.replace(MediaServerResizingParams.quality, ''),
        imageConversionQuality = optionalQuality ? Number(optionalQuality) : undefined;

    // No processing required, pipe the required object directly to the requester and provide content headers
    if (!imageResizeHeight) {
        const fileMetadata = await cloudStorageService.getFileMetadata(decodedMediaFilePath);

        // File exists
        if (fileMetadata) {
            const fileURL = await cloudStorageService.getFileURL(decodedMediaFilePath);
            response.status(RESTAPI.HTTPStatusCodes.OK).redirect(fileURL);
        }
        else {
            // File doesn't exist
            response.status(RESTAPI.HTTPStatusCodes.NOT_FOUND).send('Requested resource not found.');
        }

        return;
    }

    // Fetch the object resource
    const resource = await cloudStorageService.downloadFile(decodedMediaFilePath),
        resourceData = resource ? new Uint8Array(resource) : undefined,
        supportedImageFileType = FonciiCloudStorageServiceAdapter.determineSupportedImageMediaContentType(resourceData),
        supportedVideoFileType = FonciiCloudStorageServiceAdapter.determineSupportedVideoMediaContentType(resourceData);

    // Media file content type (if any) to return in response header
    let mediaFileType: FileContentTypes | SupportedFonciiMapsPostContentTypes | undefined = supportedImageFileType ?? supportedVideoFileType;

    // Resource is available serve it directly or resize if needed
    if (resource) {
        let finalizedResource = resource;

        // Optional resizing process
        if (imageResizeHeight && supportedImageFileType) {
            const resizedImage = await cloudStorageService
                .resizeImage({
                    height: imageResizeHeight,
                    width: imageResizeWidth,
                    fileDataBuffer: resource,
                    fit: imageResizeFit,
                    format: imageConversionFormat,
                    quality: imageConversionQuality
                });

            // Throw if the size fails
            if (!resizedImage) {
                response.status(RESTAPI.HTTPStatusCodes.BAD_REQUEST).send('Your client has issued a malformed or illegal request.');
                return;
            }
            else {
                finalizedResource = resizedImage;

                // Set response header (if applicable), throw if invalid
                if (imageConversionFormat) {
                    const sharpFormat = CloudStorageService
                        .convertImageFormatParamToSharpFormatEnum(imageConversionFormat),
                        fileFormat = CloudStorageService.convertSharpFormatEnumToSupportedFileContentTypes(sharpFormat);

                    if (!fileFormat) {
                        response.status(RESTAPI.HTTPStatusCodes.BAD_REQUEST).send('Your client has issued a malformed or illegal request.');
                        return;
                    }
                    else {
                        mediaFileType = fileFormat;
                    }
                }
            }
        }

        // Set response header (if applicable)
        if (mediaFileType) response.setHeader('Content-Type', mediaFileType);

        // Send back the finalized resource data
        response.status(RESTAPI.HTTPStatusCodes.OK).send(finalizedResource);
    }
    else {
        response.status(RESTAPI.HTTPStatusCodes.NOT_FOUND).send('Requested resource not found.');
    }
})

/**
 * Dedicated endpoint for uploading Foncii Maps user post media for the specified user to
 * our dedicated cloud storage bucket. If the media is uploaded successfully then the permalink
 * generated for the media is updated to the user's post data.
 */
exports.uploaduserpostmedia = onRequest({
    timeoutSeconds: 3600, // 60 mins to respond
    concurrency: 1, // Only serve 1 request per instance, this is a very long running process so concurrency is a no go
    maxInstances: 1000, // Change as needed, but for the forseeable future this will suffice
    minInstances: 0, // Spin up as needed, no warm instances
    memory: '2GiB' // Increased memory limit to handle large concurrent requests (Adjust as needed)
}, async (request: Request, response: Response) => {
    // Parsing
    const { userID }: UserRequestInput = request.body,
        { api_key } = request.headers;

    // Authorization
    if (!(await authorizeUserRequest(
        api_key,
        userID,
        SupportedFonciiPlatforms.foncii,
        response
    ))) return;

    // Logging
    logger.info(`Resolving post media upload request sent by user: ${userID}`, { structuredData: true });

    const fmPostService = new FMPostService();
    await fmPostService.uploadPostMediaForAllUserPosts(userID!);

    // Send back response from function, and kill instance.
    response.status(RESTAPI.HTTPStatusCodes.OK).send('Post Media Upload Finished.');
});

exports.deleteuserpostmedia = onRequest({
    timeoutSeconds: 300, // 5 minute maximum timeout for singular deletions
    concurrency: 100,
    maxInstances: 1000,
    minInstances: 0
}, async (request: Request, response: Response) => {
    // Parsing
    const { userID, postID }: UserPostMediaDeleteInput = request.body,
        { api_key } = request.headers;

    // Authorization
    if (!(await authorizeUserRequest(
        api_key,
        userID,
        SupportedFonciiPlatforms.foncii,
        response
    ))) return;

    // Logging
    logger.info(`Resolving post media deletion request sent by user: ${userID} for post ${postID}`, { structuredData: true });

    const fmPostService = new FMPostService(),
        didSucceed = await fmPostService.deleteMediaForPost({
            userID: userID!,
            postID: postID!
        });

    // Send back response from function, and kill instance.
    if (didSucceed) {
        response.status(RESTAPI.HTTPStatusCodes.OK).send('Post Media Deletion Completed Successfully.');
    }
    else {
        response.status(RESTAPI.HTTPStatusCodes.INTERNAL_SERVER_ERROR).send('Post Media Deletion Failed.');
    }
});

exports.deletealluserpostmedia = onRequest({
    timeoutSeconds: 1800, // 30 mins maximum timeout since deletions take less time than uploads
    concurrency: 100, // Folder deletions are batch operations so concurrency is feasible. 100 requests per instance just to be safe. 
    maxInstances: 1000,
    minInstances: 0
}, async (request: Request, response: Response) => {
    // Parsing
    const { userID }: UserRequestInput = request.body,
        { api_key } = request.headers;

    // Authorization
    if (!(await authorizeUserRequest(
        api_key,
        userID,
        SupportedFonciiPlatforms.foncii,
        response
    ))) return;

    // Logging
    logger.info(`Resolving total post media deletion request sent by user: ${userID}`, { structuredData: true });

    const fmPostService = new FMPostService(),
        didSucceed = await fmPostService.deleteAllFMPostMedia(userID!);

    // Send back response from function, and kill instance.
    if (didSucceed) {
        response.status(RESTAPI.HTTPStatusCodes.OK).send('Total Post Media Deletion Completed Successfully.');
    }
    else {
        response.status(RESTAPI.HTTPStatusCodes.INTERNAL_SERVER_ERROR).send('Total Post Media Deletion Failed.');
    }
});

/**
 * Endpoint for setting (uploading / removing) user profile picture media across Foncii's platforms
 * to our dedicated cloud storage bucket. If the media is uploaded successfully then the permalink
 * generated for the media is updated to the user's account data on the target platform. If the provided media 
 * is undefined then the user's existing pfp media is deleted as this indicates the request wanted to delete said media
 * by passing in an undefined file data buffer.
 */
exports.setuserprofilepicture = onRequest({
    timeoutSeconds: 120, // Max 2 min to respond, more than enough time to upload a simple small optimized image file.
    concurrency: 20, // This is a short running process so concurrency is allowed. 30 requests per instance just to be safe.
    maxInstances: 1000,
    minInstances: 0 // Spin up as needed, no warm instances
}, async (request: Request, response: Response) => {
    // Parsing
    const { fileDataBuffer, userID, platform }: UserPFPMediaUploadInput = request.body,
        { api_key } = request.headers;

    // Cross-Platform Routing Validation
    if (!validateCrossPlatformRequest(platform, response)) return;

    // Authorization
    if (!(await authorizeUserRequest(api_key, userID, platform as SupportedFonciiPlatforms, response))) return;

    // Logging
    logger.info(`Resolving set user profile picture media request sent by user: ${userID}, for Foncii platform: ${platform}`, { structuredData: true });

    // File Upload / Removal
    const userService = new UserService(),
        parsedFileDataBuffer: Uint8Array | undefined = CloudStorageService.parseRawUInt8ArrayFromString(fileDataBuffer),
        didOperationSucceed = await userService.updateUserProfilePicture(userID!, platform as SupportedFonciiPlatforms, parsedFileDataBuffer);

    // Send back response from function, and kill instance.
    if (didOperationSucceed) {
        response.status(RESTAPI.HTTPStatusCodes.OK).send('Set User Profile Picture Media Request Completed Successfully.');
    }
    else {
        response.status(RESTAPI.HTTPStatusCodes.INTERNAL_SERVER_ERROR).send('Set User Profile Picture Media Request Failed.');
    }
});

exports.setuserprofilepicturefromurl = onRequest({
    timeoutSeconds: 120, // Max 2 min to respond, more than enough time to upload a simple small optimized image file.
    concurrency: 20, // This is a short running process so concurrency is allowed. 30 requests per instance just to be safe.
    maxInstances: 1000,
    minInstances: 0 // Spin up as needed, no warm instances
}, async (request: Request, response: Response) => {
    // Service Defs
    const cloudStorageService = new FonciiCloudStorageServiceAdapter();

    // Parsing
    const { imageURL, userID, platform }: UserPFPMediaURLUploadInput = request.body,
        { api_key } = request.headers;

    // Cross-Platform Routing Validation
    if (!validateCrossPlatformRequest(platform, response)) return;

    // Authorization
    if (!(await authorizeUserRequest(api_key, userID, platform as SupportedFonciiPlatforms, response))) return;

    // Unwrap optionals
    if (!imageURL) {
        response.status(RESTAPI.HTTPStatusCodes.INTERNAL_SERVER_ERROR).send('Set User Profile Picture Media Request Failed.');
        return;
    }

    // Logging
    logger.info(`Resolving set user profile picture media from URL request sent by user: ${userID}, for Foncii platform: ${platform}`, { structuredData: true });

    // File Upload / Removal
    const userService = new UserService(),
        image = await cloudStorageService.downloadFileDataFrom(imageURL),
        parsedFileDataBuffer: Uint8Array | undefined = image?.fileDataBuffer,
        didOperationSucceed = await userService.updateUserProfilePicture(userID!, platform as SupportedFonciiPlatforms, parsedFileDataBuffer);

    // Send back response from function, and kill instance.
    if (didOperationSucceed) {
        response.status(RESTAPI.HTTPStatusCodes.OK).send('Set User Profile Picture Media Request Completed Successfully.');
    }
    else {
        response.status(RESTAPI.HTTPStatusCodes.INTERNAL_SERVER_ERROR).send('Set User Profile Picture Media Request Failed.');
    }
});

exports.findresyavailabledays = onRequest({
    timeoutSeconds: 2, // Max 2 seconds to respond, a typical response shouldn't take longer than this
    concurrency: 1, // Limit the maximum amount of concurrent requests to 10 in order to not trip Resy's QPS limit for a single IP address
    maxInstances: 100, // Maximize the total possible amount of instances to take advantage of the dynamic IP address pool cloud run uses to fly under Resy's radar
    minInstances: 0 // Spin up as needed, no warm instances since this is basically an API call and not an intensive process
}, async (request: Request, response: Response) => {
    // Service Defs
    const reservationService = new ReservationService();

    // Parsing
    const {
        resyVenueID,
        partySize,
        startDateInMS,
        endDateInMS
    }: FindResyAvailableDaysInput = request.query as unknown as FindResyAvailableDaysInput,
        { api_key } = request.headers;

    // Authorize incoming requests, don't let unauthorized api calls get through
    authorizeRequest(api_key, response);

    const availabilities = await reservationService.findResyAvailableDays({
        resyVenueID,
        partySize: Number(partySize),
        startDateInMS: Number(startDateInMS),
        endDateInMS: Number(endDateInMS)
    });

    // Send back response from function, and kill instance.
    if (availabilities != undefined) {
        // Availabilities found / none found / valid response
        response.status(RESTAPI.HTTPStatusCodes.OK).send(availabilities);
    }
    else {
        // Undefined / error occurred
        response.status(RESTAPI.HTTPStatusCodes.BAD_REQUEST).send([]);
    }
});

exports.findresyavailabilitiesfordate = onRequest({
    timeoutSeconds: 2, // Max 2 seconds to respond, a typical response shouldn't take longer than this
    concurrency: 1, // Limit the maximum amount of concurrent requests to 10 in order to not trip Resy's QPS limit for a single IP address
    maxInstances: 100, // Maximize the total possible amount of instances to take advantage of the dynamic IP address pool cloud run uses to fly under Resy's radar
    minInstances: 0 // Spin up as needed, no warm instances since this is basically an API call and not an intensive process
}, async (request: Request, response: Response) => {
    // Service Defs
    const reservationService = new ReservationService();

    // Parsing
    const {
        resyVenueID,
        partySize,
        dateOfReservationInMS
    }: FindResyAvailabilitiesForDateInput = request.query as unknown as FindResyAvailabilitiesForDateInput,
        { api_key } = request.headers;

    authorizeRequest(api_key, response);

    const availabilities = await reservationService.findResyAvailabilitiesForDate({
        resyVenueID,
        partySize: Number(partySize),
        dateOfReservationInMS: Number(dateOfReservationInMS)
    });

    // Send back response from function, and kill instance.
    if (availabilities != undefined) {
        // Availabilities found / none found / valid response
        response.status(RESTAPI.HTTPStatusCodes.OK).send(availabilities);
    }
    else {
        // Undefined / error occurred
        response.status(RESTAPI.HTTPStatusCodes.BAD_REQUEST).send([]);
    }
});