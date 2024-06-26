// Dependencies
// Types
import { FonciiDBCollections } from "../../../../types/namespaces/database-api";

// Models
import UserReferralModel from "../../../../models/shared/userReferralModel";

// Services
import { DatabaseServiceAdapter } from "../../database/databaseService";

// Logging
import logger from "../../../../foncii-toolkit/debugging/debugLogger";

/**
 * A service class responsible for interacting with the proprietary Foncii referral code system
 */
export default class UserReferralService {
    // Properties
    private database: DatabaseServiceAdapter = new DatabaseServiceAdapter();

    // Dynamic Methods
    /**
     * Provisions a new document in the User Referrals collection for the given 
     * properties. Fired when a user creates an account using a referral link
     * populated with the referrerCode's code.
     * 
     * @param referrerCode -> The person who referred the user to create an account
     * @param refereeCode -> The person who created an account with the referrerCode's code via some referral link
     * 
     * @returns -> True if the new user referral was created successfully, false otherwise.
     */
    async AddNewReferral(referrerCode: string, refereeCode: string) {
        const userReferral = new UserReferralModel({
            referrerCode,
            refereeCode,
        }), documentID = userReferral.id

        // Precondition failure
        if (await this.hasUserBeenReferredAlready({ refereeCode })) {
            logger.warn(`The user with the referral code '${refereeCode} has already been referred and cannot be referred again.`);
            return false;
        }

        return await this.database.createNewDocumentWithID(
            FonciiDBCollections.UserReferrals,
            documentID,
            userReferral.toObject()
        );
    }

    /**
     * Since a `refereeCode` can only be used once when a person signs up, this can be used
     * to delete the document containing the spent referral code due to the one-to-one relationship.
     * A `referrerCode` on the other hand has a one-to-many relationship with referee codes and can't be 
     * used to delete referrals unless deleting all referrals associated with the user's account.
     * 
     * @param refereeCode -> Code used by a user signing up via a referral link with a referrer code
     * embedded in it.
     * 
     * @returns -> True if the referral was deleted successfully, false otherwise.
     */
    async deleteReferral({ refereeCode }: { refereeCode: string }) {
        const properties: Partial<UserReferral> = { refereeCode };

        return await this.database.deleteDocumentWithProperties(
            FonciiDBCollections.UserReferrals,
            properties
        );
    }

    /**
     * Deletes all referrals associated with the given `referrerCode`. The
     * `referrerCode` has a one-to-many relationship with the `refereeCode` field
     * thus it can be used to delete all referrals associated with a user's account, (i.e)
     * when the user deletes their account.
     * 
     * @param referrerCode -> Code used by other users when signing up to attribute their
     * sign up to a specific user's account.
     * 
     * @returns -> True if all referrals associated with the `referrerCode` were deleted successfully,
     * false otherwise.
     */
    async deleteAllReferralsMadeByReferrer({ referrerCode }: { referrerCode: string }) {
        const properties: Partial<UserReferral> = { referrerCode };

        return await this.database.deleteDocumentsWithProperties(
            FonciiDBCollections.UserReferrals,
            properties
        );
    }

    /**
     * Determines whether or not the user with the given refereeCode has already been referred.
     * A user can't be referred twice as a person can only sign up once, it's not physically
     * possible to sign up twice due to all of our existing safe guards on the server.
     * 
     * @param refereeCode -> Code used by a user signing up via a referral link with a referrer code
     * embedded in it.
     * 
     * @returns -> True if the user has been referred previously (account already exists and has an existing referral),
     * false otherwise.
     */
    async hasUserBeenReferredAlready({ refereeCode }: { refereeCode: string }) {
        const properties: Partial<UserReferral> = { refereeCode };

        return await this.database.doesDocumentExistWithProperties<UserReferral>(
            FonciiDBCollections.UserReferrals,
            properties
        );
    }

    /**
     * @param referrerCode -> Code used by other users when signing up to attribute their
     * sign up to a specific user's account.
     * 
     * @returns -> The total amount of referrals made by the given referrerCode.
     */
    async countTotalReferralsMadeByReferrer({ referrerCode }: { referrerCode: string }) {
        const properties: Partial<UserReferral> = { referrerCode };

        return await this.database.countTotalDocumentsWithProperties(
            FonciiDBCollections.UserReferrals,
            properties
        );
    }

    /**
     * @param referrerCode -> Code used by other users when signing up to attribute their
     * sign up to a specific user's account.
     * 
     * @returns -> True if the user has made any referrals (conversions from their referral code) 
     * with their given referrerCode, false otherwise.
     */
    async hasUserMadeReferralConversionsWith({ referrerCode }: { referrerCode: string }) {
        const properties: Partial<UserReferral> = { referrerCode };

        return await this.database.doesDocumentExistWithProperties<UserReferral>(
            FonciiDBCollections.UserReferrals,
            properties
        );
    }

    // Static Methods
    /**
     * Creates a unique referral code for the given user by salting and shuffling
     * the provided userID.
     * 
     * @param userID 
     * 
     * @returns -> The randomized referral code based on the passed user ID string
     */
    static generateReferralCodeFor(userID: string) {
        // Convert the user ID to a string
        let baseString = userID,
            salt = this.generateRandomSalt();

        // Salt base string
        baseString += salt;

        // Shuffle the string by splitting it into an array of characters,
        // shuffling the order of these characters randomly, and then
        // joining them back into a single string
        const referralCode = baseString.split('').sort(() => Math.random() - 0.5).join('');

        return referralCode.toUpperCase();
    }

    /**
     * Creates a unique personalized referral code for the given user by concatenating
     * a randomized salt to their first and last name initials.
     * 
     * @param firstName 
     * @param lastName 
     * 
     * @returns -> Personalized referral code.
     */
    static generatePersonalizedReferralCode({
        firstName,
        lastName
    }: {
        firstName: string,
        lastName: string
    }) {
        // Convert the user's initials to a string
        const baseString = firstName[0] + lastName[0],
            salt = this.generateRandomSalt(),
            referralCode = baseString + salt;

        return referralCode.toUpperCase();
    }

    /**
    * Generates a random alphanumeric salt of the given length
    * 
    * @param saltLength - The length of the salt string, default is 4 characters long
    * 
    * @returns {String} The randomized salt of length 'n'
    */
    static generateRandomSalt(saltLength = 6): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let salt = '';

        for (let i = 0; i < saltLength; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            salt += chars[randomIndex];
        }

        return salt;
    }
}