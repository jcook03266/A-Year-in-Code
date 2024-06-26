// Dependencies 
// Types
import { SupportedFonciiPlatforms } from "../../../../types/namespaces/microservice-api";
import { AuthProviders, UserRoles } from "../../../../types/common";
import { AggregationSortOrders, FonciiDBCollections, FullTextSearchIndexes } from "../../../../types/namespaces/database-api";
import { BSON } from "mongodb";

// Models
import UserAccountModel from "../../../../models/shared/protocols/userAccountModel";
import FMUserModel from "../../../../models/foncii/user-models/fmUserModel";

// Services
import UserReferralService from "./userReferralService";
import TasteProfileService from "../../taste-profile/tasteProfileService";
import FonciiMapsPostService from "../../foncii-maps/user-posts/fmPostService";
import { DatabaseServiceAdapter } from "../../database/databaseService";
import RestaurantService from "../restaurants/restaurantService";
import { FirebaseAdminService } from "../../firebase/firebaseAdminService";

// Microservices
import { MicroserviceRepository } from "../../../../core-foncii/microservices/repository/microserviceRepository";

// Utilities
import { currentDateAsISOString } from "../../../../foncii-toolkit/utilities/convenienceUtilities";

// Logging
import logger from "../../../../foncii-toolkit/debugging/debugLogger";

// Local Types
type UserSortOptions = { [K in keyof Partial<FMUser>]: AggregationSortOrders };
type UserPropertyOptions = { [K in keyof Partial<FMUser>]: any };

/**
 * Loosely coupled service layer for all Foncii Maps (FM) user related services, operations, and data transformations
 * including database interfacing for mutations and queries
 */
export default class UserService {
    // Services
    userReferralService = new UserReferralService();
    tasteProfileService = new TasteProfileService();
    userPostService = new FonciiMapsPostService();
    restaurantService = new RestaurantService();
    database = new DatabaseServiceAdapter();
    firebaseAdmin = (platform: SupportedFonciiPlatforms) => new FirebaseAdminService(platform);

    // Full-text search 
    // Autocomplete
    // See here: https://cloud.mongodb.com/v2/6500cad1a2317e0f32b576a6#/clusters/atlasSearch/Foncii-D-Cluster?collectionName=Foncii%20Maps%20Users&database=FonciiFediverseDB&indexName=default&view=VisualEdit
    // Resources about ngram and edgegram: https://stackoverflow.com/questions/31398617/how-edge-ngram-token-filter-differs-from-ngram-token-filter
    static AutocompleteFullTextSearchMappedFields = {
        email: "email",
        username: "username",
        mapName: "mapName"
    }

    // Reusable / Modular Methods
    // Mutations
    /**
     * Updates the (Foncii Maps (FM)) user document referenced by the given (Foncii Maps) user ID.
     * 
     * Note: Only use the supported fields provided by the FM user data model
     * to avoid adding isolated/unknown data to a user document. Any literal undefined or null 
     * fields will be marked as unset and consequently removed from the document, if this isn't the
     * desired behavior, use the replace method to update the entire document at once and preserve 
     * any fields by trimming out these values instead of removing the fields completely.
     * 
     * @async
     * @param userID -> The id of the FM user document to update
     * @param properties -> Updated FM user data to merge with the existing data
     * 
     * @returns -> True if the update was successful, false otherwise. 
     */
    async updateUser(
        userID: string,
        properties: UserPropertyOptions
    ) {
        const documentID = userID,
            updatedProperties = {
                ...properties,
                lastUpdated: currentDateAsISOString(), // Will overwrite any property named 'lastUpdated' below as intended if included
            }

        return await this.database
            .updateFieldsInDocumentWithID(
                FonciiDBCollections.FMUsers,
                documentID,
                updatedProperties
            );
    }

    // Queries
    /**
     * Searches the (Foncii Maps) users collection for a single user with properties 
     * (username, email, user ID etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * 
     * @returns -> Null if the user can't be found, FM user data model otherwise.
     */
    async findUserWith(
        properties: UserPropertyOptions
    ) {
        return await this.database
            .findDocumentWithProperties<FMUser>(
                FonciiDBCollections.FMUsers,
                properties
            );
    }

