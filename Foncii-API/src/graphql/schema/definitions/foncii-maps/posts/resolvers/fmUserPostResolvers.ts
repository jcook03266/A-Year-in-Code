// Dependencies
// Types
import { ServerContext } from "../../../../../../types/namespaces/gql-server-api";
import {
  FMIntegrationProviders,
  InfluencerLeaderboardCategory,
} from "../../../../../../types/common";
import { SortOrders } from "../../../../../../types/namespaces/database-api";

// Services
import FonciiMapsPostService from "../../../../../../business-logic/services/foncii-maps/user-posts/fmPostService";
import UserService from "../../../../../../business-logic/services/shared/users/userService";
import PostImportationService from "../../../../../../business-logic/services/foncii-maps/user-posts/postImportationService";
import FMIntegrationCredentialService from "../../../../../../business-logic/services/foncii-maps/users/fmIntegrationCredentialService";
import EventService from "../../../../../../business-logic/services/events/eventService";
import FMIntegrationService from "../../../../../../business-logic/services/foncii-maps/user-posts/integrations/protocol/fmIntegrationService";
import RestaurantService from "../../../../../../business-logic/services/shared/restaurants/restaurantService";

// Microservices
import { MicroserviceRepository } from "../../../../../../core-foncii/microservices/repository/microserviceRepository";

// Formatting
import {
  formattedCreatorUsername,
  possessiveFormattedUsernameCopy,
} from "../../../../../../foncii-toolkit/formatting/stringFormatting";

// Error Coding
import ErrorCodeDispatcher from "../../../../../../core-foncii/error-coding/errorCodeDispatcher";

// Utilities
import lodash from "lodash";

// Shared
import { populateFonciiRestaurantFields } from "../../../shared/restaurants/resolvers/restaurantResolvers";
import { UserAPIMiddleware } from "../../../shared/users/resolvers/userResolvers";

// Logging
import logger from "../../../../../../foncii-toolkit/debugging/debugLogger";

// Service Definitions
const fmPostService = () => new FonciiMapsPostService(),
  fmUserService = () => new UserService(),
  eventService = () => new EventService(),
  restaurantService = () => new RestaurantService();

