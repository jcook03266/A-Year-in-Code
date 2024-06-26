// Dependencies
// Types
import {
  AuthProviders,
  FMIntegrationProviders,
  FonciiUserProfileTasks,
  UserRoles,
} from "../../../../../../types/common";
import { SupportedFonciiPlatforms } from "../../../../../../types/namespaces/microservice-api";
import { AggregationSortOrders } from "../../../../../../types/namespaces/database-api";
import {
  ServerContext,
  SubscriptionPubSubTopics,
} from "../../../../../../types/namespaces/gql-server-api";

// Models
import TasteProfileModel from "../../../../../../models/shared/tasteProfileModel";
import RestaurantModel from "../../../../../../models/shared/restaurantModel";
import FMIntegrationCredentialModel from "../../../../../../models/foncii/user-models/fmIntegrationCredentialModel";

// Services
import UserService from "../../../../../../business-logic/services/shared/users/userService";
import RestaurantService from "../../../../../../business-logic/services/shared/restaurants/restaurantService";
import TasteProfileService from "../../../../../../business-logic/services/taste-profile/tasteProfileService";
import FMIntegrationCredentialService from "../../../../../../business-logic/services/foncii-maps/users/fmIntegrationCredentialService";
import UserReferralService from "../../../../../../business-logic/services/shared/users/userReferralService";
import EventService from "../../../../../../business-logic/services/events/eventService";
import { FirebaseAdminService } from "../../../../../../business-logic/services/firebase/firebaseAdminService";

// Managers
import UserSessionManager from "../../../../../../business-logic/managers/users/userSessionManager";
import AuthManager from "../../../../../../business-logic/managers/auth/authManager";

// Error Coding
import ErrorCodeDispatcher from "../../../../../../core-foncii/error-coding/errorCodeDispatcher";

// Utilities
import { getMSTimeFromDateString } from "../../../../../../foncii-toolkit/utilities/convenienceUtilities";
import { computeSimilarityScoreBetweenEmbeddings } from "../../../../../../foncii-toolkit/math/machineLearningMath";
import {
  RegexPatterns,
  isInputValidAgainstPattern,
} from "../../../../../../foncii-toolkit/utilities/regex";
import { getSizeOfSetIntersection } from "../../../../../../foncii-toolkit/math/collectionMath";
import { clampNumber } from "../../../../../../foncii-toolkit/math/commonMath";

// Subscriptions
import { PubSub } from "graphql-subscriptions";

// Service Definitions
const userService = () => new UserService(),
  userSessionManager = () => new UserSessionManager(),
  restaurantService = () => new RestaurantService(),
  tasteProfileService = () => new TasteProfileService(),
  integrationCredentialService = () => new FMIntegrationCredentialService(),
  userReferralService = () => new UserReferralService(),
  eventService = () => new EventService(),
  firebaseAdminService = (platform: SupportedFonciiPlatforms) =>
    new FirebaseAdminService(platform),
  authManager = (platform: SupportedFonciiPlatforms) =>
    new AuthManager(platform);

// Pub Sub Definition
const pubSub = new PubSub();

