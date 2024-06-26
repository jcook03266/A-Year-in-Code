// Dependencies
// Types
import {
  AggregationSortOrders,
  FonciiDBCollections,
} from "../../../../types/namespaces/database-api";

// Services
import { DatabaseServiceAdapter } from "../../database/databaseService";
import RestaurantService from "./restaurantService";

// Utils
import { currentDateAsISOString } from "../../../../foncii-toolkit/utilities/convenienceUtilities";

// Local Types
type ArticlePublicationSortOptions = {
  [K in keyof Partial<ArticlePublication>]: AggregationSortOrders;
};

type ArticlePublicationPropertyOptions = {
  [K in keyof Partial<ArticlePublication>]: any;
};

type RestaurantAwardPropertyOptions = {
  [K in keyof Partial<RestaurantAward>]: any;
};

/**
 * Interacts with the primary database to find / pull in online articles
 * pertaining to restaurants by name. These articles are scraped from
 * the internet and persisted to our primary DB (we dont use S3 and database
 * federation anymore due to costs and bad latency)
 */
export default class RecognizedService {
  // Services
  database = new DatabaseServiceAdapter();
  restaurantService = () => new RestaurantService();

  // Database Operations
  // Reusable / Modular Methods
  // Queries
  /**
   * Finds a singular article record that exists with the given id attribute
   * in the database and returns it to this service.
   * 
   * @async
   * @param id 
   * 
   * @returns -> The article publication with the given id (if it exists), 
   * null otherwise.
   */
  async findArticleWithID(id: string) {
    return await this.database
      .findDocumentWithID<ArticlePublication>(
        FonciiDBCollections.ArticlePublications,
        id
      );
  }

  /**
   * Determines whether or not an article publication record exists
   * in the database with the given id attribute.
   * 
   * @async
   * @param id 
   * 
   * @returns -> True if the article exists, false otherwise
   */
  async doesArticleExistWithID(id: string) {
    return await this.database
      .doesDocumentExistWithProperties<ArticlePublicationPropertyOptions>(
        FonciiDBCollections.ArticlePublications,
        { id }
      );
  }

  /**
   * Searches the 'Article Publications' collection for a single scraped article document with properties
   * (venueName, restaurant id, publication etc.) equal to those provided.
   *
   * @async
   * @param properties
   *
   * @returns -> Null if the scraped article document can't be found, article publication data model otherwise.
   */
  async findArticleWith(properties: ArticlePublicationPropertyOptions) {
    return await this.database.findDocumentWithProperties<ArticlePublication>(
      FonciiDBCollections.ArticlePublications,
      properties
    );
  }

  /**
   * Searches the 'Article Publications' collection for scraped article documents with properties
   * (venueName, restaurant id, publication etc.) equal to those provided.
   *
   * @async
   * @param properties
   * @param resultsPerPage -> The maximum number of documents to return per page (0 = no limit)
   * @param paginationPageIndex -> The current page index (0 = first page of results)
   *
   * @returns -> Aggregated collection documents
   */
  async findArticlesWith({
    properties = {},
    resultsPerPage = 100,
    paginationPageIndex = 0,
    sortOptions = {},
  }: {
    properties?: ArticlePublicationPropertyOptions;
    resultsPerPage?: number;
    paginationPageIndex?: number;
    sortOptions?: ArticlePublicationSortOptions;
  }) {
    return await this.database.findDocumentsWithProperties<ArticlePublication>({
      collectionName: FonciiDBCollections.ArticlePublications,
      properties,
      resultsPerPage,
      paginationPageIndex,
      sortOptions,
    });
  }

  /**
   * Determines if the 'Article Publications' collection includes a scraped article document with properties
   * (venueName, restaurant id, publication etc.) equal to those provided.
   *
   * @async
   * @param properties
   *
   * @returns -> True if an article exists with the given properties, false otherwise.
   */
  async doesArticleExistWith(properties: ArticlePublicationPropertyOptions) {
    return await this.database.doesDocumentExistWithProperties<ArticlePublication>(
      FonciiDBCollections.ArticlePublications,
      properties
    );
  }
  /**
   * Determines if the 'Restaurant Award' collection includes a scraped award document with properties
   * (venueName, restaurant id, publication etc.) equal to those provided.
   *
   * @async
   * @param properties
   *
   * @returns -> True if an article exists with the given properties, false otherwise.
   */
  async doesRestaurantAwardExistFor(restaurantID: string) {
    return await this.database.doesDocumentExistWithProperties<RestaurantAward>(
      FonciiDBCollections.RestaurantAwards,
      { restaurantID }
    );
  }

