// Dependencies 
// Types
import { AggregationSortOrders, FonciiDBCollections, FullTextSearchIndexes } from "../../../../types/namespaces/database-api";
import { BSON } from "mongodb";
import { Double } from "bson";

// Models
import RestaurantModel from "../../../../models/shared/restaurantModel";
import SavedRestaurantModel from "../../../../models/shared/savedRestaurantModel";

// Services
import { DatabaseServiceAdapter } from "../../database/databaseService";
import UserService from "../users/userService";
import FonciiMapsPostService from "../../foncii-maps/user-posts/fmPostService";
import RestaurantAggregator from "./restaurantAggregator";
import OpenAIAPIService from "../../third-party-api/machine-learning-ai/openAIAPIService";

// Utilities
import { currentDateAsISOString } from "../../../../foncii-toolkit/utilities/convenienceUtilities";
import { clampNumber, isArrayEmpty } from "../../../../foncii-toolkit/math/commonMath";
import cities from "all-the-cities"
var addressit = require('addressit');

// Logging
import logger from "../../../../foncii-toolkit/debugging/debugLogger";

// Local Types
type RestaurantSortOptions = { [K in keyof Partial<Restaurant>]: AggregationSortOrders };
type SavedRestaurantSortOptions = { [K in keyof Partial<SavedRestaurant>]: AggregationSortOrders };
export type RestaurantPropertyOptions = { [K in keyof Partial<Restaurant>]: any };

/**
 * Service class for querying and mutating Foncii Restaurant
 * data.
 */
export default class RestaurantService {
    // Services
    database = new DatabaseServiceAdapter();
    fmPostService = () => new FonciiMapsPostService();
    fmUserService = () => new UserService();
    restaurantAggregator = () => new RestaurantAggregator();
    openAIAPIService = () => new OpenAIAPIService();

    // Full-text search 
    // Autocomplete
    // See here: https://cloud.mongodb.com/v2/6500cad1a2317e0f32b576a6#/clusters/atlasSearch/Foncii-D-Cluster?collectionName=Restaurants&database=FonciiFediverseDB&indexName=Foncii-Restaurants&view=VisualEdit
    // Resources about ngram and edgegram: https://stackoverflow.com/questions/31398617/how-edge-ngram-token-filter-differs-from-ngram-token-filter
    static AutocompleteFullTextSearchMappedFields = {
        // Document Child Fields
        addressProperties_neighborhood: "addressProperties.neighborhood",
        addressProperties_city: "addressProperties.city",
        addressProperties_countryCode: "addressProperties.countryCode",
        addressProperties_formattedAddress: "addressProperties.formattedAddress",
        addressProperties_stateCode: "addressProperties.stateCode",
        addressProperties_streetAddress: "addressProperties.streetAddress",
        addressProperties_zipCode: "addressProperties.zipCode",
        categories: "categories",
        description: "description",
        googleID: "googleID",
        name: "name",
        phoneNumber: "phoneNumber",
        website: "website",
        yelpID: "yelpID",
        socialMediaHandleInstagram: "socialMediaHandles.instagram"
    }

    // Modular Database Aggregation Pipeline Stages
    /**
     * Excludes saved restaurants without restaurant data
     */
    JoinSavedRestaurantsWithRestaurantsPipelineStagesExclusive = [
        {
            '$lookup': {
                'from': FonciiDBCollections.Restaurants,
                'localField': 'fonciiRestaurantID',
                'foreignField': 'id',
                'as': 'restaurant'
            }
        }, {
            '$unwind': {
                'path': '$restaurant',
                'preserveNullAndEmptyArrays': false
            }
        }
    ];

    // Remove large and or unnecessary fields to reduce the time it takes to fetch documents from the DB
    private RETRIEVAL_OPTIMIZATION_PROJECTION_STAGE: { [K in keyof Partial<RestaurantPropertyOptions>]: 1 | 0 } = {
        text_embedding: 0,
        collective_embedding: 0
    }

    // Limits
    MAX_EXPLORE_SEARCH_RESULTS = 50; // Maximum amount of documents to return ~ 100 because of memory constraints the time it takes for the client to download the data
    MAX_SEARCH_RESULTS_PAGE_RESULTS = 5; // Max for the SRP is 5
    MAX_FULL_TEXT_SEARCH_ID_RESULTS: number = 1000; // ~ Check defined max in database service ~ 2000,  Maximum number of post IDs to return, Important: IDs only returned so that fetching is quick

