// Dependencies
// Types
import { UploadMetadata, deleteObject, uploadBytes } from "firebase/storage";
import { FmUserPostMedia } from "../../../__generated__/graphql";

// Firebase SDK
import FirebaseService from "../../../services/firebase/firebaseService";

// Networking
import fetch from "node-fetch";

// App Properties
import { nonProductionEnvironment } from "../../../core-foncii-maps/properties/AppProperties";

// Cloud Storage Service Specific Types
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
  noCache = "no-cache",
}

// Cloud Storage Service Types
export interface MediaUpdateResponse {
  operationSucceeded: boolean;
  permalinkURL?: string;
}

export interface PostMediaUpdateResponse {
  operationSucceeded: boolean;
  media?: FmUserPostMedia;
}

/** Basic Cloud Storage File Data Model */
export interface CSFileDataModel {
  fileDataBuffer: Uint8Array;
  contentType: string | null;
}

/**
 * Service class responsible for uploading files to Google's
 * Cloud Storage service through this secure backend application
 *
 * Supports creation and deletion of files but not folders (this is only possible cleanly (without iterating
 * and deleting all the files) using the admin SDK which is used by the Foncii Media Service), and supports
 * image processing.
 */
export class CloudStorageService extends FirebaseService {
  // Utility Methods
  /**
   * Constructs and returns full URL of the endpoint for the foncii-content CDN storage bucket
   *
   * @returns {String} -> The full URL of the endpoint for the target storage bucket
   */
  generateStorageBucketEndpointFor = (): string => {
    const cdnEndpoint = this.fonciiCDNURL!;

    /// The CDN automatically uses the `foncii-content` storage bucket so no bucket identifier
    // reference is needed here
    return cdnEndpoint;
  };

  /**
   * Constructs and returns a permanent link to the specified file resource
   * uploaded to Google Cloud storage
   *
   * @param {String} filePath -> The full path of the file to be uploaded
   * @returns {String} -> The permanent link (permalink) to the file within the target storage bucket,
   * this link is non-expirable (permanent), for expirable links please generate signed links
   */
  generatePermalinkToFile(filePath: string): string {
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
    const directorySeparator = "/",
      joinedSubdirectories = subdirectories.join(directorySeparator),
      completeFileName = fileName;

    return (
      parentDirectory +
      directorySeparator +
      joinedSubdirectories +
      (subdirectories.length > 0 ? directorySeparator : "") +
      completeFileName
    );
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
    const directorySeparator = "/",
      joinedSubdirectories = subdirectories.join(directorySeparator);

    return (
      parentDirectory +
      directorySeparator +
      joinedSubdirectories +
      (subdirectories.length > 0 ? directorySeparator : "")
    );
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
    cacheControlPolicy: SimpleCacheControlPolicies | undefined = undefined
  ): Promise<boolean> {
    // Precondition failure
    if (fileDataBufferArray == undefined) return false;

    const fileRef = this.getRefForObject({ filePath }),
      dataBuffer = Buffer.from(fileDataBufferArray),
      metadata = {
        contentType,
        cacheControl: cacheControlPolicy,
      } as UploadMetadata;

    return uploadBytes(fileRef, dataBuffer, metadata)
      .then((_) => {
        if (nonProductionEnvironment)
          console.info(`Successfully uploaded file to: ${filePath}`);

        return true;
      })
      .catch((error) => {
        if (nonProductionEnvironment)
          console.error(
            `Error occurred while uploading file, Error: ${error}, Path: ${filePath}`
          );
        return false;
      });
  }

  /**
   * Delete a file from Cloud Storage via a reference to the full path of the file,
   * including the file name, directory, and storage bucket.
   *
   * @async
   * @param filePath -> Reference to the file to be deleted, directory, and storage bucket
   *
   * @returns -> True if delete was successful, false otherwise
   */
  async deleteFile(filePath: string): Promise<boolean> {
    const fileRef = this.getRefForObject({ filePath });

    return deleteObject(fileRef)
      .then((_) => {
        if (nonProductionEnvironment)
          console.info(`Successfully deleted file: ${filePath}`);
        return true;
      })
      .catch((error) => {
        if (nonProductionEnvironment)
          console.error(
            `Error occurred while deleting file, Error: ${error}, Path: ${filePath}`
          );
        return false;
      });
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
  async downloadFileDataFrom(
    url: string
  ): Promise<CSFileDataModel | undefined> {
    const response = await fetch(url),
      contentType = response.headers.get("content-type"),
      fileDataBufferContents = await response.arrayBuffer(),
      fileDataBuffer = new Uint8Array(fileDataBufferContents);

    return {
      fileDataBuffer: fileDataBuffer,
      contentType: contentType,
    } as CSFileDataModel;
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
  static parseRawUInt8ArrayFromString(
    fileDataBuffer: string | undefined
  ): Uint8Array | undefined {
    if (fileDataBuffer == undefined) return undefined;

    const parsedArray: number[] = fileDataBuffer
        .split(",")
        .map((char) => Number(char)),
      parsedUInt8DataArray = Uint8Array.from(parsedArray);

    return parsedUInt8DataArray;
  }
}