  /**
   * Determines the total amount of scraped article documents in the 'Article Publications'
   * collection that match the given properties.
   *
   * @async
   * @param properties
   *
   * @returns -> An integer representing the total amount of scraped article documents in the
   * 'Article Publications' collection that match the given properties.
   */
  async countTotalArticlesWithProperties(
    properties: ArticlePublicationPropertyOptions
  ) {
    return await this.database.countTotalDocumentsWithProperties(
      FonciiDBCollections.ArticlePublications,
      properties
    );
  }

  /**
   * Determines the total amount of unique publications for which scraped article documents in the
   * 'Article Publications' collection that match the given properties belong to.
   *
   * @async
   * @param properties
   *
   * @returns -> An integer representing the total amount of unique publications for which scraped article documents in the
   * 'Article Publications' collection that match the given properties belong to.
   */
  async countTotalPublicationsWithArticlesWithProperties(
    properties: ArticlePublicationPropertyOptions
  ): Promise<number> {
    const pipelineStages = [
      { $match: properties },
      {
        $sort: {
          publishDate: AggregationSortOrders.descending,
        } as ArticlePublicationSortOptions,
      },
      { $group: { _id: "$publication" } },
      { $count: "count" },
    ];

    return ((await this.database
      .resolveGenericAggregationPipelineOn<{ count: number }>
      (FonciiDBCollections.ArticlePublications, pipelineStages))[0]?.count ?? 0
    );
  }

  // Unique Methods
  // Queries
  /**
   * Finds and returns the scraped article documents corresponding to the
   * given venue name (restaurant / bar name etc.) in the database (if it exists).
   *
   * @async
   * @param restaurantID -> Foncii restaurant id of the restaurant / bar / venue to search the
   * 'Article Publications' database collection for.
   * @param resultsPerPage -> The maximum number of documents to return per page (0 = no limit)
   * @param paginationPageIndex -> The current page index (0 = first page of results) Default is 0
   *
   * @returns -> Aggregated collection documents
   */
  async findArticlesAssociatedWith({
    restaurantID,
    resultsPerPage,
    paginationPageIndex = 0
  }: {
    restaurantID: string,
    resultsPerPage: number,
    paginationPageIndex?: number
  }) {
    return await this.findArticlesWith({
      properties: { restaurantID },
      resultsPerPage,
      paginationPageIndex
    });
  }

  /**
   * Finds and returns the scraped article documents corresponding to the
   * given Foncii restaurant id in the database (if it exists).
   * 
   * @async
   * @param restaurantID -> Foncii restaurant id of the restaurant / bar / venue to search the
   * 'Article Publications' database collection for.
   * @param resultsPerPage -> The maximum number of documents to return per page (0 = no limit), default is 0 as all publication groupings must be returned
   * (The total amount of unique publications is a small number so this doesn't affect potential performance or memory constraints with its unbounded nature)
   * @param paginationPageIndex -> The current page index (0 = first page of results) Default is 0
   * @param projectionStage
   *
   * @returns -> Aggregated collection documents
   */
  async findArticlesForRestaurant({
    restaurantID,
    resultsPerPage = 0,
    paginationPageIndex = 0,
    projectionStage
  }: {
    restaurantID: string,
    resultsPerPage?: number,
    paginationPageIndex?: number,
    projectionStage?: { $project: { [K in keyof Partial<ArticlePublicationPropertyOptions>]: 1 | 0 } }
  }) {
    const aggregationResult =
      await this.database.paginatableAggregationPipeline<ArticlePublication>({
        collectionName: FonciiDBCollections.ArticlePublications,
        properties: { restaurantID },
        sortOptions: { publishDate: AggregationSortOrders.descending },
        resultsPerPage,
        paginationPageIndex,
        includeInputStagesFirst: false,
        projectionStage
      });

    return aggregationResult;
  }

