"use client";
// Dependencies
// Types
import { FmIntegrationProviders, FmUser } from "../__generated__/graphql";

// Redux
import store from "../redux/store";

// Managers
import AuthenticationManager from "./authenticationManager";

// Utilities
import { getMSTimeFromDate } from "../utilities/common/convenienceUtilities";

/**
 * Encapsulates reusable user logic used throughout the application
 * via expected definitions and methods.
 */
export default class UserManager {
  // Singleton
  static shared: UserManager = new UserManager();

  // Managers
  private authManager = () => new AuthenticationManager();

  // Properties
  fonciiUserState = () => store.getState().fonciiUser;
  currentUser = (): FmUser | undefined => this.fonciiUserState().user;
  impersonatingUser = (): FmUser | undefined =>
    this.fonciiUserState().impersonatingUser ?? this.currentUser();
  firebaseUser = () => this.authManager().manager.currentUser;

  // Convenience
  getUserAccountCreationDateInMS = () => {
    const user = this.currentUser();

    // Precondition failure, user doesn't exist
    if (!user) return 0;

    const creationDate = new Date(user.creationDate),
      creationDateInMS = getMSTimeFromDate(creationDate);

    return creationDateInMS;
  };

  getTimeSinceAccountCreationInMS = () => {
    const user = this.currentUser();

    // Precondition failure, user doesn't exist
    if (!user) return 0;

    const creationDateInMS = this.getUserAccountCreationDateInMS();
    return Date.now() - creationDateInMS;
  };

  // Auth
  userAuthenticated = (): boolean => {
    const user = this.currentUser(),
      loggedIn = this.fonciiUserState().isLoggedIn;

    return user != undefined && loggedIn;
  };

  // Taste Profile
  primaryTasteProfile = () => this.currentUser()?.primaryTasteProfile;
  tasteProfiles = () => this.currentUser()?.tasteProfileEdges ?? [];
  hasTasteProfile = () => this.primaryTasteProfile() != undefined;

  // Profile Tasks
  profileTasks = () => this.currentUser()?.profileTasks ?? [];
  profileTasksComplete = () =>
    this.profileTasks().filter((task) => !task.isComplete).length == 0;

  // Foncii Maps Post Importation Integration Credentials
  fonciiMapsIntegrationCredentials = () =>
    this.fonciiUserState().integrationCredentials;
  hasIntegrationCredentials = () =>
    this.fonciiMapsIntegrationCredentials().length > 0;
  hasInstagramIntegrationConnected = () =>
    this.hasIntegrationCredentials() &&
    this.fonciiMapsIntegrationCredentials().find(
      (ic) => ic.provider == FmIntegrationProviders.Instagram
    ) != undefined;
  instagramIntegrationCredential = () =>
    this.fonciiMapsIntegrationCredentials().find(
      (ic) => ic.provider == FmIntegrationProviders.Instagram
    );

  // User Assets
  /**
   * Can be used as a default profile picture for the current user
   * if they don't have one when first signing up.
   *
   * @returns -> A photo URL string if available, null or undefined otherwise
   * (user not logged in or they don't have a profile photo provisioned by Firebase)
   */
  firebaseUserProfilePicture = () => {
    return this.firebaseUser()?.photoURL;
  };
}
