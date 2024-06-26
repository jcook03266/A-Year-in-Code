// Dependencies
// Protocols
import Recommendation from "../protocol/recommendation";

/**
 * Documents and stores data specific to restaurant recommendations, including the ID of a potential
 * recommendation request if linked to one.
 */
export default class RestaurantRecommendationModel extends Recommendation {
  // Properties
  restaurantIDs;
  recommenderID;
  recommendeeID;
  recommendationRequestID;

  constructor({
    id,
    message,
    destinationCoordinates,
    restaurantIDs,
    recommenderID,
    recommendeeID,
    creationDate,
    accepted,
    recommendationRequestID,
    acceptationDate,
  }: RestaurantRecommendation) {
    super({
      id,
      message,
      destinationCoordinates,
      creationDate,
      accepted,
      acceptationDate,
    });

    this.restaurantIDs = [...new Set(restaurantIDs)];
    this.recommenderID = recommenderID;
    this.recommendeeID = recommendeeID;
    // Nullable, only present when following up an active recommendation request
    this.recommendationRequestID = recommendationRequestID;
  }

  toObject() {
    return JSON.parse(JSON.stringify(this));
  }

  static fromObject(
    object: RestaurantRecommendation
  ): RestaurantRecommendationModel | undefined {
    if (object == undefined) return undefined;

    return new RestaurantRecommendationModel(object);
  }
}