    /**
     * Searches the (Foncii Maps) users collection for users with properties 
     * (username, email, user ID etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * @param resultsPerPage -> The maximum number of users to return per page (0 = no limit)
     * @param paginationPageIndex -> The current page index (0 = first page of results)
     * 
     * @returns -> Aggregated collection documents
     */
    async findUsersWith({
        properties = {},
        resultsPerPage = 100,
        paginationPageIndex = 0,
        sortOptions = {}
    }: {
        properties?: UserPropertyOptions,
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: UserSortOptions
    }) {
        return await this.database.findDocumentsWithProperties<FMUser>({
            collectionName: FonciiDBCollections.FMUsers,
            properties,
            resultsPerPage,
            paginationPageIndex,
            sortOptions
        });
    }

    /**
     * Determines if the (Foncii Maps) user collection includes a user with properties 
     * (username, email, user ID etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * 
     * @returns -> True if a user exists with the given properties, false otherwise.
     */
    async doesUserExistWith(
        properties: UserPropertyOptions
    ) {
        return await this.database
            .doesDocumentExistWithProperties<FMUser>(
                FonciiDBCollections.FMUsers,
                properties
            );
    }

    /**
     * Determines the total amount of users in the FM Users
     * collection that match the given properties. 
     * 
     * @async
     * @param properties 
     * 
     * @returns -> An integer representing the total amount of users in the FM Users
     * collection that match the given properties.
     */
    async countTotalUsersWithProperties(
        properties: UserPropertyOptions
    ) {
        return await this.database.countTotalDocumentsWithProperties(
            FonciiDBCollections.FMUsers,
            properties
        );
    }

    // Unique Methods
    // Queries
    /**
      * Performs autocomplete full-text search on all fields
      * mapped to the specified collection's search index.
      * 
      * @param searchQuery -> The text search query to conduct full-text search with
      * @param ~ Pagination Parameters
      *
      * @returns -> Aggregated collection documents
      */
    async autocompleteFullTextSearch({
        searchQuery,
        properties,
        pipelineStages = [],
        resultsPerPage = 100,
        paginationPageIndex,
        sortOptions,
        projectionStage = undefined
    }: {
        searchQuery: string
        properties?: UserPropertyOptions
        pipelineStages?: BSON.Document[]
        resultsPerPage?: number
        paginationPageIndex?: number
        sortOptions?: UserSortOptions
        projectionStage?: { $project: { [K in keyof Partial<UserPropertyOptions>]: 1 | 0 } }
    }) {
        // Fields to perform autocomplete search on
        const autocompleteMappedFields = Object.values(UserService.AutocompleteFullTextSearchMappedFields);

        return await this.database
            .autocompleteTextSearchAggregationPipeline<FMUser>({
                collectionName: FonciiDBCollections.FMUsers,
                indexName: FullTextSearchIndexes.FMUsers,
                pipelineStages,
                searchQuery,
                autocompleteMappedFields,
                properties,
                resultsPerPage,
                paginationPageIndex,
                sortOptions,
                projectionStage
            });
    }

    /**
     * @async
     * @param username 
     * 
     * @returns -> The email associated with the given username, undefined if 
     * the username is not associated with any email.
     */
    async getUserEmailAssociatedWithUsername(username: string) {
        return (await this.findUserWith({ username }))?.email;
    }

    /**
     * @async
     * @param phoneNumber 
     * 
     * @returns -> The email associated with the given phone number, undefined if 
     * the phone number is not associated with any email.
     */
    async getUserEmailAssociatedWithPhoneNumber(phoneNumber: string) {
        return (await this.findUserWith({ phoneNumber }))?.email;
    }

    /**
     * Determines whether or not a Foncii Maps user exists with the given username.
     * 
     * @async
     * @param username 
     * 
     * @returns -> True if a user exists with the given username, false otherwise.
     */
    async doesUserExistWithUsername(username: string) {
        return await this.doesUserExistWith({ username });
    }

    /**
     * Determines whether or not a Foncii Maps user exists with the given email
     * address.
     * 
     * @async
     * @param email 
     * 
     * @returns -> True if a user exists with the given email address, false otherwise.
     */
    async doesUserExistWithEmail(email: string) {
        return await this.doesUserExistWith({ email });
    }

    /**
     * Determines whether or not a Foncii Maps user exists with the given phone number.
     * 
     * @async
     * @param email 
     * 
     * @returns -> True if a user exists with the given phone number, false otherwise.
     */
    async doesUserExistWithPhoneNumber(phoneNumber: string) {
        return await this.doesUserExistWith({ phoneNumber });
    }

