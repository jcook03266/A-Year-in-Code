// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class RestaurantClickEventModel
  extends FonciiEventModel
  implements RestaurantClickEvent, Objectable<RestaurantClickEvent>
{
  // Properties
  fonciiRestaurantID: string;
  percentMatchScore?: number;
  qualityScore: number;
  sourcePostID?: string;
  sourceFonciiRestaurantID?: string;
  sourceURL?: string;
  autoCompleteQuery?: string;
  queryID?: string;

  constructor({
    id,
    timestamp,
    userID,
    fonciiRestaurantID,
    percentMatchScore,
    qualityScore,
    sourcePostID,
    sourceFonciiRestaurantID,
    sourceURL,
    autoCompleteQuery,
    queryID,
    sessionID,
  }: Partial<RestaurantClickEvent> & {
    fonciiRestaurantID: string;
    qualityScore: number;
  }) {
    const eventType = FonciiEvents.RESTAURANT_CLICK;

    super({ id, userID, timestamp, eventType, sessionID });

    this.fonciiRestaurantID = fonciiRestaurantID;
    this.percentMatchScore = percentMatchScore;
    this.qualityScore = qualityScore;
    this.sourcePostID = sourcePostID;
    this.sourceFonciiRestaurantID = sourceFonciiRestaurantID;
    this.sourceURL = sourceURL;
    this.autoCompleteQuery = autoCompleteQuery;
    this.queryID = queryID;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<RestaurantClickEvent>(): RestaurantClickEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
