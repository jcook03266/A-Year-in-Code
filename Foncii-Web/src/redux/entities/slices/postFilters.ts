// Package Dependencies
// Types
import { DefaultPostFilters } from "../../../types/default-type-values";

// Slices
import { createSlice } from "@reduxjs/toolkit";
import { ReducerNames } from "../slices";

// The default state of this entity when first instantiated
export const initialState: PostFiltersSliceState = {
  // Collective filters
  ...DefaultPostFilters,

  // Selection States
  currentlySelectedPostID: null,

  // Filter Data Providers, populated by the current posts being displayed
  categoriesToFilterBy: [],
  tagsToFilterBy: [],
  priceLevelsToFilterBy: [1, 2, 3, 4],
  mealTypesToFilterBy: ["Breakfast", "Lunch", "Dinner", "Dessert"],
  ratingsToFilterBy: [1, 2, 3, 4, 5],
  dateFilterRange: [new Date().getTime(), new Date().getTime()],

  // In-memory / Local full-text search data provider
  computedPostTextContentMappings: {},

  // Searching
  searchQuery: undefined,
};

/**
 * Slice that stores global data tied to the current filters filtering posts with associated
 * restaurant data based on the properties of those restaurants (price, ratings, cuisines, etc.)
 * Slice Definition that combines type def, initial state, and reducer defs into a single object via toolkit
 */
const PostFiltersSlice = createSlice({
  name: ReducerNames.PostFiltersReducerName,
  initialState: initialState,
  reducers: {
    // Post selection state
    setCurrentlySelectedPostID: (state, action) => {
      const selectedPostID = action.payload.selectedPostID;

      state.currentlySelectedPostID = selectedPostID ?? null;
    },

    clearCurrentlySelectedPostID: (state, _) => {
      state.currentlySelectedPostID = null;
    },

    // Update all filters at once with an updated object
    setFilters: (state, action) => {
      const updatedFilters: PostFilters = action.payload.postFilters;

      state.priceLevels = updatedFilters.priceLevels;
      state.cuisineTypes = updatedFilters.cuisineTypes;
      state.creatorUIDs = updatedFilters.creatorUIDs;
      state.publications = updatedFilters.publications;
      state.restaurantAwards = updatedFilters.restaurantAwards;
      state.customCategories = updatedFilters.customCategories;
      state.mealTypes = updatedFilters.mealTypes;
      state.yelpRating = updatedFilters.yelpRating;
      state.googleRating = updatedFilters.googleRating;
      state.creatorRating = updatedFilters.creatorRating;
      state.dateRange = updatedFilters.dateRange;
      state.closestToFarthestSort = updatedFilters.closestToFarthestSort;
      state.newestToOldestSort = updatedFilters.newestToOldestSort;
      state.trendingSort = updatedFilters.trendingSort;
      state.qualitySort = updatedFilters.qualitySort;
      state.percentMatchSort = updatedFilters.percentMatchSort;
      state.showFavoritesOnly = updatedFilters.showFavoritesOnly;
      state.openNowOnly = updatedFilters.openNowOnly;
      state.reservableOnly = updatedFilters.reservableOnly;
      state.targetReservationDate = updatedFilters.targetReservationDate;
      state.targetReservationPartySize =
        updatedFilters.targetReservationPartySize;
    },

    setSearchQuery: (state, action) => {
      const searchQuery = action.payload.searchQuery;

      state.searchQuery = searchQuery;
    },

    setCategoriesToFilterBy: (state, action) => {
      const categories: string[] = action.payload.categories;

      // De-duplicate and transform back into an array since categories have to be unique
      state.categoriesToFilterBy = [...new Set(categories)];
    },

    setTagsToFilterBy: (state, action) => {
      const customCategories: string[] = action.payload.customCategories;

      state.tagsToFilterBy = [...new Set(customCategories)];
    },

    setDateRangeToFilterBy: (state, action) => {
      // [Max, Min] Max is the most recent date (newest), and min the oldest date
      const dateRange = action.payload.dateRange;

      // The reference and current filter values both conform to the same range when the range is set
      state.dateFilterRange = dateRange;
      state.dateRange = dateRange;
    },

    setComputedPostTextContentMappings: (state, action) => {
      const computedMappings = action.payload.computedMappings;

      state.computedPostTextContentMappings = computedMappings;
    },

    // Clear all applied filters, usually used when switching between walls or logging out
    clear: () => initialState,
  },
});

// Separate action and reducer exports for easy access in other modules
export const {
  setCurrentlySelectedPostID,
  clearCurrentlySelectedPostID,
  setFilters,
  setSearchQuery,
  setCategoriesToFilterBy,
  setTagsToFilterBy,
  setDateRangeToFilterBy,
  setComputedPostTextContentMappings,
  clear,
} = PostFiltersSlice.actions;

export default PostFiltersSlice.reducer;
