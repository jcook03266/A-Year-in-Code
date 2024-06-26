/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Framework
import dynamic from "next/dynamic";

// Types
import { SearchBarPlaceholders } from "../../../types/foncii-maps";

// Components
import PersistentSearchBar from "../../../components/inputs/searchbars/persistent-search-bar/PersistentSearchBar";
import GalleryContextSwitcher from "../../../components/context-switchers/gallery-context-switcher/GalleryContextSwitcher";
import RestaurantEntityCollectionContext from "./gallery-contexts/restaurant-entity-collection-context/RestaurantEntityCollectionContext";
import SearchResultsPageContext from "./gallery-contexts/search-results-page-context/SearchResultsPageContext";
import BackButton from "../../../components/buttons/back-button/BackButton";
import RestaurantDetailContext from "./gallery-contexts/restaurant-entity-detail-contexts/restaurant-detail-context/RestaurantDetailContext";
import PostDetailContext from "./gallery-contexts/restaurant-entity-detail-contexts/post-detail-context/PostDetailContext";
import UserSideMenuToggleButton from "../../../components/menus/user-menu/components/side-menu-toggle/UserSideMenuToggleButton";
import FonciiFullLogoIcon from "../../icons/foncii-icons/foncii-maps/full-logo-icon/FonciiFullLogoIcon";

// Dynamic
const PostFilterMenu = dynamic(
  () => import("../../../components/menus/post-filter-menu/menu/PostFilterMenu")
);

// Hooks
import { useEffect, useState } from "react";
import { useRouteObserver } from "../../../hooks/UseRouteObserver";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRouterSearchParams } from "../../../hooks/UseRouterSearchParamsHook";

// Navigation
import { SharedURLParameters } from "../../../core-foncii-maps/properties/NavigationProperties";

// Redux
import {
  getFonciiRestaurantsSlice,
  getUserPostsSlice,
  getVisitedUserSlice,
} from "../../../redux/operations/selectors";
import { PostFiltersActions } from "../../../redux/operations/dispatchers";

// Services
import AnalyticsService from "../../../services/analytics/analyticsService";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

// Different possible contexts for the gallery panel
enum GalleryContexts {
  /** Restaurant entity collection | Explore / Visitor Map / My Map */
  REC,
  /** Search results page | Explore Page Search */
  SRP,
  /** Restaurant detail view | Visitors */
  RDV,
  /** Post detail view / editor view | Visitors + Main User */
  PDV,
}

