/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Navigation
import {
  IdentifiableAppRoutes,
  SharedURLParameters,
} from "../core-foncii-maps/properties/NavigationProperties";
import { getAppRouteIDForPathname } from "../core-foncii-maps/navigation/PathAssociatedValues";

// Hooks
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouterSearchParams } from "./UseRouterSearchParamsHook";

// Managers
import UserManager from "../managers/userManager";

// TODO: - Remove redundant functions and simplify this hook even more
/**
 * A simple hook that simplifies determining the current route
 * the website is at. Doesn't actually observe and react to anything
 * yet, just a modular way of passing this specific computed state
 * between the different components that rely on it.
 */
export const useRouteObserver = () => {
  // Dynamic Routing
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routerSearchParams = useRouterSearchParams();

  // State Management
  // Updates the state of hosting components, useEffect is not sufficient for invoking downstream updates
  const [_, setCurrentPathname] = useState(pathname);

  // Refresh on pathname change
  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname, searchParams]);

  // Active Routes
  const explorePageActive = (): boolean => {
    return (
      getAppRouteIDForPathname(location.pathname) ==
      IdentifiableAppRoutes.explorePage
    );
  };

  const galleryPageActive = (): boolean => {
    return (
      getAppRouteIDForPathname(location.pathname) ==
      IdentifiableAppRoutes.galleryPage
    );
  };

  // Active Routes / Params | Hybrid Detail Views
  const postDetailViewActive = (): boolean => {
    return (
      routerSearchParams.getParamValue(SharedURLParameters.detailViewForPost) !=
      undefined ||
      getAppRouteIDForPathname(location.pathname) ==
      IdentifiableAppRoutes.postPage
    );
  };

  const restaurantDetailViewActive = (): boolean => {
    return (
      routerSearchParams.getParamValue(
        SharedURLParameters.detailViewForRestaurant
      ) != undefined ||
      getAppRouteIDForPathname(location.pathname) ==
      IdentifiableAppRoutes.restaurantPage
    );
  };

  // Convenience
  const isCurrentUserGalleryAuthor = (): boolean => {
    // Precondition failure, if a person isn't logged in they're automatically a 'visitor'
    if (!UserManager.shared.userAuthenticated()) return false;

    return (
      UserManager.shared.currentUser()?.username ==
      currentUserGalleryAuthorUsername()
    );
  };

  // Gallery page being viewed by a user that doesn't own it
  const isGalleryBeingViewedByVisitor = (): boolean => {
    return galleryPageActive() && !isCurrentUserGalleryAuthor();
  };

  const isGalleryBeingViewedByAuthor = (): boolean => {
    return galleryPageActive() && isCurrentUserGalleryAuthor();
  };

  // The username of the author of the current gallery being viewed (if a gallery is being viewed, otherwise this is useless outside of a gallery context)
  const currentUserGalleryAuthorUsername = (): string => {
    return pathname.slice(1); // Trim trailing slash
  };

  return {
    explorePageActive,
    galleryPageActive,
    postDetailViewActive,
    restaurantDetailViewActive,
    isCurrentUserGalleryAuthor,
    isGalleryBeingViewedByVisitor,
    isGalleryBeingViewedByAuthor,
    currentUserGalleryAuthorUsername,
  };
};