  /**
   * Finds and returns the scraped award documents corresponding to the
   * given restaurant in the database (if it exists)
   *
   * @async
   * @param restaurantID -> ID of the restaurant to obtain the restaurant awards for
   * @param resultsPerPage -> The maximum number of documents to return per page (0 = no limit), default is 0 as all publication groupings must be returned
   * (The total amount of unique awards is a small number so this doesn't affect potential performance or memory constraints with its unbounded nature)
   * @param paginationPageIndex -> The current page index (0 = first page of results) Default is 0
   *
   * @returns -> Aggregated collection documents
   */
  async findAwardsForRestaurant({
    restaurantID,
    resultsPerPage = 0,
    paginationPageIndex = 0,
    projectionStage
  }: {
    restaurantID: string,
    resultsPerPage?: number,
    paginationPageIndex?: number,
    projectionStage?: { $project: { [K in keyof Partial<RestaurantAward>]: 1 | 0 } }
  }) {
    const aggregationResult =
      await this.database.paginatableAggregationPipeline<RestaurantAward>({
        collectionName: FonciiDBCollections.RestaurantAwards,
        properties: { restaurantID },
        sortOptions: { awardDate: AggregationSortOrders.descending },
        resultsPerPage,
        paginationPageIndex,
        includeInputStagesFirst: false,
        projectionStage
      });

    return aggregationResult;
  }

  /**
   * Finds and returns all scraped article documents from the database given the results per page,
   * pagination index and sort options provided.
   *
   * @async
   * @param resultsLimit -> Default is 100, be careful not to fetch too many entities at once in order to not exceed the device's memory limit.
   * @param paginationPageIndex -> Default is 0
   *
   * @returns -> Aggregated collection documents
   */
  async getAllArticles({
    resultsPerPage = 100,
    paginationPageIndex = 0
  }: {
    resultsPerPage: number,
    paginationPageIndex: number
  }) {
    return await this.findArticlesWith({
      resultsPerPage,
      paginationPageIndex,
    });
  }

  /**
   * Determines the total amount of scraped article documents in the 'Aggregated-Articles' collection.
   *
   * @async
   *
   * @returns -> An integer representing the total amount of scraped article documents in the
   * collection.
   */
  async countTotalArticles(): Promise<number> {
    return await this.database.countTotalDocumentsInCollection(
      FonciiDBCollections.ArticlePublications
    );
  }

  // Mutations
  /**
   * Updates the article publication document referenced by the given uid.
   * 
   * Note: Only use the supported fields provided by the associated data model
   * to avoid adding isolated/unknown data to a restaurant document. Any literal undefined or null 
   * fields will be marked as unset and consequently removed from the document, if this isn't the
   * desired behavior, use the replace method to update the entire document at once and preserve 
   * any fields by trimming out these values instead of removing the fields completely.
   * 
   * @async
   * @param id -> ID of the document to update
   * @param updatedFields -> Updated fields to update the target document with
   * 
   * @returns -> True if the update was successful, false otherwise. 
   */
  async updateArticlePublication({
    id,
    updatedFields
  }: {
    id: string,
    updatedFields: ArticlePublicationPropertyOptions
  }) {
    const documentID = id,
      updatedProperties = {
        ...updatedFields,
        lastUpdated: currentDateAsISOString(), // Will overwrite any property named 'lastUpdated' below as intended if included
      }

    return await this.database
      .updateFieldsInDocumentWithID(
        FonciiDBCollections.ArticlePublications,
        documentID,
        updatedProperties
      );
  }

