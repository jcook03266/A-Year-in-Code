// Useful functions for collection types (arrays, sets, maps, etc.)

/**
 * Normalizes a collection of strings by removing delimiters and trailing plurals (s && es)
 * as well as lowercasing all strings. Useful for aliases and matching some sequence of elements with
 * another.
 *
 * @param collection
 * @returns {string[]} -> Normalized collection of strings
 */
export function unlimitStringCollection(collection: String[]): string[] {
  return collection.map((element) => {
    let lowercasedAlias = element.toLowerCase(),
      delimiterRegex = "/[s*_#-]|(s|es)\b/gi", // Matches delimiters and trailing plurals (s && es)
      unlimitedAlias = lowercasedAlias.replace(delimiterRegex, "");

    return unlimitedAlias;
  });
}
