// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class ReservationSearchEventModel
  extends FonciiEventModel
  implements ReservationSearchEvent, Objectable<ReservationSearchEvent>
{
  // Properties
  fonciiRestaurantID: string;
  authorUID?: string;
  clientLocation?: CoordinatePoint;
  partySize: number;
  reservationDate: string;
  sourceURL: string;

  constructor({
    id,
    timestamp,
    userID,
    fonciiRestaurantID,
    authorUID,
    clientLocation,
    partySize,
    reservationDate,
    sourceURL,
    sessionID,
  }: Partial<ReservationSearchEvent> & {
    fonciiRestaurantID: string;
    partySize: number;
    reservationDate: string;
    sourceURL: string;
  }) {
    const eventType = FonciiEvents.RESERVATION_SEARCH;

    super({ id, userID, timestamp, eventType, sessionID });

    this.fonciiRestaurantID = fonciiRestaurantID;
    this.authorUID = authorUID;
    this.clientLocation = clientLocation;
    this.partySize = partySize;
    this.reservationDate = reservationDate;
    this.sourceURL = sourceURL;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<ReservationSearchEvent>(): ReservationSearchEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
