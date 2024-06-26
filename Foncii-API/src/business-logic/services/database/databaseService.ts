// Dependencies
// Inheritance
import PerformanceObserverable from "../../../core-foncii/protocols/performanceObservable";

// MongoDB SDK
import { AnyBulkWriteOperation, Collection, MongoClient, ServerApiVersion, SortDirection } from "mongodb";
import * as bson from "bson";

// Logging
import logger from "../../../foncii-toolkit/debugging/debugLogger";

// Namespaces
import * as DatabaseAPI from '../../../types/namespaces/database-api';

// Utilities
import { trimObject } from "../../../foncii-toolkit/utilities/javascriptExtensions";
import { isNumberInRange } from "../../../foncii-toolkit/math/commonMath";
import { isObject } from "lodash";

// Configure environment variables for local
import dotenv from "dotenv";
if (!process.env.NODE_ENV || process.env.NODE_ENV === "local") {
  dotenv.config();
  dotenv.config({ path: `.env.local`, override: true });
}

/**
 * Globalized Singleton instances | A pool of database service singletons tied to their respective MongoDB connection URIs
 * this allows each connection to stay active, because if a connection stops while an operation is in progress (i.e when a
 * class or object is taken out of memory), the operation fails, singletons are necessary to allow MongoDB connections to persist.
 */
const sharedInstances: { [connectionURI: string]: DatabaseService } = {};

/**
 * Set this flag to true to force instances that use the FonciiFediverse DB to use the test database whenever necessary
 * i.e when conducting integration testing.
 */
export let forceUseTestDB: { value: boolean } = { value: false };

/**
 * Singleton service layer for interfacing with the MongoDB database cluster.
 * Use the shared instance for instantiating and accessing client properties and methods 
 * such as connection and close connection events. 
 * 
 * Important: Be sure to not close the connection when iterating through a sequential loop of
 * operations, only retire the current session when all immediate operations are finished.
 */
class DatabaseService extends PerformanceObserverable {
  // Properties
  client!: MongoClient

  // Connection String Secret
  connection_uri;

  /**
   * @param connectionURI -> The connection URI to use to access the required database instance,
   * the default value for this is the primary URI for our dedicated database instance. This can be 
   * specified in order to use other database instances ~ Federated Instances
   * @param flushConfig -> Flag that forces the singleton instance to set itself to the updated configuration
   */
  constructor(connectionURI: string, flushConfig: boolean = false) {
    // Performance observer super constructor
    super({ disabled: true });

    this.connection_uri = connectionURI;

    if (!sharedInstances[connectionURI] || flushConfig) {
      // Assign singleton
      sharedInstances[connectionURI] = this;

      // Initial Startup
      sharedInstances[connectionURI].setup();
      sharedInstances[connectionURI].start();
    }
  }

  /**
   * Init the SDK client with the application secrets
   */
  private setup() {
    // Dedicated instances
    sharedInstances[this.connection_uri].client = new MongoClient(sharedInstances[this.connection_uri].connection_uri, {
      pkFactory: {
        createPk: () => DatabaseService.generateUUIDHexString()
      },
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false, // Set to false to allow $search aggregation stage
        deprecationErrors: true,
      }
    });
  }

  /**
   * Establishes a connection to the MongoDB cluster.
   * 
   * @async
   */
  private async start() {
    try {
      await sharedInstances[this.connection_uri].client.connect();
      logger.info("Successfully connected to database cluster");
    } catch (err) {
      logger.error(`Failed to connect to database cluster: ${err}`);
    }
  }

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
  async stop() {
    try {
      await sharedInstances[this.connection_uri].client.close();
      logger.info("Closed connection to database cluster");
    } catch (err) {
      logger.error(`Failed to close connection to database cluster: ${err}`);
    }
  }

  /**
   * Ping the MongoDB cluster to confirm that the connection is successful
   * @async
   */
  private async healthCheck() {
    const pingCount = 1;

    await sharedInstances[this.connection_uri].client.db("admin").command({ ping: pingCount });
    logger.info(`Successfully pinged database cluster ${pingCount} time(s)`);
  }

  /**
   * Test the implementation of the service layer
   * by connecting to the database, pinging it,
   * and terminating the connection.
   * 
   * @async
   */
  async performImplementationTest() {
    await sharedInstances[this.connection_uri].healthCheck();
    await sharedInstances[this.connection_uri].stop();
  }

  // Helpers
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
  static generateUUIDHexString = () => new bson.UUID().toHexString().replaceAll("-", "").slice(0, 19);
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
export class DatabaseServiceAdapter extends DatabaseService {
  // Properties
  private database;

  // Limits
  private PaginationLimits = {
    defaultPaginationPageIndex: 0,
    minPaginationPageIndex: 0,
    maxPaginationPageIndex: 100, // Arbitrary number, can be changed later
    defaultResultsPerPage: 100,
    minResultsPerPage: 0, // 0 = No limit, beware this can lead to a large amount of data being fetched, only do so when possible.
    maxResultsPerPage: 2000 // For memory constraint concerns. The DB doesn't have a limit, but we should always impose a local limit
  }

  // Performance Metrics
  private PerformanceMetricKeys = {
    resolveAggregationPipelineOn: ({
      collectionName,
      withStackTrace = false
    }: {
      collectionName: string,
      withStackTrace?: boolean
    }) => `resolveAggregationPipelineOn ${collectionName}${withStackTrace ? ` | stack trace: ${Error().stack}` : ''}`
  };

