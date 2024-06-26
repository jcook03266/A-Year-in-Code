// Package Dependencies
// Redux
import { useSelector } from "react-redux";

// Reducer Names
import { ReducerNames } from "../entities/slices";

// Curried (nested functions aka returning a function) accessors for obtaining the current redux store states of the following slices
export const getFonciiUserSlice = (): (() => FonciiUserSliceState) => {
  return () => {
    return useSelector(
      (state: any) => state[ReducerNames.FonciiUserReducerName]
    );
  };
};

export const getNotificationCenterSlice =
  (): (() => NotificationCenterSliceState) => {
    return () => {
      return useSelector(
        (state: any) => state[ReducerNames.NotificationReducerName]
      );
    };
  };

export const getVisitedUserSlice = (): (() => VisitedUserSliceState) => {
  return () => {
    return useSelector(
      (state: any) => state[ReducerNames.VisitedUserReducerName]
    );
  };
};

export const getPostFiltersSlice = (): (() => PostFiltersSliceState) => {
  return () => {
    return useSelector(
      (state: any) => state[ReducerNames.PostFiltersReducerName]
    );
  };
};

export const getUserPostsSlice = (): (() => UserPostsSliceState) => {
  return () => {
    return useSelector(
      (state: any) => state[ReducerNames.UserPostsReducerName]
    );
  };
};

export const getFonciiRestaurantsSlice =
  (): (() => FonciiRestaurantsSliceState) => {
    return () => {
      return useSelector(
        (state: any) => state[ReducerNames.FonciiRestaurantsReducerName]
      );
    };
  };

export const getMapboxSlice = (): (() => MapboxSliceState) => {
  return () => {
    return useSelector((state: any) => state[ReducerNames.MapboxReducerName]);
  };
};
