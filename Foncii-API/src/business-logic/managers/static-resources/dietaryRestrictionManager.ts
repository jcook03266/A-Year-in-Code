// Dependencies
// Types
import { LanguageCodes } from "../../../types/common";

// Utilities
import { isPlural } from "../../../foncii-toolkit/formatting/stringFormatting";

/**
 * Manager class responsible for defining, computing,
 * and returning statically generated Dietary Restriction entities.
 */
export default class DietaryRestrictionManager
  implements StaticCategoryManager
{
  // Supported Dietary Restrictions Table
  /**
   * Specific dietary restrictions mapped to some arbitrary ID to be referenced by other entities such as
   * Taste Profiles. Important: The ids these dietary restrictions are mapped to should not be changed beyond this point because other
   * unrelated entities directly reference these values and will not know if they change unexpectedly.
   */
  static SupportedDietaryRestrictions = {
    pescatarian: 0,
    dairyFree: 1,
    vegetarian: 2,
    glutenFree: 3,
    lowCarb: 4,
    kosher: 5,
    halal: 6,
    paleo: 7,
    keto: 8,
    nutAllergy: 9,
    vegan: 10,
    diabetic: 11,
  };

  // Dietary Restriction Icon Image URLs
  // The corresponding icon image in URL form for each dietary restriction type
  static SupportedDietaryRestrictionImageURLs = {
    pescatarian:
      "https://cdn.foncii.com/static-assets/dietary-restriction-icons/pescatarian.jpg",
    dairyFree:
      "https://cdn.foncii.com/static-assets/dietary-restriction-icons/dairy_free.jpg",
    vegetarian:
      "https://cdn.foncii.com/static-assets/dietary-restriction-icons/vegetarian.jpg",
    glutenFree:
      "https://cdn.foncii.com/static-assets/dietary-restriction-icons/gluten_free.jpg",
    lowCarb:
      "https://cdn.foncii.com/static-assets/dietary-restriction-icons/low_carb.jpg",
    kosher:
      "https://cdn.foncii.com/static-assets/dietary-restriction-icons/kosher.jpg",
    halal:
      "https://cdn.foncii.com/static-assets/dietary-restriction-icons/halal.jpg",
    paleo:
      "https://cdn.foncii.com/static-assets/dietary-restriction-icons/paleo.jpg",
    keto: "https://cdn.foncii.com/static-assets/dietary-restriction-icons/keto.jpg",
    nutAllergy:
      "https://cdn.foncii.com/static-assets/dietary-restriction-icons/nut_allergy.jpg",
    vegan:
      "https://cdn.foncii.com/static-assets/dietary-restriction-icons/vegan.jpg",
    diabetic:
      "https://cdn.foncii.com/static-assets/dietary-restriction-icons/diabetic.jpg",
  };

  // Supported Localizations
  static LocalizedCuisineNames = {
    // English localizations
    english: {
      pescatarian: "Pescatarian",
      dairyFree: "Dairy Free",
      vegetarian: "Vegetarian",
      glutenFree: "Gluten Free",
      lowCarb: "Low Carb",
      kosher: "Kosher",
      halal: "Halal",
      paleo: "Paleo",
      keto: "Keto",
      nutAllergy: "Nut Allergy",
      vegan: "Vegan",
      diabetic: "Diabetic",
    },
  };

  /**
   * Factory method that creates an array of dietary restriction entities that correspond to all
   * of the supported diet restrictions.
   *
   * @returns -> An array of dietary restriction entities corresponding to
   * all supported dietary restriction types.
   */
  generateEntities<DietaryRestriction>(): DietaryRestriction[] {
    const generatedDietaryRestrictions = [];

    for (const [key, value] of Object.entries(
      DietaryRestrictionManager.SupportedDietaryRestrictions
    )) {
      const parsedKey =
        key as keyof typeof DietaryRestrictionManager.SupportedDietaryRestrictions;

      const dietaryRestrictionModel = {
        id: value,
        localizedNames: {
          // Localizations
          [LanguageCodes.en]:
            DietaryRestrictionManager.LocalizedCuisineNames.english[parsedKey],
          [LanguageCodes.es]:
            DietaryRestrictionManager.LocalizedCuisineNames.english[parsedKey],
          [LanguageCodes.fr]:
            DietaryRestrictionManager.LocalizedCuisineNames.english[parsedKey],
        },
        imageURL:
          DietaryRestrictionManager.SupportedDietaryRestrictionImageURLs[
            parsedKey
          ],
      } as DietaryRestriction;

      generatedDietaryRestrictions.push(dietaryRestrictionModel);
    }

    return generatedDietaryRestrictions;
  }

  /**
   * An adjancency list of known aliases for different dietary restrictions for us to map
   * similar restaurant specific categories from different data sources to our supported
   * dietary restrictions, using implicit inferencing and direct enumeration from restaurants.
   */
  static DietaryRestrictionAliases = {
    pescatarian: ["Pescatarian", "Fish Eater", "Seafood Diet"],
    dairyFree: ["Dairy Free", "Lactose Intolerant", "No Milk"],
    vegetarian: ["Vegetarian", "Veggie", "Plant-Based", "Herbivore"],
    glutenFree: ["Gluten Free", "Celiac-Friendly", "No Wheat"],
    lowCarb: ["Low Carb", "Carb-Conscious", "Keto-Friendly"],
    kosher: ["Kosher", "Kosher-Style", "Certified Kosher"],
    halal: ["Halal", "Halal Certified"],
    paleo: ["Paleo", "Caveman Diet", "Stone Age Eating"],
    keto: ["Keto", "Ketogenic", "High Fat Low Carb"],
    nutAllergy: ["Nut Allergy", "Allergic to Nuts", "Nut-Sensitive"],
    vegan: ["Vegan", "Plant-Only", "Animal-Free", "Cruelty-Free"],
    diabetic: ["Diabetic", "Sugar Sensitive"],
  };

  /**
   * Finds the closest matching dietary restriction to the given alias and returns the value
   * for the supported dietary restriction key value pair that best matches
   *
   * @param {String} alias -> The string to compare with the known dietary restriction aliases
   * @returns -> The id of the supported dietary restriction that matches closest with the given alias, undefined if nothing could be found
   */
  static findClosestSupportedDietaryRestrictionForAlias(
    alias: string
  ): string | undefined {
    let normalizedAlias = alias.toLowerCase();

    if (isPlural(normalizedAlias)) {
      normalizedAlias = normalizedAlias.slice(0, normalizedAlias.length - 1);
    }

    for (const key in DietaryRestrictionManager.DietaryRestrictionAliases) {
      const parsedKey =
        key as keyof typeof DietaryRestrictionManager.SupportedDietaryRestrictions;

      for (const dietaryRestrictionAlias of DietaryRestrictionManager
        .DietaryRestrictionAliases[parsedKey]) {
        let normalizedDietaryRestrictionAlias =
          dietaryRestrictionAlias.toLowerCase();

        if (isPlural(normalizedDietaryRestrictionAlias)) {
          normalizedDietaryRestrictionAlias =
            normalizedDietaryRestrictionAlias.slice(
              0,
              normalizedDietaryRestrictionAlias.length - 1
            );
        }

        // Straddle detection
        // Detect if the dietary restriction alias includes the given alias
        if (normalizedDietaryRestrictionAlias.includes(normalizedAlias)) {
          return String(
            DietaryRestrictionManager.SupportedDietaryRestrictions[parsedKey]
          );
        } else if (
          normalizedAlias.includes(normalizedDietaryRestrictionAlias)
        ) {
          // Detect if the given alias includes the dietary restriction alias
          return String(
            DietaryRestrictionManager.SupportedDietaryRestrictions[parsedKey]
          );
        }
      }
    }

    return undefined;
  }

  // Dietary Restriction Alias / Synonym Mapping
  /**
   * Finds a collection of aliases for the given dietary restriction / category
   * and returns the adjacent alias array.
   *
   * @param dietaryRestriction -> The dietary restriction name / category to find aliases for
   * @returns -> An array of aliases for the given dietary restriction, inclusive of the passed dietary restriction, empty if no matches found
   */
  static getAliasesForDietaryRestriction(dietaryRestriction: string): string[] {
    let normalizedAlias = dietaryRestriction.toLowerCase();

    if (isPlural(normalizedAlias)) {
      normalizedAlias = normalizedAlias.slice(0, normalizedAlias.length - 1);
    }

    for (const key in DietaryRestrictionManager.DietaryRestrictionAliases) {
      const parsedKey =
        key as keyof typeof DietaryRestrictionManager.SupportedDietaryRestrictions;

      for (const dietaryRestrictionAlias of DietaryRestrictionManager
        .DietaryRestrictionAliases[parsedKey]) {
        let normalizedDietaryRestrictionAlias =
          dietaryRestrictionAlias.toLowerCase();

        if (isPlural(normalizedDietaryRestrictionAlias)) {
          normalizedDietaryRestrictionAlias =
            normalizedDietaryRestrictionAlias.slice(
              0,
              normalizedDietaryRestrictionAlias.length - 1
            );
        }

        // Straddle detection
        // Detect if the dietary restriction alias includes the given alias
        // Return the entire array of aliases, including the originally passed dietary restriction alias
        if (normalizedDietaryRestrictionAlias.includes(normalizedAlias)) {
          return DietaryRestrictionManager.DietaryRestrictionAliases[parsedKey];
        } else if (
          normalizedAlias.includes(normalizedDietaryRestrictionAlias)
        ) {
          // Detect if the given alias includes the dietary restriction alias
          return DietaryRestrictionManager.DietaryRestrictionAliases[parsedKey];
        }
      }
    }

    // No matches found
    return [];
  }
}
