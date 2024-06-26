// Dependencies
// Logging
import { logger } from '../logging/debugLoggingService.js';

// Firebase SDK
import { FirebaseAdminService } from '../firebase-admin/firebaseAdminService.js';

// Networking
import fetch from 'node-fetch';

// File Conversion Library
import sharp from 'sharp';

// Namespace Declarations
import * as common from '../../types/common.js';
import { isNumberInRange } from '../../foncii-toolkit/utilities/commonMath.js';

/**
 * Service class responsible for uploading files to Google's 
 * Cloud Storage service through this secure backend application
 */
export class CloudStorageService extends FirebaseAdminService {
    // Utility Methods
    /**
     * Constructs and returns full URL of the endpoint for the foncii-content CDN storage bucket 
     * 
     * @returns {String} -> The full URL of the endpoint for the target storage bucket
     */
    generateStorageBucketEndpointFor = (): string => {
        const cdnEndpoint = this.fonciiCDNURL;

        /// The CDN automatically uses the `foncii-content` storage bucket so no identifier
        // reference is needed here
        return cdnEndpoint;
    }

    /**
     * Constructs and returns a permanent link to the specified file resource
     * uploaded to Google Cloud storage
     * 
     * @param {String} filePath -> The full path of the file to be uploaded
     * @returns {String} -> The permanent link (permalink) to the file within the target storage bucket,
     * this link is non-expirable (permanent), for expirable links please generate signed links
     */
    generatePermalinkToFile(
        filePath: string
    ): string {
        return `${this.generateStorageBucketEndpointFor()}/${filePath}`;
    }

    /**
     * Creates a file path for the file referenced by the provided parameters.
     * 
     * @param parentDirectory 
     * @param subdirectories 
     * @param fileName
     * 
     * @returns -> A complete file path using the concatenated
     * resources provided to this constructor method.
     */
    createFilePathFor(
        parentDirectory: string,
        subdirectories: string[],
        fileName: string
    ): string {
        const directorySeparator = '/',
            joinedSubdirectories = subdirectories.join(directorySeparator),
            completeFileName = fileName;

        return parentDirectory
            + directorySeparator
            + joinedSubdirectories
            + (subdirectories.length > 0 ? directorySeparator : '')
            + completeFileName;
    }

    /**
     * Creates a path to the leaf (bottom-most) folder referenced by the provided parameters.
     * 
     * @param parentDirectory 
     * @param subdirectories
     * 
     * @returns -> A complete path to the target folder using the concatenated
     * resources provided to this constructor method.
     */
    createFolderPathFor(
        parentDirectory: string,
        subdirectories: string[]
    ): string {
        const directorySeparator = '/',
            joinedSubdirectories = subdirectories.join(directorySeparator);

        return parentDirectory
            + directorySeparator
            + joinedSubdirectories
            + (subdirectories.length > 0 ? directorySeparator : '');
    }

    // API Interfacing
    /**
     * Upload a file to Cloud Storage via a reference to the full path of the file, 
     * including the file name, directory, and storage bucket.
     * 
     * @async
     * @param filePath -> Reference to the file to be uploaded, directory, and storage bucket
     * @param contentType -> The type of content stored in the file ex.) video/mp4
     * @param fileDataBufferArray -> Array of Uint8 values representing the file contents
     * @param cacheControlPolicy -> An optional cache control policy header for the file upload, leave undefined
     * if the object should be cached, and define more granular policies for other media as needed.
     * 
     * Read more about the file API here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer, 
     * https://developer.mozilla.org/en-US/docs/Web/API/File
     * @returns -> True if upload was successful, false otherwise
     */
    async uploadFile(
        filePath: string,
        contentType: string | undefined,
        fileDataBufferArray: Uint8Array | undefined,
        cacheControlPolicy: common.SimpleCacheControlPolicies | undefined = undefined
    ): Promise<boolean> {
        // Precondition failure
        if (fileDataBufferArray == undefined) return false;

        const bucket = this.storage.bucket(this.fonciiContentStorageBucketIdentifier),
            fileRef = bucket.file(filePath),
            dataBuffer = Buffer.from(fileDataBufferArray)

        return fileRef
            .save(dataBuffer, {
                metadata: {
                    contentType: contentType,
                    cacheControl: cacheControlPolicy
                }
            })
            .then((_) => {
                logger.info(`Successfully uploaded file to: ${filePath}`)
                return true;
            })
            .catch((error) => {
                logger.error(`Error occurred while uploading file, Error: ${error}, Path: ${filePath}`);
                return false;
            });
    }

