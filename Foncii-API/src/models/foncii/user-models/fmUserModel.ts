// Dependencies
// Types
import { UserRoles } from "../../../types/common";

// Inheritance
import UserAccountModel from "../../shared/protocols/userAccountModel";

// Services
import UserReferralService from "../../../business-logic/services/shared/users/userReferralService";

/**
 * Stores the required and relevant information pertaining
 * to a Foncii Maps (FM) user.
 */
export default class FMUserModel
  extends UserAccountModel
  implements Objectable<FMUser>
{
  // Properties
  firstName;
  lastName;
  mapName;
  primaryTasteProfileID;
  isClaimed;

  constructor({
    id,
    authProviders,
    profilePictureURL,
    firstName,
    lastName,
    referralCode = UserReferralService.generatePersonalizedReferralCode({
      firstName,
      lastName,
    }),
    username,
    phoneNumber,
    email,
    mapName,
    role,
    primaryTasteProfileID,
    isClaimed,
    creationDate,
    lastUpdated,
    lastLogin,
    lastSignOut,
  }: Partial<FMUser> & {
    firstName: string;
    lastName: string;
    username: string;
    role: UserRoles;
    email: string;
  }) {
    super({
      id,
      authProviders,
      referralCode,
      profilePictureURL,
      username,
      phoneNumber,
      email,
      role,
      creationDate,
      lastUpdated,
      lastLogin,
      lastSignOut,
    });

    // Foncii Maps User Properties
    this.mapName = mapName ?? this.username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.primaryTasteProfileID = primaryTasteProfileID;
    this.isClaimed = isClaimed ?? true;
  }

  /**
   * @param object -> An object representing a Foncii Maps user model's expected data shape
   *
   * @returns -> An instantiated Foncii Maps user model object if the object's fields satisfy
   * the requirements to instantiate a Foncii Maps user model object, undefined otherwise.
   */
  static fromObject(object: FMUser): FMUserModel | undefined {
    if (object == undefined) return undefined;

    return new FMUserModel(object);
  }

  /**
   * @returns -> A JSON formatted object with all of the Foncii Maps user data model
   * object's key value pairs formatted as a plain JS Object.
   */
  toObject<FMUser>(): FMUser {
    return JSON.parse(JSON.stringify(this));
  }
}
