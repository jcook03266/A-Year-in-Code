// Dependencies
// Types
import { AggregationSortOrders, FonciiDBCollections, FullTextSearchIndexes } from "../../../../types/namespaces/database-api";
import { BSON } from "mongodb";

// Models
import FMUserPostModel from "../../../../models/foncii/post-models/fmUserPostModel";

// Services
import { DatabaseServiceAdapter } from "../../database/databaseService";
import RestaurantService, { RestaurantPropertyOptions } from "../../shared/restaurants/restaurantService";
import UserService from "../../shared/users/userService";
import RestaurantAggregator from "../../shared/restaurants/restaurantAggregator";
import EventService from "../../events/eventService";

// Microservices
import { MicroserviceRepository } from "../../../../core-foncii/microservices/repository/microserviceRepository";

// Utilities
import { currentDateAsISOString } from "../../../../foncii-toolkit/utilities/convenienceUtilities";
import { clampNumber } from "../../../../foncii-toolkit/math/commonMath";
import { advanceDateBy30Days, convertDateToMidnightMSTimestamp, getCurrentDate } from "../../../../foncii-toolkit/utilities/time";
import { computeLevenshteinDistance } from "../../../../foncii-toolkit/math/collectionMath";
import { EARTH_RADIUS_KM } from "../../../../foncii-toolkit/math/euclideanGeometryMath";

// Logging
import logger from "../../../../foncii-toolkit/debugging/debugLogger";

// Local Types
type FMUserPostSortOptions = { [K in keyof Partial<FMUserPost>]: AggregationSortOrders };
type FMUserPostPropertyOptions = { [K in keyof Partial<FMUserPost>]: any };

/**
 * Loosely coupled service layer for all Foncii Maps (FM) user posts related services, operations, and data transformations
 * including database interfacing for mutations and queries.
 */
export default class FonciiMapsPostService {
    // Services
    database = new DatabaseServiceAdapter();
    restaurantService = () => new RestaurantService();
    restaurantAggregator = () => new RestaurantAggregator();
    fmUserService = () => new UserService();
    eventService = () => new EventService();

    // Full-text search 
    // Autocomplete
    // See here: https://cloud.mongodb.com/v2/6500cad1a2317e0f32b576a6#/clusters/atlasSearch/Foncii-D-Cluster?collectionName=Foncii%20Maps%20Posts&database=FonciiFediverseDB&indexName=Foncii-Maps-User-Posts&view=VisualEdit
    // Resources about ngram and edgegram: https://stackoverflow.com/questions/31398617/how-edge-ngram-token-filter-differs-from-ngram-token-filter
    static AutocompleteFullTextSearchMappedFields = {
        customUserProperties_Notes: "customUserProperties.notes", // Document Child Fields
        customUserProperties_Categories: "customUserProperties.categories",
        media_type: "media.mediaType", // Document Child Fields
    }

    // Limits
    MAX_GEOSPATIAL_RESTAURANT_RESULTS: number = 1000; // Maximum number of candidates / restaurant IDs to return, Important: IDs only toggled so that fetching is quick
    GEOSPATIAL_SEARCH_MAX_RADIUS: number = EARTH_RADIUS_KM; // In kilometers [KM]