    // Modular Database Aggregation Pipeline Stages
    /**
     * Geospatially search all restaurants using the 2D Sphere Index
     * for locations that fall within the specified search area.
     * 
     * Documentation: https://www.mongodb.com/docs/manual/reference/operator/aggregation/geoNear/
     * 
     * @param coordinates -> The center point of the geospatial search area
     * @param radius -> The radius of the search area in meters [m], aka the maximum distance that a document
     * can be from the specified coordinates.
     * 
     * @returns -> Configured geospatial pipeline stage(s) to use in any modular aggregation pipeline.
     */
    static geospatialSearchPipelineStage = (coordinates: CoordinatePoint, radius: number): BSON.Document[] => {
        return [
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: [coordinates.lng, coordinates.lat] }, // [lng, lat] in this specific order only
                    distanceField: "distance", // Required field, just creates a field named distance that contains the computed distance in meters [m] 
                    maxDistance: radius, // Maximum distance in meters [m], a minimum distance can also be specified but we don't plan on using that.
                    spherical: true // Uses spherical geometry by default if true.
                }
            }
        ];
    }

    /**
     * Uses ANN to determine similar vector embeddings
     * Documentation: https://www.mongodb.com/library/vector-search/how-to-perform-semantic-search?lb-mode=overlay
     * 
     * @async
     * @param queryVector -> Embedding array to search the index for similar results
     * @param numCandidates -> (K) Number of neighbors to compare with, must be >= the limit, add more neighbors above limit to increase accuracy
     * @param limit -> Maximum number of results to return
     * 
     * @returns -> Vector search aggregation pipeline stage
     */
    static restaurantToRestaurantVectorSearchPipelineStage = ({
        queryVector,
        numCandidates = 1000,
        limit = 10,
        candidateIDsToExclude = []
    }: {
        queryVector: Double[],
        numCandidates?: number,
        limit?: number,
        candidateIDsToExclude?: string[]
    }): BSON.Document[] => {
        return [
            {
                $vectorSearch: {
                    index: 'Restaurant-KNN-Vector-Search',
                    path: 'collective_embedding',
                    queryVector,
                    numCandidates,
                    limit,
                    filter: {
                        id: { $nin: candidateIDsToExclude ?? [] }
                    }
                }
            },
            { /** The similarity score */
                $set: {
                    similarityScore: {
                        $meta: 'vectorSearchScore'
                    }
                }
            }
        ];
    }

    /**
     * Uses an encoded text query vector embedding to search for restaurants with similar embedding properties
     * in order to allow for powerful semantic search.
     * 
     * References:
     * https://platform.openai.com/docs/guides/embeddings/what-are-embeddings
     * https://www.mongodb.com/library/vector-search/how-to-perform-semantic-search?lb-mode=overlay
     * 
     * @async
     * @param queryVector -> Text embedding array to use to search the index for similar embeddings
     * @param numCandidates
     * @param limit -> Maximum number of results to return
     * 
     * @returns -> Vector search aggregation pipeline stage
     */
    static textToRestaurantVectorSearchPipelineStage = ({
        queryVector,
        numCandidates = 1000,
        limit = 5
    }: {
        queryVector: Double[],
        numCandidates?: number,
        limit?: number,
    }): BSON.Document[] => {
        return [
            {
                $vectorSearch: {
                    index: 'Restaurant-Embedding-Search',
                    path: 'text_embedding',
                    queryVector,
                    numCandidates,
                    limit
                }
            },
            { /** The similarity score */
                $set: {
                    similarityScore: {
                        $meta: 'vectorSearchScore'
                    }
                }
            }
        ];
    }

    // Reusable / Modular Methods
    // Mutations
    /**
     * Updates the Foncii restaurant document referenced by the given Foncii Restaurant ID.
     * 
     * Note: Please recompute embeddings before passing the restaurant data model to this function to be 
     * updated in the database.
     * 
     * Note: Only use the supported fields provided by the restaurant data model
     * to avoid adding isolated/unknown data to a restaurant document. Any literal undefined or null 
     * fields will be marked as unset and consequently removed from the document, if this isn't the
     * desired behavior, use the replace method to update the entire document at once and preserve 
     * any fields by trimming out these values instead of removing the fields completely.
     * 
     * @async
     * @param fonciiRestaurantID -> The id of the Foncii restaurant document to update
     * @param updatedFields -> Updated Foncii restaurant data to merge with the existing data
     * 
     * @returns -> True if the update was successful, false otherwise. 
     */
    async updateRestaurant(
        fonciiRestaurantID: string,
        updatedFields: RestaurantPropertyOptions
    ) {
        const documentID = fonciiRestaurantID,
            updatedProperties = {
                ...updatedFields,
                lastUpdated: currentDateAsISOString(), // Will overwrite any property named 'lastUpdated' below as intended if included
            }

        return await this.database
            .updateFieldsInDocumentWithID(
                FonciiDBCollections.Restaurants,
                documentID,
                updatedProperties
            );
    }

    /**
     * Updates multiple Foncii restaurant documents that match the given property filter criteria
     * with the updated field values.
     * 
     * Note: Please recompute embeddings before passing restaurant data models to this function to be 
     * updated in the database.
     * 
     * @param properties -> Properties to filter the target documents by
     * @param updatedFields -> Updated field values to apply to all matchin documents.
     * 
     * @returns  -> True if the updates were successful, false otherwise.
     */
    async updateRestaurants(
        properties: RestaurantPropertyOptions,
        updatedFields: RestaurantPropertyOptions
    ) {
        const updatedProperties = {
            ...updatedFields,
            lastUpdated: currentDateAsISOString(), // Will overwrite any property named 'lastUpdated' below as intended if included
        }

        return await this.database
            .updateFieldsInDocumentsWithProperties(
                FonciiDBCollections.Restaurants,
                properties,
                updatedProperties);
    }

    /**
     * Bulk updates the Foncii restaurant documents referenced by the given array of Foncii restaurant data.
     * This method also updates the lastUpdated property of each restaurant, so this doesn't have to be
     * handled outside of this method. 
     * 
     * Note: Please recompute embeddings before passing restaurant data models to this function to be 
     * bulk updated in the database.
     * 
     * Note: Only use the supported fields provided by the restaurant data model
     * to avoid adding isolated/unknown data to a restaurant document. Any literal undefined or null 
     * fields will be marked as unset and consequently removed from the document, if this isn't the
     * desired behavior, use the replace method to update the entire document at once and preserve 
     * any fields by trimming out these values instead of removing the fields completely. 
     * 
     * Important: Backwards compatibility is key, so we don't replace the entire document, only the fields
     * explicitly provided in the passed data so as to prevent the deletion of important fields, hence the use
     * of `updateFields` aka `Update One` instead of `Replace One`.
     * 
     * @async
     * @param fonciiRestaurants -> Array of updated Foncii restaurant data with the included UID to identify the target document with
     * 
     * @returns -> True if the bulk update was successful, false otherwise. 
     */
    async bulkUpdateRestaurants(
        fonciiRestaurants: Restaurant[]
    ) {
        const bulkUpdateFieldsOperations = fonciiRestaurants.map((restaurant) => {
            const documentID = restaurant.id,
                updatedRestaurantProperties = {
                    ...restaurant,
                    lastUpdated: currentDateAsISOString(), // Will overwrite any property named 'lastUpdated' below as intended if included
                }

            return this.database.updateFieldsInDocumentAsBulkWriteOperation(
                { _id: documentID },
                updatedRestaurantProperties
            );
        });

        return await this.database.bulkWrite(
            FonciiDBCollections.Restaurants,
            [...bulkUpdateFieldsOperations]);
    }

    // Queries
    /**
     * Performs autocomplete full-text search on all fields
     * mapped to the specified collection's search index.
     * 
     * @async
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
        projectionProperties
    }: {
        searchQuery: string,
        properties?: RestaurantPropertyOptions,
        pipelineStages?: BSON.Document[],
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: RestaurantSortOptions,
        projectionProperties?: { [K in keyof Partial<RestaurantPropertyOptions>]: 1 | 0 }
    }) {
        // Fields to perform autocomplete search on
        const autocompleteMappedFields = Object.values(RestaurantService.AutocompleteFullTextSearchMappedFields);

        return await this.database
            .autocompleteTextSearchAggregationPipeline<Restaurant>({
                collectionName: FonciiDBCollections.Restaurants,
                indexName: FullTextSearchIndexes.Restaurants,
                pipelineStages,
                searchQuery,
                autocompleteMappedFields,
                properties,
                resultsPerPage,
                paginationPageIndex,
                sortOptions,
                projectionStage: {
                    $project: {
                        ...projectionProperties,
                        ...this.RETRIEVAL_OPTIMIZATION_PROJECTION_STAGE
                    }
                }
            });
    }

    /**
     * Searches the specified geospatial search area for restaurants matching the given
     * search critera. Paginatable and optionally sortable.
     * 
     * @async
     * @param coordinates -> The center point of the geospatial search area
     * @param radius -> The radius of the search area in meters [m], aka the maximum distance that a document
     * can be from the specified coordinates.
     * @param properties -> Properties to filter the target documents by
     * @param pipelineStages -> Optional pipeline stages to be added to the search pipeline. 
     * @param resultsPerPage -> The maximum number of restaurants to return per page (0 = no limit), default limit is 100 just to be safe, change this as needed.
     * @param paginationPageIndex -> The current page index (0 = first page of results)
     * @param sortOptions -> Optional sort options to sort the results by.
     * 
     * @returns -> Aggregated collection documents
     */
    async geospatialSearchForRestaurants({
        coordinatePoint,
        radius,
        properties,
        pipelineStages = [],
        resultsPerPage = 100,
        paginationPageIndex,
        sortOptions,
        projectionProperties
    }: {
        coordinatePoint: CoordinatePoint
        radius: number,
        properties?: RestaurantPropertyOptions,
        pipelineStages?: BSON.Document[],
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: RestaurantSortOptions,
        projectionProperties?: { [K in keyof Partial<RestaurantPropertyOptions>]: 1 | 0 }
    }) {
        // Geospatial search stage + custom stages
        const updatedPipelineStages: BSON.Document[] = [
            ...RestaurantService.geospatialSearchPipelineStage(coordinatePoint, radius),
            ...pipelineStages
        ];

        return await this.database
            .paginatableAggregationPipeline<Restaurant>({
                collectionName: FonciiDBCollections.Restaurants,
                pipelineStages: updatedPipelineStages,
                properties,
                resultsPerPage,
                paginationPageIndex,
                sortOptions,
                includeInputStagesFirst: true,
                projectionStage: {
                    $project: {
                        ...projectionProperties,
                        ...this.RETRIEVAL_OPTIMIZATION_PROJECTION_STAGE
                    }
                }
            });
    }

    /**
     * Helper to find a restaurant id by name and location. It first uses our stored
     * restaurants and proceeds the using google geocoding.
     * 
     * @async
     * @param findOrAggregateRestaurantInput Paramaters to query the restaurant by
     * 
     * @returns the found restaurant ID or null if none was found
     */
    async findOrAggregateRestaurant(
        findOrAggregateRestaurantInput: {
            name: string,
            locationDetails: string
        }): Promise<Restaurant | null> {
        // First try to find the restaurant locally. Replace commas to avoid parsing errors on zip
        const parserAddress = findOrAggregateRestaurantInput.locationDetails.replaceAll(",", " "),
            parsedLocation = addressit(parserAddress);

        let country: string | null = null,
            city: string | null = null;

        // Data massaging specific to google geocoding to avoid db misses
        if (parsedLocation.country === "USA" || parsedLocation.state) {
            country = "US";
        }

        // In the case of no zip code ensure the city in region is valid in country
        if (!country || !parsedLocation.postalcode) {
            for (let region of parsedLocation.regions) {
                const matchingCities = cities.filter(city => city.name === region && (!country || city.country === country))
                // Without a zipcode we'll opt to only use unique cities in countries
                if (matchingCities.length === 1) {
                    country = matchingCities[0].country
                    city = region
                    break
                }
            }
        }

        let matchingRestaurant = null;
        if (country && (parsedLocation.postalcode || city)) {
            const addressAttributes = {
                ...country && { "addressProperties.countryCode": country },
                ...city && { "addressProperties.city": city },
                ...parsedLocation.postalcode && { "addressProperties.zipCode": parsedLocation.postalcode }
            }

            // Normal-cased restaurant name search
            matchingRestaurant = await this.findRestaurantWith({
                name: findOrAggregateRestaurantInput.name,
                ...addressAttributes
            } as any) || // Upper-cased restaurant name search because some restaurants like to uppercase their name for some reason, simpler than other approaches
                await this.findRestaurantWith({
                    name: findOrAggregateRestaurantInput.name.toUpperCase(),
                    ...addressAttributes
                } as any);
        }

        // Step 1.2: Restaurant does not exist in our database, find it through Google Place search
        let matchingPlaceID = undefined;

        if (!matchingRestaurant) {
            matchingPlaceID = await this.restaurantAggregator()
                .googlePlacesService
                .getPlaceIDFromTextAndLocation(
                    findOrAggregateRestaurantInput.name,
                    findOrAggregateRestaurantInput.locationDetails
                );
        }

        // Step 1.3: Attempt to find the restaurant again using the found Google Place ID
        if (matchingPlaceID && !matchingRestaurant) {
            logger.warn(`[connectReservationIntegration] Restaurant location information either does not exist in the Foncii database or it is too fuzzy, 
            attempting to locate restaurant via Google Place search`);

            console.table(findOrAggregateRestaurantInput);

            matchingRestaurant = await this.findRestaurantWith({ googleID: matchingPlaceID });
        }

        // Step 1.4: Restaurant still doesn't exist, aggregate the new restaurant
        if (!matchingRestaurant && matchingPlaceID) {
            logger.info('[connectReservationIntegration] Aggregating novel restaurant data to connect to reservation integration')

            matchingRestaurant = (await this.restaurantAggregator().aggregateRestaurant(matchingPlaceID)) ?? null;
        }

        return matchingRestaurant
    }

    /**
     * Searches the restaurants collection for a single restaurant with properties 
     * (google ID, yelp ID, name etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * 
     * @returns -> Null if the restaurant can't be found, Foncii restaurant data model otherwise.
     */
    async findRestaurantWith(
        properties: RestaurantPropertyOptions
    ) {
        return await this.database
            .findDocumentWithProperties<Restaurant>(
                FonciiDBCollections.Restaurants,
                properties);
    }

    /**
     * Searches the Foncii restaurants collection for restaurants with properties 
     * (google ID, yelp ID, name etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * @param resultsPerPage -> The maximum number of restaurants to return per page (0 = no limit)
     * @param paginationPageIndex -> The current page index (0 = first page of results)
     * @param sortOptions -> Optional sort options to sort the results by.
     * 
     * @returns -> Aggregated collection documents
     */
    async findRestaurantsWith({
        properties = {},
        resultsPerPage = 100,
        paginationPageIndex = 0,
        sortOptions = {}
    }: {
        properties?: RestaurantPropertyOptions,
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: RestaurantSortOptions
    }) {
        return await this.database.findDocumentsWithProperties<Restaurant>({
            collectionName: FonciiDBCollections.Restaurants,
            properties,
            resultsPerPage,
            paginationPageIndex,
            sortOptions,
            projectionOptions: {
                ...this.RETRIEVAL_OPTIMIZATION_PROJECTION_STAGE
            }
        });
    }

    /**
     * Determines if the Foncii restaurants collection includes a restaurant with properties 
     * (google ID, yelp ID, name etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * 
     * @returns -> True if a Foncii restaurant exists with the given properties, false otherwise.
     */
    async doesRestaurantExistWith(
        properties: RestaurantPropertyOptions
    ) {
        return await this.database
            .doesDocumentExistWithProperties<Restaurant>(
                FonciiDBCollections.Restaurants,
                properties
            );
    }

    /**
     * Determines the total amount of restaurants in the restaurants collection that 
     * match the given properties. 
     * 
     * @async
     * @param properties 
     * 
     * @returns -> An integer representing the total amount of restaurants in the restaurants
     * collection that match the given properties.
     */
    async countTotalRestaurantsWithProperties(
        properties: RestaurantPropertyOptions
    ) {
        return await this.database.countTotalDocumentsWithProperties(
            FonciiDBCollections.Restaurants,
            properties
        );
    }

    // Unique Methods
    // Queries
    /**
     * Finds restaurants similar to the one given. Customize
     * inputs such as min similarity score to fine tune the search.
     * 
     * @async
     * @param restaurant 
     * @param properties 
     * @param minSimilarity 
     * @param pipelineStages 
     * @param resultsPerPage 
     * @param paginationPageIndex 
     * @param sortOptions 
     * 
     * @returns -> Paginatable list of similar restaurants
     */
    async findRestaurantsSimilarTo({
        restaurant,
        properties,
        minSimilarity = 0.7,
        pipelineStages = [],
        resultsPerPage = 10,
        paginationPageIndex,
        sortOptions
    }: {
        restaurant: Restaurant,
        properties?: RestaurantPropertyOptions,
        minSimilarity?: number,
        pipelineStages?: BSON.Document[],
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: RestaurantSortOptions
    }) {
        // Embedding required
        if (!restaurant.collective_embedding) return [];

        // Parsing
        const queryVector = restaurant.collective_embedding.map((val) => new Double(val)),
            numCandidates = Math.max(1000, resultsPerPage); // Must be >= limit ~ resultsPerPage, obviously not going to return 1000+ documents

        // Vector search stage + custom stages
        const updatedPipelineStages: BSON.Document[] = [
            ...RestaurantService.restaurantToRestaurantVectorSearchPipelineStage({
                queryVector,
                limit: resultsPerPage,
                numCandidates,
                candidateIDsToExclude: [restaurant.id] // Exclude the restaurant itself from the similarity search
            }),
            // Filter out candidates that don't meet the minimum similarity score 
            // and also filter out the restaurant itself
            {
                $match: {
                    similarityScore: {
                        $gte: minSimilarity,
                    }
                }
            },
            ...pipelineStages
        ];

        return await this.database
            .paginatableAggregationPipeline<Restaurant>({
                collectionName: FonciiDBCollections.Restaurants,
                pipelineStages: updatedPipelineStages,
                properties,
                resultsPerPage,
                paginationPageIndex,
                sortOptions,
                includeInputStagesFirst: true
            });
    }

    /**
     * Finds restaurants with data that's semantically similar to the content of the text query
     * provided. Customize inputs such as min similarity score to fine tune the search.
     * 
     * @async
     * @param textQuery 
     * @param properties 
     * @param minSimilarity 
     * @param pipelineStages 
     * @param resultsPerPage 
     * @param paginationPageIndex 
     * @param sortOptions 
     * 
     * @returns -> Paginatable list of similar restaurants
     */
    async performSemanticSearchOnRestaurants({
        textQuery,
        properties,
        minSimilarity = 0.7,
        pipelineStages = [],
        resultsPerPage = 100,
        paginationPageIndex,
        sortOptions,
        projectionProperties
    }: {
        textQuery: string,
        properties?: RestaurantPropertyOptions,
        minSimilarity?: number,
        pipelineStages?: BSON.Document[],
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: RestaurantSortOptions,
        projectionProperties?: { [K in keyof Partial<RestaurantPropertyOptions>]: 1 | 0 }
    }) {
        // A valid text query is required
        if (!textQuery) return [];

        // Parsing
        const queryVector = await this.openAIAPIService().embedTextQuery(textQuery),
            numCandidates = Math.max(1000, resultsPerPage); // Must be >= limit ~ resultsPerPage, obviously not going to return 1000+ documents

        // Vector search stage + custom stages
        const updatedPipelineStages: BSON.Document[] = [
            ...RestaurantService.textToRestaurantVectorSearchPipelineStage({
                queryVector,
                limit: resultsPerPage,
                numCandidates
            }),
            // Filter out candidates that don't meet the minimum similarity score 
            // and also filter out the restaurant itself
            {
                $match: {
                    similarityScore: {
                        $gte: minSimilarity,
                    }
                }
            },
            ...pipelineStages
        ];

        return await this.database
            .paginatableAggregationPipeline<Restaurant>({
                collectionName: FonciiDBCollections.Restaurants,
                pipelineStages: updatedPipelineStages,
                properties,
                resultsPerPage,
                paginationPageIndex,
                sortOptions,
                includeInputStagesFirst: true,
                projectionStage: {
                    $project: {
                        ...projectionProperties,
                        ...this.RETRIEVAL_OPTIMIZATION_PROJECTION_STAGE
                    }
                }
            });
    }

    /**
     * Determines whether or not a Foncii restaurant exists with the given
     * Google ID.
     * 
     * @async
     * @param googleID 
     * 
     * @returns -> True if a Foncii restaurant exists with the given Google ID, false otherwise.
     */
    async doesRestaurantExistWithGoogleID(googleID: string) {
        return await this.doesRestaurantExistWith({ googleID });
    }

    /**
     * Determines whether or not a Foncii restaurant exists with the given
     * Yelp ID.
     * 
     * @async
     * @param yelpID 
     * 
     * @returns -> True if a Foncii restaurant exists with the given Yelp ID, false otherwise.
     */
    async doesRestaurantExistWithYelpID(yelpID: string) {
        return await this.doesRestaurantExistWith({ yelpID });
    }

    /**
     * Determines whether or not a Foncii restaurant exists with the given Foncii Restaurant ID
     * 
     * @async
     * @param id -> Generated Restaurant UUID string to find in the database.
     * 
     * @returns ->True if a Foncii restaurant exists with the given Foncii Restaurant ID, false otherwise.
     */
    async doesRestaurantExistWithID(id: string) {
        return await this.doesRestaurantExistWith({ id });
    }

    /**
     * Finds and returns the Foncii restaurant document corresponding to the 
     * given Foncii Restaurant ID in the database (if it exists). Returns the
     * full document's data, doesn't remove embedding fields via project stage.
     * 
     * @async
     * @param id -> Foncii Restaurant ID of the restaurant to fetch from the database.
     * 
     * @returns -> Null if the restaurant can't be found, Foncii Restaurant data model otherwise.
     */
    async findRestaurantWithID(id: string) {
        return await this.database
            .findDocumentWithID<Restaurant>(FonciiDBCollections.Restaurants, id);
    }

    /**
     * Finds and returns the Foncii restaurant documents corresponding to the 
     * given Foncii Restaurant IDs in the database (if any exist).
     * 
     * @async
     * @param ids -> Foncii Restaurant IDs of the restaurants to fetch from the database.
     * 
     * @returns -> Empty array if none of the restaurants can be found, array of Foncii Restaurant data models otherwise.
     */
    async findRestaurantsWithIDs(ids: string[]) {
        return (await this.database.findDocumentsWithProperties<Restaurant>({
            collectionName: FonciiDBCollections.Restaurants,
            properties: { _id: { $in: ids } } as any,
            resultsPerPage: 0
        }));
    }

    /**
     * Finds and returns the Foncii restaurant document corresponding to the 
     * given Google ID in the database (if it exists).
     * 
     * @async
     * @param googleID -> Google ID of the restaurant to fetch from the database.
     * 
     * @returns -> Null if the restaurant can't be found, Foncii Restaurant data model otherwise.
     */
    async findRestaurantWithGoogleID(googleID: string) {
        return await this.findRestaurantWith({ googleID });
    }

    /**
     * Finds and returns the Foncii restaurant document corresponding to the 
     * given Yelp ID in the database (if it exists).
     * 
     * @async
     * @param yelpID -> Yelp ID of the restaurant to fetch from the database.
     * 
     * @returns -> Null if the restaurant can't be found, Foncii Restaurant data model otherwise.
     */
    async findRestaurantWithYelpID(yelpID: string) {
        return await this.findRestaurantWith({ yelpID });
    }

    /**
     * Finds and returns all restaurants from the database given the results per page,
     * pagination index and sort options provided.
     * 
     * Note: Restaurants are sorted by newest to oldest by default here. This is indexed behavior and 
     * shouldn't really be changed as there's really no reason to do so from a production point of view.
     * The same logic goes for any other methods that pull multiple restaurants at once.
     * 
     * @async
     * @param resultsLimit -> Default is 100, be careful not to fetch too many entities at once in order to not exceed the device's memory limit.
     * @param paginationPageIndex -> Default is 0
     * 
     * @returns -> Aggregated collection documents
     */
    async getAllRestaurants(
        resultsPerPage: number = 100,
        paginationPageIndex: number = 0
    ) {
        return await this.findRestaurantsWith({
            resultsPerPage,
            paginationPageIndex,
            sortOptions: { creationDate: AggregationSortOrders.descending }
        });
    }

    /**
     * @async
     * @param userID
     * @param fonciiRestaurantID
     * 
     * @returns -> True if the restaurant was saved by the user, false otherwise
     */
    async isRestaurantSavedByUser({
        userID,
        fonciiRestaurantID
    }: {
        userID: string,
        fonciiRestaurantID: string
    }) {
        return (await this.database.doesDocumentExistWithProperties(
            FonciiDBCollections.SavedRestaurants,
            { userID, fonciiRestaurantID }
        ));
    }

    /**
     * Fetches and denormalizes restaurants saved by the user with the given user ID.
     * Note: This method returns denormalized restaurant data, meaning a custom `restaurant` field in 
     * the returned document contains all of the restaurant data from the restaurant document with the 
     * given ID from the restaurants collection.
     * 
     * @async
     * @param userID
     * @param resultsPerPage
     * @param paginationPageIndex
     * 
     * @returns -> A paginatable list of restaurants saved by the user.
     */
    async getSavedRestaurantsFor({
        userID,
        resultsPerPage = 25,
        paginationPageIndex = 0,
    }: {
        userID: string,
        resultsPerPage?: number,
        paginationPageIndex?: number,
    }) {
        // Restaurant
        const pipelineStages = [
            ...this.JoinSavedRestaurantsWithRestaurantsPipelineStagesExclusive
        ]

        // Sort by newest to oldest saves
        const sortOptions: SavedRestaurantSortOptions = {
            creationDate: AggregationSortOrders.descending
        }

        const result = await this.database
            .paginatableAggregationPipeline<SavedRestaurant>({
                collectionName: FonciiDBCollections.SavedRestaurants,
                pipelineStages,
                properties: { userID },
                resultsPerPage,
                paginationPageIndex,
                sortOptions
            });

        return result;
    }

    /**
     * Determines the total amount of restaurants in the restaurants collection.
     * 
     * @async
     * 
     * @returns -> An integer representing the total amount of restaurants in the restaurants
     * collection.
     */
    async countTotalRestaurants(): Promise<number> {
        return await this.database.countTotalDocumentsInCollection(FonciiDBCollections.Restaurants);
    }

    /**
     * [Pending Deprecation]
     * 
     * Searches for restaurants using geospatial and full-text search by aggregating posts + restaurants + user
     * collections to find all possible restaurants that match the given search criteria.
     * 
     * @async
     * @param coordinates -> The center point of the geospatial search area
     * @param radius -> The radius of the search area in meters [m], aka the maximum distance that a document
     * can be from the specified coordinates.
     * @param searchQuery -> The search query to be used for full text search.
     * @param properties -> Facets to filter the search results by (cuisines, restaurant name, id etc.)
     * @param resultsPerPage -> 0 for no limit (Bad performance), default is 'MaxExploreSearchResults' for ease of use.
     * @param paginationPageIndex
     * @param sortOptions -> Optional sort parameter and key
     * 
     * @returns -> Aggregated collection documents 
     */
    async geospatialFullTextSearchForRestaurants({
        coordinatePoint,
        radius,
        searchQuery = "",
        properties,
        resultsPerPage = this.MAX_EXPLORE_SEARCH_RESULTS,
        paginationPageIndex = 0,
        sortOptions
    }: {
        coordinatePoint: CoordinatePoint
        radius: number
        searchQuery: string
        properties?: RestaurantPropertyOptions
        resultsPerPage?: number
        paginationPageIndex?: number
        sortOptions?: RestaurantSortOptions
    }) {
        // Full-text search restaurant ID arrays to concatenate
        let fullTextSearchRestaurantIDs: string[] = [],
            fullTextSearchPostRestaurantIDs: string[] = [],
            fullTextSearchPostRestaurantIDsByUserID: string[] = [];

        // Trigger full-text search when the search query is populated
        if (searchQuery) {
            // Optimizations
            // Only return the custom id field of each document to reduce the time it takes to download large amounts of documents.
            const returnIDOnlyProjection: { [K in keyof Partial<RestaurantPropertyOptions>]: 1 | 0 } = { id: 1 },
                returnIDOnlyProjectionStage: { $project: { [K in keyof Partial<RestaurantPropertyOptions>]: 1 | 0 } } = {
                    $project: returnIDOnlyProjection
                };

            const fullTextSearchArgs = {
                searchQuery,
                projectionStage: returnIDOnlyProjectionStage,
                resultsPerPage: this.MAX_FULL_TEXT_SEARCH_ID_RESULTS
            };

            const promises = Promise.all([
                await this.autocompleteFullTextSearch({ ...fullTextSearchArgs, projectionProperties: returnIDOnlyProjection }),
                await this.fmUserService().autocompleteFullTextSearch(fullTextSearchArgs),
                await this.fmPostService().autocompleteFullTextSearch(fullTextSearchArgs)
            ]);

            const [restaurantAutocompleteResults, userAutocompleteResults, postAutocompleteResults] = await promises,
                fullTextSearchUserIDs = userAutocompleteResults.map((user) => user.id);

            // Fetch and parse posts associated with the given user ids
            const postsByUserID = isArrayEmpty(fullTextSearchUserIDs) ? [] : (await this.fmPostService().findPostsWith({ properties: { userID: { $in: fullTextSearchUserIDs } } }));

            // Parse restaurant IDs to accumulate
            fullTextSearchRestaurantIDs = restaurantAutocompleteResults.map((restaurant) => restaurant.id).filter(Boolean) as string[];
            fullTextSearchPostRestaurantIDs = postAutocompleteResults.map((post) => post.fonciiRestaurantID).filter(Boolean) as string[];
            fullTextSearchPostRestaurantIDsByUserID = postsByUserID.map((post) => post.fonciiRestaurantID).filter(Boolean) as string[];
        }

        // Concatenate all restaurant ids (keyed to id since this is the restaurant collection we're searching now geospatially) to be used to filter the 
        // geospatial aggregation pipeline. Note: Don't perform $in if the array is empty, this will force all documents to match to [] which will return no documents.
        const concatenatedRestaurantIDs = [...fullTextSearchRestaurantIDs, ...fullTextSearchPostRestaurantIDs, ...fullTextSearchPostRestaurantIDsByUserID],
            geospatialSearchProperties = isArrayEmpty(concatenatedRestaurantIDs) ? undefined : { id: { $in: concatenatedRestaurantIDs } };

        // Resolved Geospatial search aggregation pipeline on the restaurant collection
        const geospatialRestaurants = (await this.geospatialSearchForRestaurants({ coordinatePoint, radius, properties: geospatialSearchProperties })),
            geospatialRestaurantIDs = geospatialRestaurants.map(restaurant => restaurant.id);

        // Include found restaurants in the search filter to find posts matching the found restaurant IDs
        const updatedSearchFilter: RestaurantPropertyOptions = {
            ...properties,
            id: { $in: geospatialRestaurantIDs }
        };

        return await this.database
            .paginatableAggregationPipeline<Restaurant>({
                collectionName: FonciiDBCollections.Restaurants,
                properties: updatedSearchFilter,
                resultsPerPage: clampNumber(resultsPerPage, 0, this.MAX_EXPLORE_SEARCH_RESULTS),
                paginationPageIndex,
                sortOptions
            });
    }

    /**
     * Searches for restaurants using geospatial or semantic search by aggregating the restaurants
     * collection to find all possible restaurants that match the given search criteria.
     * 
     * @async
     * @param coordinates -> The center point of the geospatial search area
     * @param radius -> The radius of the search area in meters [m], aka the maximum distance that a document
     * can be from the specified coordinates.
     * @param searchQuery -> The search query to be used for semantic search.
     * @param properties -> Facets to filter the search results by (cuisines, restaurant name, id etc.)
     * @param resultsPerPage -> 0 for no limit (Bad performance), default is 'MaxExploreSearchResults' for ease of use.
     * @param paginationPageIndex
     * @param sortOptions -> Optional sort parameter and key
     * 
     * @returns -> Aggregated collection documents
     */
    async geospatialSemanticSearchForRestaurants({
        coordinatePoint,
        radius,
        searchQuery = "",
        properties,
        resultsPerPage = this.MAX_EXPLORE_SEARCH_RESULTS,
        paginationPageIndex = 0,
        sortOptions
    }: {
        coordinatePoint: CoordinatePoint
        radius: number
        searchQuery: string
        properties?: RestaurantPropertyOptions
        resultsPerPage?: number
        paginationPageIndex?: number
        sortOptions?: RestaurantSortOptions
    }) {
        // Semantic search when search query provided (SRP)
        if (searchQuery) {
            return await this.performSemanticSearchOnRestaurants({
                textQuery: searchQuery,
                properties,
                resultsPerPage: this.MAX_SEARCH_RESULTS_PAGE_RESULTS,
            });
        }

        // Geospatial search when no search query provided (Explore)
        return await this.geospatialSearchForRestaurants({
            coordinatePoint,
            radius,
            paginationPageIndex,
            resultsPerPage: clampNumber(resultsPerPage, 0, this.MAX_EXPLORE_SEARCH_RESULTS),
            sortOptions
        });
    }

    // Mutations
    /**
     * Creates a new restaurant document in the database using the provided
     * restaurant data (if the restaurant with the provided information does 
     * not already exist).
     * 
     * @async
     * @param googleID -> Mandatory since Google is the data anchor for our restaurant aggregation pipeline.
     * @param name
     * @param coordinates 
     * @param addressProperties 
     * @param googleProperties
     * @param heroImageURL -> Optional hero image, but since this is a very important field we want to be optimistic about its optionality.
     * @param props -> Other optional properties of the restaurant to also pass to the constructor. 
     * 
     * @returns -> The newly created Foncii restaurant data model if the 
     * restaurant was created and inserted into the database successfully, null otherwise.
     */
    async createRestaurant(props: Partial<Restaurant> & {
        googleID: string,
        name: string,
        coordinates: CoordinatePoint,
        addressProperties: AddressProperties,
        googleProperties: GoogleProperties,
        heroImageURL?: string | undefined
    }) {
        const newRestaurant = new RestaurantModel(props),
            documentID = newRestaurant.id;

        // Precondition failure
        if (newRestaurant == undefined) return null;

        // Operation success flag
        let didSucceed = false;

        // Validate that the restaurant is unique before creating a new record for it in the DB.
        if (await this.doesRestaurantExistWithGoogleID(props.googleID)) {
            logger.warn(`A unique restaurant with the googleID ${props.googleID} already exists and cannot be created again.`);
            return null;
        }
        else if (newRestaurant.yelpID && await this.doesRestaurantExistWithYelpID(newRestaurant.yelpID)) {
            logger.warn(`A unique restaurant with the yelpID ${newRestaurant.yelpID} already exists and cannot be created again.`);
            return null;
        }

        didSucceed = await this.database.createNewDocumentWithID(
            FonciiDBCollections.Restaurants,
            documentID,
            newRestaurant.toObject()
        );

        return didSucceed ? newRestaurant : null;
    }

    /**
     * Creates multiple unique restaurant documents in the database using the provided
     * array of unique restaurant data.
     * 
     * @async
     * @param documents 
     * 
     * @returns -> True if the restaurants were created successfully, false otherwise.
     */
    async createRestaurants(documents: Restaurant[]) {
        if (documents.length == 0) return false;

        const documentToIDMappings: { [documentID: string]: Restaurant } = {};

        documents.map((document) => {
            documentToIDMappings[document.id] = document;
        });

        return await this.database
            .batchCreateDocumentsWithIDs(
                FonciiDBCollections.Restaurants,
                documentToIDMappings
            );
    }

    /**
     * @async
     * @param userID
     * @param fonciiRestaurantID -> ID of the foncii restaurant to add to the user's saved restaurants
     * @param postID -> Optional post ID used when a user saves the restaurant via a user post
     * 
     * @returns -> True if the restaurant was saved successfully, false otherwise
     */
    async saveRestaurant({
        userID,
        fonciiRestaurantID,
        postID
    }: {
        userID: string,
        fonciiRestaurantID: string,
        postID?: string
    }) {
        const savedRestaurant = new SavedRestaurantModel({
            userID,
            fonciiRestaurantID,
            postID
        });

        return await this.database
            .createNewDocumentWithID(
                FonciiDBCollections.SavedRestaurants,
                savedRestaurant.id,
                savedRestaurant.toObject()
            );
    }

    /**
     * @async
     * @param userID
     * @param fonciiRestaurantID -> ID of the foncii restaurant to remove from the user's saved restaurants
     * 
     * @returns -> True if the restaurant was unsaved successfully, false otherwise
     */
    async unsaveRestaurant({
        userID,
        fonciiRestaurantID
    }: {
        userID: string,
        fonciiRestaurantID: string
    }) {
        return await this.database
            .deleteDocumentWithProperties(FonciiDBCollections.SavedRestaurants, {
                userID,
                fonciiRestaurantID
            } as SavedRestaurant);
    }

    /**
     * Removes all saves associated with the given user ID (if any), this is used in the case of user
     * deletions where all of their data must be deleted from our various storage containers amd services.
     * 
     * @async
     * @param userID 
     * 
     * @returns -> True if all saves associated with the target user were deleted successfully, false otherwise.
     */
    async deleteAllSavedRestaurantsForUser(userID: string) {
        return await this.database.deleteDocumentsWithProperties(FonciiDBCollections.SavedRestaurants, { userID });
    }

    /**
     * Deletes the restaurant from the database. If any associated data or documents exist
     * resolve their dependencies on this restaurant before deleting it within this method. For instance
     * for favorites, delete all the favorites that reference this restaurant; for 
     * Foncii Maps user posts mark those posts as hidden and remove the association with this
     * restaurant etc.
     * 
     * Note: Deletion of restaurants isn't supported at this time, so this method doesn't implement 
     * all of its requirements as of right now. [So dont't use it!]
     * 
     * @async
     * @param fonciiRestaurantID 
     * 
     * @returns -> True if the restaurant was deleted successfully, false otherwise.
     */
    async deleteRestaurant(fonciiRestaurantID: string) {
        return; // Implementation is not planned, don't execute at all

        // Delete all favorites associated with this restaurant, (doesn't remove first favorites)

        // Delete any uploaded media (if any)

        // Deassociate all Foncii Maps posts from this restaurant...

        return await this.database
            .deleteDocumentWithID(FonciiDBCollections.Restaurants, fonciiRestaurantID);
    }

    /**
     * Updates the restaurant with the given google place ID (if it exists in our DB)
     * with the given instagram handle by adding it to its list of existing or non-existing
     * social media handles.
     * 
     * @async
     * @param googlePlaceID
     * @param instagramHandle
     * 
     * @returns -> True if the update was successful, false otherwise.
     */
    async addInstagramHandleForRestaurant({
        googlePlaceID,
        instagramHandle
    }: {
        googlePlaceID: string,
        instagramHandle: string
    }) {
        const restaurant = await this.findRestaurantWithGoogleID(googlePlaceID);

        if (restaurant) {
            const fonciiRestaurantID = restaurant.id,
                existingSocialMediaHandles = restaurant.socialMediaHandles;

            return await this.updateRestaurant(fonciiRestaurantID, {
                socialMediaHandles: {
                    ...existingSocialMediaHandles,
                    instagram: instagramHandle
                }
            });
        }
        else {
            return false;
        }
    }

    // Specialized Methods
    /**
     * A special programmatic workflow that allows us to recompute and update all restaurant embeddings
     * in the database at once for any plausible reason.
     * 
     * @async
     * @param paginationPageIndex -> Keeps track of the pagination when requesting more documents from the collection
     */
    async recomputeAllRestaurantEmbeddings(paginationPageIndex: number = 0) {
        // Constants
        const MAX_RESULTS_PER_PAGE = 1000;

        const restaurantResults = await this.getAllRestaurants(MAX_RESULTS_PER_PAGE, paginationPageIndex),
            restaurants = restaurantResults,
            documentsRemaining = restaurants.length > 0,
            // Parse the documents into Foncii restaurant data models and filter out any undefined values (if any (not expected))
            restaurantModels = restaurants.map((restaurant) => RestaurantModel.fromObject(restaurant)).filter(Boolean) as RestaurantModel[];

        // Recompute the embeddings for all restaurants in this batch and update each record in the database
        await Promise.all(restaurantModels.map(async (restaurantModel) => {
            restaurantModel.collective_embedding = await restaurantModel.generateEmbedding();
            await this.updateRestaurant(restaurantModel.id, restaurantModel.toObject());
        }));

        // Recursively update the rest of the restaurants left
        if (documentsRemaining) {
            await this.recomputeAllRestaurantEmbeddings(paginationPageIndex + 1);
        }
        else {
            logger.info(`[recomputeAllRestaurantEmbeddings] Completed | ${(Math.max((paginationPageIndex - 1), 0) * MAX_RESULTS_PER_PAGE) + restaurants.length}+ Documents Updated`);
        }
    }
}