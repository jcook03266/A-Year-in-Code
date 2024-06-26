/** Helpful formatting methods **/
/** Post formatting */
// Formatting methods for username copies
// Ex.) testuser123 -> Testuser123
export const formattedCreatorUsername = (creatorUsername: string) => {
    var username = creatorUsername ?? "";

    return username.charAt(0).toUpperCase() + username.slice(1);
}

export const isCreatorUsernamePlural = (creatorUsername: string) => {
    return creatorUsername?.endsWith("s") ?? false;
}

// Ex.) testuser123 -> Testuser123's
export const possessiveFormattedUsernameCopy = (creatorUsername: string) => {
    if (!creatorUsername) return "";

    return `${formattedCreatorUsername(creatorUsername)}${isCreatorUsernamePlural(creatorUsername) ? "'" : "'s"}`;
}

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
export function truncateString(str: string, maxLength: number) {
    const ellipsisLength = 3;

    // Nothing to truncate, return the original string
    if (str.length <= maxLength) {
        return str;
    }

    return str.slice(0, maxLength - ellipsisLength) + '.'.repeat(ellipsisLength);
}