  /**
   * @param databaseIdentifier -> Default is Foncii Fediverse (Primary Production DB), pass in the desired database to use when if this isn't it.
   * Specify the correct instance connection URI for which the given database is hosted on in order to use this properly.
   * @param flushConfig -> Flag that forces the singleton instance to set itself to the updated configuration
   */
  constructor(databaseIdentifier: DatabaseAPI.FonciiDatabases = DatabaseAPI.FonciiDatabases.Fediverse) {
    if (forceUseTestDB.value == true && databaseIdentifier == DatabaseAPI.FonciiDatabases.Fediverse) {
      databaseIdentifier = DatabaseAPI.FonciiDatabases.TestDB
    }

    super(process.env.MONGODB_CONNECTION_SECRET);

    this.database = sharedInstances[this.connection_uri].client.db(databaseIdentifier);
  }

  // Queries
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
  async findDocumentWithID<T extends bson.Document>(
    collectionName: DatabaseAPI.FonciiDBCollections,
    documentID: string
  ) {
    // Properties
    const properties: any = { _id: documentID };

    return await this.findDocumentWithProperties<T>(collectionName, properties);
  }

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
  async findDocumentWithProperties<T extends bson.Document>(
    collectionName: DatabaseAPI.FonciiDBCollections,
    properties: { [K in keyof Partial<T>]: any }
  ) {
    // Properties
    const collection = this.collectionRef(collectionName),
      documentFilter = properties;

    // Fetched document
    let document: T | null = null;

    try {
      document = await collection.findOne<T>(documentFilter);
    } catch (err) {
      logger.error(`Error encountered while fetching a document with the properties ${Object.entries(properties)} from collection ${collectionName}: ${err} `);
    }
    finally {
      return document;
    }
  }

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
   * @returns -> Aggregated collection documents
   */
  async findDocumentsWithProperties<T extends bson.Document>({
    collectionName,
    properties,
    resultsPerPage = this.PaginationLimits.defaultResultsPerPage,
    paginationPageIndex = this.PaginationLimits.defaultPaginationPageIndex,
    sortOptions = {} as any, // Default to empty object for no sorting
    projectionOptions
  }: {
    collectionName: DatabaseAPI.FonciiDBCollections,
    properties: { [K in keyof Partial<T>]: any },
    resultsPerPage?: number,
    paginationPageIndex?: number,
    sortOptions?: { [K in keyof Partial<T>]: SortDirection }
    projectionOptions?: { [K in keyof Partial<T>]: 1 | 0 }
  }): Promise<T[]> {
    // Properties
    const collection = this.collectionRef(collectionName),
      documentFilter = properties;

    // Fetched documents
    let documents: T[] = [];

    // Pagination
    const paginationPageSize = this.isPaginationPageSizeValid(resultsPerPage) ? resultsPerPage : this.PaginationLimits.defaultResultsPerPage,
      pageIndex = this.isPaginationPageIndexValid(paginationPageIndex) ? paginationPageIndex : this.PaginationLimits.defaultPaginationPageIndex,
      totalDocumentsPaginated = paginationPageSize * pageIndex;

    // Cursor Iterator
    const findCursor = collection
      .find<T>(documentFilter)
      .sort(sortOptions)
      .skip(totalDocumentsPaginated)
      .limit(paginationPageSize)

    if (projectionOptions)
      findCursor.project<T>(projectionOptions as bson.Document);

    documents = await findCursor.toArray();

    // Connection Clean Up
    findCursor.close();

    return documents;
  }

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
  async countTotalDocumentsWithProperties<T extends bson.Document>(
    collectionName: DatabaseAPI.FonciiDBCollections,
    properties: { [K in keyof Partial<T>]: any }
  ) {
    // Properties
    const collection = this.collectionRef(collectionName),
      documentFilter = properties;

    return await collection.countDocuments(documentFilter) ?? 0;
  }

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
  async countTotalDocumentsInCollection(collectionName: DatabaseAPI.FonciiDBCollections) {
    // Properties
    const collection = this.collectionRef(collectionName);

    return await collection.countDocuments({}, { hint: "_id_" }) ?? 0;
  }

  /**
   * Determines if the document with the given properties exists in the specified collection.
   * 
   * Dev Note: This uses the find operator to get one document, and return only it's id to determine
   * if the document exists or not. This is faster than find one since it doesn't return the entire
   * document, and simpler than an aggregation pipeline which would the same in terms of speed. For
   * small collections count will ultimately be faster (5 or so ms) since it returns only a single number
   * versus a an entire uid for find, but for larger collections this will always be the faster solution. 
   * 
   * @async
   * @param collectionName 
   * @param properties
   * 
   * @returns -> True if the document with the given properties exists in the specified collection
   * (count > 0), false otherwise.
   */
  async doesDocumentExistWithProperties<T extends bson.Document>(
    collectionName: DatabaseAPI.FonciiDBCollections,
    properties: { [K in keyof Partial<T>]: any }
  ) {
    // Properties
    const collection = this.collectionRef(collectionName),
      documentFilter = properties;

    // Cursor Iterator
    const findCursor = collection
      .find<T>(documentFilter)
      .limit(1)
      .project({ _id: null });

    const documents = await findCursor.toArray(),
      documentCount = documents.length,
      documentExists = documentCount > 0;

    // Connection Clean Up
    findCursor.close();

    return documentExists;
  }