const resolvers = {
  // Enums - Important: Make sure enums match the Foncii-API type definition documentation in common.ts,
  // that's the single source of truth.
  FonciiUserProfileTasks: {
    CREATE_ACCOUNT: 0,
    CONNECT_SOCIAL_MEDIA: 1,
    CREATE_TAST_PROFILE: 2,
    INVITE_FRIEND: 3,
  },

  FMIntegrationProviders: {
    INSTAGRAM: 0,
    TIKTOK: 1,
    GOOGLE_MAPS: 2,
  },

  AuthProviders: {
    GOOGLE: 0,
    FACEBOOK: 1,
    TWITTER: 2,
    APPLE: 3,
    DEFAULT: 4,
  },

  SupportedFonciiPlatforms: {
    FONCII: "FONCII",
    FONCII_BIZ: "FONCII-BIZ",
  },

  // Types / Interfaces
  UserAccount: {
    // Resolves the specific type of the implementing object
    __resolveType(user: any) {
      // Only Foncii Maps users have the map name field
      if (user.mapName) {
        return "FMUser";
      } else {
        return "FonciiUser";
      }
    },

    /** True if the last sign in date is after the last sign out date */
    isLoggedIn(userAccount: UserAccount) {
      const lastLoginTimestamp = getMSTimeFromDateString(
        userAccount.lastLogin.loginDate
      ),
        lastSignOutTimestamp = userAccount.lastSignOut
          ? getMSTimeFromDateString(userAccount.lastSignOut)
          : lastLoginTimestamp;

      return lastLoginTimestamp > lastSignOutTimestamp;
    },
  },

  FMUser: {
    firstName(fmUser: FMUser) {
      return fmUser.firstName;
    },

    lastName(fmUser: FMUser) {
      return fmUser.lastName;
    },

    /** True if the last sign in date is after the last sign out date */
    isLoggedIn(fmUser: FMUser) {
      const lastLoginTimestamp = getMSTimeFromDateString(
        fmUser.lastLogin.loginDate
      ),
        lastSignOutTimestamp = fmUser.lastSignOut
          ? getMSTimeFromDateString(fmUser.lastSignOut)
          : lastLoginTimestamp;

      return lastLoginTimestamp > lastSignOutTimestamp;
    },

    async primaryTasteProfile(fmUser: FMUser) {
      const userID = fmUser.id,
        primaryTasteProfileID = fmUser.primaryTasteProfileID;

      if (!primaryTasteProfileID) {
        return null;
      }
      else {
        return await tasteProfileService().getPrimaryTasteProfileForUser({
          userID,
          primaryTasteProfileID,
        });
      }
    },

    async tasteProfileEdges(fmUser: FMUser) {
      return await tasteProfileService().getAllTasteProfilesForUser(fmUser.id);
    },

    async tasteProfileSimilarityScore(
      fmUser: FMUser,
      args: { userToCompare: string }
    ) {
      // Parsing
      const firstUserID = fmUser.id,
        secondUserID = args.userToCompare;

      // No comparable user ID provided
      if (!secondUserID) return;

      // Same user, the automatic assumption is the score will be 100% ~ 1.0
      if (fmUser.id == args.userToCompare) return 100;

      const [tasteProfile1, tasteProfile2] = await Promise.all([
        tasteProfileService().getPrimaryTasteProfileForUser({
          userID: firstUserID,
        }),
        tasteProfileService().getPrimaryTasteProfileForUser({
          userID: secondUserID,
        }),
      ]);

      if (
        tasteProfile1?.collective_embedding &&
        tasteProfile2?.collective_embedding
      ) {
        // Boosting factors to plump up the similarity score to a more realistic level (higher)
        // Weights
        // The more matching cuisines the better
        const cuisineWeight = 4,
          // Users with similar dietary restrictions usually eat similar foods
          dietaryRestrictionWeight = 10;

        // Limits
        const maxCuisineBoost = 40,
          maxDietaryRestrictionBoost = 20;

        // Values
        const sharedCuisines = getSizeOfSetIntersection(
          new Set(tasteProfile1.preferredCuisines),
          new Set(tasteProfile2.preferredCuisines)
        ),
          sharedDietaryRestrictions = getSizeOfSetIntersection(
            new Set(tasteProfile1.dietaryRestrictions),
            new Set(tasteProfile2.dietaryRestrictions)
          );

        // Normalize the score by multiplying by 100, the score generated is from 0 - 1
        let similarityScore =
          computeSimilarityScoreBetweenEmbeddings(
            tasteProfile1.collective_embedding,
            tasteProfile2.collective_embedding
          ) * 100;
        similarityScore += Math.min(
          sharedCuisines * cuisineWeight,
          maxCuisineBoost
        );
        similarityScore += Math.min(
          sharedDietaryRestrictions * dietaryRestrictionWeight,
          maxDietaryRestrictionBoost
        );

        return clampNumber(similarityScore, 0, 100);
      } else return;
    },

    async profileTasks(fmUser: FMUser) {
      let isComplete = false;

      return (
        await Promise.all(
          Object.values(FonciiUserProfileTasks).map(async (profileTask) => {
            switch (profileTask) {
              case FonciiUserProfileTasks.CreateAccount:
                // Automatically marked as complete as the user wouldn't be seeing any of the tasks without being logged in
                isComplete = true;

                return {
                  id: profileTask,
                  isComplete,
                } as FonciiUserProfileTask;
              case FonciiUserProfileTasks.ConnectSocialMedia:
                // If user has at least 1 active integration credential this is marked as complete
                isComplete =
                  await integrationCredentialService().doesUserHaveIntegrationCredentials(
                    fmUser.id
                  );

                return {
                  id: profileTask,
                  isComplete,
                } as FonciiUserProfileTask;
              case FonciiUserProfileTasks.CreateTasteProfile:
                // If the user has at least 1 taste profile (primary or not) this is resolved as complete
                isComplete =
                  await tasteProfileService().doesUserHaveExistingTasteProfile(
                    fmUser.id
                  );

                return {
                  id: profileTask,
                  isComplete,
                } as FonciiUserProfileTask;
              case FonciiUserProfileTasks.InviteFriend:
                // User referrals, if at least one user joins using the user's referral code then this is marked as complete
                isComplete =
                  await userReferralService().hasUserMadeReferralConversionsWith(
                    { referrerCode: fmUser.referralCode }
                  );

                return {
                  id: profileTask,
                  isComplete,
                } as FonciiUserProfileTask;
              default:
                return;
            }
          })
        )
      ).filter(Boolean);
    },

    async role(fmUser: FMUser) {
      return UserRoles[fmUser.role ?? UserRoles.Basic].toUpperCase();
    },
  },

  FonciiUser: {
    /** True if the last sign in date is after the last sign out date */
    isLoggedIn(userAccount: UserAccount) {
      const lastLoginTimestamp = getMSTimeFromDateString(
        userAccount.lastLogin.loginDate
      ),
        lastSignOutTimestamp = userAccount.lastSignOut
          ? getMSTimeFromDateString(userAccount.lastSignOut)
          : lastLoginTimestamp;

      return lastLoginTimestamp > lastSignOutTimestamp;
    },
  },

  FMIntegrationCredential: {
    expiresSoon(integrationCredential: FMIntegrationCredential) {
      return FMIntegrationCredentialModel.expiresSoon(integrationCredential);
    },

    expired(integrationCredential: FMIntegrationCredential) {
      return FMIntegrationCredentialModel.expired(integrationCredential);
    },

    canRefresh(integrationCredential: FMIntegrationCredential) {
      return FMIntegrationCredentialModel.canRefresh(integrationCredential);
    },
  },

  UserSession: {
    sessionDuration(userSession: UserSession) {
      if (UserSessionManager.isSessionActive(userSession))
        // Active currently, use relative session duration
        return UserSessionManager.computeRelativeSessionDurationInMS(
          userSession
        );
      // Not active, the last heart beat is the amount of time the session lasted
      else return UserSessionManager.computeSessionDurationInMS(userSession);
    },

    isAlive(userSession: UserSession) {
      return UserSessionManager.isSessionAlive(userSession);
    },

    isActive(userSession: UserSession) {
      return UserSessionManager.isSessionActive(userSession);
    },

    clientGeolocationHistory(userSession: UserSession) {
      return userSession.clientGeolocationHistory ?? [];
    },
  },

  Query: {
    // Shared
    async isAccountClaimed(
      _: any,
      args: {
        input: {
          userID: string;
          platform: SupportedFonciiPlatforms;
        };
      }
    ) {
      // Parsing
      const { userID, platform } = args.input;

      // Error out for unsupported platforms
      if (platform == SupportedFonciiPlatforms.fonciiBiz) {
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST.toString(),
          `Support for the ${platform} platform for this endpoint is not yet available.`,
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
        );
      }

      // Foncii
      const user = await userService().findUserWithID(userID);

      // No user found, error out
      if (!user) {
        UserAPIMiddleware.throwUserNotFoundError("the uid:" + userID);
        return;
      }

      return user.isClaimed;
    },

    // Foncii
    async getUserSessionByID(_: any, args: { sessionID: string }) {
      return await userSessionManager().getSessionWithID(args.sessionID);
    },

    async getCurrentSessionForUserWithID(_: any, args: { userID: string }) {
      return await userSessionManager().getCurrentSessionForUser(args.userID);
    },

    async getCurrentSessionForDeviceWithID(_: any, args: { deviceID: string }) {
      return await userSessionManager().getCurrentSessionForDevice(
        args.deviceID
      );
    },

    async getAllSessionsForUserWithID(_: any, args: { userID: string }) {
      return await userSessionManager().getAllSessionsForUser(args);
    },

    async getAllSessionsForDeviceWithID(_: any, args: { deviceID: string }) {
      return await userSessionManager().getAllSessionsForDevice(args);
    },

    async getAllDeviceSessionsForUser(
      _: any,
      args: { userID: string; deviceID: string }
    ) {
      return await userSessionManager().getAllDeviceSessionsForUser(args);
    },

    async getAllAliveUserSessions(_: any) {
      return await userSessionManager().getAllAliveUserSessions();
    },

    async getAllActiveUserSessions(_: any) {
      return await userSessionManager().getAllActiveUserSessions();
    },

    // Foncii Maps
    async doesUsernameExistFM(_: any, args: { username: string }) {
      return await userService().doesUserExistWithUsername(args.username);
    },

    async doesEmailExistFM(_: any, args: { email: string }) {
      return await userService().doesUserExistWithEmail(args.email);
    },

    async doesPhoneNumberExistFM(_: any, args: { phoneNumber: string }) {
      return await userService().doesUserExistWithPhoneNumber(args.phoneNumber);
    },

    async getUserIntegrationCredentials(
      _: any,
      args: { userID: string },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args, context });

      let integrationCredentials =
        await integrationCredentialService().fetchIntegrationCredentialsForUser(
          args.userID
        );

      // Credential auto-refresh (if required / possible)
      integrationCredentials.forEach(async (credential) => {
        if (
          FMIntegrationCredentialModel.canRefresh(credential) &&
          credential.autoRefresh
        ) {
          const updatedCredential =
            await integrationCredentialService().handleIntegrationRefreshRequest(
              { ...credential }
            );

          // Replace the old integration credential if the refresh was successful
          if (updatedCredential) {
            // Filter out the credentials that don't match the updated credential's identifier
            integrationCredentials = integrationCredentials.filter(
              (cred) => cred.id != updatedCredential?.id
            );

            // Add the refreshed credential to the filtered posts to replace its old instance.
            integrationCredentials.push(updatedCredential);
          }
        }
      });

      return integrationCredentials;
    },

    async getIntegrationCredentialForUser(
      _: any,
      args: {
        input: {
          userID: string;
          integrationProvider: FMIntegrationProviders;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      const integrationCredential =
        await integrationCredentialService().fetchIntegrationCredentialForUser(
          args.input.userID,
          args.input.integrationProvider
        );

      // Precondition failure, no credential exists with the given properties
      if (!integrationCredential) return;

      // Auto-refresh the credential (if required / possible); If the credential couldn't be refreshed then return the original cred fetched from the database
      if (
        FMIntegrationCredentialModel.canRefresh(integrationCredential) &&
        integrationCredential.autoRefresh
      ) {
        const updatedCredential =
          await integrationCredentialService().handleIntegrationRefreshRequest({
            ...integrationCredential,
          });
        return updatedCredential ?? integrationCredential;
      } else {
        return integrationCredential;
      }
    },

    async getUserEmailFromUsernameFM(_: any, args: { username: string }) {
      return await userService().getUserEmailAssociatedWithUsername(
        args.username
      );
    },

    async getUserEmailFromPhoneNumberFM(_: any, args: { phoneNumber: string }) {
      return await userService().getUserEmailAssociatedWithPhoneNumber(
        args.phoneNumber
      );
    },

    async findUserByIDFM(_: any, args: { userID: string }) {
      return await userService().findUserWithID(args.userID);
    },

    async findUserByUsernameFM(_: any, args: { username: string }) {
      return await userService().findUserWithUsername(args.username);
    },

    async findTasteProfilesForUser(_: any, args: { userID: string }) {
      return (await tasteProfileService().findTasteProfilesWith({ properties: args }));
    },

    async doesUserHaveATasteProfile(_: any, args: { userID: string }) {
      return await tasteProfileService().doesUserHaveExistingTasteProfile(
        args.userID
      );
    },

    async getPrimaryUserTasteProfile(_: any, args: { userID: string }) {
      return await tasteProfileService().getPrimaryTasteProfileForUser({
        userID: args.userID
      });
    },

    async getTasteProfile(_: any, args: { id: string }) {
      return await tasteProfileService().findTasteProfileWith(args);
    },

    async getAllUsers(
      _: any,
      args: {
        limit: number,
        pageIndex?: number
      }) {
      // Parsing
      const { limit, pageIndex } = args;

      // Constants
      // Note: There's no limit imposed by the DB, but this is just for practicality
      const MAX_DOCUMENTS_PER_RETRIEVAL = 1000;

      // Pagination (if needed)
      // Force the limit to be > 0, 0 means unlimited which is not the intended behavior of this operation
      const normalizedLimit = (limit > 0 ? limit : 0),
        normalizedPageIndex = (pageIndex && pageIndex > 0 ? pageIndex : 0),
        totalPages = Math.ceil(normalizedLimit / MAX_DOCUMENTS_PER_RETRIEVAL),
        offsetTotalPages = totalPages * (normalizedPageIndex + 1),
        totalPagesToSkip = totalPages * (normalizedPageIndex),
        resultsPerPage = Math.min(normalizedLimit, MAX_DOCUMENTS_PER_RETRIEVAL);

      // Optional offset
      const startIndex = totalPagesToSkip;

      // Accumulator
      const users: FMUser[] = [];

      for (let i = startIndex; i < offsetTotalPages; i++) {
        const userBatch = (await userService()
          .getAllUsers(resultsPerPage, i));

        // Stop querying once the break out condition is met
        if (userBatch.length < 1) break;

        users.push(...userBatch);
      }

      return users;
    }
  },

  Mutation: {
    // Foncii
    async createUserSession(
      _: any,
      args: {
        input: {
          userID?: string;
          platform: SupportedFonciiPlatforms;
          deviceID: string;
          language: string;
          clientGeolocation?: CoordinatePoint;
          referrer?: string;
          amplitudeSessionID?: number;
        };
      },
      context: ServerContext
    ) {
      return await userSessionManager().createSession({
        ...args.input,
        userAgent: context.requesterUserAgent,
        operatingSystem: context.requesterOperatingSystem,
        ipAddress: context.requesterIPAddress,
      });
    },

    async sendUserSessionHeartBeat(
      _: any,
      args: {
        input: {
          sessionID: string;
          clientGeolocation?: CoordinatePoint;
        };
      },
      context: ServerContext
    ) {
      // Parsing
      const { userSessionShouldBeTerminated, response } = context;

      return await userSessionManager().resolveHeartBeatSignal({
        ...args.input,
        forceTerminate: userSessionShouldBeTerminated,
        response,
      });
    },

    async endUserSession(_: any, args: { sessionID: string }) {
      const didEnd = await userSessionManager().endSession(args.sessionID);
      return didEnd;
    },

    // Foncii Maps
    async connectIntegration(
      _: any,
      args: {
        input: {
          userID: string;
          provider: FMIntegrationProviders;
          authToken: string;
          redirectURI: string;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      return await integrationCredentialService().handleIntegrationConnectionRequest(
        args.input
      );
    },

    async refreshIntegration(
      _: any,
      args: {
        input: {
          userID: string;
          provider: FMIntegrationProviders;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      return await integrationCredentialService().handleIntegrationRefreshRequest(
        args.input
      );
    },

    async revokeIntegrationCredential(
      _: any,
      args: {
        userID: string;
        provider: FMIntegrationProviders;
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args, context });

      return await integrationCredentialService().revokeIntegrationCredential(
        args.userID,
        args.provider
      );
    },

    async revokeAllIntegrationCredentials(
      _: any,
      args: { userID: string },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args, context });

      return await integrationCredentialService().revokeAllIntegrationCredentialsForUser(
        args.userID
      );
    },

    async setAutoRefreshStateForCredential(
      _: any,
      args: { integrationCredentialID: string; autoRefreshEnabled: boolean }
    ) {
      return await integrationCredentialService().setAutoRefreshStateForCredential(
        args.integrationCredentialID,
        args.autoRefreshEnabled
      );
    },

    async createUserFM(
      _: any,
      args: {
        input: Partial<FMUser> & {
          userID: string;
          firstName: string;
          lastName: string;
          username: string;
          email: string;
          authProvider: AuthProviders;
          externalReferralCode?: string | undefined;
          oAuthProfilePictureURL?: string | undefined;
        };
      }
    ) {
      return await userService().createUser(args.input);
    },

    /**
     * This method is an auxillary method used in tandem with the client-side Firebase user authentication system.
     * It accepts and verifies the auth token generated by Firebase on the client and uses this to generate another
     * pair of tokens, a JWT access token and JWT refresh token for the user's client to use to securely communicate
     * with the server. This method also generates a new login timestamp + provider for the user and returns the logged in
     * user's data if everything goes as planned.
     */
    async loginUserFM(
      _: any,
      args: {
        input: {
          userID: string;
          authProvider: AuthProviders;
        };
      },
      context: ServerContext
    ) {
      // Parsing
      const { userID, authProvider } = args.input,
        { response, firebaseIDToken } = context;
      // Firebase ID token verification for authenticating this login request with Firebase
      const decodedFirebaseIDToken = firebaseIDToken
        ? await firebaseAdminService(
          SupportedFonciiPlatforms.foncii
        ).decodeToken(firebaseIDToken)
        : undefined,
        firebaseUserUID = decodedFirebaseIDToken?.uid;

      // The Firebase ID is only valid if the token used exists, and belongs to the user being logged in.
      const firebaseIDTokenValid =
        decodedFirebaseIDToken != undefined && firebaseUserUID == userID;

      // Fetch the logged in user's data
      const user = firebaseIDTokenValid
        ? await userService().findUserWithID(userID)
        : undefined,
        didSucceed = firebaseIDTokenValid
          ? await userService().loginUser(userID, authProvider)
          : false;

      // Precondition failure, user data doesn't exist / login failed an active session ID isn't available
      // Don't return any user data or generate secure JWTs
      if (!user || !firebaseIDTokenValid || !didSucceed) {
        if (!firebaseIDTokenValid) {
          UserAPIMiddleware.throwUnauthorizedAccessError();
        } else {
          UserAPIMiddleware.throwUserNotFoundError("the uid:" + userID);
        }

        return;
      }

      // Parse custom claims from user object
      const role = user.role,
        audience = SupportedFonciiPlatforms.foncii;

      // Create the JWT access token and refresh token and pass thme back to the client as secure cookies
      const { accessToken, refreshToken } =
        (await authManager(SupportedFonciiPlatforms.foncii).createAccessToken({
          userID,
          role,
          audience,
        })) ?? {};

      if (accessToken && refreshToken) {
        AuthManager.setSecureJWTCookies({
          accessToken,
          refreshToken,
          res: response,
        });

        // Access token and refresh token created and set to cookies successfully
        return user;
      } else {
        // Fault occurred (unlikely), throw verbose error
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.HTTPStatusCodes.INTERNAL_SERVER_ERROR.toString(),
          `Fault occurred, refresh token record could not be created.`,
          ErrorCodeDispatcher.HTTPStatusCodes.INTERNAL_SERVER_ERROR
        );

        return;
      }
    },

    async fetchImpersonatedUserFM(
      _: any,
      args: {
        input: {
          userID: string;
          impersonatedFirebaseID?: string;
          impersonatedUserName?: string;
          impersonatedEmail?: string;
          impersonatedPhoneNumber?: string;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      const {
        impersonatedFirebaseID,
        impersonatedEmail,
        impersonatedUserName,
        impersonatedPhoneNumber,
      } = args.input;

      const filters = {
        ...(impersonatedFirebaseID && { _id: impersonatedFirebaseID }),
        ...(impersonatedEmail && { email: impersonatedEmail }),
        ...(impersonatedUserName && { username: impersonatedUserName }),
        ...(impersonatedPhoneNumber && {
          phoneNumber: impersonatedPhoneNumber,
        }),
      };

      if (Object.keys(filters).length === 0) {
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST.toString(),
          `Filters needed for impersonation`,
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
        );

        return;
      }
      return await userService().findUserWith(filters);
    },

    async updateMapNameFM(
      _: any,
      args: {
        input: {
          userID: string;
          newMapName: string;
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args.input, context });

      // Validation
      // Screening for malicious language... TBA

      return await userService().updateMapName(
        args.input.userID,
        args.input.newMapName
      );
    },

    async updateUserEmailFM(
      _: any,
      args: {
        userID: string;
        email: string;
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args, context });

      // Validation
      if (!isInputValidAgainstPattern(args.email, RegexPatterns.EmailRegex)) {
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST.toString(),
          `[updateUserEmailFM] Email addresses must adhere to standard email 
                        formatting and requirements and must not be blank / invalid`,
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
        );
      }

      // Pre-processing
      const cleanedEmail = args.email.toLowerCase().trim();

      const firebaseAdmin = firebaseAdminService(
        SupportedFonciiPlatforms.foncii
      ),
        updatedUser = await firebaseAdmin.updateUserEmail({
          id: args.userID,
          email: cleanedEmail,
        });

      if (updatedUser.email == cleanedEmail) {
        /** Update succeeded and has persisted to the auth system */
        return await userService().updateUser(args.userID, {
          email: cleanedEmail,
        });
      } else return false; // Update failed ~ not persisted to the auth system
    },

    async updateUserPhoneNumberFM(
      _: any,
      args: {
        userID: string;
        phoneNumber: string;
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args, context });

      // Validation
      if (
        !isInputValidAgainstPattern(
          args.phoneNumber,
          RegexPatterns.PhoneNumberRegex
        )
      ) {
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST.toString(),
          `[updateUserPhoneNumberFM] Phone numbers must adhere to standard phone number 
                        formatting and requirements and must not be blank / invalid`,
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
        );
      }

      // Pre-processing
      const cleanedPhoneNumber = args.phoneNumber.replaceAll(" ", "");

      const firebaseAdmin = firebaseAdminService(
        SupportedFonciiPlatforms.foncii
      ),
        updatedUser = await firebaseAdmin.updateUserPhoneNumber({
          id: args.userID,
          phoneNumber: cleanedPhoneNumber,
        });

      if (updatedUser.phoneNumber == cleanedPhoneNumber) {
        /** Update succeeded and has persisted to the auth system */
        return await userService().updateUser(args.userID, {
          phoneNumber: cleanedPhoneNumber,
        });
      } else return false; // Update failed ~ not persisted to the auth system
    },

    async updateUserPasswordFM(
      _: any,
      args: {
        userID: string;
        password: string;
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args, context });

      // Validation
      if (
        !isInputValidAgainstPattern(
          args.password,
          RegexPatterns.FonciiPasswordRegex
        )
      ) {
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST.toString(),
          `[updateUserPasswordFM] Passwords must adhere to standard Foncii password 
                         requirements and must not be blank / invalid`,
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
        );
      }

      // Service defs
      const firebaseAdmin = firebaseAdminService(
        SupportedFonciiPlatforms.foncii
      );

      // Update and compare the password hashes from before and after
      const originalHash = (await firebaseAdmin.getUser(args.userID))
        .passwordHash,
        updatedUser = await firebaseAdmin.updateUserPassword({
          id: args.userID,
          password: args.password,
        }),
        updatedHash = updatedUser.passwordHash;

      return originalHash != updatedHash;
    },

    async signOutUserFM(
      _: any,
      args: { userID: string },
      context: ServerContext
    ) {
      // Parsing
      const refreshTokenPayload = context.refreshTokenPayload,
        refreshTokenID = refreshTokenPayload?.jti,
        response = context.response;

      UserAPIMiddleware.userAuthorizationGateway({ ...args, context });

      // Invalidate the refresh token used to persist the user's auth state for their current access token
      if (refreshTokenID) {
        await authManager(
          SupportedFonciiPlatforms.foncii
        ).invalidateRefreshTokenWithID(refreshTokenID);
        AuthManager.clearSecureJWTCookies(response);
      }

      return await userService().signOutUser(args.userID);
    },

    async deleteUserFM(
      _: any,
      args: { userID: string },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args, context });

      const deletionSuccessful = await userService().deleteUser({
        ...args,
        platform: SupportedFonciiPlatforms.foncii,
      });

      // Force the user to sign out of any active sessions, their account has been deleted
      if (deletionSuccessful) {
        await authManager(
          SupportedFonciiPlatforms.foncii
        ).invalidateAllAuthStatesForUser(args.userID);
        AuthManager.clearSecureJWTCookies(context.response);
      }

      return deletionSuccessful;
    },

    // Shared - Universal
    /**
     * TODO: - Move this to the client and change this to update the user's pfp url instead
     *
     * Modular mutation that updates the user's profile picture given the Foncii platform,
     * user ID, and the file data buffer string.
     *
     * @async
     * @param platform
     * @param fileUploadRequest
     *
     * @returns -> True if the update was successful, false otherwise.
     */
    async setUserProfilePicture(
      _: any,
      args: {
        input: {
          platform: SupportedFonciiPlatforms;
          fileUploadRequest: { userID: string; fileDataBuffer: string };
        };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({
        ...args.input.fileUploadRequest,
        context,
      });

      const { fileUploadRequest, platform } = args.input,
        { userID, fileDataBuffer } = fileUploadRequest;

      const didSucceed = await userService().setUserProfilePicture({
        userID,
        platform,
        fileDataBufferString: fileDataBuffer,
      });

      // Event logger
      if (didSucceed) {
        eventService().resolveUserProfilePictureUpdateEvent({
          userID,
          platform,
          sessionID: context.requesterSessionID,
        });
      }

      if (!didSucceed) {
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST.toString(),
          `Updating the profile picture of the user with the ID: ${userID} failed.
                    Make sure the user exists, the uploaded file contents adhere to the requirements, and
                    that the required Foncii platform was provided.            
                    `,
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
        );
      }

      return didSucceed;
    },

    async createTasteProfile(
      _: any,
      args: { tasteProfileInput: Partial<TasteProfile> & { userID: string } },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({
        ...args.tasteProfileInput,
        context,
      });

      const newTasteProfile = new TasteProfileModel({
        ...args.tasteProfileInput,
      }),
        didSucceed =
          (await tasteProfileService().createTasteProfile(
            newTasteProfile.toObject()
          )) != null;

      // Update user's currently selected taste profile
      if (didSucceed) {
        // Event logger
        eventService().resolveTasteProfileCreationEvent({
          userID: newTasteProfile.userID,
          tasteProfileData: newTasteProfile,
          autoGenerated: false,
          isDefault: false,
          sessionID: context.requesterSessionID,
        });

        // Update primary taste profile
        await userService().setPrimaryTasteProfile({
          userID: newTasteProfile.userID,
          tasteProfileID: newTasteProfile.id,
        });
      }

      return newTasteProfile;
    },

    async autoGenerateTasteProfile(
      _: any,
      args: { userID: string; selectedRestaurantIDs: string[] },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args, context });

      const restaurants = (
        await restaurantService().findRestaurantsWithIDs(
          args.selectedRestaurantIDs
        ))
        .map((restaurant) => RestaurantModel.fromObject(restaurant))
        .filter(Boolean) as RestaurantModel[];

      // Auto-generate the new taste profile given the selected restaurants as input
      const newTasteProfile = await TasteProfileModel.autoGenerateTasteProfile(
        args.userID,
        restaurants
      ),
        didSucceed =
          (await tasteProfileService().createTasteProfile(
            newTasteProfile.toObject()
          )) != null;

      // Update user's currently selected taste profile
      if (didSucceed) {
        // Event logger
        eventService().resolveTasteProfileCreationEvent({
          userID: newTasteProfile.userID,
          tasteProfileData: newTasteProfile,
          autoGenerated: true,
          isDefault: false,
          sessionID: context.requesterSessionID,
        });

        await userService().setPrimaryTasteProfile({
          userID: newTasteProfile.userID,
          tasteProfileID: newTasteProfile.id,
        });
      }

      return newTasteProfile;
    },

    async generateDefaultTasteProfile(
      _: any,
      args: { userID: string },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({ ...args, context });

      const newTasteProfile = TasteProfileModel.defaultTasteProfile(
        args.userID
      ),
        didSucceed =
          (await tasteProfileService().createTasteProfile(
            newTasteProfile.toObject()
          )) != null;

      // Update user's currently selected taste profile
      if (didSucceed) {
        // Event logger
        eventService().resolveTasteProfileCreationEvent({
          userID: newTasteProfile.userID,
          tasteProfileData: newTasteProfile,
          autoGenerated: false,
          isDefault: true,
          sessionID: context.requesterSessionID,
        });

        await userService().setPrimaryTasteProfile({
          userID: newTasteProfile.userID,
          tasteProfileID: newTasteProfile.id,
        });
      }

      return newTasteProfile;
    },

    async updateTasteProfile(
      _: any,
      args: {
        id: string;
        tasteProfileInput: Partial<TasteProfile> & { userID: string };
      },
      context: ServerContext
    ) {
      UserAPIMiddleware.userAuthorizationGateway({
        ...args.tasteProfileInput,
        context,
      });

      const { id, tasteProfileInput } = args,
        didSucceed = await tasteProfileService().updateTasteProfile(
          id,
          tasteProfileInput
        );

      if (didSucceed) {
        const updatedTasteProfile = await tasteProfileService().findTasteProfileWithID(id);

        // Event logger
        if (updatedTasteProfile) {
          eventService().resolveTasteProfileUpdateEvent({
            userID: tasteProfileInput.userID,
            tasteProfileData: updatedTasteProfile,
            sessionID: context.requesterSessionID,
          });
        }
      }

      return didSucceed;
    },

    async deleteTasteProfile(
      _: any,
      args: { id: string },
      context: ServerContext
    ) {
      const { id } = args,
        tasteProfile = await tasteProfileService().findTasteProfileWithID(id);

      // Precondition failure, taste profile does not exist and can't be deleted
      if (!tasteProfile) return false;

      const didSucceed = await tasteProfileService().deleteTasteProfile(id),
        tasteProfileOwner = await userService().findUserWith({
          primaryTasteProfileID: id,
        }),
        tasteProfileWasSelected = tasteProfileOwner != null;

      // Event logger
      if (didSucceed && tasteProfileOwner) {
        const userID = tasteProfileOwner.id;

        UserAPIMiddleware.userAuthorizationGateway({ userID, context });

        eventService().resolveTasteProfileDeletionEvent({
          userID,
          tasteProfileData: tasteProfile,
          sessionID: context.requesterSessionID,
        });
      }

      // If the taste profile deleted was a user's currently selected taste profile then find the most recently updated
      // taste profile they have and make that their new current taste profile (if any). If there is no other taste profile
      // then simply remove their selected taste profile as it no longer exists.
      if (tasteProfileWasSelected) {
        const tasteProfiles = (
          await tasteProfileService().findTasteProfilesWith({
            properties: { userID: tasteProfileOwner.id },
            sortOptions: { lastUpdated: AggregationSortOrders.descending },
          })
        );

        if (tasteProfiles.length > 0) {
          // Switch the user's currently selected taste profile
          await userService().setPrimaryTasteProfile({
            userID: tasteProfiles[0].userID,
            tasteProfileID: tasteProfiles[0].id,
          });
        } else {
          // Remove the user's currently selected taste profile
          await userService().setPrimaryTasteProfile({
            userID: tasteProfileOwner.id,
          });
        }
      }

      return didSucceed;
    },

    async deleteAllTasteProfilesForUser(_: any, args: { userID: string }) {
      const didSucceed = await tasteProfileService().deleteAllUserTasteProfiles(
        args.userID
      );
      await userService().setPrimaryTasteProfile(args);

      return didSucceed;
    },

    async switchPrimaryUserTasteProfile(
      _: any,
      args: { userID: string; tasteProfileID: string }
    ) {
      return await userService().setPrimaryTasteProfile(args);
    },

    async removePrimaryUserTasteProfile(_: any, args: { userID: string }) {
      return await userService().setPrimaryTasteProfile(args);
    },

    async ingestDiscoveredInstagramUser(
      _: any,
      args: {
        input: {
          username: string;
          fullName: string;
          phoneNumber?: string;
          email?: string;
          profilePictureURL?: string;
        };
      }
    ) {
      // Service defs
      const firebaseAdmin = firebaseAdminService(
        SupportedFonciiPlatforms.foncii
      );

      // Parsing
      const { username, fullName, phoneNumber, email, profilePictureURL } =
        args.input,
        names = fullName.split(" "),
        firstName = names[0] ?? "",
        lastName = names[1] ?? "";

      // User uniqueness check
      const userExists = await userService().doesUserExistWithUsername(
        username
      );

      // Precondition failure, user already exists in the system and can't be created again.
      if (userExists) {
        ErrorCodeDispatcher.throwGraphQLError(
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST.toString(),
          `A user with the username: ${username} already exists in the system.`,
          ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
        );
      }

      // Data processing
      // If a discovered IG user doesn't have a public email, then we generate a fake one using their
      // name. Ex.) 'NICKI CHEWS (SF / BAY AREA FOODIE)' -> 'unknown-nicki-chews@foncii.com'
      const autogeneratedEmail = ["unknown", firstName, lastName]
        .join(" ")
        .toLocaleLowerCase()
        .trim()
        .replaceAll(" ", "-")
        .concat("@foncii.com"),
        // Email shouldn't be falsey | blank ('') or undefined
        validEmail = !email ? autogeneratedEmail : email,
        validPhoneNumber = !phoneNumber ? undefined : phoneNumber; // Phone number shouldn't be falsey | blank ('') or undefined.

      // Create a new user in the Firebase auth system
      const authUser = await firebaseAdmin.createUser({
        username,
        phoneNumber: validPhoneNumber,
        email: validEmail,
        /** To keep things simple for unclaimed users, their password is their username */
        password: username,
      });

      // Parsing created user properties
      const userID = authUser.uid;

      /**
       * Creates a new user with the given properties if unique, null otherwise.
       */
      return await userService().createUser({
        userID,
        username,
        phoneNumber: validPhoneNumber,
        email: validEmail,
        firstName,
        lastName,
        authProvider: AuthProviders.Default,
        role: UserRoles.Creator,
        oAuthProfilePictureURL: profilePictureURL,
        /** Marking this account as unclaimed so the aggregated user can claim it later on */
        isClaimed: false,
      });
    },
  },

  Subscription: {
    userSessionEnded: {
      subscribe: () =>
        pubSub.asyncIterator([SubscriptionPubSubTopics.userSessionEnded]),
    },
  },
};

