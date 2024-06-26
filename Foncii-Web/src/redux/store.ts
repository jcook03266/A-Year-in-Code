"use client";
// Dependencies
// Redux
import { combineReducers, configureStore } from "@reduxjs/toolkit";

// Utilities
import throttle from "lodash/throttle";

// Reducers
import fonciiUserReducer from "./entities/slices/fonciiUser";
import notificationCenterReducer from "./entities/slices/notifications";
import visitedUserReducer from "./entities/slices/visitedUser";
import postFiltersReducer from "./entities/slices/postFilters";
import userPostsReducer from "./entities/slices/userPosts";
import fonciiRestaurantsReducer from "./entities/slices/fonciiRestaurants";
import mapboxReducer from "./entities/slices/mapboxSlice";

// Slice Identifiers
import { ReducerNames } from "./entities/slices";

// Local Storage Persistence
import localStorageContainer, {
  setReduxAppStateTree,
} from "../core-foncii-maps/containers/localStorageContainer";

// Utils
import { UnitsOfTimeInMS } from "../utilities/common/time";

// Properties
/**
 * In milliseconds ~ 1 second, the app tree is throttled to only
 * save itself once every second, to reduce performance issues with the stringify function
 */
const stateTreeSaveFrequency: number = UnitsOfTimeInMS.second;

// Combine all reducers under one encapsulation to pass to the store
const reducer = combineReducers({
  [ReducerNames.FonciiUserReducerName]: fonciiUserReducer,
  [ReducerNames.NotificationReducerName]: notificationCenterReducer,
  [ReducerNames.VisitedUserReducerName]: visitedUserReducer,
  [ReducerNames.PostFiltersReducerName]: postFiltersReducer,
  [ReducerNames.UserPostsReducerName]: userPostsReducer,
  [ReducerNames.FonciiRestaurantsReducerName]: fonciiRestaurantsReducer,
  [ReducerNames.MapboxReducerName]: mapboxReducer,
});

/**
 * The global store that is used throughout the application to store all required states.
 *
 * IMPORTANT: When adding breaking change updates to the Redux store (ones that require new tests for instance)
 * update the app properties to flush the store for any users running an outdated client.
 */
const store = configureStore({
  reducer,
  preloadedState: localStorageContainer().ReduxAppStateTree, // Persisted state overrides the initial state set by the reducers
});

// Subscribe to published events from the store when it updates on any state change
store.subscribe(
  throttle(() => {
    const currentUserState = store.getState().fonciiUser;

    // Don't persist if the user is currently signing out, the state tree has to be invalidated
    if (currentUserState.signingOut) {
      return;
    }

    // Persist the app's entire state
    setReduxAppStateTree(store.getState());
  }, stateTreeSaveFrequency)
);

export default store;