  // Mutations
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
  async createNewDocumentWithID(
    collectionName: DatabaseAPI.FonciiDBCollections,
    documentID: string,
    document: bson.Document
  ): Promise<boolean> {
    // Properties
    const collection = this.collectionRef(collectionName);

    // Remove any literal undefined or null values
    trimObject(document);

    // Operation success flag
    let didSucceed = false;

    // Precondition failure to prevent unnecessary database operations
    if (this.isDocumentEmpty(document)) {
      logger.warn(`[createNewDocumentWithID] The pending document with ID: ${documentID}, in the collection ${collectionName} could not be created because the provided document is empty.`)
      return didSucceed;
    }

    try {
      await collection.insertOne({
        _id: documentID, // Insert the passed document ID as the primary key
        ...document
      } as any);

      logger.info(`[createNewDocumentWithID] Successfully created a new document with ID: ${documentID}, in the collection ${collectionName} `);
      didSucceed = true;
    }
    catch (err) {
      logger.error(`[createNewDocumentWithID] Error encountered while creating a new document with ID: ${documentID}, in the collection ${collectionName}: ${err} `);
    }
    finally {
      return didSucceed;
    }
  }

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
  async createNewTimeSeriesDocumentWithID(
    collectionName: DatabaseAPI.FonciiDBCollections,
    documentID: string,
    document: bson.Document,
    timeField: { [x: string]: Date }
  ): Promise<boolean> {
    // Properties
    const collection = this.collectionRef(collectionName);

    // Remove any literal undefined or null values
    trimObject(document);

    // Operation success flag
    let didSucceed = false;

    // Precondition failure to prevent unnecessary database operations
    if (this.isDocumentEmpty(document)) {
      logger.warn(`[createNewTimeSeriesDocumentWithID] The pending document with ID: ${documentID}, in the collection ${collectionName} could not be created because the provided document is empty.`)
      return didSucceed;
    }

    try {
      await collection.insertOne({
        _id: documentID, // Insert the passed document ID as the primary key
        ...document,
        ...timeField
      } as any);

      logger.info(`[createNewTimeSeriesDocumentWithID] Successfully created a new document with ID: ${documentID}, in the collection ${collectionName} `);
      didSucceed = true;
    }
    catch (err) {
      logger.error(`[createNewTimeSeriesDocumentWithID] Error encountered while creating a new document with ID: ${documentID}, in the collection ${collectionName}: ${err} `);
    }
    finally {
      return didSucceed;
    }
  }

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
  async createNewDocument(
    collectionName: DatabaseAPI.FonciiDBCollections,
    document: bson.Document
  ): Promise<boolean> {
    // Properties
    const collection = this.collectionRef(collectionName);

    // Remove any literal undefined or null values
    trimObject(document);

    // Operation success flag
    let didSucceed = false;

    // Precondition failure to prevent unnecessary database operations
    if (this.isDocumentEmpty(document)) {
      logger.warn(`[createNewDocument] The pending document with an auto - generated ID, in the collection ${collectionName} could not be created because the provided document is empty.`)
      return didSucceed;
    }

    try {
      const { insertedId } = await collection.insertOne({
        ...document
      } as any);

      logger.info(`[createNewDocument] Successfully created a new document with the auto - generated ID: ${insertedId}, in the collection ${collectionName} `);
      didSucceed = true;
    }
    catch (err) {
      logger.error(`[createNewDocument] Error encountered while trying to create a new document with an auto - generated ID, in the collection ${collectionName}: ${err} `);
    }
    finally {
      return didSucceed;
    }
  }

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
  async batchCreateDocumentsWithIDs(
    collectionName: DatabaseAPI.FonciiDBCollections,
    documentToIDMappings: { [documentID: string]: bson.Document },
  ) {
    // Properties
    const collection = this.collectionRef(collectionName),
      documents: bson.Document[] = [];

    // Remove any literal undefined or null values from the mappings
    trimObject(documentToIDMappings);

    // Operation success flag
    let didSucceed = false;

    // Convert the document to ID mappings to a list of documents with the primary key inserted into each document
    // and clean up any undefined / nullified fields as well as exclude any empty documents.
    Object.entries(documentToIDMappings).forEach(([documentID, document]) => {
      trimObject(document);

      if (this.isDocumentEmpty(document)) {
        logger.warn(`[batchCreateDocumentsWithIDs] The pending document with ID: ${documentID}, in the collection ${collectionName} could not be created because the provided document is empty.`)
      }
      else {
        documents.push({
          _id: documentID, // Insert the passed document ID as the primary key
          ...document // Spread out the fields inside the document
        } as any);
      }
    });

    // Precondition failure to prevent unnecessary database operations
    // No documents no creation
    if (documents.length === 0) {
      logger.warn(`[batchCreateDocumentsWithIDs] The pending batch of documents in the collection ${collectionName} could not be created because the provided documents are empty.`)
      return didSucceed;
    }

    try {
      const result = await collection.insertMany(documents);
      logger.info(`Successfully created a batch of documents in the collection ${collectionName}. Inserted Document Count: ${result.insertedCount} `)

      didSucceed = true;
    }
    catch (err) {
      logger.error(`Error encountered while creating a batch of documents in the collection ${collectionName}: ${err} `);
    }
    finally {
      console.table(documents);

      return didSucceed;
    }
  }

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
  async updateDocumentWithProperties<T extends bson.Document>(
    collectionName: DatabaseAPI.FonciiDBCollections,
    properties: { [K in keyof Partial<T>]: any },
    updatedDocument: bson.Document
  ) {
    const collection = this.collectionRef(collectionName),
      documentFilter = properties;

    // Operation success flag
    let didSucceed = false;

    // Precondition failure to prevent unnecessary database operations
    if (this.isDocumentEmpty(updatedDocument)) {
      logger.warn(`[updateDocumentWithProperties] A document with the properties: ${Object.entries(documentFilter)}, in the collection ${collectionName} was not updated because the updated document is empty.
            Please delete the document instead if the desired effect is to clear it from the database.`);

      return didSucceed;
    }

    // Remove any literal undefined or null values, doing so will allow those null or undefined
    // fields to be removed completely from the document when it's replaced with the updated document.
    trimObject(updatedDocument);

    try {
      await collection.replaceOne(documentFilter, updatedDocument);
      logger.info(`[updateDocumentWithProperties] Successfully updated document with properties: ${Object.entries(documentFilter)}, in the collection ${collectionName} `);

      didSucceed = true;
    }
    catch (err) {
      logger.error(`[updateDocumentWithProperties] Error encountered while updating document with properties: ${Object.entries(documentFilter)}, in the collection ${collectionName}: ${err} `);
    }
    finally {
      return didSucceed;
    }
  }

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
  async replaceDocumentWithID(
    collectionName: DatabaseAPI.FonciiDBCollections,
    documentID: string,
    updatedDocument: bson.Document
  ): Promise<boolean> {
    return await this.updateDocumentWithProperties(collectionName, { _id: documentID }, updatedDocument);
  }

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
  async updateFieldsInDocumentWithProperties<T extends bson.Document>(
    collectionName: DatabaseAPI.FonciiDBCollections,
    properties: { [K in keyof Partial<T>]: any },
    updatedFields: bson.Document
  ) {
    const collection = this.collectionRef(collectionName),
      documentFilter = properties;

    // Operation success flag
    let didSucceed = false;

    // Precondition failure to prevent unnecessary database operations
    if (this.isDocumentEmpty(updatedFields)) {
      logger.warn(`[updateFieldsInDocumentWithProperties] A document with the properties: ${Object.entries(documentFilter)}, in the collection ${collectionName} was not updated because the updated fields are empty.`);

      return didSucceed;
    }

    const updatedDocument = this.cleanUpUpdatedFields(updatedFields);

    try {
      await collection.updateOne(documentFilter, updatedDocument);
      logger.debug(`[updateFieldsInDocumentWithProperties] Successfully updated document with properties: ${Object.entries(documentFilter)}, in the collection ${collectionName} `);

      didSucceed = true;
    }
    catch (err) {
      logger.error(`[updateFieldsInDocumentWithProperties] Error encountered while updating document with properties: ${Object.entries(documentFilter)}, in the collection ${collectionName}: ${err} `);
    }
    finally {
      return didSucceed;
    }
  }

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
  async updateFieldsInDocumentsWithProperties<T extends bson.Document>(
    collectionName: DatabaseAPI.FonciiDBCollections,
    properties: { [K in keyof Partial<T>]: any },
    updatedFields: bson.Document
  ) {
    const collection = this.collectionRef(collectionName),
      documentFilter = properties;

    // Operation success flag
    let didSucceed = false;

    // Precondition failure to prevent unnecessary database operations
    if (this.isDocumentEmpty(updatedFields)) {
      logger.warn(`[updateFieldsInDocumentsWithProperties] Document matching the properties: ${Object.entries(documentFilter)}, in the collection ${collectionName} were not updated because the updated fields are empty.`);
      return didSucceed;
    }

    const updatedDocument = this.cleanUpUpdatedFields(updatedFields);

    try {
      await collection.updateMany(documentFilter, updatedDocument);
      logger.info(`[updateFieldsInDocumentsWithProperties] Successfully updated documents matching the properties: ${Object.entries(documentFilter)}, in the collection ${collectionName} `);

      didSucceed = true;
    }
    catch (err) {
      logger.error(`[updateFieldsInDocumentsWithProperties] Error encountered while updating documents matching the properties: ${Object.entries(documentFilter)}, in the collection ${collectionName}: ${err} `);
    }
    finally {
      return didSucceed;
    }
  }

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
  async updateFieldsInDocumentWithID(
    collectionName: DatabaseAPI.FonciiDBCollections,
    documentID: string,
    updatedFields: bson.Document
  ): Promise<boolean> {
    return await this.updateFieldsInDocumentWithProperties(
      collectionName,
      { _id: documentID },
      updatedFields
    );
  }

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
  async updateFieldsInDocumentsWithIDs(
    collectionName: DatabaseAPI.FonciiDBCollections,
    documentIDs: string[],
    updatedFields: bson.Document
  ): Promise<boolean> {
    return await this.updateFieldsInDocumentsWithProperties(collectionName, { _id: { $in: documentIDs } }, updatedFields);
  }

