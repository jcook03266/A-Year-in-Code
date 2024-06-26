// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class ArticlePublicationClickEventModel
  extends FonciiEventModel
  implements
    ArticlePublicationClickEvent,
    Objectable<ArticlePublicationClickEvent>
{
  // Properties
  fonciiRestaurantID: string;
  postID?: string;
  authorUID?: string;
  percentMatchScore?: number;
  qualityScore: number;
  sourceURL: string;
  destinationURL: string;
  publication: string;

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
    publication,
    sessionID,
  }: Partial<ArticlePublicationClickEvent> & {
    fonciiRestaurantID: string;
    qualityScore: number;
    sourceURL: string;
    destinationURL: string;
    publication: string;
  }) {
    const eventType = FonciiEvents.ARTICLE_PUBLICATION_CLICK;

    super({ id, userID, timestamp, eventType, sessionID });

    this.fonciiRestaurantID = fonciiRestaurantID;
    this.postID = postID;
    this.authorUID = authorUID;
    this.percentMatchScore = percentMatchScore;
    this.qualityScore = qualityScore;
    this.sourceURL = sourceURL;
    this.destinationURL = destinationURL;
    this.publication = publication;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<ArticlePublicationClickEvent>(): ArticlePublicationClickEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
