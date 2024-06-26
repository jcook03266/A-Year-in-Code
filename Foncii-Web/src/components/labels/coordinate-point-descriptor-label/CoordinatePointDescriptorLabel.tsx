"use client";
// Dependencies
// Types
import { LngLat } from "mapbox-gl";

//Hooks
import { useCallback, useEffect } from "react";

// URL-State Persistence
import { useRouterSearchParams } from "../../../hooks/UseRouterSearchParamsHook";
import { SharedURLParameters } from "../../../core-foncii-maps/properties/NavigationProperties";

// Redux
import { getMapboxSlice } from "../../../redux/operations/selectors";

// Utilities
import {
  latitudeDirectionDescription,
  longitudeDirectionDescription,
} from "../../../extensions/CoordinatePoint+Extensions";

/**
 * Displays information about the current center point of the map + zoom level information.
 * Component updates when mapbox state changes.
 */
export default function CoordinatePointDescriptorLabel() {
  // State
  const mapboxState = getMapboxSlice()();

  // URL State
  const routerSearchParams = useRouterSearchParams();

  const mapPositionFromURL = useCallback(
    () =>
      routerSearchParams.getParamValue(SharedURLParameters.mapPosition) as
      | string
      | undefined,
    [routerSearchParams]
  ),
    zoomLevelFromURL = useCallback(
      () =>
        routerSearchParams.getParamValue(SharedURLParameters.zoomLevel) as
        | number
        | undefined,
      [routerSearchParams]
    );

  // Update when mapbox state changes / URL state changes
  useEffect(() => { }, [mapboxState, mapPositionFromURL, zoomLevelFromURL]);

  const getCurrentCoordinates = () => {
    return parseZoomAndCenterFromURL().center;
  };

  const getCurrentZoomLevel = () => {
    return parseZoomAndCenterFromURL().zoom;
  };

  const parseZoomAndCenterFromURL = () => {
    // Init with a known state from the redux store
    let zoom = mapboxState.virtualZoomLevel,
      center = mapboxState.virtualCoordinates;

    // Position
    const mapPositionParam = mapPositionFromURL(),
      definedPositionParam =
        mapPositionParam ?? [center.lat, center.lng].toString(),
      splitPositionParam = definedPositionParam.split(",").map(Number),
      latitude = Number(splitPositionParam[0]),
      longitude = Number(splitPositionParam[1]),
      parsedPositionParam: LngLat = new LngLat(longitude, latitude);

    // Validate input and update
    if (!isNaN(latitude) && !isNaN(longitude)) {
      center = parsedPositionParam;
    }

    // Zoom Level
    const zoomLevelParam = zoomLevelFromURL(),
      definedZoomLevelParam = zoomLevelParam ?? zoom,
      parsedZoomLevelParam = Number(definedZoomLevelParam) ?? zoom;

    // Validate input and update
    if (parsedZoomLevelParam != undefined) {
      zoom = parsedZoomLevelParam;
    }

    return { zoom, center };
  };

  // Parsing
  const formattedDescription = () => {
    const currentCoordinatePoint = getCurrentCoordinates(),
      currentZoomLevel = getCurrentZoomLevel(),
      latitudeDirection = latitudeDirectionDescription(
        currentCoordinatePoint.lat
      ),
      longitudeDirection = longitudeDirectionDescription(
        currentCoordinatePoint.lng
      ),
      normalizedLatitude = Math.abs(currentCoordinatePoint.lat),
      normalizedLongitude = Math.abs(currentCoordinatePoint.lng),
      latitudeDescription = `${normalizedLatitude}° ${latitudeDirection}`,
      longitudeDescription = `${normalizedLongitude}° ${longitudeDirection}`;

    return `${latitudeDescription}, ${longitudeDescription} - ${currentZoomLevel}x`;
  };

  return (
    <p className={`text-medium font-medium text-[12px]`}>
      {formattedDescription()}
    </p>
  );
}
