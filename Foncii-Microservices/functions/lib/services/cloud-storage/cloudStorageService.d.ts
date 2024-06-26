/// <reference types="node" />
/// <reference types="node" />
import { FirebaseAdminService } from '../firebase-admin/firebaseAdminService.js';
import sharp from 'sharp';
import * as common from '../../types/common.js';
/**
 * Service class responsible for uploading files to Google's
 * Cloud Storage service through this secure backend application
 */
export declare class CloudStorageService extends FirebaseAdminService {
    /**
     * Constructs and returns full URL of the endpoint for the foncii-content CDN storage bucket
     *
     * @returns {String} -> The full URL of the endpoint for the target storage bucket
     */
    generateStorageBucketEndpointFor: () => string;
    /**
     * Constructs and returns a permanent link to the specified file resource
     * uploaded to Google Cloud storage
     *
     * @param {String} filePath -> The full path of the file to be uploaded
     * @returns {String} -> The permanent link (permalink) to the file within the target storage bucket,
     * this link is non-expirable (permanent), for expirable links please generate signed links
     */
    generatePermalinkToFile(filePath: string): string;
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
    createFilePathFor(parentDirectory: string, subdirectories: string[], fileName: string): string;
    /**
     * Creates a path to the leaf (bottom-most) folder referenced by the provided parameters.
     *
     * @param parentDirectory
     * @param subdirectories
     *
     * @returns -> A complete path to the target folder using the concatenated
     * resources provided to this constructor method.
     */
    createFolderPathFor(parentDirectory: string, subdirectories: string[]): string;
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
    uploadFile(filePath: string, contentType: string | undefined, fileDataBufferArray: Uint8Array | undefined, cacheControlPolicy?: common.SimpleCacheControlPolicies | undefined): Promise<boolean>;
    downloadFile(filePath: string): Promise<Buffer | undefined>;
    getFileMetadata(filePath: string): Promise<import("@google-cloud/storage").FileMetadata | undefined>;
    getReadableStream(filePath: string): Promise<import("stream").Readable>;
    getFileURL(filePath: string): Promise<string>;
    /**
     * Delete a file from Cloud Storage via a reference to the full path of the file,
     * including the file name, directory, and storage bucket.
     *
     * @async
     * @param filePath -> Reference to the file to be deleted, directory, and storage bucket
     * @returns -> True if delete was successful, false otherwise
     */
    deleteFile(filePath: string): Promise<boolean>;
    /**
     * Delete an entire folder from Cloud Storage via a reference to the full path of the folder,
     * which acts as a prefix to all the files within the folder that have to be deleted in order for
     * the folder itself to be deleted as well.
     *
     * @async
     * @param folderPath -> Reference to the folder to be deleted, including the directory and storage bucket.
     * @returns -> True if delete was successful, false otherwise.
     */
    deleteFolder(folderPath: string): Promise<boolean>;
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
    downloadFileDataFrom(url: string): Promise<CSFileDataModel | undefined>;
    /**
     * Converts the supported file data buffer (PNG or JPEG/JPG) into an optimized JPEG file format if it's
     * not already in that format.
     *
     * @async
     * @param fileDataBuffer -> Supported file image data (PNG or JPEG, nothing else is supported at this time)
     *
     * @returns -> Converted and or compressed JPEG file data buffer, undefined if conversion failed.
     */
    convertImageToJPEG(fileDataBuffer: Uint8Array): Promise<Uint8Array | undefined>;
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
    resizeImage({ fileDataBuffer, height, width, fit, format, quality }: {
        fileDataBuffer: Uint8Array | Buffer;
        height: number;
        width?: number;
        fit?: common.MediaServerImageFitParams | string;
        format?: common.MediaServerImageFormatParams | string;
        quality?: number;
    }): Promise<Buffer | undefined>;
    static convertImageFitParamToSharpFitEnum(param?: common.MediaServerImageFitParams | string): "fill" | "contain" | "cover" | "inside" | "outside" | undefined;
    static convertImageFormatParamToSharpFormatEnum(param?: common.MediaServerImageFormatParams | string): sharp.AvailableFormatInfo | undefined;
    /**
     * Converts sharp format enum to image file content type to set headers with
     */
    static convertSharpFormatEnumToSupportedFileContentTypes(format?: sharp.AvailableFormatInfo): common.FileContentTypes.jpg | common.FileContentTypes.jpeg | common.FileContentTypes.webp | common.FileContentTypes.png | common.FileContentTypes.heif | undefined;
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
    static parseRawUInt8ArrayFromString(fileDataBuffer: string | undefined): Uint8Array | undefined;
}