    async downloadFile(filePath: string) {
        const bucket = this.storage.bucket(this.fonciiContentStorageBucketIdentifier),
            fileRef = bucket.file(filePath)

        return fileRef
            .download()
            .then((file) => {
                return file[0]!;
            })
            .catch((error) => {
                logger.error(`Error occurred while downloading file, Error: ${error}, Path: ${filePath}`);
                return undefined;
            });
    }

    async getFileMetadata(filePath: string) {
        // Precondition failure, ensure the file path isn't empty
        if (!filePath) return undefined;

        const bucket = this.storage.bucket(this.fonciiContentStorageBucketIdentifier),
            fileRef = bucket.file(filePath);

        return fileRef
            .getMetadata()
            .then((response) => {
                return response[0]!;
            })
            .catch((error) => {
                logger.error(`Error occurred while fetching file metadata, Error: ${error}, Path: ${filePath}`);
                return undefined;
            });
    }

    async getReadableStream(filePath: string) {
        const bucket = this.storage.bucket(this.fonciiContentStorageBucketIdentifier),
            fileRef = bucket.file(filePath)

        return fileRef.createReadStream();
    }

    async getFileURL(filePath: string) {
        const bucket = this.storage.bucket(this.fonciiContentStorageBucketIdentifier),
            fileRef = bucket.file(filePath)

        return fileRef.publicUrl();
    }

    /**
     * Delete a file from Cloud Storage via a reference to the full path of the file, 
     * including the file name, directory, and storage bucket.
     * 
     * @async
     * @param filePath -> Reference to the file to be deleted, directory, and storage bucket
     * @returns -> True if delete was successful, false otherwise
     */
    async deleteFile(filePath: string): Promise<boolean> {
        const bucket = this.storage.bucket(this.fonciiContentStorageBucketIdentifier),
            fileRef = bucket.file(filePath);

        return fileRef
            .delete()
            .then((_) => {
                logger.info(`Successfully deleted file: ${filePath}`)
                return true;
            })
            .catch((error) => {
                logger.error(`Error occurred while deleting file, Error: ${error}, Path: ${filePath}`);
                return false;
            });
    }

    /**
     * Delete an entire folder from Cloud Storage via a reference to the full path of the folder,
     * which acts as a prefix to all the files within the folder that have to be deleted in order for 
     * the folder itself to be deleted as well.
     *
     * @async
     * @param folderPath -> Reference to the folder to be deleted, including the directory and storage bucket.
     * @returns -> True if delete was successful, false otherwise.
     */
    async deleteFolder(folderPath: string): Promise<boolean> {
        const bucket = this.storage.bucket(this.fonciiContentStorageBucketIdentifier);
        var didOperationSucceed = false;

        await bucket.deleteFiles({
            prefix: folderPath
        }).then((_) => {
            logger.info(`Successfully deleted folder at: ${folderPath}.`);
            didOperationSucceed = true;
        })
            .catch((err) => {
                logger.error(`Error encountered while deleting folder at: ${folderPath}, Error: ${err}`);
            })

        return didOperationSucceed;
    }

