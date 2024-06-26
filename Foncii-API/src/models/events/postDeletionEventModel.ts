// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class PostDeletionEventModel
  extends FonciiEventModel
  implements PostDeletionEvent, Objectable<PostDeletionEvent>
{
  // Properties
  userPostData: FMUserPost;

  constructor({
    id,
    userID,
    timestamp,
    userPostData,
    sessionID,
  }: Partial<PostDeletionEvent> & { userPostData: FMUserPost }) {
    super({
      id,
      userID,
      timestamp,
      eventType: FonciiEvents.POST_DELETION,
      sessionID,
    });

    this.userPostData = userPostData;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<PostDeletionEvent>(): PostDeletionEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
