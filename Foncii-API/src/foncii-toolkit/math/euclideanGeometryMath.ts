// Dependencies
// Utils
import { convertKMToMeters } from "./unitConversion";

// Constants
export const EARTH_RADIUS_KM = 6378.137;
export const EARTH_RADIUS_METERS = convertKMToMeters(EARTH_RADIUS_KM);

/**
 * Haversine formula to calculate the distance between two sets of coordinates
 * and return the distance in kilometers [km] ~ radius of a circular search area.
 *
 * @param coordinatePoint1
 * @param coordinatePoint2
 *
 * @returns The distance in kilometers [km] ~ radius of a circular search area, between the two coordinate points
 */
export function computeDistanceBetweenCoordinatePoints(
  coordinatePoint1: CoordinatePoint,
  coordinatePoint2: CoordinatePoint
) {
  // Parse attributes
  const lat1: number = coordinatePoint1.lat,
    lon1: number = coordinatePoint1.lng,
    lat2: number = coordinatePoint2.lat,
    lon2: number = coordinatePoint2.lng;

  // Define constants
  const R = EARTH_RADIUS_KM; // Radius of the Earth in kilometers

  // Convert distance between latitude and longitude sets to radians
  const dLat: number = convertDegreestoRadians(lat2 - lat1);
  const dLon: number = convertDegreestoRadians(lon2 - lon1);

  // Calculate the distance between the two sets of coordinates using the Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(convertDegreestoRadians(lat1)) *
    Math.cos(convertDegreestoRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Return the distance between the two sets of coordinates in kilometers [km]
  return distance;
}

/**
 * Non-standard formula that calculates the diameter of the visible map area at a given zoom level,
 * taking into account the Earth's curvature and the map's projection.
 *
 * @param coordinates
 * @param zoomLevel
 *
 * @returns -> The diameter of a circular search area comprising the entirety of the
 * map component's current view port at the given zoom level.
 */
export function calculateMapSearchAreaDiameter(
  coordinates: CoordinatePoint,
  zoomLevel: number
): number {
  const earthCircumferenceMeters = 40075016.686,
    searchAreaDiameter = Math.abs(
      (earthCircumferenceMeters * Math.cos(coordinates?.lat ?? 0)) /
      Math.pow(2, zoomLevel)
    );

  return searchAreaDiameter;
}

export function convertDegreestoRadians(degrees: number): number {
  return degrees.valueOf() * (Math.PI / 180);
}

/**
 * Converts the radius of a sphere in meters to radians by dividing the radius by the 
 * Earth's radius in kilometers.
 * 
 * @param meters 
 * 
 * @returns -> The radius of a sphere in radians, converted from meters.
 */
export function convertSphereRadiusMetersToRadians(meters: number): number {
  return meters.valueOf() / EARTH_RADIUS_KM;
}