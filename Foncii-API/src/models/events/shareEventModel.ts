// Dependencies
// Types
import {
  FonciiEvents,
  ShareEventType,
  ShareSheetDestination,
} from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class ShareEventModel
  extends FonciiEventModel
  implements ShareEvent, Objectable<ShareEvent>
{
  // Properties
  shareEventID: string;
  shareEventType: ShareEventType;
  destination: ShareSheetDestination;
  sourceURL: string;

  constructor({
    id,
    userID,
    timestamp,
    shareEventID,
    shareEventType,
    destination,
    sourceURL,
    sessionID,
  }: Partial<ShareEvent> & {
    shareEventID: string;
    shareEventType: ShareEventType;
    destination: ShareSheetDestination;
    sourceURL: string;
  }) {
    super({ id, userID, timestamp, eventType: FonciiEvents.SHARE, sessionID });

    this.shareEventID = shareEventID;
    this.shareEventType = shareEventType;
    this.destination = destination;
    this.sourceURL = sourceURL;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<ShareEvent>(): ShareEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
