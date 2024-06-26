/** Helpful formatting methods **/
/** Post formatting */
export declare const formattedCreatorUsername: (creatorUsername: string) => string;
export declare const isCreatorUsernamePlural: (creatorUsername: string) => boolean;
export declare const possessiveFormattedUsernameCopy: (creatorUsername: string) => string;
/** String formatting */
/**
* Truncates a string that exceeds the given maximum length of characters
* ex.) (Hello World, 8) -> Hello Wo...
*
* @param string
* @param maxLength
*
* @returns -> Truncated string with '...' concatenated at the end,
* or the original string depending on the condition's validation outcome.
* Note: This cuts off the last 3 characters of the excessive string copy.
*/
export declare function truncateString(str: string, maxLength: number): string;
