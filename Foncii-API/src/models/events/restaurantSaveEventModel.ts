// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class RestaurantSaveEventModel
  extends FonciiEventModel
  implements RestaurantSaveEvent, Objectable<RestaurantSaveEvent>
{
  // Properties
  saved: boolean;
  fonciiRestaurantID: string;
  postID?: string;

  constructor({
    id,
    userID,
    timestamp,
    saved,
    fonciiRestaurantID,
    postID,
    sessionID,
  }: Partial<RestaurantSaveEvent> & {
    saved: boolean;
    fonciiRestaurantID: string;
  }) {
    const eventType = saved
      ? FonciiEvents.SAVED_RESTAURANT
      : FonciiEvents.UNSAVED_RESTAURANT;

    super({ id, userID, timestamp, eventType, sessionID });

    this.saved = saved;
    this.fonciiRestaurantID = fonciiRestaurantID;
    this.postID = postID;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<RestaurantSaveEvent>(): RestaurantSaveEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
