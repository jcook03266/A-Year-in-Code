import { AnyBulkWriteOperation, Collection, MongoClient, SortDirection } from "mongodb";
import * as bson from "bson";
import * as DatabaseAPI from '../../types/namespaces/database-api';
/**
 * Set this flag to true to force instances that use the FonciiFediverse DB to use the test database whenever necessary
 * i.e when conducting integration testing.
 */
export declare let forceUseTestDB: {
    value: boolean;
};
/**
 * Singleton service layer for interfacing with the MongoDB database cluster.
 * Use the shared instance for instantiating and accessing client properties and methods
 * such as connection and close connection events.
 *
 * Important: Be sure to not close the connection when iterating through a sequential loop of
 * operations, only retire the current session when all immediate operations are finished.
 */
declare class DatabaseService {
    #private;
    client: MongoClient;
    connection_uri: string;
    /**
     * @param connectionURI -> The connection URI to use to access the required database instance,
     * the default value for this is the primary URI for our dedicated database instance. This can be
     * specified in order to use other database instances ~ Federated Instances
     * @param flushConfig -> Flag that forces the singleton instance to set itself to the updated configuration
     */
    constructor(connectionURI?: string, flushConfig?: boolean);
    /**
     * Closes the connection to the MongoDB cluster
     * when not needed (post operation).
     *
     * Note: Call this method when you are completely done with any database
     * operations from an external caller. Especially when looping through
     * operations as a `MongoExpiredSessionError` exception will be thrown if you close
     * the connection prior to calling another operation in rapid succession of the last.
     *
     * @async
     */
    stop(): Promise<void>;
    /**
     * Test the implementation of the service layer
     * by connecting to the database, pinging it,
     * and terminating the connection.
     *
     * @async
     */
    performImplementationTest(): Promise<void>;
    /**
     * Important: Keep the data types of the _id field consistent, don't mix UUID types with
     * string types and etc, so since our basis is a hex string, string types are allowed
     * as the primary key for our database, don't use raw UUID and binary values, only use this
     * method when generating a specific custom key that you want to use immediately after creating the document.
     *
     * @returns -> A 20 character (not required max) unique hexadecimal string representation of a UUID
     * used to index our documents in the database.
     *
     * Note: Object IDs have strict requirements, including a 24 char hex string if using hex, but we
     * just use 20 characters here for simplicity.
     */
    static generateUUIDHexString: () => string;
}
/**
 * Service adapter that allows for high level interfacing
 * with the primary MongoDB database. Can be accessed from any
 * external class and extended as needed.
 *
 * Each adapter instance relies on the same shared MongoDB
 * client singleton instance so as to prevent isolated
 * sessions across the server, thus coordinating
 * start and stop events.
 *
 * Operator Documentation:
 * https://www.mongodb.com/docs/v7.0/reference/operator/query/
 */
