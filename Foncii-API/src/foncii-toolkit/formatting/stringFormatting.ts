/** Helpful formatting methods **/
/** Post formatting */
// Formatting methods for username copies
// Ex.) testuser123 -> Testuser123
export const formattedCreatorUsername = (creatorUsername: string) => {
  const username = creatorUsername ?? "";
  return username.charAt(0).toUpperCase() + username.slice(1);
};

export const isCreatorUsernamePlural = (creatorUsername: string) => {
  return isPlural(creatorUsername);
};

// Ex.) testuser123 -> Testuser123's
export const possessiveFormattedUsernameCopy = (creatorUsername: string) => {
  if (!creatorUsername) return "";

  return `${formattedCreatorUsername(creatorUsername)}${isCreatorUsernamePlural(creatorUsername) ? "'" : "'s"
    }`;
};

/** String formatting */
/**
 * @param str
 *
 * @returns -> True if the string ends with `s`, false otherwise.
 *
 * Note: This method is used to determine if a string is plural or not.
 * For example, 'tests' is plural, whereas 'test' is not.
 *
 * This method is used in the following way:
 * ```
 * if (isPlural(str)) {
 *     // do something
 * }
 * ```
 */
export function isPlural(str: string) {
  return str.endsWith("s");
}

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

  return str.slice(0, maxLength - ellipsisLength) + ".".repeat(ellipsisLength);
}

/**
 * Parses hashtags from a string while ignoring non-word characters
 * (letters, digits, and underscores only).
 * Ex.) "#test #test2" -> ["test", "test2"]
 *
 * @param inputString
 *
 * @returns -> An array of strings containing the parsed hashtags.
 */
export function parseHashtags(inputString: string): string[] {
  // Use a regular expression to find all hashtags in the input string
  const hashtags = inputString.match(/#\w+/g);

  // If hashtags are found, return them as individual categories
  // Otherwise, return an empty array
  return hashtags ? hashtags.map((tag) => tag.slice(1)) : [];
}

/**
 * Parses @ mentions from a string while ignoring non-word characters
 * (letters, digits, and underscores only).
 * Ex.) `@foodie123` `@righteouseats` -> ["foodie123", "righteouseats"]
 *
 * @param inputString
 *
 * @returns -> An array of strings containing the parsed @ mentions.
 */
export function parseAtMentions(inputString: string): string[] {
  // Use a regular expression to find all @ mentions in the input string
  const atMentions = inputString.match(/@\w+/g);

  // If @ mentions are found, return them as individual elements
  // Otherwise, return an empty array
  return atMentions ? atMentions.map((mention) => mention.slice(1)) : [];
}
