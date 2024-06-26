// Dependencies
// Inheritance
import IdentifiableModel from "./protocols/identifiableModel";

// Utilities
import { currentDateAsISOString } from "../../foncii-toolkit/utilities/convenienceUtilities";

/**
 * User Referral record shared across all user accounts
 */
export default class UserReferralModel
  extends IdentifiableModel
  implements UserReferral, Objectable<UserReferral>
{
  // Properties
  referrerCode: string;
  refereeCode: string;
  creationDate: string;

  constructor({
    id,
    referrerCode,
    refereeCode,
    creationDate,
  }: Partial<UserReferral> & { referrerCode: string; refereeCode: string }) {
    super({ id });

    this.referrerCode = referrerCode;
    this.refereeCode = refereeCode;
    this.creationDate = creationDate ?? currentDateAsISOString();
  }

  /**
   * @returns An object converted from JSON format representing the user account model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject() {
    return JSON.parse(JSON.stringify(this));
  }
}