    /**
     * Determines whether or not a Foncii Maps user exists with the given (Foncii Maps) User ID
     * 
     * @async
     * @param id -> Generated UUID string to find in the database.
     * 
     * @returns -> True if a user exists with the given (Foncii Maps (FM)) User ID, false otherwise.
     */
    async doesUserExistWithID(id: string) {
        return await this.doesUserExistWith({ id });
    }

    /**
     * Determines if a specific map name already exists or not, can be used to determine if a user
     * can claim a new map name or not, given they have the exclusive rights to the custom name.
     * 
     * @async
     * @param mapName 
     * 
     * @returns -> True if the map name is already owned by a user, false otherwise.
     */
    async doesMapNameExist(mapName: string) {
        return await this.doesUserExistWith({ mapName });
    }

    /**
     * Fetches the FM User with the given username (if any exists).
     * 
     * @async
     * @param username 
     * 
     * @returns -> Null if the user can't be found, FM user data model otherwise.
     */
    async findUserWithUsername(username: string) {
        return await this.findUserWith({ username });
    }

    /**
     * Finds and returns the (Foncii Maps (FM)) user document corresponding to the 
     * given user ID in the database (if it exists).
     * 
     * @async
     * @param id -> User ID of the user to fetch from the database.
     * 
     * @returns -> Null if the user can't be found, FM user data model otherwise.
     */
    async findUserWithID(id: string) {
        return await this.database
            .findDocumentWithID<FMUser>(FonciiDBCollections.FMUsers, id);
    }

    /**
     * Finds and returns all Foncii Maps users from the database given the results per page,
     * pagination index and sort options provided.
     * 
     * Note: Users are sorted by newest to oldest by default here. This is indexed behavior and 
     * shouldn't really be changed as there's really no reason to do so from a production point of view.
     * The same logic goes for any other methods that pull multiple users at once.
     * 
     * @async
     * @param resultsLimit -> Default is 100, be careful not to fetch too many entities at once in order to not exceed the device's memory limit.
     * @param paginationPageIndex -> Default is 0
     * 
     * @returns -> Aggregated collection documents
     */
    async getAllUsers(
        resultsPerPage: number = 100,
        paginationPageIndex: number = 0
    ) {
        return await this.findUsersWith({
            resultsPerPage,
            paginationPageIndex,
            sortOptions: { creationDate: AggregationSortOrders.descending }
        });
    }

    /**
     * Determines the total amount of users in the FM Users collection.
     * 
     * @async
     * 
     * @returns -> An integer representing the total amount of users in the FM Users
     * collection.
     */
    async countTotalUsers(): Promise<number> {
        return await this.database.countTotalDocumentsInCollection(FonciiDBCollections.FMUsers);
    }

