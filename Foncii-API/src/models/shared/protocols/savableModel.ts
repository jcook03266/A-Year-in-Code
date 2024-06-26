// Dependencies
// Inheritance
import IdentifiableModel from "./identifiableModel";

// Utilities
import { currentDateAsISOString } from "../../../foncii-toolkit/utilities/convenienceUtilities";

/**
 * Interface implementation for the Savable interface
 * extensible by other implementation related classes to
 * simplify the instantiation of these reusable fields.
 */
export default class SavableModel extends IdentifiableModel implements Savable {
  // Properties
  userID: string;
  creationDate: string;

  constructor({
    id,
    userID,
    creationDate,
  }: Partial<Savable> & { userID: string }) {
    super({ id });

    this.userID = userID;
    this.creationDate = creationDate ?? currentDateAsISOString();
  }
}