  /**
   * Deletes the document with the given properties from the specified collection.
   * 
   * @async
   * @param collectionName 
   * @param properties 
   * 
   * @returns -> True if the document was deleted successfully, false otherwise.
   */
  async deleteDocumentWithProperties<T extends bson.Document>(
    collectionName: DatabaseAPI.FonciiDBCollections,
    properties: { [K in keyof Partial<T>]: any }
  ): Promise<boolean> {
    // Properties
    const collection = this.collectionRef(collectionName),
      documentFilter = properties;

    // Operation success flag
    let didSucceed = false;

    try {
      const deleteResult = await collection.deleteOne(documentFilter),
        deletedDocumentCount = deleteResult.deletedCount;

      didSucceed = true;

      if (deletedDocumentCount > 0) {
        logger.info(`[deleteDocumentWithProperties] Successfully deleted document with properties: ${Object.entries(documentFilter)}, from the collection ${collectionName}, Deleted document count: ${deletedDocumentCount} `);
      }
      else {
        logger.warn(`[deleteDocumentWithProperties] No document with properties: ${Object.entries(documentFilter)}, from the collection ${collectionName}, could be found and marked for deletion.`);
      }
    }
    catch (err) {
      logger.error(`[deleteDocumentWithProperties] Error encountered while deleting document with properties: ${Object.entries(documentFilter)}, from the collection ${collectionName}: ${err} `);
    }
    finally {
      return didSucceed;
    }
  }

