// Dependencies
// Data Models
import TasteProfileModel from "../../../models/shared/tasteProfileModel";
import FMUserPostModel from "../../../models/foncii/post-models/fmUserPostModel";
import RestaurantModel from "../../../models/shared/restaurantModel";

// Managers
import CuisineManager from "../../managers/static-resources/cuisine-manager/cuisineManager";

// Services
import SentimentAnalysisMicroservice, {
  CachedRestaurantComputationsService,
} from "../../../core-foncii/microservices/sentimentAnalysisMicroservice";
import FonciiMapsPostService from "../foncii-maps/user-posts/fmPostService";

// Utilities
import { clampNumber } from "../../../foncii-toolkit/math/commonMath";
import { computeSimilarityScoreBetweenEmbeddings } from "../../../foncii-toolkit/math/machineLearningMath";

// Types
interface PercentMatchParameter {
  id: number;
  weight: number;
  modifier: number; // A static multiplier applied when the parameter isn't fulfilled, default is 0 making the final score 0, this is used when the parameter's value is in a fixed range (i.e the questionnaire answers)
  secondaryModifier?: number; // Some secondary modifier applied when a parameter is partially fulfilled by some separate condition
  score?: number;
}

export default class PercentMatchService {
  // Services
  cachedRestaurantComputationsService =
    new CachedRestaurantComputationsService();
  fmPostService = new FonciiMapsPostService();

  // Properties
  // Percent Match Score Components
  private userMatchScore = () => {
    return (
      this.userMatchScoreParameters().reduce((accumulator, parameter) => {
        return accumulator + (parameter.score ?? 0);
      }, 0) *
      ((this.userPersonalRatingParameter.score ?? 0) /
        this.userPersonalRatingParameter.weight)
    );
  };
  private restaurantQualityScore = () => {
    return this.restaurantQualityScoreParameters().reduce(
      (accumulator, parameter) => {
        return accumulator + (parameter.score ?? 0);
      },
      0
    );
  };

  private percentMatchScore = () => {
    return (
      clampNumber(this.userMatchScore(), 0, this.userMatchScoreLimit) *
      this.percentageDistribution.userMatchScoreRatio +
      clampNumber(
        this.restaurantQualityScore(),
        0,
        this.restaurantQualityScoreLimit
      ) *
      this.percentageDistribution.restaurantQualityScoreRatio
    );
  };

  // Parameters
  /// User Match Score
  // Swings from 15 to 7.5 to 15 depending on the restaurant
  private adventureLevelParameter: PercentMatchParameter = {
    id: 0,
    weight: 20,
    modifier: 0,
    secondaryModifier: 0.5,
  };

  private travelDistanceParameter: PercentMatchParameter = {
    id: 1,
    weight: 25,
    modifier: 0.5,
  };

  private priceRangeParameter: PercentMatchParameter = {
    id: 2,
    weight: 30,
    modifier: 0,
  };

  // Symbolic
  // TODO: - Implement with similar cuisine mappings later to boost cuisine score with cuisines similar to user spice and adventure. Not weighted, used as an exploratory parameter to allow the percent match algo to use a set of cuisines
  // with similar spice level to what the user prefers to then compute the cuisine score (depending on the user's adventure level)
  spiceLevelParameter: PercentMatchParameter = {
    id: 3,
    weight: 0,
    modifier: 0,
  };

  // N/A
  private diningPurposeParameter: PercentMatchParameter = {
    id: 4,
    weight: 0, // Not used for now, until we gather more information
    modifier: 0,
  };

  // N/A
  private ambianceParameter: PercentMatchParameter = {
    id: 5,
    weight: 0, // Not used for now, until we gather more information
    modifier: 0,
  };

  private alcoholPreferenceParameter: PercentMatchParameter = {
    id: 6,
    weight: 5, // Was 10, 5 given to boost cuisine parameter
    modifier: 0,
  };

  private cuisineParameter: PercentMatchParameter = {
    id: 7,
    weight: 40,
    modifier: 0,
  };

  // N/A
  private dietaryPreferenceParameter: PercentMatchParameter = {
    id: 8,
    weight: 0, // Not used for now, until we gather more information
    modifier: 0,
  };