/**
 * A reusable middleware container for user specific API processes to use to trigger errors, or
 * authorize user requests to protected resources with fine-grain access control policies.
 */
export class UserAPIMiddleware {
  /**
   * A fine-tunable authorization gateway for restricting access to protected user resources, routes, and processes to
   * only authorized parties. If a user is unauthorized to make a specific request then a GraphQL auth error is thrown, if the user
   * is authorized then true is returned back to the caller.
   *
   * @param userID -> The uid of the user resource the current request is used to access. This must match the uid in the access token.
   * @param context -> Server context that includes an authorized user's access token
   * @param allowedRoles -> A list of roles that are allowed to access the resource guarded by this
   * gateway.
   * @param adminOverride -> True if a user with admin access can get through this gateway automatically,
   * false otherwise. True by default in order to allow impersonators full access. This is used to grant admin users
   * access to protected resources, useful for shadowing other user accounts.
   *
   * @returns -> True if the user is authorized to access the resource guarded by this gateway,
   * false otherwise.
   */
  static userAuthorizationGateway({
    userID,
    context,
    allowedRoles,
    adminOverride = true,
  }: {
    userID: string;
    context: ServerContext;
    allowedRoles?: UserRoles[];
    adminOverride?: boolean;
  }) {
    // Local dev override, useful for testing without needing to set up a real user account with auth access
    // ~ integration tests w/ mock data
    if (process.env.NODE_ENV == "local") return true;

    // Parsing
    const accessTokenPayload = context.accessTokenPayload;

    // An access token is the bare minimum for determining authorization
    if (!accessTokenPayload) {
      this.throwUnauthorizedAccessError();

      // Will never return, just a formality
      return false;
    }

    // Optional access control policy by user roles
    const userRole = accessTokenPayload.role,
      authorizedUID = accessTokenPayload.userID;

    // Admins can bypass the other checks
    if (adminOverride && userRole == UserRoles.Admin) return true;

    const userRoleInsufficient =
      userRole && allowedRoles && !allowedRoles.includes(userRole),
      userIDMismatch = userID != authorizedUID,
      userUnauthorized = userRoleInsufficient || userIDMismatch;

    // Final check
    if (userUnauthorized) this.throwUnauthorizedAccessError();

    return true;
  }

  static throwUserNotFoundError(userIdDebug: string) {
    ErrorCodeDispatcher.throwGraphQLError(
      ErrorCodeDispatcher.HTTPStatusCodes.NOT_FOUND.toString(),
      `A user with ${userIdDebug} could not be found.`,
      ErrorCodeDispatcher.HTTPStatusCodes.NOT_FOUND
    );
  }

  static throwUnauthorizedAccessError() {
    ErrorCodeDispatcher.throwGraphQLError(
      ErrorCodeDispatcher.HTTPStatusCodes.UNAUTHORIZED.toString(),
      `Your client is not authorized to make this request.`,
      ErrorCodeDispatcher.HTTPStatusCodes.UNAUTHORIZED
    );
  }
}

export default resolvers;