    // Mutations
    /**
     * 'Shadows' an existing user account by copying over the account data and changing any unique identifiers 
     * (username) and userID. Shadow accounts aren't meant for regular use, this is an adhoc process to produce
     * accounts that mock existing accounts for testing purposes.
     * 
     * Important: Once done, delete the shadow account in order to prevent it from being seen by live users. Right now this
     * is a very raw process but this will be improved over time.
     * 
     * @async
     * @param userID -> The user ID of an existing account to mock.
     * 
     * @returns -> The newly created (Foncii Maps) user data model shadowing an existing user account if the 
     * user was created and inserted into the database successfully, null otherwise (operation failed or the target
     * user account doesn't exist and thus can't be shadowed)
     */
    async createShadowUserFor(userID: string): Promise<FMUser | null> {
        const existingUser = await this.findUserWithID(userID);

        // Precondition failure
        if (!existingUser) return null;

        /**
         * Recursively increments a username numerically in sequential order username123+1 -> username+2, or 
         * username123 -> username123+1 if shadowing an original user account, until the username is unique.
         * 
         * @async
         * @param existingUser -> Existing user whose username will be incremented
         * @param userService -> Reference to the user service to perform a username exists query from this local scope
         * 
         * @returns -> The incremented shadow user username, ex.) username123+1
         */
        async function incrementShadowUserUsername(existingUsername: string, userService: UserService): Promise<string> {
            const currentUsername = existingUsername,
                splitUsername = currentUsername.split('*'),
                shadowUsernameIncrement = Number(splitUsername[1] ?? 0),
                incrementedShadowUsernameNumber = shadowUsernameIncrement + 1,
                incrementedShadowUsername = splitUsername[0] + '*' + incrementedShadowUsernameNumber,
                doesUsernameExist = await userService.doesUserExistWithUsername(incrementedShadowUsername);

            return doesUsernameExist ? (await incrementShadowUserUsername(incrementedShadowUsername, userService)) : incrementedShadowUsername;
        }

        async function incrementEmailAddress(existingEmail: string, userService: UserService): Promise<string> {
            const currentEmail = existingEmail,
                splitEmail = currentEmail.split('@'),
                emailUsername = splitEmail[0],
                emailDomain = splitEmail[1],
                splitEmailUsername = emailUsername.split('+'),
                emailUsernameIncrement = Number(splitEmailUsername[1] ?? 0),
                incrementedEmailUsernameNumber = emailUsernameIncrement + 1,
                incrementedEmailUsername = splitEmailUsername[0] + '+' + incrementedEmailUsernameNumber,
                incrementedEmail = incrementedEmailUsername + '@' + emailDomain,
                doesEmailExist = await userService.doesUserExistWithEmail(incrementedEmail);

            return doesEmailExist ? (await incrementEmailAddress(incrementedEmail, userService)) : incrementedEmail;
        }

        const [incrementedShadowUsername, incrementedShadowUserEmail] = await Promise.all([
            incrementShadowUserUsername(existingUser.username, this),
            incrementEmailAddress(existingUser.email, this)
        ]);

        return await this.createUser({
            // Porting over / mapping existing user data
            ...existingUser,
            authProvider: AuthProviders.Default,
            oAuthProfilePictureURL: existingUser.profilePictureURL,
            // Specify this user as a test user to restrict its access to resources (if access control policies are in place)
            role: UserRoles.Test,
            // Incremented UIDs to avoid collisions
            username: incrementedShadowUsername,
            email: incrementedShadowUserEmail,
            // Generating new user id for the shadow user
            userID: DatabaseServiceAdapter.generateUUIDHexString()
        });
    }

    /**
     * Updates the profile picture for the specified user. This endpoint can be used across multiple
     * Foncii platforms (Foncii and Foncii Biz) by simply passing in the platform identifier. Undefined to delete,
     * defined UInt8Array to update the profile picture. Only PNG and JPEG/JPG types are allowed; these limitations
     * are strictly enforced within the media service so don't worry about that here.
     * 
     * Note: No encoded file buffer data allowed, the buffer string is passed to the endpoint as is.
     * 
     * @async
     * @param userID -> Platform agnostic id of the user to upload the profile picture for.
     * @param platform -> The Foncii platform to which the provided user belongs to
     * @param fileDataBufferString -> Raw decimal array formatted binary data of the file to upload in string form, do not encode
     * this data before passing it to the endpoint, only raw data is permissible. Pass in undefined if deletion of the user's media is 
     * intended.
     * 
     * @returns -> True if upload was successful (status code 200 or 201 etc.), false otherwise.
     */
    async setUserProfilePicture({
        userID,
        platform,
        fileDataBufferString
    }: {
        userID: string,
        platform: SupportedFonciiPlatforms,
        fileDataBufferString?: string
    }) {
        return await MicroserviceRepository.fonciiMedia()
            .setUserProfilePicture(userID, platform, fileDataBufferString);
    }

