// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class TasteProfileUpdateEventModel
  extends FonciiEventModel
  implements TasteProfileUpdateEvent, Objectable<TasteProfileUpdateEvent>
{
  // Properties
  tasteProfileData: TasteProfile;

  constructor({
    id,
    userID,
    timestamp,
    tasteProfileData,
    sessionID,
  }: Partial<TasteProfileUpdateEvent> & { tasteProfileData: TasteProfile }) {
    super({
      id,
      userID,
      timestamp,
      eventType: FonciiEvents.TASTE_PROFILE_UPDATE,
      sessionID,
    });

    this.tasteProfileData = tasteProfileData;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<TasteProfileUpdateEvent>(): TasteProfileUpdateEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