    /**
     * Downloads a file from a given URL and returns the file data as a buffer alongside the 
     * content type of the file.
     * 
     * @async
     * @param url -> The URL of the file to be downloaded
     * 
     * @returns -> An object containing the expected file
     * data keyed to the 'fileDataModel' keys
     */
    async downloadFileDataFrom(url: string): Promise<CSFileDataModel | undefined> {
        const response = await fetch(url),
            contentType = response.headers.get('content-type'),
            fileDataBufferContents = await response.arrayBuffer(),
            fileDataBuffer = new Uint8Array(fileDataBufferContents);

        return {
            fileDataBuffer: fileDataBuffer,
            contentType: contentType
        } as CSFileDataModel
    }

    // File Conversion Handlers
    /**
     * Converts the supported file data buffer (PNG or JPEG/JPG) into an optimized JPEG file format if it's
     * not already in that format.
     * 
     * @async
     * @param fileDataBuffer -> Supported file image data (PNG or JPEG, nothing else is supported at this time) 
     * 
     * @returns -> Converted and or compressed JPEG file data buffer, undefined if conversion failed.
     */
    async convertImageToJPEG(fileDataBuffer: Uint8Array): Promise<Uint8Array | undefined> {
        // Metrics Logging
        const conversionStartTime = new Date().getTime();

        return await sharp(fileDataBuffer)
            .jpeg()
            .toBuffer()
            .then((jpgBuffer) => {
                // Logging
                logger.info('Conversion to JPEG complete.');

                console.table({
                    originalFileSize: fileDataBuffer.length,
                    convertedFileSize: jpgBuffer.length,
                    conversionDuration: `${(Date.now() - conversionStartTime) / 1000} [s]` // In seconds [s]
                });

                return new Uint8Array(jpgBuffer);
            })
            .catch((err) => {
                logger.error(`Error encountered while converting the specified file data to the JPEG format: ${err}`);
                return undefined;
            });
    }

    /**
     * Resizes valid image media to the specified dimensions and fit.
     * Note: Max size is 8000x8000, min size is 1x1. For time complexity 
     * and memory constraints
     * 
     * @async
     * @param fileDataBuffer
     * @param height -> The desired size of the image (takes priority if width isn't provided and if the fit is cover or outside etc.)
     * @param width -> Optional width parameter to specify, if not provided height takes priority automatically
     * @param fit -> Optional parameters to include to inform the server of how the resized
     * image should fit within its new dimensions. Defaults to outside if none provided (outside gives priority to the height 
     * and preserves the image aspect ratio since height / size is always defined)
     * @param format -> Optional format parameter to include if converting the image to a different format is desired.
     * @param quality -> Optional quality parameter to specify to reduce preserve the quality of the image when converting it to
     * a different format. Default is 100 (full quality)
     *  
     * @returns -> Resized image data if the input data buffer was valid as well as the
     * parameters used to resize the image.
     */
    async resizeImage({
        fileDataBuffer,
        height,
        width,
        fit,
        format,
        quality = 100
    }: {
        fileDataBuffer: Uint8Array | Buffer,
        height: number,
        width?: number,
        fit?: common.MediaServerImageFitParams | string,
        format?: common.MediaServerImageFormatParams | string,
        quality?: number
    }) {
        // Limits
        const MAX_HEIGHT = 8000,
            MAX_WIDTH = 8000,
            MIN_HEIGHT = 1,
            MIN_WIDTH = 1,
            MIN_QUALITY = 1,
            MAX_QUALITY = 100;

        // Invalidate requests that exceed the maximum possible dimensions
        if (
            !isNumberInRange(height, [MIN_HEIGHT, MAX_HEIGHT])
            || (width && !isNumberInRange(width, [MIN_WIDTH, MAX_WIDTH]))
            || (quality && !isNumberInRange(quality, [MIN_QUALITY, MAX_QUALITY]))
        ) return;

        const desiredFormat = CloudStorageService.convertImageFormatParamToSharpFormatEnum(format),
            desiredFit = CloudStorageService.convertImageFitParamToSharpFitEnum(fit);

        // Precondition failure, invalid format or fit inputs, invalidate request
        if ((!desiredFormat && format) || (!desiredFit && fit)) return;

        // Metrics Logging
        const processingStartTime = new Date().getTime();

        // Start image processing pipeline
        const pipeline = sharp(fileDataBuffer)
            .resize(
                width,
                height, {
                fit: desiredFit ??
                    sharp.fit.outside,
                // Prevents the image from being enlarged beyond its original size 
                // (to limit the size of responses within expected bounds)
                withoutEnlargement: true
            });

        // Insert formatting step
        if (desiredFormat) pipeline.toFormat(desiredFormat, { quality });

        return await pipeline
            .toBuffer()
            .then((imgBuffer) => {
                // Logging
                logger.info(`Resizing of image complete`);

                logger.info(`Parameters:`);
                console.table({
                    height,
                    width,
                    fit: desiredFit,
                    format: desiredFormat?.id,
                    quality
                });

                console.table({
                    originalFileSize: fileDataBuffer.length,
                    processedFileSize: imgBuffer.length,
                    processDuration: `${(Date.now() - processingStartTime) / 1000} [s]` // In seconds [s]
                });

                return imgBuffer;
            })
            .catch((err) => {
                logger.error(`Error encountered while resizing image file. ${err}`);

                logger.info(`Parameters:`);
                console.table({
                    height,
                    width,
                    fit: desiredFit,
                    format: desiredFormat?.id,
                    quality
                });

                return undefined;
            });
    }

