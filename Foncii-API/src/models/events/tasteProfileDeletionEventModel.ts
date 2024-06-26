// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class TasteProfileDeletionEventModel
  extends FonciiEventModel
  implements TasteProfileDeletionEvent, Objectable<TasteProfileDeletionEvent>
{
  // Properties
  tasteProfileData: TasteProfile;

  constructor({
    id,
    userID,
    timestamp,
    tasteProfileData,
    sessionID,
  }: Partial<TasteProfileDeletionEvent> & {
    tasteProfileData: TasteProfile;
  }) {
    super({
      id,
      userID,
      timestamp,
      eventType: FonciiEvents.TASTE_PROFILE_DELETION,
      sessionID,
    });

    this.tasteProfileData = tasteProfileData;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<TasteProfileDeletionEvent>(): TasteProfileDeletionEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
