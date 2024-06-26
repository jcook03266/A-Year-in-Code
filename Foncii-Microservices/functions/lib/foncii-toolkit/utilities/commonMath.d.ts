export declare function deduplicateArray<T>(array: T[]): T[];
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
export declare function clampNumber(baseNumber: number, min: number, max: number): number;
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
export declare function convertNumberToPercentage(number: number, maxValue: number): number;
/**
 * Determines if the given number is within the given range, inclusive
 *
 * @param number
 * @param minMax -> A tuple specifying the range, inclusive (min, max),
 * Note: the true max and min of the tuple are computed inside this method so no need to really worry about ordering.
 *
 * @returns -> True if the number is within the given range, false otherwise
 */
export declare function isNumberInRange(number: number, minMax: [number, number]): boolean;
/**
 * Computes the mode of the given array (most frequent value) via map reducing
 * the total occurrences of each value in the array
 *
 * @param array - An array containing any hashable value
 *
 * @returns -> The most common value (string | undefined) in the given array (if any)
 */
export declare function getMode<T>(array: T[]): string | undefined;