export default function GalleryPanel(): React.ReactNode {
  // URL State Persistence
  const routerSearchParams = useRouterSearchParams();
  const searchParams = useSearchParams();

  // Routing
  const router = useRouter();
  const pathname = usePathname();

  // Observers
  const routeObserver = useRouteObserver();

  // Gallery Context States
  const [currentContext, setCurrentContext] = useState<GalleryContexts>(
    GalleryContexts.REC
  );
  const [contextHistory, setContextHistory] = useState<Set<GalleryContexts>>(
    new Set<GalleryContexts>([GalleryContexts.REC])
  );

  // State Management
  // Redux store
  const visitedUser = getVisitedUserSlice()(),
    fonciiRestaurants = getFonciiRestaurantsSlice()(),
    userPosts = getUserPostsSlice()();

  useEffect(() => {
    switchToCurrentContext();
  }, [searchParams]);

  // Log a new view event every pathname change
  useEffect(() => {
    trackViewEvent();
  }, [pathname]);

  // Analytics
  function trackViewEvent() {
    const authorUID = visitedUser.user?.id,
      userSimilarityScore = visitedUser.user?.tasteProfileSimilarityScore,
      sharedEventID = searchParams.get(SharedURLParameters.sharedEventID) ?? undefined;

    if (routeObserver.isGalleryBeingViewedByVisitor() && authorUID) {
      AnalyticsService.shared.trackUserGalleryView({
        authorUID,
        userSimilarityScore,
        sharedEventID,
      });
    }
  }

  // Dynamic Styling
  const contextualStyling = (): ClassNameValue => {
    switch (currentContext) {
      case GalleryContexts.REC:
        return shouldDisplayGalleryAsList()
          ? "relative xl:w-full"
          : "";
      case GalleryContexts.SRP:
      case GalleryContexts.RDV:
      case GalleryContexts.PDV:
        return "relative";
    }
  };

  // Automatically switches the context depending on the current state of the application
  const switchToCurrentContext = () => {
    if (routeObserver.explorePageActive()) {
      if (searchParams.get(SharedURLParameters.search)) {
        // Automatically switch to the search results page when a user searches the explore page using a query
        // this isn't applicable to user galleries as everything's already on the map
        // Also only registered users can access this context as percent match scores are essential to its functionality
        setCurrentContext(GalleryContexts.SRP);
        setContextHistory(contextHistory.add(GalleryContexts.SRP));
      }
    }

    // Post Detail View / Restaurant Detail View contexts
    if (searchParams.get(SharedURLParameters.detailViewForPost)) {
      setCurrentContext(GalleryContexts.PDV);
      setContextHistory(contextHistory.add(GalleryContexts.PDV));
    } else if (searchParams.get(SharedURLParameters.detailViewForRestaurant)) {
      setCurrentContext(GalleryContexts.RDV);
      setContextHistory(contextHistory.add(GalleryContexts.RDV));
    }

    // Remove stale top-level contexts
    if (
      (currentContext == GalleryContexts.PDV &&
        !searchParams.get(SharedURLParameters.detailViewForPost)) ||
      (currentContext == GalleryContexts.RDV &&
        !searchParams.get(SharedURLParameters.detailViewForRestaurant)) ||
      (currentContext == GalleryContexts.SRP &&
        !searchParams.get(SharedURLParameters.search))
    ) {
      navigateBackwardIntoContextHistory();
    }
  };

  /**
   * Update gallery panel navigation history. Pop the top most context from the stack,
   * the bottom most context is the REC and this should always remain in the stack as it's the base context
   * all the other contexts are laid upon.
   */
  const navigateBackwardIntoContextHistory = () => {
    if (contextHistory.size > 1) {
      const updatedContextHistory = [...contextHistory];
      updatedContextHistory.pop(); // Remove the current context from the history stack

      setContextHistory(new Set(updatedContextHistory));
      setCurrentContext(
        updatedContextHistory[updatedContextHistory.length - 1]
      );
    } else {
      // Always ensure the bottom of the stack is the REC context as this is the initial state
      setContextHistory(new Set([GalleryContexts.REC]));
      setCurrentContext(GalleryContexts.REC);
    }
  };

  // Convenience
  const shouldDisplayGalleryAsList = (): boolean => {
    return (
      String(
        routerSearchParams.getParamValue(
          SharedURLParameters.galleryListFormatToggled
        )
      ) == "true"
    );
  };

  const isLoading = (): boolean => {
    if (routeObserver.explorePageActive()) return fonciiRestaurants.isLoading;
    else if (routeObserver.isGalleryBeingViewedByAuthor())
      return userPosts.isLoading;
    else if (routeObserver.isGalleryBeingViewedByVisitor())
      return visitedUser.isLoading;
    else return false;
  };

  const shouldBackButtonBeDisplayed = (): boolean => {
    // The back button is enabled when a previous context exists that's not the REC (always in the stack)
    return contextHistory.size > 1;
  };

  const getCurrentlySelectedRestaurantID = (): string | undefined => {
    return searchParams.get(SharedURLParameters.detailViewForRestaurant) as
      | string
      | undefined;
  };

  const getCurrentlySelectedPostID = (): string | undefined => {
    return searchParams.get(SharedURLParameters.detailViewForPost) as
      | string
      | undefined;
  };

  const userWantsToEditPost = (): boolean => {
    return (
      String(searchParams.get(SharedURLParameters.isEditingPost)) == "true"
    );
  };

  const currentBackButtonAction = (): (() => void) => {
    // Switch the context entirely
    return () => {
      // Clear URL state parameters
      // SRP
      if (currentContext == GalleryContexts.SRP) {
        // Clear the last search query as it's no longer being used
        routerSearchParams.removeParam(SharedURLParameters.search);
      }

      // Post / Restaurant detail views
      if (
        currentContext == GalleryContexts.RDV ||
        currentContext == GalleryContexts.PDV
      ) {
        // Navigate to the applicable return URL if given
        const returnURL = routerSearchParams.getParamValue(
          SharedURLParameters.returnURL
        ) as string | undefined;

        routerSearchParams.removeParams([
          SharedURLParameters.detailViewForPost,
          SharedURLParameters.detailViewForRestaurant,
          SharedURLParameters.isEditingPost,
          SharedURLParameters.returnURL
        ]);

        if (returnURL) router.push(returnURL);
      }

      navigateBackwardIntoContextHistory();
    };
  };

  // Subcomponents
  const FonciiMapsAttribution = (): React.ReactNode => {
    return (
      <div
        className={cn(
          "absolute top-0 left-0 pt-[20px] pl-[20px] w-[175px] hidden",
          shouldDisplayGalleryAsList() && currentContext == GalleryContexts.REC
            ? "xl:flex z-10"
            : ""
        )}
      >
        <div
          className={`transition-all ease-in-out flex w-[20dvw] xs:w-[100px] sm:w-[120px]`}
        >
          <FonciiFullLogoIcon withLink />
        </div>
      </div>
    );
  };

  /**
   * Full-text search bar. Queries local posts by field value.
   */
  const SearchBar = (): React.ReactNode => {
    return (
      <div
        className={cn(
          "items-center justify-center w-full max-w-[556px] hidden xl:flex z-[10000] transition-all ease-in-out duration-700",
          routeObserver.postDetailViewActive() ||
            routeObserver.restaurantDetailViewActive()
            ? "h-[0px] translate-x-[1000px]"
            : "h-[64px]"
        )}
      >
        <PersistentSearchBar
          placeholder={SearchBarPlaceholders.gallery}
          throttleDuration={0}
          searchBarClassNames={cn("h-[40px] w-full hidden xl:block")}
          dropDownClassNames="hidden xl:block"
        />
      </div>
    );
  };

  // Hidden for mobile, visible for desktop. On mobile this is displayed at the top of the screen
  const FilterSection = (): React.ReactNode => {
    return (
      <div
        className={cn(
          "hidden opacity-0 xl:flex xl:opacity-100 transition-all ease-in-out duration-700 justify-center items-center",
          routeObserver.postDetailViewActive() ||
            routeObserver.restaurantDetailViewActive()
            ? "h-[0px] translate-x-[1000px]"
            : "h-[40px]"
        )}
      >
        <PostFilterMenu parent={"galleryPanel"} />
      </div>
    );
  };

  // Note: Contexts have to be instantiated, don't use a switch statement or else you'll run into a component loading issue
  const GalleryContextSelector = {
    [GalleryContexts.REC]: RestaurantEntityCollectionContext(),
    [GalleryContexts.SRP]: SearchResultsPageContext(),
    [GalleryContexts.RDV]: RestaurantDetailContext({
      fonciiRestaurantID: getCurrentlySelectedRestaurantID(),
    }),
    [GalleryContexts.PDV]: PostDetailContext({
      postID: getCurrentlySelectedPostID(),
      isUserEditing: userWantsToEditPost(),
    }),
  };

  const CurrentGalleryContext = (): React.ReactNode => {
    return GalleryContextSelector[currentContext];
  };

  // Note: The list is offset by 150px when displayed on larger screens b/c of the side nav // [Not applicable anymore]
  return (
    <div
      className={cn(
        `
            max-w-full w-full xl:fixed xl:w-fit transition-all duration-200 
            ease-in-out absolute bottom-0 xl:backdrop-blur-lg xl:top-0 xl:right-0 
            xl:pl-[0px] xl:mt-[0px] xl:border border-medium_dark_grey pointer-events-auto`,
        contextualStyling()
      )}
    >
      <div
        className={cn(
          `flex flex-col sticky top-0 left-0 gap-y-[0px] pointer-events-none z-[10] xl:bg-transparent`,
          shouldBackButtonBeDisplayed()
            ? "bg-black pt-[0px] shadow-xl xl:shadow-none"
            : ""
        )}
      >
        <div
          className={cn(
            `flex-col px-[20px] pt-[12px] hidden xl:flex pointer-events-auto border-b-[1px] shadow-xl border-medium_dark_grey items-center justify-center w-full transition-all ease-in-out`
          )}
        >
          <span className="hidden h-fit shrink-0 w-full border-b-[0.5px] border-medium_dark_grey max-w-[556px] pointer-events-auto xl:flex flex-row gap-x-[24px] items-center justify-center">
            <GalleryContextSwitcher />
            <UserSideMenuToggleButton />
          </span>

          {SearchBar()}
          {FilterSection()}
        </div>

        {shouldBackButtonBeDisplayed() ? (
          <div className="py-[4px] px-[20px] pointer-events-auto border-b-[1px] border-medium_dark_grey">
            <BackButton onClick={currentBackButtonAction()} />
          </div>
        ) : undefined}
      </div>
      {FonciiMapsAttribution()}
      {CurrentGalleryContext()}
    </div>
  );
}
