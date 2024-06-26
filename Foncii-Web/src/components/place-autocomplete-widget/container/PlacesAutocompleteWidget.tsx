/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { RestaurantAutoCompleteSuggestion } from "../../../__generated__/graphql";

// Hooks
import React, { useEffect, useRef, useState } from "react";
import { useListeners } from "../../../hooks/UseListeners";

// Components
import RoundedSearchBar from "../../../components/inputs/searchbars/rounded-search-bar/RoundedSearchBar";
import PlacesAutocompleteWidgetRow from "../rows/PlacesAutocompleteWidgetRow";

// Services
import { FonciiAPIClientAdapter } from "../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

interface PlacesAutocompleteWidgetProps {
  onSelect: (googlePlaceID: string) => void; // Callback triggered when a place location row is selected
  // with the returned value being the google place ID of the selected location
  initialTextInput?: string; // The initial text input value to display, can be the name of the restaurant + address
  // already specified by a post or anything similar
  initialSelectedSearchResultPlaceID?: string; // Optional Place ID to set as the initial selection state, can be used
  // when editing an already provisioned associated restaurant field to prevent the user from selecting the same establishment
  searchBarPlaceholder?: string; // Optional placeholder text for the search bar, defaults to "Search anywhere in the world"
}

// Searchbar + Autocomplete list
const PlacesAutocompleteWidget = ({
  onSelect,
  initialTextInput = "",
  initialSelectedSearchResultPlaceID = undefined,
  searchBarPlaceholder = "Search anywhere in the world",
}: PlacesAutocompleteWidgetProps) => {
  // Services
  const apiService = new FonciiAPIClientAdapter();

  // State Management
  const [searchQuery, setSearchQuery] = useState<string>(initialTextInput);
  const [selectedSearchResultPlaceID, setSelectedSearchResultPlaceID] =
    useState<string | undefined>(initialSelectedSearchResultPlaceID);
  const [suggestions, setSuggestions] = useState<
    RestaurantAutoCompleteSuggestion[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Listeners
  const listeners = useListeners();

  // Update auto-complete suggestions when the search query updates
  useEffect(() => {
    fetchSuggestions();
  }, [searchQuery]);

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

  // Limits
  const minRequiredSearchQueryLength = 3;

  // Convenience
  const isSearchResultSelected = (
    searchResultGooglePlaceID: string
  ): boolean => {
    if (!selectedSearchResultPlaceID) return false;
    return selectedSearchResultPlaceID == searchResultGooglePlaceID;
  };

  const canFetchSuggestions = (): boolean => {
    return searchQuery.length >= minRequiredSearchQueryLength;
  };

  const shouldDisplaySuggestions = (): boolean => {
    return searchQuery.length >= minRequiredSearchQueryLength && isFocused;
  };

  // Action Handlers
  const searchBarTextDidChangeHandler = (input: string) => {
    setSearchQuery(input);
  };

  const onSearchResultSelectHandler = async (placeID: string) => {
    setSelectedSearchResultPlaceID(placeID);

    // Pass the selected google place ID to the caller for them to handle.
    onSelect(placeID);
  };

  // Function to handle click outside the main container
  const handleClearAction = () => {
    clearSuggestions();
  };

  const handleClickOutside = (event: any) => {
    if (
      mainContainerRef.current &&
      !mainContainerRef.current.contains(event.target)
    ) {
      // Clicked outside the main container, close the dropdown
      resignFocusState();
    }
  };

  // Actions
  const resignFocusState = () => {
    setIsFocused(false);
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  // Business Logic
  const fetchSuggestions = async () => {
    // Minimum requirements to limit overusage of the Google Places API
    if (!canFetchSuggestions()) return;

    setIsLoading(true);

    const suggestions =
      await apiService.performRestaurantAutoCompleteSuggestions({
        searchQuery,
      });

    setSuggestions(suggestions);
    setIsLoading(false);
  };

  // Subcomponents
  const AutoCompleteDropDown = (): React.ReactNode => {
    if (!shouldDisplaySuggestions()) return;

    return (
      <>
        {/** Search Results Drop Down*/}
        <div className="flex flex-col gap-y-[8px] h-fit max-h-[200px] transition-all ease-in-out duration-300 overflow-y-auto overflow-x-hidden">
          {suggestions.map((suggestion, index) => {
            // Search result property parsing
            const suggestionAddress = suggestion.description,
              suggestionPlaceID = suggestion.googlePlaceID,
              previewImageURL = suggestion.previewImageURL ?? undefined;

            return (
              <PlacesAutocompleteWidgetRow
                key={index}
                title={suggestionAddress}
                value={suggestionPlaceID}
                selected={isSearchResultSelected(suggestionPlaceID)}
                onSelectAction={onSearchResultSelectHandler}
              />
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div
      className="justify-center items-center w-full h-fit transition-all ease-in-out"
      ref={mainContainerRef}
    >
      <div className="flex flex-col gap-y-[4px] w-full sticky top-0">
        {/** Search Bar*/}
        <RoundedSearchBar
          subscribeToURLState={false}
          className="h-[40px] w-full"
          isLoading={isLoading && isFocused} // Only display loading indicator when the search bar is focused for functionality reasons
          onFocusChange={(isFocused) => {
            if (isFocused) setIsFocused(isFocused);
          }}
          onClearAction={handleClearAction}
          initialTextInput={initialTextInput}
          placeholder={searchBarPlaceholder}
          textInputDidChangeCallback={searchBarTextDidChangeHandler}
          clearTextFieldInputFlag={selectedSearchResultPlaceID}
        />

        {/** Search Results Drop Down*/}
        <AutoCompleteDropDown />
      </div>
    </div>
  );
};

export default PlacesAutocompleteWidget;
