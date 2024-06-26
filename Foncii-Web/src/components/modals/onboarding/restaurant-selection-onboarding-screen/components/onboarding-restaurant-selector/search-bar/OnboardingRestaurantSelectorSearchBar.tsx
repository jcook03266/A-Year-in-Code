/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import {
  Restaurant,
  RestaurantAutoCompleteSuggestion,
} from "../../../../../../../__generated__/graphql";

// Components
import RoundedSearchBar from "../../../../../../inputs/searchbars/rounded-search-bar/RoundedSearchBar";
import OnboardingRSSACDropDown from "./components/auto-complete-drop-down/OnboardingRSSACDropDown";

// Hooks
import { useEffect, useRef, useState } from "react";
import { useListeners } from "../../../../../../../hooks/UseListeners";

// Services
import { FonciiAPIClientAdapter } from "../../../../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Utilities
import { delay } from "../../../../../../../utilities/common/scheduling";

interface OnboardingRSSearchBarProps {
  textInputDidChangeCallback: (textInput: string) => void;
  textFieldDidDismissCallback: (textInput: string) => void;
  placeholder?: string;
  onRestaurantSelect: (restaurant: Restaurant) => void;
}

export default function OnboardingRSSearchBar({
  textInputDidChangeCallback,
  textFieldDidDismissCallback,
  placeholder = "Search your favorite restaurants",
  onRestaurantSelect,
}: OnboardingRSSearchBarProps) {
  // State Management
  // Keeps this component in-sync with the child component's state
  const [currentSearchQueryInput, setCurrentSearchQueryInput] =
    useState<string>("");
  // Updated by child component's state
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Stores loaded auto-complete suggestions from the backend to update the drop down with
  const [
    restaurantSearchAutoCompleteSuggestions,
    setRestaurantSearchAutoCompleteSuggestions,
  ] = useState<RestaurantAutoCompleteSuggestion[]>([]);

  // Listeners
  const listeners = useListeners();

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

  // UI Properties
  // Object reference for the main container
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Services
  const apiService = new FonciiAPIClientAdapter();

  // Limits
  const throttleDuration = 100,
    debounceCharRequirement = 3;

  // Actions
  const resignFocusState = () => {
    setIsFocused(false);
  };

  const updateRestaurantAutoCompleteSuggestions = async (
    searchQuery: string
  ) => {
    const suggestions =
      await apiService.performRestaurantAutoCompleteSuggestions({
        searchQuery,
      });

    setRestaurantSearchAutoCompleteSuggestions(suggestions);
  };

  const clearSearchSuggestions = () => {
    setRestaurantSearchAutoCompleteSuggestions([]);
  };

  // Action Handlers
  const handleRealTimeSearchBarInputUpdate = (searchText: string) => {
    setCurrentSearchQueryInput(searchText);

    // Inform the parent regardless of the conditions below
    textInputDidChangeCallback(searchText);

    // Don't provide search suggestions until the user has a few characters typed out to prevent wasting compute resources
    if (searchText.length < debounceCharRequirement) return;

    // Update the auto-complete suggestion
    updateRestaurantAutoCompleteSuggestions(searchText);
  };

  // Note: The search text is already cleaned up and validated at this point.
  const handleSearchBarInputUpdate = (searchText: string) => {
    // User entered their search query, dismiss focus from this component
    resignFocusState();

    // Throttle updates to save resources
    delay(() => {
      textFieldDidDismissCallback(searchText);
    }, throttleDuration);
  };

  const handleClearAction = () => {
    clearSearchSuggestions();
  };

  const handleRestaurantSelection = (restaurant?: Restaurant) => {
    // Selected restaurant not available, don't proceed
    if (!restaurant) return;

    onRestaurantSelect(restaurant);

    // Dismiss the drop down and release the focus state from this search bar
    resignFocusState();
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
  const currentAutoCompleteSuggestions = () => {
    return restaurantSearchAutoCompleteSuggestions;
  };

  const shouldDropDownBeDisplayed = (): boolean => {
    const hasElements = currentAutoCompleteSuggestions().length > 0,
      userInteractionInProgress = isFocused;

    return userInteractionInProgress && hasElements;
  };

  // Subcomponents
  const AutoCompleteSuggestionsDropDown = () => {
    // Conditionally render the drop down using the feature flag or the dynamic component binding focus state
    if (!shouldDropDownBeDisplayed()) return;

    return (
      <div
        className={`fixed h-fit w-full transition-all ease-in-out transform-gpu pt-[8px]`}
      >
        <OnboardingRSSACDropDown
          onOptionSelectAction={handleRestaurantSelection}
          restaurantAutoCompleteSuggestions={currentAutoCompleteSuggestions()}
        />
      </div>
    );
  };

  return (
    <div
      ref={mainContainerRef}
      className="w-full h-fit transition-all ease-in-out transform-gpu sticky top-0 z-[1]"
    >
      <RoundedSearchBar
        placeholder={placeholder}
        textFieldDidDismissCallback={handleSearchBarInputUpdate}
        textInputDidChangeCallback={handleRealTimeSearchBarInputUpdate}
        onClearAction={handleClearAction}
        className={"h-[40px] w-full"}
        subscribeToURLState={false}
        onFocusChange={(isFocused) => {
          if (isFocused) setIsFocused(isFocused);
        }}
      />
      {AutoCompleteSuggestionsDropDown()}
    </div>
  );
}
