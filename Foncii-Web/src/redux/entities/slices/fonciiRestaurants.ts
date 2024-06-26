// Package Dependencies
// Slices
import { createSlice } from "@reduxjs/toolkit";
import { ReducerNames } from "../slices";

// Foncii Restaurant Helpers
import { sortAndFilterFonciiRestaurants } from "../../../core-foncii-maps/helpers/fonciiRestaurantHelpers";

// Types
import {
  AutoCompleteSuggestion,
  FonciiRestaurant,
} from "../../../__generated__/graphql";

// Utilities
import { currentDateAsMSTime } from "../../../utilities/common/convenienceUtilities";

// The default state of this entity when first instantiated
export const initialState: FonciiRestaurantsSliceState = {
  fonciiRestaurants: [], // Unfiltered and unsorted foncii restaurants
  savedFonciiRestaurants: [], // Unfiltered and unsorted saved foncii restaurants
  canPaginateSavedRestaurants: false, // True if there are more saved restaurants to paginate, false otherwise ~ false by default until marked as true
  searchQuery: "", // Text query to pass to the semantic search engine
  queryID: undefined, // ID of the last successful search query, used to associate conversion events with specific searches
  cachedSearchQueries: [], // Cached queries to display in the search drop down, maximum of 3 to display at any given time, 100 possible search queries with the oldest being evicted
  autocompleteSuggestions: [], // Autocomplete suggestions to persist and use outside of the explore auto-complete domain
  visibleFonciiRestaurants: [], // Filtered and sorted foncii restaurants
  isLoading: false, // True when some async process is occurring, false otherwise
  loadingSavedRestaurants: false
};

