"use client";
// Dependencies
// Redux
import {
  getFonciiRestaurantsSlice,
  getFonciiUserSlice,
  getUserPostsSlice,
  getVisitedUserSlice,
} from "../../../redux/operations/selectors";

// Hooks
import { useEffect } from "react";

// Utils
import { cn } from "../../../utilities/development/DevUtils";

// Loading indicator displayed at the top of the screen
// that pans back and forth in and out of the viewport
export const TopLoadingIndicator = (): React.ReactNode => {
  // State Management
  const fonciiUser = getFonciiUserSlice()(),
    userPosts = getUserPostsSlice()(),
    fonciiRestaurants = getFonciiRestaurantsSlice()(),
    visitedUser = getVisitedUserSlice()();

  // Effects for Reactive UI updates
  useEffect(() => { }, [fonciiUser, userPosts, visitedUser, fonciiRestaurants]);

  // Convenience
  const isAsyncOperationInProgress = (): boolean => {
    const operationInProgress =
      fonciiUser?.isLoading ||
      userPosts?.isLoading ||
      fonciiRestaurants?.isLoading ||
      visitedUser?.isLoading;

    return operationInProgress;
  };

  const shouldAnimate = (): boolean => {
    return isAsyncOperationInProgress();
  };

  return (
    <div className={'z-[9999] fixed top-0 left-0 w-full h-[2px] overflow-hidden'}>
      <div className={cn(shouldAnimate() ? "animate-top-loading-bar" : "translate-x-[-100dvw]",
        'bg-primary transition-all ease-in-out absolute top-0 left-0 w-[30%] h-full rounded-sm overflow-hidden')}
      />
    </div>
  );
};
