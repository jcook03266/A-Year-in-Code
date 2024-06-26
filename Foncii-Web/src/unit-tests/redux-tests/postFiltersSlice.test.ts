// Dependencies
// Types
import { DefaultPostFilters } from "../../types/default-type-values";

// Actions
import {
  setCurrentlySelectedPostID,
  clearCurrentlySelectedPostID,
  setFilters,
  setSearchQuery,
  setCategoriesToFilterBy,
  setTagsToFilterBy,
  setDateRangeToFilterBy,
  setComputedPostTextContentMappings,
  clear,
} from "../../redux/entities/slices/postFilters"; // Import your Redux slice actions

// Reducer + Initial State
import postFiltersReducer, {
  initialState,
} from "../../redux/entities/slices/postFilters";

// Post Filters Redux Slice Testing Scheme
describe("PostFiltersSlice", () => {
  let initialStateCopy: PostFiltersSliceState;

  beforeEach(() => {
    initialStateCopy = { ...initialState };
  });

  it("should set currently selected post ID", () => {
    const selectedPostID = "12345";
    const newState = postFiltersReducer(
      initialStateCopy,
      setCurrentlySelectedPostID({ selectedPostID })
    );

    expect(newState.currentlySelectedPostID).toBe(selectedPostID);
  });

  it("should clear currently selected post ID", () => {
    initialStateCopy.currentlySelectedPostID = "12345";
    const newState = postFiltersReducer(
      initialStateCopy,
      clearCurrentlySelectedPostID({})
    );

    expect(newState.currentlySelectedPostID).toBeNull();
  });

  it("should set filters", () => {
    const updatedFilters: PostFilters = {
        ...initialStateCopy,
        creatorRating: 3,
      },
      newState = postFiltersReducer(
        initialStateCopy,
        setFilters({ postFilters: updatedFilters })
      );

    expect(newState).toEqual(updatedFilters);
  });

  it("should set search query", () => {
    const newSearchQuery = "New Search Query",
      newState = postFiltersReducer(
        initialStateCopy,
        setSearchQuery({ searchQuery: newSearchQuery })
      );

    expect(newState.searchQuery).toBe(newSearchQuery);
  });

  it("should set categories to filter by", () => {
    const categories = ["Category1", "Category2"];
    const newState = postFiltersReducer(
      initialStateCopy,
      setCategoriesToFilterBy({ categories })
    );

    expect(newState.categoriesToFilterBy).toEqual(categories);
  });

  it("should set tags to filter by", () => {
    const tags = ["Tag1", "Tag2"];
    const newState = postFiltersReducer(
      initialStateCopy,
      setTagsToFilterBy({ customCategories: tags })
    );

    expect(newState.tagsToFilterBy).toEqual(tags);
  });

  it("should set date range to filter by", () => {
    const dateRange = [new Date(2021, 1, 1), new Date(2021, 1, 2)],
      newState = postFiltersReducer(
        initialStateCopy,
        setDateRangeToFilterBy({ dateRange })
      );

    expect(newState.dateFilterRange).toEqual(dateRange);
  });

  it("should set computed post text content mappings", () => {
    const computedMappings = { randomPostID123: "randomPostTextContent" },
      newState = postFiltersReducer(
        initialStateCopy,
        setComputedPostTextContentMappings({ computedMappings })
      );

    expect(newState.computedPostTextContentMappings).toEqual(computedMappings);
  });

  it("should clear the state", () => {
    const mutatedFilters: PostFilters = {
      ...DefaultPostFilters,
      creatorRating: 3,
      yelpRating: 4,
      googleRating: 2,
    };

    initialStateCopy = { ...initialStateCopy, ...mutatedFilters };
    initialStateCopy.categoriesToFilterBy = ["Category1", "Category2"];

    const newState = postFiltersReducer(initialStateCopy, clear());

    expect(newState).toEqual(initialState);
  });
});