  // N/A
  // Not used for now, until we enable user recommendations
  private userRecommendationParameter: PercentMatchParameter = {
    id: 9,
    weight: 50,
    modifier: 0,
  };

  private userPersonalRatingParameter: PercentMatchParameter = {
    id: 10,
    weight: 100,
    modifier: 0,
  };

  /// Restaurant Quality Score
  // Yelp + Google to mitigate the absence of one or the other
  private averageExternalRatingParameter: PercentMatchParameter = {
    id: 0,
    weight: 50,
    modifier: 0,
  };

  // ~
  private averageExternalReviewSentimentScoreParameter: PercentMatchParameter =
    {
      id: 1,
      weight: 50,
      modifier: 0,
    };

  // N/A
  private articlePublicationsParameter: PercentMatchParameter = {
    id: 2,
    weight: 0, // Not used for now
    modifier: 0,
  };

  /** The average Foncii Maps Post user rating determines the value of this parameter | Very rudimentary for now, but can become higher dimensional later on */
  /** Note: This parameter will be used as a supplementary boost for now due to the lack of Foncii platform reviews, this isn't a reliable metric to measure all restaurants across until more data comes in*/
  private socialMediaParameter: PercentMatchParameter = {
    id: 3,
    weight: 12.5,
    modifier: 0,
  };

  // N/A
  private businessLifespanParameter: PercentMatchParameter = {
    id: 4,
    weight: 0, // 12.5 | Not used for now until we can come up with a concise way to determine this reliably
    modifier: 0,
  };

  // Compiled Parameters
  userMatchScoreParameters = (): PercentMatchParameter[] => [
    this.adventureLevelParameter,
    this.travelDistanceParameter,
    this.priceRangeParameter,
    this.spiceLevelParameter,
    this.diningPurposeParameter,
    this.ambianceParameter,
    this.alcoholPreferenceParameter,
    this.cuisineParameter,
    this.dietaryPreferenceParameter,
    this.userRecommendationParameter,
  ];
  restaurantQualityScoreParameters = (): PercentMatchParameter[] => [
    this.averageExternalRatingParameter,
    this.averageExternalReviewSentimentScoreParameter,
    this.articlePublicationsParameter,
    this.socialMediaParameter,
    this.businessLifespanParameter,
  ];

  // Limits
  private userMatchScoreLimit = 100;
  private restaurantQualityScoreLimit = 100;

  // Percent Match Score Component Score Distribution
  percentageDistribution = {
    restaurantQualityScoreRatio: 0.5,
    userMatchScoreRatio: 0.5,
  };

  /**
   * Computes and returns the percent match score for the given user, location,
   * and restaurant establishment.
   *
   * @async
   * @param userLocation -> The user's current location or search location relative to the restaurant their percent match score is being calculated for
   * @param userTasteProfile
   * @param restaurant
   *
   * @returns -> The final percent match score between the user and the target restaurant
   */
  async computePercentMatchScore(args: {
    userLocation: CoordinatePoint;
    userTasteProfile: TasteProfileModel;
    restaurant: Restaurant;
  }) {
    await Promise.all([
      this.computeUserMatchScore(args),
      this.computeRestaurantQualityScore(args),
    ]);

    return this.percentMatchScore();
  }

  /**
   * Computes the quality score for the restaurant. This is suitable for
   * all restaurants, and should be used when the user does not yet have a taste profile.
   *
   * @async
   * @param restaurant
   *
   * @returns -> A score from 0 - 100 indicative of the restaurant's overall quality relative
   * to our tuned parameters and objective analysis.
   */
  async getRestaurantQualityScore(args: { restaurant: Restaurant }) {
    await this.computeRestaurantQualityScore(args);

    // Clamp number within required bounds, and don't multiply it by the percent match score's restaurant quality factor (0.5)
    return (
      clampNumber(
        this.restaurantQualityScore(),
        0,
        this.restaurantQualityScoreLimit
      ) * 1
    );
  }

