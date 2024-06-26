// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class PostViewEventModel
  extends FonciiEventModel
  implements PostViewEvent, Objectable<PostViewEvent>
{
  // Properties
  postID: string;
  authorUID: string;
  fonciiRestaurantID: string;
  percentMatchScore?: number;
  qualityScore: number;
  shareEventID?: string;
  referrer?: string;

  constructor({
    id,
    timestamp,
    userID,
    postID,
    authorUID,
    fonciiRestaurantID,
    percentMatchScore,
    qualityScore,
    shareEventID,
    referrer,
    sessionID,
  }: Partial<PostViewEvent> & {
    postID: string;
    authorUID: string;
    fonciiRestaurantID: string;
    qualityScore: number;
  }) {
    const eventType = FonciiEvents.POST_VIEW;

    super({ id, userID, timestamp, eventType, sessionID });

    this.postID = postID;
    this.authorUID = authorUID;
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
  toObject<PostViewEvent>(): PostViewEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
