// Dependencies 
// Types
import { FMIntegrationProviders } from "../../../../types/common";
import { FonciiDBCollections } from "../../../../types/namespaces/database-api";
import { SortDirection } from "mongodb";

// Services
import { DatabaseServiceAdapter } from "../../database/databaseService";
import PostImportationService from "../user-posts/postImportationService";

// Utilities
import { currentDateAsISOString, getObjectKeyForValue } from "../../../../foncii-toolkit/utilities/convenienceUtilities";

// Logging
import logger from "../../../../foncii-toolkit/debugging/debugLogger";

// Local Types
type FMIntegrationCredentialSortOptions = { [K in keyof Partial<FMIntegrationCredential>]: SortDirection };
type FMIntegrationCredentialPropertyOptions = { [K in keyof Partial<FMIntegrationCredential>]: any };

/**
 * Service layer for provisioning, querying and revoking
 * Foncii Maps Integration Credentials.
 */
export default class FMIntegrationCredentialService {
    // Services
    database = new DatabaseServiceAdapter();

    // Auth Handlers
    async handleIntegrationConnectionRequest(args: {
        userID: string,
        provider: FMIntegrationProviders,
        authToken: string,
        redirectURI: string
    }): Promise<FMIntegrationCredential | null> {
        const integrationCredential: FMIntegrationCredential | null = await PostImportationService.provisionIntegrationCredential(args);

        // Precondition failure
        if (!integrationCredential) return null;

        const didSucceed = await this.provisionIntegrationCredential(integrationCredential);
        return didSucceed ? integrationCredential : null;
    }

    async handleIntegrationRefreshRequest({
        userID,
        provider
    }: {
        userID: string,
        provider: FMIntegrationProviders
    }) {
        let refreshedIntegrationCredential: FMIntegrationCredential | null = null,
            currentIntegrationCredential = await this.fetchIntegrationCredentialForUser(userID, provider);

        // The user doesn't have an existing integration credential and therefore can't refresh it
        if (!currentIntegrationCredential) {
            logger.warn(`The user with ID ${userID} does not have an existing integration credential from the provider provider ${getObjectKeyForValue(FMIntegrationProviders, provider)} to refresh.`)
            return null;
        }

        refreshedIntegrationCredential = await PostImportationService.refreshIntegrationCredentialFor(provider, currentIntegrationCredential);

        // Precondition failure
        if (refreshedIntegrationCredential == null) return null;

        const didSucceed = await this.updateIntegrationCredential(
            refreshedIntegrationCredential.id,
            refreshedIntegrationCredential
        )

        return didSucceed ? refreshedIntegrationCredential : null;
    }

    // Reusable / Modular Methods
    // Mutations
    /**
     * Note: Only use the supported fields provided by the data model.
     * Pass null or undefined or {} to remove a field completely.
     * 
     * @async
     * @param integrationCredentialID -> The id of the integration credential document to update
     * @param properties -> Updated FM integration credential data to merge with the existing data
     * 
     * @returns -> True if the update was successful, false otherwise. 
     */
    async updateIntegrationCredential(
        integrationCredentialID: string,
        properties: FMIntegrationCredentialPropertyOptions
    ) {
        const documentID = integrationCredentialID,
            updatedProperties = {
                ...properties,
                lastUpdated: currentDateAsISOString(), // Will overwrite any property named 'lastUpdated' below as intended if included
            }

        return await this.database
            .updateFieldsInDocumentWithID(
                FonciiDBCollections.FMIntegrationCredentials,
                documentID,
                updatedProperties);
    }

    // Queries
    /**
     * @async
     * @param properties 
     * 
     * @returns -> Null if the integration credential can't be found, defined otherwise.
     */
    async findIntegrationCredentialWith(
        properties: FMIntegrationCredentialPropertyOptions
    ) {
        return await this.database
            .findDocumentWithProperties<FMIntegrationCredential>(
                FonciiDBCollections.FMIntegrationCredentials,
                properties);
    }

