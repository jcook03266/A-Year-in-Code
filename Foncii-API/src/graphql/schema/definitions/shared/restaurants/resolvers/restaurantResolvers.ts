// Dependencies
// Types
import { ReservationProviders, RestaurantAutoCompleteSuggestionSources, UserRoles } from "../../../../../../types/common";
import { ServerContext } from "../../../../../../types/namespaces/gql-server-api";

// Models
import TasteProfileModel from "../../../../../../models/shared/tasteProfileModel";
import ExploreSearchEventModel from "../../../../../../models/events/exploreSearchEventModel";

// Services
import FonciiMapsPostService from "../../../../../../business-logic/services/foncii-maps/user-posts/fmPostService";
import RestaurantService from "../../../../../../business-logic/services/shared/restaurants/restaurantService";
import ReservationService from "../../../../../../business-logic/services/shared/restaurants/reservationService";
import RecognizedService from "../../../../../../business-logic/services/shared/restaurants/recognizedService";
import PercentMatchService from "../../../../../../business-logic/services/percent-match/percentMatchService";
import TasteProfileService from "../../../../../../business-logic/services/taste-profile/tasteProfileService";
import RestaurantAggregator from "../../../../../../business-logic/services/shared/restaurants/restaurantAggregator";
import UserService from "../../../../../../business-logic/services/shared/users/userService";
import EventService from "../../../../../../business-logic/services/events/eventService";
import { DatabaseServiceAdapter } from "../../../../../../business-logic/services/database/databaseService";

// Utilities
import { upperFirst } from "lodash";
import { ISOStringToDate, currentDateAsISOString } from "../../../../../../foncii-toolkit/utilities/convenienceUtilities";
import { computeLevenshteinDistance } from "../../../../../../foncii-toolkit/math/collectionMath";
import { isBusinessOpen } from "../../../../../../foncii-toolkit/utilities/time";
import { delay } from "../../../../../../foncii-toolkit/utilities/scheduling";
import { sha256Hash } from "../../../../../../foncii-toolkit/utilities/security";

// Service Definitions
const restaurantService = () => new RestaurantService(),
    userService = () => new UserService(),
    restaurantAggregator = () => new RestaurantAggregator(),
    reservationService = () => new ReservationService(),
    recognizedService = () => new RecognizedService(),
    tasteProfileService = () => new TasteProfileService(),
    percentMatchService = () => new PercentMatchService(),
    fmPostService = () => new FonciiMapsPostService(),
    eventService = () => new EventService();

// Constants
const defaultReservationPartySize = 2;

