// Dependencies
// Types
import { DefaultPostFilters } from "../../types/default-type-values";
import { CoordinatePoint, FmUserPost } from "../../__generated__/graphql";

// Utilities
import { computeDistanceBetweenCoordinatePoints } from "../../utilities/math/euclideanGeometryMath";
import { isInRange } from "../../utilities/math/commonMath";
import { DisplayableCuisine, CUSINE_EQUIVALENCE } from "../../types/cuisines";
import { Set } from "immutable";

// Various sorting and filtering helpers for adding high level conditional logic to displaying user posts //
// Post sorting and filtering logic
export const sortAndFilterUserPosts = (
  posts: FmUserPost[],
  currentlySelectedPostID: string | undefined = undefined,
  userCoordinates: CoordinatePoint | undefined = undefined,
  filters: PostFilters
): FmUserPost[] => {
  // Filter out posts, then sort to save on unnecessary computation
  return sortUserPosts(
    filterUserPosts(posts, filters),
    currentlySelectedPostID,
    userCoordinates,
    filters
  );
};

export const searchSortFilterPosts = (
  posts: FmUserPost[],
  currentlySelectedPostID: string | undefined = undefined,
  userCoordinates: CoordinatePoint | undefined = undefined,
  filters: PostFilters,
  computedPostTextContentMappings: { [x: string]: string },
  searchQuery: string | undefined = undefined
): FmUserPost[] => {
  const sortedAndFilteredPosts = sortAndFilterUserPosts(
    posts,
    currentlySelectedPostID,
    userCoordinates,
    filters
  );

  // Perform a search query if specified
  if (searchQuery) {
    return performFullTextSearchQuery(
      searchQuery,
      computedPostTextContentMappings,
      sortedAndFilteredPosts
    );
  } else {
    return sortedAndFilteredPosts;
  }
};

// In-memory Full-Text Search
/**
 * Runs the given search query against the provided posts and their aggregated
 * fields to return only the most relevant posts.
 *
 * @param searchQuery
 * @param computedPostTextContentMappings
 * @param posts
 *
 * @returns -> Posts relevant to the provided search query (if any)
 */
const performFullTextSearchQuery = (
  searchQuery: string | undefined,
  computedPostTextContentMappings: { [x: string]: string } = {},
  posts: FmUserPost[]
): FmUserPost[] => {
  if (!searchQuery) return posts;

  const relevantPostIDMatches = Object.entries(computedPostTextContentMappings)
    .map(([postID, aggregatedTextContent]) => {
      let matchFound = false;
      const words = searchQuery.split(" ");

      // Split up any combinational queries and run their components
      // against the aggregated text content individually
      words.forEach((word) => {
        matchFound = aggregatedTextContent.includes(word);
      });

      return matchFound ? postID : undefined;
    })
    .filter(Boolean);

  return posts.filter((post) => relevantPostIDMatches.includes(post.id));
};

// Sorting Functions
// Sort goes by the following order: [Least important] Favorites -> (Distance || Creation Date) -> Current Selection [most important]
export const sortUserPosts = (
  posts: FmUserPost[],
  currentlySelectedPostID: string | undefined = undefined,
  userCoordinates: CoordinatePoint | undefined = undefined,
  filters: PostFilters = DefaultPostFilters
): FmUserPost[] => {
  let sortedPosts = sortByFavorites(posts);

  // Optional filters
  if (filters.newestToOldestSort) {
    sortedPosts = sortByCreationDate(sortedPosts, filters);
  }

  if (filters.closestToFarthestSort) {
    sortedPosts = sortByDistanceToUser(sortedPosts, userCoordinates);
  }

  if (filters.trendingSort) {
    // TODO: - Implement
  }

  if (filters.qualitySort) {
    sortedPosts = sortByQualityScore(sortedPosts);
  }

  if (filters.percentMatchSort) {
    sortedPosts = sortByPercentMatchScore(sortedPosts);
  }

  // Other filters
  // Disabled for now, no longer sorting by selection
  // sortedPosts = sortByCurrentSelection(
  //     sortedPosts,
  //     currentlySelectedPostID
  // );

  return sortedPosts;
};

