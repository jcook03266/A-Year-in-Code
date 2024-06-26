// Dependencies
// Inheritance
import UpdatableModel from "./updatableModel";

// Types
import { AuthProviders, UserRoles } from "../../../types/common";

// Services
import { DatabaseServiceAdapter } from "../../../business-logic/services/database/databaseService";
import UserReferralService from "../../../business-logic/services/shared/users/userReferralService";

// Utilities
import { currentDateAsISOString } from "../../../foncii-toolkit/utilities/convenienceUtilities";

/**
 * Modular data model shared between Foncii Maps users and Foncii users
 * that defines the basic and high level properties of a user account
 * used across Foncii platforms.
 */
export default class UserAccountModel
  extends UpdatableModel
  implements UserAccount, Objectable<UserAccount>
{
  // Properties
  id;
  authProviders;
  referralCode;
  profilePictureURL;
  username;
  phoneNumber;
  email;
  role;
  lastLogin; // -> The date and auth provider used when the user last logged in manually
  lastSignOut; // -> The date when the user last manually logged out

  constructor({
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
  }: Partial<UserAccount> & {
    email: string;
    role: UserRoles;
    profilePictureURL: string | undefined;
    authProviders: AuthProviders[] | undefined;
    username: string;
  }) {
    super({ creationDate, lastUpdated });

    // User Account Properties
    this.id = id ?? DatabaseServiceAdapter.generateUUIDHexString(); // A random UID is generated for testing purposes, for actual production cases a real authUser UID needs to be passed to this constructor
    this.authProviders = authProviders ?? [];
    this.referralCode =
      referralCode ?? UserReferralService.generateReferralCodeFor(this.id);
    this.profilePictureURL = profilePictureURL;
    this.username = username?.toLowerCase();
    this.phoneNumber = phoneNumber?.replaceAll(" ", ""); // Remove all whitespace (if any)
    this.email = email!.toLowerCase().trim();
    this.role = role ?? UserRoles.Basic; // Default is a basic user role if no role is assumed (for legacy accounts that were created before roles were a thing, roles are explicitly stated from here on out though)
    this.lastLogin =
      lastLogin ?? UserAccountModel.generateUserLogin(AuthProviders.Default); // Fallback by generating a default login using the first defined auth provider (required)
    this.lastSignOut = lastSignOut;
  }

  /**
   * Creates a new user login object with date and auth provider properties
   * to describe a new user login event.
   *
   * @param authProvider - Required, cannot be empty
   * @returns -> A User Login object
   */
  static generateUserLogin(authProvider: AuthProviders): UserLogin {
    return {
      authProvider: authProvider,
      loginDate: currentDateAsISOString(),
    } as UserLogin;
  }

  /**
   * @returns An object converted from JSON format representing the user account model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<UserAccount>(): UserAccount {
    return JSON.parse(JSON.stringify(this));
  }
}
