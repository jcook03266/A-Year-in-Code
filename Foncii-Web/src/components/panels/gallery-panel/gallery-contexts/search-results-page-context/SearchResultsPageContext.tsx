/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { FonciiRestaurant } from "../../../../../__generated__/graphql";

// Components
import FonciiRestaurantCard from "../../../../restaurant-entities/foncii-restaurants/regular-format/FonciiRestaurantCard";
import PercentMatchLabel from "../../../../../components/labels/percent-match-label/PercentMatchLabel";
import LargeFormatFonciiRestaurantCard from "../../../../../components/restaurant-entities/foncii-restaurants/large-format/LargeFormatFonciiRestaurantCard";
import SwitchToggleButton from "../../../../../components/buttons/toggle-buttons/switch-toggle-button/SwitchToggleButton";

// Hooks
import React, { useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import useEntityFilters from "../../../../../hooks/UseEntityFilters";

// Redux
import {
  getFonciiRestaurantsSlice,
  getPostFiltersSlice,
} from "../../../../../redux/operations/selectors";
import { PostFiltersActions } from "../../../../../redux/operations/dispatchers";

// URL State Persistence
import { SharedURLParameters } from "../../../../../core-foncii-maps/properties/NavigationProperties";

// Styling
import ColorRepository from "../../../../../../public/assets/ColorRepository";

// Services
import AnalyticsService, {
  AnalyticsEvents,
} from "../../../../../services/analytics/analyticsService";

// Managers
import UserManager from "../../../../../managers/userManager";

export default function SearchResultsPageContext() {
  // State Management
  const fonciiRestaurants = getFonciiRestaurantsSlice()(),
    postFilters = getPostFiltersSlice()();

  const entityFilters = useEntityFilters();

  // State Convenience
  const isLoading = (): boolean => {
    return fonciiRestaurants.isLoading;
  };

  // Dynamic Routing
  const pathname = usePathname();

  // URL State Persistence
  const searchParams = useSearchParams(); // For parsing initial component state from URL

  // General updates across post related app states
  useEffect(() => { }, [fonciiRestaurants, postFilters]);

  // Navigation driven updates
  useEffect(() => {
    setSelectedPostID();
  }, [pathname]);

  // Initial State Setup
  // Set the initially selected post ID (if any) on-load
  const setSelectedPostID = (): void => {
    const postID = searchParams.get(SharedURLParameters.selectedPost) as string;

    if (postID != null) {
      PostFiltersActions.setCurrentlySelectedPostID(postID);
    } else {
      PostFiltersActions.clearCurrentlySelectedPostID();
    }
  };

  // Data Provider
  // Foncii Restaurants
  const allFonciiRestaurants = useMemo((): FonciiRestaurant[] => {
    return fonciiRestaurants.fonciiRestaurants;
  }, [fonciiRestaurants.fonciiRestaurants]);

  // Candidates are reduced to only 5 potential candidates to display
  const slicedSRPCandidates = useMemo((): FonciiRestaurant[] => {
    const softCopy = [...allFonciiRestaurants];

    return softCopy.slice(0, 5);
  }, [allFonciiRestaurants]);

  // Convenience
  const isReservationAvailabilityFilterToggled = (): boolean => {
    return postFilters.reservableOnly;
  };

  const shouldDisplayLoadingPrompt = (): boolean => {
    return isLoading() || candidateCount() == 0;
  };

  // Action Handlers
  // Log the click action for analytics, don't select the restaurant this will move the map and the search which is not intended
  const onFonciiRestaurantClickAction = (
    fonciiRestaurant: FonciiRestaurant
  ) => {
    // Parsing
    const restaurantID = fonciiRestaurant.restaurant.id;

    AnalyticsService.shared.trackGenericEvent(
      AnalyticsEvents.FONCII_RESTAURANT_SELECTED,
      {
        fonciiRestaurantID: restaurantID,
        percentMatchScore: fonciiRestaurant.percentMatchScore,
        selectionSource: "srp-foncii-restaurant-card",
        origin: location.pathname,
      }
    );
  };

  // Convenience
  const candidateCount = () => slicedSRPCandidates.length;

  const topSRPCandidate = (): FonciiRestaurant | undefined => {
    return slicedSRPCandidates[0];
  };

  const runnerUpSRPCandidates = (): FonciiRestaurant[] => {
    return slicedSRPCandidates.slice(1, 5);
  };

  // Subcomponents
  const LoadingPrompt = (): React.ReactNode => {
    // Fallback in case something goes wrong
    let prompt = "Something Went Wrong";

    if (isLoading()) {
      // Regular Loading
      prompt = "Ranking Best Matches";
    } else if (candidateCount() == 0 && !isLoading()) {
      // No visible restaurants
      prompt = `No Matches Found`;
    }

    return (
      <div className="pointer-events-none flex items-center h-full xl:h-[60dvh] xl:absolute justify-center w-[92.5dvw] pl-[20px] xl:pl-[0px] xl:pr-[0px] xl:w-full">
        <div
          className={`bg-black h-fit w-fit items-center justify-center flex flex-row gap-x-[10px] px-[20px] py-[10px] rounded-lg border border-medium_dark_grey`}
        >
          {isLoading() ? (
            <svg
              aria-hidden="true"
              role="status"
              className="inline w-4 h-4 text-white animate-spin"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill={ColorRepository.colors["medium_dark_grey"]}
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill={ColorRepository.colors.primary}
              />
            </svg>
          ) : undefined}
          <h2
            className={`line-clamp-2 text-[16px] font-medium text-permanent_white`}
          >
            {prompt}
          </h2>
        </div>
      </div>
    );
  };

  // Subcomponents
  // Sections
  const FilterToggleSection = (): React.ReactNode => {
    // Don't display while loading, could interupt an in-flight search request
    if (isLoading()) return;

    return (
      <div className="flex flex-row gap-x-[8px] items-center justify-end w-full h-fit">
        <p className="shrink-0 text-[12px] xs:text-[14px] text-neutral font-normal">
          Available For Reservation
        </p>
        <SwitchToggleButton
          isToggled={isReservationAvailabilityFilterToggled()}
          onToggle={entityFilters.setReservableOnlyFilter}
        />
      </div>
    );
  };

  const TopCandidateSection = (): React.ReactNode => {
    const fonciiRestaurant = topSRPCandidate();

    // Precondition failure
    if (!fonciiRestaurant) return;

    // Parsing
    const topCandidatePercentMatchScore =
      fonciiRestaurant.percentMatchScore ?? undefined,
      qualityScore = fonciiRestaurant.qualityScore;

    return (
      <div className="flex flex-col gap-y-[16px] h-fit w-full px-[20px] pt-[12px]">
        <div className="flex flex-row gap-x-[16px] items-center justify-center w-full h-fit">
          <p className="text-[18px] md:text-[20px] xl:text-[22px] font-semibold text-permanent_white w-fit h-fit shrink-0">
            Top Match
          </p>
          <PercentMatchLabel
            percentMatchScore={topCandidatePercentMatchScore}
            qualityScore={qualityScore}
            blurQualityScore={!UserManager.shared.userAuthenticated()}
          />
          <FilterToggleSection />
        </div>
        <LargeFormatFonciiRestaurantCard
          fonciiRestaurant={fonciiRestaurant}
          className="h-[200px] w-full xl:h-[150px] hover:scale-[1.01] transition-transform"
          onClickAction={() => onFonciiRestaurantClickAction(fonciiRestaurant)}
        />
      </div>
    );
  };

  const SimilarCandidatesSection = (): React.ReactNode => {
    // No secondary search results yet, don't render
    if (runnerUpSRPCandidates().length == 0) return;

    return (
      <div className="flex flex-col gap-y-[16px] w-full px-[20px]">
        <p className="text-[16px] md:text-[18px] xl:text-[20px] font-semibold text-permanent_white w-fit h-fit shrink-0">
          Other Alternatives
        </p>
        <div
          className={`pb-[70px] xl:pb-[260px] transition-all ease-in-out flex flex-nowrap flex-col sm:grid sm:grid-cols-2 gap-[16px] w-full sm:w-fit h-fit`}
        >
          {runnerUpSRPCandidates().map((fonciiRestaurant) => {
            // Parsing
            const entityID = fonciiRestaurant.restaurant.id;

            return (
              <span
                className={`transition-all ease-in-out duration-500`}
                id={entityID}
                key={entityID}
              >
                {
                  <FonciiRestaurantCard
                    key={entityID}
                    fonciiRestaurant={fonciiRestaurant}
                    virtualized={false}
                    className="w-full sm:min-w-[46dvw] xl:min-w-full h-[150px] hover:scale-[1.01] transition-transform"
                    onClickAction={() =>
                      onFonciiRestaurantClickAction(fonciiRestaurant)
                    }
                  />
                }
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const SectionDivider = (): React.ReactNode => {
    // No secondary search results yet, don't render
    if (runnerUpSRPCandidates().length == 0) return;

    return (
      <div className="w-full h-fit flex items-center justify-center px-[20px]">
        <div className="shrink-0 w-full h-[1px] bg-medium" />
      </div>
    );
  };

  return (
    <div
      className={`xl:w-[590px] border-t-[1px] border-medium_dark_grey relative backdrop-blur-lg xl:backdrop-blur-none flex flex-col items-center justify-start w-full h-[78dvh] xl:h-full transition-all duration-200 ease-in-out gap-y-[16px] overflow-y-auto overflow-x-hidden`}
    >
      {shouldDisplayLoadingPrompt() ? (
        <div className="flex flex-col gap-y-[16px] h-full w-full px-[20px] pt-[12px]">
          <FilterToggleSection />
          {LoadingPrompt()}
        </div>
      ) : (
        <>
          {TopCandidateSection()}
          {SectionDivider()}
          {SimilarCandidatesSection()}
        </>
      )}
    </div>
  );
}
