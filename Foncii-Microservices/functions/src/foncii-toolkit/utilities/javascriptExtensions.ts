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
    Object.keys(object).forEach(key => {
        const genericKey = key as keyof typeof object;
        
        // Only literal (undefined or null or empty object {}) values are stripped, other falsy values are untouched (string)
        if (object[genericKey] === undefined || object[genericKey] === null || isObject(object[genericKey]) && Object.keys(object[genericKey]).length == 0) {
            delete object[genericKey];
        }
    });
}