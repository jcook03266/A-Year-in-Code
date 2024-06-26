"use client";
// Package Dependencies
// Types
import { Restaurant, CoordinatePoint } from "../../../__generated__/graphql";

// Components
import FonciiToolTip from "../../tool-tips/FonciiToolTip";

// Redux
import { useMemo } from "react";

// Utilities
import { computeDistanceBetweenCoordinatePoints } from "../../../utilities/math/euclideanGeometryMath";
import { convertKMToMiles } from "../../../utilities/math/unitConversionHelper";
import { cn } from "../../../utilities/development/DevUtils";
import { uppercaseFirstLetter } from "../../../utilities/formatting/textContentFormatting";

// Local Types
interface RestaurantDistanceLabelProps {
  restaurant?: Restaurant;
  clientCoordinates?: CoordinatePoint,
  preferredDistanceUnit?: DistanceUnits;
  /** Custom styling for the label content, not the parent container */
  className?: string;
}

/// Enum for the preferred distance units with abbreviated shorthands
export enum DistanceUnits {
  miles = "mi",
  kilometers = "km",
}

// Tuple (0) is the full unit description, (1) is the abbreviated unit
const DistanceUnitDescription = {
  [DistanceUnits.miles]: ["miles", "mi"],
  [DistanceUnits.kilometers]: ["kilometers", "km"],
};

/// Label for displaying the current distance of the user's client from the
/// post's restaurant (if any), if no restaurant with an applicable coordinate point is defined
// then this component is conditionally hidden
export default function RestaurantDistanceLabel({
  restaurant,
  clientCoordinates,
  preferredDistanceUnit = DistanceUnits.miles,
  className,
}: RestaurantDistanceLabelProps): React.ReactNode {
  // Parsing
  const restaurantCoordinates = restaurant?.coordinates,
    formattedAddress = restaurant?.addressProperties.formattedAddress ?? undefined,
    city = restaurant?.addressProperties.city ?? undefined,
    neighborhood = restaurant?.addressProperties.neighborhood ?? undefined,
    mostAccurateSublocality = neighborhood ?? city; // Neighborhood first, then city as neighborhood is the most accurate info

  // Calculate the client's physical distance from the post's restaurant (if any)
  // Float representing the amount of distance the client is away from the restaurant's coordinates
  // in [mi] or [km] depending on the desired unit of measurement.
  const calculatedDistance = useMemo((): number | undefined => {
    if (
      clientCoordinates == undefined ||
      restaurantCoordinates == undefined
    ) {
      return undefined;
    }

    const distanceInKM = computeDistanceBetweenCoordinatePoints(
      restaurantCoordinates,
      clientCoordinates
    );

    if (preferredDistanceUnit == DistanceUnits.miles) {
      const distanceInMiles = convertKMToMiles(distanceInKM);
      return distanceInMiles;
    } else {
      return distanceInKM;
    }
  }, [clientCoordinates, preferredDistanceUnit, restaurantCoordinates]);

  // Formatting
  const formattedDistanceDescription = (): string | undefined => {
    const abbreviatedUnit = DistanceUnitDescription[preferredDistanceUnit][1];

    if (calculatedDistance == undefined) {
      return "Undetermined";
    } else {
      return calculatedDistance?.toFixed(1) + " " + abbreviatedUnit;
    }
  };

  // Convenience
  const isDistanceUndetermined = (): boolean => {
    return calculatedDistance == undefined;
  };

  // Subcomponents
  const MostAccurateSublocalityPlaceholderLabel = (): React.ReactNode => {
    if (!mostAccurateSublocality) return;

    return (
      <FonciiToolTip title={formattedAddress}>
        <div className={`flex items-center rounded-full h-[20px] py-[5px] w-fit whitespace-nowrap`}>
          <p className={cn(`text-permanent_white text-[14px] font-normal`, className)}>
            {uppercaseFirstLetter(mostAccurateSublocality)}
          </p>
        </div>
      </FonciiToolTip>
    );
  }

  const CoordinateDistanceLabel = (): React.ReactNode => {
    return (
      <FonciiToolTip title={`${formattedDistanceDescription()} away from you`}>
        <div className={`flex items-center rounded-full h-[20px] py-[5px] w-fit whitespace-nowrap`}>
          <p className={cn(`text-permanent_white text-[14px] font-normal`, className)}>
            {formattedDistanceDescription()}
          </p>
        </div>
      </FonciiToolTip>
    );
  }

  return (
    isDistanceUndetermined() ?
      MostAccurateSublocalityPlaceholderLabel() :
      CoordinateDistanceLabel()
  );
}
