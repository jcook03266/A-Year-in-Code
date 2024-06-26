import { SupportedFonciiPlatforms } from '../../types/common.js';
import { DatabaseServiceAdapter } from "../database/databaseService.js";
/**
 * Loosely coupled service layer for all cross-platform Foncii User related services, operations, and data transformations
 * including database interfacing for mutations and queries.
 */
export default class UserService {
    database: DatabaseServiceAdapter;
    /**
     * @async
     * @param userID
     * @param platform
     * @param fileDataBuffer -> Undefined to delete, defined to upload.
     *
     * @returns -> True if the update was successful, false otherwise.
     */
    updateUserProfilePicture(userID: string, platform: SupportedFonciiPlatforms, fileDataBuffer: Uint8Array | undefined): Promise<boolean>;
    doesUserExist(userID: string, platform: SupportedFonciiPlatforms): Promise<boolean>;
    /**
     * @async
     * @param userID
     * @param platform
     * @param fileDataBuffer
     *
     * @returns -> True if the update was successful, false otherwise.
     */
    setProfilePicture(userID: string, platform: SupportedFonciiPlatforms, fileDataBuffer: Uint8Array | undefined): Promise<boolean>;
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
    updateUserProfilePictureURL(userID: string, platform: SupportedFonciiPlatforms, profilePictureURL?: string | null): Promise<boolean | undefined>;
}
