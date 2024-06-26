"use client";
// Dependencies
// Types
import PropTypes from "prop-types";
import { Map } from "mapbox-gl";

// Components
import { MapZoomControl } from "../zoom-control/MapZoomControl";
import { MapUserLocationPinPointer } from "../user-location-pinpointer/MapUserLocationPinPointer";

interface MapControlBoxPropsProps {
  mapReference?: Map;
}

// Combination box of zoom and user location map controls
// Hidden for mobile devices and displayed for desktop screen sizes
export const MapControlBox = ({
  mapReference,
}: MapControlBoxPropsProps): React.ReactNode => {
  // Spacing
  const verticalSpacing = "gap-y-[14px]";

  return (
    <div
      id="map-control-box"
      className={`flex-col flex ${verticalSpacing} pointer-events-auto`}
    >
      {/** Zoom Control Hidden for screens with mobile device sizes */}
      <span className="hidden opacity-0 md:block md:opacity-100">
        <MapZoomControl mapReference={mapReference} />
      </span>

      {/** Location Pin Pointer Still Rendered because it's useful*/}
      <MapUserLocationPinPointer mapReference={mapReference} />
    </div>
  );
};

MapControlBox.propTypes = {
  mapReference: PropTypes.object,
};
