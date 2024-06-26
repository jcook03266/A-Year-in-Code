// Dependencies
// Types
import { LanguageCodes } from "../../../types/common";

// Utilities
import { isPlural } from "../../../foncii-toolkit/formatting/stringFormatting";

/**
 * Manager class responsible for defining, computing,
 * and returning statically generated Meal Type entities.
 */
export default class MealTypeManager implements StaticCategoryManager {
  // Supported Meal Type Table
  static SupportedMealTypes = {
    breakfast: 0,
    lunch: 1,
    dinner: 2,
    desserts: 3,
  };

  // Supported Localizations
  // English localizations
  static EnglishLocalizedMealTypeNames = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    desserts: "Desserts",
  };

  // Describes the meal types the user can select from on the frontend to filter restaurant results
  // May be subject to change, Note: this is just for reference
  static MealTypes = {
    desserts: "Desserts",
    dinner: "Dinner",
    lunch: "Lunch",
    breakfast: "Breakfast",
  };

  // Aliases for specific meal types that match up with expected categories supported by the yelp categories attribute
  static MealTypeAliases = {
    desserts: [
      "Desserts",
      "Dessert",
      "Ice Cream & Frozen Yogurt",
      "Ice Cream",
      "Frozen Yogurt",
      "Bakeries",
      "Bubble Tea",
      "Patisseries",
      "Sweet Treats",
      "Confectioneries",
      "Chocolateries",
      "Gelato",
      "Cupcakes",
      "Pastry Paradise",
      "Sugar Rush",
    ],
    dinner: [
      "Dinner",
      "Steakhouses",
      "Diners",
      "Supper",
      "Evening Eats",
      "Main Course",
      "Feast",
      "Fine Dining",
      "Nighttime Nosh",
      "Dine-Out",
      "Dine-In",
      "Gourmet Dinner",
      "Table for Two",
      "Entrees",
    ],
    lunch: [
      "Lunch",
      "Noon Meal",
      "Midday Munchies",
      "Cafeteria",
      "Lunchtime Delights",
      "Quick Bites",
      "Light Fare",
      "Noontime Nourishment",
      "Brunch",
      "Lunch & Learn",
      "Lunchbox",
      "On-the-Go Eats",
      "Workday Fuel",
      "Business Bites",
    ],
    breakfast: [
      "Breakfast",
      "Breakfast & Brunch",
      "Brunch",
      "Sandwiches",
      "Morning Meals",
      "Sunrise Feasting",
      "Early Bird Eats",
      "Rise & Dine",
      "AM Delights",
      "Breakfast Bonanza",
      "Morning Munchies",
      "Coffee & Croissants",
      "Wakeup Wonders",
      "Eggstravaganza",
    ],
  };

  /**
   * Factory method that creates an array of meal type entities that correspond to all
   * of the supported meal types.
   *
   * @returns -> An array of meal type entities corresponding to
   * all supported meal types.
   */
  generateEntities<MealType>(): MealType[] {
    const generatedMealTypes = [];

    for (const [key, value] of Object.entries(
      MealTypeManager.SupportedMealTypes
    )) {
      const parsedKey = key as keyof typeof MealTypeManager.SupportedMealTypes;

      const mealTypeModel = {
        id: value,
        localizedNames: {
          // Localizations
          [LanguageCodes.en]:
            MealTypeManager.EnglishLocalizedMealTypeNames[parsedKey],
          [LanguageCodes.es]:
            MealTypeManager.EnglishLocalizedMealTypeNames[parsedKey],
          [LanguageCodes.fr]:
            MealTypeManager.EnglishLocalizedMealTypeNames[parsedKey],
        },
      } as MealType;

      generatedMealTypes.push(mealTypeModel);
    }

    return generatedMealTypes;
  }

  /**
   * Finds the closest matching meal type to the given alias and returns the value
   * for the supported meal type key value pair that best matches
   *
   * @param alias -> The string to compare with the known meal type aliases
   * @returns -> The supported meal type that matches closest with the given alias, undefined if nothing could be found
   */
  static findClosestSupportedMealTypeForAlias(
    alias: string
  ): string | undefined {
    let normalizedAlias = alias.toLowerCase();

    if (isPlural(normalizedAlias)) {
      normalizedAlias = normalizedAlias.slice(0, normalizedAlias.length - 1);
    }

    for (const key in MealTypeManager.MealTypeAliases) {
      const parsedKey = key as keyof typeof MealTypeManager.SupportedMealTypes;

      for (const mealTypeAlias of MealTypeManager.MealTypeAliases[parsedKey]) {
        let normalizedMealTypeAlias = mealTypeAlias.toLowerCase();

        if (isPlural(normalizedMealTypeAlias)) {
          normalizedMealTypeAlias = normalizedMealTypeAlias.slice(
            0,
            normalizedMealTypeAlias.length - 1
          );
        }

        // Straddle detection
        // Detect if the meal type alias includes the given alias
        if (normalizedMealTypeAlias.includes(normalizedAlias)) {
          return String(MealTypeManager.SupportedMealTypes[parsedKey]);
        } else if (normalizedAlias.includes(normalizedMealTypeAlias)) {
          // Detect if the given alias includes the meal type alias
          return String(MealTypeManager.SupportedMealTypes[parsedKey]);
        }
      }
    }

    return undefined;
  }

  // Meal Type Alias / Synonym Mapping
  /**
   * Finds a collection of aliases for the given meal type / category
   * and returns the adjacent alias array.
   *
   * @param mealType
   * @returns -> An array of aliases for the given meal type, inclusive of the passed meal type, empty if no matches found
   */
  static getAliasesForMealType(mealType: string) {
    let normalizedAlias = mealType.toLowerCase();

    if (isPlural(normalizedAlias)) {
      normalizedAlias = normalizedAlias.slice(0, normalizedAlias.length - 1);
    }

    for (const key in MealTypeManager.MealTypeAliases) {
      const parsedKey = key as keyof typeof MealTypeManager.SupportedMealTypes;

      for (const mealTypeAliases of MealTypeManager.MealTypeAliases[
        parsedKey
      ]) {
        let normalizedMealTypeAlias = mealTypeAliases.toLowerCase();

        if (isPlural(normalizedMealTypeAlias)) {
          normalizedMealTypeAlias = normalizedMealTypeAlias.slice(
            0,
            normalizedMealTypeAlias.length - 1
          );
        }

        // Straddle detection
        // Detect if the meal type alias includes the given alias
        // Return the entire array of aliases, including the originally passed meal type alias
        if (normalizedMealTypeAlias.includes(normalizedAlias)) {
          return MealTypeManager.MealTypeAliases[parsedKey];
        } else if (normalizedAlias.includes(normalizedMealTypeAlias)) {
          // Detect if the given alias includes the meal type alias
          return MealTypeManager.MealTypeAliases[parsedKey];
        }
      }
    }

    // No matches found
    return [];
  }
}
