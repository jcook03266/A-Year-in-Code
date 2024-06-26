/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import {
  CoordinatePoint,
  InfluencerLeaderboardCategory,
  LocalInfluencerLeaderboardEntry,
} from "../../../../../../__generated__/graphql";

// Hooks
import { useEffect, useMemo, useState } from "react";
import { useRouterSearchParams } from "../../../../../../hooks/UseRouterSearchParamsHook";

// URL-State Persistence
import { SharedURLParameters } from "../../../../../../core-foncii-maps/properties/NavigationProperties";

// Redux
import {
  getFonciiRestaurantsSlice,
  getMapboxSlice,
} from "../../../../../../redux/operations/selectors";

// Components
import InfluencerLeaderboardRow, {
  InfluencerLeaderboardRowSkeleton,
} from "./influencer-leaderboard/components/influencer-leaderboard-row/InfluencerLeaderboardRow";

// Services
import { FonciiAPIClientAdapter } from "../../../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Managers
import UserManager from "../../../../../../managers/userManager";

// Utilities
import {
  calculateMapSearchAreaDiameter,
  computeDistanceBetweenCoordinatePoints,
} from "../../../../../../utilities/math/euclideanGeometryMath";
import { ClassNameValue } from "tailwind-merge";
import { cn } from "../../../../../../utilities/development/DevUtils";

// Types
interface InfluencerLeaderboardProps {
  className?: ClassNameValue;
  isLoading?: boolean;
  variant?: InfluencerLeaderboardVariants;
}

export enum InfluencerLeaderboardVariants {
  card,
  section,
}

