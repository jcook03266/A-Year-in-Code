// Dependencies
// Types
import { FonciiUser } from "../../__generated__/graphql.js";
import { SupportedFonciiPlatforms } from '../../types/common.js';

// Logging
import { logger } from '../logging/debugLoggingService.js';

// Services
import { FonciiCloudStorageServiceAdapter } from "../cloud-storage/service-adapters/cloudStorageServiceAdapter.js";
import { DatabaseServiceAdapter } from "../database/databaseService.js";

// Namespace Declarations
import * as DatabaseAPI from '../../types/namespaces/database-api.js'

/**
 * Loosely coupled service layer for all cross-platform Foncii User related services, operations, and data transformations
 * including database interfacing for mutations and queries.
 */
export default class UserService {
    // Service
    database = new DatabaseServiceAdapter();

    // User Profile Picture Media
    /**
     * @async
     * @param userID 
     * @param platform 
     * @param fileDataBuffer -> Undefined to delete, defined to upload.
     * 
     * @returns -> True if the update was successful, false otherwise.
     */
    async updateUserProfilePicture(
        userID: string,
        platform: SupportedFonciiPlatforms,
        fileDataBuffer: Uint8Array | undefined
    ): Promise<boolean> {
        if (fileDataBuffer == undefined) {
            // Delete
            return await this.setProfilePicture(userID, platform, fileDataBuffer);
        }

        // Update | Validation
        if (!FonciiCloudStorageServiceAdapter.isProfilePictureMediaValid(fileDataBuffer)) return false;

        // Conversion / Optimization
        let fileDataBufferToUpload: Uint8Array | undefined = fileDataBuffer;
        if (!FonciiCloudStorageServiceAdapter.isProfilePictureMediaInJPEGFormat(fileDataBuffer)) {
            // The image file format is an accepted format, but it's not an optimized JPEG, convert it and then upload it.
            const cloudStorageService = new FonciiCloudStorageServiceAdapter();

            fileDataBufferToUpload = await cloudStorageService.convertImageToJPEG(fileDataBuffer);
        }

        return await this.setProfilePicture(userID, platform, fileDataBufferToUpload);
    }

    // User Validation Handlers
    async doesUserExist(
        userID: string,
        platform: SupportedFonciiPlatforms
    ): Promise<boolean> {
        const documentID = userID;
        let collectionName: DatabaseAPI.FonciiDBCollections;

        switch (platform) {
            case SupportedFonciiPlatforms.fonciiBiz:
                collectionName = DatabaseAPI.FonciiDBCollections.FonciiUsers
                break;
            case SupportedFonciiPlatforms.foncii:
                collectionName = DatabaseAPI.FonciiDBCollections.FMUsers
                break;
            default:
                logger.error(`Unsupported Foncii Platform Identifier Passed: ${platform}`);
                return false;
        }
 
        return await this.database.doesDocumentExistWithProperties(collectionName, { _id: documentID });
    }

    /**
     * @async
     * @param userID 
     * @param platform 
     * @param fileDataBuffer 
     * 
     * @returns -> True if the update was successful, false otherwise.
     */
    async setProfilePicture(
        userID: string,
        platform: SupportedFonciiPlatforms,
        fileDataBuffer: Uint8Array | undefined
    ): Promise<boolean> {
        const cloudStorageService = new FonciiCloudStorageServiceAdapter();

        // Logging Metrics
        let startTime: number = Date.now(),
            elapsedTime: number;

        const { operationSucceeded, permalinkURL } = await cloudStorageService.updateUserProfilePicture(fileDataBuffer, userID);

        // Update the user's account data in the DB
        if (operationSucceeded) {
            await this.updateUserProfilePictureURL(userID, platform, permalinkURL ?? null);
        }

        // Metrics
        elapsedTime = (Date.now() - startTime) / 1000; // In seconds [s]

        operationSucceeded ?
            logger.info(`\nUser Profile Picture Update Complete. \nTime Elapsed: ${elapsedTime}[s]`) :
            logger.info(`\nUser Profile Picture Update Failed. \nTime Elapsed: ${elapsedTime}[s]`);

        return operationSucceeded;
    }

    /**
    * Updates the Foncii User document referenced by the given user ID within the
    * collection specified by the target Foncii platform identifier.
    * 
    * @async
    * @param userID -> The id of the Foncii agnostic user document to update
    * @param platform -> The Foncii platform the target user's account is tied to.
    * @param profilePictureURL -> URL of the user's profile picture media, null 
    * if the user deleted their profile picture media and the field should be deleted by this update.
    */
    async updateUserProfilePictureURL(
        userID: string,
        platform: SupportedFonciiPlatforms,
        profilePictureURL: string | null = null
    ) {
        // Properties
        const documentID = userID;
        let collectionName: DatabaseAPI.FonciiDBCollections;

        switch (platform) {
            case SupportedFonciiPlatforms.fonciiBiz:
                collectionName = DatabaseAPI.FonciiDBCollections.FonciiUsers
                break;
            case SupportedFonciiPlatforms.foncii:
                collectionName = DatabaseAPI.FonciiDBCollections.FMUsers
                break;
            default:
                logger.error(`Unsupported Foncii Platform Identifier Passed: ${platform}`);
                return;
        }

        // Update the required field and the last updated timestamp to track the change.
        const updatedData = {
            profilePictureURL: profilePictureURL,
            lastUpdated: new Date().toISOString()
        } as FonciiUser;

        return await this.database.updateFieldsInDocumentWithID(collectionName, documentID, updatedData);
    }
}