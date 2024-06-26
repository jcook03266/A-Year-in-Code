/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { SearchBarPlaceholders } from "../../../../types/foncii-maps";
import {
  ExploreSearchAutoCompleteSuggestion,
  UserPostAutoCompleteSuggestion,
} from "../../../../__generated__/graphql";

// Components
import RoundedSearchBar from "../rounded-search-bar/RoundedSearchBar";
import ExploreAutoCompleteDropDown from "../autocomplete-drop-downs/explore-autocomplete-drop-down/ExploreAutoCompleteDropDown";

// Hooks
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useRouteObserver } from "../../../../hooks/UseRouteObserver";
import { useListeners } from "../../../../hooks/UseListeners";

// URL State Persistence
import { SharedURLParameters } from "../../../../core-foncii-maps/properties/NavigationProperties";

// Utilities
import { delay } from "../../../../utilities/common/scheduling";

// Redux
import {
  getFonciiRestaurantsSlice,
  getFonciiUserSlice,
  getVisitedUserSlice,
} from "../../../../redux/operations/selectors";
import { FonciiRestaurantActions } from "../../../../redux/operations/dispatchers";

// Services
import { FonciiAPIClientAdapter } from "../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Managers
import UserManager from "../../../../managers/userManager";

// Types
interface PersistentSearchBarProps {
  throttleDuration?: number; // Update interval duration in [ms], default is 50[ms]
  debounceCharRequirement?: number; // Minimum number of characters required to trigger a search, default is 3
  placeholder?: SearchBarPlaceholders;
  isLoading?: boolean;
  searchBarClassNames?: string;
  dropDownClassNames?: string;
  withDropDown?: boolean;
  /** True if search suggestions from the backend can be fetched and displayed, false otherwise */
  activeAutoCompleteSuggestions?: boolean;
}

/**
 * A search bar that persists its input using the URL's query string
 * as storage. This allows any active scene to pull the current search
 * query having a direct reference to this component, eliminating the
 * need for prop-drilling.
 */
