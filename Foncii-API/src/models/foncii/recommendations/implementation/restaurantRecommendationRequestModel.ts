// Dependencies
// Protocols
import Recommendation from "../protocol/recommendation";

/**
 * Documents and stores data specific to restaurant recommendation requests
 * users can send to other users to get recommendations for different restaurants across the country
 */
export default class RestaurantRecommendationRequestModel extends Recommendation {
  // Properties
  requesterID;
  requesteeID;

  constructor({
    id,
    message,
    destinationCoordinates,
    requesterID,
    requesteeID,
    creationDate,
    accepted,
    acceptationDate,
  }: RestaurantRecommendationRequest) {
    super({
      id,
      message,
      destinationCoordinates,
      creationDate,
      accepted,
      acceptationDate,
    });

    this.requesterID = requesterID;
    this.requesteeID = requesteeID;
  }

  toObject() {
    return JSON.parse(JSON.stringify(this));
  }

  static fromObject(
    object: RestaurantRecommendationRequest
  ): RestaurantRecommendationRequestModel | undefined {
    if (object == undefined) return undefined;

    return new RestaurantRecommendationRequestModel(object);
  }
}