  /**
   * Updates the restaurant award document referenced by the given uid.
   * 
   * Note: Only use the supported fields provided by the associated data model
   * to avoid adding isolated/unknown data to a restaurant document. Any literal undefined or null 
   * fields will be marked as unset and consequently removed from the document, if this isn't the
   * desired behavior, use the replace method to update the entire document at once and preserve 
   * any fields by trimming out these values instead of removing the fields completely.
   * 
   * @async
   * @param id -> ID of the document to update
   * @param updatedFields -> Updated fields to update the target document with
   * 
   * @returns -> True if the update was successful, false otherwise. 
   */
  async updateRestaurantAward({
    id,
    updatedFields
  }: {
    id: string,
    updatedFields: RestaurantAwardPropertyOptions
  }) {
    const documentID = id,
      updatedProperties = {
        ...updatedFields,
        lastUpdated: currentDateAsISOString(),
      }

    return await this.database
      .updateFieldsInDocumentWithID(
        FonciiDBCollections.RestaurantAwards,
        documentID,
        updatedProperties
      );
  }

  /**
   * Inserts the incoming article publication data in bulk to reduce the amount of server
   * operations.
   *
   * @async
   * @param articlePublicationDetails
   *
   * @returns -> True if the all the article documents were created and inserted in bulk successfully, false otherwise.
   */
  async bulkCreateArticlePublications(articlePublicationDetails: ArticlePublication[]) {
    /**
     * Bulk inserts these documents with a database generated ObjectID instead of a custom one
     * because a custom one is not needed since we don't need to keep track of these articles as
     * we don't query them by ID, so the ID generation can be left up to the database itself.
     */
    const bulkCreateDocumentOperations = articlePublicationDetails.map(
      (articlePublicationDetail) => {
        return this.database.createNewDocumentAsBulkWriteOperation(
          articlePublicationDetail
        );
      }
    );

    return await this.database.bulkWrite(
      FonciiDBCollections.ArticlePublications,
      bulkCreateDocumentOperations
    );
  }

  /**
   * Inserts the incoming award data in bulk to reduce the amount of server
   * operations.
   *
   * @async
   * @param articlePublicationDetails
   *
   * @returns -> True if the all the article documents were created and inserted in bulk successfully, false otherwise.
   */
  async bulkCreateRestaurantAwards(restaurantAwardsDetails: RestaurantAward[]) {
    /**
     * Bulk inserts these documents with a database generated ObjectID instead of a custom one
     * because a custom one is not needed since we don't need to keep track of these articles as
     * we don't query them by ID, so the ID generation can be left up to the database itself.
     */
    const bulkCreateDocumentOperations = restaurantAwardsDetails.map(
      (restaurantAwardsDetail) => {
        return this.database.createNewDocumentAsBulkWriteOperation(
          restaurantAwardsDetail
        );
      }
    );

    return await this.database.bulkWrite(
      FonciiDBCollections.RestaurantAwards,
      bulkCreateDocumentOperations,
      true
    );
  }

  // Publication To Restaurant Association Logic
  /**
   * Finds the restaurant associated with the given article publication, associates 
   * it with the publication and updates the publication's data in the database. The article
   * publication must not have an existing restaurant id already associated with it or else
   * this method will return false, to by-pass this rule pass true for the `forceUpdate` flag.
   * 
   * @async 
   * @param articlePublication
   * @param forceUpdate - Set to true to update associated restaurant data for the publication
   * even when a restaurant id is already defined
   * @param highConfidenceOnly - Set to true to only search for restaurants when address / city data is available,
   * and false to fail early if this data isn't available, true by default.
   * 
   * @returns -> True if the association was successful, false otherwise. Note that this method
   * will return false if the restaurant associated with the given article publication is not
   * found in our database, and or if the article publication already has an associated restaurant id but
   * the forceUpdate flag is not set to true.
   */
  async associateArticlePublicationWithRestaurant({
    articlePublication,
    forceUpdate = false,
    highConfidenceOnly = true
  }: {
    articlePublication: ArticlePublication,
    forceUpdate?: boolean,
    highConfidenceOnly?: boolean
  }) {
    // Precondition failure
    // Don't try to associate a restaurant with an already existing ID 
    if (articlePublication.restaurantID && !forceUpdate) return false;

    // Parsing
    // UID
    const id = articlePublication.id;

    // Search for associated restaurant data
    const restaurantID = await this.findRestaurantAssociatedWithArticlePublication({
      articlePublication,
      highConfidenceOnly
    });

    if (restaurantID) {
      // Associated restaurant found
      return await this.updateArticlePublication({
        id,
        updatedFields: { restaurantID }
      });
    }
    else {
      // Restaurant not found, failed to associate publication with restaurant.
      return false;
    }
  }

