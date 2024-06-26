// Dependencies
// Redux
import {
  FonciiUserActions,
  NotificationCenterActions,
} from "../redux/operations/dispatchers";

// Notifications
import { NotificationTemplates } from "../core-foncii-maps/repositories/NotificationTemplates";

// Inheritance
import FirebaseService from "../services/firebase/firebaseService";

// Types
import { AuthProviders, FmUser } from "../__generated__/graphql";

// Firebase Auth
import * as auth from "firebase/auth";

// Services
import { FonciiAPIClientAdapter } from "../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Managers
import AnalyticsService, {
  AnalyticsEvents,
} from "../services/analytics/analyticsService";

export enum AuthState {
  USER_LOGGED_IN,
  USER_NOT_FOUND,
  INSUFFICIENT_SIGN_IN_PARAMS,
}

/**
 * Encapsulates reusable user logic used throughout the application
 * via expected definitions and methods.
 *
 * Note For Later:
 * Some security-sensitive actions—such as deleting an account, setting a primary
 * email address, and changing a password—require that the user has recently signed in.
 * If you perform one of these actions, and the user signed in too long ago, the action
 * fails with an error. When this happens, re-authenticate the user by getting new sign-in
 * credentials from the user and passing the credentials to `reauthenticateWithCredential`
 */
export default class AuthenticationManager extends FirebaseService {
  // Properties
  // https://firebase.google.com/docs/auth/web/manage-users#web-modular-api
  manager;

  // Services
  clientAPIService = () => new FonciiAPIClientAdapter();

  constructor() {
    super();

    this.manager = this.auth;
    this.setup();
  }

  // Various custom settings to use
  setup() {
    // To apply the default browser language preference instead of explicitly setting it.
    this.manager.useDeviceLanguage();
  }

  // Firebase ID JWT
  /**
   * Fetches and returns the Firebase ID token result for the current user current token if it has not expired or if it
   * will not expire in the next five minutes. Otherwise, this will refresh the token and return a new one. If
   * a user is currently authenticated, undefined otherwise.
   *
   * @async
   *
   * @returns -> The Firebase ID token result for the current user current token if it has not expired or if it
   * will not expire in the next five minutes. Otherwise, this will refresh the token and return a new one.
   */
  async getCurrentUserIDTokenResult() {
    if (this.manager.currentUser == undefined) return undefined;

    return await this.manager.currentUser?.getIdTokenResult();
  }

