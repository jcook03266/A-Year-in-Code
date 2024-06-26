"use client";
// Dependencies
// Framework
import React from "react";

// Types
import {
  Restaurant,
  RestaurantAutoCompleteSuggestion,
} from "../../../../../../../../../__generated__/graphql";

// Components
import OnboardingRSSACDropDownRow from "./components/OnboardingRSSACDropDownRow";

// Redux
import {
  FonciiRestaurantActions,
  NotificationCenterActions,
} from "../../../../../../../../../redux/operations/dispatchers";

// Services
import { FonciiAPIClientAdapter } from "../../../../../../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// In-App Notifications
import { NotificationTemplates } from "../../../../../../../../../core-foncii-maps/repositories/NotificationTemplates";

// Assets
import { ImageRepository } from "../../../../../../../../../../public/assets/images/ImageRepository";

// Types
export interface OnboardingRSSACDropDownProps {
  restaurantAutoCompleteSuggestions: RestaurantAutoCompleteSuggestion[];
  /** One of the options was selected, inform the parent component */
  onOptionSelectAction: (restaurant?: Restaurant) => void;
}

export default function OnboardingRSSACDropDown({
  restaurantAutoCompleteSuggestions,
  onOptionSelectAction,
}: OnboardingRSSACDropDownProps): React.ReactNode {
  // Services
  const apiService = new FonciiAPIClientAdapter();

  // Action Handlers
  // Remotely sourced search suggestions
  const restaurantSearchAutoCompleteSuggestionsOnClickAction = async (
    restaurantSearchAutoCompleteSuggestion: RestaurantAutoCompleteSuggestion
  ) => {
    FonciiRestaurantActions.setLoadingState(true);

    const googlePlaceID = restaurantSearchAutoCompleteSuggestion.googlePlaceID,
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
    }

    // Pass back the defined or undefined aggregated restaurant / fetched restaurant for the parent component to unwrap and handle accordingly
    onOptionSelectAction(aggregatedRestaurant);
  };

  return (
    <div className="rounded-[10px] border-[1px] border-medium_dark_grey bg-black overflow-y-auto overflow-x-hidden h-fit max-h-[200px]">
      <div className="flex flex-col h-fit">
        {restaurantAutoCompleteSuggestions.map((suggestion, index) => {
          const previewImageURL = suggestion.previewImageURL ?? undefined;

          return (
            <OnboardingRSSACDropDownRow
              key={`${index}-${suggestion.description}`}
              label={suggestion.description}
              onClickAction={() => {
                restaurantSearchAutoCompleteSuggestionsOnClickAction(
                  suggestion
                );
              }}
              previewImageURL={previewImageURL}
            />
          );
        })}
      </div>
    </div>
  );
}
