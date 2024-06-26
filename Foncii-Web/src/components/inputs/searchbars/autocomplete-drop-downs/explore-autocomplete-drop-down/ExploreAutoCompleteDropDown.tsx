"use client";
// Dependencies
// Framework
import React from "react";

// Types
import { ExploreSearchAutoCompleteSuggestion } from "../../../../../__generated__/graphql";

// Components
import ExploreACDropDownRow from "./components/ExploreACDropDownRow";

// Hooks
import { useRouterSearchParams } from "../../../../../hooks/UseRouterSearchParamsHook";

// Navigation
import { useRouter } from "next/navigation";

// URL State Persistence
import {
  NavigationProperties,
  SharedURLParameters,
} from "../../../../../core-foncii-maps/properties/NavigationProperties";

// Redux
import {
  FonciiRestaurantActions,
  NotificationCenterActions,
  PostFiltersActions,
} from "../../../../../redux/operations/dispatchers";

// Services
import { FonciiAPIClientAdapter } from "../../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// In-App Notifications
import { NotificationTemplates } from "../../../../../core-foncii-maps/repositories/NotificationTemplates";

// Assets
import { ImageRepository } from "../../../../../../public/assets/images/ImageRepository";

// Types
export interface ExploreACDropDownProps {
  matchingCachedExploreSearchQueries: CachedSearchQuery[];
  exploreSearchAutoCompleteSuggestions: ExploreSearchAutoCompleteSuggestion[];
  /** One of the options was selected, inform the parent component */
  onOptionSelectAction?: () => void;
}