    /**
     * Searches the FM Integration Credential collection for credentials with properties 
     * (user ID etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * @param resultsPerPage -> The maximum number of credentials to return per page (0 = no limit)
     * @param paginationPageIndex -> The current page index (0 = first page of results)
     * 
     * @returns -> Aggregated collection documents 
     */
    async findIntegrationCredentialsWith({
        properties = {},
        resultsPerPage = 100,
        paginationPageIndex = 0,
        sortOptions = {}
    }: {
        properties?: FMIntegrationCredentialPropertyOptions,
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: FMIntegrationCredentialSortOptions
    }) {
        return await this.database.findDocumentsWithProperties<FMIntegrationCredential>({
            collectionName: FonciiDBCollections.FMIntegrationCredentials,
            properties,
            resultsPerPage,
            paginationPageIndex,
            sortOptions
        });
    }

    /**
     * @async
     * @param properties 
     * 
     * @returns -> True if an integration credential exists with the given properties, false otherwise.
     */
    async doesIntegrationCredentialExistWith(
        properties: FMIntegrationCredentialPropertyOptions
    ) {
        return await this.database
            .doesDocumentExistWithProperties<FMIntegrationCredential>(
                FonciiDBCollections.FMIntegrationCredentials,
                properties
            );
    }

    /**
     * Determines the total amount of integration credentials in the FM Integration Credentials
     * collection that match the given properties. 
     * 
     * @async
     * @param properties 
     * 
     * @returns -> An integer representing the total amount of integration credentials in the
     * FM Integration Credentials collection that match the given properties.
     */
    async countTotalIntegrationCredentialsWithProperties(
        properties: FMIntegrationCredentialPropertyOptions
    ) {
        return await this.database.countTotalDocumentsWithProperties(
            FonciiDBCollections.FMIntegrationCredentials,
            properties
        );
    }

    // Unique Methods
    // Queries
    /**
     * @async
     * @param userID 
     * 
     * @returns -> True if the user has at least one integration credential, false otherwise. 
     */
    async doesUserHaveIntegrationCredentials(userID: string) {
        return await this.countTotalIntegrationCredentialsWithProperties({
            userID
        }) > 0;
    }

    /**
     * @async
     * @param id -> ID of the integration credential to fetch from the database.
     * 
     * @returns -> Null if the integration credential can't be found, defined otherwise.
     */
    async findIntegrationCredentialWithID(id: string) {
        return await this.database
            .findDocumentWithID<FMIntegrationCredential>(
                FonciiDBCollections.FMIntegrationCredentials,
                id);
    }

    /**
     * Fetches all integration credentials for the given user. 
     * 
     * @async
     * @param userID 
     * 
     * @returns -> A non-paginatable array of (Foncii Maps (FM)) integration credential data model objects
     * that belong to the target user. Note: The remaining document count is not returned as the amount of possible
     * credentials per user is small and thus doesn't need to be paginated.
     */
    async fetchIntegrationCredentialsForUser(userID: string) {
        return (await this.findIntegrationCredentialsWith({ properties: { userID } }));
    }

    /**
     * Fetches the specific integration credential for the given user. 
     * 
     * @async
     * @param userID 
     * @param integrationProvider
     * 
     * @returns -> Null if the integration credential could not be found, defined otherwise.
     */
    async fetchIntegrationCredentialForUser(
        userID: string,
        integrationProvider: FMIntegrationProviders
    ) {
        return await this.findIntegrationCredentialWith({ userID, provider: integrationProvider });
    }

    // Mutations
    /**
     * Updates the auto refresh attribute associated with integration credentials to
     * be true if enabled, and false if disabled. This attribute controls the background behavior 
     * associated with each credential (i.e whether or not to refresh the credential automatically)
     * 
     * @async
     * @param id -> ID of the integration credential to update
     * @param autoRefreshEnabled -> True if auto refresh should be enabled for this credential, false otherwise
     * 
     * @returns -> True if the update was successful, false otherwise
     */
    async setAutoRefreshStateForCredential(id: string, autoRefreshEnabled: boolean) {
        return await this.updateIntegrationCredential(id, { autoRefresh: autoRefreshEnabled });
    }

