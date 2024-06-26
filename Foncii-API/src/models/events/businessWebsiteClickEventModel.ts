// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class BusinessWebiteClickEventModel
  extends FonciiEventModel
  implements BusinessWebsiteClickEvent, Objectable<BusinessWebsiteClickEvent>
{
  // Properties
  fonciiRestaurantID: string;
  postID?: string;
  authorUID?: string;
  percentMatchScore?: number;
  qualityScore: number;
  sourceURL: string;
  destinationURL: string;

  constructor({
    id,
    timestamp,
    userID,
    fonciiRestaurantID,
    postID,
    authorUID,
    percentMatchScore,
    qualityScore,
    sourceURL,
    destinationURL,
    sessionID,
  }: Partial<BusinessWebsiteClickEvent> & {
    fonciiRestaurantID: string;
    qualityScore: number;
    sourceURL: string;
    destinationURL: string;
  }) {
    const eventType = FonciiEvents.BUSINESS_WEBSITE_CLICK;

    super({ id, userID, timestamp, eventType, sessionID });

    this.fonciiRestaurantID = fonciiRestaurantID;
    this.postID = postID;
    this.authorUID = authorUID;
    this.percentMatchScore = percentMatchScore;
    this.qualityScore = qualityScore;
    this.sourceURL = sourceURL;
    this.destinationURL = destinationURL;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<BusinessWebsiteClickEvent>(): BusinessWebsiteClickEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
