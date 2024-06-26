"use client";
// Dependencies
// Types
import { FmIntegrationProviders, UserSession } from "../__generated__/graphql";

// Redux
import store from "../redux/store";

// Managers
import AuthenticationManager from "./authenticationManager";
import UserManager from "./userManager";

// Services
import { FonciiAPIClientAdapter } from "../services/foncii-api/adapters/fonciiAPIClientAdapter";
import AnalyticsService from "../services/analytics/analyticsService";

// Local Storage Persistence
import SessionStorageContainer, {
  setUserSessionID,
} from "../core-foncii-maps/containers/sessionStorageContainer";

// Notifications
import {
  NotificationCenterActions,
  UserPostsActions,
} from "../redux/operations/dispatchers";
import { NotificationTemplates } from "../core-foncii-maps/repositories/NotificationTemplates";

// Utilities
import { UnitsOfTimeInMS } from "../utilities/common/time";

export default class UserSessionManager {
  // Singleton instance
  static shared: UserSessionManager = new UserSessionManager();

  // Constants
  // Send heart beat signal to the server every minute
  private HEART_BEAT_SIGNAL_INTERVAL_MS = UnitsOfTimeInMS.minute;

  // Event Loops
  private heartBeatSignalInterval: NodeJS.Timeout | undefined = undefined;

  // Managers
  authManager = () => new AuthenticationManager();

  // Services
  apiService = () => new FonciiAPIClientAdapter();

  // Convenience
  userSessionExists(): boolean {
    return UserSessionManager.getUserSessionID() != undefined;
  }

  getUserAgent(): string {
    return window.navigator.userAgent;
  }

  didCurrentSessionChange(updatedSession: UserSession): boolean {
    return updatedSession.id != UserSessionManager.getUserSessionID();
  }

  /**
   * Transient user activation https://developer.mozilla.org/en-US/docs/Glossary/Transient_activation
   */
  isUserCurrentlyInteractingWithPage(): boolean {
    return window.navigator.userActivation.isActive;
  }

  getReferrer(): string {
    return document.referrer;
  }

  getBrowserLanguage(): string {
    return window.navigator.language;
  }

  // Setup
  // Handles user session life cycle when the manager is first instantiated
  setup() {
    if (this.userSessionExists()) {
      // Existing user session
      this.startHeartBeatCycle();
    } else {
      // No user session
      this.createSession();
    }
  }

  // Business Logic
  /**
   * Starts the heart beat cycle loop at the regular interval duration
   * specified.
   *
   * @async
   */
  async startHeartBeatCycle() {
    // Stop the previous heart beat cycle (if any)
    clearInterval(this.heartBeatSignalInterval);

    this.heartBeatSignalInterval = setInterval(async () => {
      this.sendHeartBeatSignal();
    }, this.HEART_BEAT_SIGNAL_INTERVAL_MS);
  }

  /**
   * Creates a user session to track the user's activity and behavior
   * across devices relative to geospatial / temporal variables
   * properties.
   *
   * @param userLoggedOut -> If the user is logged out any remaining user ID info is not used when creating a new session, it's left blank.
   * Only use this flag when signing out a user and ending the session to create a new one.
   */
  async createSession(userLoggedOut: boolean = false) {
    const userID = userLoggedOut
      ? undefined
      : store.getState().fonciiUser.user?.id,
      deviceID = AnalyticsService.shared.getDeviceID(),
      amplitudeSessionID = AnalyticsService.shared.getSessionID(),
      referrer = this.getReferrer(),
      language = this.getBrowserLanguage(),
      clientGeolocation = store.getState().fonciiUser.clientCoordinates;

    // Precondition failure, these two identifiers must be present to effectively track user sessions
    if (!deviceID) return;

    const newUserSession = await this.apiService()
      .performCreateUserSession({
        userID,
        deviceID,
        referrer,
        language,
        clientGeolocation,
        amplitudeSessionID
      });

    if (newUserSession) {
      // Automatically import new user posts when a user begins a new session
      if (this.didCurrentSessionChange(newUserSession)) this.autoImportUserPosts();

      this.storeSessionID(newUserSession);
      this.startHeartBeatCycle();
    }
  }

  /**
   * Sends a periodic 'signal' to the server to keep
   * the user's current session alive.
   *
   * @async
   */
  async sendHeartBeatSignal() {
    // Precondition failure
    if (!this.userSessionExists()) return;

    const sessionID = UserSessionManager.getUserSessionID(),
      clientGeolocation = store.getState().fonciiUser.clientCoordinates;

    if (sessionID) {
      const updatedUserSession =
        await this.apiService().performSendUserSessionHeartBeat({
          sessionID,
          clientGeolocation,
        });

      // Secure state validation, sign out potentially bad actors and persist good session identifiers
      if (updatedUserSession) {
        if (updatedUserSession.isSuspicious) {
          await this.signOutSuspiciousUser();
        } else if (updatedUserSession.terminated) {
          await this.signOutUserWithTerminatedSession();

          // Notify user of reason for unexpected sign out
          NotificationCenterActions.triggerSystemNotification(
            NotificationTemplates.SessionExpired
          );
        } else {
          this.storeSessionID(updatedUserSession);
        }
      } else {
        // Something went wrong, previous session could not be updated, create a new session
        await this.createSession();
      }
    }
  }

  /**
   * Ends the current session and creates a new one.
   *
   * @param userLoggedOut -> If the user is logged out any remaining user ID info is not used when creating a new session, it's left blank.
   * Only use this flag when signing out a user and ending the session to create a new one.
   */
  async endSession(userLoggedOut: boolean = false) {
    const sessionID = UserSessionManager.getUserSessionID();

    if (sessionID) {
      await this.apiService().performEndUserSession(sessionID);
    }

    await this.createSession(userLoggedOut);
  }

  /**
   * Automatically signs out any logged in user, and then invalidates
   * the current session for any user. Note: The 'end session' function
   * is called when the user is signed out, by the appropriate dispatcher
   * function, so no need to call it here.
   */
  async signOutSuspiciousUser() {
    if (!UserManager.shared.userAuthenticated()) return;

    await this.authManager().signOut();

    // Notify user of reason for unexpected sign out
    NotificationCenterActions.triggerSystemNotification(
      NotificationTemplates.SuspiciousActivityDetected
    );
  }

  async signOutUserWithTerminatedSession() {
    if (!UserManager.shared.userAuthenticated()) return;

    await this.authManager().signOut();
  }

  // Persistence
  storeSessionID(session: UserSession) {
    setUserSessionID(session.id);
  }

  static getUserSessionID(): string | undefined {
    return SessionStorageContainer().UserSessionID;
  }

  // Additional Methods
  /**
   * @async
   *
   * Used to automatically re-import new user posts when a user begins a new session (when the past session ID doesn't
   * match the current session ID).
   *
   * Note: Sessions expire automatically after ~ 30 minutes of inactivity, so no need to limit this function by saving
   * the timestamp of the last import and making sure the user doesn't re-import too many times in a small period of time.
   */
  autoImportUserPosts() {
    const fonciiUser = store.getState().fonciiUser,
      instagramIntegrationCredential = fonciiUser.integrationCredentials.find(
        (ic) => ic.provider == FmIntegrationProviders.Instagram
      );

    if (instagramIntegrationCredential) {
      UserPostsActions.importUserPosts({
        integrationCredential: instagramIntegrationCredential,
        manualImport: false,
      });
    }
  }
}
