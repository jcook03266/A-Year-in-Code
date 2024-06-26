// Dependencies
// Types
import { DefaultPostFilters } from "../../types/default-type-values";
import { CoordinatePoint, FonciiRestaurant } from "../../__generated__/graphql";

// Utilities
import { computeDistanceBetweenCoordinatePoints } from "../../utilities/math/euclideanGeometryMath";
import { DisplayableCuisine, CUSINE_EQUIVALENCE } from "../../types/cuisines";
import { Set } from "immutable";

// Various sorting and filtering helpers for adding high level conditional logic to displaying foncii restaurants for the explore page //
// Restaurant sorting and filtering logic
export const sortAndFilterFonciiRestaurants = (
  fonciiRestaurants: FonciiRestaurant[],
  currentlySelectedFonciiRestaurantID: string | undefined = undefined,
  userCoordinates: CoordinatePoint | undefined = undefined,
  filters: PostFilters
): FonciiRestaurant[] => {
  // Filter out foncii restaurants, then sort to save on unnecessary computation
  return sortFonciiRestaurants(
    filterFonciiRestaurants(fonciiRestaurants, filters),
    currentlySelectedFonciiRestaurantID,
    userCoordinates,
    filters
  );
};

// Sorting Functions
// Sort goes by the following order: [Least important] Saved -> (Distance || Creation Date) -> (Percent Match Score) Current Selection [most important]
export const sortFonciiRestaurants = (
  fonciiRestaurants: FonciiRestaurant[],
  currentlySelectedFonciiRestaurantID: string | undefined = undefined,
  userCoordinates: CoordinatePoint | undefined = undefined,
  filters: PostFilters = DefaultPostFilters
): FonciiRestaurant[] => {
  let sortedFonciiRestaurants = sortBySaved(fonciiRestaurants);

  // Optional filters
  if (filters.newestToOldestSort) {
    sortedFonciiRestaurants = sortByCreationDate(
      sortedFonciiRestaurants,
      filters
    );
  }

  if (filters.closestToFarthestSort) {
    sortedFonciiRestaurants = sortByDistanceToUser(
      sortedFonciiRestaurants,
      userCoordinates
    );
  }

  if (filters.trendingSort) {
    // TODO: - Implement
  }

  if (filters.qualitySort) {
    sortedFonciiRestaurants = sortByQualityScore(sortedFonciiRestaurants);
  }

  if (filters.percentMatchSort) {
    sortedFonciiRestaurants = sortByPercentMatchScore(sortedFonciiRestaurants);
  }

  // Other filters
  // Disabled for now, no longer sorting by selection
  // sortedFonciiRestaurants = sortByCurrentSelection(
  //     sortedFonciiRestaurants,
  //     currentlySelectedFonciiRestaurantID
  // );

  return sortedFonciiRestaurants;
};