const fonciiRestaurantsSlice = createSlice({
  name: ReducerNames.FonciiRestaurantsReducerName,
  initialState: initialState,
  reducers: {
    // All actions that can be taken on this slice //
    // Splits the combined list of all foncii restaurants into separate visible and hidden lists, as well as sorts them by favorite status
    // Can be used to update either list when the main list is edited or a post is updated individually
    organizeRestaurants: (state, action) => {
      // Separate to copy array to avoid mutating the state directly
      let visibleFonciiRestaurants: FonciiRestaurant[] =
        state.fonciiRestaurants;

      // Parsed filter properties
      const currentUserCoordinates = action.payload.currentUserCoordinates,
        postFilters = action.payload.postFilters,
        selectedFonciiRestaurantID = action.payload.selectedFonciiRestaurantID;

      // Data separation
      visibleFonciiRestaurants = sortAndFilterFonciiRestaurants(
        visibleFonciiRestaurants,
        selectedFonciiRestaurantID,
        currentUserCoordinates,
        postFilters
      );

      state.visibleFonciiRestaurants = visibleFonciiRestaurants;
    },

    // Sets the list of posts and organizes them
    setRestaurants: (state, action) => {
      const updatedFonciiRestaurants: FonciiRestaurant[] =
        action.payload.updatedFonciiRestaurants;

      // Deduplicate if necessary
      state.fonciiRestaurants = [...new Set(updatedFonciiRestaurants)];
    },

    // Updates the existing restaurant's data with the updated restaurant
    updateRestaurant: (state, action) => {
      const updatedFonciiRestaurant = action.payload
        .updatedFonciiRestaurant as FonciiRestaurant,
        copyArray = state.fonciiRestaurants;

      // Update the existing restaurant's data with the updated restaurant
      const updatedFonciiRestaurants = copyArray.map((fonciiRestaurant) => {
        if (
          fonciiRestaurant.restaurant.id ===
          updatedFonciiRestaurant.restaurant.id
        ) {
          return { ...fonciiRestaurant, ...updatedFonciiRestaurant };
        } else {
          return fonciiRestaurant;
        }
      });

      state.fonciiRestaurants = updatedFonciiRestaurants;
    },

    // Appends a new foncii restaurant to the list of foncii restaurants, used when downloading a foncii restaurant outside of the current dataset, i.e detail views
    appendRestaurant: (state, action) => {
      const newFonciiRestaurant: FonciiRestaurant =
        action.payload.newFonciiRestaurant,
        doesRestaurantExist =
          state.fonciiRestaurants.find(
            (fonciiRestaurant) =>
              fonciiRestaurant.restaurant.id ==
              newFonciiRestaurant.restaurant.id
          ) != undefined;

      // If the foncii restaurant doesn't already exist in the current dataset, add it to the list of foncii restaurants
      if (!doesRestaurantExist) {
        const copyArray = state.fonciiRestaurants;
        copyArray.push(newFonciiRestaurant);

        state.fonciiRestaurants = copyArray;
      }
    },

    setCanPaginateSavedRestaurants: (state, action) => {
      const canPaginateSavedRestaurants =
        action.payload.canPaginateSavedRestaurants;

      state.canPaginateSavedRestaurants = canPaginateSavedRestaurants;
    },

    setSavedRestaurants: (state, action) => {
      const savedFonciiRestaurants: FonciiRestaurant[] =
        action.payload.savedFonciiRestaurants;

      // Deduplicate if necessary
      state.savedFonciiRestaurants = [...new Set(savedFonciiRestaurants)];
    },

    insertSavedRestaurants: (state, action) => {
      const savedFonciiRestaurantsToInsert: FonciiRestaurant[] =
        action.payload.savedFonciiRestaurants,
        currentSavedFonciiRestaurants = state.savedFonciiRestaurants,
        deduplicatedSavedRestaurants: FonciiRestaurant[] = [
          ...currentSavedFonciiRestaurants,
        ];

      // Deduplicate the copy array by only inserting restaurants that are not already included inside of the
      // saved restaurants store
      savedFonciiRestaurantsToInsert.map((savedFonciiRestaurant) => {
        const savedRestaurantID = savedFonciiRestaurant.restaurant.id;

        const alreadyInserted =
          deduplicatedSavedRestaurants.find((fonciiRestaurant) => {
            const restaurantID = fonciiRestaurant.restaurant.id;
            return savedRestaurantID == restaurantID;
          }) != undefined;

        if (!alreadyInserted)
          deduplicatedSavedRestaurants.push(savedFonciiRestaurant);
      });

      // Deduplicate if necessary
      state.savedFonciiRestaurants = deduplicatedSavedRestaurants;
    },

    appendSavedRestaurant: (state, action) => {
      const savedFonciiRestaurant: FonciiRestaurant =
        action.payload.savedFonciiRestaurant,
        doesSavedRestaurantExist =
          state.savedFonciiRestaurants.find(
            (fonciiRestaurant) =>
              fonciiRestaurant.restaurant.id ==
              savedFonciiRestaurant.restaurant.id
          ) != undefined;

      // If the saved foncii restaurant doesn't already exist in the current dataset, add it to the list of saved foncii restaurants
      if (!doesSavedRestaurantExist) {
        const copyArray = state.savedFonciiRestaurants;
        copyArray.push(savedFonciiRestaurant);

        state.savedFonciiRestaurants = copyArray;
      }
    },

    removeSavedRestaurant: (state, action) => {
      const idOfRestaurantToRemove: string = action.payload.fonciiRestaurantID,
        updatedSavedFonciiRestaurants = state.savedFonciiRestaurants.filter(
          (fonciiRestaurant) =>
            fonciiRestaurant.restaurant.id != idOfRestaurantToRemove
        );

      state.canPaginateSavedRestaurants = false;
      state.savedFonciiRestaurants = updatedSavedFonciiRestaurants;
    },

    removeAllSavedRestaurants: (state, _) => {
      state.savedFonciiRestaurants = initialState.savedFonciiRestaurants;
    },

    setSearchQuery: (state, action) => {
      const searchQuery = action.payload.searchQuery;

      state.searchQuery = searchQuery;
    },

    setQueryID: (state, action: { payload: { queryID?: string } }) => {
      const queryID = action.payload.queryID;

      state.queryID = queryID;
    },

    updateRestaurantWithAssociatedArticles: (state, action) => {
      const associatedArticlePublicationEdges =
        action.payload.associatedArticlePublicationEdges,
        restaurantID = action.payload.restaurantID;

      // Find and mutate the target restaurant with the given
      let fonciiRestaurants = state.fonciiRestaurants;

      fonciiRestaurants = fonciiRestaurants.map((fonciiRestaurant) => {
        if (fonciiRestaurant.restaurant.id == restaurantID) {
          fonciiRestaurant.associatedArticlePublicationEdges =
            associatedArticlePublicationEdges;
        }

        return fonciiRestaurant;
      });

      state.fonciiRestaurants = fonciiRestaurants; // Update the state with the updated list of foncii restaurants
    },

    // Inserts a search query to use for later as a search suggestion
    cacheSearchQuery: (state, action: { payload: { searchQuery: string } }) => {
      // Limits
      const maxCacheTenants = 100; // Adjust as needed but this is a good amount for now

      // Parsing
      const { searchQuery } = action.payload;
      let softCopy = state.cachedSearchQueries;

      // Sorting
      // Sort by newest to oldest, newest cached queries go on top
      softCopy.sort((a, b) => {
        return b.timestamp - a.timestamp;
      });

      // Filter out the target search query if it exists in the cache already
      softCopy = softCopy.filter(
        (cachedSearchQuery) => cachedSearchQuery.query != searchQuery
      );

      // Conditional eviction, if the cache is full evict the oldest tenant
      if (softCopy.length >= maxCacheTenants) {
        softCopy.pop();
      }

      // Insertion, insert the new search query at the beginning of the array as it's the newest edition
      softCopy.unshift({
        query: searchQuery,
        timestamp: currentDateAsMSTime(),
      });

      // Sorted + potential eviction handled if any + new insertion
      state.cachedSearchQueries = softCopy;
    },

    evictCachedSearchQuery: (
      state,
      action: { payload: { searchQuery: string } }
    ) => {
      const { searchQuery } = action.payload;

      // Update the cache with an array of only the cached queries that don't match the target search query string
      state.cachedSearchQueries = state.cachedSearchQueries.filter(
        (cachedSearchQuery) => cachedSearchQuery.query != searchQuery
      );
    },

    // Removes all cached queries from the search query cache
    invalidateSearchQueryCache: (state, _) => {
      state.cachedSearchQueries = initialState.cachedSearchQueries;
    },

    setAutocompleteSuggestions: (
      state,
      action: { payload: { autocompleteSuggestions: AutoCompleteSuggestion[] } }
    ) => {
      const { autocompleteSuggestions } = action.payload;

      state.autocompleteSuggestions = autocompleteSuggestions;
    },

    clearAutocompleteSuggestions: (state, _) => {
      state.autocompleteSuggestions = [];
    },

    setLoadingState: (state, action) => {
      state.isLoading = action.payload.isLoading ?? false;
    },

    setLoadingSaveRestaurantsState: (state, action) => {
      state.isLoading = action.payload.loadingSavedRestaurants ?? false;
    },

    // Clears all foncii restaurants, can be performed when navigating away from the explore page as a lot of memory is
    // taken up by it, but this behavior subjective.
    clear: () => initialState,
  },
});

// Separate action and reducer exports for easy access in other modules
export const {
  organizeRestaurants,
  setRestaurants,
  updateRestaurant,
  appendRestaurant,
  setCanPaginateSavedRestaurants,
  setSavedRestaurants,
  insertSavedRestaurants,
  appendSavedRestaurant,
  removeSavedRestaurant,
  removeAllSavedRestaurants,
  setSearchQuery,
  setQueryID,
  updateRestaurantWithAssociatedArticles,
  cacheSearchQuery,
  evictCachedSearchQuery,
  invalidateSearchQueryCache,
  setAutocompleteSuggestions,
  clearAutocompleteSuggestions,
  setLoadingState,
  setLoadingSaveRestaurantsState,
  clear,
} = fonciiRestaurantsSlice.actions;

export default fonciiRestaurantsSlice.reducer;