    // Modular Database Aggregation Pipeline Stages
    /**
     * Joining Posts with Restaurants by fonciiRestaurantID into a new field called restaurant
     * including posts without the `fonciiRestaurantID` / undefined / empty restaurant fields
     */
    JoinPostsWithRestaurantsPipelineStagesInclusive = [
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
                'preserveNullAndEmptyArrays': true // Don't exclude posts without restaurant data defined, restaurant is an optional field
            }
        }
    ]

    /**
     * Excludes posts without restaurant data
     */
    JoinPostsWithRestaurantsPipelineStagesExclusive = [
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
    ]

    /**
     * Joins Posts with Users by userID into a new field called creator.
     */
    JoinPostsWithUsersPipelineStages = [
        {
            '$lookup': {
                'from': FonciiDBCollections.FMUsers,
                'localField': 'userID',
                'foreignField': 'id',
                'as': 'creator'
            }
        }, {
            '$unwind': {
                'path': '$creator',
                'preserveNullAndEmptyArrays': false // All valid posts must have the 'UserID' field, any that don't are invalid
            }
        }
    ]

    /**
     * Groups posts by restaurant based on the FIRST POST BY SORT ORDER
     */
    GroupByRestaurant = [
        {
            "$group": {
                "_id": "$fonciiRestaurantID",
                "latest_post": {
                    "$first": "$$ROOT"
                }
            }
        },
        {
            "$replaceRoot": {
                "newRoot": "$latest_post"
            }
        },
    ]

    // Reusable / Modular Methods
    // Mutations
    /**
     * Updates the (Foncii Maps (FM)) post document referenced by the given (Foncii Maps) post ID.
     * 
     * Note: Only use the supported fields provided by the FM post data model
     * to avoid adding isolated/unknown data to a user document. Any literal undefined or null 
     * fields will be marked as unset and consequently removed from the document, if this isn't the
     * desired behavior, use the replace method to update the entire document at once and preserve 
     * any fields by trimming out these values instead of removing the fields completely.
     * 
     * @async
     * @param postID -> The id of the FM post document to update
     * @param properties -> Updated FM post data to merge with the existing data, pass null or undefined or {} for a field to remove (unset) it.
     * 
     * @returns -> True if the update was successful, false otherwise. 
     */
    async updatePost(
        postID: string,
        properties: FMUserPostPropertyOptions
    ) {
        const documentID = postID,
            updatedProperties = {
                ...properties,
                lastUpdated: currentDateAsISOString(), // Will overwrite any property named 'lastUpdated' as intended if included
            }

        return await this.database
            .updateFieldsInDocumentWithID(
                FonciiDBCollections.FMPosts,
                documentID,
                updatedProperties
            );
    }


    /**
     * Deletes the post with the specified properties (if any exists).
     * Not used for now. Use the `deletePost` method for simplicity as it's 
     * called by this method. This is useful for development purposes.
     * 
     * @async
     * @param properties 
     * 
     * @returns -> True if the deletion was successful, false otherwise.
     */
    async deletePostWithProperties(
        properties: FMUserPostPropertyOptions
    ) {
        // Parsing
        const post = await this.findPostWith(properties);

        // Post doesn't exist, can't delete it
        if (!post) return false;

        // Parsing
        const parentPostID = post?.parentPostID ?? post.id;

        return await this.deletePost({ postID: parentPostID })
    }

    // Queries
    /**
     * Searches the (Foncii Maps) posts collection for a single post with properties 
     * (source ID, post ID etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * 
     * @returns -> Null if the post can't be found, FM post data model otherwise.
     */
    async findPostWith(
        properties: FMUserPostPropertyOptions
    ) {
        // Restaurant + Creator
        const pipelineStages = [
            ...this.JoinPostsWithRestaurantsPipelineStagesInclusive,
            ...this.JoinPostsWithUsersPipelineStages
        ]

        const result = await this.database
            .paginatableAggregationPipeline<FMUserPost>({
                collectionName: FonciiDBCollections.FMPosts,
                pipelineStages,
                properties,
                resultsPerPage: 1
            });

        return result.length > 0 ? result[0] : null;
    }

    /**
     * Searches the (Foncii Maps) posts collection for posts with properties 
     * (source ID, post ID etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * @param resultsPerPage -> The maximum number of posts to return per page (0 = no limit)
     * @param paginationPageIndex -> The current page index (0 = first page of results)
     * @param sortOptions -> The sort options to use when returning the posts. Default is undefined for no sorting.
     * 
     * @returns -> Aggregated collection documents
     */
    async findPostsWith({
        properties = {},
        resultsPerPage = 100,
        paginationPageIndex = 0,
        groupByRestaurant = false,
        sortOptions,
        projectionStage
    }: {
        properties?: FMUserPostPropertyOptions,
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: FMUserPostSortOptions,
        groupByRestaurant?: boolean,
        projectionStage?: { $project: { [K in keyof Partial<FMUserPostPropertyOptions>]: 1 | 0 } }
    }) {
        // Restaurant + Creator
        const pipelineStages = [
            ...this.JoinPostsWithRestaurantsPipelineStagesInclusive,
            ...this.JoinPostsWithUsersPipelineStages,
            ...(groupByRestaurant ? this.GroupByRestaurant : [])
        ];

        return await this.database
            .paginatableAggregationPipeline<FMUserPost>({
                collectionName: FonciiDBCollections.FMPosts,
                pipelineStages,
                properties,
                resultsPerPage,
                paginationPageIndex,
                sortOptions,
                projectionStage
            });
    }

    /**
     * A post is a child post aka a duplicate post if the post has a parent post ID 
     * (indicating the post was derived (copied) from another post, i.e its parent post), false otherwise.
     * 
     * @async
     * @param postID 
     * 
     * @returns -> True if the post has a parent post ID (indicating the post was derived from
     * another post, i.e its parent post), false otherwise.
     */
    async isPostAChildPost(
        postID: string
    ) {
        const post = await this.findPostWith({ id: postID }),
            parentPostID = post?.parentPostID;

        return parentPostID != undefined;
    }

    /**
     * Determines whether or not this post has existing children where their parent post ID equals 
     * the specified post ID.
     * 
     * @async
     * @param postID 
     * 
     * @returns -> True if the post has existing children where their parent post ID equals the id of this post, 
     * false otherwise
     */
    async doesPostHaveChildren(postID: string) {
        const count = await this.countTotalPostsWithProperties({ parentPostID: postID });
        return count > 0;
    }

    /**
     * @async
     * @param postID 
     * 
     * @returns -> True if one or less posts have a dependency on the media referenced
     * by the post with the given ID, or if the post doesn't exist / the media doesn't exist,
     * false otherwise. The default behavior when the post doesn't exist / when the media doesn't 
     * exist is to return true in order to clean up any isolated files. A user would never have 
     * access to the deletion process of a non-existent post, but if this is ever the case
     * then any files should be deleted even if they are most likely not there to begin with
     * as deleting posts will inevitably also delete their media if no other post depends on it.
     */
    async canMediaForPostBeDeleted(postID: string) {
        const post = await this.findPostWithID(postID),
            mediaURL = post?.media?.mediaURL;

        if (!post || !mediaURL) return true;
        else {
            const totalPostMediaDependencies = await this.countPostMediaDependenciesFor(mediaURL);

            // If the post media shares no dependencies with other posts, it can be deleted. 
            // Otherwise, it cannot be deleted.
            return totalPostMediaDependencies <= 1;
        }
    }

    /**
     * @async
     * @param mediaURL 
     * 
     * @returns -> The total amount of dependencies on the provided media URL by other posts, aka how 
     * many posts use the same video or image URL because they were duplicates. 1 == Only one post
     * has that mediaURL, 0 == no posts, meaning all were deleted which would make calling this 
     * method impossible or the mediaURL is not in the database at all.
     */
    async countPostMediaDependenciesFor(mediaURL: string) {
        return await this.countTotalPostsWithProperties({
            'media.mediaURL': mediaURL
        });
    }

    async countTotalRestaurantsVisitedByUserInArea({
        userID,
        coordinatePoint,
        radius
    }: {
        userID: string,
        coordinatePoint: CoordinatePoint,
        radius: number
    }) {
        // Fetch and return all unique foncii restaurant ids for the given user's posts with associated restaurants
        // Any duplicates are dropped by the grouping st
        const visitedFonciiRestaurantIDs = (await this.database
            .resolveGenericAggregationPipelineOn<{ fonciiRestaurantID: string }>(
                FonciiDBCollections.FMPosts,
                [
                    {
                        $match: {
                            userID,
                            fonciiRestaurantID: { $exists: true },
                            deletionPending: { $exists: false }
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            fonciiRestaurantID: "$fonciiRestaurantID"
                        },
                    },
                ]
            )).map((result) => result.fonciiRestaurantID) ?? [];

        const restaurantIDs = await this.getRestaurantIDsFromGeospatialSearch({
            coordinatePoint,
            radius,
            properties: {
                id: { $in: visitedFonciiRestaurantIDs }
            }
        });

        return restaurantIDs.length;
    }

    /**
     * A post is 'imported' if it has a data source associated with it
     * 'Instagram' etc. 
     * 
     * @async
     * @param id 
     * 
     * @returns -> True if the post has a data source associated with it 'Instagram' etc. This means
     * the post cannot be altered in terms of its media. The original source media will simply be transferred over
     * to our own servers and file systems to be hosted. False otherwise (custom user created post aka a 'manual post')
     * 
     * Manual posts lack original source media so the user must manually upload media. Once the user uploads media for the post
     * the media can't be changed. The post will simply have to be deleted if they want to change it.
     */
    async isPostImported(id: string) {
        return await this.doesPostExistWith({ id, dataSource: { $exists: true } });
    }

    /**
     * Determines if the (Foncii Maps) post collection for a single post with properties 
     * (source ID, post ID etc.) equal to those provided.
     * 
     * @async
     * @param properties 
     * 
     * @returns -> True if a post exists with the given properties, false otherwise.
     */
    async doesPostExistWith(
        properties: FMUserPostPropertyOptions
    ) {
        return await this.database.doesDocumentExistWithProperties<FMUserPost>(
            FonciiDBCollections.FMPosts,
            properties
        );
    }

    /**
     * Determines the total amount of posts in the FM Post
     * collection that match the given properties. 
     * 
     * @async
     * @param properties 
     * 
     * @returns -> An integer representing the total amount of posts in the FM Post
     * collection that match the given properties.
     */
    async countTotalPostsWithProperties(
        properties: FMUserPostPropertyOptions
    ) {
        return await this.database.countTotalDocumentsWithProperties(
            FonciiDBCollections.FMPosts,
            properties
        );
    }

    // Unique Methods
    // Queries
    /**
     * Computes the average custom user foncii rating for the target restaurant
     * 
     * @async
     * @param fonciiRestaurantID 
     * 
     * @returns -> The average custom user foncii rating for the target restaurant (if computable), null otherwise
     */
    async computeAverageFonciiRatingForRestaurant(fonciiRestaurantID: string): Promise<number | null> {
        // Note: A rating of 0 is considered unset / unspecified by the user as it is the default value, anything above this is a valid rating and should be considered. 
        const averageUserRatingPipelineStages = [
            {
                $match: {
                    fonciiRestaurantID,
                    $and: [
                        {
                            "customUserProperties.rating": { $exists: true, $ne: 0 },
                            deletionPending: { $exists: false }
                        }
                    ],
                },
            },
            {
                $group: {
                    _id: null,
                    avgRating: {
                        $avg: "$customUserProperties.rating"
                    }
                }
            }
        ];

        const averageRatingComputation = await this.database
            .resolveGenericAggregationPipelineOn<{ _id: null, avgRating?: number }>(
                FonciiDBCollections.FMPosts,
                averageUserRatingPipelineStages
            );

        // Unwrap optional, optional because some restaurants may not have associated Foncii posts
        const averageFonciiRating = averageRatingComputation[0]?.avgRating ?? null;
        return averageFonciiRating;
    }

    /**
     * Computes the total amount of posts with custom user ratings for the target restaurant (if any)
     * 
     * @async
     * @param fonciiRestaurantID 
     * 
     * @returns -> The total amount of posts with custom user ratings for the target restaurant (if any)
     */
    async computeTotalFonciiRatings(fonciiRestaurantID: string): Promise<number> {
        return this.countTotalPostsWithProperties({
            fonciiRestaurantID,
            deletionPending: { $exists: false },
            'customUserProperties.rating': { $exists: true, $ne: 0 }
        });
    }

    /**
     * Computes and returns the user's average personal rating for this restaurant across all of their posts
     * for which this restaurant is associated.
     * 
     * @async
     * @param userID -> The user whose average rating will be computed for the target restaurant
     * @param fonciiRestaurantID -> ID of the restaurant the user's posts (if any are associated with)
     * 
     * @returns -> The user's average personal rating for this restaurant across all associated posts.
     */
    async getUserAveragePersonalRatingFor({
        userID,
        fonciiRestaurantID
    }: {
        userID: string,
        fonciiRestaurantID: string
    }): Promise<number | null> {
        const averageUserSpecificRatingPipelineStages = [
            {
                $match: {
                    userID,
                    fonciiRestaurantID,
                    "customUserProperties.rating": { $exists: true, $ne: 0 }
                },
            },
            {
                $group: {
                    _id: null,
                    avgRating: {
                        $avg: "$customUserProperties.rating",
                    },
                },
            },
        ];

        const averageRatingComputation = await this.database
            .resolveGenericAggregationPipelineOn<{ _id: null, avgRating?: number }>(
                FonciiDBCollections.FMPosts,
                averageUserSpecificRatingPipelineStages
            );

        // Unwrap optional, optional because some restaurants may not have associated Foncii posts
        const averageFonciiRating = averageRatingComputation[0]?.avgRating ?? null;

        return averageFonciiRating;
    }

    /**
     * Computes the distributions for the top most common post locations 
     * for public posts by the given user.
     * 
    * @async
    * @param event
    * @param limit -> Default is 10 ~ 10 different distributions in one array. Results must be limited
    * 
    * @returns -> A limited and sorted array of distributions.
    */
    async fetchTopExperienceLocationsDistribution({
        userID,
        limit = 10
    }: {
        userID: string,
        limit?: number
    }): Promise<AnalyticsDistribution[]> {
        const pipelineStages = [
            // Stage 1: Match on public posts belonging to the given user
            {
                $match: {
                    userID,
                    deletionPending: { $exists: false },
                    fonciiRestaurantID: {
                        $exists: true
                    }
                }
            },
            // Stage 2: Group by Foncii restaurant ID to deduplicate multiple posts
            // about the same restaurant to permit a 1:1 location to location comparison basis
            {
                $group: {
                    _id: "$fonciiRestaurantID"
                }
            },
            // Stage 3: Join up with data from the restaurants collection to get the address properties
            {
                $lookup: {
                    from: "Restaurants",
                    localField: "_id",
                    foreignField: "id",
                    as: "restaurant"
                }
            },
            // Stage 4: Unwind to make the restaurant field a single object instead of an array
            {
                $unwind: {
                    path: "$restaurant",
                    preserveNullAndEmptyArrays: false
                }
            },
            // Stage 5: Set the location field to group by, this will contain either the city or 
            // neighborhood name depending on the restaurant's address properties. Note: Some restaurants
            // (foreign) don't have this information but they're excluded in the next stage.
            {
                $set: {
                    location: {
                        $ifNull: [
                            "$restaurant.addressProperties.neighborhood",
                            "$restaurant.addressProperties.city"
                        ]
                    }
                }
            },
            // Stage 6: Exclude restaurants that don't have the common address properties used to
            // create the location attribute
            {
                $match:
                {
                    location: {
                        $exists: true,
                    },
                    "restaurant.addressProperties.stateCode":
                    {
                        $exists: true
                    }
                }
            },
            // Stage 7: Append the state code for the address to each city / neighborhood to further identify 
            // the location with higher granularity
            {
                $set:
                {
                    location: {
                        $concat: [
                            "$location",
                            ", ",
                            "$restaurant.addressProperties.stateCode"
                        ]
                    }
                }
            },
            // Stage 8: Group by the location field to count the number of posts for each location
            {
                $group:
                {
                    _id: "$location",
                    count: {
                        $sum: 1
                    }
                }
            },
            // Step 9: Normalize the naming scheme to reflect the expected naming of the output
            // to reduce the work required on the server side
            {
                $set: {
                    _id: null,
                    category: "$_id"
                }
            },
            // Stage 10: Sort the results by descending (highest to lowest) to reflect the top locations
            // at the top and the locations with less posts at the bottom.
            {
                $sort:
                {
                    count: -1
                }
            },
            // Stage 11: Limit the total amount of documents [Required, since this could be an unlimited amount]
            {
                $limit: limit
            }
        ];

        const distributions = await this.database
            .resolveGenericAggregationPipelineOn<{
                _id: null,
                category: string,
                count: number
            }>(
                FonciiDBCollections.FMPosts,
                pipelineStages
            );

        return distributions;
    }

    /**
     * Computes the distributions for the top most common user tags for 
     * public posts by the given user.
     * 
    * @async
    * @param event
    * @param limit -> Default is 10 ~ 10 different distributions in one array. Results must be limited
    * 
    * @returns -> A limited and sorted array of distributions.
    */
    async fetchTopTagDistribution({
        userID,
        limit = 10
    }: {
        userID: string,
        limit?: number
    }): Promise<AnalyticsDistribution[]> {
        const pipelineStages = [
            // Stage 1: Match on public posts belonging to the given user
            {
                $match: {
                    userID,
                    deletionPending: { $exists: false },
                    fonciiRestaurantID: {
                        $exists: true,
                    }
                }
            },
            // Stage 2: Group all individual categories together into a 2D array
            {
                $group: {
                    _id: 0,
                    categories: {
                        $push: "$customUserProperties.categories"
                    }
                }
            },
            // Stage 3: Break the categories array down into a single array
            {
                $unwind: "$categories"
            },
            // Stage 4: Break the categories into a bunch of singular documents and not just an array field
            {
                $unwind: "$categories"
            },
            // Stage 5: Group by categories to count the total amount of occurrences per category
            {
                $group: {
                    _id: "$categories",
                    count: {
                        $sum: 1
                    }
                }
            },
            // Step 6: Normalize the naming scheme to reflect the expected naming of the output
            // to reduce the work required on the server side
            {
                $set: {
                    _id: null,
                    category: "$_id"
                }
            },
            // Step 7: Sort by most to least occurrence per user tag (category)
            {
                $sort: {
                    count: -1
                }
            },
            // Step 8: Limit the total amount of documents [Required, since this could be an unlimited amount]
            {
                $limit: limit
            }
        ];

        const distributions = await this.database
            .resolveGenericAggregationPipelineOn<{
                _id: null,
                category: string,
                count: number
            }>(
                FonciiDBCollections.FMPosts,
                pipelineStages
            );

        return distributions;
    }

    /**
     * Finds and returns the (Foncii Maps (FM)) user post document corresponding to the 
     * given post ID in the database (if it exists).
     * 
     * @async
     * @param id -> ID of the post to fetch from the database.
     * 
     * @returns -> Null if the post can't be found, FM post data model otherwise.
     */
    async findPostWithID(id: string): Promise<FMUserPost | null> {
        // Restaurant + Creator
        const pipelineStages = [
            ...this.JoinPostsWithRestaurantsPipelineStagesInclusive,
            ...this.JoinPostsWithUsersPipelineStages
        ]

        const result = await this.database
            .paginatableAggregationPipeline<FMUserPost>({
                collectionName: FonciiDBCollections.FMPosts,
                pipelineStages,
                properties: { _id: id } as any,
                resultsPerPage: 1
            });

        return result.length > 0 ? result[0] : null;
    }

    /**
     * Finds and returns the Foncii user post documents corresponding to the 
     * given post ids in the database (if any exist).
     * 
     * @async
     * @param ids -> User Post IDs of the posts to fetch from the database.
     * 
     * @returns -> Empty array if none of the posts can be found, array of post data models otherwise
     */
    async findPostsWithIDs(ids: string[]): Promise<FMUserPost[]> {
        // Restaurant + Creator
        const pipelineStages = [
            ...this.JoinPostsWithRestaurantsPipelineStagesInclusive,
            ...this.JoinPostsWithUsersPipelineStages
        ];

        const result = await this.database
            .paginatableAggregationPipeline<FMUserPost>({
                collectionName: FonciiDBCollections.FMPosts,
                pipelineStages,
                properties: { _id: { $in: ids } } as any,
                resultsPerPage: 0 // 0 ~ Return all
            });

        return result;
    }

    /**
     * Finds and returns all Foncii Maps user posts from the database that reference
     * the specified Foncii restaurant with the given ID. Supports pagination and other
     * multi-dimensional fetch request fields.
     * 
     * @async
     * @param fonciiRestaurantID 
     * @param resultsPerPage -> Default is 10, change as needed from caller.
     * @param paginationPageIndex 
     * @param postsToExclude -> An array of post IDs to exclude from the query to prevent unwanted duplicate data if 
     * required. Use case for this is excluding the post used to find other posts with the same restaurant from the 
     * returned results.
     * 
     * @returns -> Aggregated collection documents
     */
    async findPostsWithRestaurant({
        fonciiRestaurantID,
        resultsPerPage = 10,
        paginationPageIndex = 0,
        properties = {},
        postsToExclude = []
    }: {
        fonciiRestaurantID: string,
        resultsPerPage?: number,
        paginationPageIndex?: number,
        properties?: FMUserPostPropertyOptions
        sortOptions?: FMUserPostSortOptions,
        postsToExclude?: string[]
    }) {
        // Restaurant + Creator
        const pipelineStages = [
            ...this.JoinPostsWithRestaurantsPipelineStagesExclusive,
            ...this.JoinPostsWithUsersPipelineStages
        ];

        const result = await this.database
            .paginatableAggregationPipeline<FMUserPost>({
                collectionName: FonciiDBCollections.FMPosts,
                pipelineStages,
                properties: {
                    fonciiRestaurantID,
                    ...properties,
                    _id: { $nin: postsToExclude ?? [] }
                } as FMUserPostPropertyOptions,
                resultsPerPage,
                paginationPageIndex,
                // Newest to oldest sort
                sortOptions: { creationDate: AggregationSortOrders.descending }
            });

        return result;
    }

    /**
     * Finds and returns all public Foncii user posts from the database that reference
     * the specified Foncii restaurant with the given ID that also have a valid user rating or
     * valid non-empty set of user notes defined. Supports pagination and other
     * multi-dimensional fetch request fields. The posts are grouped by user ID to prevent 
     * oversaturation by a single user.
     * 
     * @async
     * @param fonciiRestaurantID 
     * @param resultsPerPage -> Default is 10, change as needed from caller.
     * @param paginationPageIndex 
     * @param postsToExclude -> An array of post IDs to exclude from the query to prevent unwanted duplicate data if 
     * required. Use case for this is excluding the post used to find other posts with the same restaurant from the 
     * returned results.
     * 
     * @returns -> Aggregated collection documents
     */
    async findUserRatedPostsWithRestaurant({
        fonciiRestaurantID,
        resultsPerPage = 10,
        paginationPageIndex = 0,
        postsToExclude = []
    }: {
        fonciiRestaurantID: string,
        resultsPerPage?: number,
        paginationPageIndex?: number,
        postsToExclude?: string[]
    }) {
        // Only posts with a rating or notes provided + Restaurant + Creator
        const pipelineStages = [
            ...this.JoinPostsWithRestaurantsPipelineStagesExclusive,
            ...this.JoinPostsWithUsersPipelineStages,
            {
                // Sort by newest to oldest
                $sort: {
                    creationDate: AggregationSortOrders.descending
                }
            },
            {
                $group: {
                    _id: "$userID",
                    latestPost: {
                        $topN: {
                            output: "$$ROOT",
                            sortBy: { "lastUpdated": AggregationSortOrders.descending },
                            n: 1
                        }
                    }
                }
            }
        ],
            aggregationResult = await this.database
                .paginatableAggregationPipeline<{ _id: string, latestPost: FMUserPost }>({
                    collectionName: FonciiDBCollections.FMPosts,
                    pipelineStages,
                    properties: {
                        fonciiRestaurantID,
                        deletionPending: { $exists: false },
                        media: { $exists: true },
                        $or: [
                            { "customUserProperties.rating": { $exists: true, $ne: 0 } },
                            { "customUserProperties.notes": { $exists: true, $ne: "" } },
                        ],
                        _id: { $nin: postsToExclude ?? [] }
                    } as any,
                    resultsPerPage,
                    paginationPageIndex
                });

        const posts = aggregationResult.flatMap((grouping) => {
            return grouping.latestPost
        });

        return posts;
    }

    /**
     * Finds and returns all Foncii Maps user posts from the database given the results per page,
     * pagination index and sort options provided.
     * 
     * @async
     * @param resultsLimit -> Default is 100, be careful to not fetch too many posts at once in order to not exceed the device's memory limit.
     * @param paginationPageIndex -> Default is 0
     * @param sortOptions -> Optional sort options to sort the results by.
     * 
     * @returns -> Aggregated collection documents
     */
    async getAllPosts(
        resultsPerPage: number = 100,
        paginationPageIndex: number = 0,
        sortOptions?: FMUserPostSortOptions
    ) {
        // Restaurant + Creator
        const pipelineStages = [
            ...this.JoinPostsWithRestaurantsPipelineStagesInclusive,
            ...this.JoinPostsWithUsersPipelineStages
        ];

        const result = await this.database
            .paginatableAggregationPipeline<FMUserPost>({
                collectionName: FonciiDBCollections.FMPosts,
                pipelineStages,
                resultsPerPage,
                paginationPageIndex,
                sortOptions
            });

        return result;
    }

    /**
     * Finds and returns all posts from the database given the results per page,
     * pagination index and sort options provided. This returns the normalized post
     * data only, no user or restaurant data is included, this is intended because
     * only the posts are required. Use case ~ sitemap generation.
     * 
     * Note: Posts are sorted by newest to oldest by default here. This is indexed behavior and 
     * shouldn't really be changed as there's really no reason to do so from a production point of view.
     * 
     * @async
     * @param resultsLimit -> Default is 100, be careful not to fetch too many entities at once in order to not exceed the device's memory limit.
     * @param paginationPageIndex -> Default is 0
     * 
     * @returns -> Aggregated collection documents
     */
    async getAllPublicPostsNormalized(
        resultsPerPage: number = 100,
        paginationPageIndex: number = 0
    ) {
        return await this.database.findDocumentsWithProperties<FMUserPost>({
            collectionName: FonciiDBCollections.FMPosts,
            properties: {
                fonciiRestaurantID: { $exists: true },
                deletionPending: { $exists: false }
            },
            resultsPerPage,
            paginationPageIndex,
            sortOptions: { creationDate: AggregationSortOrders.descending }
        });
    }

    async getAllPostsMarkedForDeletion(
        resultsPerPage: number = 100,
        paginationPageIndex: number = 0,
        sortOptions?: FMUserPostSortOptions
    ) {
        return await this.findPostsWith({
            resultsPerPage,
            paginationPageIndex,
            sortOptions,
            properties: {
                deletionPending: true
            }
        });
    }

    /**
     * Determines the total amount of user posts in the FM Posts collection.
     * 
     * @async
     * 
     * @returns -> An integer representing the total amount of user posts in the FM Posts
     * collection.
     */
    async countTotalPosts(): Promise<number> {
        return await this.database.countTotalDocumentsInCollection(FonciiDBCollections.FMPosts);
    }

    /**
     * Determines the total amount of public posts for all users.
     *
     * @async
     * 
     * @returns -> An integer amount representing the total amount of public 
     * posts for all Foncii Maps users.
     */
    async countTotalPublicPosts() {
        return await this.countTotalPostsWithProperties({
            fonciiRestaurantID: { $exists: true },
            deletionPending: { $exists: false }
        });
    }

    /**
     * Determines the total amount of public posts that belong 
     * to the specified user. 
     *
     * @async
     * @param userID 
     * 
     * @returns -> An integer amount representing the total amount of public 
     * posts that belong to the specified user.
     */
    async countTotalPublicPostsForUser(userID: string) {
        return await this.countTotalPostsWithProperties({
            userID,
            fonciiRestaurantID: { $exists: true },
            deletionPending: { $exists: false }
        });
    }

    /**
     * Determines the total amount of hidden posts that belong 
     * to the specified user. 
     *
     * @async
     * @param userID 
     * 
     * @returns -> An integer amount representing the total amount of hidden 
     * posts that belong to the specified user.
     */
    async countTotalHiddenPostsForUser(userID: string) {
        return await this.countTotalPostsWithProperties({
            userID,
            fonciiRestaurantID: { $exists: false }
        });
    }

    /**
     * Determines the total amount of posts (hidden and visible) that belong 
     * to the specified user. 
     *
     * @async
     * @param userID 
     * 
     * @returns -> An integer amount representing the total amount of 
     * posts (hidden and visible) that belong to the specified user.
     */
    async countTotalPostsForUser(userID: string) {
        return await this.countTotalPostsWithProperties({ userID });
    }

    /**
     * Computes the total number of unique categories / tags used by the user across all of their 
     * posts.
     * 
     * @async
     * @param userID -> The id of the user / posts' author
     * 
     * @returns -> The total number of unique categories / tags used by the user across all of their 
     * posts.
     */
    async countTotalUniqueTagsByUser(userID: string) {
        const pipelineStages = [
            {
                '$match': {
                    userID,
                    "customUserProperties.categories": {
                        '$exists': true,
                    },
                }
            },
            {
                '$group': {
                    '_id': 0,
                    'categories': {
                        '$push': '$customUserProperties.categories'
                    }
                }
            }, {
                '$unwind': '$categories'
            }, {
                '$unwind': '$categories'
            }, {
                '$group': {
                    '_id': 0,
                    'categories': {
                        '$addToSet': '$categories'
                    }
                }
            }, {
                '$group': {
                    '_id': 0,
                    'count': {
                        '$sum': {
                            '$size': '$categories'
                        }
                    }
                }
            }
        ];

        const result = await this.database.resolveAggregationPipelineOn<{ id: 0, count: number }>(
            FonciiDBCollections.FMPosts,
            pipelineStages
        )

        return result[0]?.count ?? 0;
    }

    /**
     * Determines whether or not the given post is owned by the given user
     * 
     * @param userID -> The user the post supposedly  belongs to
     * @param postID 
     * 
     * @returns -> True if a post exists for the given post ID with the provided user as 
     * the original author / owner, false otherwise.
     */
    async doesUserOwnPost(userID: string, postID: string) {
        return this.doesPostExistWith({ userID, id: postID });
    }

    /**
     * Determines whether or not a Foncii Maps post exists with the given global / App-scoped Identifier
     * within the post data source embedded document belonging to the specified user.
     * 
     * @async
     * @param appScopedSourceUID -> Nested source UID within the post data source (if any), if no post data source is
     * available then that means the post was manually added by the user.
     * @param liveSourceUID -> The real non-app-scoped UID of the post's data source. ~ appScopedSourceUID, if no post data source is present the post was manually added
     * @param userID -> The user the post belongs to. A user can't have multiple parent posts from the same
     * origin.
     * 
     * @returns -> True if a post exists with the given app UID, false otherwise.
     */
    async doesPostExistWithSourceUID({
        appScopedSourceUID,
        liveSourceUID,
        userID
    }: {
        appScopedSourceUID: string,
        liveSourceUID?: string,
        userID: string
    }) {
        // Search for a match for either field if both are present, or only the appScopedSourceUID if both aren't present
        const sourceUIDMatchCondition = liveSourceUID ? {
            $or: [
                { 'dataSource.sourceUID': appScopedSourceUID },
                { 'dataSource.liveSourceUID': liveSourceUID } // Use dot notation to query the nested field
            ]
        } : { 'dataSource.sourceUID': appScopedSourceUID };

        const postDataSourceQuery = {
            ...sourceUIDMatchCondition,
            userID
        };

        return this.doesPostExistWith(postDataSourceQuery);
    }

    /**
     * @async
     * @param id 
     * 
     * @returns -> True the given post has video or image media uploaded for it, false otherwise.
     */
    async doesPostHaveMedia(id: string) {
        return await this.doesPostExistWith({ id, media: { $exists: true } })
    }

    /**
     * @async
     * @param id 
     * 
     * @returns -> True the given post has a foncii restaurant associated with it, false otherwise.
     */
    async doesPostHaveAssociatedRestaurant(id: string) {
        return await this.doesPostExistWith({ id, fonciiRestaurantID: { $exists: true } })
    }

    /**
     * @async
     * @param searchQuery 
     * 
     * @returns -> A list of user categories aka user tags that auto-complete the given search query
     */
    async getUserTagAutocompleteSuggestions(searchQuery: string) {
        // Precondition failure, empty queries will always return an empty array
        if (searchQuery.length == 0) return [];

        // Limits
        // How many matching documents to source similar tags from
        const maxDocuments = 100,
            maxTags = 20;

        // Configuration
        // Return a list of user categories aka user tags that auto-complete the given search query
        const pipelineStages = [
            {
                $limit: maxDocuments
            },
            {
                $project: { "customUserProperties.categories": 1 }
            },
            {
                $unwind: {
                    path: "$customUserProperties.categories",
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $group: {
                    _id: null,
                    userTags: {
                        $push: "$customUserProperties.categories",
                    },
                }
            }];

        // Perform autocomplete search only on the custom user tags / catgories to find similar tags to suggest
        const autocompleteMappedFields = [FonciiMapsPostService.AutocompleteFullTextSearchMappedFields.customUserProperties_Categories];

        // Fetch user tags
        const userTags = ((await this.database
            .autocompleteTextSearchAggregationPipeline<{ _id: null, userTags: string[] }>({
                collectionName: FonciiDBCollections.FMPosts,
                indexName: FullTextSearchIndexes.FMPosts,
                pipelineStages,
                searchQuery,
                autocompleteMappedFields,
                // One grouping document will be returned
                resultsPerPage: 1,
            }))[0]?.userTags) ?? [];

        // Sort user tags by dissimilarity to the given search query, from smallest to largest, smallest = most similar, largest = least similar
        const sortedUniqueTags = [...(new Set(userTags))].sort((a, b) => computeLevenshteinDistance(a, searchQuery) - computeLevenshteinDistance(b, searchQuery));

        // Only return a sensible amount of similar tags in order to keep the payload light and query fast
        return sortedUniqueTags.slice(0, maxTags);
    }

    /**
     * Computes and returns a list of the most popular / frequent user tags used amongst users.
     * 
     * @async
     * 
     * @returns -> A list of the most popular / frequent user tags used amongst users
     */
    async fetchPopularUserTags() {
        // Note: Most of this was generated by the MongoDB aggregation generator AI
        // Prompt used: what are the most popular categories used in the customUserProperties subdocument? 
        const pipelineStages = [
            {
                '$match': {
                    'customUserProperties.categories': {
                        '$exists': true,
                        '$ne': []
                    }
                }
            }, {
                '$group': {
                    '_id': 0,
                    'categories': {
                        '$push': '$customUserProperties.categories'
                    }
                }
            }, {
                '$unwind': '$categories'
            }, {
                '$unwind': '$categories'
            }, {
                '$group': {
                    '_id': '$categories',
                    'count': {
                        '$sum': 1
                    }
                }
            }, {
                '$sort': {
                    'count': -1
                }
            }, {
                '$project': {
                    '_id': 0,
                    'category': '$_id',
                    'count': 1
                }
            }, {
                '$limit': 100
            }
        ];

        return (await this.database
            .resolveGenericAggregationPipelineOn<{ category: string, count: number }>(
                FonciiDBCollections.FMPosts,
                pipelineStages
            )).map((result) => result.category);
    }

    /**
     * Randomly selects a sample of posts from the aggregated posts + restaurants + users collections,
     * using the given properties to filter the posts.
     * 
     * @async
     * @param properties -> The properties to be used to filter the posts.
     * @param sampleSize -> The sample size to be returned. Default is 1.
     * 
     * @returns -> An array of the given sample size of posts (randomly selected) that match the given properties.
     */
    async getRandomSampleOfPosts(properties: FMUserPostPropertyOptions, sampleSize: number = 1) {
        // Restaurant + Creator + Random Sample stage
        const pipelineStages = [
            ...this.JoinPostsWithRestaurantsPipelineStagesExclusive,
            ...this.JoinPostsWithUsersPipelineStages,
            { $sample: { size: sampleSize } }
        ];

        const aggregationResult = await this.database
            .paginatableAggregationPipeline<FMUserPost>({
                collectionName: FonciiDBCollections.FMPosts,
                pipelineStages,
                properties
            });

        return aggregationResult;
    }

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
        searchQuery: string,
        properties?: FMUserPostPropertyOptions,
        pipelineStages?: BSON.Document[],
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: FMUserPostSortOptions,
        projectionStage?: { $project: { [K in keyof Partial<FMUserPostPropertyOptions>]: 1 | 0 } }
    }) {
        // Fields to perform autocomplete search on
        const autocompleteMappedFields = Object.values(FonciiMapsPostService.AutocompleteFullTextSearchMappedFields);

        return await this.database
            .autocompleteTextSearchAggregationPipeline<FMUserPost>({
                collectionName: FonciiDBCollections.FMPosts,
                indexName: FullTextSearchIndexes.FMPosts,
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
     * Searches the aggregated posts + restaurants + users collections for posts that match the given search 
     * query using geospatial search.
     * 
     * @async
     * @param coordinates -> The center point of the geospatial search area
     * @param radius -> The radius of the search area in meters [m], aka the maximum distance that a document
     * can be from the specified coordinates.
     * ~ `geospatialFullTextSearchForPosts` Params
     * 
     * @returns -> Aggregated collection documents
     */
    async geospatialSearchForPosts({
        coordinatePoint,
        radius,
        properties,
        resultsPerPage = 0,
        paginationPageIndex = 0,
        sortOptions
    }: {
        coordinatePoint: CoordinatePoint
        radius: number
        properties?: FMUserPostPropertyOptions
        resultsPerPage?: number
        paginationPageIndex?: number
        sortOptions?: FMUserPostSortOptions
    }) {
        // Restaurant + Creator
        const pipelineStages = [
            ...this.JoinPostsWithRestaurantsPipelineStagesExclusive,
            ...this.JoinPostsWithUsersPipelineStages
        ];

        // Resolved Geospatial search aggregation pipeline on the restaurant collection
        const restaurantIDs = await this.getRestaurantIDsFromGeospatialSearch({ coordinatePoint, radius });

        // Include found restaurants in the search filter to find posts matching the found restaurant IDs
        const updatedSearchFilter: FMUserPostPropertyOptions = {
            ...properties,
            fonciiRestaurantID: { $in: restaurantIDs }
        };

        return await this.database
            .paginatableAggregationPipeline<FMUserPost>({
                collectionName: FonciiDBCollections.FMPosts,
                pipelineStages,
                properties: updatedSearchFilter,
                resultsPerPage,
                paginationPageIndex,
                sortOptions
            });
    }

    /**
     * Queries the restaurants collection for restaurants within the specified geospatial search area,
     * and maps out the IDs of the restaurants found to return to the caller.
     * ~ Parameters for `geospatialSearchForPosts`
     * 
     * @async
     * @param coordinates -> The center point of the geospatial search area
     * @param radius -> The radius of the search area in meters [m], aka the maximum distance that a document
     * can be from the specified coordinates.
     * 
     * @returns -> An array of restaurant IDs that match the given geospatial search criteria.
     */
    async getRestaurantIDsFromGeospatialSearch({
        resultsPerPage = this.MAX_GEOSPATIAL_RESTAURANT_RESULTS,
        coordinatePoint,
        radius,
        properties
    }: {
        resultsPerPage?: number,
        coordinatePoint: CoordinatePoint
        radius: number
        properties?: RestaurantPropertyOptions
    }) {
        const clampedSearchRadius = clampNumber(radius, 0, this.GEOSPATIAL_SEARCH_MAX_RADIUS),
            returnIDOnlyStage = { $project: { id: 1 } },
            pipelineStages = [returnIDOnlyStage];

        // Resolved Geospatial search aggregation pipeline on the restaurant collection
        const restaurantGeospatialSearchResult = await this.restaurantService()
            .geospatialSearchForRestaurants({ coordinatePoint, radius: clampedSearchRadius, properties, resultsPerPage, pipelineStages });

        const restaurants = restaurantGeospatialSearchResult,
            restaurantIDs = restaurants.map(restaurant => restaurant.id);

        return restaurantIDs ?? [];
    }

    /**
     * Fetches all posts (visible and hidden) for the given user ID, with pagination being possible.
     * Only meant for authorized users aka gallery authors since this exposes hidden posts as well
     * as visible ones.
     * 
     * Note: Posts are sorted by newest to oldest by default here. This is indexed behavior and 
     * shouldn't really be changed as there's really no reason to do so from a production point of view.
     * The same logic goes for the other methods that pull multiple posts at once.
     * 
     * @param userID -> ID of the gallery author
     * @param resultsPerPage -> The maximum number of posts to return per page (0 = no limit), default is 0, Change this as needed to prevent memory exceptions for very big accounts.
     * @param paginationPageIndex -> The current page index (0 = first page of results)
     * 
     * @returns -> Aggregated collection documents
     */
    async fetchAllPostsForUser(
        userID: string,
        resultsPerPage: number = 0,
        paginationPageIndex: number = 0
    ) {
        // Restaurant + Creator
        const pipelineStages = [
            ...this.JoinPostsWithRestaurantsPipelineStagesInclusive,
            ...this.JoinPostsWithUsersPipelineStages
        ];

        return await this.database
            .paginatableAggregationPipeline<FMUserPost>({
                collectionName: FonciiDBCollections.FMPosts,
                pipelineStages,
                properties: { userID },
                resultsPerPage,
                paginationPageIndex,
                sortOptions: { creationDate: AggregationSortOrders.descending } // Newest to oldest posts sort order
            });
    }

    /**
     * Fetches and returns the post with the given live or app-scoped identifier
     * within the post's data source embedded document (if it exists).
     * 
     * @async
     * @param appScopedSourceUID -> Nested source UID within the post data source (if any), if no post data source is
     * available then that means the post was manually added by the user.
     * @param liveSourceUID -> The real non-app-scoped UID of the post's data source. ~ appScopedSourceUID, if no post data source is present the post was manually added
     * @param userID -> The user the post belongs to. A user can't have multiple parent posts from the same
     * origin.
     * 
     * @returns -> The defined post (if it exists with the given app UID), null otherwise.
     */
    async fetchParentPostWithSourceUID({
        appScopedSourceUID,
        liveSourceUID,
        userID
    }: {
        appScopedSourceUID: string,
        liveSourceUID?: string,
        userID: string
    }) {
        // Search for a match for either field if both are present, or only the appScopedSourceUID if both aren't present
        const sourceUIDMatchCondition = liveSourceUID ? {
            $or: [
                { 'dataSource.sourceUID': appScopedSourceUID },
                { 'dataSource.liveSourceUID': liveSourceUID } // Use dot notation to query the nested field
            ]
        } : { 'dataSource.sourceUID': appScopedSourceUID };

        return this.findPostWith({
            // SourceUID or liveSourceUID
            ...sourceUIDMatchCondition,
            userID,
            // Only parent posts, no duplicates / children posts
            parentPostID: { $exists: false }
        });
    }

    /**
     * Fetches all public posts for the given user ID, with pagination being possible.
     * Only meant for unauthorized users aka gallery visitors since this doesn't expose the author's hidden
     * posts.
     * 
     * @async
     * @param userID -> ID of the gallery author
     * @param resultsPerPage -> The maximum number of posts to return per page (0 = no limit)
     * @param paginationPageIndex -> The current page index (0 = first page of results)
     * 
     * @returns -> Aggregated collection documents
     */
    async fetchPublicPostsForUser(
        userID: string,
        resultsPerPage: number = 100,
        paginationPageIndex: number = 0,
        groupByRestaurant: boolean = false
    ) {
        // Restaurant defined = public, always ensure that a restaurant is associated with a public post.
        const publicPostQuery = {
            fonciiRestaurantID: { $exists: true }, // Only return non-deleted posts with a restaurant ID defined
            deletionPending: { $exists: false },
            userID
        };

        return await this.findPostsWith({
            properties: publicPostQuery,
            resultsPerPage,
            paginationPageIndex,
            groupByRestaurant,
            sortOptions: { creationDate: AggregationSortOrders.descending }, // Newest to oldest posts sort order
        });
    }

    /**
     * Fetches all hidden posts for the given user ID, with pagination being possible.
     * Note: This is not really used outside of the dev environment here, since this data is already
     * covered by 'fetchAllPostsForUser'.
     * 
     * @param userID -> ID of the gallery author
     * @param resultsPerPage -> The maximum number of posts to return per page (0 = no limit)
     * @param paginationPageIndex -> The current page index (0 = first page of results)
     * 
     * @returns -> Aggregated collection documents
     */
    async fetchHiddenPostsForUser(
        userID: string,
        resultsPerPage: number = 100,
        paginationPageIndex: number = 0
    ) {
        // Any post marked as hidden is hidden, and can only be accessed by authorized parties.
        const hiddenPostQuery = {
            userID,
            fonciiRestaurantID: { $exists: false },
        };

        return await this.findPostsWith({
            properties: hiddenPostQuery,
            resultsPerPage,
            paginationPageIndex,
            sortOptions: { creationDate: AggregationSortOrders.descending } // Newest to oldest posts sort order
        });
    }

    // Mutations
    /**
     * Creates a Foncii Maps user post document in database using the provided
     * Foncii Maps (FM) user post data (if a post doesn't already exist
     * with the provided data under our required conditions).
     * 
     * Note: Parent posts for a specific user must have unique data sources
     * symbolized by a unique source ID in their data source field.
     * 
     * @async
     * @param props -> Various fields, userID is mandatory
     * 
     * @returns -> The newly created (Foncii Maps) post data model if the 
     * post was created and inserted into the database successfully, null otherwise.
     */
    async createPost(props: Partial<FMUserPost> & { userID: string }) {
        const newPost = new FMUserPostModel(props),
            dataSourceAppScopedUID = newPost.dataSource?.sourceUID,
            dataSourceLiveUID = newPost.dataSource?.liveSourceUID,
            isParentPost = newPost.parentPostID == undefined,
            documentID = newPost.id;

        // Precondition failure
        if (newPost == undefined) return null;

        // Validate that the post is unique before creating a new record for it in the DB.
        // Parent posts for a specific user must have unique data sources, only child / duplicate posts 
        // are allowed to bypass this conditional logic as they're a subset of the parent post.
        if (isParentPost &&
            dataSourceAppScopedUID &&
            await this.doesPostExistWithSourceUID({
                appScopedSourceUID: dataSourceAppScopedUID,
                liveSourceUID: dataSourceLiveUID,
                userID: props.userID
            })
        ) {
            logger.warn(`A parent post with app-scoped data source UID: ${dataSourceAppScopedUID} || live UID ${dataSourceLiveUID} already exists for user ${props.userID} and cannot be created again.`);
            return null;
        }

        const didSucceed = await this.database.createNewDocumentWithID(
            FonciiDBCollections.FMPosts,
            documentID,
            newPost.toObject()
        );

        return didSucceed ? newPost : null;
    }

    /**
     * Creates multiple unique Foncii Maps user post documents in the database at once
     * using the bulk operation to reduce the amount of time required to perform said
     * operations.
     * 
     * @async
     * @param posts 
     * 
     * @returns -> True if the bulk operation was successful, false otherwise.
     */
    async bulkCreatePosts(
        posts: FMUserPost[]
    ) {
        const bulkUpdateFieldsOperations = posts.map((post) => {
            const documentID = post.id;

            return this.database.createNewDocumentWithIDAsBulkWriteOperation(
                documentID,
                post
            );
        });

        return await this.database.bulkWrite(
            FonciiDBCollections.FMPosts,
            [...bulkUpdateFieldsOperations]);
    }

    async markPostForDeletion(postID: string): Promise<boolean> {
        const scheduledDeletionTimestamp = convertDateToMidnightMSTimestamp(advanceDateBy30Days(getCurrentDate()));

        return await this.updatePost(postID, {
            deletionPending: true,
            scheduledDeletionTimestamp
        });
    }

    async unmarkPostForDeletion(postID: string): Promise<boolean> {
        const post = await this.findPostWithID(postID);

        // Precondition failure, post doesn't exist
        if (!post) return false;

        return await this.updatePost(postID, {
            deletionPending: null,
            scheduledDeletionTimestamp: null
        });
    }

    /**
     * Deletes all posts marked for deletion today (UTC) and returns 
     * true if all posts were deleted successfully, and false otherwise.
     * 
     * @async
     * 
     * @returns -> True if all posts were deleted successfully, false otherwise
     */
    async resolvePendingDeletions(): Promise<boolean> {
        // Properties
        let didSucceed = true,
            paginationPageIndex = 0,
            documentsRemaining = true;

        // Today
        const deletionTimeForToday = convertDateToMidnightMSTimestamp(getCurrentDate());

        while (documentsRemaining) {
            // Fetch
            const postsMarkedForDeletionToday = await this.findPostsWith({
                properties: {
                    deletionPending: true,
                    /** Find any current and older posts with pending deletions that were not yet resolved for some reason */
                    scheduledDeletionTimestamp: { $lte: deletionTimeForToday }
                },
                paginationPageIndex
            }),
                posts = postsMarkedForDeletionToday;

            // Run deletion process
            await Promise.all(posts.map(async (post) => {
                didSucceed = didSucceed && await this.deletePost({
                    postID: post.id,
                    fetchedPost: post // Pass the already fetched post to avoid re-fetching it from the database
                });
            }));

            // Iterate forward (if possible)
            documentsRemaining = posts.length > 0;
            paginationPageIndex++;
        }

        return didSucceed;
    }

    /**
     * Deletes the post associated with the given ID from the database, as well as its 
     * corresponding media files if no other posts depend on those same files.
     * 
     * @async
     * @param postID -> ID of the post to delete (doesn't matter if it exists or not just delete it if it does)
     * @param fetchedPost -> Optional parameter to specify the already fetched post to delete without re-fetching it from the database.
     * 
     * @returns -> True if the post was deleted successfully, false otherwise.
     */
    async deletePost({
        postID,
        fetchedPost
    }: {
        postID: string,
        fetchedPost?: FMUserPost
    }) {
        // Parsing
        const post = fetchedPost ?? await this.findPostWithID(postID);

        // Post doesn't exist, can't delete it
        if (!post) return false;

        // Parsing
        const creatorUserID = post?.userID,
            parentPostID = post?.parentPostID ?? postID;

        // Deletion Process
        // Only delete the post's media if no other posts depend on it (child posts)
        const canMediaBeDeleted = await this.canMediaForPostBeDeleted(parentPostID);

        if (canMediaBeDeleted) {
            MicroserviceRepository.fonciiMedia().deleteUserPostMediaFor({
                postID: parentPostID,
                userID: creatorUserID
            });
        }

        // No other steps to consider, post has been deleted (maybe more steps will be added if other users are able to favorite posts in the future)...

        return await this.database.deleteDocumentWithID(FonciiDBCollections.FMPosts, postID);
    }

    /**
     * Deletes all posts that belong to the user with the given user ID from the database, as well as all of their
     * associated media files from cloud storage.
     * 
     * @async
     * @param userID 
     * 
     * @returns -> True if all posts were deleted successfully, false otherwise.
     */
    async deleteAllPostsForUser(userID: string) {
        // Deletes the directory for all user media associated with this user ID
        await MicroserviceRepository.fonciiMedia().deleteAllUserPostMediaFor(userID);

        return await this.database.deleteDocumentsWithProperties(FonciiDBCollections.FMPosts, { userID });
    }

    /**
     * Copies attributes from a source post and creates a child post with a select few attributes.
     * Used for multi-restaurant posts that require separation of restaurant information ~ food crawls, food halls,
     * festivals etc. This makes it so any posts derived from a single source or it's children all lead back to the 
     * original parent post, allowing for any extended application of this functionality down the line. Again there's 
     * no multi-level hierarchy, all copied posts lead back to the same parent, even when copying from a copy.
     * 
     * @async
     * @param {String} sourcePostID -> ID of the parent post to copy over some attributes and create a child post from.
     * 
     * @returns -> The new duplicated (child) post data model if the post was created and inserted into the database successfully, null otherwise.
     */
    async duplicateFMPost(sourcePostID: string) {
        const parentPost = await this.findPostWithID(sourcePostID);

        // Parent doesn't exist, nothing to duplicate
        if (parentPost == undefined) return null;

        // Parse details to copy over to new post
        const parentPostID = parentPost.id,
            dataSource = parentPost.dataSource;

        // Custom user properties assigned to default data source imported values so that the user can customize the properties from scratch again on the new duplicate.
        const defaultCustomUserProperties = FMUserPostModel.generateDefaultCustomUserProperties(dataSource);

        // Create the duplicate post with default user properties, a reference to its new parent post, and 
        // the rest of the original post's unique non-user defined attributes, i.e media and data source information etc.
        const duplicatedPost = await this.createPost({
            ...parentPost,
            id: DatabaseServiceAdapter.generateUUIDHexString(),
            parentPostID: parentPost.parentPostID ?? parentPostID, // Parent post's parent ID (if copying from a child) ?? Original post ID (if copying from original)
            customUserProperties: defaultCustomUserProperties,
        });

        // Return null if the duplicated post failed to be created, otherwise return the duplicated post with the required aggregated fields.
        if (!duplicatedPost) return null;

        return await this.findPostWithID(duplicatedPost.id);
    }

    /**
     * Sets or unsets the associated restaurant data for the specified post.
     * When restaurant data is set the post becomes publicly visible, and 
     * when this data is removed the post becomes hidden and only visible
     * to the post's author in their own personal gallery.
     * 
     * Note: A valid google place ID is required to set the associated restaurant data,
     * this can be simply obtained through the google autocomplete API ex.) as implemented on
     * the Foncii Maps client for the post editor modal.
     * 
     * @async
     * @param postID 
     * @param googlePlaceID
     * 
     * @returns -> True if the update was successful, false otherwise. 
     */
    async updateAssociatedRestaurantData({
        postID,
        googlePlaceID
    }: {
        postID: string,
        googlePlaceID?: string
    }) {
        // Mutable post restaurant / visibility related properties
        let fonciiRestaurantID = null; // Default action is to remove associated restaurant data if no place ID is provided [intended when removing restaurant]

        // Autocomplete Place ID defined and valid, attempt to aggregate restaurant
        if (googlePlaceID) {
            // Determine if the place ID actually exists in google's database
            const requestedBusinessExists = await this.restaurantAggregator().googlePlacesService.doesBusinessWithGPIDExist(googlePlaceID);

            // Validation
            // Log and continue, it might exist in our database / google places API is rate limited right now to keep costs low
            if (!requestedBusinessExists) {
                logger.warn(`A google place with the id ${googlePlaceID} could not be found.`);
            }

            // Singular Foncii restaurant aggregation pipeline
            const restaurant = await this.restaurantAggregator().aggregateRestaurant(googlePlaceID) ||
                // If the restaurant can't be updated at this time (Google Places API outage), then just return it if it exists
                await this.restaurantService().findRestaurantWithGoogleID(googlePlaceID);

            if (!restaurant) {
                // Post will be hidden since its associated restaurant data isn't defined anymore, log and continue
                logger.warn(`The restaurant data associated with this post could not be aggregated, removing any existing associated restaurant data; the post will now be hidden from the public. GPID: ${googlePlaceID}`);
            }
            else {
                // Data defined, all good to update the post with the aggregated / fetched restaurant data
                fonciiRestaurantID = restaurant.id;
            }
        }

        return await this.updatePost(postID, { fonciiRestaurantID });
    }

    /**
     * When the user is done successfully uploading their respective media file from the client,
     * this is used to update the media sub-document / object for the target post entity in the database
     * to reflect the new media file(s)'s URL and media type. 
     * 
     * Note: Users can only update media for posts that are not imported and ones that don't already 
     * have media uploaded for them.
     * 
     * @async
     * @param postID
     * @param mediaType
     * @param mediaURL
     * @param videoMediaThumbnailURL
     * 
     * @returns -> True if the post's media was update successfully, false otherwise.
     */
    async updatePostMedia({
        postID,
        media
    }: {
        postID: string,
        media: FMUserPostMedia
    }) {
        const canUpload = await this.canPostMediaBeUpdated(postID);

        // Can't replace already defined user media, user must delete the post and upload a new piece of media
        if (!canUpload) return false;

        return await this.updatePost(postID, { media });
    }

    /**
     * Updates all user properties at once, please pass all original properties
     * to avoid overwriting any props with undefined data. Note the max character length
     * for notes is 3000 characters. This is enforced here, but also enforce
     * this on the client side as well to avoid any unexpected data truncation on the user side.
     * 
     * Instagram's caption size is 2200, but for good measure we boosted ours to 3000 to cover the possible spectrum.
     * 
     * @async
     * @param {String} postID 
     * @param {CustomUserProperties} customUserProperties -> Custom user props object to update the post with
     * 
     * @returns -> True if the update was successful, false otherwise. 
     */
    async updateCustomUserProperties(
        postID: string,
        customUserProperties: CustomUserProperties
    ) {
        // Data pruning and cleaning
        let cleanedUpCustomUserProperties = customUserProperties;

        // User Notes about the Restaurant
        if (customUserProperties.notes != undefined) {
            let value = customUserProperties.notes,
                cleanedValue;

            // Limit / Requirements
            const maxCharacters = 3000;

            cleanedValue = value.slice(0, maxCharacters);
            cleanedUpCustomUserProperties.notes = cleanedValue;
        }

        // Post Custom User Categories
        if (customUserProperties.categories != undefined) {
            let value = customUserProperties.categories,
                cleanedValue;

            // Limit / Requirements
            const maxElements = 10,
                maxCharactersPerCategory = 30;

            value = value.map(category => {
                return category.slice(0, maxCharactersPerCategory);
            });

            cleanedValue = value.slice(0, maxElements);
            cleanedUpCustomUserProperties.categories = cleanedValue;
        }

        // User Overall Restaurant Rating
        if (customUserProperties.rating != undefined) {
            let value = customUserProperties.rating,
                cleanedValue;

            // Limit / Requirements
            // 0 ~ Unset meaning no rating
            const requiredRange = [0, FMUserPostModel.UserRatingRange.max];

            cleanedValue = clampNumber(value, requiredRange[0], requiredRange[1]);
            cleanedUpCustomUserProperties.rating = cleanedValue;
        }

        // Update the post's custom user properties data in the DB
        return await this.updatePost(postID, { customUserProperties: cleanedUpCustomUserProperties });
    }

    /**
     * Determines if the post is a custom manually added user post that does not have 
     * media already uploaded for it, or not.
     * 
     * @async
     * @param postID 
     * 
     * @returns -> True if the post is a custom manually added user post that does not have 
     * media already uploaded for it, false otherwise.
     */
    async canPostMediaBeUpdated(postID: string) {
        const [
            isImported,
            hasMedia
        ] = await Promise.all([
            this.isPostImported(postID),
            this.doesPostHaveMedia(postID)
        ]);

        return !isImported && !hasMedia;
    }

    // Developer Use Only
    /**
     * Important: This is for adhoc developer usage only. This is meant to join posts up with some shadow user,
     * and that purpose only.
     * 
     * @async
     * @param posts -> The posts to assign / join with the target user whose UID is provided as well
     * @param userID
     * 
     * @returns -> An array of user posts updated and inserted into the database with the required
     * changes. Any undefined / null values are filtered out.
     */
    async joinMockPostsWithUser({
        posts,
        userID
    }: {
        posts: FMUserPost[],
        userID: string
    }): Promise<FMUserPost[]> {
        const mockedPosts: FMUserPost[] = [];

        await Promise.all(posts.map(async (post) => {
            const deterministicPostUID = DatabaseServiceAdapter.createDeterministicUID({ uid1: userID, uid2: post.id });

            const updatedPost = {
                ...post,
                // Remove the original data source to allow this post to be created again
                dataSource: {
                    ...post.dataSource
                },
                // Create a deterministic UID to avoid collisions with original media, but also prevent creating duplicate sets of mock posts since these posts are for 
                // testing purposes and are assigned to a shadow user, so their lifecycle should be thoroughly controlled
                id: deterministicPostUID,
                // Assign the post to the target user
                userID
            } as FMUserPost

            mockedPosts.push(await this.createPost(updatedPost) ?? updatedPost);
        }))

        return mockedPosts.filter(Boolean);
    }
}