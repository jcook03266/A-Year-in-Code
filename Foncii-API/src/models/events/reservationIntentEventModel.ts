// Dependencies
// Types
import {
  FonciiEvents,
  ReservationIntentOutcome,
  ReservationProviders,
} from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class ReservationIntentEventModel
  extends FonciiEventModel
  implements ReservationIntentEvent, Objectable<ReservationIntentEvent>
{
  // Properties
  outcome: ReservationIntentOutcome;
  venueID: string;
  authorUID?: string;
  postID?: string;
  fonciiRestaurantID: string;
  percentMatchScore?: number;
  qualityScore: number;
  timeSlot: string;
  reservationDate: string;
  provider: ReservationProviders;
  externalURL: string;

  constructor({
    id,
    userID,
    timestamp,
    outcome,
    venueID,
    authorUID,
    postID,
    fonciiRestaurantID,
    percentMatchScore,
    qualityScore,
    timeSlot,
    reservationDate,
    provider,
    externalURL,
    sessionID,
  }: Partial<ReservationIntentEvent> & {
    outcome: ReservationIntentOutcome;
    venueID: string;
    fonciiRestaurantID: string;
    qualityScore: number;
    timeSlot: string;
    reservationDate: string;
    provider: ReservationProviders;
    externalURL: string;
  }) {
    const eventType = FonciiEvents.RESERVATION_INTENT;

    super({ id, userID, timestamp, eventType, sessionID });

    this.outcome = outcome;
    this.venueID = venueID;
    this.authorUID = authorUID;
    this.postID = postID;
    this.fonciiRestaurantID = fonciiRestaurantID;
    this.percentMatchScore = percentMatchScore;
    this.qualityScore = qualityScore;
    this.timeSlot = timeSlot;
    this.reservationDate = reservationDate;
    this.provider = provider;
    this.externalURL = externalURL;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<ReservationIntentEvent>(): ReservationIntentEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
