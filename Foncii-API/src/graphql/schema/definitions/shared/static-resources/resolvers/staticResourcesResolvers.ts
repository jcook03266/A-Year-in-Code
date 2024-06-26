// Dependencies
// Managers
import CuisineManager from "../../../../../../business-logic/managers/static-resources/cuisine-manager/cuisineManager";
import DietaryRestrictionManager from "../../../../../../business-logic/managers/static-resources/dietaryRestrictionManager";
import MealTypeManager from "../../../../../../business-logic/managers/static-resources/mealTypeManager";
import MajorCityManager from "../../../../../../business-logic/managers/static-resources/majorCityManager";

// Service Definitions
const cuisineManager = new CuisineManager(),
  dietaryRestrictionManager = new DietaryRestrictionManager(),
  mealTypeManager = new MealTypeManager(),
  majorCityManager = new MajorCityManager();

const resolvers = {
  // Resolve query operations for static resources
  Query: {
    fetchAllCuisines: async () => {
      return cuisineManager.generateEntities();
    },

    fetchAllDietaryRestrictions: async () => {
      return dietaryRestrictionManager.generateEntities();
    },

    fetchAllMealTypes: async () => {
      return mealTypeManager.generateEntities();
    },

    fetchAllMajorCities: async () => {
      return majorCityManager.generateEntities();
    },
  },
};

export default resolvers;
