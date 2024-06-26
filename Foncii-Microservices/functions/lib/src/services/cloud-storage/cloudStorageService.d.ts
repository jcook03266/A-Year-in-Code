import { FirebaseService } from '../firebase-admin/firebaseAdminService.js';
/**
 * Service class responsible for uploading files to Google's
 * Cloud Storage service through this secure backend application
 */
export declare class CloudStorageService extends FirebaseService {
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
     * Upload a file to Cloud Storage via a reference to the full path of the file,
     * including the file name, directory, and storage bucket.
     *
     * @async
     * @param filePath -> Reference to the file to be uploaded, directory, and storage bucket
     * @param contentType -> The type of content stored in the file ex.) video/mp4
     * @param fileDataBufferArray -> Array of Uint8 values representing the file contents
     *
     * Read more about the file API here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer,
     * https://developer.mozilla.org/en-US/docs/Web/API/File
     * @returns -> True if upload was successful, false otherwise
     */
    uploadFile(filePath: string, contentType: string | null | undefined, fileDataBufferArray: Uint8Array | undefined): Promise<boolean>;
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
    convertPNGFileToJPEG(pngfileDataBuffer: Uint8Array): Promise<Uint8Array | undefined>;
}
