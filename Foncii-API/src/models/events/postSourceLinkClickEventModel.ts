// Dependencies
// Types
import { FMIntegrationProviders, FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class PostSourceLinkClickEventModel
  extends FonciiEventModel
  implements PostSourceLinkClickEvent, Objectable<PostSourceLinkClickEvent>
{
  // Properties
  fonciiRestaurantID: string;
  postID: string;
  authorUID: string;
  percentMatchScore?: number;
  qualityScore: number;
  sourceURL: string;
  destinationURL: string;
  destinationPlatform: FMIntegrationProviders;

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
    destinationPlatform,
    sessionID,
  }: Partial<PostSourceLinkClickEvent> & {
    fonciiRestaurantID: string;
    postID: string;
    authorUID: string;
    qualityScore: number;
    sourceURL: string;
    destinationURL: string;
    destinationPlatform: FMIntegrationProviders;
  }) {
    const eventType = FonciiEvents.POST_SOURCE_LINK_CLICK;

    super({ id, userID, timestamp, eventType, sessionID });

    this.fonciiRestaurantID = fonciiRestaurantID;
    this.postID = postID;
    this.authorUID = authorUID;
    this.percentMatchScore = percentMatchScore;
    this.qualityScore = qualityScore;
    this.sourceURL = sourceURL;
    this.destinationURL = destinationURL;
    this.destinationPlatform = destinationPlatform;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<PostSourceLinkClickEvent>(): PostSourceLinkClickEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
