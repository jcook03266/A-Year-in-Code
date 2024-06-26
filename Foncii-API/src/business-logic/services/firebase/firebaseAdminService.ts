// Dependencies
// Types
import { SupportedFonciiPlatforms } from "../../../types/namespaces/microservice-api";

// Firebase-Admin SDK
import { getApps } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { initializeApp } from "firebase-admin/app";
import { credential } from "firebase-admin";

// Logging
import logger from "../../../foncii-toolkit/debugging/debugLogger";

/**
 * Service layer for interfacing with firebase services such as Cloud Storage, Auth, and the AdminSDK in an authenticated environment
 * See documentation here: https://firebase.google.com/docs/admin/setup
 * Ex.) You can create Firebase user accounts with custom IDs from here if desired.
 *
 * Note: Firebase-Admin is for server use only, this SDK is not allowed on clients for obvious reasons, due to the high privileges
 * granted. It's always best to assume the client is not secure.
 */
export class FirebaseAdminService {
  // Instance Variables
  // Default Auth reference
  auth!: Auth;

  // Properties
  // Select the required project credentials and settings to use with the AdminSDK
  private ProjectIDs = {
    fonciiMaps: "foncii-maps",
    fonciiApp: "foncii-app",
  };

  private ServiceAccounts = {
    fonciiMaps: JSON.parse(process.env.FONCII_MAPS_ADMIN_SDK_CERT_SECRET),
    fonciiApp: JSON.parse(process.env.FONCII_APP_ADMIN_SDK_CERT_SECRET),
  };

  private projectID;
  private serviceAccount;

  constructor(platform: SupportedFonciiPlatforms) {
    // Assign the appropriate project ID given the target supported Foncii platform.
    switch (platform) {
      case SupportedFonciiPlatforms.foncii:
        this.projectID = this.ProjectIDs.fonciiMaps;
        this.serviceAccount = this.ServiceAccounts.fonciiMaps;
      case SupportedFonciiPlatforms.fonciiBiz:
      // Not supported
    }

    this.setup();
  }

  /**
   * Create firebase app and specify auth certs and properties
   */
  private setup() {
    // Singleton, ensure the app isn't already initalized by checking if the object is empty or not
    if (!getApps().length) {
      initializeApp({
        credential: credential.cert(this.serviceAccount),
        projectId: this.projectID,
      });
    }

    this.auth = getAuth();
  }

  // Auth
  async isTokenValid(token: string) {
    return (await this.decodeToken(token)) != undefined;
  }

  async decodeToken(token: string) {
    const checkIfRevoked = true;

    try {
      return await this.auth.verifyIdToken(token, checkIfRevoked);
    } catch (error) {
      // User is disabled (suspended) or id token was revoked
      logger.error(error);
      return undefined;
    }
  }

  async suspendUser(id: string) {
    return await this.auth.updateUser(id, { disabled: true });
  }

  async unsuspendUser(id: string) {
    return await this.auth.updateUser(id, { disabled: false });
  }

  async invalidateRefreshTokens(userID: string) {
    return await this.auth.revokeRefreshTokens(userID);
  }

  // User Management
  /**
   * @async
   * @param id -> The ID of the Firebase user account to return.
   *
   * @returns -> A promise fulfilled with the user data corresponding to the provided `uid`
   */
  async getUser(id: string) {
    return await this.auth.getUser(id);
  }

  /**
   * Creates a new user with the provided username, email, and password in the Firebase user auth system.
   *
   * @async
   * @param id -> Optional generated uid to provide if desired. Autogenerated by Firebase if not provided
   * @param username
   * @param email
   * @param password
   *
   * @returns -> A promise fulfilled with the user data corresponding to the newly created user.
   */
  async createUser({
    id,
    username,
    phoneNumber,
    email,
    password,
  }: {
    id?: string;
    username: string;
    phoneNumber?: string;
    email: string;
    password: string;
  }) {
    return await this.auth.createUser({
      uid: id,
      displayName: username,
      phoneNumber,
      email,
      password,
    });
  }

  async updateUserPhoneNumber({
    id,
    phoneNumber,
  }: {
    id: string;
    phoneNumber: string;
  }) {
    return await this.auth.updateUser(id, { phoneNumber });
  }

  async updateUserUsername({ id, username }: { id: string; username: string }) {
    return await this.auth.updateUser(id, { displayName: username });
  }

  async updateUserEmail({ id, email }: { id: string; email: string }) {
    // Mark the user's email as un-verified as it's being updated currently
    await this.updateEmailVerificationState({ id, emailVerified: false });

    return await this.auth.updateUser(id, { email });
  }

  async updateUserPassword({ id, password }: { id: string; password: string }) {
    return await this.auth.updateUser(id, { password });
  }

  async updateEmailVerificationState({
    id,
    emailVerified,
  }: {
    id: string;
    emailVerified: boolean;
  }) {
    return await this.auth.updateUser(id, { emailVerified });
  }

  /**
   * Deletes the Firebase user account of the user with the associated uid (if any)
   *
   * @async
   * @param id -> The id of the user to delete
   *
   * @returns -> An empty promise fulfilled once the user has been deleted.
   */
  async deleteUser(id: string) {
    return await this.auth.deleteUser(id);
  }
}