  /**
   * Deletes many documents that match the given properties from the specified collection.
   * 
   * @async
   * @param collectionName 
   * @param properties 
   * 
   * @returns -> True if the matching documents were deleted successfully, false otherwise.
   */
  async deleteDocumentsWithProperties<T extends bson.Document>(
    collectionName: DatabaseAPI.FonciiDBCollections,
    properties: { [K in keyof Partial<T>]: any }
  ): Promise<boolean> {
    // Properties
    const collection = this.collectionRef(collectionName),
      documentFilter = properties;

    // Operation success flag
    let didSucceed = false;

    try {
      const deleteResult = await collection.deleteMany(documentFilter),
        deletedDocumentCount = deleteResult.deletedCount;

      didSucceed = true;

      if (deletedDocumentCount > 0) {
        logger.info(`[deleteDocumentsWithProperties] Successfully deleted documents matching the properties: ${Object.entries(documentFilter)}, from the collection ${collectionName}, Deleted document count: ${deletedDocumentCount} `);
      }
      else {
        logger.warn(`[deleteDocumentsWithProperties] No documents with the properties: ${Object.entries(documentFilter)}, from the collection ${collectionName}, could be found and marked for deletion.`);
      }
    }
    catch (err) {
      logger.error(`[deleteDocumentsWithProperties] Error encountered while deleting documents matching the properties: ${Object.entries(documentFilter)}, from the collection ${collectionName}: ${err} `);
    }
    finally {
      return didSucceed;
    }
  }

  /**
   * Deletes the document with the given identifier from the specified collection.
   * 
   * @async
   * @param collectionName 
   * @param documentID 
   * 
   * @returns -> True if the document was deleted successfully, false otherwise.
   */
  async deleteDocumentWithID(
    collectionName: DatabaseAPI.FonciiDBCollections,
    documentID: string
  ): Promise<boolean> {
    return await this.deleteDocumentWithProperties(collectionName, { _id: documentID });
  }

  /**
   * Deletes a batch of document with the given identifier from the specified collection.
   * 
   * @param collectionName  
   * @param documentIDs -> Array of document IDs to match with the documents to be deleted.
   * 
   * @returns -> True if the batch of documents were deleted successfully, false otherwise.
   */
  async deleteDocumentsWithIDs(
    collectionName: DatabaseAPI.FonciiDBCollections,
    documentIDs: string[]
  ): Promise<boolean> {
    // Use $in operator to match multiple documents with the same ID
    return await this.deleteDocumentsWithProperties(collectionName, { _id: { $in: documentIDs } });
  }

  // Bulk Operations 
  /**
   * A modular fast and efficient way to perform a set of multiple operations at once.
   * 
   * @param collectionName 
   * @param operations 
   * @param bestEffort - if some actions fail, continue with other actions 
   * 
   * @returns -> True if the bulk operations were performed successfully, false otherwise.
   */
  async bulkWrite(
    collectionName: DatabaseAPI.FonciiDBCollections,
    operations: AnyBulkWriteOperation<bson.Document>[],
    bestEffort?: boolean
  ): Promise<boolean> {
    // Properties
    const collection = this.collectionRef(collectionName);

    // Operation success flag
    let didSucceed = false;

    try {
      const bulkWriteResult = await collection.bulkWrite(operations, { ordered: !bestEffort });

      logger.info(`A set of BulkWrite operations was performed successfully on the collection ${collectionName} `);
      console.table(bulkWriteResult)

      didSucceed = true;
    }
    catch (err) {
      logger.error(`Error encountered while executing BulkWrite operations on the collection ${collectionName}: ${err} `);
    }
    finally {
      return didSucceed;
    }
  }

