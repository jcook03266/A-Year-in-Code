// Dependencies 
// Types
import { AggregationSortOrders, FonciiDBCollections } from "../../../types/namespaces/database-api";

// Models
import TasteProfileModel from "../../../models/shared/tasteProfileModel";

// Services
import { DatabaseServiceAdapter } from "../database/databaseService";
import UserService from "../shared/users/userService";

// Utilities
import { currentDateAsISOString } from "../../../foncii-toolkit/utilities/convenienceUtilities";

// Local Types
type TasteProfileSortOptions = { [K in keyof Partial<TasteProfile>]: AggregationSortOrders };
type TasteProfilePropertyOptions = { [K in keyof Partial<TasteProfile>]: any };

/**
 * Loosely coupled service layer for all Taste Profile related services, operations, and data transformations
 * including database interfacing for mutations and queries
 */
export default class TasteProfileService {
    // Services
    database = new DatabaseServiceAdapter();
    fmUserService = () => new UserService();

    // Reusable / Modular Methods
    // Mutations
    /**
     * Updates the Taste Profile document referenced by the given id as well as the taste profile's
     * embedding by recomputing it to account for the updated properties.
     * 
     * Note: Only use the supported fields provided by the Taste Profile data model
     * to avoid adding isolated/unknown data to a taste profile document. Any literal undefined or null 
     * fields will be marked as unset and consequently removed from the document, if this isn't the
     * desired behavior, use the replace method to update the entire document at once and preserve 
     * any fields by trimming out these values instead of removing the fields completely.
     * 
     * @async
     * @param id -> The id of the Taste Profile document to update
     * @param properties -> Updated Taste Profile data to merge with the existing data
     * 
     * @returns -> True if the update was successful, false otherwise. 
     */
    async updateTasteProfile(
        id: string,
        properties: TasteProfilePropertyOptions
    ) {
        const documentID = id,
            updatedProperties = {
                ...properties,
                lastUpdated: currentDateAsISOString(), // Will overwrite any property named 'lastUpdated' below as intended if included
            };

        // Fetch the target taste profile to determine if it exists or not
        let tasteProfile = await this.findTasteProfileWith({ id });

        // Parse the fetched taste profile (if any)
        if (tasteProfile) {
            const parsedTasteProfile = TasteProfileModel.fromObject({
                id: tasteProfile.id,
                userID: tasteProfile.userID,
                creationDate: tasteProfile.creationDate,
                ...updatedProperties
            } as TasteProfile);

            // Recompute the taste profile's embedding
            if (parsedTasteProfile) {
                parsedTasteProfile.collective_embedding = parsedTasteProfile.generateEmbedding();

                // Note: To object removes undefined fields, spread in the fields to update here, keep an eye out for this 
                // behavior when updating other entities that can have their fields nullified
                return await this.database
                    .updateFieldsInDocumentWithID(
                        FonciiDBCollections.TasteProfiles,
                        documentID,
                        {
                            ...parsedTasteProfile.toObject(),
                            ...updatedProperties
                        });
            }
        }

        // Taste profile doesn't exist || can't be parsed
        return false;
    }

    // Queries
    /**
     * Searches the Taste Profiles collection for a single taste profile with properties 
     * (userID, preferredCuisines, etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * 
     * @returns -> Null if the taste profile can't be found, Taste Profile data model otherwise.
     */
    async findTasteProfileWith(
        properties: TasteProfilePropertyOptions
    ) {
        return await this.database
            .findDocumentWithProperties<TasteProfile>(
                FonciiDBCollections.TasteProfiles,
                properties);
    }

    /**
     * Searches the Taste Profiles collection for a single taste profile with the given ID.
     * 
     * @async
     * @param properties 
     * 
     * @returns -> Null if the taste profile can't be found, Taste Profile data model otherwise.
     */
    async findTasteProfileWithID(id: string) {
        return await this.database.findDocumentWithID<TasteProfile>(
            FonciiDBCollections.TasteProfiles,
            id
        );
    }

    /**
     * Searches the Taste Profiles collection for taste profiles with properties 
     * (userID, preferredCuisines, etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * @param resultsPerPage -> The maximum number of taste profiles to return per page (0 = no limit)
     * @param paginationPageIndex -> The current page index (0 = first page of results)
     * 
     * @returns -> Aggregated collection documents
     */
    async findTasteProfilesWith({
        properties = {},
        resultsPerPage = 100,
        paginationPageIndex = 0,
        sortOptions = {}
    }: {
        properties?: TasteProfilePropertyOptions,
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: TasteProfileSortOptions
    }) {
        return await this.database.findDocumentsWithProperties<TasteProfile>({
            collectionName: FonciiDBCollections.TasteProfiles,
            properties,
            resultsPerPage,
            paginationPageIndex,
            sortOptions
        });
    }

    /**
     * Determines if the Taste Profiles collection includes a taste profile with properties 
     * (userID, preferredCuisines, etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * 
     * @returns -> True if a taste profile exists with the given properties, false otherwise.
     */
    async doesTasteProfileExistWith(
        properties: TasteProfilePropertyOptions
    ) {
        return await this.database
            .doesDocumentExistWithProperties<TasteProfile>(
                FonciiDBCollections.TasteProfiles,
                properties
            );
    }

