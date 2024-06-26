// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class RestaurantViewEventModel
  extends FonciiEventModel
  implements RestaurantViewEvent, Objectable<RestaurantViewEvent>
{
  // Properties
  fonciiRestaurantID: string;
  percentMatchScore?: number;
  qualityScore: number;
  shareEventID?: string;
  referrer?: string;

  constructor({
    id,
    timestamp,
    userID,
    fonciiRestaurantID,
    percentMatchScore,
    qualityScore,
    shareEventID,
    referrer,
    sessionID,
  }: Partial<RestaurantViewEvent> & {
    fonciiRestaurantID: string;
    qualityScore: number;
  }) {
    const eventType = FonciiEvents.RESTAURANT_VIEW;

    super({ id, userID, timestamp, eventType, sessionID });

    this.fonciiRestaurantID = fonciiRestaurantID;
    this.percentMatchScore = percentMatchScore;
    this.qualityScore = qualityScore;
    this.shareEventID = shareEventID;
    this.referrer = referrer;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<RestaurantViewEvent>(): RestaurantViewEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