  /**
   * [updateOne] Formats the given fields and filters (if any) to be used as a bulk write operation
   * for updating the specified fields of a single document.
   * 
   * @async
   * @param properties 
   * @param updatedFields 
   * 
   * @returns -> A bulk write formatted operation that updates a single document with the given fields.
   */
  updateFieldsInDocumentAsBulkWriteOperation<T extends bson.Document>(
    properties: { [K in keyof Partial<T>]: any },
    updatedFields: bson.Document
  ): AnyBulkWriteOperation<bson.Document> {
    const updatedDocument = this.cleanUpUpdatedFields(updatedFields);

    return {
      updateOne: {
        filter: properties,
        update: updatedDocument
      }
    };
  }

  /**
   * [InsertOne] Formats the given documentID and document data to be used as a bulk write operation
   * for creating a single document with the given document data and ID.
   * 
   * @async
   * @param documentID 
   * @param document 
   * 
   * @returns -> A bulk write formatted operation that creates a single document with the given document
   * data and ID.
   */
  createNewDocumentWithIDAsBulkWriteOperation(
    documentID: string,
    document: bson.Document
  ): AnyBulkWriteOperation<bson.Document> {
    return {
      insertOne: {
        document: {
          ...document,
          _id: documentID, // Insert the passed document ID as the primary key
        } as any
      }
    }
  }

  /**
   * ~ Same as 'createNewDocumentWithIDAsBulkWriteOperation' but without specifying the '_id' document ID property
   * Useful when inserting doucments that don't need to be identified explicitly, like article publications which
   * can have duplicate information but represent a large lake of data to choose from over time.
   * 
   * @async
   * @param document 
   * 
   * @returns -> A bulk write formatted operation that creates a single document with the given document
   * data and a database generated ObjectID.
   */
  createNewDocumentAsBulkWriteOperation(
    document: bson.Document
  ): AnyBulkWriteOperation<bson.Document> {
    return {
      insertOne: {
        document: {
          ...document,
        } as any
      }
    }
  }

  // Configurable Aggregation Pipelines
  /**
   * Aggregates the specified collection using the given custom aggregation pipeline to produce
   * an array of the specified output type. If the pipeline is invalid due to a bad stage then 
   * the error is logged and the result comes back as an empty array.
   * 
   * @async
   * @param collectionName 
   * @param pipelineStages -> Custom pipeline stages to resolve the aggregation pipeline with. Learn how to
   * construct these stages properly here: https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/
   * 
   * @returns -> [output] -> An array containing the output of the aggregation pipeline. If a count stage is 
   * used at the end of the custom stages input then you can access it at index 0 of the array if the 
   * pipeline is valid, in that specific case also be sure to provide a default value via unwrapping to ensure the array isn't empty.
   */
  async resolveGenericAggregationPipelineOn<T extends bson.Document>(
    collectionName: DatabaseAPI.FonciiDBCollections,
    pipelineStages: bson.Document[]
  ): Promise<T[]> {
    // Properties
    const collection = this.collectionRef(collectionName),
      // Custom aggregation pipeline to resolve based on input pipeline stages
      aggregationCursor = collection.aggregate<T>(pipelineStages);

    // Convert the aggregation cursor to an array of documents produced by the input pipeline
    let output: T[] = [];

    try {
      output = await aggregationCursor.toArray();
      logger.debug(`[resolveGenericAggregationPipelineOn] Aggregation pipeline was resolved successfully on the collection ${collectionName} `);
    }
    catch (err) {
      logger.error(`[resolveGenericAggregationPipelineOn] Error encountered while resolving aggregation pipeline on the collection ${collectionName}: ${err} `);
    }

    // Connection Clean Up
    aggregationCursor.close();

    return output;
  }

