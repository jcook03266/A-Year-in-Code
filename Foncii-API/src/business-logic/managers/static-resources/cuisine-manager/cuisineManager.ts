// Dependencies
// Types
import { LanguageCodes } from "../../../../types/common";

// Generated Cuisine Data
import {
  CuisineAliases,
  LocalizedCuisineNames,
  SupportedCuisineImageURLs,
  SupportedCuisines,
} from "./cuisines";

// Utilities
import { isPlural } from "../../../../foncii-toolkit/formatting/stringFormatting";

/**
 * Manager class responsible for defining, computing,
 * and returning statically generated Cuisine entities.
 */
export default class CuisineManager implements StaticCategoryManager {
  /**
   * Factory method that creates an array of cuisine entities that correspond to all
   * of the supported cuisine types.
   *
   * @returns -> An array of cuisine entities corresponding to
   * all supported cuisine types.
   */
  generateEntities<Cuisine>(): Cuisine[] {
    const generatedCuisines = [];

    for (const [key, value] of Object.entries(SupportedCuisines)) {
      const parsedKey = key as keyof typeof SupportedCuisines;

      const cuisineModel = {
        id: value,
        localizedNames: {
          // Localizations
          [LanguageCodes.en]: LocalizedCuisineNames.english[parsedKey],
          [LanguageCodes.es]: LocalizedCuisineNames.english[parsedKey],
          [LanguageCodes.fr]: LocalizedCuisineNames.english[parsedKey],
        },
        imageURL: SupportedCuisineImageURLs[parsedKey],
      } as Cuisine;

      generatedCuisines.push(cuisineModel);
    }

    return generatedCuisines;
  }

  /**
   * Finds the closest matching cuisine to the given alias and returns the value
   * for the supported cuisines key value pair that best matches
   *
   * @param alias -> The string to compare with the known cuisine aliases
   * @returns -> The id of the supported cuisine that matches closest with the given alias, undefined if nothing could be found
   */
  static findClosestSupportedCuisineForAlias(
    alias: string
  ): string | undefined {
    let normalizedAlias = alias.toLowerCase();

    if (isPlural(normalizedAlias)) {
      normalizedAlias = normalizedAlias.slice(0, normalizedAlias.length - 1);
    }

    for (const key in CuisineAliases) {
      const parsedKey = key as keyof typeof SupportedCuisines;

      for (const cuisineAlias of CuisineAliases[parsedKey]) {
        let normalizedCuisineAlias = cuisineAlias.toLowerCase();

        if (isPlural(normalizedCuisineAlias)) {
          normalizedCuisineAlias = normalizedCuisineAlias.slice(
            0,
            normalizedCuisineAlias.length - 1
          );
        }

        // Straddle detection
        // Detect if the cuisine alias includes the given alias
        if (normalizedCuisineAlias.includes(normalizedAlias)) {
          return String(SupportedCuisines[parsedKey]);
        } else if (normalizedAlias.includes(normalizedCuisineAlias)) {
          // Detect if the given alias includes the cuisine alias
          return String(SupportedCuisines[parsedKey]);
        }
      }
    }

    return undefined;
  }

  // Cuisine Alias / Synonym Mapping
  /**
   * Finds a collection of aliases for the given cuisine / category
   * and returns the adjacent alias array.
   *
   * @param cuisine -> The cuisine name / category to find aliases for
   * @returns -> An array of aliases for the given cuisine, inclusive of the passed cuisine, empty if no matches found
   */
  static getAliasesForCuisine(cuisine: string): string[] {
    let normalizedAlias = cuisine.toLowerCase();

    if (isPlural(normalizedAlias)) {
      normalizedAlias = normalizedAlias.slice(0, normalizedAlias.length - 1);
    }

    for (const key in CuisineAliases) {
      const parsedKey = key as keyof typeof SupportedCuisines;

      for (const cuisineAlias of CuisineAliases[parsedKey]) {
        let normalizedCuisineAlias = cuisineAlias.toLowerCase();

        if (isPlural(normalizedCuisineAlias)) {
          normalizedCuisineAlias = normalizedCuisineAlias.slice(
            0,
            normalizedCuisineAlias.length - 1
          );
        }

        // Straddle detection
        // Detect if the cuisine alias includes the given alias
        // Return the entire array of aliases, including the originally passed cuisine alias
        if (normalizedCuisineAlias.includes(normalizedAlias)) {
          return CuisineAliases[parsedKey];
        } else if (normalizedAlias.includes(normalizedCuisineAlias)) {
          // Detect if the given alias includes the cuisine alias
          return CuisineAliases[parsedKey];
        }
      }
    }

    // No matches found
    return [];
  }
}