    /**
     * Creates a new user document in the database using the provided
     * (Foncii Maps (FM)) user data (if the user with the 
     * provided information does not already exist)
     * 
     * @async
     * @param userID -> ID of the new Firebase auth user generated by Firebase SDK on the client side and passed here to create the user in our DB.
     * @param authProvider -> Authentication provider used to create the user's account / provision the first login with.
     * @param externalReferralCode -> An optional referral code that the user used to sign up with (i.e by clicking on a referral link sent by another user)
     * @param username -> Required username parameter. The username is used to access user galleries so it's required.
     * @param phoneNumber -> Optional phone number field if a phone number is provided
     * @param email -> Mandatory field, this is always provided when using the default (Email + PW) provider or some third-party OAuth provider.
     * 
     * @returns -> The newly created (Foncii Maps) user data model if the 
     * user was created and inserted into the database successfully, null otherwise.
     */
    async createUser(props: Partial<FMUserModel> & {
        userID: string,
        firstName: string,
        lastName: string,
        username: string,
        phoneNumber?: string,
        email: string,
        authProvider: AuthProviders,
        role?: UserRoles,
        externalReferralCode?: string | undefined,
        oAuthProfilePictureURL?: string | undefined
    }): Promise<FMUser | null> {
        // Parsing
        const profilePictureURL = props.oAuthProfilePictureURL;

        const newUser = new FMUserModel({
            ...props,
            id: props.userID, // Will overwrite any property named 'id' as intended if included
            authProviders: [props.authProvider],
            lastLogin: UserAccountModel.generateUserLogin(props.authProvider),
            /** Initial profile picture URL to send back to the client until the upload completes */
            profilePictureURL,
            role: props.role ?? UserRoles.Basic, // All manually created users are basic, they can upgrade to 'creator' or better down the line 
            // Note: It doesn't interfere with the cloud storage when this URL is defined and no files are actually in the storage bucket under the user's media / profile picture directory
        }), documentID = newUser.id;

        // Precondition failure
        if (newUser == undefined) return null;

        // Operation success flag
        let didSucceed = false;

        // Validate that the user is unique before creating a record for them in the DB.
        if (await this.doesUserExistWithEmail(props.email)) {
            logger.warn(`A unique user with the email ${props.email} already exists and cannot be created again.`);
            return null;
        }
        else if (props.username && await this.doesUserExistWithUsername(props.username)) {
            // Note: These conditional branches are separate so that the logger's output can reflect the issue at hand
            logger.warn(`A unique user with the username ${props.username} already exists and cannot be created again.`);
            return null;
        }

        // Referral System
        if (props.externalReferralCode) {
            // User was referred to create an account by another user with the provided referral code
            await this.userReferralService.AddNewReferral(props.externalReferralCode, newUser.referralCode);
        }

        didSucceed = await this.database.createNewDocumentWithID(
            FonciiDBCollections.FMUsers,
            documentID,
            newUser.toObject()
        );

        // Upload the user's profile picture from the given external image URL (if any)
        // Optional, only available through OAuth providers that support it
        if (didSucceed && profilePictureURL) {
            const userID = newUser.id;

            MicroserviceRepository.fonciiMedia()
                .setUserProfilePictureFromURL(
                    userID,
                    SupportedFonciiPlatforms.foncii,
                    profilePictureURL
                );
        }

        return didSucceed ? newUser : null;
    }

    /**
     * Deletes the user and all of their associated documents and media from the database and other
     * file systems, as well as the external user auth system.
     * 
     * @async
     * @param userID 
     * 
     * @returns -> True if the user was deleted successfully, false otherwise.
     */
    async deleteUser({
        userID,
        platform
    }: {
        userID: string,
        platform: SupportedFonciiPlatforms
    }) {
        const user = await this.findUserWithID(userID);

        // Precondition failure
        if (!user) {
            logger.warn(`A user with the ID ${userID} does not exist and cannot be deleted.`);
            return false;
        }

        // Note: User referrals are kept intact and aren't deleted (to preserve metrics)
        await Promise.all([
            // Delete all taste profiles, no need to unset the taste profile from the user's account as their entire document will be deleted
            this.tasteProfileService.deleteAllUserTasteProfiles(userID),

            // Delete all posts made by this user including their uploaded media
            this.userPostService.deleteAllPostsForUser(userID),

            // Remove all media uploaded by this user including their profile picture (if any)
            this.setUserProfilePicture({ userID, platform }),

            // Delete any saves 
            this.restaurantService.deleteAllSavedRestaurantsForUser(userID)

            // Delete any friendships.. etc.
        ]);

        // Delete the from firebase as well using admin
        try {
            await this.firebaseAdmin(SupportedFonciiPlatforms.foncii).deleteUser(userID);
        }
        catch (err) {
            logger.error('[deleteUser] User does not exist in Firebase', err)
        }

        // Finally delete the user's account data from the database
        return await this.database.deleteDocumentWithID(FonciiDBCollections.FMUsers, userID);
    }

