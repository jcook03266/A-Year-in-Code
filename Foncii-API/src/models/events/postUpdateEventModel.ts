// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class PostUpdateEventModel
  extends FonciiEventModel
  implements PostUpdateEvent, Objectable<PostUpdateEvent>
{
  constructor({ id, userID, timestamp, sessionID }: Partial<PostUpdateEvent>) {
    super({
      id,
      userID,
      timestamp,
      eventType: FonciiEvents.POST_UPDATE,
      sessionID,
    });
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<PostUpdateEvent>(): PostUpdateEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