const resolvers = {
    // Enums - Important: Make sure enums match the Foncii-API type definition documentation in common.ts, 
    // that's the single source of truth.
    RestaurantAutoCompleteSuggestionSources: {
        FONCII: 0,
        GOOGLE: 1
    },

    ReservationProviders: {
        RESY: 0
    },

    // Types / Unions / Interfaces
    // Union Abstract Type Resolver
    ExploreSearchAutoCompleteSuggestion: {
        __resolveType(autoCompleteSuggestion: any) {
            // Only RestaurantAutoCompleteSuggestion has a source field
            if (autoCompleteSuggestion.source != undefined) {
                return 'RestaurantAutoCompleteSuggestion';
            }

            // Only UserPostAutoCompleteSuggestion has a postID field
            if (autoCompleteSuggestion.postID != undefined) {
                return 'UserPostAutoCompleteSuggestion';
            }

            // Only UserAutoCompleteSuggestion has a userID field
            if (autoCompleteSuggestion.userID != undefined) {
                return 'UserAutoCompleteSuggestion';
            }

            return 'PopularSearchQuerySuggestion'; // Follows the default auto-complete suggestion template / protocol, no other attributes attached to this type
        },
    },

    Restaurant: {
        /** 
         * Resolves hero image URLs for restaurants with no hero image, this allows the restaurant to be discoverable
         * despite the lack of data. The flow goes like this:
         * no hero image -> find image from google places images collection 
         * | no google places images -> find a post with the restaurant associated and use that post's media as a donor (last resort)
         * | no post -> return undefined (no hero image (worst case scenario))
         * 
         * The ultimate solution for restaurants with no hero is to manually add these images down the line, but this is a
         * good stand-in for edge-case scenarios.
         */
        async heroImageURL(restaurant: Restaurant) {
            if (restaurant.heroImageURL != null) return restaurant.heroImageURL;

            // Source the hero image from stored Google images
            let heroImageURL: string | undefined = restaurant.imageCollectionURLs?.[0];

            // Nothing there either, try to find it from a user post [last resort]
            if (!heroImageURL) {
                const post = await fmPostService().findPostWith({ fonciiRestaurantID: restaurant.id });

                if (post)
                    heroImageURL = post.media?.mediaType == 'VIDEO' ? post.media?.videoMediaThumbnailURL : post.media?.mediaURL;
            }

            return heroImageURL

        }
    },

    FonciiRestaurant: {
        isOpen(fonciiRestaurant: FonciiRestaurant) {
            const utcOffset = fonciiRestaurant.restaurant.utcOffset,
                operatingHours = fonciiRestaurant.restaurant.operatingHours;

            if (operatingHours != undefined && utcOffset != undefined) {
                return isBusinessOpen({
                    operatingHours,
                    utcOffset
                });
            }

            return undefined; // Unable to determine open status
        },

        async averageFonciiRating(fonciiRestaurant: FonciiRestaurant) {
            if (fonciiRestaurant.averageFonciiRating != null) return fonciiRestaurant.averageFonciiRating;

            return await fmPostService().computeAverageFonciiRatingForRestaurant(fonciiRestaurant.restaurant.id);
        },

        async percentMatchScore(
            fonciiRestaurant: FonciiRestaurant,
            args: {
                userPersonalizationInput?: {
                    userID?: string, // ID of the user making the request (optional), but when it's provided this is used to compute % match score
                    coordinates: CoordinatePoint,
                }
            }) {
            if (fonciiRestaurant.percentMatchScore != null) return fonciiRestaurant.percentMatchScore;

            // Parsing
            const restaurant = fonciiRestaurant.restaurant,
                { userID, coordinates } = args.userPersonalizationInput ?? {};

            // Precondition failure
            if (!userID || !coordinates) return fonciiRestaurant.percentMatchScore;

            // Percent Match Score //
            let percentMatchScore: number | undefined = undefined

            // Taste profile fetching
            const tasteProfile = await tasteProfileService().getTasteProfileForUser(userID),
                userTasteProfile = TasteProfileModel.fromObject(tasteProfile);

            if (userTasteProfile) {
                // Compute % match score for the current restaurant based on location and taste profile 
                percentMatchScore = await percentMatchService()
                    .computePercentMatchScore({
                        userLocation: coordinates,
                        userTasteProfile,
                        restaurant
                    });
            }

            return percentMatchScore;
        },

        async qualityScore(fonciiRestaurant: FonciiRestaurant) {
            if (fonciiRestaurant.qualityScore != null) return fonciiRestaurant.qualityScore;

            // Parsing
            const restaurant = fonciiRestaurant.restaurant;

            // Computation
            const qualityScore = await percentMatchService()
                .getRestaurantQualityScore({ restaurant });

            return qualityScore;
        },

        async averagePercentMatchScore(
            fonciiRestaurant: FonciiRestaurant,
            args: {
                userIDs: string[],
                coordinates: CoordinatePoint
            }) {
            if (fonciiRestaurant.averagePercentMatchScore != null) return fonciiRestaurant.averagePercentMatchScore;

            // Parsing
            const restaurant = fonciiRestaurant.restaurant,
                { userIDs, coordinates } = args;

            // Precondition failure
            if (!userIDs || userIDs?.length == 0 || !coordinates) return fonciiRestaurant.averagePercentMatchScore;

            // Taste profile fetching
            const fetchedTasteProfiles = (await Promise.all(userIDs.map((userID) => {
                return tasteProfileService().getPrimaryTasteProfileForUser({ userID });
            }))).filter(Boolean) as TasteProfile[];

            // Convert the taste profile JSON data into its model form to ensure data integrity
            const tasteProfiles = fetchedTasteProfiles.map((fetchedTasteProfile) => {
                return TasteProfileModel.fromObject(fetchedTasteProfile);
            }).filter(Boolean) as TasteProfileModel[];

            const averagePercentMatchScore = await percentMatchService()
                .computeAveragePercentMatchScoreForUsers({
                    userLocation: coordinates,
                    tasteProfiles,
                    restaurant
                });

            return averagePercentMatchScore;
        },

        async isSaved(
            fonciiRestaurant: FonciiRestaurant,
            args: {
                userPersonalizationInput?: {
                    userID?: string, // ID of the user making the request (optional)
                }
            }) {
            if (fonciiRestaurant.isSaved != null) return fonciiRestaurant.isSaved;

            // Parsing
            const fonciiRestaurantID = fonciiRestaurant.restaurant.id,
                { userID } = args.userPersonalizationInput ?? {};

            // Precondition failure
            if (!userID) return false;

            return await restaurantService().isRestaurantSavedByUser({ userID, fonciiRestaurantID });
        },

        async isReservable(fonciiRestaurant: FonciiRestaurant) {
            if (fonciiRestaurant.isReservable != null) return fonciiRestaurant.isReservable;

            return await reservationService().doesRestaurantSupportReservations(fonciiRestaurant.restaurant.id);
        },

        async reservationsAvailable(
            fonciiRestaurant: FonciiRestaurant,
            args: {
                userPersonalizationInput?: {
                    reservationSearchInput?: ReservationSearchInput
                }
            }) {
            if (fonciiRestaurant.reservationsAvailable != null) return fonciiRestaurant.reservationsAvailable;

            // Use this already resolved field to compute this, if not resolved then use the reservation service
            if (fonciiRestaurant.reservationAvailabilityEdges != null) {
                return fonciiRestaurant.reservationAvailabilityEdges.length > 0;
            }

            const reservationSearchInput = args.userPersonalizationInput?.reservationSearchInput,
                partySize = reservationSearchInput?.partySize ?? defaultReservationPartySize,
                dateOfReservation = ISOStringToDate(
                    reservationSearchInput?.targetDate ?? currentDateAsISOString()
                )!;

            return fonciiRestaurant.reservationsAvailable ??
                await reservationService()
                    .areReservationsAvailable({
                        fonciiRestaurantID: fonciiRestaurant.restaurant.id,
                        partySize,
                        dateOfReservation
                    });
        },

        async reservationAvailabilityEdges(
            fonciiRestaurant: FonciiRestaurant,
            args: {
                userPersonalizationInput?: {
                    reservationSearchInput?: ReservationSearchInput
                }
            }) {
            if (fonciiRestaurant.reservationAvailabilityEdges != null) return fonciiRestaurant.reservationAvailabilityEdges;

            const reservationSearchInput = args.userPersonalizationInput?.reservationSearchInput,
                partySize = reservationSearchInput?.partySize ?? defaultReservationPartySize,
                dateOfReservation = ISOStringToDate(reservationSearchInput?.targetDate ?? currentDateAsISOString())!;

            return fonciiRestaurant.reservationAvailabilityEdges ??
                await reservationService()
                    .getReservationsForDate({
                        fonciiRestaurantID: fonciiRestaurant.restaurant.id,
                        partySize,
                        dateOfReservation
                    });
        },

        async influencerInsightEdges(
            fonciiRestaurant: FonciiRestaurant,
            args: { postsToExclude?: string[] }
        ) {
            if (fonciiRestaurant.influencerInsightEdges != null) return fonciiRestaurant.influencerInsightEdges;

            // Constants
            // Some arbitrary limit on the amount of edges to display for this entry, max is 10 for now.
            const MAX_RESULTS = 10;

            // Parsing
            const fonciiRestaurantID = fonciiRestaurant.restaurant.id,
                { postsToExclude } = args;

            return fonciiRestaurant.influencerInsightEdges ??
                (await fmPostService().findUserRatedPostsWithRestaurant({
                    fonciiRestaurantID,
                    resultsPerPage: MAX_RESULTS,
                    postsToExclude
                }));
        },

        async associatedPostEdges(
            fonciiRestaurant: FonciiRestaurant,
            args: { postsToExclude?: string[] }
        ) {
            if (fonciiRestaurant.associatedPostEdges != null) return fonciiRestaurant.associatedPostEdges;

            // Constants
            // Some arbitrary limit on the amount of edges to display for this entry, max is 10 for now.
            const MAX_RESULTS = 10;

            // Parsing
            const fonciiRestaurantID = fonciiRestaurant.restaurant.id,
                { postsToExclude } = args;

            return fonciiRestaurant.associatedPostEdges ?? (await fmPostService()
                .findPostsWithRestaurant({
                    fonciiRestaurantID,
                    resultsPerPage: MAX_RESULTS,
                    postsToExclude,
                    properties: {
                        media: { $exists: true },
                        deletionPending: { $exists: false }
                    }
                }));
        },

        async associatedArticlePublicationEdges(fonciiRestaurant: FonciiRestaurant) {
            if (fonciiRestaurant.associatedArticlePublicationEdges != null) return fonciiRestaurant.associatedArticlePublicationEdges;

            // Constants
            const MAX_ASSOCIATED_ARTICLE_RESULTS = 10;

            return (await recognizedService()
                .findArticlesForRestaurant({
                    restaurantID: fonciiRestaurant.restaurant.id,
                    resultsPerPage: MAX_ASSOCIATED_ARTICLE_RESULTS,
                    projectionStage: {
                        $project: {
                            textContent: 0
                        }
                    }
                }));
        },

        async associatedRestaurantAwardEdges(fonciiRestaurant: FonciiRestaurant) {
            if (fonciiRestaurant.associatedRestaurantAwardEdges != null) return fonciiRestaurant.associatedRestaurantAwardEdges;

            // Constants
            const MAX_ASSOCIATED_RESTAURANT_AWARDS = 10;

            return (await recognizedService().findAwardsForRestaurant({
                restaurantID: fonciiRestaurant.restaurant.id,
                resultsPerPage: MAX_ASSOCIATED_RESTAURANT_AWARDS
            }));
        }
    },

    ArticlePublication: {
        websiteDomain(articlePublication: ArticlePublication) {
            const parsedUrl = new URL(articlePublication.url),
                domainName = `${parsedUrl.protocol}//${parsedUrl.hostname}`;

            return domainName;
        },

        /** Uses a secret Google URL to pull the favicon.ico file from any website, removing the need to query the domain's /favicon.ico route which sometimes doesn't work */
        faviconLink(articlePublication: ArticlePublication) {
            const parsedUrl = new URL(articlePublication.url),
                domainName = `${parsedUrl.protocol}//${parsedUrl.hostname}`,
                desiredFaviconSize = "256", // The larger the better the quality, some only have up to 128 or lower, so this is just wishful thinking
                // Source: https://dev.to/derlin/get-favicons-from-any-website-using-a-hidden-google-api-3p1e
                googleFaviconLink = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${domainName}&size=${desiredFaviconSize}`;

            return googleFaviconLink;
        }
    },

    RestaurantAward: {
        websiteDomain(restaurantAward: RestaurantAward) {
            const parsedUrl = new URL(restaurantAward.url),
                domainName = `${parsedUrl.protocol}//${parsedUrl.hostname}`;

            return domainName;
        },

        /** Uses a secret Google URL to pull the favicon.ico file from any website, removing the need to query the domain's /favicon.ico route which sometimes doesn't work */
        faviconLink(restaurantAward: RestaurantAward) {
            const parsedUrl = new URL(restaurantAward.url),
                domainName = `${parsedUrl.protocol}//${parsedUrl.hostname}`,
                desiredFaviconSize = "256", // The larger the better the quality, some only have up to 128 or lower, so this is just wishful thinking
                // Source: https://dev.to/derlin/get-favicons-from-any-website-using-a-hidden-google-api-3p1e
                googleFaviconLink = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${domainName}&size=${desiredFaviconSize}`;

            return googleFaviconLink;
        }
    },

    Query: {
        // Get a restaurant by its ID
        async getFonciiRestaurantByID(
            _: any,
            args: {
                id: string,
                userPersonalizationInput: {
                    userID?: string, // ID of the user making the request (optional), but when it's provided this is used to compute % match score
                    coordinates: CoordinatePoint,
                    reservationSearchInput?: ReservationSearchInput,
                    includeReservations: boolean,
                    includeInfluencerInsights: boolean,
                    includeAssociatedPosts: boolean,
                    includeAssociatedArticles: boolean,
                }
            }) {
            const id = args.id,
                userPersonalizationInput = args.userPersonalizationInput,
                {
                    userID,
                    coordinates: coordinatePoint,
                    reservationSearchInput,
                    includeReservations,
                    includeInfluencerInsights,
                    includeAssociatedPosts,
                    includeAssociatedArticles
                } = userPersonalizationInput;

            const [restaurant, tasteProfile] = await Promise.all([
                restaurantService().findRestaurantWithID(id),
                // Try to find a taste profile for the user, if it exists, compute the % match score, if it doesn't then % match score isn't computed
                userID ? tasteProfileService().getTasteProfileForUser(userID) : null
            ]);

            // Precondition failure
            if (!restaurant) return null;

            // Percent Match Score //
            let percentMatchScore: Promise<number> | undefined = undefined,
                qualityScore: Promise<number>;

            // Registered user is querying
            if (userID != undefined && coordinatePoint) {
                const userTasteProfile = TasteProfileModel.fromObject(tasteProfile);

                if (userTasteProfile) {
                    // Compute % match score for the current restaurant based on location and taste profile 
                    percentMatchScore = percentMatchService().computePercentMatchScore({
                        userLocation: coordinatePoint,
                        userTasteProfile,
                        restaurant
                    });
                }
            }

            qualityScore = percentMatchService()
                .getRestaurantQualityScore({ restaurant });

            // Reservations //
            const isReservable = reservationService().doesRestaurantSupportReservations(restaurant.id),
                // When not included, a default value is used - This prevents the field resolver from trying to resolve the undefined required field, same for associated posts and articles 
                reservationAvailabilities = includeReservations ? reservationService()
                    .getReservationsForDate({
                        fonciiRestaurantID: restaurant.id,
                        partySize: reservationSearchInput?.partySize ?? defaultReservationPartySize,
                        dateOfReservation: ISOStringToDate(reservationSearchInput?.targetDate ?? currentDateAsISOString())!
                    }) : [];

            const promises = await Promise.all([
                percentMatchScore,
                qualityScore,
                isReservable,
                reservationAvailabilities
            ]);

            return {
                restaurant,
                // These require specific input therefore they're resolved here
                percentMatchScore: promises[0],
                qualityScore: promises[1],
                isReservable: promises[2],
                reservationsAvailable: promises[3].length > 0,
                reservationAvailabilityEdges: promises[3],

                // Field level resolvers will resolve these
                influencerInsightEdges: includeInfluencerInsights ? null : [],
                associatedPostEdges: includeAssociatedPosts ? null : [],
                associatedArticlePublicationEdges: includeAssociatedArticles ? null : []
            };
        },

        async fonciiRestaurantSearch(
            _: any,
            args: {
                input: {
                    searchQuery: string,
                    searchRadius: number,
                    coordinates: CoordinatePoint,
                    fonciiRestaurantSearchFilterInput?: {
                        reservableOnly: boolean
                    },
                    userPersonalizationInput: {
                        userID?: string, // ID of the user making the request (optional), but when it's provided this is used to compute % match score
                        coordinates: CoordinatePoint,
                        reservationSearchInput?: ReservationSearchInput,
                        includeReservations: boolean,
                        includeInfluencerInsights: boolean,
                        includeAssociatedPosts: boolean,
                        includeAssociatedArticles: boolean
                        includeAssociatedRestaurantAwards: boolean
                    }
                }
            }) {
            const input = args.input, {
                searchQuery,
                searchRadius: radius,
                coordinates: coordinatePoint,
                fonciiRestaurantSearchFilterInput,
                userPersonalizationInput
            } = input;

            // Conditions
            // Sort for explore page queries, and don't for search result page queries since they're based on similarity
            const isSearchResultPageQuery = searchQuery != undefined && searchQuery != "";

            const restaurantResults = await restaurantService()
                .geospatialSemanticSearchForRestaurants({
                    coordinatePoint,
                    searchQuery,
                    radius
                });

            const resolvedRestaurants = await populateFonciiRestaurantFields({
                restaurants: restaurantResults,
                fonciiRestaurantSearchFilterInput,
                userPersonalizationInput,
                sort: !isSearchResultPageQuery
            });

            return {
                fonciiRestaurants: resolvedRestaurants,
                queryID: ExploreSearchEventModel.generateQueryID()
            }
        },

        async findReservationAvailabilitiesFor(
            _: any,
            args: {
                fonciiRestaurantID: string,
                reservationSearchInput: ReservationSearchInput
            }) {
            const { fonciiRestaurantID, reservationSearchInput } = args,
                partySize = reservationSearchInput?.partySize ?? defaultReservationPartySize,
                dateOfReservation = ISOStringToDate(reservationSearchInput?.targetDate ?? currentDateAsISOString())!;

            return await reservationService()
                .getReservationsForDate({
                    fonciiRestaurantID,
                    partySize,
                    dateOfReservation
                });
        },

        async findAvailableReservationDaysFor(
            _: any,
            args: {
                fonciiRestaurantID: string;
                availableReservationDaysInput: AvailableReservationDaysInput;
            }
        ) {
            const { fonciiRestaurantID, availableReservationDaysInput } = args,
                partySize = availableReservationDaysInput?.partySize ?? defaultReservationPartySize,
                startDate = ISOStringToDate(
                    availableReservationDaysInput?.startDate ?? currentDateAsISOString()
                )!,
                endDate = ISOStringToDate(
                    availableReservationDaysInput?.endDate ?? currentDateAsISOString()
                )!;

            return await reservationService()
                .getAvailableReservationDates({
                    fonciiRestaurantID,
                    partySize,
                    startDate,
                    endDate
                });
        },

        async findAssociatedArticlesFor(
            _: any,
            args: { restaurantID: string }) {
            // Parsing
            const { restaurantID } = args;

            const result = await recognizedService()
                .findArticlesForRestaurant({
                    restaurantID,
                    projectionStage: {
                        $project: {
                            textContent: 0
                        }
                    }
                }),
                associatedArticlePublicationEdges = result;

            return { associatedArticlePublicationEdges };
        },

        async findAssociatedRestaurantAwardsFor(
            _: any,
            args: { restaurantID: string }) {
            // Parsing
            const { restaurantID } = args;

            const result = await recognizedService()
                .findAwardsForRestaurant({ restaurantID }),
                associatedRestaurantAwardEdges = result;

            return { associatedRestaurantAwardEdges };
        },

        /**
         * For user posts this will return the user's previous visits, and for restaurants 
         * this will return any associated posts, not just user specific.
         */
        async findAssociatedPostsFor(
            _: any,
            args: {
                fonciiRestaurantID: string
                creatorID?: string
                postsToExclude: string[]
            }) {
            // Parsing
            const { fonciiRestaurantID, postsToExclude, creatorID } = args;

            // Associated Posts // 
            const MAX_ASSOCIATED_POST_RESULTS = 25,
                associatedPostResult = await fmPostService()
                    .findPostsWithRestaurant({
                        fonciiRestaurantID,
                        resultsPerPage: MAX_ASSOCIATED_POST_RESULTS,
                        postsToExclude,
                        properties: {
                            media: { $exists: true },
                            deletionPending: { $exists: false },
                            ...(creatorID && { userID: creatorID })
                        }
                    }),
                userPosts = associatedPostResult;

            return userPosts;
        },

        async gallerySearchAutoCompleteSuggestions(_: any,
            args: {
                input: {
                    galleryAuthorID: string,
                    searchQuery: string
                }
            }) {
            // Parsing
            const { input } = args,
                {
                    galleryAuthorID,
                    searchQuery,
                } = input;
            // Limiting
            const maxUserPostSuggestionsCount = 6,
                maxRestaurantSuggestionsCount = 6;

            // Only public posts are available
            const userPostAutoCompleteFTSResult = fmPostService()
                .autocompleteFullTextSearch({
                    searchQuery,
                    pipelineStages: [...fmPostService().JoinPostsWithRestaurantsPipelineStagesExclusive],
                    properties: {
                        userID: galleryAuthorID,
                        fonciiRestaurantID: { $exists: true },
                        media: { $exists: true },
                        deletionPending: { $exists: false }
                    },
                    resultsPerPage: maxUserPostSuggestionsCount
                });

            // Get restaurant from the restaurant collection
            const restaurantAutoCompleteFTSResult = restaurantService()
                .autocompleteFullTextSearch({
                    searchQuery,
                    resultsPerPage: maxRestaurantSuggestionsCount
                });

            const [
                galleryAuthor,
                userPosts,
                restaurants
            ] = await Promise.all([
                userService().findUserWithID(galleryAuthorID),
                userPostAutoCompleteFTSResult,
                restaurantAutoCompleteFTSResult
            ]);

            // Precondition failure, no user with the given ID exists to run the query against
            if (!galleryAuthor) return [];

            const publicUserPostsForRestaurants = (await Promise.all((restaurants)
                .map(async (restaurant) => {
                    const post = await fmPostService()
                        .findPostWith({
                            userID: galleryAuthorID,
                            fonciiRestaurantID: restaurant.id,
                            media: { $exists: true },
                            deletionPending: { $exists: false }
                        });

                    if (!post) return null;
                    else return {
                        ...post,
                        restaurant
                    }
                })) as (FMUserPost & { restaurant: Restaurant })[])
                .filter(Boolean);

            // Inject foncii derived auto-complete suggestions
            const autoCompleteSuggestions: (UserPostAutoCompleteSuggestion)[] = [];

            // Deduplicate suggestions
            const filteredPublicUserPostsForRestaurants = publicUserPostsForRestaurants.filter((suggestion) => {
                const postAlreadySuggested = (userPosts).find((post) => {
                    return post.id == suggestion.id
                }) != undefined;

                return !postAlreadySuggested;
            });

            // Inject user post suggestions
            autoCompleteSuggestions.push(
                ...[
                    ...filteredPublicUserPostsForRestaurants,
                    ...userPosts
                ]
                    .map((post) => {
                        const { restaurant } = post as FMUserPost & {
                            restaurant: Restaurant
                        };

                        // Parsing
                        const postID = post.id,
                            username = upperFirst(galleryAuthor.username),
                            restaurantName = restaurant.name,
                            fonciiRestaurantID = restaurant.id,
                            restaurantHeroImage = restaurant.heroImageURL ?? restaurant.imageCollectionURLs?.[0];

                        // Structured text
                        const title = `${username} • ${restaurantName}`,
                            description = `${username} • ${restaurantName}`,
                            previewImageURL = (post.media?.mediaType == 'VIDEO' ? post.media.videoMediaThumbnailURL : post.media?.mediaURL) ?? restaurantHeroImage;

                        return {
                            fonciiRestaurantID,
                            postID,
                            title,
                            description,
                            previewImageURL
                        } as UserPostAutoCompleteSuggestion
                    })
            );

            // Sort autoCompleteSuggestions based on proximity to searchQuery (closeness of match), closest -> farthest match
            autoCompleteSuggestions.sort((a, b) => {
                return computeLevenshteinDistance(a.title.toLowerCase(), searchQuery.toLowerCase())
                    - computeLevenshteinDistance(b.title.toLowerCase(), searchQuery.toLowerCase());
            });

            return autoCompleteSuggestions;
        },

        async findGooglePlaceIDForPlaceSearchQuery(_: any,
            args: {
                searchQuery: string,
                useGoogleFallback?: boolean
            }) {
            // Parsing
            const { searchQuery } = args,
                // Default option is true if not provided
                useGoogleFallback = args.useGoogleFallback ?? true;

            // Limits
            // Our own autocomplete may be slightly inaccurate so to ensure
            // the best results, fall back on Google if the result given back by our own system
            // is not highly accurate.
            const minFonciiSimilarityScore = 90;

            // Properties
            // Only return the best candidate from our DB
            const maxRestaurantSuggestionsCount = 1;

            // Search for a restaurant candidate in the restaurant collection
            const restaurantAutoCompleteFTSResult = await restaurantService()
                .autocompleteFullTextSearch({
                    searchQuery,
                    resultsPerPage: maxRestaurantSuggestionsCount
                }),
                restaurantCandidate = restaurantAutoCompleteFTSResult[0];

            if (restaurantCandidate) {
                // Best restaurant candidate found via Foncii
                // Parsing
                const googlePlaceID = restaurantCandidate.googleID,
                    name = restaurantCandidate.name,
                    location = restaurantCandidate.addressProperties.formattedAddress,
                    description = `${name}, ${location}`,
                    dissimilarity = computeLevenshteinDistance(searchQuery, description),
                    dissimilarityPercentage = (dissimilarity / 100),
                    similarityScore = Math.max((1 - dissimilarityPercentage), 0);

                if (similarityScore >= minFonciiSimilarityScore) {
                    return {
                        googlePlaceID,
                        description,
                        similarityScore
                    };
                }
            }

            if (useGoogleFallback) {
                // Trying Google Places API, couldn't find a match with Foncii
                const googlePlaceAutoCompleteSearchResult = await restaurantAggregator()
                    .googlePlacesService.performPlaceAutoCompleteSearch(searchQuery),
                    restaurantCandidate = googlePlaceAutoCompleteSearchResult[0];

                if (restaurantCandidate) {
                    // Found the best candidate via Google
                    // Parsing
                    const googlePlaceID = restaurantCandidate.place_id,
                        description = restaurantCandidate.description,
                        dissimilarity = computeLevenshteinDistance(searchQuery, description),
                        dissimilarityPercentage = (dissimilarity / 100),
                        similarityScore = Math.max((1 - dissimilarityPercentage), 0);

                    return {
                        googlePlaceID,
                        description,
                        similarityScore
                    };
                }
            }

            // No candidate found
            return undefined;
        },

        async restaurantAutoCompleteSuggestions(_: any,
            args: {
                input: {
                    searchQuery: string,
                    injectExternalSuggestions: boolean
                }
            }) {
            // Parsing
            const { input } = args,
                {
                    searchQuery,
                    injectExternalSuggestions
                } = input;

            // Conditional Logic
            // 100 Limit just in case a person pastes the whole address + venue name and both are super long
            // anything over this is malicious
            const placeAutoCompleteSuggestionsAvailable = searchQuery.length >= 2 && injectExternalSuggestions && searchQuery.length <= 100;

            // Limiting
            // Pull 6 from our own DB when not using Place API, 3 when using to limit the total potential candidates to 6 for all restaurant injection sources
            const maxRestaurantSuggestionsCount = placeAutoCompleteSuggestionsAvailable ? 3 : 6,
                maxGoogleAutoCompleteSuggestionsCount = 6;

            // Get restaurant from the restaurant collection
            const restaurantAutoCompleteFTSResult = restaurantService().autocompleteFullTextSearch({ searchQuery, resultsPerPage: maxRestaurantSuggestionsCount });
            let googlePlaceAutoCompleteSearchResult = undefined;

            // Only trigger Google Auto-complete search results when
            // the given search query is >= 2 chars to prevent wasting expensive Place API calls
            if (placeAutoCompleteSuggestionsAvailable) {
                googlePlaceAutoCompleteSearchResult = restaurantAggregator()
                    .googlePlacesService.performPlaceAutoCompleteSearch(searchQuery);
            }

            const [
                restaurants,
                googlePlaceAutoCompleteSuggestions
            ] = await Promise.all([
                restaurantAutoCompleteFTSResult,
                googlePlaceAutoCompleteSearchResult
            ]);

            // Inject foncii derived auto-complete suggestions
            const autoCompleteSuggestions: (RestaurantAutoCompleteSuggestion)[] = restaurants.map((restaurant) => {
                return {
                    fonciiRestaurantID: restaurant.id, // Not available when injecting suggestions from Google Places API, when this is missing the restaurant is aggregated from the client when user selects it
                    googlePlaceID: restaurant.googleID,
                    source: RestaurantAutoCompleteSuggestionSources.Foncii,
                    title: restaurant.name,
                    description: `${restaurant.name} ${restaurant.addressProperties.formattedAddress}`, // Human-readable description [business name + location properties]
                    previewImageURL: restaurant.heroImageURL,
                    categories: restaurant.categories
                } as RestaurantAutoCompleteSuggestion
            });

            // Inject Google Places API auto-complete suggestions
            if (googlePlaceAutoCompleteSuggestions) {
                // Filter out already included restaurants from the search suggestions below
                const filteredGooglePlaceAutoCompleteSuggestions = googlePlaceAutoCompleteSuggestions.slice(0, maxGoogleAutoCompleteSuggestionsCount).filter((googlePlaceAutoCompleteSuggestion) => {
                    const restaurantAutoCompleteSuggestion = autoCompleteSuggestions.find((autoCompleteSuggestion) => {
                        const restaurantAutoCompleteSuggestion = autoCompleteSuggestion as RestaurantAutoCompleteSuggestion;

                        if (restaurantAutoCompleteSuggestion.googlePlaceID) {
                            return restaurantAutoCompleteSuggestion.googlePlaceID == googlePlaceAutoCompleteSuggestion.place_id;
                        }
                        else return false;
                    }) != undefined;

                    return !restaurantAutoCompleteSuggestion;
                });

                autoCompleteSuggestions.push(
                    ...filteredGooglePlaceAutoCompleteSuggestions.map((suggestion) => {
                        return {
                            googlePlaceID: suggestion.place_id,
                            source: RestaurantAutoCompleteSuggestionSources.Google,
                            title: (suggestion.description.split(",")[0]) ?? suggestion.description,
                            description: suggestion.description
                        } as RestaurantAutoCompleteSuggestion
                    }));
            }

            // Sort autoCompleteSuggestions based on proximity to searchQuery (closeness of match), closest -> farthest match
            autoCompleteSuggestions.sort((a, b) => {
                return computeLevenshteinDistance(a.title.toLowerCase(), searchQuery.toLowerCase())
                    - computeLevenshteinDistance(b.title.toLowerCase(), searchQuery.toLowerCase());
            });

            return autoCompleteSuggestions;
        },

        async exploreSearchAutoCompleteSuggestions(_: any,
            args: {
                input: {
                    searchQuery: string,
                    injectExternalSuggestions: boolean,
                    includeUserPostSuggestions: boolean,
                    includeUserSuggestions: boolean,
                    includePopularSearchTerms: boolean
                }
            }) {
            // Parsing
            const { input } = args,
                {
                    searchQuery,
                    injectExternalSuggestions,
                    includeUserPostSuggestions,
                    includeUserSuggestions,
                    includePopularSearchTerms
                } = input;

            // Conditional Logic
            const placeAutoCompleteSuggestionsAvailable = searchQuery.length >= 2 && injectExternalSuggestions;

            // Limiting
            // Pull 6 from our own DB when not using Place API, 3 when using to limit the total potential candidates to 6 for all restaurant injection sources
            const maxRestaurantSuggestionsCount = placeAutoCompleteSuggestionsAvailable ? 3 : 6,
                maxGoogleAutoCompleteSuggestionsCount = 2,
                maxUserPostSuggestionsCount = 3,
                maxUserSuggestionsCount = 3;

            // Get restaurant from the restaurant collection
            const restaurantAutoCompleteFTSResult = restaurantService().autocompleteFullTextSearch({ searchQuery, resultsPerPage: maxRestaurantSuggestionsCount });
            let googlePlaceAutoCompleteSearchResult = undefined;

            // Only public posts are available
            const userPostAutoCompleteFTSResult = includeUserPostSuggestions ? fmPostService()
                .autocompleteFullTextSearch({
                    searchQuery,
                    pipelineStages: [...fmPostService().JoinPostsWithRestaurantsPipelineStagesExclusive, ...fmPostService().JoinPostsWithUsersPipelineStages],
                    properties: {
                        fonciiRestaurantID: { $exists: true },
                        media: { $exists: true },
                        deletionPending: { $exists: false }
                    },
                    resultsPerPage: maxUserPostSuggestionsCount
                }) : undefined;

            // Get user suggestion from the user collection directly as searching for users by name will work best on this query
            // Update to 'creators' and 'basic' users only, excluding specifically test users for now b/c the user data doesn't contain user roles yet
            const userAutoCompleteFTSResult = includeUserSuggestions ? userService()
                .autocompleteFullTextSearch({
                    searchQuery,
                    properties: {
                        role: { $ne: UserRoles.Test }
                    },
                    resultsPerPage: maxUserSuggestionsCount
                }) : undefined;

            // Only trigger Google Auto-complete search results when
            // the given search query is >= 2 chars to prevent wasting expensive Place API calls
            if (placeAutoCompleteSuggestionsAvailable) {
                googlePlaceAutoCompleteSearchResult = restaurantAggregator()
                    .googlePlacesService.performPlaceAutoCompleteSearch(searchQuery);
            }

            const [
                restaurants,
                userPosts,
                users,
                googlePlaceAutoCompleteSuggestions
            ] = await Promise.all([
                restaurantAutoCompleteFTSResult,
                userPostAutoCompleteFTSResult,
                userAutoCompleteFTSResult,
                googlePlaceAutoCompleteSearchResult
            ]);

            // Inject foncii derived auto-complete suggestions
            const autoCompleteSuggestions: (
                RestaurantAutoCompleteSuggestion
                | UserPostAutoCompleteSuggestion
                | UserAutoCompleteSuggestion
                | PopularSearchQuerySuggestion
            )[] = restaurants.map((restaurant) => {
                return {
                    fonciiRestaurantID: restaurant.id, // Not available when injecting suggestions from Google Places API, when this is missing the restaurant is aggregated from the client when user selects it
                    googlePlaceID: restaurant.googleID,
                    source: RestaurantAutoCompleteSuggestionSources.Foncii,
                    title: restaurant.name,
                    description: `${restaurant.name} ${restaurant.addressProperties.formattedAddress}`, // Human-readable description [business name + location properties]
                    previewImageURL: restaurant.heroImageURL,
                    categories: restaurant.categories
                } as RestaurantAutoCompleteSuggestion
            });

            // Inject Google Places API auto-complete suggestions
            if (googlePlaceAutoCompleteSuggestions) {
                // Filter out already included restaurants from the search suggestions below
                const filteredGooglePlaceAutoCompleteSuggestions = googlePlaceAutoCompleteSuggestions
                    .slice(0, maxGoogleAutoCompleteSuggestionsCount)
                    .filter((googlePlaceAutoCompleteSuggestion) => {
                        const restaurantAlreadySuggested = autoCompleteSuggestions.find((autoCompleteSuggestion) => {
                            const restaurantAutoCompleteSuggestion = autoCompleteSuggestion as RestaurantAutoCompleteSuggestion;

                            if (restaurantAutoCompleteSuggestion.googlePlaceID) {
                                return restaurantAutoCompleteSuggestion.googlePlaceID == googlePlaceAutoCompleteSuggestion.place_id;
                            }
                            else return false;
                        }) != undefined;

                        return !restaurantAlreadySuggested;
                    });

                autoCompleteSuggestions.push(
                    ...filteredGooglePlaceAutoCompleteSuggestions.map((suggestion) => {
                        return {
                            googlePlaceID: suggestion.place_id,
                            source: RestaurantAutoCompleteSuggestionSources.Google,
                            title: (suggestion.description.split(",")[0]) ?? suggestion.description,
                            description: suggestion.description
                        } as RestaurantAutoCompleteSuggestion
                    }));
            }

            // Inject user post suggestions (if any)
            if (userPosts) {
                autoCompleteSuggestions.push(
                    ...userPosts.map((post) => {
                        const { creator, restaurant } = post as FMUserPost & {
                            creator: FMUser,
                            restaurant: Restaurant
                        };

                        // Parsing
                        const username = upperFirst(creator.username),
                            restaurantName = restaurant.name,
                            restaurantID = restaurant.id,
                            restaurantHeroImage = restaurant.heroImageURL ?? restaurant.imageCollectionURLs?.[0];

                        // Structured text
                        const title = `${username} • ${restaurantName}`,
                            description = `${username} • ${restaurantName}`,
                            previewImageURL = (post.media?.mediaType == 'VIDEO' ? post.media.videoMediaThumbnailURL : post.media?.mediaURL) ?? restaurantHeroImage;

                        return {
                            fonciiRestaurantID: restaurantID,
                            postID: post.id,
                            title,
                            description,
                            previewImageURL
                        } as UserPostAutoCompleteSuggestion
                    })
                );
            }

            // Inject user suggestions (if any)
            if (users) {
                autoCompleteSuggestions.push(
                    ...users.map((user) => {
                        return {
                            userID: user.id,
                            title: user.username,
                            description: user.username,
                            previewImageURL: user.profilePictureURL
                        } as UserAutoCompleteSuggestion
                    })
                );
            }

            // Sort autoCompleteSuggestions based on proximity to searchQuery (closeness of match), closest -> farthest match
            autoCompleteSuggestions.sort((a, b) => {
                return computeLevenshteinDistance(a.title.toLowerCase(), searchQuery.toLowerCase())
                    - computeLevenshteinDistance(b.title.toLowerCase(), searchQuery.toLowerCase());
            });

            // Inject popular search terms at the top since they're supposed to match with what the user's currently typing (TBA)
            if (includePopularSearchTerms) { }

            return autoCompleteSuggestions;
        },

        async findRestaurantsSimilarTo(_: any, args: { restaurantID: string }): Promise<FonciiRestaurant[]> {
            // Parsing
            const { restaurantID } = args,
                restaurant = await restaurantService().findRestaurantWithID(restaurantID);

            if (restaurant) {
                const similarRestaurants = (await restaurantService().findRestaurantsSimilarTo({ restaurant }));

                return similarRestaurants.map((restaurant) => {
                    return { restaurant } as FonciiRestaurant
                });
            }
            else return [];
        },

        async getSavedRestaurantsFor(
            _: any,
            args: {
                input: {
                    userPersonalizationInput: {
                        userID: string, // Required since only registered users can save restaurants
                        coordinates: CoordinatePoint,
                        reservationSearchInput?: ReservationSearchInput,
                        includeReservations: boolean,
                        includeInfluencerInsights: boolean,
                        includeAssociatedPosts: boolean,
                        includeAssociatedArticles: boolean,
                        includeAssociatedRestaurantAwards: boolean,
                    },
                    paginationPageIndex: number,
                    resultsPerPage: number
                }
            }) {
            // Parsing
            const input = args.input,
                { userPersonalizationInput, paginationPageIndex, resultsPerPage } = input;

            const { userID } = userPersonalizationInput,
                savedRestaurants = (
                    await restaurantService()
                        .getSavedRestaurantsFor({
                            userID,
                            paginationPageIndex,
                            resultsPerPage
                        })) as any as (SavedRestaurant & { restaurant: Restaurant })[],
                restaurants = savedRestaurants.map((savedRestaurant) => savedRestaurant.restaurant);

            return populateFonciiRestaurantFields({
                restaurants,
                userPersonalizationInput
            });
        },

        async getAllRestaurants(
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
            const restaurants: Restaurant[] = [];

            for (let i = startIndex; i < offsetTotalPages; i++) {
                const restaurantBatch = (await restaurantService()
                    .getAllRestaurants(resultsPerPage, i));

                // Stop querying once the break out condition is met
                if (restaurantBatch.length < 1) break;

                restaurants.push(...restaurantBatch);
            }

            return restaurants;
        }
    },

    Mutation: {
        async aggregateRestaurantsAround(_: any, args: {
            input: {
                coordinates: CoordinatePoint,
            }
        }) {
            return await restaurantAggregator().aggregateRestaurantsAround(args.input.coordinates);
        },

        async aggregateRestaurant(_: any, args: {
            input: {
                googlePlaceID: string
            }
        }) {
            return await restaurantAggregator().aggregateRestaurant(args.input.googlePlaceID);
        },

        async ingestRestaurantReservationDetails(_: any, args: {
            input: {
                provider: ReservationProviders,
                restaurantReservationDetails: {
                    name: string,
                    venueID: string,
                    venueAlias: string,
                    externalURL: string,
                    locationDetails: string
                }[]
            }
        }) {
            let didSucceed = false;

            /**
             * Process all of the ingested reservation details into reservation integrations (new or updated) as well as aggregate any novel
             * restaurants (if possible / available on Yelp or Google (Very probable))
             * 
             * Note: This loop must be sequential as running the operations in parallel with no break in between
             * will timeout the Google / Yelp APIs when aggregating restaurants
             */
            args.input.restaurantReservationDetails
                .forEach(async (reservationDetail) => {
                    // [500ms] 0.5 second delay between each integration connection
                    await delay(async () => {
                        didSucceed = await reservationService()
                            .connectReservationIntegration({
                                provider: args.input.provider,
                                ...reservationDetail
                            });
                    }, 500);
                });

            // True if all connections were made successfully, false otherwise. False state is a good indicator of a bad outlier in the data
            return didSucceed;
        },

        async ingestArticlePublicationDetails(_: any, args: {
            input: {
                articlePublicationDetails: {
                    id: string,
                    publication: string,
                    publishDate: string,
                    scrapeDate: string,
                    title?: string,
                    description?: string,
                    url: string,
                    venueName: string,
                    city?: string,
                    address?: string,
                    textContent?: string
                }[]
            }
        }) {
            // Parsing
            const { articlePublicationDetails } = args.input;

            // ETL process for articles, also associates ingested articles with associated restaurant IDs (if any)
            const processedArticlePublications: ArticlePublication[] = await Promise.all(
                articlePublicationDetails.map(async (articlePublication) => {
                    // Parsing
                    // UID components
                    const url = articlePublication.url,
                        venueName = articlePublication.venueName;

                    // Processing
                    // Create a determinstic uid for the article publication to prevent duplicates
                    const deterministicUIDString = DatabaseServiceAdapter
                        .createDeterministicUID({
                            uid1: url,
                            uid2: venueName
                        }),
                        id = sha256Hash(deterministicUIDString);

                    // Find associated restaurant by address
                    const restaurantID = await recognizedService()
                        .findRestaurantAssociatedWithArticlePublication({
                            articlePublication: articlePublication as ArticlePublication
                        });

                    // Update existing articles (if any)
                    const articleExists = await recognizedService().doesArticleExistWithID(id);

                    // Update with the latest fields
                    if (articleExists) {
                        const {
                            textContent,
                            address,
                            city,
                            description,
                            publication,
                            title
                        } = articlePublication,
                            existingFieldsToUpdate = {
                                textContent,
                                address,
                                city,
                                description,
                                publication,
                                title
                            };

                        await recognizedService()
                            .updateArticlePublication({
                                id,
                                updatedFields: {
                                    ...existingFieldsToUpdate,
                                    restaurantID
                                }
                            });

                        // Filtered out result since it's updated singularly
                        return undefined;
                    }

                    // Transformed metadata
                    const creationDate = currentDateAsISOString(),
                        lastUpdated = creationDate;

                    return {
                        ...articlePublication,
                        id,
                        restaurantID,
                        creationDate,
                        lastUpdated
                    } as ArticlePublication;
                }).filter(Boolean) as any
            );

            /**
             * Attempt to associate any isolated articles that were already ingested with their
             * associated restaurants to the best of our abilities [Background process, takes long 
             * to resolve, don't await this]
             * 
             * Use high confidence for greater accuracy, low confidence is unreliable as using the city in 
             * combination with the venue name isn't very reliable.
             */
            recognizedService().associateIsolatedArticlesWithRestaurants({
                singlePass: false,
                highConfidenceOnly: true
            });

            // True if all articles were inserted successfully, false otherwise (good indicator of some bad data in the batch)
            return await recognizedService().bulkCreateArticlePublications(processedArticlePublications);
        },

        async ingestRestaurantAwardDetails(_: any, args: {
            input: {
                restaurantAwardDetails: {
                    title: string,
                    url: string,
                    venueName: string,
                    venueLocation: string,
                    organization: string,
                    awardDate: string,
                    scrapeDate: string,
                }[]
            }
        }) {
            // Parsing
            const nonLocatedRestaurantAwardDetails = args.input.restaurantAwardDetails;

            // Processing
            const restaurantPromises: Promise<Restaurant | null | undefined>[] = []

            nonLocatedRestaurantAwardDetails.forEach(award => {
                restaurantPromises.push(restaurantService()
                    .findOrAggregateRestaurant({
                        name: award.venueName,
                        locationDetails: award.venueLocation
                    })
                )
            })

            const restaurantPromiseResults = await Promise.all(restaurantPromises)
            let restaurantPromiseResultInd = 0

            const locatedRestaurantAwardDetails: RestaurantAward[] = nonLocatedRestaurantAwardDetails
                .map(award => {
                    const restaurant = restaurantPromiseResults[restaurantPromiseResultInd++]
                    return {
                        ...award,
                        id: `${award.title}_${award.awardDate}_${award.venueName}__${restaurant?.addressProperties.city ?? ""}`
                            .toLowerCase()
                            .split(" ").join("_")
                            .split("-").join("_"),
                        restaurantID: restaurant?.id ?? ""
                    }
                })
                .filter(award => {
                    return award.restaurantID !== ""
                })

            // True if all articles were inserted successfully, false otherwise (good indicator of some bad data in the batch)
            return await recognizedService().bulkCreateRestaurantAwards(locatedRestaurantAwardDetails);
        },

        async saveRestaurant(_: any, args: {
            input: {
                userID: string,
                postID?: string,
                fonciiRestaurantID: string
            }
        },
            context: ServerContext
        ) {
            // Parsing
            const { userID, postID, fonciiRestaurantID } = args.input,
                sessionID = context.requesterSessionID;

            const didSucceed = await restaurantService()
                .saveRestaurant({
                    userID,
                    fonciiRestaurantID,
                    postID
                });

            if (didSucceed)
                eventService().resolveRestaurantSaveEvent({
                    saved: true,
                    sessionID,
                    userID,
                    postID,
                    fonciiRestaurantID
                });

            return didSucceed;
        },

        async unsaveRestaurant(_: any, args: {
            input: {
                userID: string,
                postID?: string,
                fonciiRestaurantID: string
            }
        },
            context: ServerContext
        ) {
            // Parsing
            const { userID, postID, fonciiRestaurantID } = args.input,
                sessionID = context.requesterSessionID;

            const didSucceed = await restaurantService()
                .unsaveRestaurant({
                    userID,
                    fonciiRestaurantID
                });

            if (didSucceed)
                eventService().resolveRestaurantSaveEvent({
                    saved: false,
                    sessionID,
                    userID,
                    postID,
                    fonciiRestaurantID
                });

            return didSucceed;
        }
    }
};

/**
 * Populates all fields of the foncii restaurant type in parallel for the given list 
 * of restaurants. Additionally filters based on the given filters, and sorts by 
 * percent match score
 * 
 * @returns -> Populated list of foncii restaurant objects, optionally filtered and 
 * sorted by percent match score
 */
export async function populateFonciiRestaurantFields({
    restaurants,
    fonciiRestaurantSearchFilterInput,
    userPersonalizationInput,
    sort = true
}: {
    restaurants: Restaurant[],
    fonciiRestaurantSearchFilterInput?: {
        reservableOnly: boolean
    },
    userPersonalizationInput?: {
        userID?: string, // ID of the user making the request (optional), but when it's provided this is used to compute % match score
        coordinates: CoordinatePoint,
        reservationSearchInput?: ReservationSearchInput,
        includeReservations: boolean,
        includeInfluencerInsights: boolean,
        includeAssociatedPosts: boolean,
        includeAssociatedArticles: boolean
        includeAssociatedRestaurantAwards: boolean
    },
    sort?: boolean
}) {
    // Parsing
    const {
        userID,
        coordinates: coordinatePoint,
        reservationSearchInput,
        includeReservations,
        includeInfluencerInsights,
        includeAssociatedPosts,
        includeAssociatedArticles,
        includeAssociatedRestaurantAwards
    } = userPersonalizationInput ?? {};
    // Try to find a taste profile for the user, if it exists, compute the % match score, if it doesn't then % match score isn't computed
    const tasteProfile = userID ? await tasteProfileService().getTasteProfileForUser(userID) : null

    // Mapping / Denormalization
    // Parallel resolution of all required computed fields given the array of restaurant data found via searching
    let fonciiRestaurants = await Promise.all(
        restaurants.map(async (restaurant) => {
            // Parsing
            const fonciiRestaurantID = restaurant.id;

            // Saved by registered user //
            const isSaved = userID ? restaurantService().isRestaurantSavedByUser({ userID, fonciiRestaurantID }) : false;

            // Average Foncii Rating //
            const averageFonciiRating = fmPostService().computeAverageFonciiRatingForRestaurant(fonciiRestaurantID);

            // Percent Match Score //
            let percentMatchScore: Promise<number> | undefined = undefined,
                qualityScore: Promise<number>;

            // Registered user is querying
            if (userID != undefined) {
                const userTasteProfile = TasteProfileModel.fromObject(tasteProfile);

                if (userTasteProfile && coordinatePoint) {
                    // Compute % match score for the current restaurant based on location and taste profile 
                    percentMatchScore = percentMatchService().computePercentMatchScore({
                        userLocation: coordinatePoint,
                        userTasteProfile,
                        restaurant
                    });
                }
            }

            qualityScore = percentMatchService().getRestaurantQualityScore({ restaurant });

            // Reservations //
            // When not included, a default value is used - This prevents the field resolver from trying to resolve the undefined required field, same for associated posts and articles 
            const isReservable = reservationService().doesRestaurantSupportReservations(fonciiRestaurantID),
                reservationAvailabilities = includeReservations == true ? reservationService()
                    .getReservationsForDate({
                        fonciiRestaurantID,
                        partySize: reservationSearchInput?.partySize ?? defaultReservationPartySize,
                        dateOfReservation: ISOStringToDate(reservationSearchInput?.targetDate ?? currentDateAsISOString())!
                    }) : [];

            // Influencer Insights //
            const MAX_INFLUENCER_INSIGHT_RESULTS = 10,
                influencerInsightResults = includeInfluencerInsights == true ? (
                    fmPostService().findUserRatedPostsWithRestaurant({
                        fonciiRestaurantID,
                        resultsPerPage: MAX_INFLUENCER_INSIGHT_RESULTS
                    })) : null;

            // Associated Posts // 
            const MAX_ASSOCIATED_POST_RESULTS = 10,
                associatedPostResult = includeAssociatedPosts == true ? fmPostService()
                    .findPostsWithRestaurant({
                        fonciiRestaurantID,
                        resultsPerPage: MAX_ASSOCIATED_POST_RESULTS,
                        properties: { media: { $exists: true }, deletionPending: { $exists: false } }
                    }) : null;

            // Associated Articles //
            const MAX_ASSOCIATED_ARTICLE_RESULTS = 10,
                associatedArticlePublicationResult = includeAssociatedArticles == true ? recognizedService()
                    .findArticlesForRestaurant({
                        restaurantID: fonciiRestaurantID,
                        resultsPerPage: MAX_ASSOCIATED_ARTICLE_RESULTS,
                        projectionStage: {
                            $project: {
                                textContent: 0
                            }
                        }
                    }) : null;

            const MAX_ASSOCIATED_RESTAURANT_AWARDS = 10,
                associatedRestaurantAwardsResult = includeAssociatedRestaurantAwards == true ? recognizedService()
                    .findAwardsForRestaurant({
                        restaurantID: fonciiRestaurantID,
                        resultsPerPage: MAX_ASSOCIATED_RESTAURANT_AWARDS
                    }) : null;

            const promises = await Promise.all([
                isSaved,
                averageFonciiRating,
                percentMatchScore,
                qualityScore,
                isReservable,
                reservationAvailabilities,
                influencerInsightResults,
                associatedPostResult,
                associatedArticlePublicationResult,
                associatedRestaurantAwardsResult
            ]);

            return {
                restaurant,
                isSaved: promises[0],
                averageFonciiRating: promises[1],
                percentMatchScore: promises[2],
                qualityScore: promises[3],
                isReservable: promises[4],
                reservationsAvailable: promises[5].length > 0,
                reservationAvailabilityEdges: promises[5],
                influencerInsightEdges: promises[6] ?? [],
                associatedPostEdges: promises[7] ?? [],
                associatedArticlePublicationEdges: promises[8] ?? [],
                associatedRestaurantAwardEdges: promises[9] ?? []
            };
        })
    ) ?? [];

    // Filtering
    // Filter out any foncii restaurants that are not reservable (if reservableOnly is true)
    fonciiRestaurants = fonciiRestaurants.filter((restaurant) => {
        // Return all elements if reservable only isn't applied
        if ((fonciiRestaurantSearchFilterInput?.reservableOnly ?? false) == false) return true;
        else return restaurant.reservationsAvailable == true && fonciiRestaurantSearchFilterInput?.reservableOnly == true
    });

    // Sorting
    // Return the list of foncii restaurants sorted by their percent match scores or quality score if percent match is not available
    if (sort) fonciiRestaurants.sort((a, b) => { return (b.percentMatchScore ?? b.qualityScore) - (a.percentMatchScore ?? a.qualityScore) });

    return fonciiRestaurants;
}

export default resolvers;