export default function PersistentSearchBar({
  throttleDuration = 50,
  debounceCharRequirement = 3,
  placeholder = SearchBarPlaceholders.generic,
  isLoading = false,
  searchBarClassNames,
  dropDownClassNames,
  withDropDown = true,
  activeAutoCompleteSuggestions = true,
}: PersistentSearchBarProps): React.ReactNode {
  // State Management
  // Redux
  const fonciiRestaurants = getFonciiRestaurantsSlice()(),
    fonciiUser = getFonciiUserSlice()(),
    visitedUser = getVisitedUserSlice()();

  // Observers
  const routeObserver = useRouteObserver();

  // URL-State Persistence
  const routerSearchParams = useRouterSearchParams(),
    searchParams = useSearchParams(); // For parsing initial component state from URL

  // Keeps this component in-sync with the child component's state
  const [currentSearchQueryInput, setCurrentSearchQueryInput] =
    useState<string>("");
  // Updated by child component's state
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const [
    matchingCachedExploreSearchQueries,
    setMatchingCachedExploreSearchQueries,
  ] = useState<CachedSearchQuery[]>([]);
  // Stores loaded auto-complete suggestions from the backend to update the drop down with
  const [
    exploreSearchAutoCompleteSuggestions,
    setExploreSearchAutoCompleteSuggestions,
  ] = useState<ExploreSearchAutoCompleteSuggestion[]>([]);
  const [
    gallerySearchAutoCompleteSuggestions,
    setGallerySearchAutoCompleteSuggestions,
  ] = useState<UserPostAutoCompleteSuggestion[]>([]);

  // Listeners
  const listeners = useListeners();

  // Sync up with cached query updates (evictions etc.)
  useEffect(() => {
    updateMatchingCachedExploreSearchQueries(currentSearchQueryInput);
  }, [fonciiRestaurants.cachedSearchQueries]);

  // Release focus state when user taps outside of this component entirely
  useEffect(() => {
    // Event listener for clicks on the document
    document.addEventListener("click", handleClickOutside);
    document.addEventListener(
      "keydown",
      listeners.onEscapeKeyPress(resignFocusState)
    );

    // Cleanup: remove event listener when the component unmounts
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener(
        "keydown",
        listeners.onEscapeKeyPress(resignFocusState)
      );
    };
  }, []); // Run this effect only once

  // Clear auto-complete suggestions when this component unmounts
  useEffect(() => { return () => { clearSearchSuggestions() }; }, []);

  // UI Properties
  // Object reference for the main container
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Services
  const apiService = new FonciiAPIClientAdapter();

  // Actions
  const resignFocusState = () => {
    setIsFocused(false);
  };

  const updateMatchingCachedExploreSearchQueries = (searchQuery: string) => {
    const matches = fonciiRestaurants.cachedSearchQueries.filter(
      (cachedSearchQuery) => cachedSearchQuery.query.includes(searchQuery)
    );

    if (searchQuery.length == 0) {
      setMatchingCachedExploreSearchQueries([]);
    } else {
      setMatchingCachedExploreSearchQueries(matches);
    }
  };

  const updateExploreAutoCompleteSuggestions = async (searchQuery: string) => {
    const suggestions =
      await apiService.performExploreSearchAutoCompleteSuggestions({
        searchQuery,
        isUserLoggedIn: UserManager.shared.userAuthenticated(),
      });

    setExploreSearchAutoCompleteSuggestions(suggestions);
    FonciiRestaurantActions.setAutocompleteSuggestions(suggestions);
  };

  const updateGalleryAutoCompleteSuggestions = async (searchQuery: string) => {
    const galleryAuthorID = routeObserver.isGalleryBeingViewedByAuthor()
      ? fonciiUser.user?.id
      : visitedUser.user?.id;

    // No valid user ID available for the current gallery
    if (!galleryAuthorID) return;

    const suggestions =
      await apiService.performGallerySearchAutoCompleteSuggestions({
        galleryAuthorID,
        searchQuery,
      });

    setGallerySearchAutoCompleteSuggestions(suggestions);
    FonciiRestaurantActions.setAutocompleteSuggestions(suggestions);
  };

  const clearSearchSuggestions = () => {
    setExploreSearchAutoCompleteSuggestions([]);
    setGallerySearchAutoCompleteSuggestions([]);
    setMatchingCachedExploreSearchQueries([]);

    FonciiRestaurantActions.clearAutocompleteSuggestions();
  };

  // Action Handlers
  const handleRealTimeSearchBarInputUpdate = (searchText: string) => {
    // For empty search queries search suggestions should be cleared
    if (!searchText) clearSearchSuggestions();

    // Update the local search query state
    setCurrentSearchQueryInput(searchText);

    if (withDropDown) {
      updateMatchingCachedExploreSearchQueries(searchText);

      // Conditions
      if (!activeAutoCompleteSuggestions) return;

      // Don't provide search suggestions until the user has a few characters typed out to prevent wasting compute resources
      if (searchText.length < debounceCharRequirement) return;

      if (routeObserver.isGalleryBeingViewedByAuthor()) {
        updateGalleryAutoCompleteSuggestions(searchText);
      } else if (
        routeObserver.explorePageActive() ||
        routeObserver.galleryPageActive()
      ) {
        updateExploreAutoCompleteSuggestions(searchText);
      }
    }
  };

  // Handles search events ~ when the user explicitly presses the enter button to search
  // Note: The search text is already cleaned up and validated at this point.
  const handleSearchBarInputUpdate = (searchText: string) => {
    // Don't need this suggestions anymore, the user has invoked a full search
    clearSearchSuggestions();

    // User entered their search query, dismiss focus from this component
    resignFocusState();

    // Reject invalid entries that aren't a clear state flag (empty string aka "")
    if (searchText.length < debounceCharRequirement && searchText != "") return;

    // Throttle updates to save resources
    delay(() => {
      if (searchText == "") {
        // Clear state flag (empty string): Param is not used any more, remove it
        routerSearchParams.removeParam(SharedURLParameters.search);
      } else {
        routerSearchParams.setParams({
          [SharedURLParameters.search]: searchText,
        });

        // Cache the search query the user entered for later use
        FonciiRestaurantActions.cacheSearchQuery(searchText);
      }
    }, throttleDuration);
  };

  const handleClearAction = () => {
    routerSearchParams.removeParam(SharedURLParameters.search);
    clearSearchSuggestions();
  };

  // Function to handle click outside the main container
  const handleClickOutside = (event: any) => {
    if (
      mainContainerRef.current &&
      !mainContainerRef.current.contains(event.target)
    ) {
      // Clicked outside the main container, close the dropdown
      resignFocusState();
    }
  };

  // Convenience
  const initialTextInput = () =>
    (searchParams.get(SharedURLParameters.search) as string) ?? "";

  const currentAutoCompleteSuggestions = () => {
    if (routeObserver.isGalleryBeingViewedByAuthor()) {
      // Only show the user's own posts suggestions when they're in their gallery
      return gallerySearchAutoCompleteSuggestions;
    } else if (
      routeObserver.explorePageActive() ||
      routeObserver.galleryPageActive()
    ) {
      // Allows users to still explore while on someone else's map
      return exploreSearchAutoCompleteSuggestions;
    } else {
      return [];
    }
  };

  const shouldDropDownBeDisplayed = (): boolean => {
    const hasElements =
      matchingCachedExploreSearchQueries.length > 0 ||
      currentAutoCompleteSuggestions().length > 0,
      userInteractionInProgress = isFocused;

    return withDropDown && userInteractionInProgress && hasElements;
  };

  // Subcomponents
  const AutoCompleteSuggestionsDropDown = () => {
    // Conditionally render the drop down using the feature flag or the dynamic component binding focus state
    if (!shouldDropDownBeDisplayed()) return;

    return (
      <div
        className={`fixed h-fit w-full transition-all ease-in-out transform-gpu pt-[8px] ${dropDownClassNames}`}
      >
        <ExploreAutoCompleteDropDown
          onOptionSelectAction={resignFocusState}
          matchingCachedExploreSearchQueries={
            matchingCachedExploreSearchQueries
          }
          exploreSearchAutoCompleteSuggestions={
            activeAutoCompleteSuggestions
              ? currentAutoCompleteSuggestions()
              : []
          }
        />
      </div>
    );
  };

  return (
    <div
      ref={mainContainerRef}
      className="w-full h-fit transition-all ease-in-out transform-gpu z-[10000]"
    >
      <RoundedSearchBar
        initialTextInput={initialTextInput()}
        placeholder={placeholder}
        textFieldDidDismissCallback={handleSearchBarInputUpdate}
        textInputDidChangeCallback={handleRealTimeSearchBarInputUpdate}
        onClearAction={handleClearAction}
        onFocusChange={(isFocused) => {
          if (isFocused) setIsFocused(isFocused);
        }}
        isLoading={isLoading && isFocused} // Only display loading indicator when the search bar is focused for functionality reasons
        className={searchBarClassNames}
      />

      {AutoCompleteSuggestionsDropDown()}
    </div>
  );
}
