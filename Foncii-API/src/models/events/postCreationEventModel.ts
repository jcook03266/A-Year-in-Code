// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class PostCreationEventModel
  extends FonciiEventModel
  implements PostCreationEvent, Objectable<PostCreationEvent>
{
  constructor({
    id,
    userID,
    timestamp,
    sessionID,
  }: Partial<PostCreationEvent>) {
    super({
      id,
      userID,
      timestamp,
      eventType: FonciiEvents.POST_CREATION,
      sessionID,
    });
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<PostCreationEvent>(): PostCreationEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
