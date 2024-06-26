// Dependencies
// Inheritance
import UpdatableModel from "./protocols/updatableModel";

// Services
import { DatabaseServiceAdapter } from "../../business-logic/services/database/databaseService";

/**
 * Restaurant Reservation Integration record that keeps track of the supported reservation providers
 * available for the restaurant associated with the record ~ (Resy)
 */
export default class ReservationIntegrationModel
  extends UpdatableModel
  implements
    RestaurantReservationIntegration,
    Objectable<RestaurantReservationIntegration>
{
  // Properties
  id: string;
  fonciiRestaurantID: string;
  reservationConnections: ReservationConnection[];

  constructor({
    id,
    fonciiRestaurantID,
    reservationConnections,
    creationDate,
    lastUpdated,
  }: Partial<RestaurantReservationIntegration> & {
    fonciiRestaurantID: string;
    reservationConnections: ReservationConnection[];
  }) {
    super({ creationDate, lastUpdated });

    this.id = id ?? DatabaseServiceAdapter.generateUUIDHexString();
    this.fonciiRestaurantID = fonciiRestaurantID;
    this.reservationConnections = reservationConnections;
  }

  /**
   * @returns An object converted from JSON format representing this model's data
   * as well as the data of any class that extends this class via inheritance.
   */
  toObject() {
    return JSON.parse(JSON.stringify(this));
  }
}