  // User Authentication Business Logic
  // Account Provisioning
  /**
   *
   * @param username -> Used to create the user on our backend
   * @param email -> Used to create the user on our backend
   * @param password -> To be salted, hashed, and stored on Firebase Auth's servers
   *
   * @returns -> The newly created Foncii Maps user data if a Firebase Auth and Foncii account were
   * created successfully, undefined otherwise.
   */
  async createDefaultUserAccount(args: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    externalReferralCode?: string;
  }): Promise<FmUser | undefined> {
    return auth
      .createUserWithEmailAndPassword(this.manager, args.email, args.password)
      .then(async (userCredential) => {
        // New Firebase Auth user created and signed in successfully
        const newFirebaseAuthUser = userCredential.user,
          userID = newFirebaseAuthUser.uid;

        // Create new user in the backend with the default auth provider
        const newFonciiUser = await this.clientAPIService().performCreateUser({
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email,
          authProvider: AuthProviders.Default,
          userID,
          username: args.username,
          externalReferralCode: args.externalReferralCode,
        });

        // If a user can't be created then delete the Firebase Auth user and throw
        if (newFonciiUser == undefined) {
          await auth.deleteUser(newFirebaseAuthUser);
          throw new Error(
            "User could not be provisioned remotely at this time, deleting isolated user account."
          );
        }

        AnalyticsService.shared.identifyUser(userID);
        AnalyticsService.shared.trackGenericEvent(
          AnalyticsEvents.USER_CREATED,
          {
            authProvider: AuthProviders.Default,
            email: args.email,
            username: args.username,
            referralCode: args.externalReferralCode,
          }
        );

        // User is now logged in on the client's Firebase Auth system after being created, so no need to use the Firebase login process.
        // Instead go through with the usual login flow that updates the client store
        FonciiUserActions.login(AuthProviders.Default, userID, true);

        return newFonciiUser;
      })
      .catch((err) => {
        // Account creation failed for some external reason, see error message for details.
        console.error(
          `Error encountered while creating a default user account, Error: ${err}`
        );
        NotificationCenterActions.triggerSystemNotification(
          NotificationTemplates.AccountCreationFailed
        );

        AnalyticsService.shared.trackGenericEvent(
          AnalyticsEvents.USER_CREATION_FAILED,
          {
            authProvider: AuthProviders.Default,
            email: args.email,
            username: args.username,
            referralCode: args.externalReferralCode,
          }
        );

        return undefined;
      });
  }

  // OAuth Provider Sign-Up / Sign-In
  async authenticateUserWith({
    firstName,
    lastName,
    provider,
    username,
    externalReferralCode,
  }: {
    firstName?: string;
    lastName?: string;
    provider: AuthProviders;
    username?: string;
    externalReferralCode?: string;
  }): Promise<FmUser | AuthState> {
    // Parsed user information from OAuth provider / Firebase Auth
    let userFirstName: string | null = firstName ?? null,
      userLastName: string | null = lastName ?? null,
      email: string | null = null,
      userID: string | null = null,
      authUser: auth.User | null = null;

    // Note: By default, when One account per email address (Our current system) is enabled, Firebase requests email and name scopes
    switch (provider) {
      case AuthProviders.Google:
        // https://firebase.google.com/docs/auth/web/google-signin?hl=en&authuser=0
        const googleProvider = new auth.GoogleAuthProvider();

        await auth
          .signInWithPopup(this.manager, googleProvider)
          .then(async (result) => {
            // Can obtain access token, credential etc.
            // Signed-in user info
            authUser = result.user;

            // Parsing
            const [parsedFirstName, parsedLastName] =
              authUser.displayName?.split(" ")!;

            userFirstName = firstName ?? parsedFirstName;
            userLastName = lastName ?? parsedLastName;
            email = authUser.email!;
            userID = authUser.uid;
          })
          .catch((err) => {
            console.error(err);
          });
        break;
      case AuthProviders.Facebook:
        // https://firebase.google.com/docs/auth/web/facebook-login?hl=en&authuser=0
        const facebookProvider = new auth.FacebookAuthProvider();

        await auth
          .signInWithPopup(this.manager, facebookProvider)
          .then(async (result) => {
            // Can obtain access token, credential etc.
            // Signed-in user info
            authUser = result.user;

            // Parsing
            const [parsedFirstName, parsedLastName] =
              authUser.displayName?.split(" ")!;

            userFirstName = firstName ?? parsedFirstName;
            userLastName = lastName ?? parsedLastName;
            email = authUser.email!;
            userID = authUser.uid;
          })
          .catch((err) => {
            console.error(err);
          });
        break;
      default:
        console.error(
          `User attempted to create account using an unsupported auth provider ${provider}`
        );
        break;
    }

    // Precondition failure, authentication failed
    if (!email || !userID || !authUser) {
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.LogInFailed
      );
      return AuthState.INSUFFICIENT_SIGN_IN_PARAMS;
    }

    const emailExists = await this.clientAPIService().performDoesEmailExist(
      email
    );

    // Existing user, log in like normal. Note: Connecting multiple auth providers is done elsewhere and should be separate from the sign up / sign in auth process.
    if (emailExists) {
      // Updates the client store and handles all other conditional logic required when first logging in
      FonciiUserActions.login(provider, userID);

      return AuthState.USER_LOGGED_IN;
    } else {
      // New user, email doesn't exist
      if (username && email && userFirstName && userLastName) {
        const oAuthProfilePictureURL =
          (authUser as auth.User).photoURL ?? undefined;

        // Create new user in the backend with the default auth provider
        const newFonciiUser = await this.clientAPIService().performCreateUser({
          firstName: userFirstName,
          lastName: userLastName,
          email,
          username,
          userID,
          authProvider: provider,
          oAuthProfilePictureURL,
          externalReferralCode,
        });

        // If a user can't be created then delete the Firebase Auth user and throw
        if (newFonciiUser == undefined) {
          await auth.deleteUser(authUser);
          throw new Error(
            "User could not be provisioned remotely at this time, deleting isolated user account."
          );
        }

        AnalyticsService.shared.identifyUser(userID);
        AnalyticsService.shared.trackGenericEvent(
          AnalyticsEvents.USER_CREATED,
          {
            authProvider: provider,
            email,
            username,
            referralCode: externalReferralCode,
          }
        );

        // User is now logged in on the client's Firebase Auth system after being created, so no need to use the Firebase login process.
        // Instead go through with the usual login flow that updates the client store
        FonciiUserActions.login(AuthProviders.Default, userID, true);

        return newFonciiUser;
      } else {
        // User doesn't exist, and the required account creation data is not provided, delete the created Firebase user account
        await auth.deleteUser(authUser);

        NotificationCenterActions.triggerSystemNotification(
          NotificationTemplates.AccountCreationNeeded
        );
        AnalyticsService.shared.trackGenericEvent(
          AnalyticsEvents.USER_CREATION_NEEDED,
          {
            authProvider: provider,
            email,
            username,
            referralCode: externalReferralCode,
          }
        );

        return AuthState.USER_NOT_FOUND;
      }
    }
  }

  // User Login
  /**
   * Logs the user in with the username associated with some email
   * and password, basically a proxy to `loginWithEmail`.
   *
   * @param username
   * @param password
   */
  async loginWithUsername(username: string, password: string) {
    const associatedEmail =
      await this.clientAPIService().performGetUserEmailFromUsername(username);

    // Log error and move on
    if (!associatedEmail) {
      console.error(`No email is associated with the username ${username}. 
            Logging in with this username is not possible, please correct it or use your email instead.`);

      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.LogInFailed
      );
      return;
    }

    // Associated email fetched successfully
    await this.loginWithEmail(associatedEmail, password);
  }

  /**
   * Logs the user in with the email + password combination (Default Provider)
   *
   * @param email
   * @param password
   */
  async loginWithEmail(email: string, password: string) {
    auth
      .signInWithEmailAndPassword(this.manager, email, password)
      .then(async (userCredential) => {
        // New Firebase Auth user created and signed in successfully
        const authenticatedFirebaseAuthUser = userCredential.user,
          userID = authenticatedFirebaseAuthUser.uid;

        // Updates the client store and handles all other conditional logic required when first logging in
        FonciiUserActions.login(AuthProviders.Default, userID);
      })
      .catch((err) => {
        // Log in failed for some external reason, see error message for details.
        console.error(`Error encountered while logging user in, Error: ${err}`);

        // `FonciiUserActions.login` doesn't throw, so don't worry about a double notification unless `FonciiUserActions.login`
        // fails for some external reason.
        NotificationCenterActions.triggerSystemNotification(
          NotificationTemplates.LogInFailed
        );
      });
  }

  // User Sign Out
  /**
   * Signs the current Firebase Auth user out
   * and clears any stored client data accordingly
   * with the usual sign out method that updates the
   * user store and other stores as required.
   */
  async signOut() {
    auth.signOut(this.manager);
    FonciiUserActions.signOut();
  }

  // Reset Password Email Link
  async sendResetPasswordEmailLink(email: string): Promise<boolean> {
    return await auth
      .sendPasswordResetEmail(this.manager, email)
      .then(() => {
        NotificationCenterActions.triggerSystemNotification(
          NotificationTemplates.PasswordResetEmailSent(email)
        );

        return true;
      })
      .catch((error) => {
        const errorCode = error.code,
          errorMessage = error.message;

        console.error(
          `Error encountered while sending password reset email, Error: ${errorMessage} | ${errorCode}`
        );

        NotificationCenterActions.triggerSystemNotification(
          NotificationTemplates.PasswordResetEmailFailedToSend
        );
        return false;
      });
  }
}
