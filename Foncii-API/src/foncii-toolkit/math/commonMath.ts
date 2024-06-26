// Dependencies
// Utility Library
import _ from "lodash";

// A set of utility functions that provide some reusable utility across the scope of this application
export function deduplicateArray<T>(array: T[]): T[] {
  return _.uniq<T>(array);
}

/**
 * `Clamps` the base number between the min and max numbers given, this is essentially
 * a boundary condition that ensures the number is within the specific range (inclusive)
 *
 * @param baseNumber
 * @param min
 * @param max
 *
 * @returns -> The number guaranteed to be bounded between the min and max values
 */
export function clampNumber(
  baseNumber: number,
  min: number,
  max: number
): number {
  return Math.min(Math.max(baseNumber, min), max);
}

/**
 * Converts the given number into a signed percentage from -1.00 <- 0.00 -> 1.00 and onwards
 * ~ -100% -> 0% -> +100% by dividing the base number by its maximum value,
 * generating the percentage the base number is relative to its max possible value
 *
 * @param number
 * @param maxValue
 *
 * @returns -> The number converted to a percentage
 */
export function convertNumberToPercentage(number: number, maxValue: number) {
  return number / maxValue;
}

/**
 * Determines if the given number is within the given range, inclusive
 *
 * @param number
 * @param minMax -> A tuple specifying the range, inclusive (min, max),
 * Note: the true max and min of the tuple are computed inside this method so no need to really worry about ordering.
 *
 * @returns -> True if the number is within the given range, false otherwise
 */
export function isNumberInRange(
  number: number,
  minMax: [number, number]
): boolean {
  return number >= Math.min(...minMax) && number <= Math.max(...minMax);
}

/**
 * Computes the mode of the given array (most frequent value) via map reducing
 * the total occurrences of each value in the array
 *
 * @param array - An array containing any hashable value
 *
 * @returns -> The most common value (string | undefined) in the given array (if any)
 */
export function getMode<T>(array: T[]): string | undefined {
  const counts = _.countBy(array);

  return _.maxBy(_.keys(counts), (key) => {
    return counts[key];
  });
}

/**
 * @param array -> An iterable collection of type 'array' with elements of
 * type 'any'
 *
 * @returns -> True if the given array is empty, false otherwise
 */
export function isArrayEmpty(array: any[]): boolean {
  return _.isEmpty(array);
}