  // Percent Match Score Components
  /**
   * Computes and sets the parameters pertaining to the user match percentage
   * match score for the given user, restaurant, and search location.
   *
   * @async
   * @param userLocation -> The user's current location or search location relative to the restaurant their percent match score is being calculated for
   * @param userTasteProfile
   * @param restaurant
   */
  private async computeUserMatchScore(args: {
    userLocation: CoordinatePoint;
    userTasteProfile: TasteProfileModel;
    restaurant: Restaurant;
  }) {
    const { userLocation, userTasteProfile, restaurant } = args,
      userID = userTasteProfile.userID,
      fonciiRestaurantID = restaurant.id;

    // Parsing
    const restaurantCuisines = restaurant.categories ?? [],
      restaurantServesAlcohol = restaurant.servesAlcohol,
      userSpicePreference = userTasteProfile.spicePreferenceLevel;

    // Computed
    const restaurantWasRecommendedToUser = false,
      // Default to 0 when null (not defined) to cancel out its weight
      userPersonalRating =
        await this.fmPostService.getUserAveragePersonalRatingFor({
          userID,
          fonciiRestaurantID,
        }) ?? 0;

    const priceRangeParamterFulfilled = userTasteProfile.preferredPriceRange
      ? userTasteProfile.isPriceLevelIncludedInCurrentRange(
        restaurant.priceLevel
      )
      : true,
      alcoholPreferenceParameterFulfilled = userTasteProfile.drinkPreference
        ? userTasteProfile.doesUserPreferAlcohol() && restaurantServesAlcohol
        : true,
      // Determine if one of the food categories from the restaurant matches one of the user's preferred cuisines
      cuisineParameterFulfilled = restaurantCuisines.some((cuisineType) => {
        // Find closest matching alias for the food category passed in this closure
        // Convert the numeric ID to a string to match the expected content found in the favorite cuisine IDs array which stores the IDs as strings
        // The cuisine manager stores these IDs as numbers to enable sorting by numeric IDs
        const closestMatchingCuisineID =
          CuisineManager.findClosestSupportedCuisineForAlias(cuisineType);

        return closestMatchingCuisineID
          ? userTasteProfile.preferredCuisines.includes(
            closestMatchingCuisineID
          )
          : false;
      }),
      travelDistanceParameterFulfilled =
        userTasteProfile.isRestaurantIncludedInCurrentTravelDistancePreference(
          userLocation,
          restaurant
        ),
      userRecommendationParameterFulfilled = restaurantWasRecommendedToUser,
      userPersonalRatingParameterFulfilled = userPersonalRating > 0;

    // Compute Scores for Parameters
    this.travelDistanceParameter.score =
      this.travelDistanceParameter.weight *
      (travelDistanceParameterFulfilled
        ? 1
        : this.travelDistanceParameter.modifier);
    this.priceRangeParameter.score =
      this.priceRangeParameter.weight *
      (priceRangeParamterFulfilled ? 1 : this.priceRangeParameter.modifier);
    this.diningPurposeParameter.score = 0; // N/A
    this.ambianceParameter.score = 0; // N/A
    this.alcoholPreferenceParameter.score =
      this.alcoholPreferenceParameter.weight *
      (alcoholPreferenceParameterFulfilled
        ? 1
        : this.alcoholPreferenceParameter.modifier);
    this.cuisineParameter.score =
      this.cuisineParameter.weight *
      (cuisineParameterFulfilled ? 1 : this.cuisineParameter.modifier);
    this.dietaryPreferenceParameter.score = 0; // N/A
    this.userRecommendationParameter.score =
      this.userRecommendationParameter.weight *
      (userRecommendationParameterFulfilled
        ? 1
        : this.userRecommendationParameter.modifier);

    // Default is 100% (1) if the user doesn't have a rating for this restaurant. If the user does have a rating the weight is multiple by the ratio of that rating relative and the max possible user rating
    this.userPersonalRatingParameter.score =
      this.userPersonalRatingParameter.weight *
      (userPersonalRatingParameterFulfilled
        ? userPersonalRating / FMUserPostModel.UserRatingRange.max
        : 1);

    // Compound Parameters
    // If the restaurant doesn't match the user's taste profile but they're adventurous (option 3 / answer index 2), or if the restaurant does and they're not adventurous (option 1 / answer index 0) then recommend, else don't
    // If the person is in the middle and the restaurant differs from their taste profile then apply a partial modifier to the parameter's score
    const adventureLevelParameterFulfilled =
      (cuisineParameterFulfilled &&
        travelDistanceParameterFulfilled &&
        userTasteProfile.adventureLevel == 0) ||
      ((!cuisineParameterFulfilled || !travelDistanceParameterFulfilled) &&
        userTasteProfile.adventureLevel == 2),
      adventureLevelParameterPartiallyFulfilled =
        (!cuisineParameterFulfilled || !travelDistanceParameterFulfilled) &&
        userTasteProfile.adventureLevel == 1,
      adventureLevelParameterModifier = adventureLevelParameterFulfilled
        ? 1
        : adventureLevelParameterPartiallyFulfilled
          ? this.adventureLevelParameter.secondaryModifier ?? 0
          : this.adventureLevelParameter.modifier;

    this.adventureLevelParameter.score =
      this.adventureLevelParameter.weight * adventureLevelParameterModifier;

    // Use similar cuisines to boost the cuisine score based on spice preference (if any)
    // Pull the similar cuisines mapping for the target spice level and compare them to the restaurant's similar cuisine mapping
    // 7.5 match 3 or more cuisines to get the full rating for cuisine parameter, 15 (adventurous) only 1 similar cuisine needed (Work in progress these are just ideas)
    if (
      this.adventureLevelParameter.score >= 7.5 &&
      userTasteProfile.spicePreferenceLevel
    ) {
      switch (userSpicePreference) {
        case 0:
          // Mild
          break;

        case 1:
          // Balanced
          break;

        case 2:
          // Spicy
          break;
      }
    }
  }

