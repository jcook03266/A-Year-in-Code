// Dependencies
// Models
import UpdatableModel from "./protocols/updatableModel";
import RestaurantModel from "./restaurantModel";

// Services
import { DatabaseServiceAdapter } from "../../business-logic/services/database/databaseService";
import PercentMatchService from "../../business-logic/services/percent-match/percentMatchService";

// Categorical Data Managers
import CuisineManager from "../../business-logic/managers/static-resources/cuisine-manager/cuisineManager";
import DietaryRestrictionManager from "../../business-logic/managers/static-resources/dietaryRestrictionManager";
import { SupportedCuisines } from "../../business-logic/managers/static-resources/cuisine-manager/cuisines";

// Utilities
import { computeDistanceBetweenCoordinatePoints } from "../../foncii-toolkit/math/euclideanGeometryMath";
import { mean } from "lodash";
import {
  clampNumber,
  deduplicateArray,
  isNumberInRange,
} from "../../foncii-toolkit/math/commonMath";

/**
 * This instance contains all necessary high level information
 * about a user's taste profile.
 */
export default class TasteProfileModel
  extends UpdatableModel
  implements Identifiable<string>, TasteProfile, Objectable<TasteProfile>
{
  // Properties
  id;
  userID;
  spicePreferenceLevel;
  adventureLevel;
  distancePreferenceLevel;
  diningPurpose;
  ambiancePreference;
  drinkPreference;
  preferredCuisines;
  dietaryRestrictions;
  preferredPriceRange;

  /** Optional computed embedding encoded by the server when the taste profile is created/updated and stored in the database for vector search */
  collective_embedding?: number[];

  // Limits
  static spicePreferenceLevelAnswerRange: [0, 2] = [0, 2];
  static adventureLevelAnswerRange: [0, 2] = [0, 2];
  static distancePreferenceLevelAnswerRange: [0, 2] = [0, 2];
  static diningPurposeAnswerRange: [0, 3] = [0, 3];
  static ambiancePreferenceAnswerRange: [0, 3] = [0, 3];
  static drinkPreferenceAnswerRange: [0, 3] = [0, 3];
  static preferredPriceRangeAnswerRange: [0, 3] = [0, 3];
  static preferredCuisinesAnswerLimit: 20 = 20;
  static dietaryRestrictionsAnswerLimit: 20 = 20;
  static priceLevelMinMaxValue: [1, 4] = [1, 4];

  // Enumerated Ranges
  /**
   * Cascading ranges akin to a reverse of Amazon's ** and up filter
   * Starts at 4 dollar signs and goes down from there, with each
   * option encompassing 4 dollar signs (inclusive) and all the options below it.
   * When the user selects 4 dollar signs then a weight is applied to all price
   * levels 4 and below, and so on and so on, the only confusion thing about this
   * is that the order of the price levels is reversed, so 0 means 4 and so on.
   */
  static PriceLevelRanges: PriceLevelRanges = {
    0: 4, // 4 ($$$$) and below [($$$$), ($$$), ($$), ($)]
    1: 3, // 3 ($$$) and below [($$$), ($$), ($)]
    2: 2, // 2 ($$) and below [($$), ($)]
    3: 1, // 1 ($) and below [($)]
  };

  static TravelDistancePreferenceMaxRadii: { 0: 8050; 1: 16093; 2: 16093 } = {
    0: 8050,
    1: 16093,
    2: 16093,
  };

  /** Note: If no embedding is passed, it will be automatically generated here */
  constructor({
    id,
    userID,
    spicePreferenceLevel,
    adventureLevel,
    distancePreferenceLevel,
    diningPurpose,
    ambiancePreference,
    drinkPreference,
    preferredCuisines = [],
    dietaryRestrictions = [],
    preferredPriceRange,
    creationDate,
    lastUpdated,
    collective_embedding,
  }: Partial<TasteProfile> & { userID: string }) {
    super({ creationDate, lastUpdated });

    function clampAnswerToRange<T>(
      answer: number | undefined,
      range: [number, number]
    ): T | undefined {
      if (answer == undefined) return undefined;

      if (isNumberInRange(answer, range)) return answer as T;
      else return undefined;
    }

    // Taste Profile Properties
    this.id = id ?? DatabaseServiceAdapter.generateUUIDHexString(); // Random UUID hex string, used when creating a new entity to be stored in the DB
    (this.userID = userID),
      (this.spicePreferenceLevel = clampAnswerToRange<0 | 1 | 2>(
        spicePreferenceLevel,
        TasteProfileModel.spicePreferenceLevelAnswerRange
      ));
    this.adventureLevel = clampAnswerToRange<0 | 1 | 2>(
      adventureLevel,
      TasteProfileModel.adventureLevelAnswerRange
    );
    this.distancePreferenceLevel = clampAnswerToRange<0 | 1 | 2>(
      distancePreferenceLevel,
      TasteProfileModel.distancePreferenceLevelAnswerRange
    );
    this.diningPurpose = clampAnswerToRange<0 | 1 | 2 | 3>(
      diningPurpose,
      TasteProfileModel.diningPurposeAnswerRange
    );
    this.ambiancePreference = clampAnswerToRange<0 | 1 | 2 | 3>(
      ambiancePreference,
      TasteProfileModel.ambiancePreferenceAnswerRange
    );
    this.drinkPreference = clampAnswerToRange<0 | 1 | 2 | 3>(
      drinkPreference,
      TasteProfileModel.drinkPreferenceAnswerRange
    );
    this.preferredPriceRange = clampAnswerToRange<0 | 1 | 2 | 3>(
      preferredPriceRange,
      TasteProfileModel.preferredPriceRangeAnswerRange
    );

    // Ensure that each array of cuisine, food restriction, and meal types correspond to their supported values
    this.preferredCuisines = (preferredCuisines ?? [])
      .filter((cuisineID) => {
        return Object.values(SupportedCuisines).includes(Number(cuisineID));
      })
      .slice(0, TasteProfileModel.preferredCuisinesAnswerLimit);

    this.dietaryRestrictions = (dietaryRestrictions ?? [])
      .filter((dietaryRestrictionID) => {
        return Object.values(
          DietaryRestrictionManager.SupportedDietaryRestrictions
        ).includes(Number(dietaryRestrictionID));
      })
      .slice(0, TasteProfileModel.dietaryRestrictionsAnswerLimit);

    this.collective_embedding =
      collective_embedding ?? this.generateEmbedding();
  }

  // Protocol Implementation
  static fromObject(
    object: TasteProfile | null | undefined
  ): TasteProfileModel | undefined {
    if (object?.id == undefined || object == undefined || object == null)
      return;

    return new TasteProfileModel(object);
  }

  /**
   * @returns An object converted from JSON format representing the taste profile's data.
   */
  toObject<TasteProfile>(): TasteProfile {
    return JSON.parse(JSON.stringify(this));
  }

  // Taste Profile Embedding Generation | Machine Learning Techniques
  /**
   * Creates an embedding vector (array) that can be used in comparisons with other
   * taste profile embeddings, which in turn enables collaborative filtering.
   * Using other users as a means of recommending is very powerful and is a
   * crucial step for us as influencer to user recommendations are our
   * target vector of attack. Whatever the influencer may like, the current user
   * may also like if they have a similar taste profile to that influencer, and
   * vice-versa.
   *
   * Crash course about machine learning embeddings here: https://developers.google.com/machine-learning/crash-course/embeddings/video-lecture
   *
   * Storing this embedding:
   * This embedding will be stored in the database alongside the normal data. When it comes to querying for similar taste profiles
   * other taste profiles will be compared to this embedding through euclidean distance computations within the database itself via vector search.
   * Here's how it works with MongoDB: https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/
   *
   * @returns -> A vector containing numbers representing the various features this taste profile
   * encompasses.
   */
  generateEmbedding() {
    // Features to include in the embedding
    const numericFeatures = [
      this.spicePreferenceLevel,
      this.adventureLevel,
      this.distancePreferenceLevel,
      this.diningPurpose,
      this.ambiancePreference,
      this.doesUserPreferAlcohol() ? 1 : 0, // Simplified approach since only one of the options indicates they don't drink
      this.preferredPriceRange,
    ];

    const categoricalFeatures = [
      this.preferredCuisines,
      this.dietaryRestrictions,
    ],
      // Fill the array for the one-hot encoded categorical features
      supportedCuisinesFeatureDimension =
        Object.values(SupportedCuisines).length,
      supportedDietaryRestrictionsFeatureDimension = Object.values(
        DietaryRestrictionManager.SupportedDietaryRestrictions
      ).length,
      categoricalFeaturesVectorDimension =
        supportedCuisinesFeatureDimension +
        supportedDietaryRestrictionsFeatureDimension,
      categoricalFeaturesVector = new Array(
        categoricalFeaturesVectorDimension
      ).fill(0);

    // One-hot encoding
    // Read more here: https://www.geeksforgeeks.org/ml-one-hot-encoding-of-datasets-in-python/
    // Cuisines
    categoricalFeatures[0].forEach((cuisineID) => {
      const index = Number(cuisineID) + 0; // The zero is symbolic, just showing that the cuisines go first before dietary restrictions

      // Index is valid and within the supported bounds, encode the feature at that index
      if (index != undefined && index < supportedCuisinesFeatureDimension)
        categoricalFeaturesVector[index] = 1;
    });

    // Dietary restrictions
    categoricalFeatures[1].forEach((dietaryRestrictionID) => {
      const index =
        Number(dietaryRestrictionID) + supportedCuisinesFeatureDimension; // Dietary restrictions are offset by cuisines

      // Index is valid and within the supported bounds, encode the feature at that index
      if (
        index != undefined &&
        index < supportedDietaryRestrictionsFeatureDimension
      )
        categoricalFeaturesVector[index] = 1;
    });

    // Optionally, normalize the features to a common scale (e.g., [0, 1])
    const normalizedNumericFeatures = numericFeatures.map((feature) => {
      // Default to 0 if the feature is undefined (not yet specified by the user)
      return feature ?? 0;
    });

    // Concatenating all feature vectors (numeric and categorical)
    return [...normalizedNumericFeatures, ...categoricalFeaturesVector];
  }

  // Taste Profile Generation
  // Default
  /**
   * A simple approach to generating a taste profile when no initial data points have been provided.
   *
   * @param userID
   *
   * @returns -> A simple default taste profile belonging to the user with the specified user ID
   */
  static defaultTasteProfile(userID: string): TasteProfileModel {
    return new TasteProfileModel({ userID });
  }

  // Auto-generation
  /**
   * Autogenerates a taste profile based on the given restaurant selection (if any). The user can pick their favorite
   * restaurants and this method will parse those restaurants into a valid taste profile complete with a generated embedding
   * via the default constructor method.
   *
   * @async
   * @param userID
   * @param restaurantSelection -> Ideally multiple unique or similar restaurants to use to generate the taste profile with.
   * The more restaurants the better the generated taste profile will be as more data points will be available. But, we will
   * allow for a single restaurant to be passed in as well just in case a person isn't a foodie. If the person doesn't have any
   * restaurant selections and skips that section, then the default taste profile is simply generated and used instead.
   *
   * Note: `spicePreferenceLevel`, `dietaryRestrictions`,
   * `diningPurpose`, and `ambiancePreference` are not assumed when auto-generating
   * taste profiles as these are often health, personal information centric parameters
   * that the user must choose. These parameters also greatly affect the percent match
   * score for the user match component, thus they're left unassumed to prevent drastic score swings.
   *
   * @returns -> An automatically generated taste profile belonging to the user with the specified user ID
   */
  static async autoGenerateTasteProfile(
    userID: string,
    restaurantSelection: RestaurantModel[]
  ): Promise<TasteProfileModel> {
    // Preferred Cuisine Computation
    const concatenatedCategories = restaurantSelection.flatMap(
      (restaurant) => restaurant.categories
    ),
      categoryFrequencies = deduplicateArray(concatenatedCategories).map(
        (category) => {
          return {
            category,
            frequency: concatenatedCategories.filter((val) => val == category)
              .length,
          };
        }
      ),
      mappedCuisineIDs = categoryFrequencies
        .map((categoryFreq) => {
          return CuisineManager.findClosestSupportedCuisineForAlias(
            categoryFreq.category
          );
        })
        .filter(Boolean) as string[],
      uniqueCuisinesIDs = deduplicateArray(mappedCuisineIDs);

    // Preferred Price Level Computation | 0 ~ [$, $$] | 1 ~ [$$$] | 2 ~ [$$$$]
    const validPriceLevels: number[] = restaurantSelection
      .map((restaurant) => restaurant.priceLevel)
      .filter(Boolean),
      meanPriceLevel = clampNumber(
        Math.ceil(mean(validPriceLevels) ?? 0),
        0,
        4
      ),
      meanPriceLevelRange = this.determinePriceLevelRangeFor(
        meanPriceLevel as PriceLevels
      );

    // Adventure Level Computation | 0 ~ Not comfortable with anything different | 1 -> 2 ~ Comfortable with new experiences
    const avgSimilarityScoreBetweenRestaurants =
      await PercentMatchService.computeAverageSimilarityScoreBetweenRestaurants(
        restaurantSelection
      ); // Collaborative filtering

    // 0 - Picky eater, 1 - Stays in comfort zone, 2 - Eats anything
    let assumedAdventureLevel: (0 | 1 | 2) | undefined = undefined;
    if (avgSimilarityScoreBetweenRestaurants <= 0.3) {
      assumedAdventureLevel = 2;
    } else if (avgSimilarityScoreBetweenRestaurants < 0.7) {
      assumedAdventureLevel = 1;
    } else if (avgSimilarityScoreBetweenRestaurants >= 0.7) {
      assumedAdventureLevel = 0;
    }

    // Distance Preference Level Computation | 0 ~ >= 0 && < 5 miles | 1 ~ >= 5 && < 10 miles| 2 ~ >= 10 miles
    let assumedDistancePreferenceLevel: (0 | 1 | 2) | undefined = undefined,
      totalDistanceBetweenRestaurants = 0,
      avgDistanceBetweenRestaurants = 0;

    for (let i = 0; i < restaurantSelection.length; i++) {
      for (let j = i + 1; j < restaurantSelection.length; j++) {
        totalDistanceBetweenRestaurants +=
          computeDistanceBetweenCoordinatePoints(
            restaurantSelection[i].coordinates,
            restaurantSelection[j].coordinates
          );
      }
    }

    // 0 - 0 - 5 miles, 1 - 6 - 10 miles, 2 - 10+ miles
    avgDistanceBetweenRestaurants =
      totalDistanceBetweenRestaurants /
      (restaurantSelection.length * (restaurantSelection.length - 1));
    if (
      avgDistanceBetweenRestaurants < this.TravelDistancePreferenceMaxRadii[0]
    ) {
      assumedDistancePreferenceLevel = 0;
    } else if (
      avgDistanceBetweenRestaurants < this.TravelDistancePreferenceMaxRadii[1]
    ) {
      assumedDistancePreferenceLevel = 1;
    } else if (
      avgDistanceBetweenRestaurants >= this.TravelDistancePreferenceMaxRadii[2]
    ) {
      assumedDistancePreferenceLevel = 2;
    }

    return new TasteProfileModel({
      userID,
      adventureLevel: assumedAdventureLevel,
      distancePreferenceLevel: assumedDistancePreferenceLevel,
      preferredCuisines: uniqueCuisinesIDs,
      preferredPriceRange: meanPriceLevelRange
    });
  }

  // Helper Functions
  /**
   * Finds and returns the maximum radius for the user's travel distance preference level in meters [m]
   * if the user has specified it.
   *
   * @returns -> The maximum radius for the user's travel distance preference level in meters [m], undefined if the user hasn't specified it yet
   */
  getUserTravelDistancePreferenceMaxRadius(): number | undefined {
    if (this.distancePreferenceLevel == undefined) return;

    return TasteProfileModel.TravelDistancePreferenceMaxRadii[
      this.distancePreferenceLevel
    ];
  }

  doesUserPreferAlcohol(): boolean {
    // Default value is false, since a preference for drinking is a choice to be made by the user
    if (this.drinkPreference == undefined) return false;

    // The last option i.e option 0 / 1 is 'Non-alcoholic beverages only' aka no alcohol
    return this.drinkPreference != 0;
  }

  // Percent Match Logic
  isRestaurantIncludedInCurrentTravelDistancePreference(
    userLocation: CoordinatePoint,
    restaurant: Restaurant
  ): boolean {
    if (this.distancePreferenceLevel == undefined) return false;

    const maxDistance = this.getUserTravelDistancePreferenceMaxRadius()!,
      distanceBetweenUserAndRestaurant = computeDistanceBetweenCoordinatePoints(
        userLocation,
        restaurant.coordinates
      );

    return maxDistance >= distanceBetweenUserAndRestaurant;
  }

  /**
   * Used when computing percentage match score for user match. If the price level range preference is undefined
   * then interpret it as a fulfilled parameter in the computation since this means the user has no explicit preference,
   * this is the default behavior so as to make sure the computed % match scores aren't too low.
   *
   * Note: A passed price level of 0 means no selection aka none, there are 4 valid price levels 1 - 4 (dollar signs)
   *
   * @param priceLevel
   *
   * @returns -> True if the given price level is included in the currently selected price level range
   * preference (if any), false otherwise
   */
  isPriceLevelIncludedInCurrentRange(priceLevel: PriceLevels): boolean {
    if (this.preferredPriceRange == undefined || priceLevel == 0) return false;

    // User's preferred price range maximum 4 dollar signs down to 1 dollar signs potentially
    const maximumPriceLevel =
      TasteProfileModel.PriceLevelRanges[this.preferredPriceRange],
      minimumPriceLevel = TasteProfileModel.PriceLevelRanges[3]; // 1 Dollar sign (minimum valid price level)

    return isNumberInRange(priceLevel, [minimumPriceLevel, maximumPriceLevel]);
  }

  /**
   * Determines and returns the price level range associated with the given price levels if the price level is
   * supported / valid, empty array otherwise
   *
   * @param priceLevel -> Integer price level amount from 1 - 4 dollar signs, 0 is not supported nor is any number outside of this range
   *
   * @returns -> The key of the price level range the given price level falls within, undefined if the passed
   * price level is not included in any of the valid ranges supported
   */
  static determinePriceLevelRangeFor(
    priceLevel: PriceLevels
  ): (0 | 1 | 2 | 3) | undefined {
    // Default value is undefined if no value is given |
    // 4.) 4 ($$$$) and below ($$$$), ($$$), ($$), ($) || Option 1 || Mean price level of 4
    // 3.) 3 ($$$) and below ($$$), ($$), ($) || Option 2 || Mean price level of 3
    // 2.) ($$) and below ($$), ($), || Option 3 || Mean price level of 2
    // 1.) ($) and below ($) | Option 4 || Mean price level of 1
    switch (priceLevel) {
      case 1:
        return 3;
      case 2:
        return 2;
      case 3:
        return 1;
      case 4:
        return 0;
    }

    return undefined;
  }
}
