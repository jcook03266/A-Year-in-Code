"use client";
// Dependencies
// Types
import { Map } from "mapbox-gl";

// Styling
import { ColorEnum } from "../../../../../public/assets/ColorRepository";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Components
// Local
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Hooks
import { useState } from "react";

// Redux
import { FonciiUserActions } from "../../../../redux/operations/dispatchers";

interface MapUserLocationPinPointerProps {
  mapReference?: Map;
}

// Pinpoints the user's current location and transitions the map to it
export const MapUserLocationPinPointer = ({
  mapReference,
}: MapUserLocationPinPointerProps): React.ReactNode => {
  // Properties
  const desiredZoomLevel = 15;

  // State Management
  const [isAwaitingLocation, setIsAwaitingLocation] = useState(false);

  // Dimensions
  const height = "h-[30px]",
    width = "w-[30px]",
    cornerRadius = "rounded";

  // Styling
  const backgroundColor = `bg-${ColorEnum.permanent_white}`;

  // Actions
  /// Gets the user's current location and transitions the map to it
  const pinPointLocationAction = () => {
    setIsAwaitingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Set current user coordinates
        FonciiUserActions.setClientCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        mapReference?.flyTo({
          zoom: desiredZoomLevel,
          center: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });

        setIsAwaitingLocation(false);
      },
      (_) => {
        // Permission denied, reset coordinate state
        FonciiUserActions.setClientCoordinates(undefined);
      }
    );
  };

  return (
    <FonciiToolTip title="Center map on my location">
      <button
        onClick={pinPointLocationAction}
        className={`${
          isAwaitingLocation ? "animate-pulse" : ""
        } transition-all ease-in-out hover:opacity-80 shadow-${
          ColorEnum.neutral
        } shadow-sm flex ${height} ${width} flex flex-col ${backgroundColor} ${cornerRadius} justify-center items-center overflow-hidden`}
      >
        <Image
          className="h-[12px] w-[12px]"
          src={ImageRepository.UtilityIcons.NavigationArrowIcon}
          height={12}
          width={12}
          alt="Location Pin Pointer Button Icon"
        />
      </button>
    </FonciiToolTip>
  );
};