export declare class DatabaseServiceAdapter extends DatabaseService {
    #private;
    /**
     * @param databaseIdentifier -> Default is Foncii Fediverse (Primary Production DB), pass in the desired database to use when if this isn't it.
     * Specify the correct instance connection URI for which the given database is hosted on in order to use this properly.
     * @param flushConfig -> Flag that forces the singleton instance to set itself to the updated configuration
     */
    constructor(databaseIdentifier?: DatabaseAPI.FonciiDatabases);
    /**
     * Finds the document with the given document identifier (_id) from the specified collection.
     *
     * Don't use this if querying by some custom identifier (i.e `id`) for a custom data type, this is only for
     * use when explicitly querying by the _id field. If querying by a custom `id` identifier or equivalent, ensure
     * that identifier matches the document's id field.
     *
     * @async
     * @param collectionName
     * @param documentID
     *
     * @returns -> The fetched Binary-JSON (BSON) document with its object identifier, or null if it can't be found
     */
    findDocumentWithID<T>(collectionName: DatabaseAPI.FonciiDBCollections, documentID: string): Promise<T | null>;
    /**
     * A generic fetch method that fetches the document with the given properties
     * from the specified collection. Can be used to filter the collection with
     * many different field and values to find the specific document in question.
     *
     * @async
     * @param collectionName
     * @param documentID
     *
     * @returns -> The fetched Binary-JSON (BSON) document with its object identifier, or null if it can't be found
     */
    findDocumentWithProperties<T>(collectionName: DatabaseAPI.FonciiDBCollections, properties: {
        [x: string]: any;
    }): Promise<T | null>;
    /**
     * Method used to query the database and find a paginatable array of documents
     * that match the given query criteria / properties. Note: the results per page limit
     * and pagination page offset parameters are optional and a default value is used if not
     * explicitly set.
     *
     * @async
     * @param collectionName
     * @param properties -> Query parameters to use to find the matching documents to return
     * @param resultsPerPage -> The limit on the maximum amount of documents to return for this query. Default is 100.
     * @param paginationPage -> The amount of documents to skip ahead of akaa page offset of the query
     * (resultsPerPage * pagination page index (zero-indexed)) to get to the next page. Default is 0 [first page].
     * @param sortOptions -> The sorting options to use for this query. Default is {} for no sorting. Can use any sort key '1, -1, asc, desc, etc..'
     *
     * @returns -> [documents, totalDocumentsLeftToPaginate] Tuple. Note: if the totalDocumentsLeftToPaginate
     * is 0, then the pagination is complete, and the caller should not try to paginate more, it's up to the
     * caller to implement this guard logic as this method is used to resolve any requests regardless if the
     * pagination is complete or not. And if the pagination completes and the caller still queries this function
     * then the subsequent document array will be empty.
     */
    findDocumentsWithProperties<T extends bson.Document>({ collectionName, properties, resultsPerPage, paginationPageIndex, sortOptions }: {
        collectionName: DatabaseAPI.FonciiDBCollections;
        properties: {
            [K in keyof Partial<T>]: any;
        };
        resultsPerPage?: number;
        paginationPageIndex?: number;
        sortOptions?: {
            [K in keyof Partial<T>]: SortDirection;
        };
    }): Promise<{
        documents: T[];
        totalDocumentsLeftToPaginate: number;
    }>;
    /**
     * Counts the total amount of documents in the specified collection that match the given properties.
     *
     * @async
     * @param collectionName
     * @param properties
     *
     * @returns -> The total amount of documents in the collection that match the given
     * properties. If no documents are found or an error is encountered 0 is returned.
     */
    countTotalDocumentsWithProperties(collectionName: DatabaseAPI.FonciiDBCollections, properties: {
        [x: string]: any;
    }): Promise<number>;
    /**
     * Returns the total amount of documents in the specified collection without performing
     * a collection scan by using a hint to take advantage of the built-in index on the _id field.
     * Side-Note: Use this technique only when calling countDocuments() with an empty query parameter.
     *
     * @async
     * @param collectionName
     *
     * @returns -> The total amount of documents in the collection. If no documents are found or an error
     * is encountered 0 is returned.
     */
    countTotalDocumentsInCollection(collectionName: DatabaseAPI.FonciiDBCollections): Promise<number>;
    /**
     * Determines if the document with the given properties exists in the specified collection.
     *
     * @async
     * @param collectionName
     * @param properties
     *
     * @returns -> True if the document with the given properties exists in the specified collection
     * (count > 0), false otherwise.
     */
    doesDocumentExistWithProperties(collectionName: DatabaseAPI.FonciiDBCollections, properties: {
        [x: string]: any;
    }): Promise<boolean>;
    /**
     * Creates a new document with the discrete document identifier. We will only use this method to create new
     * documents as having direct control over the document's identifier is paramount when it comes to preventing
     * data isolation from document IDs being randomly generated and not properly referenced after they're created.
     *
     * That being said: Do not insert documents without knowing or storing their IDs before hand and properly referencing
     * said IDs when applicable.
     *
     * Note: If an attempt to insert a document with an existing ID is made, the operation will fail with a duplicate
     * key exception, so no worries about overwriting existing data when creating new documents.
     *
     * @async
     * @param collectionName -> The supported Foncii database collection's name
     * @param documentID -> The document's identifier
     * @param document -> JSON formatted object to be inserted into the database
     *
     * @returns -> True if the document was created successfully, false otherwise.
     */
    createNewDocumentWithID(collectionName: DatabaseAPI.FonciiDBCollections, documentID: string, document: bson.Document): Promise<boolean>;
    /**
     * ~ Inserts a document with the given information into what's presumed to be a time series collection
     * with a specified time field attribute that will be used for the time series document. This time field
     * attribute is passed in explicitly like this because `trimObject` removes date objects as they
     * are considered to be empty objects by the function for some reason.
     *
     * @async
     * @param collectionName
     * @param documentID
     * @param document
     * @param timeField
     *
     * @returns -> True if the document was created successfully, false otherwise.
     */
    createNewTimeSeriesDocumentWithID(collectionName: DatabaseAPI.FonciiDBCollections, documentID: string, document: bson.Document, timeField: {
        [x: string]: Date;
    }): Promise<boolean>;
    /**
     * ~ [createNewDocumentWithID] but without an explicit document ID specified.
     * Auto-generated primary keys are the same hex strings as the ones generated elsewhere and passed in to [createNewDocumentWithID]
     * since they both use the same pkFactory middleware function `generateUUIDHexString()` to generate the ID as specified in the database service's
     * implementation.
     *
     * @async
     * @param collectionName
     * @param document
     *
     * @returns -> True if the document was created successfully, false otherwise.
     */
    createNewDocument(collectionName: DatabaseAPI.FonciiDBCollections, document: bson.Document): Promise<boolean>;
    /**
     * Inserts a batch of documents mapped to their document identifiers
     * into the specified collection. Any undefined / null fields are removed
     * as well as any empty / falsy document mappings.
     *
     * @async
     * @param collectionName
     * @param documentToIDMappings
     *
     * @returns -> True if the batch of documents was created successfully, false otherwise.
     */
    batchCreateDocumentsWithIDs(collectionName: DatabaseAPI.FonciiDBCollections, documentToIDMappings: {
        [documentID: string]: bson.Document;
    }): Promise<boolean>;
    /**
     * Updates (Replaces) the specified document with the given properties in the specified collection
     * using the update document data. Beware this method replaces the entire document's data
     * with the updated document data. In order to update on a field by field basis please use
     * 'updateFieldsInDocumentWithProperties' or similar.
     *
     * @async
     * @param collectionName
     * @param properties
     * @param updatedDocument
     *
     * @returns -> True if the document was updated successfully, false otherwise.
     */
    updateDocumentWithProperties(collectionName: DatabaseAPI.FonciiDBCollections, properties: {
        [x: string]: any;
    }, updatedDocument: bson.Document): Promise<boolean>;
    /**
     * Updates (Replaces) the specified document with the given identifier in the specified collection
     * using the update document data. Beware this method replaces the entire document's data
     * with the updated document data. In order to update on a field by field basis please use
     * 'updateFieldsInDocumentWithID'.
     *
     * @async
     * @param collectionName
     * @param documentID
     * @param updatedDocument
     *
     * @returns -> True if the document was updated successfully, false otherwise.
     */
    replaceDocumentWithID(collectionName: DatabaseAPI.FonciiDBCollections, documentID: string, updatedDocument: bson.Document): Promise<boolean>;
    /**
     * Updates the individually specified fields in the target document with the given properties in the provided collection.
     * Don't use this to update the entire document at once. Instead use 'updateDocumentWithProperties' or similar to replace
     * all fields at once. This method is meant specifically for updating individual fields and preserving the rest of the document's data.
     *
     * @async
     * @param collectionName
     * @param properties
     * @param updatedFields -> Key value pairs in JSON format. ex.) { quantity: 5 }
     *
     * @returns -> True if the document was updated with the given fields successfully, false otherwise.
     */
    updateFieldsInDocumentWithProperties(collectionName: DatabaseAPI.FonciiDBCollections, properties: {
        [x: string]: any;
    }, updatedFields: bson.Document): Promise<boolean>;
    /**
     * Updates the individually specified fields in the target documents with the given properties in the provided collection.
     * Don't use this to update entire documents at once. Instead use 'updateDocumentWithProperties' or similar to replace
     * all fields at once. This method is meant specifically for updating individual fields and preserving the rest of the document's data.
     * This is the 'many' version of `updateFieldsInDocumentWithProperties` and updates multiple documents' fields at once.
     *
     * Note: This function applies the same set of field updates to all documents with the given properties,
     * not individual updates on a case by case basis.
     *
     * @async
     * @param collectionName
     * @param properties
     * @param updatedFields -> Key value pairs in JSON format. ex.) { quantity: 5 }
     *
     * @returns -> True if the document was updated with the given fields successfully, false otherwise.
     */
    updateFieldsInDocumentsWithProperties(collectionName: DatabaseAPI.FonciiDBCollections, properties: {
        [x: string]: any;
    }, updatedFields: bson.Document): Promise<boolean>;
    /**
     * Important Note: Updates in general are only possible when the target document is found, if no document
     * is found then the operation silently fails and returns as a false positive.
     *
     * Updates the individually specified fields in the specified document with the given identifier in the specified collection.
     * Don't use this to update the entire document at once. Instead use 'replaceDocumentWithID' to replace all fields at once.
     * This method is specifically for updating individual fields and preserving the rest of the document's data.
     *
     * @async
     * @param collectionName
     * @param documentID
     * @param updatedFields -> Singular field key value pairs in JSON format. ex.) { quantity: 5 }
     *
     * @returns -> True if the document was updated successfully, false otherwise.
     */
    updateFieldsInDocumentWithID(collectionName: DatabaseAPI.FonciiDBCollections, documentID: string, updatedFields: bson.Document): Promise<boolean>;
    /**
     * Important Note: Updates in general are only possible when the target document is found, if no document
     * is found then the operation silently fails and returns as a false positive.
     *
     * Updates the individually specified fields in the specified documents with the given identifiers in the specified collection.
     * Don't use this to update the entire document at once. Instead use the singular 'replaceDocumentWithID' to replace all fields at once.
     * This method is specifically for updating individual fields and preserving the rest of the document's data.
     *
     * @async
     * @param collectionName
     * @param documentIDs -> Array of document IDs to find.
     * @param updatedFields -> Singular field key value pairs in JSON format. ex.) { quantity: 5 }
     *
     * @returns -> True if the target documents were updated successfully, false otherwise.
     */
    updateFieldsInDocumentsWithIDs(collectionName: DatabaseAPI.FonciiDBCollections, documentIDs: string[], updatedFields: bson.Document): Promise<boolean>;
    /**
     * Deletes the document with the given properties from the specified collection.
     *
     * @async
     * @param collectionName
     * @param properties
     *
     * @returns -> True if the document was deleted successfully, false otherwise.
     */
    deleteDocumentWithProperties(collectionName: DatabaseAPI.FonciiDBCollections, properties: {
        [x: string]: any;
    }): Promise<boolean>;
    /**
     * Deletes many documents that match the given properties from the specified collection.
     *
     * @async
     * @param collectionName
     * @param properties
     *
     * @returns -> True if the matching documents were deleted successfully, false otherwise.
     */
    deleteDocumentsWithProperties(collectionName: DatabaseAPI.FonciiDBCollections, properties: {
        [x: string]: any;
    }): Promise<boolean>;
    /**
     * Deletes the document with the given identifier from the specified collection.
     *
     * @async
     * @param collectionName
     * @param documentID
     *
     * @returns -> True if the document was deleted successfully, false otherwise.
     */
    deleteDocumentWithID(collectionName: DatabaseAPI.FonciiDBCollections, documentID: string): Promise<boolean>;
    /**
     * Deletes a batch of document with the given identifier from the specified collection.
     *
     * @param collectionName
     * @param documentIDs -> Array of document IDs to match with the documents to be deleted.
     *
     * @returns -> True if the batch of documents were deleted successfully, false otherwise.
     */
    deleteDocumentsWithIDs(collectionName: DatabaseAPI.FonciiDBCollections, documentIDs: string[]): Promise<boolean>;
    /**
     * A modular fast and efficient way to perform a set of multiple operations at once.
     *
     * @param collectionName
     * @param operations
     * @param bestEffort - if some actions fail, continue with other actions
     *
     * @returns -> True if the bulk operations were performed successfully, false otherwise.
     */
    bulkWrite(collectionName: DatabaseAPI.FonciiDBCollections, operations: AnyBulkWriteOperation<bson.Document>[], bestEffort?: boolean): Promise<boolean>;
    /**
     * [updateOne] Formats the given fields and filters (if any) to be used as a bulk write operation
     * for updating the specified fields of a single document.
     *
     * @param properties
     * @param updatedFields
     *
     * @returns -> A bulk write formatted operation that updates a single document with the given fields.
     */
    updateFieldsInDocumentAsBulkWriteOperation(properties: {
        [x: string]: any;
    }, updatedFields: bson.Document): AnyBulkWriteOperation<bson.Document>;
    /**
     * [InsertOne] Formats the given documentID and document data to be used as a bulk write operation
     * for creating a single document with the given document data and ID.
     *
     * @param documentID
     * @param document
     *
     * @returns -> A bulk write formatted operation that creates a single document with the given document
     * data and ID.
     */
    createNewDocumentWithIDAsBulkWriteOperation(documentID: string, document: bson.Document): AnyBulkWriteOperation<bson.Document>;
    /**
     * ~ Same as 'createNewDocumentWithIDAsBulkWriteOperation' but without specifying the '_id' document ID property
     * Useful when inserting doucments that don't need to be identified explicitly, like article publications which
     * can have duplicate information but represent a large lake of data to choose from over time.
     *
     * @param document
     *
     * @returns -> A bulk write formatted operation that creates a single document with the given document
     * data and a database generated ObjectID.
     */
    createNewDocumentAsBulkWriteOperation(document: bson.Document): AnyBulkWriteOperation<bson.Document>;
    /**
     * Aggregates the specified collection using the given custom aggregation pipeline to produce
     * an array of the specified output type. If the pipeline is invalid due to a bad stage then
     * the error is logged and the result comes back as an empty array.
     *
     * @param collectionName
     * @param pipelineStages -> Custom pipeline stages to resolve the aggregation pipeline with. Learn how to
     * construct these stages properly here: https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/
     *
     * @returns -> [output] -> An array containing the output of the aggregation pipeline. If a count stage is
     * used at the end of the custom stages input then you can access it at index 0 of the array if the
     * pipeline is valid, in that specific case also be sure to provide a default value via unwrapping to ensure the array isn't empty.
     */
    resolveGenericAggregationPipelineOn<T extends bson.Document>(collectionName: DatabaseAPI.FonciiDBCollections, pipelineStages: bson.Document[]): Promise<T[]>;
    /**
     * Aggregates the specified collection using the given custom aggregation pipeline to produce
     * an array of documents. The total amount of documents left to paginate is also returned. If
     * the pipeline is invalid due to a bad stage then the error is logged and the result comes
     * back as an empty array and 0 for the documents left to paginate.
     *
     * @param collectionName
     * @param pipelineStages -> Custom pipeline stages to resolve the aggregation pipeline with. Learn how to
     * construct these stages properly here: https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/
     *
     * @returns -> [documents, totalDocumentsLeftToPaginate] Tuple. Note: if the totalDocumentsLeftToPaginate
     * is 0, then the pagination is complete, and the caller should not try to paginate more, it's up to the
     * caller to implement this guard logic as this method is used to resolve any requests regardless if the
     * pagination is complete or not. And if the pagination completes and the caller still queries this function
     * then the subsequent document array will be empty.
     */
    resolveAggregationPipelineOn<T extends bson.Document>(collectionName: DatabaseAPI.FonciiDBCollections, pipelineStages: bson.Document[]): Promise<{
        documents: T[];
        totalDocumentsLeftToPaginate: number;
    }>;
    /**
     * A boilerplate solution for paginating and optionally sorting a custom aggregation pipeline. This
     * method aggregates the specified collection using the given custom aggregation pipeline to produce
     * an array of documents which it then can sort and paginate through. The total amount of documents left to
     * paginate is also returned. If the pipeline is invalid due to a bad stage then the error is logged and the
     * result comes back as an empty array and 0 for the documents left to paginate.
     *
     * @async
     * @param collectionName
     * @param properties -> Query parameters to use to find the matching documents to return
     * @param pipelineStages -> Custom pipeline stages to resolve the aggregation pipeline with. Learn how to
     * construct these stages properly here: https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/
     * @param resultsPerPage -> The limit on the maximum amount of documents to return for this aggregation. Default is 100.
     * @param paginationPage -> The amount of documents to skip ahead of akaa page offset of the aggregation
     * (resultsPerPage * pagination page index (zero-indexed)) to get to the next page. Default is 0 [first page].
     * @param sortOptions -> The sorting options to use for this query. Default is undefined for no sorting.
     * IMPORTANT: Only use numeric sort keys, string based sort keys are illegal for aggregation pipelines, 1 to sort ascending,
     * -1 to sort descending.
     * @param projectionStage -> An optional projection stage to include in order to optimize fetch requests by
     * excluding unused fields from the return documents
     *
     * @returns -> [documents, totalDocumentsLeftToPaginate] Tuple. Note: if the totalDocumentsLeftToPaginate
     * is 0, then the pagination is complete, and the caller should not try to paginate more, it's up to the
     * caller to implement this guard logic as this method is used to resolve any requests regardless if the
     * pagination is complete or not. And if the pagination completes and the caller still queries this function
     * then the subsequent document array will be empty.
     */
    paginatableAggregationPipeline<T extends bson.Document>({ collectionName, pipelineStages, properties, resultsPerPage, paginationPageIndex, sortOptions, // Default to undefined for no sorting
    includeInputStagesFirst, projectionStage }: {
        collectionName: DatabaseAPI.FonciiDBCollections;
        pipelineStages?: bson.Document[];
        properties?: {
            [K in keyof Partial<T>]: any;
        };
        resultsPerPage?: number;
        paginationPageIndex?: number;
        sortOptions?: {
            [K in keyof Partial<T>]: DatabaseAPI.AggregationSortOrders;
        };
        includeInputStagesFirst?: boolean;
        projectionStage?: bson.Document;
    }): Promise<{
        documents: T[];
        totalDocumentsLeftToPaginate: number;
    }>;
    /**
     * Performs a full-text search on the specified collection using a custom aggregation pipeline. This method
     * performs an autocomplete based full-text search, which differs from the regular full-text search by allowing
     * partial matches, whereas the latter only allows full matches with words. Custom pipeline stages can be injected
     * after the full-text search stage. It's important to know that full-text search must be the first stage in the
     * pipeline, and therefore the pipeline must be constructed in the following order:
     *
     * 1. Full-text search stage
     * 2. Custom pipeline stages
     *
     * @async
     * @param collectionName
     * @param pipelineStages -> Custom pipeline stages to resolve the aggregation pipeline with. Learn how to
     * @param searchQuery -> String search query to resolve the autocomplete full-text search stage with.
     * @param properties -> Query parameters to use to find the matching documents to return
     * construct these stages properly here: https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/
     * @param resultsPerPage -> The limit on the maximum amount of documents to return for this aggregation. Default is 100.
     * @param paginationPage -> The amount of documents to skip ahead of akaa page offset of the aggregation
     * (resultsPerPage * pagination page index (zero-indexed)) to get to the next page. Default is 0 [first page].
     * @param sortOptions -> The sorting options to use for this query. Default is undefined for no sorting.
     * IMPORTANT: Only use numeric sort keys, string based sort keys are illegal for aggregation pipelines, 1 to sort ascending,
     * -1 to sort descending.
     * @param projectionStage -> An optional projection stage to include in order to optimize fetch requests by
     * excluding unused fields from the return documents
     *
     * @returns -> [documents, totalDocumentsLeftToPaginate] Tuple. Note: if the totalDocumentsLeftToPaginate
     * is 0, then the pagination is complete, and the caller should not try to paginate more, it's up to the
     * caller to implement this guard logic as this method is used to resolve any requests regardless if the
     * pagination is complete or not. And if the pagination completes and the caller still queries this function
     * then the subsequent document array will be empty.
     */
    autocompleteTextSearchAggregationPipeline<T extends bson.Document>({ collectionName, indexName, pipelineStages, searchQuery, autocompleteMappedFields, properties, resultsPerPage, paginationPageIndex, sortOptions, // Default to undefined for no sorting
    projectionStage }: {
        collectionName: DatabaseAPI.FonciiDBCollections;
        indexName: DatabaseAPI.FullTextSearchIndexes;
        pipelineStages?: bson.Document[];
        searchQuery: string;
        autocompleteMappedFields: string[];
        properties?: {
            [K in keyof Partial<T>]: any;
        };
        resultsPerPage?: number;
        paginationPageIndex?: number;
        sortOptions?: {
            [K in keyof Partial<T>]: DatabaseAPI.AggregationSortOrders;
        };
        projectionStage?: bson.Document;
    }): Promise<{
        documents: T[];
        totalDocumentsLeftToPaginate: number;
    }>;
    /**
     * Cleans up the passed updated fields to remove any literal undefined or null values
     * and mark those fields to be unset due to the literal undefined or null values passed
     * in their place.
     *
     * @param updatedFields
     *
     * @returns -> A document that contains the updated fields to be set and the fields to be unset
     * depending on the literal undefined or null values in the updated fields.
     */
    cleanUpUpdatedFields(updatedFields: bson.Document): {
        $set: bson.Document;
        $unset: {
            [key: string]: any;
        };
    };
    /** Simple reusable method for referencing the specified collection */
    collectionRef(collectionName: DatabaseAPI.FonciiDBCollections): Collection;
    /**
     * @param document
     * @returns -> True if the document is empty, false otherwise.
     */
    isDocumentEmpty(document: bson.Document): boolean;
    /**
     * @param page
     * @returns -> True if the page index is within the expected range, false otherwise.
     */
    isPaginationPageIndexValid(page: number): boolean;
    /**
     * @param pageSize
     * @returns -> True if the page size is within the expected range, false otherwise.
     */
    isPaginationPageSizeValid(pageSize: number): boolean;
    /**
     * Creates a deterministic unique identifier that's a simple combination of the uid1 and
     * uid2 strings. This prevents the need to perform a lookup of an existing similar entry
     * before insertion of a document when necessary (frequently repeatable and undoable operations
     * such as liking or saving)
     *
     * @param uid1
     * @param uid2
     *
     * @returns -> A deterministic unique identifier that's a simple combination of the uid1 and
     * uid2 strings. This prevents the need to perform a lookup of an existing similar entry
     * before insertion of a document when necessary (frequently repeatable and undoable operations
     * such as liking or saving)
     */
    static createDeterministicUID({ uid1, uid2 }: {
        uid1: string;
        uid2: string;
    }): string;
}
export {};
