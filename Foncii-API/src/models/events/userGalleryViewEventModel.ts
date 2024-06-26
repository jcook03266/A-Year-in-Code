// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class UserGalleryViewEventModel
  extends FonciiEventModel
  implements UserGalleryViewEvent, Objectable<UserGalleryViewEvent>
{
  // Properties
  authorUID: string;
  userSimilarityScore?: number;
  shareEventID?: string;
  referrer?: string;

  constructor({
    id,
    timestamp,
    userID,
    authorUID,
    userSimilarityScore,
    shareEventID,
    referrer,
    sessionID,
  }: Partial<UserGalleryViewEvent> & { authorUID: string }) {
    const eventType = FonciiEvents.USER_GALLERY_VIEW;

    super({ id, userID, timestamp, eventType, sessionID });

    this.authorUID = authorUID;
    this.userSimilarityScore = userSimilarityScore;
    this.shareEventID = shareEventID;
    this.referrer = referrer;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<UserGalleryViewEvent>(): UserGalleryViewEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
