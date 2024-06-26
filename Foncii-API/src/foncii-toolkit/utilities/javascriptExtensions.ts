// Dependencies
// Utilities
import { isObject } from "lodash";

/**
 * Self mutation method. Deletes any undefined key value pairs from the given object (if any)
 * Implicitly returns a 'trimmed' object with only defined key value pairs
 *
 * @param object -> Some JS object, passed by reference (not a copy), self mutated in place.
 */
export function trimObject(object: Object) {
  Object.entries(object).forEach(([key, value]) => {
    const genericKey = key as keyof typeof object;

    // Only literal (undefined or null) values are stripped, other falsy values are untouched (strings)
    // Note: This condition `isObject(value) && Object.keys(value).length == 0` excludes date objects
    if (
      value === undefined ||
      value === null ||
      (isObject(value) && Object.keys(value).length == 0)
    ) {
      delete object[genericKey];
    }
  });
}