    static convertImageFitParamToSharpFitEnum(param?: common.MediaServerImageFitParams | string) {
        switch (param) {
            case common.MediaServerImageFitParams.contain:
                return sharp.fit.contain;
            case common.MediaServerImageFitParams.cover:
                return sharp.fit.cover;
            case common.MediaServerImageFitParams.fill:
                return sharp.fit.fill;
            case common.MediaServerImageFitParams.inside:
                return sharp.fit.inside;
            case common.MediaServerImageFitParams.outside:
                return sharp.fit.outside;
        }

        return undefined;
    }

    static convertImageFormatParamToSharpFormatEnum(param?: common.MediaServerImageFormatParams | string) {
        switch (param) {
            case common.MediaServerImageFormatParams.f1:
                return sharp.format.jpg;
            case common.MediaServerImageFormatParams.f2:
                return sharp.format.jpeg;
            case common.MediaServerImageFormatParams.f3:
                return sharp.format.webp;
            case common.MediaServerImageFormatParams.f4:
                return sharp.format.png;
            case common.MediaServerImageFormatParams.f5:
                return sharp.format.heif;
        }

        return undefined;
    }

    /**
     * Converts sharp format enum to image file content type to set headers with
     */
    static convertSharpFormatEnumToSupportedFileContentTypes(format?: sharp.AvailableFormatInfo) {
        switch (format) {
            case sharp.format.jpg:
                return common.FileContentTypes.jpg;
            case sharp.format.jpeg:
                return common.FileContentTypes.jpeg;
            case sharp.format.webp:
                return common.FileContentTypes.webp;
            case sharp.format.png:
                return common.FileContentTypes.png;
            case sharp.format.heif:
                return common.FileContentTypes.heif;
        }

        return undefined;
    }

    // Parsing Methods
    /**
     * Transforms a raw UInt8 array data buffer string into a Uint8Array by 
     * iterating through each character in the string and extracting the Unicode 
     * code point value, which corresponds to the byte value of the original Uint8Array.
     * 
     * Important: Do not pass encoded data to this method, the data passed is interpreted as raw
     * bytes, any encodings will result in a corrupted output. Decode any data before passing it to this method.
     * 
     * @param fileDataBuffer -> Raw UInt8 array string with no encoding
     * @returns -> Parsed UInt8 array to be used elsewhere.
     */
    static parseRawUInt8ArrayFromString(fileDataBuffer: string | undefined): Uint8Array | undefined {
        if (fileDataBuffer == undefined) return undefined;

        const parsedArray: number[] = fileDataBuffer.split(',').map((char) => Number(char)),
            parsedUInt8DataArray = Uint8Array.from(parsedArray);

        return parsedUInt8DataArray;
    }
}