const resolvers = {
  // Enums
  InfluencerLeaderboardCategory: {
    TOP_RATED: "TOP_RATED",
    TRENDING: "TRENDING",
    NEW: "NEW",
  },

  /**
   * Keep this resolver's values in sync with the `PostMediaType` union type definition
   * in the common.ts documentation. Likewise any other similar type defs that are adapted
   * from this server's type documentations.
   */
  PostMediaTypes: {
    IMAGE: "IMAGE",
    VIDEO: "VIDEO",
    CAROUSEL_ALBUM: "CAROUSEL_ALBUM",
  },

  // Types / Interfaces
  FMUserPost: {
    fonciiRestaurant(post: FMUserPost) {
      // No regular restaurant, no foncii restaurant
      if (!post.restaurant) return null;

      if (!post.fonciiRestaurant)
        return {
          restaurant: post.restaurant,
        };
      // This will overwrite any data for this field
      else return post.fonciiRestaurant;
    },

    isChildPost(post: FMUserPost) {
      return post.parentPostID != undefined;
    },

    mediaIsVideo(post: FMUserPost) {
      return (
        post.media?.mediaType == "VIDEO" ||
        post.dataSource?.media.mediaType == "VIDEO"
      );
    },

    /**
     * This is a forced computation to ensure that all posts adhere to the policy of:
     * has restaurant data defined = publicly visible. The actual 'isHidden' field will
     * still be updated in the backend whenever needed, but this computed value makes
     * resolving the 'isHidden' field much simpler and less vulnerable to data inconsistencies
     * across migrations.
     *
     * @async
     * @param post
     *
     * @returns -> True if the post doesn't have an associated restaurant defined, false if
     * the post has defined restaurant data joined to its normalized data.
     */
    isHidden(post: FMUserPost & { restaurant?: Restaurant }) {
      return !post.restaurant || post.deletionPending == true;
    },
  },

  Query: {
    async findPublicPostsByUsername(
      _: any,
      args: {
        username: string;
        fonciiRestaurantSearchFilterInput?: {
          reservableOnly: boolean;
        };
        fonciiPostFilterInput?: {
          latestByRestaurant: boolean;
        };
        userPersonalizationInput?: {
          userID?: string; // ID of the user making the request (optional), but when it's provided this is used to compute % match score
          coordinates: CoordinatePoint;
          reservationSearchInput?: ReservationSearchInput;
          includeReservations: boolean;
          includeInfluencerInsights: boolean;
          includeAssociatedPosts: boolean;
          includeAssociatedArticles: boolean;
          includeAssociatedRestaurantAwards: boolean;
        };
        paginationInput: {
          limit: number;
          page: number;
          sortKey?: string;
          sortOrder: SortOrders;
        };
      }) {
      // Parsing
      const {
        username,
        fonciiPostFilterInput,
        fonciiRestaurantSearchFilterInput,
        userPersonalizationInput,
        paginationInput,
      } = args,
        { limit, page } = paginationInput;

      // Note: Posts are fetched from newest to oldest by default so no need to supply the sort parameters here
      const creator = await securelyFetchFMUser({ username }),
        [result, totalPosts] = await Promise.all([
          fmPostService().fetchPublicPostsForUser(
            creator.id,
            limit,
            page,
            fonciiPostFilterInput?.latestByRestaurant ?? false
          ),
          fmPostService().countTotalPublicPostsForUser(creator.id),
        ]);

      const fetchedPosts = result,
        posts = await populateFonciiRestaurantFieldsForPosts({
          postsToMap: fetchedPosts,
          fonciiRestaurantSearchFilterInput,
          userPersonalizationInput
        });

      return {
        posts,
        totalPosts:
          fonciiRestaurantSearchFilterInput?.reservableOnly == true
            ? posts.length
            : totalPosts // If filtered return the current count, else return the total count from the DB
      };
    },

    async findAllPostsByUserID(
      _: any,
      args: {
        userID: string;
        fonciiRestaurantSearchFilterInput?: {
          reservableOnly: boolean;
        };
        userPersonalizationInput?: {
          userID?: string; // ID of the user making the request (optional), but when it's provided this is used to compute % match score
          coordinates: CoordinatePoint;
          reservationSearchInput?: ReservationSearchInput;
          includeReservations: boolean;
          includeInfluencerInsights: boolean;
          includeAssociatedPosts: boolean;
          includeAssociatedArticles: boolean;
          includeAssociatedRestaurantAwards: boolean;
        };
        paginationInput: {
          limit: number;
          page: number;
          sortKey?: string;
          sortOrder: SortOrders;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args, context });

      // Parsing
      const {
        userID,
        fonciiRestaurantSearchFilterInput,
        userPersonalizationInput,
        paginationInput,
      } = args,
        { limit, page } = paginationInput;

      // Fetch and denormalize posts
      // Note: Posts are fetched from newest to oldest by default so no need to supply the sort parameters here
      const [result, totalPosts] = await Promise.all([
        fmPostService().fetchAllPostsForUser(userID, limit, page),
        fmPostService().countTotalPostsForUser(userID),
      ]),
        fetchedPosts = result,
        posts = await populateFonciiRestaurantFieldsForPosts({
          postsToMap: fetchedPosts,
          fonciiRestaurantSearchFilterInput,
          userPersonalizationInput,
        });

      return {
        posts,
        totalPosts:
          fonciiRestaurantSearchFilterInput?.reservableOnly == true
            ? posts.length
            : totalPosts, // If filtered return the current count, else return the total count from the DB
      };
    },

    async findPostByID(_: any, args: { postID: string }) {
      return await fmPostService().findPostWithID(args.postID);
    },

    async getAllPostsMarkedForDeletion(_: any) {
      return (await fmPostService().getAllPostsMarkedForDeletion());
    },

    async searchForPosts(
      _: any,
      args: {
        input: {
          searchQuery: string;
          coordinates: CoordinatePoint;
          searchRadius: number;
        };
        fonciiRestaurantSearchFilterInput?: {
          reservableOnly: boolean;
        };
        userPersonalizationInput?: {
          userID?: string; // ID of the user making the request (optional), but when it's provided this is used to compute % match score
          coordinates: CoordinatePoint;
          reservationSearchInput?: ReservationSearchInput;
          includeReservations: boolean;
          includeInfluencerInsights: boolean;
          includeAssociatedPosts: boolean;
          includeAssociatedArticles: boolean;
          includeAssociatedRestaurantAwards: boolean;
        };
      }
    ) {
      const {
        input,
        fonciiRestaurantSearchFilterInput,
        userPersonalizationInput,
      } = args,
        { coordinates: coordinatePoint, searchRadius: radius } = input;

      const result = await fmPostService().geospatialSearchForPosts({
        coordinatePoint,
        radius,
      }),
        fetchedPosts = result,
        totalPosts = fetchedPosts.length,
        posts = await populateFonciiRestaurantFieldsForPosts({
          postsToMap: fetchedPosts,
          fonciiRestaurantSearchFilterInput,
          userPersonalizationInput,
        });

      return {
        posts,
        totalPosts
      };
    },

    async getUserGalleryHTMLMetadata(_: any, args: { username: string }) {
      const username = args.username,
        user = await securelyFetchFMUser({ username }),
        userID = user.id,
        mapName = user.mapName;

      // Gather and parse the necessary data
      const totalPublicPostCount =
        await fmPostService().countTotalPublicPostsForUser(userID),
        randomPostsSampleSize = 100,
        // Sample 100 possible posts with restaurant data that are publicly visible.
        randomlySelectedPublicPosts =
          await fmPostService().getRandomSampleOfPosts(
            { userID, fonciiRestaurantID: { $exists: true } },
            randomPostsSampleSize
          );

      // Pick a random post from the randomly sampled posts to construct the preview around
      const mainPreviewPost = lodash.sample(randomlySelectedPublicPosts),
        mainPreviewPostRestaurant = (mainPreviewPost as any)
          ?.restaurant as Restaurant,
        previewPostRestaurantCategories =
          mainPreviewPostRestaurant?.categories ?? [],
        previewPostCustomCategories =
          mainPreviewPost?.customUserProperties?.categories ?? [],
        previewPostCategories = [
          ...previewPostRestaurantCategories,
          ...previewPostCustomCategories,
        ],
        restaurantHeroImageURL = mainPreviewPostRestaurant?.heroImageURL,
        fonciiPostMediaURL = mainPreviewPost?.media?.mediaURL,
        fonciiPostVideoMediaThumbnailURL =
          mainPreviewPost?.media?.videoMediaThumbnailURL,
        isPostAVideo = mainPreviewPost?.media?.mediaType == "VIDEO",
        previewImageURL = isPostAVideo
          ? fonciiPostVideoMediaThumbnailURL ?? restaurantHeroImageURL
          : fonciiPostMediaURL,
        restaurantName = mainPreviewPostRestaurant?.name;

      // Keyword composition
      let keywords = randomlySelectedPublicPosts.map((post) => {
        const restaurant = (post as any).restaurant as Restaurant,
          postRestaurantName = restaurant?.name,
          restaurantCategories = restaurant?.categories ?? [],
          customCategories = post.customUserProperties?.categories ?? [],
          restaurantAddressProperties = restaurant?.addressProperties,
          address = restaurantAddressProperties?.formattedAddress,
          countryCode = restaurantAddressProperties?.countryCode,
          zipCode = restaurantAddressProperties?.zipCode ?? "",
          stateCode = restaurantAddressProperties?.stateCode,
          city = restaurantAddressProperties?.city,
          neighborhood = restaurantAddressProperties?.neighborhood,
          website = restaurant?.website ?? "",
          phoneNumber = restaurant?.phoneNumber ?? "",
          generalTags = [
            "Map",
            "Google Maps",
            "Google Map",
            "Foncii Maps",
            "Foncii Map",
            "Social Media",
            "foodie",
            "influencer",
            "influencers",
            "Gallery",
            "User Gallery",
            "Yelp",
            "Google",
            "foodie experiences",
            "local dining",
            "restaurant reviews",
            "restaurant photos",
            "restaurant videos",
            "culinary exploration",
            "food recommendations",
          ];

        return [
          postRestaurantName,
          username,
          mapName,
          ...restaurantCategories,
          ...customCategories,
          address,
          countryCode,
          zipCode,
          stateCode,
          city,
          neighborhood,
          website,
          phoneNumber,
          ...generalTags
        ].filter(Boolean) as string[]; // Filter out undefined keywords
      })
        .flatMap((postKeywords) =>
          postKeywords.map((keyword) => keyword.toLowerCase().trim())
        ) ?? [];

      // Remove duplicates
      keywords = [...new Set(keywords)];

      // Construct the tags using the procured data
      let description = "",
        title = "";

      // Dynamic personalized text content
      const userHasPublicPosts = totalPublicPostCount > 0;
      if (userHasPublicPosts) {
        // A series of categories to display below the description
        const previewPostCategoryString = previewPostCategories
          .filter(Boolean)
          .join(" • "),
          previewPostPriceLevel = mainPreviewPostRestaurant?.priceLevel ?? 0,
          previewPostPriceLevelDollarSigns = "$".repeat(previewPostPriceLevel),
          previewPostWebsite = mainPreviewPostRestaurant?.website ?? "",
          previewPostPhoneNumber = mainPreviewPostRestaurant?.phoneNumber ?? "",
          previewPostAddress = mainPreviewPostRestaurant?.addressProperties.formattedAddress,
          yelpRating = mainPreviewPostRestaurant?.yelpProperties?.rating ?? 0,
          googleRating = mainPreviewPostRestaurant?.googleProperties?.rating ?? 0,
          creatorRating = mainPreviewPost?.customUserProperties?.rating ?? 0;

        // Text description sections
        const yelpRatingDescription =
          yelpRating > 0 ? `Yelp: ${yelpRating.toFixed(1)}` : "",
          googleRatingDescription =
            googleRating > 0 ? `Google: ${googleRating.toFixed(1)}` : "",
          creatorRatingDescription =
            creatorRating > 0 ? `${username}: ${creatorRating.toFixed(1)}` : "",
          ratingDescriptions = [
            creatorRatingDescription,
            yelpRatingDescription,
            googleRatingDescription,
          ]
            .filter(Boolean)
            .join(" - ");

        // Filter out any undefined or empty entries
        const restaurantContactInformation = [
          previewPostAddress,
          previewPostWebsite,
          previewPostPhoneNumber,
        ]
          .filter(Boolean)
          .join(" - "),
          restaurantMetadata = `${previewPostPriceLevelDollarSigns +
            (previewPostCategoryString ? " | " : "")
            } ${previewPostCategoryString}`;

        // Public posts available, display user stats
        description += `Discover a curated collection of ${totalPublicPostCount} exceptional spots just like ${restaurantName} on ${possessiveFormattedUsernameCopy(
          username
        )} Foncii map.`;
        description += "\n";
        description += `\nIndulge in delicious dishes, savor delightful desserts, and immerse yourself in a vibrant and personalized culinary scene. Join ${possessiveFormattedUsernameCopy(
          username
        )} journey and uncover hidden gems through their captivating gallery on Foncii Maps.`;
        description += "\n";
        description += `\n⭐️ ${ratingDescriptions}`;
        description += "\n";
        description += `\n📍 ${restaurantContactInformation}`;
        description += "\n";

        if (restaurantMetadata != "") {
          description += `\n🥘 ${restaurantMetadata}`;
        }

        title = `${formattedCreatorUsername(mapName)} | ${totalPublicPostCount} Experience${totalPublicPostCount > 1 ? "s" : ""}`;
      } else {
        // No public posts, encourage users to visit other maps
        description = `Check out ${possessiveFormattedUsernameCopy(
          username
        )} new map on Foncii Maps and explore other maps by dedicated Foncii foodies too.`;
        title = `${formattedCreatorUsername(mapName)}`;
      }

      // HTMLMetadataResponse
      return {
        title: title,
        description: description,
        keywords: keywords,
        previewImageURL: previewImageURL,
      };
    },

    async userTagAutoCompleteSuggestions(
      _: any,
      args: {
        searchQuery: string;
      }
    ) {
      return await fmPostService().getUserTagAutocompleteSuggestions(
        args.searchQuery
      );
    },

    async fetchPopularUserTags(_: any) {
      return await fmPostService().fetchPopularUserTags();
    },

    async fetchLocalInfluencerLeaderboard(
      _: any,
      args: {
        input: {
          coordinates: CoordinatePoint;
          searchRadius: number;
        };
      }
    ) {
      // Parsing
      const coordinatePoint = args.input.coordinates,
        searchRadius = args.input.searchRadius;

      // Static user account ids to use for demo purposes
      const righteousEatsID = "5UaojkhXNI1yBARG175w",
        jennysBreadBabyID = "NHdl9426e75Y1G2Rz3nJ",
        kristaID = "KXvdXQnTXmbr4D883hsXT8gbX3i2";

      const [
        topRatedUser,
        trendingUser,
        newUser,
        topRatedUserTotalLocalRestaurantsVisitedCount,
        trendingUserTotalLocalRestaurantsVisitedCount,
        newUserTotalLocalRestaurantsVisitedCount,
      ] = await Promise.all([
        fmUserService().findUserWithID(righteousEatsID),
        fmUserService().findUserWithID(jennysBreadBabyID),
        fmUserService().findUserWithID(kristaID),
        fmPostService().countTotalRestaurantsVisitedByUserInArea({
          coordinatePoint,
          radius: searchRadius,
          userID: righteousEatsID,
        }),
        fmPostService().countTotalRestaurantsVisitedByUserInArea({
          coordinatePoint,
          radius: searchRadius,
          userID: jennysBreadBabyID,
        }),
        fmPostService().countTotalRestaurantsVisitedByUserInArea({
          coordinatePoint,
          radius: searchRadius,
          userID: kristaID,
        }),
      ]);

      return [
        {
          category: InfluencerLeaderboardCategory.TOP_RATED,
          user: topRatedUser,
          totalLocalRestaurantsVisited:
            topRatedUserTotalLocalRestaurantsVisitedCount,
        },
        {
          category: InfluencerLeaderboardCategory.TRENDING,
          user: trendingUser,
          totalLocalRestaurantsVisited:
            trendingUserTotalLocalRestaurantsVisitedCount,
        },
        {
          category: InfluencerLeaderboardCategory.NEW,
          user: newUser,
          totalLocalRestaurantsVisited:
            newUserTotalLocalRestaurantsVisitedCount,
        },
      ];
    },

    async getAllPublicPosts(
      _: any,
      args: {
        limit: number,
        pageIndex?: number
      }) {
      // Parsing
      const { limit, pageIndex } = args;

      // Constants
      // Note: There's no limit imposed by the DB, but this is just for practicality
      const MAX_DOCUMENTS_PER_RETRIEVAL = 1000;

      // Pagination (if needed)
      // Force the limit to be > 0, 0 means unlimited which is not the intended behavior of this operation
      const normalizedLimit = (limit > 0 ? limit : 0),
        normalizedPageIndex = (pageIndex && pageIndex > 0 ? pageIndex : 0),
        totalPages = Math.ceil(normalizedLimit / MAX_DOCUMENTS_PER_RETRIEVAL),
        offsetTotalPages = totalPages * (normalizedPageIndex + 1),
        totalPagesToSkip = totalPages * (normalizedPageIndex),
        resultsPerPage = Math.min(normalizedLimit, MAX_DOCUMENTS_PER_RETRIEVAL);

      // Optional offset
      const startIndex = totalPagesToSkip;

      // Accumulator
      const posts: FMUserPost[] = [];

      for (let i = startIndex; i < offsetTotalPages; i++) {
        const postBatch = (await fmPostService()
          .getAllPublicPostsNormalized(resultsPerPage, i));

        // Stop querying once the break out condition is met
        if (postBatch.length < 1) break;

        posts.push(...postBatch);
      }

      return posts;
    }
  },

  Mutation: {
    async duplicatePost(
      _: any,
      args: { sourcePostID: string },
      context: ServerContext
    ) {
      // Ensure that the source post to duplicate actually exists
      const sourcePost = await fmPostService().findPostWithID(
        args.sourcePostID
      );

      if (sourcePost) {
        // Parse author data
        const userID = sourcePost.userID;

        // Ensure the requesting using is the author
        UserAPIMiddleware.userAuthorizationGateway({ userID, context });

        // Duplicate the post
        const duplicatedPost = await fmPostService().duplicateFMPost(
          args.sourcePostID
        );

        if (!duplicatedPost) return null;
        else
          return {
            ...duplicatedPost,
            fonciiRestaurant: {
              restaurant: duplicatedPost.restaurant,
            },
          };
      } else {
        // Error handler
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.GenericAPIErrors.ENTITY_NOT_FOUND,
          `A source post with the uid ${args.sourcePostID} could not be found and duplicated.`,
          ErrorCodeDispatcher.HTTPStatusCodes.NOT_FOUND
        );

        return null;
      }
    },

    async importPosts(
      _: any,
      args: {
        input: {
          integrationCredentialID: string;
          straddleImport?: boolean; // True if all supported import methods should be used (ex.) Basic Display + Scraper), true by default
          classifyPosts?: boolean; // True if posts should be automatically classified, false otherwise, true by default
          isFirstImport?: boolean; // True if the user just created their account and are importing posts for the first time, false by default
        };
      },
      context: ServerContext
    ) {
      // Parsing
      const { input } = args,
        {
          integrationCredentialID,
          straddleImport,
          classifyPosts,
          isFirstImport,
        } = input;

      // Integration credential fetching
      const integrationCredentialService = new FMIntegrationCredentialService(),
        fetchedIntegrationCredential = await integrationCredentialService.findIntegrationCredentialWithID(
          integrationCredentialID
        );

      // Ensure the required integration credential is available
      if (!fetchedIntegrationCredential) {
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.GenericAPIErrors.REQUEST_FAILED,
          `An integration credential with the ID ${integrationCredentialID} could not be found. It's either an invalid id 
                    or the credential has been revoked. Please generate a new valid credential in order to import user posts`,
          ErrorCodeDispatcher.HTTPStatusCodes.UNAUTHORIZED
        );

        return;
      }

      // Try to import posts with the fetched integration credential
      const postImportationService = new PostImportationService(
        fetchedIntegrationCredential
      ),
        userID = fetchedIntegrationCredential.userID;

      UserAPIMiddleware.userAuthorizationGateway({ userID, context });

      return await postImportationService.importPosts({
        useAuxillaryService: straddleImport,
        classificationEnabled: classifyPosts,
        isFirstImport,
      });
    },

    async updatePostFavoriteState(
      _: any,
      args: {
        input: {
          userInput: {
            postID: string;
            userID: string;
          };
          isFavorited: boolean;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({
        ...args.input.userInput,
        context,
      });

      const userInput = args.input.userInput,
        postID = userInput.postID,
        userID = userInput.userID,
        isFavorited = args.input.isFavorited;

      // Authorization Check
      await throwIfPostDoesNotBelongToUser({ userID, postID });

      const didSucceed = await fmPostService().updatePost(postID, {
        isFavorited,
      });

      // Event logging
      if (didSucceed) {
        eventService().resolvePostUpdateEvent({
          userID,
          sessionID: context.requesterSessionID,
        });
      }

      return didSucceed;
    },

    async updatePostRestaurantData(
      _: any,
      args: {
        input: {
          userInput: {
            postID: string;
            userID: string;
          };
          googlePlaceID?: string;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({
        ...args.input.userInput,
        context,
      });

      const userInput = args.input.userInput,
        postID = userInput.postID,
        userID = userInput.userID,
        googlePlaceID = args.input.googlePlaceID;

      // Authorization Check
      await throwIfPostDoesNotBelongToUser({ userID, postID });

      const didSucceed = await fmPostService().updateAssociatedRestaurantData({
        postID,
        googlePlaceID,
      });

      // Event logging
      if (didSucceed) {
        eventService().resolvePostUpdateEvent({
          userID,
          sessionID: context.requesterSessionID,
        });
      }

      return didSucceed ? await fmPostService().findPostWithID(postID) : null;
    },

    async updatePostCustomUserProperties(
      _: any,
      args: {
        input: {
          userInput: {
            postID: string;
            userID: string;
          };
          notes?: string;
          rating?: number;
          categories?: string[];
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({
        ...args.input.userInput,
        context,
      });

      const userInput = args.input.userInput,
        postID = userInput.postID,
        userID = userInput.userID,
        notes = args.input.notes ?? "",
        rating = args.input.rating ?? 0,
        categories = args.input.categories ?? [],
        customUserProperties = { notes, rating, categories };

      // Authorization Check
      await throwIfPostDoesNotBelongToUser({ userID, postID });
      const didSucceed = await fmPostService().updateCustomUserProperties(
        postID,
        customUserProperties
      );

      // Event logging
      if (didSucceed) {
        eventService().resolvePostUpdateEvent({
          userID,
          sessionID: context.requesterSessionID,
        });
      }

      return didSucceed ? await fmPostService().findPostWithID(postID) : null;
    },

    async updatePostMedia(
      _: any,
      args: {
        input: {
          userInput: {
            postID: string;
            userID: string;
          };
          mediaInput: FMUserPostMedia;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({
        ...args.input.userInput,
        context,
      });

      // Extraction
      const { userInput, mediaInput } = args.input,
        postID = userInput.postID,
        userID = userInput.userID,
        videoMediaThumbnailURL = mediaInput.videoMediaThumbnailURL,
        mediaType = mediaInput.mediaType;

      // Precondition failure
      // Videos require a thumbnail image too
      if (mediaType == "VIDEO" && !videoMediaThumbnailURL) {
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.GenericAPIErrors.REQUEST_FAILED,
          `Video-media updates require a valid video thumbnail image URL`,
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
        );
      }

      // Albums aren't supported, only single image uploads, albums from other data sources aren't supported either
      // those are just single images, the rest of the media edges aren't used / stored by Foncii but the media type
      // still denotes album because that was the original data source's type for it
      if (mediaType == "CAROUSEL_ALBUM") {
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.GenericAPIErrors.REQUEST_FAILED,
          `Carousel album-media updates are not supported at this time`,
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
        );
      }

      // Authorization Check
      await throwIfPostDoesNotBelongToUser({ userID, postID });

      // Loading
      const didSucceed = await fmPostService().updatePostMedia({
        postID,
        media: mediaInput,
      });

      // Event logging
      if (didSucceed) {
        eventService().resolvePostUpdateEvent({
          userID,
          sessionID: context.requesterSessionID,
        });
      }

      return didSucceed ? await fmPostService().findPostWithID(postID) : null;
    },

    async createUserPost(
      _: any,
      args: {
        input: {
          userID: string;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      const input = args.input,
        userID = input.userID,
        sessionID = context.requesterSessionID;

      const newPost = await fmPostService().createPost({ userID });

      if (newPost) {
        eventService().resolvePostCreationEvent({ userID, sessionID });

        return await fmPostService().findPostWithID(newPost.id);
      } else {
        return null;
      }
    },

    async deletePost(
      _: any,
      args: {
        input: {
          postID: string;
          userID: string;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      // Parsing
      const { input } = args,
        { postID } = input;

      // Authorization Check
      await throwIfPostDoesNotBelongToUser(input);

      return await fmPostService().markPostForDeletion(postID);
    },

    async forceDeletePost(
      _: any,
      args: { input: { postID: string; userID: string } },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      // Parsing
      const { input } = args,
        { postID, userID } = input;

      // Authorization Check
      await throwIfPostDoesNotBelongToUser(input);

      const post = (await fmPostService().findPostWithID(postID)) ?? undefined;

      // Precondition failure, no post to delete
      if (!post) return false;

      const didSucceed = await fmPostService().deletePost({
        postID,
        fetchedPost: post,
      });

      // Event logging
      if (didSucceed) {
        eventService().resolvePostDeletionEvent({
          userID,
          userPostData: post,
          sessionID: context.requesterSessionID,
        });
      }

      return didSucceed;
    },

    async undeletePost(
      _: any,
      args: {
        input: {
          postID: string;
          userID: string;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      // Parsing
      const { input } = args,
        { postID } = input;

      // Authorization Check
      await throwIfPostDoesNotBelongToUser(input);

      return await fmPostService().unmarkPostForDeletion(postID);
    },

    async ingestClassifiedDiscoveredInstagramPosts(
      _: any,
      args: {
        input: {
          /** The username of the author of the posts */
          username: string;
          posts: {
            dataSource: PostDataSource;
            googlePlaceIDs: string[];
            gpidToInstagramHandleMappings: {
              googlePlaceID: string;
              instagramHandle: string;
            }[];
          }[];
        };
      }
    ) {
      // Parsing
      const input = args.input,
        { username, posts } = input;

      // Accumulators
      const ingestedPosts: FMUserPost[] = [],
        updatedPosts: FMUserPost[] = [];

      const author = await fmUserService().findUserWithUsername(username),
        userID = author?.id;

      // Precondition failure, no author to associate posts with
      if (!author || !userID) return [];

      async function processRoundUpPostEdges({
        additionalGooglePlaceIDs,
        postID,
      }: {
        additionalGooglePlaceIDs: string[];
        postID: string;
      }) {
        // Note: Not parallelized b/c aggregating restaurants can incur a rate limit if too many requests are sent per second
        additionalGooglePlaceIDs
          .forEach(async (googlePlaceID) => {
            // Child / duplicate post of the newly ingested post
            const duplicatedPost = await fmPostService().duplicateFMPost(postID),
              duplicatedPostID = duplicatedPost?.id;

            // Post duplicated successfully
            if (duplicatedPostID && duplicatedPost) {
              // Associate the child post with the associated restaurant derived from the current GPID
              await fmPostService().updateAssociatedRestaurantData({
                postID,
                googlePlaceID
              });
            } else {
              // Shouldn't happen, but good catch just in case
              logger.error(
                `[ingestClassifiedDiscoveredInstagramPosts] Post duplication failed. Post ID ${postID} | GPID: ${googlePlaceID} | GPIDs: ${additionalGooglePlaceIDs}`
              );
            }
          });
      }

      /**
       * Creates a new post if the discovered instagram post doesn't already exist in our database
       * with the associated user, else updates the existing posts referenced
       */
      await Promise.all(
        posts.map(async (post) => {
          // Parsing
          const googlePlaceIDs = post.googlePlaceIDs,
            liveSourceUID = post.dataSource.liveSourceUID;

          // Update the data source to include the required provider field ~ Instagram since that's the only provider for this
          // ingestion method
          post.dataSource = {
            ...post.dataSource,
            provider: FMIntegrationProviders.Instagram,
          };

          const newPost = await fmPostService().createPost({
            ...post,
            userID,
          });

          // New post, associate it with the required restaurant data
          // accumulate, and continue
          if (newPost) {
            // Parsing
            const postID = newPost.id,
              primaryGooglePlaceID = googlePlaceIDs[0],
              additionalGooglePlaceIDs = googlePlaceIDs;

            // Remove the primary (first) place ID, it's already consumed by the branching process below
            additionalGooglePlaceIDs.shift();

            // Round up post logic for new posts
            /**
             * If multiple places were mentioned in the post, then post is treated as a round up post. Carousels, videos,
             * or single image posts can all be 'round-up' posts so long as multiple establishments are mentioned and 
             * recognized.
             */
            const isARoundUpPost =
              additionalGooglePlaceIDs.length &&
              additionalGooglePlaceIDs.length > 0;

            // Update the primary post's associated restaurant data remotely
            if (primaryGooglePlaceID) {
              await fmPostService().updateAssociatedRestaurantData({
                postID,
                googlePlaceID: primaryGooglePlaceID,
              });
            }

            // Round up posts only
            /**
             * If additional google place IDs exist then create child (duplicate) posts for the main post
             * and associate those child posts with a respective restaurant
             */
            if (isARoundUpPost) {
              await processRoundUpPostEdges({
                additionalGooglePlaceIDs,
                postID
              });
            }

            // Add the ingested post to the accumulator
            ingestedPosts.push(newPost.toObject());
          } else {
            /**
             * Old or malformed post, find the existing post
             * partially update its data source information,
             * associate it with the required restaurant data
             * accumulate, and continue
             */
            // Find existing post belonging to the given user that matches
            // the post being ingested
            const existingPost = await fmPostService()
              .findPostWith({
                userID,
                "dataSource.liveSourceUID": liveSourceUID
              });

            if (existingPost) {
              // Parsing
              const postID = existingPost.id,
                existingDataSource = existingPost.dataSource,
                primaryGooglePlaceID = googlePlaceIDs[0],
                additionalGooglePlaceIDs = googlePlaceIDs;

              // Remove the primary (first) place ID, it's already consumed by the branching process below
              additionalGooglePlaceIDs.shift();

              // Should always exist since it's used to fetch this post, just unwrapping an optional
              if (existingDataSource) {
                existingPost.dataSource = {
                  ...existingDataSource,
                  liveSourceUID: post.dataSource.liveSourceUID,
                  provider: FMIntegrationProviders.Instagram,
                  media: post.dataSource.media,
                  secondaryMedia: post.dataSource.secondaryMedia,
                };

                // Update the post's data source information
                await fmPostService().updatePost(postID, {
                  dataSource: existingPost.dataSource,
                });
              }

              // Round up post logic for existing user posts
              const isARoundUpPost =
                additionalGooglePlaceIDs.length &&
                additionalGooglePlaceIDs.length > 0,
                postHasChildren = await fmPostService()
                  .doesPostHaveChildren(postID),
                postIsAChildOfAnother = existingPost.parentPostID != undefined,
                // Only round-up for parent posts with no already existing children
                postRoundUpIsPossible = isARoundUpPost
                  && !postHasChildren
                  && !postIsAChildOfAnother;

              // Update the post's associated restaurant data remotely
              if (primaryGooglePlaceID) {
                await fmPostService().updateAssociatedRestaurantData({
                  postID,
                  googlePlaceID: primaryGooglePlaceID,
                });
              }

              // Round up posts only
              // ~
              if (postRoundUpIsPossible) {
                await processRoundUpPostEdges({
                  additionalGooglePlaceIDs,
                  postID
                });
              }

              // Accumulate updated posts
              updatedPosts.push(existingPost);
            } else {
              // Malformed post, does not exist and can't be created, log and continue
              logger.error(`[ingestClassifiedDiscoveredInstagramPosts] Malformed post 
                    ingestion attempt dataSource: ${post.dataSource} | userID: ${userID} | GPIDs: ${googlePlaceIDs}`);
            }
          }
        })
      );

      // Upload pending user post media for any ingested / applicable updated posts
      const mediaUploadPending =
        ingestedPosts.length > 0 ||
        FMIntegrationService.isMediaUploadPending(updatedPosts);

      if (mediaUploadPending) {
        MicroserviceRepository.fonciiMedia().uploadUserPostMediaFor(userID);
      }

      // Update any restaurants w/ their social media handles [Background Process, Don't await]
      Promise.all(
        posts.map(async (post) => {
          const { gpidToInstagramHandleMappings } = post;

          // Update each classified restaurant with their respective instagram handle
          gpidToInstagramHandleMappings.map((mapping) => {
            const { googlePlaceID, instagramHandle } = mapping;
            restaurantService().addInstagramHandleForRestaurant({
              googlePlaceID,
              instagramHandle,
            });
          });
        })
      );

      return ingestedPosts;
    },

    async ingestDiscoveredInstagramPosts(
      _: any,
      args: {
        input: {
          /** The username of the author of the posts */
          username: string;
          posts: {
            dataSource: PostDataSource;
          }[];
        };
      }
    ) {
      // Parsing
      const input = args.input,
        { username, posts } = input;

      // Accumulators
      const ingestedPosts: FMUserPost[] = [],
        updatedPosts: FMUserPost[] = [];

      const author = await fmUserService().findUserWithUsername(username),
        userID = author?.id;

      // Precondition failure, no author to associate posts with
      if (!author || !userID) return [];

      /**
       * Creates a new post if the discovered instagram post doesn't already exist in our database
       * with the associated user, else updates the existing posts referenced
       */
      await Promise.all(
        posts.map(async (post) => {
          // Parsing
          const liveSourceUID = post.dataSource.liveSourceUID;

          // Update the data source to include the required provider field ~ Instagram since that's the only provider for this
          // ingestion method
          post.dataSource = {
            ...post.dataSource,
            provider: FMIntegrationProviders.Instagram,
          };

          const newPost = await fmPostService().createPost({
            ...post,
            userID,
          });

          // Add the ingested post to the accumulator
          if (newPost) {
            ingestedPosts.push(newPost.toObject());
          } else {
            /**
             * Old or malformed post, find the existing post
             * partially update its data source information,
             * accumulate, and continue
             */
            // Find existing post belonging to the given user that matches
            // the post being ingested
            const existingPost = await fmPostService().findPostWith({
              userID,
              "dataSource.liveSourceUID": liveSourceUID,
            });

            if (existingPost) {
              // Parsing
              const postID = existingPost.id,
                existingDataSource = existingPost.dataSource;

              // Should always exist since it's used to fetch this post, just unwrapping an optional
              if (existingDataSource) {
                existingPost.dataSource = {
                  ...existingDataSource,
                  provider: FMIntegrationProviders.Instagram,
                  media: post.dataSource.media,
                  secondaryMedia: post.dataSource.secondaryMedia,
                };

                // Update the post's data source information
                await fmPostService().updatePost(postID, {
                  dataSource: existingPost.dataSource,
                });
              }

              // Accumulate updated posts
              updatedPosts.push(existingPost);
            } else {
              // Malformed post, does not exist and can't be created, log and continue
              logger.error(`[ingestDiscoveredInstagramPosts] Malformed post 
                        ingestion attempt dataSource: ${post.dataSource} | userID: ${userID}`);
            }
          }
        })
      );

      // Upload pending user post media for any ingested / applicable updated posts
      const mediaUploadPending =
        ingestedPosts.length > 0 ||
        FMIntegrationService.isMediaUploadPending(updatedPosts);

      if (mediaUploadPending) {
        MicroserviceRepository.fonciiMedia().uploadUserPostMediaFor(userID);
      }

      return ingestedPosts;
    },
  },
};

// Field Resolver Helpers
async function populateFonciiRestaurantFieldsForPosts({
  postsToMap,
  fonciiRestaurantSearchFilterInput,
  userPersonalizationInput,
  sort = false,
}: {
  postsToMap: FMUserPost[];
  fonciiRestaurantSearchFilterInput?: {
    reservableOnly: boolean;
  };
  userPersonalizationInput?: {
    userID?: string; // ID of the user making the request (optional), but when it's provided this is used to compute % match score
    coordinates: CoordinatePoint;
    reservationSearchInput?: ReservationSearchInput;
    includeReservations: boolean;
    includeInfluencerInsights: boolean;
    includeAssociatedPosts: boolean;
    includeAssociatedArticles: boolean;
    includeAssociatedRestaurantAwards: boolean;
  };
  sort?: boolean;
}) {
  let posts = [...postsToMap];

  // Deduplicating restaurants to reduce the work needed by sharing populated restaurant data between posts
  // with the same restaurant id
  const deduplicatedRestaurants: { [fonciiRestaurantID: string]: Restaurant } = {};

  posts.forEach((post) => {
    // Parsing
    const restaurant = post.restaurant as Restaurant | undefined,
      restaurantID = restaurant?.id;

    if (restaurantID) deduplicatedRestaurants[restaurantID] = restaurant;
  });

  const restaurants = Object.values(deduplicatedRestaurants),
    fonciiRestaurants = await populateFonciiRestaurantFields({
      restaurants,
      fonciiRestaurantSearchFilterInput,
      userPersonalizationInput
    });

  // Map the posts to their respective foncii restaurant data fields
  posts = posts.map((post) => {
    return {
      ...post,
      fonciiRestaurant: fonciiRestaurants.find(
        (fonciiRestaurant) =>
          fonciiRestaurant.restaurant.id == post.restaurant?.id
      ), // Important: Post.restaurant is optional, unwrap always
    };
  });

  // Filtering
  // Filter out any posts with foncii restaurants that are not reservable (if reservableOnly is true)
  posts = posts.filter((post) => {
    // Return all elements if reservable only isn't applied
    if ((fonciiRestaurantSearchFilterInput?.reservableOnly ?? false) == false)
      return true;
    else
      return (
        post.fonciiRestaurant?.reservationsAvailable == true &&
        fonciiRestaurantSearchFilterInput?.reservableOnly == true
      );
  });

  // Sorting
  // Return the list of foncii restaurants sorted by their percent match scores (if any)
  if (sort) {
    posts.sort((a, b) => {
      return (
        (b.fonciiRestaurant?.percentMatchScore ?? 0) -
        (a.fonciiRestaurant?.percentMatchScore ?? 0)
      );
    });
  }

  return posts;
}

// Reusable Methods with GraphQL Throwable Logic //
/**
 * @async
 * @param post
 * @param userID
 *
 * @returns -> True if the post belongs to the user, false otherwise.
 */
const doesPostBelongToUser = async ({
  postID,
  userID,
}: {
  postID: string;
  userID: string;
}): Promise<Boolean> => {
  return await fmPostService().doesUserOwnPost(userID, postID);
};

/**
 * Throws an exception if the post does not belong to the user with the given ID.
 *
 * @param post
 * @param userID
 */
const throwIfPostDoesNotBelongToUser = async (args: {
  postID: string;
  userID: string;
}) => {
  if (!(await doesPostBelongToUser(args))) {
    ErrorCodeDispatcher.throwGraphQLError(
      ErrorCodeDispatcher.UserAPIErrors.USER_NOT_AUTHORIZED,
      `The specified user with the ID: ${args.userID}, does not own the 
                rights to the post with the ID: ${args.postID}.`,
      ErrorCodeDispatcher.HTTPStatusCodes.UNAUTHORIZED
    );
  }
};

/**
 * Fetches the Foncii Maps user data from the database with the given user ID or username,
 * and throws a verbose GraphQL error if the user is not found. This method is
 * deterministic and will result in a defined output if an error is not thrown.
 *
 * @async
 * @param userID -> Optional user ID to fetch the user data with. Required if username is not specified.
 * @param username -> Optional username to fetch the user data with. Required if userID is not specified.
 *
 * @returns -> Defined user data if the given parameters are valid, null otherwise.
 */
export const securelyFetchFMUser = async ({
  userID = undefined,
  username = null,
}: {
  userID?: string | undefined;
  username?: string | null;
}): Promise<FMUser> => {
  let user: FMUser | null = null;

  // Username specified
  if (username != null) {
    if (username == "" || username == undefined) {
      ErrorCodeDispatcher.throwGraphQLError(
        ErrorCodeDispatcher.UserAPIErrors.USER_NOT_SPECIFIED,
        "Please specify a valid username",
        ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
      );
    }

    // Fetch data
    user = await fmUserService().findUserWithUsername(username);
  } else {
    // Not input specified
    if (userID == "" || userID == undefined) {
      ErrorCodeDispatcher.throwGraphQLError(
        ErrorCodeDispatcher.UserAPIErrors.USER_NOT_SPECIFIED,
        "Please specify a valid user ID",
        ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
      );
    }

    // Fetch data
    user = await fmUserService().findUserWithID(userID!);
  }

  // Not Found
  if (!user) {
    ErrorCodeDispatcher.throwGraphQLError(
      ErrorCodeDispatcher.UserAPIErrors.USER_NOT_FOUND,
      `The Foncii Maps user: ${userID ?? username} could not be found. Please specify a valid user identifier.`,
      ErrorCodeDispatcher.HTTPStatusCodes.NOT_FOUND
    );
  }

  return user!;
};

export default resolvers;