// Sort the foncii restaurants by distance to the user, nearest restaurants go to the top of the gallery
const sortByDistanceToUser = (
  fonciiRestaurants: FonciiRestaurant[] = [],
  userCoordinates: CoordinatePoint | undefined = undefined
): FonciiRestaurant[] => {
  const currentUserCoordinates = userCoordinates;

  // Sort the foncii restaurants by distance, nearest restaurants go to the top of the gallery
  // If the user's current coordinates are available
  if (currentUserCoordinates) {
    const softCopy = [...fonciiRestaurants];

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

  return fonciiRestaurants;
};

const sortByCreationDate = (
  fonciiRestaurants: FonciiRestaurant[] = [],
  filters: PostFilters
): FonciiRestaurant[] => {
  const softCopy = [...fonciiRestaurants];

  return softCopy.sort((restaurantA, restaurantB) => {
    // Properties
    const restaurantAOriginalCreationDateTime =
        getCreationDateTime(restaurantA),
      restaurantBOriginalCreationDateTime = getCreationDateTime(restaurantB);

    // Sort order -> Descending = largest to smallest, largest = biggest date offset / oldest date from some orign point
    // aka the most recent date because that's how time works.
    const descendingSortOrder = filters.newestToOldestSort;

    function getCreationDateTime(fonciiRestaurant: FonciiRestaurant) {
      const originalCreationDateTimestamp =
          fonciiRestaurant.restaurant.creationDate,
        originalCreationDate = new Date(originalCreationDateTimestamp),
        originalCreationDateTime = originalCreationDate.getTime();

      return originalCreationDateTime;
    }

    return descendingSortOrder
      ? restaurantBOriginalCreationDateTime -
          restaurantAOriginalCreationDateTime
      : restaurantAOriginalCreationDateTime -
          restaurantBOriginalCreationDateTime;
  });
};

// Sort the given foncii restaurants by their quality score, top quality go to the top of the gallery
const sortByQualityScore = (
  fonciiRestaurants: FonciiRestaurant[] = []
): FonciiRestaurant[] => {
  const softCopy = [...fonciiRestaurants];

  return softCopy.sort((fonciiRestaurantA, fonciiRestaurantB) => {
    return (
      (fonciiRestaurantB?.qualityScore ?? 0) -
      (fonciiRestaurantA?.qualityScore ?? 0)
    );
  });
};

// Sort the given foncii restaurants by percent match score, best matches go to the top of the gallery
const sortByPercentMatchScore = (
  fonciiRestaurants: FonciiRestaurant[] = []
): FonciiRestaurant[] => {
  const softCopy = [...fonciiRestaurants];

  return softCopy.sort((fonciiRestaurantA, fonciiRestaurantB) => {
    return (
      (fonciiRestaurantB?.percentMatchScore ?? 0) -
      (fonciiRestaurantA?.percentMatchScore ?? 0)
    );
  });
};

// [Not used] but kept for later use (if any)
// Sort the foncii restaurants by saves, saved foncii restaurants go to the top of the gallery
const sortBySaved = (
  fonciiRestaurants: FonciiRestaurant[] = []
): FonciiRestaurant[] => {
  const softCopy = [...fonciiRestaurants];

  return softCopy.sort((a, b) => Number(b.isSaved) - Number(a.isSaved));
};

// Currently selected foncii restaurants rise to the top of the gallery
const sortByCurrentSelection = (
  fonciiRestaurants: FonciiRestaurant[] = [],
  currentlySelectedFonciiRestaurantID: string | undefined = undefined
): FonciiRestaurant[] => {
  const softCopy = [...fonciiRestaurants];

  return softCopy.sort((restaurantA, restaurantB) =>
    restaurantA.restaurant.id === currentlySelectedFonciiRestaurantID &&
    !(restaurantB.restaurant.id === currentlySelectedFonciiRestaurantID)
      ? -1
      : 1
  );
};

// Filter Functions
export const filterFonciiRestaurants = (
  fonciiRestaurants: FonciiRestaurant[],
  filters: PostFilters
): FonciiRestaurant[] => {
  const copyArray = [...fonciiRestaurants],
    filteredFonciiRestaurants = copyArray.filter((fonciiRestaurant) => {
      // Parse restaurant data
      const restaurant = fonciiRestaurant.restaurant,
        associatedInfluencers = fonciiRestaurant.influencerInsightEdges.map(
          (influencerInsightEdge) => {
            return influencerInsightEdge.creator;
          }
        ),
        associatedCategories = fonciiRestaurant.influencerInsightEdges.flatMap(
          (influencerInsightEdge) => {
            return influencerInsightEdge.customUserProperties?.categories ?? [];
          }
        ),
        associatedPublications =
          fonciiRestaurant.associatedArticlePublicationEdges.map(
            (article) => article.publication
          ),
        associatedRestaurantAwards =
          fonciiRestaurant.associatedRestaurantAwardEdges.map(
            (award) => award.organization
          );

      // Selected Filters
      const selectedPriceLevelFilters = filters.priceLevels,
        selectedCuisineTypeFilters = filters.cuisineTypes,
        selectedCreatorUIDFilters = filters.creatorUIDs,
        selectedPublicationFilters = filters.publications,
        selectedRestaurantAwardFilters = filters.restaurantAwards,
        selectedTagFilters = filters.customCategories,
        selectedMealTypeFilters = filters.mealTypes,
        selectedAverageFonciiRatingFilter = filters.creatorRating,
        selectedYelpRatingFilter = filters.yelpRating,
        selectedGoogleRatingFilter = filters.googleRating,
        reservableOnly = filters.reservableOnly,
        openNowOnly = filters.openNowOnly;

      // Associated restaurant's properties to filter by
      const categories = restaurant?.categories ?? [],
        priceLevel = Number(restaurant?.priceLevel ?? 0),
        averageFonciiRating = Number(fonciiRestaurant.averageFonciiRating ?? 0),
        yelpRating = Number(restaurant?.yelpProperties?.rating ?? 0),
        googleRating = Number(restaurant?.googleProperties?.rating ?? 0),
        isReservable = fonciiRestaurant.reservationsAvailable;

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
        averageFonciiRatingFilterFulfilled =
          selectedAverageFonciiRatingFilter > 0 ? false : true,
        yelpRatingFilterFulfilled = selectedYelpRatingFilter > 0 ? false : true,
        googleRatingFilterFulfilled =
          selectedGoogleRatingFilter > 0 ? false : true;

      // Price Levels
      if (!priceLevelFilterFulfilled) {
        priceLevelFilterFulfilled =
          selectedPriceLevelFilters.includes(priceLevel);
      }

      // Ratings
      if (!averageFonciiRatingFilterFulfilled) {
        averageFonciiRatingFilterFulfilled = selectedAverageFonciiRatingFilter
          ? averageFonciiRating >= selectedAverageFonciiRatingFilter
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

      // Creator UIDs
      if (!creatorUIDFilterFulfilled) {
        // Determine if any of the associated creators for this restaurant fall in line with the creator filter
        creatorUIDFilterFulfilled = associatedInfluencers.some((creator) => {
          return selectedCreatorUIDFilters?.includes(creator.id);
        });
      }

      // Recognized Filter
      if (!recognizedFilterFulfilled) {
        recognizedFilterFulfilled = 
          associatedPublications.some(
            (publication) => {
              return selectedPublicationFilters?.includes(publication);
            }
          ) || 
          associatedRestaurantAwards.some(
            (organization) => {
              return selectedRestaurantAwardFilters?.includes(organization);
            }
          )
      }

      // Categories (Tags)
      if (!tagFilterFulfilled) {
        tagFilterFulfilled = selectedTagFilters.some((tag) => {
          return associatedCategories?.includes(tag);
        });
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

      const isReservableFilterFulfilled = reservableOnly ? isReservable : true;

      // If no restaurant data is available while the filtr is toggled, then the restaurant is excluded
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
        averageFonciiRatingFilterFulfilled &&
        yelpRatingFilterFulfilled &&
        googleRatingFilterFulfilled &&
        isReservableFilterFulfilled &&
        isOpenNowFilterFulfilled
      );
    });

  return filteredFonciiRestaurants;
};
