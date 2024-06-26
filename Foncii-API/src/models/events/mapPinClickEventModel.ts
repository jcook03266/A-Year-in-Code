// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class MapPinClickEventModel
  extends FonciiEventModel
  implements MapPinClickEvent, Objectable<MapPinClickEvent>
{
  // Properties
  fonciiRestaurantID: string;
  postID?: string;
  authorUID?: string;
  percentMatchScore?: number;
  qualityScore: number;
  sourceURL: string;
  autoCompleteQuery?: string;

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
    sessionID
  }: Partial<MapPinClickEvent> & {
    fonciiRestaurantID: string;
    qualityScore: number;
    sourceURL: string;
  }) {
    const eventType = FonciiEvents.MAP_PIN_CLICK;

    super({ id, userID, timestamp, eventType, sessionID });

    this.fonciiRestaurantID = fonciiRestaurantID;
    this.postID = postID;
    this.authorUID = authorUID;
    this.percentMatchScore = percentMatchScore;
    this.qualityScore = qualityScore;
    this.sourceURL = sourceURL;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<MapPinClickEvent>(): MapPinClickEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
