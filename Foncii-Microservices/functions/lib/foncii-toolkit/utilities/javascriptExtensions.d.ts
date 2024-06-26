/**
* Self mutation method. Deletes any undefined key value pairs from the given object (if any)
* Implicitly returns a 'trimmed' object with only defined key value pairs
*
* @param object -> Some JS object, passed by reference (not a copy), self mutated in place.
*/
export declare function trimObject(object: Object): void;
