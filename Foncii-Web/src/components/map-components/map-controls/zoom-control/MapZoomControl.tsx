"use client";
// Dependencies
// Types
import PropTypes from "prop-types";
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

// Mocks
import { defaultMapBoxZoomLevel } from "../../../../core-foncii-maps/default-values/UserDefaults";

// Helpers
import { isInRange } from "../../../../utilities/math/commonMath";

// Hooks
import { useState } from "react";

interface MapZoomControlProps {
  mapReference?: Map;
}

// A plus and minus button to control the map's zoom functionality
// Note: Don't use the custom tag notation (<component/>) in this component, image flickering
// and re-rendering issues will occur. Use function notation {component()} instead.
export const MapZoomControl = ({
  mapReference,
}: MapZoomControlProps): React.ReactNode => {
  // Properties
  // Max, Min
  let zoomRange: [number, number] = [22, 0],
    stepSize = 1;

  const [zoomLevel, setZoomLevel] = useState<number>(
    mapReference?.getZoom() ?? defaultMapBoxZoomLevel
  );

  // Actions
  const zoomInAction = () => {
    let updatedZoomLevel = mapReference?.getZoom() ?? zoomLevel;

    if (isInRange(zoomLevel + stepSize, zoomRange[0], zoomRange[1])) {
      updatedZoomLevel += stepSize;

      setZoomLevel(updatedZoomLevel);
      updateMapZoomLevel(updatedZoomLevel);
    }
  };

  const zoomOutAction = () => {
    let updatedZoomLevel = mapReference?.getZoom() ?? zoomLevel;

    if (isInRange(zoomLevel - stepSize, zoomRange[0], zoomRange[1])) {
      updatedZoomLevel -= stepSize;

      setZoomLevel(updatedZoomLevel);
      updateMapZoomLevel(updatedZoomLevel);
    }
  };

  // State Management
  const updateMapZoomLevel = (updatedZoomLevel: number) => {
    // Animated zoom
    mapReference?.flyTo({
      zoom: updatedZoomLevel,
    });
  };

  // Dimensions
  const height = "h-[30px]",
    width = "w-[30px]",
    cornerRadius = "rounded";

  // Styling
  const backgroundColor = `bg-${ColorEnum.permanent_white}`;

  // Subcomponents
  const ButtonBase = ({
    children,
    onClickAction,
    zoomIn,
  }: {
    children: any;
    onClickAction: () => void;
    zoomIn: boolean;
  }): React.ReactNode => {
    return (
      <FonciiToolTip title={`Zoom ${zoomIn ? "in" : "out"}`}>
        <button
          onClick={onClickAction}
          className={`${backgroundColor} ${height} ${width} flex justify-center items-center hover:opacity-80`}
        >
          {children}
        </button>
      </FonciiToolTip>
    );
  };

  const ZoomInButton = (): React.ReactNode => {
    return ButtonBase({
      zoomIn: true,
      children: (
        <Image
          id="zoom-in-button"
          className="h-[15px] w-[15px]"
          src={ImageRepository.UtilityIcons.PlusSignIcon}
          height={15}
          width={15}
          loading="eager"
          fetchPriority="high"
          alt="Zoom In Button Icon"
        />
      ),
      onClickAction: zoomInAction,
    });
  };

  const ZoomOutButton = (): React.ReactNode => {
    return ButtonBase({
      zoomIn: false,
      children: (
        <Image
          id="zoom-out-button"
          className="h-[15px] w-[15px]"
          src={ImageRepository.UtilityIcons.MinusSignIcon}
          height={15}
          width={15}
          loading="eager"
          fetchPriority="high"
          alt="Zoom Out Button Icon"
        />
      ),
      onClickAction: zoomOutAction,
    });
  };

  return (
    <div
      className={`shadow-${ColorEnum.neutral} shadow-sm flex flex-col ${cornerRadius} w-fit h-fit justify-center items-center divide-${ColorEnum.neutral} divide-y-[0.5px] overflow-hidden`}
    >
      {ZoomInButton()}
      {ZoomOutButton()}
    </div>
  );
};

MapZoomControl.propTypes = {
  mapReference: PropTypes.object,
};