// Sort the posts by distance to the user, nearest restaurants go to the top of the gallery
const sortByDistanceToUser = (
  posts: FmUserPost[] = [],
  userCoordinates: CoordinatePoint | undefined = undefined
): FmUserPost[] => {
  const currentUserCoordinates = userCoordinates;

  // Sort the posts by distance, nearest restaurants go to the top of the gallery
  // If the user's current coordinates are available
  if (currentUserCoordinates) {
    const softCopy = [...posts];

    return softCopy.sort((a, b) => {
      // Calculate the distance between the two restaurants
      const coordinatePointA = a.restaurant?.coordinates,
        coordinatePointB = b.restaurant?.coordinates;

      // Precondition failure, return partial result from failed comparison
      if (!coordinatePointA || !coordinatePointB) {
        if (!coordinatePointA && !coordinatePointB) return 0;
        else if (!coordinatePointA) return -1;
        else if (!coordinatePointB) return 1;
      }

      const distanceA = computeDistanceBetweenCoordinatePoints(
          coordinatePointA,
          currentUserCoordinates
        ),
        distanceB = computeDistanceBetweenCoordinatePoints(
          coordinatePointB,
          currentUserCoordinates
        );

      // Return the distance in ascending order (least to greatest)
      return distanceA - distanceB;
    });
  }

  return posts;
};

const sortByCreationDate = (
  posts: FmUserPost[] = [],
  filters: PostFilters
): FmUserPost[] => {
  const softCopy = [...posts];

  return softCopy.sort((postA, postB) => {
    // Properties
    const postAOriginalCreationDateTime = getCreationDateTime(postA),
      postBOriginalCreationDateTime = getCreationDateTime(postB);

    // Sort order -> Descending = largest to smallest, largest = biggest date offset / oldest date from some orign point
    // aka the most recent date because that's how time works.
    const descendingSortOrder = filters.newestToOldestSort;

    function getCreationDateTime(post: FmUserPost) {
      const postOriginalCreationDateTimestamp =
          post.dataSource?.creationDate ?? post.creationDate,
        postOriginalCreationDate = new Date(postOriginalCreationDateTimestamp),
        postOriginalCreationDateTime = postOriginalCreationDate.getTime();

      return postOriginalCreationDateTime;
    }

    return descendingSortOrder
      ? postBOriginalCreationDateTime - postAOriginalCreationDateTime
      : postAOriginalCreationDateTime - postBOriginalCreationDateTime;
  });
};

// Sort the posts associated with attached foncii restaurants by their quality score, top quality go to the top of the gallery
const sortByQualityScore = (posts: FmUserPost[] = []): FmUserPost[] => {
  const softCopy = [...posts];

  return softCopy.sort((postA, postB) => {
    return (
      (postB.fonciiRestaurant?.qualityScore ?? 0) -
      (postA.fonciiRestaurant?.qualityScore ?? 0)
    );
  });
};

// Sort the posts associated with attached foncii restaurants by percent match score, best matches go to the top of the gallery
const sortByPercentMatchScore = (posts: FmUserPost[] = []): FmUserPost[] => {
  const softCopy = [...posts];

  return softCopy.sort((postA, postB) => {
    return (
      (postB.fonciiRestaurant?.percentMatchScore ?? 0) -
      (postA.fonciiRestaurant?.percentMatchScore ?? 0)
    );
  });
};

// Sort the posts by favorites, favorited posts go to the top of the gallery
const sortByFavorites = (posts: FmUserPost[] = []): FmUserPost[] => {
  const softCopy = [...posts];

  return softCopy.sort((a, b) => Number(b.isFavorited) - Number(a.isFavorited));
};