  // Helper Methods
  /**
   * Finds the restaurant ID associated with the given article publication. If the restaurant is not
   * found, undefined is returned. 
   * 
   * @async
   * @param articlePublication 
   * @param highConfidenceOnly - Set to true to only search for restaurants when address / city data is available,
   * and false to fail early if this data isn't available, true by default.
   * 
   * @returns -> The restaurant ID of the restaurant associated with the given article (if it exists in our
   * database), undefined otherwise.
   */
  async findRestaurantAssociatedWithArticlePublication({
    articlePublication,
    highConfidenceOnly = true
  }: {
    articlePublication: ArticlePublication,
    highConfidenceOnly?: boolean
  }) {
    // Confidence checker | An address field is required, a city is often not enough
    if (highConfidenceOnly && (!articlePublication.address)) return undefined;

    // Parsing
    // Address components
    const address = articlePublication.address,
      city = articlePublication.city,
      fullAddress = (`${address ?? ''}${city != undefined ? `,${city}` : ''} `).trim(),
      venueName = articlePublication.venueName;

    // Find associated restaurant by address
    const searchQuery = `${venueName} ${fullAddress}`.trim(),
      restaurantAutoCompleteFTSResult = await this.restaurantService()
        .autocompleteFullTextSearch({
          searchQuery,
          resultsPerPage: 1
        });

    const restaurantCandidate = restaurantAutoCompleteFTSResult[0],
      restaurantID: string | undefined = restaurantCandidate?.id;

    return restaurantID;
  }

  // Pipelines
  /**
   * Fetches all isolated article publications (article publications without associated restaurant IDs)
   * and tries to associate each one with some restaurant ID if the restaurant exists in our database. 
   * 
   * Note: Results per page limited to 1000 per query.
   * 
   * @async
   * @param paginationPageIndex -> Used by the function for pagination, don't provide this parameter
   * as an argument.
   * @param singlePass -> True if this function should run only once and not perform recursive pagination, 
   * fale otherwise, true by default.
   * @param highConfidenceOnly - Set to true to only search for restaurants when address / city data is available,
   * and false to fail early if this data isn't available, true by default.
   */
  async associateIsolatedArticlesWithRestaurants({
    paginationPageIndex = 0,
    singlePass = true,
    highConfidenceOnly = true
  }: {
    paginationPageIndex?: number,
    singlePass?: boolean,
    highConfidenceOnly?: boolean
  }): Promise<void> {
    // Constants
    // This amount should be good, it shouldn't pose too much 
    // strain on the server and DB.
    const RESULTS_PER_PAGE = 1000;

    // Dynamic query builder
    let properties: ArticlePublicationPropertyOptions = {
      restaurantID: { $exists: false }
    }

    if (highConfidenceOnly) {
      // High confidence, an address is mandatory to ensure high accuracy
      properties = {
        ...properties,
        address: { $exists: true }
      }
    }
    else {
      // Low confidence, a city is the minimum requirement if no address is available
      // Not very accurate, an address field is necessary most of the time.
      properties = {
        ...properties,
        $or: [
          { address: { $exists: true } },
          { city: { $exists: true } }
        ]
      } as any
    }

    const isolatedArticlePublicationsResult = (
      await this.findArticlesWith({
        properties,
        resultsPerPage: RESULTS_PER_PAGE,
        paginationPageIndex
      })
    );

    // Parsing
    const isolatedArticlePublications = isolatedArticlePublicationsResult,
      documentsRemaining = isolatedArticlePublications.length > 0;

    // Processing
    await Promise.all(
      isolatedArticlePublications
        .map(async (articlePublication) => {
          await this.associateArticlePublicationWithRestaurant({
            articlePublication,
            highConfidenceOnly
          });
        })
    );

    // Paginate forward if more documents remain, return otherwise
    if (!documentsRemaining || singlePass) {
      return;
    }
    else {
      return await this.associateIsolatedArticlesWithRestaurants({
        paginationPageIndex: paginationPageIndex + 1,
        singlePass
      });
    }
  }
}