  /**
   * Computes and sets the parameters pertaining to the restaurant quality percentage
   * match score for the given restaurant.
   *
   * @async
   * @param restaurant
   */
  private async computeRestaurantQualityScore(args: {
    restaurant: Restaurant;
  }) {
    // Parsing
    const { restaurant } = args,
      restaurantID = restaurant.id,
      yelpRating = restaurant.yelpProperties?.rating,
      googleRating = restaurant.googleProperties?.rating;

    // Computed
    // Get restaurant review average sentiment analysis scores
    const [restaurantReviewSentimentComputation, fonciiMapsRating] =
      await Promise.all([
        this.cachedRestaurantComputationsService.fetchCachedReviewSentimentComputation(
          {
            restaurantID: restaurant.id,
            yelpID: restaurant.yelpID,
            googleID: restaurant.googleID,
          }
        ),
        this.fmPostService.computeAverageFonciiRatingForRestaurant(
          restaurantID
        ) // Computed from Foncii Maps Posts | 0 if no posts are available | not factored into the algo for now
      ]),
      yelpAverageReviewSentimentScore =
        restaurantReviewSentimentComputation?.yelpAvgReviewSentimentScore,
      googleAverageReviewSentimentScore =
        restaurantReviewSentimentComputation?.googleAvgReviewSentimentScore,
      articleAverageSentimentScore = 0; // Computed from the aggregated articles | 0 if no articles are available | not factored into the algo for now

    // Compute Scores for Parameters
    // Compute average external rating (Yelp + Google)
    const externalRatingParameters = [
      yelpRating, 
      googleRating
    ].filter(Boolean) as number[],
      averageExternalRating =
        externalRatingParameters.reduce((score, accumulator) => {
          return accumulator + score;
        }, 0) / Math.max(externalRatingParameters.length, 1);
    this.averageExternalRatingParameter.score =
      this.averageExternalRatingParameter.weight *
      (averageExternalRating / RestaurantModel.RatingNumericRange.max);

    // Compute average of the avergage external review sentiment analysis scores (Yelp + Google)
    const externalReviewSentimentScoreParameters = [
      yelpAverageReviewSentimentScore,
      googleAverageReviewSentimentScore,
    ].filter(Boolean) as number[],
      averageExternalReviewSentimentScore =
        externalReviewSentimentScoreParameters.reduce((score, accumulator) => {
          return accumulator + score;
        }, 0) / Math.max(externalReviewSentimentScoreParameters.length, 1);
    this.averageExternalReviewSentimentScoreParameter.score =
      this.averageExternalReviewSentimentScoreParameter.weight *
      (averageExternalReviewSentimentScore /
        SentimentAnalysisMicroservice.SentimentAnalysisScoreRange.max);

    this.articlePublicationsParameter.score =
      this.articlePublicationsParameter.weight *
      (articleAverageSentimentScore
        ? 1
        : this.articlePublicationsParameter.modifier);
    this.socialMediaParameter.score =
      this.socialMediaParameter.weight *
      ((fonciiMapsRating ?? 0) / FMUserPostModel.UserRatingRange.max);
    this.businessLifespanParameter.score = 0; // N/A
  }