    /**
     * Updates the map name corresponding to the given user.
     * 
     * @async 
     * @param userID 
     * @param newMapName 
     * 
     * @returns -> True if the update was successful, false otherwise.
     */
    async updateMapName(userID: string, newMapName: string) {
        const mapNameExists = await this.doesMapNameExist(newMapName);

        // Validation
        if (mapNameExists) {
            logger.warn(`A map with the name ${newMapName} already exists. Choose a different map name.`);
            return false;
        }

        return await this.updateUser(userID, { mapName: newMapName });
    }

    /**
     * Updates the map name corresponding to the given user.
     * 
     * @async 
     * @param userID 
     * @param tasteProfileID -> Defined if the taste profile is being set to one that exists, undefined
     * if the taste profile is being set to undefined i.e the user no longer has a taste profile selected.
     * 
     * @returns -> True if the update was successful, false otherwise.
     */
    async setPrimaryTasteProfile({
        userID,
        tasteProfileID = undefined
    }: {
        userID: string,
        tasteProfileID?: string | undefined
    }) {
        // Determine if the passed taste profile id belongs to an actual document | not used when unsetting the taste profile 
        if (tasteProfileID) {
            const tasteProfileExists = await this.tasteProfileService.doesTasteProfileExistWith({ id: tasteProfileID });

            if (!tasteProfileExists) {
                logger.warn(`A taste profile with the ID ${tasteProfileID} does not exist and cannot be set as the user ${userID}'s current taste profile.`);
                return false;
            }
        }

        return await this.updateUser(userID, { primaryTasteProfileID: tasteProfileID });
    }

    /** Authentication Logging Operations */
    /**
     * Tracks user login events with timestamp logging
     * and auth provider tracking.
     * 
     * @async
     * @param userID 
     * @param authProvider
     * 
     * @returns -> True if the update was successful, false otherwise.
     */
    async loginUser(userID: string, authProvider: AuthProviders) {
        const lastLogin = UserAccountModel.generateUserLogin(authProvider),
            fetchedUser = await this.findUserWithID(userID),
            currentUserAuthProviders = [...new Set(fetchedUser?.authProviders ?? [])];

        // Update the user's auth providers if a new provider was used to log in with.
        if (!currentUserAuthProviders.includes(authProvider)) {
            await this.addAuthProviderToUser(userID, authProvider);
        }

        return await this.updateUser(userID, { lastLogin, isClaimed: true });
    }

    /**
     * Adds the given auth provider from the user's unique set of auth providers,
     * this is done after the user chooses to add a new auth provider to their
     * account from the client side. 
     * 
     * @param userID 
     * @param authProvider -> Provider to add
     * 
     * @returns -> True if the provider was added successfully, false otherwise.
     */
    async addAuthProviderToUser(userID: string, authProvider: AuthProviders) {
        const userData = await this.findUserWith({ id: userID });

        if (!userData) {
            logger.warn(`A user with the ID ${userID} could not be found. Cannot add auth provider to a non-existent user.`);
            return false;
        }

        const updatedAuthProviders = [...(new Set([...userData.authProviders, authProvider]))];

        return await this.updateUser(userID, { authProviders: updatedAuthProviders });
    }

    /**
     * Removes the given auth provider from the user's list of auth providers,
     * this is done after the user chooses to remove the auth provider from their
     * account on the client side. The only auth provider that can be removed
     * is the default as this is our proprietary email + password solution.
     * 
     * @param userID 
     * @param authProvider -> Provider to remove
     * 
     * @returns -> True if the provider was removed successfully, false otherwise.
     */
    async removeAuthProviderFromUser(userID: string, authProvider: AuthProviders) {
        const userData = await this.findUserWith({ id: userID });

        if (authProvider == AuthProviders.Default) {
            logger.warn(`Removing the default auth provider from a user is not allowed. User ID: ${userID} `);
            return false;
        }

        if (!userData) {
            logger.warn(`A user with the ID ${userID} could not be found. Cannot remove an auth provider from a non-existent user.`);
            return false;
        }

        // Filter out the auth provider marked for removal.
        const updatedAuthProviders = userData.authProviders.filter((providers) => providers != authProvider);

        return await this.updateUser(userID, { authProviders: updatedAuthProviders });
    }

    /**
     * Tracks user sign out events with timestamp logging.
     * 
     * @async
     * @param userID 
     * 
     * @returns -> True if the update was successful, false otherwise.
     */
    async signOutUser(userID: string) {
        const lastSignOut = currentDateAsISOString();

        return await this.updateUser(userID, { lastSignOut });
    }
}