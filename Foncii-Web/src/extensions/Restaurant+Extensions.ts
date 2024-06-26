// Dependencies
// Utilities
import { unlimitStringCollection } from "../utilities/common/collections";

// Types
import { Restaurant } from "../__generated__/graphql";
import { getSizeOfSetIntersection } from "../utilities/math/collectionMath";

// Various extended type defs and algorithms for interpreting and extending the functionality
// of the restaurant type and its utility across the codebase

/// Type binding of restaurants to simplify the identification
/// process of restaurants on the map and associated lists by
/// users
export enum RestaurantTypes {
  DessertShop,
  IceCreamShop,
  FastFood,
  PizzaShop,
  DefaultType,
  Cafe,
  Bar,
  Diner,
  Seafood,
  Steakhouse,
  FoodHall,
  FoodCart,
  PopUpShop,
  Market,
  Festival,
}

// Static Definitions
const RestaurantTypeAliases = {
  [RestaurantTypes.DessertShop]: ["desserts", "dessert"],
  [RestaurantTypes.IceCreamShop]: ["icecream"],
  [RestaurantTypes.FastFood]: ["fastfood", "", ""],
  [RestaurantTypes.PizzaShop]: ["pizza"],
  [RestaurantTypes.DefaultType]: [],
  [RestaurantTypes.Cafe]: ["coffee"],
  [RestaurantTypes.Bar]: ["bar", "pub", "nightclub"],
  [RestaurantTypes.Diner]: [
    "diner",
    "diners",
    "american",
    "American (Traditional)",
  ],
  [RestaurantTypes.Seafood]: ["seafood", "crab", "lobster", "shrimp"],
  [RestaurantTypes.Steakhouse]: ["steakhouse", "steak"],
  [RestaurantTypes.FoodHall]: [""],
  [RestaurantTypes.FoodCart]: [""],
  [RestaurantTypes.PopUpShop]: [""],
  [RestaurantTypes.Market]: ["market"],
  [RestaurantTypes.Festival]: ["festival"],
};

// Enums
export enum PriceLevels {
  none = 0,
  "$" = 1,
  "$$" = 2,
  "$$$" = 3,
  "$$$$" = 4,
}

// For determining operating hours
export enum Weekdays {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

/**
 * Converts a numeric price level to a dollar sign string representation
 * Valid price levels range from 0 (free) - 4 (Very expensive)
 *
 * @param {Int} priceLevel
 * @returns {String} Dollar sign string if price level is valid, undefined otherwise
 */
export function convertNumericPriceLevelToDollarSigns(
  priceLevel: Number | undefined
): string | undefined {
  let priceLevelString: string | undefined = undefined;

  Object.entries(PriceLevels).forEach(([key, value]) => {
    if (value == priceLevel) {
      priceLevelString = key;
    }
  });

  return priceLevelString;
}

// Restaurant Type Inference System
/**
 * Inferences the type of a restaurant based on the known type aliases and inferrable categories associated with
 * the restaurant. The most matches for an alias sequence determines the inferred type of this restaurant.
 *
 * @param restaurant
 * @param customCategories
 *
 * @returns {RestaurantTypes} -> The inferred type of the restaurant, based on the known type aliases and inferrable categories
 * associated with the restaurant, the value of the enum is a zero-indexed number.
 */
export function inferTypeOfRestaurant(
  restaurant: Restaurant,
  customCategories: String[] = []
): number {
  let inferredType = RestaurantTypes.DefaultType,
    mostHitsForInferredType = 0,
    servesAlcohol = restaurant.servesAlcohol,
    fonciiCategories = restaurant.categories,
    creatorCategories = customCategories,
    concatenatedCategories = [
      ...(fonciiCategories ?? []),
      ...creatorCategories,
    ];

  // Normalize all categorical tags to improve inferencing
  const inferrableCategories = new Set(
    unlimitStringCollection(concatenatedCategories)
  );

  // Infer the type of the restaurant based on the inferrable categories and known type aliases
  // where the most matches for an alias sequence determines the inferred type of this restaurant
  Object.entries(RestaurantTypeAliases).forEach(([key, value]) => {
    let type = Number(key),
      aliasSequence = new Set(unlimitStringCollection(value));

    const hitsForSequence = getSizeOfSetIntersection(
      aliasSequence,
      inferrableCategories
    );

    // No hits for this alias sequence, skip the check and continue on
    if (hitsForSequence == 0) {
      return;
    }

    if (servesAlcohol) {
      // If the restaurant serves alcohol and matches the corresponding alias sequence, then it is a bar
      // or a similar establishment, skip the other type inference checks and return
      if (inferredType == RestaurantTypes.Bar) {
        return;
      }

      if (
        hitsForSequence > mostHitsForInferredType ||
        (hitsForSequence <= mostHitsForInferredType &&
          type == RestaurantTypes.Bar)
      ) {
        mostHitsForInferredType = hitsForSequence;
        inferredType = type;
      }
    } else {
      // Non-alcohol-serving restaurants are inferred by closest match, not by alcohol preference
      if (hitsForSequence > mostHitsForInferredType) {
        mostHitsForInferredType = hitsForSequence;
        inferredType = type;
      }
    }
  });

  return inferredType;
}
