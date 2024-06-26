// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class PostClickEventModel
  extends FonciiEventModel
  implements PostClickEvent, Objectable<PostClickEvent>
{
  // Properties
  postID: string;
  authorUID: string;
  fonciiRestaurantID: string;
  percentMatchScore?: number;
  qualityScore: number;
  sourcePostID?: string;
  sourceFonciiRestaurantID?: string;
  sourceURL?: string;
  autoCompleteQuery?: string;

  constructor({
    id,
    timestamp,
    userID,
    postID,
    authorUID,
    fonciiRestaurantID,
    percentMatchScore,
    qualityScore,
    sourcePostID,
    sourceFonciiRestaurantID,
    sourceURL,
    autoCompleteQuery,
    sessionID,
  }: Partial<PostClickEvent> & {
    postID: string;
    authorUID: string;
    fonciiRestaurantID: string;
    qualityScore: number;
  }) {
    const eventType = FonciiEvents.POST_CLICK;

    super({ id, userID, timestamp, eventType, sessionID });

    this.postID = postID;
    this.authorUID = authorUID;
    this.fonciiRestaurantID = fonciiRestaurantID;
    this.percentMatchScore = percentMatchScore;
    this.qualityScore = qualityScore;
    this.sourcePostID = sourcePostID;
    this.sourceFonciiRestaurantID = sourceFonciiRestaurantID;
    this.sourceURL = sourceURL;
    this.autoCompleteQuery = autoCompleteQuery;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<PostClickEvent>(): PostClickEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
