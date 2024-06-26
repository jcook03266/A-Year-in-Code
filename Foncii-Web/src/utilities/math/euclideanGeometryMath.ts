// Dependencies
// Types
import { CoordinatePoint } from "../../__generated__/graphql";

// Constants
/** Radius of the Earth in kilometers */
export const EARTH_RADIUS_KM = 6371;
export const EARTH_CIRCUMFERENCE_METERS = 40075016.686;

/**
 * Haversine formula to calculate the distance between two sets of coordinates
 * and return the distance in kilometers [km] ~ radius of a circular search area.
 * Reference: https://community.esri.com/t5/coordinate-reference-systems-blog/distance-on-a-sphere-the-haversine-formula/ba-p/902128#:~:text=All%20of%20these%20can%20be,longitude%20of%20the%20two%20points.
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

  // Convert distance between latitude and longitude sets to radians
  const dLat: number = convertDegreestoRadians(lat2 - lat1),
    dLon: number = convertDegreestoRadians(lon2 - lon1);

  // Calculate the distance between the two sets of coordinates using the Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(convertDegreestoRadians(lat1)) *
      Math.cos(convertDegreestoRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
    distance = EARTH_RADIUS_KM * c;

  // Return the distance between the two sets of coordinates in kilometers [km]
  return distance;
}

/**
 * The centroid of a cluster of points / a set of points is the mean point position,
 * that is, the sum of all point coordinates divided by the number of points. Since geographic
 * coordinates are not plottable on a flat plane, they can't be averaged as the computation will be
 * mathematically incorrect due to the curvature of the earth. The points must be converted into cartesian
 * points which can be plotted and thus averaged. And from the average these points can then be converted
 * back into the geospatial domain to be reflected as geospatial points once more.
 *
 * @param coordinatePoints -> A collection / cluster of coordinate points to generate a centroid from.
 *
 * @returns -> A centroid geospatial coordinate point representing the center of all the passed in
 * coordinate points / coordinate point cluster.
 */
export function calculateGeospatialPointClusterCentroid(
  coordinatePoints: CoordinatePoint[]
): CoordinatePoint {
  // Convert geographic coordinates to Cartesian coordinates
  const cartesianPoints = coordinatePoints.map((point) => {
    // Convert lat and lng degrees to radians
    const latRad = convertDegreestoRadians(point.lat),
      lonRad = convertDegreestoRadians(point.lng);

    // Convert lat and lng radians to discrete x, y, and z points
    const x = EARTH_RADIUS_KM * Math.cos(latRad) * Math.cos(lonRad),
      y = EARTH_RADIUS_KM * Math.cos(latRad) * Math.sin(lonRad),
      z = EARTH_RADIUS_KM * Math.sin(latRad);

    return { x, y, z };
  });

  // Calculate the mean of Cartesian coordinates
  const meanX =
      cartesianPoints.reduce((sum, point) => sum + point.x, 0) /
      cartesianPoints.length,
    meanY =
      cartesianPoints.reduce((sum, point) => sum + point.y, 0) /
      cartesianPoints.length,
    meanZ =
      cartesianPoints.reduce((sum, point) => sum + point.z, 0) /
      cartesianPoints.length;

  // Convert mean Cartesian coordinates back to geographic coordinates
  const latitude = convertRadiansToDegrees(
      Math.atan2(meanZ, Math.sqrt(meanX ** 2 + meanY ** 2))
    ),
    longitude = convertRadiansToDegrees(Math.atan2(meanY, meanX));

  return { lat: latitude, lng: longitude };
}

/**
 * Determines the maximum diameter of the cluster if a circle is used to enclose all coordinate points
 * by calculating the maximum distance between coordinate points in the cluster.
 *
 * @param coordinatePoints
 *
 * @returns -> A number representing the maximum distance between coordinate points in the cluster aka the maximum
 * diameter of the cluster if a circle is used to enclose all coordinate points.
 */
export function calculateDiameterOfCoordinateCluster(
  coordinatePoints: CoordinatePoint[]
): number {
  let maxDistance = 0;

  // Dynamic programming (DP), adding up one solution to get the overall solution
  for (let i = 0; i < coordinatePoints.length; i++) {
    const referencePoint = coordinatePoints[i];

    for (let j = 0; j < coordinatePoints.length; j++) {
      // Skip the reference point itself, can't compare itself to itself.
      if (j == i) continue;

      const comparisonPoint = coordinatePoints[j];
      maxDistance = Math.max(
        computeDistanceBetweenCoordinatePoints(referencePoint, comparisonPoint),
        maxDistance
      );
    }
  }

  return maxDistance;
}

/**
 * Computes the center point of a geospatial coordinate point system and the zoom level required to display
 * all points in the cluster. This is used to recenter and focus the map on a cluster of points dynamically.
 *
 * @param coordinatePoints
 *
 * @returns -> Computed center point of a geospatial coordinate point system and the zoom level required to display
 * all points in the cluster.
 */
export function computeCoordinateAndZoomLevelToFitCluster(
  coordinatePoints: CoordinatePoint[]
): {
  centroidCoordinatePoint: CoordinatePoint | null;
  zoomLevel: number | null;
} {
  // Precondition failure, can't compute values if cluster is empty
  if (coordinatePoints.length < 1) {
    return { centroidCoordinatePoint: null, zoomLevel: null };
  }

  const clusterDiameterInKM =
      calculateDiameterOfCoordinateCluster(coordinatePoints),
    clusterDiameterInMeters = clusterDiameterInKM * 1000,
    centerOfCluster = calculateGeospatialPointClusterCentroid(coordinatePoints),
    zoomLevelToViewEntireCluster = calculateMapZoomLevel({
      centerCoordinatePoint: centerOfCluster,
      diameterInMeters: clusterDiameterInMeters,
    });

  return {
    centroidCoordinatePoint: centerOfCluster,
    zoomLevel: zoomLevelToViewEntireCluster,
  };
}

/**
 * Computes the required zoom level to display a map component's current view port at a
 * given diameter.
 *
 * Log base 2 basically translates to:
 * 2^(?) = (EARTH_CIRCUMFERENCE_METERS / diameter), where ? = zoom level
 *
 * @param diameter
 *
 * @returns -> Computed zoom level required to display a map component's current view port at the
 * given diameter.
 */
export function calculateMapZoomLevel({
  diameterInMeters,
  centerCoordinatePoint,
}: {
  diameterInMeters: number;
  centerCoordinatePoint: CoordinatePoint;
}): number {
  const latitude = centerCoordinatePoint.lat,
    zoomLevel = Math.log2(
      Math.abs(EARTH_CIRCUMFERENCE_METERS * Math.cos(latitude)) /
        diameterInMeters
    );

  return zoomLevel;
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
  const searchAreaDiameter = Math.abs(
    (EARTH_CIRCUMFERENCE_METERS * Math.cos(coordinates.lat)) /
      Math.pow(2, zoomLevel)
  );

  return searchAreaDiameter;
}

export function convertDegreestoRadians(degrees: number): number {
  return degrees.valueOf() * (Math.PI / 180);
}

export function convertRadiansToDegrees(radians: number): number {
  return radians.valueOf() * (180 / Math.PI);
}