  /**
   * Aggregates the specified collection using the given custom aggregation pipeline to produce
   * an array of documents. The total amount of documents left to paginate is also returned. If 
   * the pipeline is invalid due to a bad stage then the error is logged and the result comes 
   * back as an empty array and 0 for the documents left to paginate.
   * 
   * @async
   * @param collectionName 
   * @param pipelineStages -> Custom pipeline stages to resolve the aggregation pipeline with. Learn how to
   * construct these stages properly here: https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/
   * 
   * @returns -> Aggregated collection documents
   */
  async resolveAggregationPipelineOn<T extends bson.Document>(
    collectionName: DatabaseAPI.FonciiDBCollections,
    pipelineStages: bson.Document[]
  ): Promise<T[]> {
    return await this.measurePerformance(
      this.PerformanceMetricKeys
        .resolveAggregationPipelineOn({
          collectionName
        }),
      async () => {
        // Properties
        const collection = this.collectionRef(collectionName),
          // Custom aggregation pipeline to resolve based on input pipeline stages
          aggregationCursor = collection.aggregate<T>(pipelineStages);

        // Convert the aggregation cursor to an array of documents produced by the input pipeline
        let documents: T[] = [];

        try {
          documents = await aggregationCursor.toArray();
          logger.debug(`[resolveAggregationPipelineOn] Aggregation pipeline was resolved successfully on the collection ${collectionName} `);
        }
        catch (err) {
          logger.error(`[resolveAggregationPipelineOn] Error encountered while resolving aggregation pipeline on the collection ${collectionName}: ${err} `);
        }

        // Connection Clean Up
        aggregationCursor.close();

        return documents;
      });
  }

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
   * @returns -> Aggregated collection documents
   */
  async paginatableAggregationPipeline<T extends bson.Document>({
    collectionName,
    pipelineStages = [],
    properties = {} as any,
    resultsPerPage = this.PaginationLimits.defaultResultsPerPage,
    paginationPageIndex = this.PaginationLimits.defaultPaginationPageIndex,
    sortOptions = undefined, // Default to undefined for no sorting
    includeInputStagesFirst = false,
    projectionStage
  }: {
    collectionName: DatabaseAPI.FonciiDBCollections,
    pipelineStages?: bson.Document[],
    properties?: { [K in keyof Partial<T>]: any },
    resultsPerPage?: number,
    paginationPageIndex?: number,
    sortOptions?: { [K in keyof Partial<T>]: DatabaseAPI.AggregationSortOrders },
    includeInputStagesFirst?: boolean,
    projectionStage?: { $project: { [K in keyof Partial<T>]: 1 | 0 } }
  }): Promise<T[]> {
    // Pagination
    const paginationPageSize = this.isPaginationPageSizeValid(resultsPerPage) ? resultsPerPage : this.PaginationLimits.defaultResultsPerPage,
      pageIndex = this.isPaginationPageIndexValid(paginationPageIndex) ? paginationPageIndex : this.PaginationLimits.defaultPaginationPageIndex,
      totalDocumentsPaginated = paginationPageSize * pageIndex;

    // Pipeline configuration
    let paginatablePipeline = [];

    if (includeInputStagesFirst) {
      paginatablePipeline = [
        ...pipelineStages, // Some stage required to be first i.e geospatial search, full text search etc.
        { $match: properties },
      ];
    }
    else {
      paginatablePipeline = [
        { $match: properties }, // Match first to reduce the workload of any potential joins or large scope computations
        ...pipelineStages
      ];
    }

    // Optional sort stage
    if (sortOptions) {
      paginatablePipeline.push({ $sort: { ...sortOptions } }); // Sort at the end of the pipeline since all the other stages reduced the overall element count 
    }

    // Conditional stages, validate inputs before applying them to the pipeline
    if (totalDocumentsPaginated >= 0) {
      paginatablePipeline.push({ $skip: totalDocumentsPaginated });
    }

    if (paginationPageSize > 0) {
      paginatablePipeline.push({ $limit: paginationPageSize });
    }

    // Any projections must go last
    if (projectionStage) {
      paginatablePipeline.push(projectionStage);
    }

    return await this.resolveAggregationPipelineOn(collectionName, paginatablePipeline);
  }

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
   * @returns -> Aggregated collection documents
   */
  async autocompleteTextSearchAggregationPipeline<T extends bson.Document>({
    collectionName,
    indexName,
    pipelineStages = [],
    searchQuery,
    autocompleteMappedFields = [] as any,
    properties = {} as any,
    resultsPerPage = this.PaginationLimits.defaultResultsPerPage,
    paginationPageIndex = this.PaginationLimits.defaultPaginationPageIndex,
    sortOptions = undefined, // Default to undefined for no sorting
    projectionStage
  }: {
    collectionName: DatabaseAPI.FonciiDBCollections,
    indexName: DatabaseAPI.FullTextSearchIndexes,
    pipelineStages?: bson.Document[],
    searchQuery: string,
    autocompleteMappedFields: string[],
    properties?: { [K in keyof Partial<T>]: any },
    resultsPerPage?: number,
    paginationPageIndex?: number,
    sortOptions?: { [K in keyof Partial<T>]: DatabaseAPI.AggregationSortOrders },
    projectionStage?: { $project: { [K in keyof Partial<T>]: 1 | 0 } }
  }): Promise<T[]> {
    // Input cleaning
    const trimmedSearchQuery = searchQuery.trim();

    // Precondition failure, can't query with a blank search query, pipeline will throw an error
    if (trimmedSearchQuery.length == 0) return [];

    // Pagination
    const paginationPageSize = this.isPaginationPageSizeValid(resultsPerPage) ? resultsPerPage : this.PaginationLimits.defaultResultsPerPage,
      pageIndex = this.isPaginationPageIndexValid(paginationPageIndex) ? paginationPageIndex : this.PaginationLimits.defaultPaginationPageIndex,
      totalDocumentsPaginated = paginationPageSize * pageIndex;

    // Compounded autocomplete text search, a single clause can be used in the compound when multiple aren't possible, but the compound 
    // operator allows for any number to be used which is why this implementation is compounded like this; for modularity.
    const compoundedAutocompleteTextSearchClauses = autocompleteMappedFields.map((mappedField) => ({
      query: trimmedSearchQuery,
      path: mappedField as any as string
    })), autocompleteCompoundedSearch = this.compoundAutocompleteTextSearchClauses(compoundedAutocompleteTextSearchClauses);

    // Full-text search MUST be the first stage in the pipeline, if it's not then the aggregation throws an error.
    const fullTextSearchPaginatablePipeline: bson.Document[] = [
      { $search: { index: indexName, ...autocompleteCompoundedSearch } },
      { $match: properties }, // Match with any required properties to narrow down the search results after full-text search
      ...pipelineStages
    ];

    // Optional sort stage
    // Note: A consistently unique field must also be included in the sort field to provide consistent sort results in case of duplicates. (Unexpected results may occur when sorting with a not so unique field)
    // https://www.mongodb.com/community/forums/t/single-fetch-with-skip-and-limit-returns-unexpected-result/119205/7
    if (sortOptions) {
      fullTextSearchPaginatablePipeline.push({ $sort: { _id: 1, ...sortOptions } }); // Sort at the end of the pipeline since all the other stages reduced the overall element count 
    }

    // Conditional stages, validate inputs before applying them to the pipeline
    if (totalDocumentsPaginated >= 0) {
      fullTextSearchPaginatablePipeline.push({ $skip: totalDocumentsPaginated });
    }

    if (paginationPageSize > 0) {
      fullTextSearchPaginatablePipeline.push({ $limit: paginationPageSize });
    }

    // Any projections must go last
    if (projectionStage) {
      fullTextSearchPaginatablePipeline.push(projectionStage);
    }

    return await this.resolveAggregationPipelineOn(collectionName, fullTextSearchPaginatablePipeline);
  }