    /**
     * Determines the total amount of taste profiles in the Taste Profiles
     * collection that match the given properties. 
     * 
     * @async
     * @param properties 
     * 
     * @returns -> An integer representing the total amount of taste profiles in the Taste Profiles
     * collection that match the given properties.
     */
    async countTotalTasteProfilesWithProperties(
        properties: TasteProfilePropertyOptions
    ) {
        return await this.database.countTotalDocumentsWithProperties(
            FonciiDBCollections.TasteProfiles,
            properties
        );
    }

    // Unique Methods
    // Queries
    /**
     * @async
     * @param userID 
     * 
     * @returns -> Null if a taste profile can't be found for the user with the given ID, 
     * Taste Profile data model otherwise.
     */
    async getTasteProfileForUser(userID: string) {
        return await this.findTasteProfileWith({ userID });
    }

    /**
     * @async
     * @param userID
     * @param primaryTasteProfileID
     * 
     * @returns -> The taste profile with the given id belonging to the user with the 
     * given ID (if either exists and are connected to one another within the taste profiles collection in a document),
     * null otherwise.
     */
    async getPrimaryTasteProfileForUser({
        userID,
        primaryTasteProfileID
    }: {
        userID: string,
        primaryTasteProfileID?: string
    }) {
        let tasteProfileID = primaryTasteProfileID;

        // Fetch the primary taste profile ID if it's not already provided by the caller (user field resolvers have this property already)
        if (!tasteProfileID) {
            const user = await this.fmUserService().findUserWithID(userID);
            tasteProfileID = user?.primaryTasteProfileID;
        }

        // Precondition failure, no taste profile id provided or found associated with the given user
        if (!tasteProfileID) return;

        return await this.findTasteProfileWithID(tasteProfileID);
    }

    /**
     * @async
     * @param userID 
     * 
     * @returns -> An array of all of the taste profiles belonging to the user
     * with the given ID. If no taste profiles exist for the user then an empty array is returned.
     */
    async getAllTasteProfilesForUser(userID: string) {
        return (await this.findTasteProfilesWith({ properties: { userID } }));
    }

    /**
     * Determines if the target user has at least one taste profile currently stored in the
     * database.
     * 
     * @async
     * @param userID 
     * 
     * @returns -> True if the user with the given ID has at least one taste profile
     * document with their id associated.
     */
    async doesUserHaveExistingTasteProfile(
        userID: string
    ) {
        return await this.database
            .doesDocumentExistWithProperties<TasteProfile>(
                FonciiDBCollections.TasteProfiles,
                { userID }
            );
    }

    // Mutations
    /**
     * Creates a new taste profile document in the database using the provided Taste Profile data model. 
     * Taste profiles can be autogenerated and then passed here to be uploaded to the database and used 
     * in later subsequent operations (i.e percent match ranking).
     * 
     * Note: When creating a new taste profile make sure to switch the user's currently selected taste profile
     * to the newly created one as that's most likely going to be the one they're going to use the most. The user
     * can simply switch taste profiles on their own whenever they choose to, this just simplifies the process 
     * when creating new taste profiles.
     * 
     * @async
     * @param userID -> The ID of the user to whom this new taste profile will belong to. A user can have multiple taste profiles
     * associated with one account.
     * 
     * @returns -> The newly created Taste Profile data model if the 
     * taste profile was created and inserted into the database successfully, null otherwise.
     */
    async createTasteProfile(props: Partial<TasteProfileModel> & { userID: string }) {
        const newTasteProfile = new TasteProfileModel({ ...props }),
            documentID = newTasteProfile.id;

        // Precondition failure
        if (newTasteProfile == undefined) return null;

        // Operation success flag
        let didSucceed = false;

        didSucceed = await this.database.createNewDocumentWithID(
            FonciiDBCollections.TasteProfiles,
            documentID,
            newTasteProfile.toObject()
        );

        return didSucceed ? newTasteProfile : null;
    }

    /**
     * Deletes the target taste profile from the database. Note: When deleting 
     * taste profiles make sure to switch the user's currently selected taste profile 
     * to their most recent one (if any). If no other taste profiles are available
     * then their currently selected taste profile will be undefined / null. The 
     * user should be prompted to create a new taste profile or else their rankings 
     * will be incomplete.
     * 
     * @async
     * @param id 
     * 
     * @returns -> True if the taste profile was deleted successfully, false otherwise.
     */
    async deleteTasteProfile(id: string) {
        return await this.database.deleteDocumentWithID(FonciiDBCollections.TasteProfiles, id);
    }

    /**
     * Deletes all taste profiles associated with the given user ID.
     * 
     * @async
     * @param userID 
     * 
     * @returns -> True if the taste profiles were deleted successfully (if any), false otherwise.
     */
    async deleteAllUserTasteProfiles(userID: string) {
        return await this.database.deleteDocumentsWithProperties(FonciiDBCollections.TasteProfiles, { userID });
    }
}