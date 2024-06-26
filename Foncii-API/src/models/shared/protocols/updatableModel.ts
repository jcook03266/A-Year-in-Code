// Dependencies
// Utilities
import { currentDateAsISOString } from "../../../foncii-toolkit/utilities/convenienceUtilities";

/**
 * Interface implementation for the Updatable interface
 * extensible by other implementation related classes to
 * simplify the instantiation of these reusable fields.
 */
export default class UpdatableModel implements Updatable {
  // Properties
  creationDate: string;
  lastUpdated: string;

  constructor({ creationDate, lastUpdated }: Partial<Updatable>) {
    this.creationDate = creationDate ?? currentDateAsISOString();
    this.lastUpdated = lastUpdated ?? currentDateAsISOString();
  }
}
