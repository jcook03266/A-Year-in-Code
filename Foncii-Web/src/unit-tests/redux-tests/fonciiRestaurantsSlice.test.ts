// Dependencies
// Types
import {
  ConfigurableMockFonciiRestaurantData,
  MockCoordinatePointData,
} from "../../types/mocks/mock-gql-types";

// Default Values
import { DefaultPostFilters } from "../../types/default-type-values";
import {
  defaultMapBoxCenter,
  defaultMapBoxZoomLevel,
} from "../../core-foncii-maps/default-values/UserDefaults";

// Actions
import {
  organizeRestaurants,
  setRestaurants,
  appendRestaurant,
  setSearchQuery,
  setLoadingState,
  clear,
} from "../../redux/entities/slices/fonciiRestaurants";

// Reducer + Initial State
import fonciiRestaurantsReducer, {
  initialState,
} from "../../redux/entities/slices/fonciiRestaurants";

// Foncii Restaurants Redux Slice Testing Scheme
describe("FonciiRestaurantsSlice", () => {
  let initialStateCopy: FonciiRestaurantsSliceState;

  // Reset the state before each test
  beforeEach(() => {
    initialStateCopy = { ...initialState };
  });

  it("should organize foncii restaurants", () => {
    const selectedMockFonciiRestaurant =
        ConfigurableMockFonciiRestaurantData(false),
      favoritedMockFonciiRestaurant =
        ConfigurableMockFonciiRestaurantData(true); // Favorited

    // Adding test restaurants
    initialStateCopy.fonciiRestaurants = [
      favoritedMockFonciiRestaurant,
      selectedMockFonciiRestaurant,
    ];

    // Configure date range of 'DefaultPostFilters'
    const postFilters = DefaultPostFilters;

    const actionPayload = {
      currentUserCoordinates: MockCoordinatePointData,
      postFilters: postFilters,
      selectedFonciiRestaurantID: selectedMockFonciiRestaurant.restaurant.id,
    };

    const newState = fonciiRestaurantsReducer(
      initialStateCopy,
      organizeRestaurants(actionPayload)
    );

    expect(newState.visibleFonciiRestaurants).toHaveLength(2);
  });

  it("should set foncii restaurants and related states", () => {
    const actionPayload = {
      updatedFonciiRestaurants: [
        ConfigurableMockFonciiRestaurantData(),
        ConfigurableMockFonciiRestaurantData(),
      ],
    };

    const newState = fonciiRestaurantsReducer(
      initialStateCopy,
      setRestaurants(actionPayload)
    );

    expect(newState.fonciiRestaurants).toHaveLength(2);
    expect(newState.visibleFonciiRestaurants).toHaveLength(0); // Not yet organized so this should be 0
  });

  it("should append a new foncii restaurant", () => {
    const actionPayload = {
      newFonciiRestaurant: ConfigurableMockFonciiRestaurantData(),
    };

    const newState = fonciiRestaurantsReducer(
      initialStateCopy,
      appendRestaurant(actionPayload)
    );

    expect(newState.fonciiRestaurants).toHaveLength(1);
  });

  it("should set a search query", () => {
    const testQuery = "Italian",
      newState = fonciiRestaurantsReducer(
        initialStateCopy,
        setSearchQuery({ searchQuery: testQuery })
      );

    expect(newState.searchQuery).toBe(testQuery);
  });

  it("should set loading state", () => {
    const newState = fonciiRestaurantsReducer(
      initialStateCopy,
      setLoadingState({ isLoading: true })
    );

    expect(newState.isLoading).toBe(true);
  });

  it("should clear the state", () => {
    // Create an initial state with some values to clear
    initialStateCopy.isLoading = true;
    initialStateCopy.fonciiRestaurants = [
      ConfigurableMockFonciiRestaurantData(),
      ConfigurableMockFonciiRestaurantData(),
    ];

    const newState = fonciiRestaurantsReducer(initialStateCopy, clear());

    expect(newState).toEqual(initialState);
  });
});