  // Helpers
  /**
   * Constructs and returns an autocomplete text search clause with the passed query and 
   * path / autocomplete mapped field. The passed field must be mapped in the search index
   * configurator in order to be used in the search query: https://www.mongodb.com/docs/atlas/atlas-search/field-types/autocomplete-type/#std-label-bson-data-types-autocomplete
   * Please double check the mappings before passing in paths to traverse.
   * 
   * @param clause -> String search query and the path / autocomplete mapped field to use for autocomplete text search.
   * Documentation: https://www.mongodb.com/docs/atlas/atlas-search/autocomplete/#std-label-autocomplete-ref
   * 
   * @returns -> An autocomplete text search clause with the passed query and path. 
   */
  private autocompleteTextSearchClauseFactory(
    clause: {
      query: string,
      path: string
    }): { autocomplete: { query: string, path: string } } {
    return { autocomplete: { ...clause } };
  }

  /**
   * Compounds an array of autocomplete text search clauses into a compound query. This compound
   * query resolves to a document that contains the autocomplete text search clauses with respect to
   * the minimum amount of matching clauses.
   * 
   * @param clauses -> An array of clauses to use for the compound autocomplete text search. 
   * Each clause contains an autocomplete mapped field and the query to search for. Documentation: https://www.mongodb.com/docs/atlas/atlas-search/field-types/autocomplete-type/#std-label-bson-data-types-autocomplete
   * @param minimumShouldMatch -> The minimum number of clauses that should match in order for a 
   * document / result to be returned. Default is 1, as at least one should clause must match in order to
   * return a document, as this only makes logical sense when it comes to querying; if nothing matches then
   * nothing is returned.
   * 
   * Documentation: https://www.mongodb.com/docs/atlas/atlas-search/compound/
   * 
   * @returns -> A compound query containing autocomplete text search clauses.
   */
  private compoundAutocompleteTextSearchClauses(
    clauses: {
      query: string,
      path: string
    }[]
    ,
    minimumShouldMatch: number = 1
  ): {
    compound: {
      should: { autocomplete: { query: string, path: string } }[],
      minimumShouldMatch: number
    }
  } {
    return {
      compound: {
        should: clauses.map((clause) => this.autocompleteTextSearchClauseFactory(clause)),
        minimumShouldMatch
      }
    };
  }

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
  cleanUpUpdatedFields(updatedFields: bson.Document) {
    // Remove any literal undefined or null values by marking them for deletion since 
    // this method doesn't directly replace the entire document
    const fieldsToRemove = Object.keys(updatedFields)
      .filter((key: string) => {
        return updatedFields[key] === undefined ||
          updatedFields[key] === null ||
          isObject(updatedFields[key]) && Object.keys(updatedFields[key]).length == 0
      }),
      fieldDeletionMappings: { [key: string]: any } = {};

    fieldsToRemove.map((key: string) => { fieldDeletionMappings[key] = ""; });

    // Remove the fields to remove from the updated fields to remove any conflicts
    trimObject(updatedFields);

    const updatedDocument = {
      $set: updatedFields,
      $unset: fieldDeletionMappings
    };

    return updatedDocument;
  }

  /** Simple reusable method for referencing the specified collection */
  collectionRef(collectionName: DatabaseAPI.FonciiDBCollections): Collection {
    return this.database.collection(collectionName);
  }

  /**
   * @param document 
   * @returns -> True if the document is empty, false otherwise.
   */
  isDocumentEmpty(document: bson.Document): boolean {
    return Object.keys(document).length == 0;
  }

  /**
   * @param page 
   * @returns -> True if the page index is within the expected range, false otherwise.
   */
  isPaginationPageIndexValid(page: number): boolean {
    return isNumberInRange(page, [this.PaginationLimits.minPaginationPageIndex, this.PaginationLimits.maxPaginationPageIndex]);
  }

  /**
   * @param pageSize 
   * @returns -> True if the page size is within the expected range, false otherwise.
   */
  isPaginationPageSizeValid(pageSize: number): boolean {
    return isNumberInRange(pageSize, [this.PaginationLimits.minResultsPerPage, this.PaginationLimits.maxResultsPerPage]);
  }

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
  static createDeterministicUID({
    uid1,
    uid2
  }: {
    uid1: string,
    uid2: string
  }) {
    return uid1 + uid2;
  }
}