export default function ExploreAutoCompleteDropDown({
  matchingCachedExploreSearchQueries,
  exploreSearchAutoCompleteSuggestions,
  onOptionSelectAction,
}: ExploreACDropDownProps): React.ReactNode {
  // Services
  const apiService = new FonciiAPIClientAdapter();

  // URL State Persistence
  const routerSearchParams = useRouterSearchParams();

  // Navigation
  const router = useRouter();

  // Actions
  // Cache the given search term (previously cached search query or a popular query sourced from the backend the user just clicked on, NOT one of the restaurant suggestion names etc.)
  const cacheSearchQuery = (searchQuery: string) => {
    FonciiRestaurantActions.cacheSearchQuery(searchQuery);
  };

  const updateSearchWithSuggestedQuery = (suggestedQuery: string) => {
    // Trigger a search by updating the search query store in the URL
    routerSearchParams.setParams({
      [SharedURLParameters.search]: suggestedQuery,
    });

    cacheSearchQuery(suggestedQuery);
  };

  // Action Handlers
  // Locally cached search queries
  const cachedSearchQueryOnClickAction = (
    cachedSearchQuery: CachedSearchQuery
  ) => {
    // Note: Also updates the cache to persist the query for longer since the user used the search query again
    updateSearchWithSuggestedQuery(cachedSearchQuery.query);
  };

  const clearCachedSearchQueryAction = (
    cachedSearchQuery: CachedSearchQuery
  ) => {
    FonciiRestaurantActions.evictCachedSearchQuery(cachedSearchQuery.query);
  };

  // Remotely sourced search suggestions
  const exploreSearchAutoCompleteSuggestionsOnClickAction = (
    exploreSearchAutoCompleteSuggestion: ExploreSearchAutoCompleteSuggestion
  ) => {
    // Action handlers for different search suggestion types
    // Display the detail view context for the foncii restaurant
    const fonciiRestaurantAutoCompleteSuggestionOnClickHandler = () => {
      if (
        exploreSearchAutoCompleteSuggestion.__typename ==
          "RestaurantAutoCompleteSuggestion" &&
        exploreSearchAutoCompleteSuggestion.fonciiRestaurantID
      ) {
        const fonciiRestaurantID =
          exploreSearchAutoCompleteSuggestion.fonciiRestaurantID;

        apiService
          .performGetFonciiRestaurantByID({ fonciiRestaurantID })
          .then((restaurant) => {
            if (restaurant)
              FonciiRestaurantActions.appendRestaurant(restaurant);
          })
          .finally(() => {
            // Important: Pushing using router.push doesn't persist the new URL state to the 'routerSearchParams' singleton, beware
            // of using the links with 'includeCurrentParams' when it comes to pushing updates to the same pathname because of this
            routerSearchParams.hydrateStateFromURL(
              NavigationProperties.explorePageModalRestaurantDetailViewLink({
                restaurantID: fonciiRestaurantID,
                includeCurrentParams: true,
              })
            );
          });
      }
    };

    // Aggregate and display the detail view context for the new restaurant.
    // Note: only registered users are allowed to get injected google autocomplete suggestions, and ultimately perform this action.
    const googleAutoCompleteSuggestionOnClickHandler = async () => {
      if (
        exploreSearchAutoCompleteSuggestion.__typename ==
          "RestaurantAutoCompleteSuggestion" &&
        exploreSearchAutoCompleteSuggestion.googlePlaceID
      ) {
        FonciiRestaurantActions.setLoadingState(true);

        const googlePlaceID = exploreSearchAutoCompleteSuggestion.googlePlaceID,
          aggregatedRestaurant = await apiService.performAggregateRestaurant(
            googlePlaceID
          ),
          fonciiRestaurantID = aggregatedRestaurant?.id;

        FonciiRestaurantActions.setLoadingState(false);

        if (!fonciiRestaurantID) {
          // Inform the user of an error that occurred while aggregating the restaurant
          NotificationCenterActions.triggerSystemNotification(
            NotificationTemplates.RestaurantAggregationFailed
          );
        } else {
          // Navigate to the newly aggregated foncii restaurant's detail view context
          routerSearchParams.hydrateStateFromURL(
            NavigationProperties.explorePageModalRestaurantDetailViewLink({
              restaurantID: fonciiRestaurantID,
              includeCurrentParams: true,
            })
          );
        }
      }
    };

    // Display the detail view for the user post with the provided ID
    const fonciiUserPostAutoCompleteSuggestionOnClickHandler = () => {
      if (
        exploreSearchAutoCompleteSuggestion.__typename !=
        "UserPostAutoCompleteSuggestion"
      )
        return;

      const postID = exploreSearchAutoCompleteSuggestion.postID;
      router.push(NavigationProperties.postDetailViewPageLink(postID));
    };

    // Navigate to the user with the provided username's gallery page
    const fonciiUserAutoCompleteSuggestionOnClickHandler = () => {
      if (
        exploreSearchAutoCompleteSuggestion.__typename !=
        "UserAutoCompleteSuggestion"
      )
        return;
        
      const username = exploreSearchAutoCompleteSuggestion.description;
      router.push(NavigationProperties.userGalleryPageLink(username));
    };

    // Update the search with the popular search query
    const popularSearchQueryAutoCompleteSuggestionOnClickHandler = () => {
      if (
        exploreSearchAutoCompleteSuggestion.__typename !=
        "PopularSearchQuerySuggestion"
      )
        return;

      const popularSearchQuery =
        exploreSearchAutoCompleteSuggestion.description;
      updateSearchWithSuggestedQuery(popularSearchQuery);
    };

    // Chain of responsibility, determines which handler to use to execute the appropriate action
    switch (exploreSearchAutoCompleteSuggestion.__typename) {
      case "RestaurantAutoCompleteSuggestion":
        if (exploreSearchAutoCompleteSuggestion.fonciiRestaurantID) {
          // Existing foncii restaurant
          fonciiRestaurantAutoCompleteSuggestionOnClickHandler();
        } else {
          // External restaurant from google place auto-complete
          googleAutoCompleteSuggestionOnClickHandler();
        }
        break;
      case "UserPostAutoCompleteSuggestion":
        fonciiUserPostAutoCompleteSuggestionOnClickHandler();
        break;
      case "UserAutoCompleteSuggestion":
        fonciiUserAutoCompleteSuggestionOnClickHandler();
        break;
      case "PopularSearchQuerySuggestion":
        // Popular search term used on foncii's platform, treat it like a cached search query
        popularSearchQueryAutoCompleteSuggestionOnClickHandler();
        break;
    }
  };

  return (
    <div className="rounded-[10px] border-[1px] border-medium_dark_grey bg-black overflow-y-auto overflow-x-hidden h-fit max-h-[200px]">
      <div className="flex flex-col h-fit">
        {matchingCachedExploreSearchQueries
          .slice(0, 3)
          .map((cachedSearchQuery, index) => {
            return (
              <ExploreACDropDownRow
                key={`${index}-${cachedSearchQuery.query}`}
                label={cachedSearchQuery.query}
                onClickAction={() => {
                  cachedSearchQueryOnClickAction(cachedSearchQuery);
                  onOptionSelectAction?.();
                }}
                clearCachedSuggestionButtonAction={() =>
                  clearCachedSearchQueryAction(cachedSearchQuery)
                }
                isSuggestionCached={true}
              />
            );
          })}
        {exploreSearchAutoCompleteSuggestions.map((suggestion, index) => {
          let previewImageURL = suggestion.previewImageURL ?? undefined;

          if (
            !previewImageURL &&
            suggestion.__typename == "UserAutoCompleteSuggestion"
          ) {
            previewImageURL =
              ImageRepository.Placeholders.FonciiLogoPostFallback.src;
          }

          return (
            <ExploreACDropDownRow
              key={`${index}-${suggestion.description}`}
              label={suggestion.description}
              suggestion={suggestion}
              onClickAction={() => {
                exploreSearchAutoCompleteSuggestionsOnClickAction(suggestion);
                onOptionSelectAction?.();
              }}
              previewImageURL={previewImageURL}
            />
          );
        })}
      </div>
    </div>
  );
}