    /**
     * Updates the timestamp of the last post import operation done using this credential.
     * Not used to unset the timestamp, that's not possible and isn't supposed to be supported.
     * The timestamp is undefined only once, and that's when it's first created.
     * 
     * @async
     * @param id -> ID of the integration credential to update
     * @param lastImport -> The timestamp when the user's last import occurred. This is undefined when
     * the credential is first provisioned, and updated upon successful imports.
     * ISO-8601 formatted date string.
     * 
     * @returns -> True if the update was successful, false otherwise
     */
    async updateLastImportTimestamp({
        id,
        lastImport
    }: {
        id: string,
        lastImport: string
    }) {
        return await this.updateIntegrationCredential(id, { lastImport });
    }

    /**
     * @async
     * @param integrationCredential 
     * 
     * @returns -> True if the credential was successfully created, false otherwise.
     */
    async provisionIntegrationCredential(integrationCredential: FMIntegrationCredential) {
        const documentID = integrationCredential.id,
            userID = integrationCredential.userID,
            provider = integrationCredential.provider;

        /** Unique credential validation */
        if (await this.doesIntegrationCredentialExistWith({ userID, provider })) {
            logger.warn(`An integration credential already exists for the user ${userID} under the provider: ${getObjectKeyForValue(FMIntegrationProviders, provider)}. 
            Deleting the existing auth credential and making way for the new one.`);

            await this.revokeIntegrationCredential(userID, provider);
        }

        return await this.database.
            createNewDocumentWithID(
                FonciiDBCollections.FMIntegrationCredentials,
                documentID,
                integrationCredential
            );
    }

    /**
     * Removes all integration credentials for the given user under the specified provider
     * were revoked successfully, false otherwise. This will delete any duplicate integration credentials (if any, but
     * unlikely) which is useful because these credentials are supposed to be 1:1, there's only supposed to be one per user
     * per provider and this function ensures that 1:1 relationship.
     * 
     * @async
     * @param userID 
     * @param integrationProvider 
     * 
     * @returns -> True if integration credentials for the given user under the specified provider
     * were revoked successfully, false otherwise. This will delete any duplicate integration credentials (if any, but
     * unlikely) which is useful because these credentials are supposed to be 1:1, there's only supposed to be one per user
     * per provider and this function ensures that 1:1 relationship.
     */
    async revokeIntegrationCredential(
        userID: string,
        integrationProvider: FMIntegrationProviders
    ) {
        return await this.deleteIntegrationCredentialsWith({ userID, provider: integrationProvider });
    }

    /**
     * Deletes all integration credentials that contain the given app scoped user ID.
     * 
     * @async
     * @param appUID 
     * 
     * @returns -> True if integration credentials that contain the given app scoped user ID were 
     * deleted successfully, false otherwise.
     */
    async revokeIntegrationCredentialWithAppScopedUID(appUID: string) {
        return await this.deleteIntegrationCredentialsWith({ appUID });
    }

    /**
     * Removes all integration credentials previously connected by the target user, regardless of 
     * the provider.
     * 
     * @async
     * @param userID
     * 
     * @returns -> True if credentials associated with the given user were deleted successfully, false otherwise.
     */
    async revokeAllIntegrationCredentialsForUser(userID: string) {
        return await this.deleteIntegrationCredentialsWith({ userID });
    }

    /**
     * Internal method, use the revoke methods outside of this file's scope. Removes integration credentials
     * from the database that align with the target properties.
     * 
     * @async
     * @param properties 
     * 
     * @returns -> True if integration credentials with the given properties were deleted, false otherwise.
     */
    private async deleteIntegrationCredentialsWith(properties: FMIntegrationCredentialPropertyOptions) {
        return await this.database.
            deleteDocumentsWithProperties(
                FonciiDBCollections.FMIntegrationCredentials,
                properties
            );
    }
}