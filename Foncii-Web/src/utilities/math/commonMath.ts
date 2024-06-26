// Common math functions and computations
/**
 * Note: Don't worry about the ordering, this function
 * can determine the real max and min if needed
 *
 * @param value
 * @param max
 * @param min
 * @returns -> True if value is between min (Inclusive) and max (Inclusive), false otherwise.
 */
export function isInRange(value: number, max: number, min: number): boolean {
  return value >= Math.min(min, max) && value <= Math.max(min, max);
}

/**
 * `Clamps` the base number between the min and max numbers given, this is essentially
 * a boundary condition that ensures the number is within the specific range (inclusive)
 *
 * @param base -> The number to clamp between the min and max (inclusive)
 * @param min
 * @param max
 * @returns The number guaranteed to be bounded between the min and max values
 */
export function clampNumber(base: number, min: number, max: number) {
  return Math.min(Math.max(base, min), max);
}