// Currently selected posts rise to the top of the gallery
const sortByCurrentSelection = (
  posts: FmUserPost[] = [],
  currentlySelectedPostID: string | undefined = undefined
): FmUserPost[] => {
  const softCopy = [...posts];

  return softCopy.sort((postA, postB) =>
    postA.id === currentlySelectedPostID &&
    !(postB.id === currentlySelectedPostID)
      ? -1
      : 1
  );
};

// Filter Functions
export const filterUserPosts = (
  posts: FmUserPost[],
  filters: PostFilters
): FmUserPost[] => {
  const copyArray = [...posts],
    filteredPosts = copyArray.filter((post) => {
      // Parse restaurant data
      const restaurant = post.restaurant,
        fonciiRestaurant = post.fonciiRestaurant, // Extension of the restaurant data with open now and other computed metrics
        associatedPublications =
          post.fonciiRestaurant?.associatedArticlePublicationEdges?.map(
            (article) => article.publication
          ) ?? [],
        associatedRestaurantAwards =
          post.fonciiRestaurant?.associatedRestaurantAwardEdges.map(
            (award) => award.organization
          ) ?? [];

      // Post Properties
      const creator = post.creator,
        postOriginalCreationDateTimestamp =
          post.dataSource?.creationDate ?? post.creationDate,
        postOriginalCreationDate = new Date(postOriginalCreationDateTimestamp),
        postOriginalCreationDateTime = postOriginalCreationDate.getTime(),
        isFavorited = post.isFavorited,
        isReservable = fonciiRestaurant?.reservationsAvailable ?? false;

      // Selected Filters
      const selectedPriceLevelFilters = filters.priceLevels,
        selectedCuisineTypeFilters = filters.cuisineTypes,
        selectedCreatorUIDFilters = filters.creatorUIDs,
        selectedPublicationFilters = filters.publications,
        selectedRestaurantAwardFilters = filters.restaurantAwards,
        selectedTagFilters = filters.customCategories,
        selectedMealTypeFilters = filters.mealTypes,
        selectedCreatorRatingFilter = filters.creatorRating,
        selectedYelpRatingFilter = filters.yelpRating,
        selectedGoogleRatingFilter = filters.googleRating,
        selectedDateRangeFilter =
          filters.dateRange ?? DefaultPostFilters.dateRange,
        showOnlyFavorites = filters.showFavoritesOnly,
        reservableOnly = filters.reservableOnly,
        openNowOnly = filters.openNowOnly;

      // Associated restaurant's properties to filter by
      const categories = restaurant?.categories ?? [],
        customCategories = post.customUserProperties?.categories ?? [],
        priceLevel = Number(restaurant?.priceLevel ?? 0),
        creatorRating = Number(post.customUserProperties?.rating ?? 0),
        yelpRating = Number(restaurant?.yelpProperties?.rating ?? 0),
        googleRating = Number(restaurant?.googleProperties?.rating ?? 0);

      // Requirements, only apply filters when the filters are actually selected
      let cuisineTypeFilterFulfilled =
          selectedCuisineTypeFilters?.length > 0 ? false : true,
        creatorUIDFilterFulfilled =
          selectedCreatorUIDFilters?.length > 0 ? false : true,
        recognizedFilterFulfilled =
          selectedPublicationFilters?.length > 0 || selectedRestaurantAwardFilters?.length > 0 ? false : true,
        tagFilterFulfilled = selectedTagFilters?.length > 0 ? false : true,
        mealTypeFilterFulfilled =
          selectedMealTypeFilters?.length > 0 ? false : true,
        priceLevelFilterFulfilled =
          selectedPriceLevelFilters?.length > 0 ? false : true,
        creatorRatingFilterFulfilled =
          selectedCreatorRatingFilter > 0 ? false : true,
        yelpRatingFilterFulfilled = selectedYelpRatingFilter > 0 ? false : true,
        googleRatingFilterFulfilled =
          selectedGoogleRatingFilter > 0 ? false : true;

      // Price Levels
      if (!priceLevelFilterFulfilled) {
        priceLevelFilterFulfilled =
          selectedPriceLevelFilters.includes(priceLevel);
      }

      // Ratings
      if (!creatorRatingFilterFulfilled) {
        creatorRatingFilterFulfilled = selectedCreatorRatingFilter
          ? creatorRating >= selectedCreatorRatingFilter
          : true;
      }

      if (!yelpRatingFilterFulfilled) {
        yelpRatingFilterFulfilled = selectedYelpRatingFilter
          ? yelpRating >= selectedYelpRatingFilter
          : true;
      }

      if (!googleRatingFilterFulfilled) {
        googleRatingFilterFulfilled = selectedGoogleRatingFilter
          ? googleRating >= selectedGoogleRatingFilter
          : true;
      }

      // Cuisine Types and Meal Types
      if (!cuisineTypeFilterFulfilled || !mealTypeFilterFulfilled) {
        categories
          .map(
            (category) =>
              CUSINE_EQUIVALENCE.get(category.toLowerCase()) ??
              Set<DisplayableCuisine>()
          )
          .reduce((accum, data) => accum.union(data), Set())
          .forEach((displayableCuisine) => {
            const isCuisineSelected =
                selectedCuisineTypeFilters.includes(displayableCuisine),
              isMealTypeSelected =
                selectedMealTypeFilters.includes(displayableCuisine);

            if (isCuisineSelected) {
              cuisineTypeFilterFulfilled = true;
            }
            if (isMealTypeSelected) {
              mealTypeFilterFulfilled = true;
            }
          });
      }

      // Creator UIDs
      if (!creatorUIDFilterFulfilled) {
        creatorUIDFilterFulfilled = selectedCreatorUIDFilters.includes(
          creator.id
        );
      }

      // Recongnized Filter
      if (!recognizedFilterFulfilled) {
        recognizedFilterFulfilled = associatedPublications.some(
          (publication) => {
            return selectedPublicationFilters?.includes(publication);
          }
        ) || 
        associatedRestaurantAwards.some(
          (organization) => {
            return selectedRestaurantAwardFilters?.includes(organization);
          }
        );
      }

      // Custom categories / 'tags'
      if (!tagFilterFulfilled) {
        customCategories.forEach((category) => {
          const isTagSelected = selectedTagFilters.includes(category);

          if (isTagSelected) {
            tagFilterFulfilled = true;
          }
        });
      }

      // Determine date range inclusivity
      const isDateWithinRange = isInRange(
        postOriginalCreationDateTime,
        selectedDateRangeFilter[0],
        selectedDateRangeFilter[1]
      );

      const isDateRangeFilterFulfilled = isDateWithinRange,
        isFavoriteFilterFulfiilled = showOnlyFavorites ? isFavorited : true,
        isReservableFilterFulfilled = reservableOnly ? isReservable : true;

      // If no restaurant data is available while the filtr is toggled, then the post is excluded
      const isOpenNowFilterFulfilled = openNowOnly
        ? (fonciiRestaurant?.isOpen ?? false) == true
        : true;

      return (
        cuisineTypeFilterFulfilled &&
        creatorUIDFilterFulfilled &&
        recognizedFilterFulfilled &&
        tagFilterFulfilled &&
        mealTypeFilterFulfilled &&
        priceLevelFilterFulfilled &&
        creatorRatingFilterFulfilled &&
        yelpRatingFilterFulfilled &&
        googleRatingFilterFulfilled &&
        isDateRangeFilterFulfilled &&
        isFavoriteFilterFulfiilled &&
        isReservableFilterFulfilled &&
        isOpenNowFilterFulfilled
      );
    });

  return filteredPosts;
};