export default function InfluencerLeaderboard({
  className,
  isLoading = false,
  variant = InfluencerLeaderboardVariants.section,
}: InfluencerLeaderboardProps) {
  // Services
  const apiService = new FonciiAPIClientAdapter();

  // State Management
  // Redux
  const fonciiRestaurants = getFonciiRestaurantsSlice()();
  const mapBoxState = getMapboxSlice()();

  // Local state
  const [lastSearchCoordinatePoint, setLastSearchCoordinatePoint] =
    useState<CoordinatePoint>(mapBoxState.virtualCoordinates);
  const [influencerLeaderboard, setInfluencerLeaderboard] = useState<
    LocalInfluencerLeaderboardEntry[] | undefined
  >(undefined);

  // URL State Persistence
  const routerSearchParams = useRouterSearchParams();

  const shouldDisplayGalleryAsList = (): boolean => {
    return (
      String(
        routerSearchParams.getParamValue(
          SharedURLParameters.galleryListFormatToggled
        )
      ) == "true"
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    updateData();
  }, [fonciiRestaurants, mapBoxState]);

  // Convenience
  const shouldDisplay = () => {
    return (influencerLeaderboard?.length ?? 0) > 0 && hasInfluencers();
  };

  // At least one entry has defined influencer data
  const hasInfluencers = () => {
    if (!influencerLeaderboard) return false;
    else
      return (
        influencerLeaderboard.filter((entry) => entry.user != null).length > 0
      );
  };

  const leaderBoardEntries = useMemo(() => {
    function getInfluencerEntry(category: InfluencerLeaderboardCategory) {
      return influencerLeaderboard?.filter(
        (entry) => entry.user != null && entry.category == category
      )[0];
    }

    return {
      [InfluencerLeaderboardCategory.TopRated]: getInfluencerEntry(
        InfluencerLeaderboardCategory.TopRated
      ),
      [InfluencerLeaderboardCategory.Trending]: getInfluencerEntry(
        InfluencerLeaderboardCategory.Trending
      ),
      [InfluencerLeaderboardCategory.New]: getInfluencerEntry(
        InfluencerLeaderboardCategory.New
      ),
    };
  }, [influencerLeaderboard]);

  const computeCurrentSearchAreaRadiusInMeters = useMemo(() => {
    const currentVirtualCoordinates = mapBoxState.virtualCoordinates,
      currentVirtualZoomLevel = mapBoxState.virtualZoomLevel,
      searchAreaDiameter = calculateMapSearchAreaDiameter(
        currentVirtualCoordinates,
        currentVirtualZoomLevel
      ),
      searchAreaRadiusMeters = searchAreaDiameter / 2;

    return searchAreaRadiusMeters;
  }, [mapBoxState.virtualCoordinates, mapBoxState.virtualZoomLevel]);

  const computeDistanceBetweenLastAndCurrentCoordinates = useMemo(() => {
    const currentVirtualCoordinates = mapBoxState.virtualCoordinates,
      distanceBetweenOldAndNewCoordinates =
        computeDistanceBetweenCoordinatePoints(
          lastSearchCoordinatePoint,
          currentVirtualCoordinates
        );

    return distanceBetweenOldAndNewCoordinates;
  }, [lastSearchCoordinatePoint, mapBoxState.virtualCoordinates]);

  /**
   * Dynamic search area based on zoom level and earth circumference relative to coordinate position
   *
   * @returns -> The computed search area radius in kilometers [KM]
   */
  const computeCurrentSearchAreaRadiusInKM = useMemo(() => {
    return computeCurrentSearchAreaRadiusInMeters / 1000;
  }, [computeCurrentSearchAreaRadiusInMeters]);

  // Logic
  /**
   * Used for initial loads and updates of the leaderboard data when the user moves their map.
   */
  const loadData = async () => {
    const coordinates = mapBoxState.virtualCoordinates,
      searchAreaRadius = computeCurrentSearchAreaRadiusInMeters;

    setLastSearchCoordinatePoint(coordinates);

    const leaderboard = await apiService.fetchLocalInfluencerLeaderboard({
      coordinates,
      searchRadius: searchAreaRadius,
      currentUserID: UserManager.shared.currentUser()?.id,
    });

    setInfluencerLeaderboard(leaderboard);
  };

  /**
   * If the latest search area is outside of the last search area's perimeter enough then load
   * up more data.
   */
  const updateData = async () => {
    const searchAreaRadiusKM = computeCurrentSearchAreaRadiusInKM,
      distanceBetweenOldAndNewCoordinates =
        computeDistanceBetweenLastAndCurrentCoordinates,
      searchAreaThresholdCrossed =
        distanceBetweenOldAndNewCoordinates >= searchAreaRadiusKM,
      canUpdateSearchArea =
        searchAreaThresholdCrossed && !fonciiRestaurants.isLoading;

    if (!canUpdateSearchArea) return;

    await loadData();
  };

  // Subcomponents
  const Header = (): React.ReactNode => {
    const title = "Top Influencer Maps";

    return (
      <div
        className={cn(
          "flex items-center w-full h-fit",
          shouldDisplayGalleryAsList() ? "justify-center" : "justify-start"
        )}
      >
        <p
          className={cn(
            "text-start font-normal text-permanent_white cursor-default",
            variant == InfluencerLeaderboardVariants.section
              ? "text-[22px]"
              : "text-[18px]"
          )}
        >
          {title}
        </p>
      </div>
    );
  };

  const LeaderboardList = (): React.ReactNode => {
    return (
      <div
        className={cn(
          "flex md:flex-col items-center md:justify-center w-full h-fit transition-all ease-in-out",
          variant == InfluencerLeaderboardVariants.section
            ? "gap-y-[16px]"
            : "gap-x-[5px] md:gap-y-[5px]"
        )}
      >
        {isLoading ? (
          <div
            className={cn(
              "flex flex-col gap-y-[16px] items-center justify-center w-full h-fit"
            )}
          >
            {Array.from({ length: 3 }).map((_, index) => {
              return (
                <InfluencerLeaderboardRowSkeleton
                  variant={variant}
                  key={index}
                />
              );
            })}
          </div>
        ) : (
          Object.values(leaderBoardEntries).map((entry, index) => {
            if (!entry) return;
            else
              return (
                <InfluencerLeaderboardRow
                  variant={variant}
                  key={index}
                  entry={entry}
                />
              );
          })
        )}
      </div>
    );
  };

  return shouldDisplay() ? (
    <div
      className={cn(
        "flex flex-col xl:px-[20px] gap-y-[12px] items-center justify-center w-full h-fit transition-all ease-in-out",
        className
      )}
    >
      <Header />
      {LeaderboardList()}
    </div>
  ) : undefined;
}
