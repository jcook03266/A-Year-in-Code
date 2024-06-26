"use client";
// Dependencies
// Types
import { CoordinatePoint } from "../../../__generated__/graphql";

// Components
// Local
import FonciiToolTip from "../../tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Hooks
import { useRouteObserver } from "../../../hooks/UseRouteObserver";
import { useRouterSearchParams } from "../../../hooks/UseRouterSearchParamsHook";
import { useEffect } from "react";

// Redux
import { FonciiRestaurantActions } from "../../../redux/operations/dispatchers";
import {
  getFonciiRestaurantsSlice,
  getMapboxSlice,
} from "../../../redux/operations/selectors";

// URL-State Persistence
import { SharedURLParameters } from "../../../core-foncii-maps/properties/NavigationProperties";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";

export default function ManualMapUpdateButton() {
  // State Management
  const fonciiRestaurants = getFonciiRestaurantsSlice()();
  const mapBoxState = getMapboxSlice()();

  // UI refresh
  useEffect(() => { }, [mapBoxState.mapState, fonciiRestaurants.isLoading]);

  // Observers
  const routeObserver = useRouteObserver();

  // URL-State Persistence
  const routerSearchParams = useRouterSearchParams();

  // Properties
  const isDisplayed = (): boolean => {
    return routeObserver.explorePageActive();
  };

  const currentURLStateMapZoomLevel = (): number => {
    let zoom = mapBoxState.virtualZoomLevel;

    // Zoom Level
    const zoomLevelParam = routerSearchParams.getParamValue(
      SharedURLParameters.zoomLevel
    ),
      definedZoomLevelParam = zoomLevelParam ?? zoom,
      parsedZoomLevelParam = Number(definedZoomLevelParam) ?? zoom;

    // Validate input and update
    if (parsedZoomLevelParam != undefined) {
      zoom = parsedZoomLevelParam;
    }

    return zoom;
  };

  const currentURLStateMapCoordinates = (): CoordinatePoint => {
    let center = mapBoxState.virtualCoordinates;

    // Position
    const mapPositionParam = routerSearchParams.getParamValue(
      SharedURLParameters.mapPosition
    ) as string,
      definedPositionParam =
        mapPositionParam ?? [center.lat, center.lng].toString(),
      splitPositionParam = definedPositionParam.split(",").map(Number),
      latitude = Number(splitPositionParam[0]),
      longitude = Number(splitPositionParam[1]),
      parsedPositionParam: CoordinatePoint = { lat: latitude, lng: longitude };

    // Validate input and update
    if (!isNaN(latitude) && !isNaN(longitude)) {
      center = parsedPositionParam;
    }

    return center;
  };

  // Convenience
  const searchResultsPageActive = (): boolean => {
    const searchQuery = routerSearchParams.getParamValue(
      SharedURLParameters.search
    );
    return searchQuery != undefined && searchQuery != "";
  };

  // Only enable manual searching when there's not already an in-flight search or map movement + SRP is not active
  const canUpdateSearchArea = (): boolean => {
    return (
      !fonciiRestaurants.isLoading &&
      !searchResultsPageActive() &&
      mapBoxState.mapState == "idle"
    );
  };

  // Actions
  const updateFonciiRestaurantSearch = () => {
    FonciiRestaurantActions.search({
      coordinates: currentURLStateMapCoordinates(),
      zoomLevel: currentURLStateMapZoomLevel(),
      searchHereTriggered: true,
    });
  };

  return (
    <FonciiToolTip title="Update your search results">
      <button
        className={cn(
          "flex-row gap-x-[8px] items-center justify-center border-medium_dark_grey border-[1px] shadow-lg h-fit w-fit py-[8px] px-[18px] rounded-full bg-opacity-50 bg-black backdrop-blur-lg hover:opacity-75 transition-all ease-in-out active:scale-90 pointer-events-auto",
          isDisplayed() ? "flex" : "hidden",
          canUpdateSearchArea()
            ? "pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={updateFonciiRestaurantSearch}
      >
        <Image
          src={ImageRepository.UtilityIcons.SearchUtilityIcon}
          height={16}
          width={16}
          className="h-[16px] w-[16px]"
          alt="Search Icon"
          unoptimized
          unselectable="on"
        />
        <p className="text-permanent_white text-center text-[14px] shrink-0">
          {"Search this area"}
        </p>
      </button>
    </FonciiToolTip>
  );
}