  // Collaborative Filtering Methods
  /**
   * Computes and returns the similarity score between two restaurants based
   * on a broad range of parameters.
   *
   * @param restaurant1
   * @param restaurant2
   *
   * @returns -> The average similarity score between the two restaurants being compared (float from 0.00 -> 1.00 ~ 0% -> 100%)
   */
  static async computeSimilarityScoreBetweenRestaurants(
    restaurant1: RestaurantModel,
    restaurant2: RestaurantModel
  ): Promise<number> {
    const embeddings = await Promise.all([
      restaurant1.collective_embedding ?? restaurant1.generateEmbedding(),
      restaurant2.collective_embedding ?? restaurant2.generateEmbedding(),
    ]);

    return computeSimilarityScoreBetweenEmbeddings(
      embeddings[0],
      embeddings[1]
    );
  }

  /**
   * Computes and returns the average similarity between a group of restaurants
   *
   * @param restaurants An array of restaurants to all be compared with one another
   *
   * @returns -> The average similarity score between the restaurants being compared (float from 0.00 -> 1.00 ~ 0% -> 100%)
   */
  static async computeAverageSimilarityScoreBetweenRestaurants(
    restaurants: RestaurantModel[]
  ): Promise<number> {
    const embeddings = await Promise.all(
      restaurants.map(async (restaurant) => {
        return (
          restaurant.collective_embedding ?? restaurant.generateEmbedding()
        );
      })
    );

    let totalSimilarityScores = 0;
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        totalSimilarityScores += computeSimilarityScoreBetweenEmbeddings(
          embeddings[i],
          embeddings[j]
        );
      }
    }

    // Note: (restaurants.length * (restaurants.length - 1) / 2 is the amount of elements this aggregation grows by given some length `n`
    return (
      totalSimilarityScores /
      ((embeddings.length * (embeddings.length - 1)) / 2)
    );
  }

  /**
   * Computes the similarity score between two users based on their taste profiles. This can be used for collaborative filtering to
   * recommend users things that other similar users also enjoy.
   *
   * @param tasteProfile1
   * @param tasteProfile2
   *
   * @returns -> The similarity score between the two taste profiles being compared (float from 0.00 -> 1.00 ~ 0% -> 100%)
   */
  static computeSimilarityScoreBetweenUsers(
    tasteProfile1: TasteProfileModel,
    tasteProfile2: TasteProfileModel
  ) {
    // Compute the similarity score from the Euclidean distance between the two taste profiles
    const tasteProfile1Embedding =
      tasteProfile1.collective_embedding ?? tasteProfile1.generateEmbedding(),
      tasteProfile2Embedding =
        tasteProfile2.collective_embedding ?? tasteProfile2.generateEmbedding();

    return computeSimilarityScoreBetweenEmbeddings(
      tasteProfile1Embedding,
      tasteProfile2Embedding
    );
  }

  /**
   * Computes the average percent match score for a group of users based on their taste profiles.
   * This can be used for collaborative filtering to recommend groups of users dining together
   * restaurants that all closely match their taste profiles.
   *
   * @async
   * @param userLocation -> The reference location to use for the percent match score computation (requesting user's location)
   * @param tasteProfiles
   * @param restaurant
   *
   * @returns -> The average percent match score for the group of users.
   */
  async computeAveragePercentMatchScoreForUsers({
    userLocation,
    tasteProfiles,
    restaurant,
  }: {
    userLocation: CoordinatePoint;
    tasteProfiles: TasteProfileModel[];
    restaurant: Restaurant;
  }) {
    let totalPercentMatchScores = 0;

    await Promise.all(
      tasteProfiles.map(async (tasteProfile) => {
        totalPercentMatchScores += await this.computePercentMatchScore({
          userLocation,
          userTasteProfile: tasteProfile,
          restaurant,
        });
      })
    );

    return totalPercentMatchScores / tasteProfiles.length;
  }
}
