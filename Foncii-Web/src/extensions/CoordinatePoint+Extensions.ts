// Various extended coordinate point functionalities and defintions
export enum CardinalDirections {
  north = "North",
  south = "South",
  east = "East",
  west = "West",
}

// Vertical directions | Runs laterally / from east to west, but measures your distance north or south (Opposite meaning)
const LatitudeDirections = {
  [CardinalDirections.north]: CardinalDirections.north, // Sign: +
  [CardinalDirections.south]: CardinalDirections.south, // -
};

// Horizontal directions
const LongitudeDirections = {
  [CardinalDirections.west]: CardinalDirections.west, // +
  [CardinalDirections.east]: CardinalDirections.east, // -
};

/// Converts the signed coordinate point system into a directional one by using cardinal directions
/**
 * @param latitude
 * @param abbreviated -> True: 'N' | False: 'North'
 *
 * @returns -> String representation of the coordinate's lat degrees and the direction ex.) 40.667°N
 */
export function latitudeDirectionDescription(
  latitude: number,
  abbreviated: boolean = true
): String {
  const direction =
    latitude > 0 ? LatitudeDirections.North : LatitudeDirections.South;
  return abbreviated ? direction.charAt(0) : direction;
}

/**
 * @param longitude
 * @param abbreviated -> True: 'W' | False: 'West'
 *
 * @returns -> String representation of the coordinate's lng degrees and the direction ex.) 73.969°W
 */
export function longitudeDirectionDescription(
  longitude: number,
  abbreviated: boolean = true
): String {
  const direction =
    longitude > 0 ? LongitudeDirections.East : LongitudeDirections.West;
  return abbreviated ? direction.charAt(0) : direction;
}
