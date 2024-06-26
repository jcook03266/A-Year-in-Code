// Dependencies
// Types
import { FonciiDBCollections } from "../../../types/namespaces/database-api";
import { SupportedFonciiPlatforms } from "../../../types/namespaces/microservice-api";
import { UserRoles } from "../../../types/common";
import { FonciiJWTPayload } from "../../../types/namespaces/gql-server-api";
import express from "express";

// Services
import { DatabaseServiceAdapter } from "../../services/database/databaseService";
import UserService from "../../services/shared/users/userService";
import UserSessionManager from "../users/userSessionManager";
import { FirebaseAdminService } from "../../services/firebase/firebaseAdminService";

// Security
import * as jwt from "jsonwebtoken";

// Logging
import logger from "../../../foncii-toolkit/debugging/debugLogger";

// Utilities
import {
  convertMSTimeToISODate,
  currentDateAsISOString,
} from "../../../foncii-toolkit/utilities/convenienceUtilities";
import { UnitsOfTimeInMS } from "../../../foncii-toolkit/utilities/time";
import { convertSecondsToMS } from "../../../foncii-toolkit/math/unitConversion";

// Local Types
type RefreshTokenRecordPropertyOptions = {
  [K in keyof Partial<RefreshTokenRecord>]: any;
};

export default class AuthManager {
  // Properties
  private platform: SupportedFonciiPlatforms;

  // Services
  private database = new DatabaseServiceAdapter();
  private userService = () => new UserService();
  private firebaseAdminService = () => new FirebaseAdminService(this.platform);
  private sessionManager = () => new UserSessionManager();

  // Constant
  private static SIG_HASHING_ALGO: jwt.Algorithm = "HS256";
  private static ACCESS_TOKEN_EXP_INTERVAL: string = "1h";
  private static REFRESH_TOKEN_EXP_INTERVAL: string = "30d";
  // If the token is about to expire in the next 5 minutes, shunt the token's life cycle to expired by invalidating it, and create a new fresh token
  private static TOKEN_EXPIRATION_SHUNT_REFRESH_THRESHOLD: number =
    UnitsOfTimeInMS.minute * 5;

  constructor(platform: SupportedFonciiPlatforms) {
    this.platform = platform;
  }

  // High Level Operations
  async invalidateAllAuthStatesForUser(userID: string) {
    await Promise.all([
      this.invalidateAllRefreshTokensFor(userID),
      this.sessionManager().endAllSessionsForUser(userID),
    ]);
  }

  // Not used for now, stub methods. Checking for user suspension would have to be implemented + database operations as well
  async suspendUserAccount(userID: string) {
    await this.firebaseAdminService().suspendUser(userID);

    // Update database to reflect update to user suspensions
    // ..
  }

  async unsuspendUserAccount(userID: string) {
    await this.firebaseAdminService().unsuspendUser(userID);

    // Update database to reflect update to user suspensions
    // ..
  }

  // Secure Cookies
  /**
   * Removes any secure jwt cookies from the response object.
   *
   * @param res -> The express response object to use to set the cookies from the server with
   * and pass back to the client.
   */
  static clearSecureJWTCookies(res: express.Response) {
    res.clearCookie("access-token");
    res.clearCookie("refresh-token");
  }

  /**
   * Sets secure cookies with the provided valid access and refresh tokens.
   * Please ensure the tokens are valid before setting them as cookies.
   *
   * @param accessToken
   * @param refreshToken
   * @param res -> The express response object to use to set the cookies from the server with
   * and pass back to the client.
   */
  static setSecureJWTCookies({
    accessToken,
    refreshToken,
    res,
  }: {
    accessToken: string;
    refreshToken: string;
    res: express.Response;
  }) {
    // Decoding
    const accessTokenPayload = AuthManager.decodeJWT(accessToken),
      refreshTokenPayload = AuthManager.decodeJWT(refreshToken);

    // Parsing exp dates
    const accessTokenExpirationTimestampInSeconds = accessTokenPayload?.exp,
      refreshTokenExpirationTimestampInSeconds = refreshTokenPayload?.exp;

    // Convert exp dates from seconds to ms to date object
    let accessTokenExpirationDate: Date | undefined,
      refreshTokenExpirationDate: Date | undefined;

    if (
      accessTokenExpirationTimestampInSeconds &&
      refreshTokenExpirationTimestampInSeconds
    ) {
      accessTokenExpirationDate = new Date(
        convertSecondsToMS(accessTokenExpirationTimestampInSeconds)
      );
      refreshTokenExpirationDate = new Date(
        convertSecondsToMS(refreshTokenExpirationTimestampInSeconds)
      );
    }

    res.cookie("access-token", accessToken, {
      // Secure only available over HTTPS (prod env.)
      secure: process.env.NODE_ENV !== "local",
      httpOnly: true,
      sameSite: "strict",
      expires: accessTokenExpirationDate,
    });

    res.cookie("refresh-token", refreshToken, {
      // Secure only available over HTTPS (prod env.)
      secure: process.env.NODE_ENV !== "local",
      httpOnly: true,
      sameSite: "strict",
      expires: refreshTokenExpirationDate,
    });
  }

  // Data Layer
  /**
   * Fetches and returns the refresh token record with the jwtid / uid / jti provided,
   * (if any).
   *
   * @async
   * @param id
   *
   * @returns -> The refresh token record with the jwtid / uid / jti provided, null
   * if none found.
   */
  private async getRefreshTokenRecordWithID(
    id: string
  ): Promise<RefreshTokenRecord | null> {
    return await this.database.findDocumentWithID<RefreshTokenRecord>(
      FonciiDBCollections.AuthRefreshTokens,
      id
    );
  }

  /**
   * Creates a new database record for the given refresh token alongside its
   * expiration date metadata.
   *
   * @async
   * @param jwtid -> Unique identifier of the JWT; can be used to prevent the JWT from being replayed (allows a token to be used only once)
   * @param userID -> UID of the user the JWT is associated with.
   * @param tokenExpirationDate -> ISO-8601 date string indicating an approximate date time when the token is set to expire
   * @param refreshToken -> The refresh token string itself
   *
   * @returns -> True if the record was created successfully for the refresh token
   */
  private async createRefreshTokenRecord({
    jwtid,
    userID,
    tokenExpirationDate,
    refreshToken,
  }: {
    jwtid: string;
    userID: string;
    tokenExpirationDate: string;
    refreshToken: string;
  }) {
    // Parsing
    const id = jwtid,
      expirationDate = tokenExpirationDate,
      token = refreshToken;

    const newRefreshTokenRecord: RefreshTokenRecord = {
      id,
      userID,
      creationDate: currentDateAsISOString(),
      expirationDate,
      token,
    };

    return await this.database.createNewDocumentWithID(
      FonciiDBCollections.AuthRefreshTokens,
      id,
      newRefreshTokenRecord
    );
  }

  /**
   * Invalidates all active refresh tokens (Foncii and Firebase) for the specfied user. Please note that any active
   * access tokens will continue to be active until they expire, invalidating the refresh token
   * only prevents more refresh tokens from being minted with the current access token + refresh
   * token combination the user is using until they generate another secure pair of JWTs.
   *
   * @async
   * @param userID -> The uid of the user to invalidate all refresh tokens for.
   */
  async invalidateAllRefreshTokensFor(userID: string) {
    // Invalidate any valid Foncii refresh token records for the current user
    const allValidRefreshTokenRecords = (
      await this.database.findDocumentsWithProperties<RefreshTokenRecord>({
        collectionName: FonciiDBCollections.AuthRefreshTokens,
        properties: {
          userID,
          invalidated: false,
        },
        resultsPerPage: 0
      })
    );

    await Promise.all(
      allValidRefreshTokenRecords.map(async (refreshTokenRecord) => {
        const refreshTokenID = refreshTokenRecord.id;
        await this.invalidateRefreshTokenWithID(refreshTokenID);
      })
    );

    // Invalidate any valid Firebase refresh tokens for the current user
    await this.firebaseAdminService().invalidateRefreshTokens(userID);
  }

  /**
   * Marks the refresh token with the given uid / jwtid / jti
   * as invalid which means it can't be used to refresh an access token
   * or create another refresh token. Use this when consuming a refresh token
   * when creating a new access token / refresh token, or when invalidating a user's
   * auth state coupled with invalidating any other auth related states (user sessions for ex.)
   * + logging the user out of any authenticated clients.
   *
   * @async
   * @param id -> jwtid / uid of the refresh token to update.
   *
   * @returns -> True if the update succeeded, false otherwise.
   */
  async invalidateRefreshTokenWithID(id: string) {
    const updatedProperties: RefreshTokenRecordPropertyOptions = {
      invalidated: true,
    };

    return await this.database.updateFieldsInDocumentWithID(
      FonciiDBCollections.AuthRefreshTokens,
      id,
      updatedProperties
    );
  }

  // Business Logic
  async createAccessToken({
    userID,
    role,
    audience,
  }: {
    userID: string;
    role: UserRoles;
    audience?: SupportedFonciiPlatforms;
  }): Promise<
    | {
      accessToken: string;
      refreshToken: string;
    }
    | undefined
  > {
    // Create the JWT access token and refresh token and pass them
    // back to the client as secure cookies
    const accessToken = AuthManager.generateJWTAccessToken({
      userID,
      role,
      audience,
    });

    const {
      id: refreshTokenID,
      token: refreshToken,
      expirationDate: refreshTokenExpirationDate,
    } = AuthManager.generateJWTRefreshToken({
      userID,
      audience,
    });

    const refreshTokenRecordCreated = await this.createRefreshTokenRecord({
      jwtid: refreshTokenID,
      userID,
      tokenExpirationDate: refreshTokenExpirationDate,
      refreshToken,
    });

    // Fault-tolerance, only return the access tokens if a record was created successfully
    // for the refresh token.
    if (refreshTokenRecordCreated) {
      return {
        accessToken,
        refreshToken,
      };
    } else {
      return undefined;
    }
  }

  /**
   * Generates a new access token from a valid refresh token and consumes the old refresh
   * token in the process. The new access token is returned alongside a new refresh token
   * to use to generate another access token when the new one expires.
   *
   * @async
   * @param refreshTokenID
   *
   * @returns -> A new access token and refresh token if the refresh token
   * given was valid, undefined otherwise.
   */
  async refreshAccessToken(refreshTokenID: string) {
    // Fetch existing refresh token (if any)
    const refreshTokenRecord = await this.getRefreshTokenRecordWithID(
      refreshTokenID
    ),
      refreshToken = refreshTokenRecord?.token,
      refreshTokenCanBeValidated =
        refreshTokenRecord && !refreshTokenRecord.invalidated;

    if (refreshTokenCanBeValidated) {
      // Validate the refresh token itself
      const decodedRefreshToken = AuthManager.decodeJWT(refreshToken),
        jwtid = decodedRefreshToken?.jti,
        uidsMatch = jwtid == refreshTokenID;

      // Consume the old refresh token and generate a new one +
      // generate a new access token to send back to the client alongside the new refresh token.
      if (decodedRefreshToken && uidsMatch) {
        // Fetch the user associated with the token
        const userID = decodedRefreshToken.userID,
          user = await this.userService().findUserWithID(userID);

        // Verify the user exists
        if (!user) {
          logger.warn(
            `[refreshAccessToken] A user with the uid: ${userID} doesn't exist.`
          );
          return undefined;
        }

        // Parsing previously applied custom claims
        const audience = decodedRefreshToken.aud as SupportedFonciiPlatforms,
          role = decodedRefreshToken.role;

        const newRefreshTokenResponse = AuthManager.generateJWTRefreshToken({
          userID,
          audience,
        }),
          oldRefreshTokenID = refreshTokenID,
          newRefreshTokenID = newRefreshTokenResponse.id,
          newRefreshTokenExpirationDate =
            newRefreshTokenResponse.expirationDate,
          newRefreshToken = newRefreshTokenResponse.token;

        const newAccessToken = AuthManager.generateJWTAccessToken({
          userID,
          role,
          audience,
        });

        const refreshTokenConsumed = await this.consumeRefreshToken({
          userID,
          oldRefreshTokenID,
          newRefreshTokenID,
          newRefreshTokenExpirationDate,
          newRefreshToken,
        });

        if (!refreshTokenConsumed) {
          logger.error(
            `Error encountered while consuming refresh token ${refreshTokenID}`
          );
          return undefined;
        }

        return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        };
      }
    }

    // Logging
    logger.warn(
      `[refreshAccessToken] This refresh token can not be validated. It either doesn't exist or has been previously invalidated.`,
      refreshTokenID
    );

    return undefined;
  }

  /**
   * Determines if there exists a refresh token record with the given id that has
   * not yet been marked as invalid. If so the refresh token can still be used
   * so long as its contents are still valid.
   *
   * @async
   * @param id -> The id of the valid refresh token record to locate.
   *
   * @returns -> True if there exists a refresh token record with the given id that has
   * not been explicitly marked as invalid, false otherwise.
   */
  async isRefreshTokenRecordValid(id: string) {
    return await this.database.doesDocumentExistWithProperties(
      FonciiDBCollections.AuthRefreshTokens,
      {
        id,
        invalidated: { $exists: false },
      } as RefreshTokenRecordPropertyOptions
    );
  }

  /**
   * Invalidates the old refresh token and creates a new database record for the new
   * refresh token. Please note that this method is fault tolerant, this means that if the new record isn't
   * created for some reason, the old refresh token isn't invalidated. This ensures that the
   * user's auth state isn't invalidated for an unexpected reason outside of their control, and this
   * also allows the system to recover if a fault does occur with the database
   * momentarily for some reason. Isolation of the different application domains is necessary
   * to promote controllable and deterministic behavior throughout our application environment.
   *
   * @async
   * @param oldRefreshTokenID -> The UID of the old refresh token to invalidate
   * @param userID
   * @param newRefreshTokenID -> The UID of the new refresh token to create a record for
   * @param newRefreshTokenExpirationDate
   * @param newRefreshToken
   *
   * @returns -> True if the old refresh token was invalidated successfully, and a
   * new record was created for the new refresh token. False otherwise.
   */
  private async consumeRefreshToken({
    userID,
    oldRefreshTokenID,
    newRefreshTokenID,
    newRefreshTokenExpirationDate,
    newRefreshToken,
  }: {
    userID: string;
    oldRefreshTokenID: string;
    newRefreshTokenID: string;
    newRefreshTokenExpirationDate: string;
    newRefreshToken: string;
  }) {
    // Create a new refresh token record
    const refreshTokenRecordCreated = await this.createRefreshTokenRecord({
      jwtid: newRefreshTokenID,
      userID,
      tokenExpirationDate: newRefreshTokenExpirationDate,
      refreshToken: newRefreshToken,
    });

    // Refresh token wasn't created successfully, fall back
    if (!refreshTokenRecordCreated) return false;

    // Invalidate the old refresh token as it was just consumed to create new tokens.
    const tokenInvalidated = await this.invalidateRefreshTokenWithID(
      oldRefreshTokenID
    );

    return tokenInvalidated;
  }

  // Verification
  /**
   * Verifies the validity of the JSON Web Token
   * based on the secret key used and the signature
   * of the token, and returns the decoded contents of the token.
   *
   * @param jwtToken
   *
   * @returns -> The decoded JSON web token if the web token is valid, undefined
   * otherwise.
   */
  static decodeJWT(jwtToken?: string): FonciiJWTPayload | undefined {
    if (!jwtToken) return undefined;

    try {
      const decodedJWT = jwt.verify(
        jwtToken,
        process.env.FONCII_SERVER_API_SECRET
      ) as FonciiJWTPayload;
      return decodedJWT;
    } catch (error) {
      logger.error("Error encountered while verifying JWT", error);
      return undefined;
    }
  }

  /**
   * Verifies the validity of the JSON Web Token
   * based on the secret key used and the signature
   * of the token.
   *
   * @param jwtToken
   *
   * @returns -> True if the JWT is valid, false otherwise.
   */
  static verifyJWT(jwtToken?: string): boolean {
    return this.decodeJWT(jwtToken) != undefined;
  }

  /**
   * Determines if the JWT hasn't expired, but it will within the next 5 minutes,
   * false otherwise
   *
   * @param jwtToken -> Token string to decode, not the already decoded payload.
   *
   * @returns -> True if the JWT hasn't expired, but it will within the next 5 minutes,
   * false otherwise.
   */
  static willJWTExpireSoon(jwtToken: string): boolean {
    const decodedJWT = this.decodeJWT(jwtToken),
      expirationDateInSeconds = decodedJWT?.exp;

    // Precondition failure, JWT isn't valid / already expired
    if (!decodedJWT || !expirationDateInSeconds) return false;

    // Convert the exp from seconds to milliseconds
    const expirationDateTimestamp = convertSecondsToMS(expirationDateInSeconds),
      expirationShuntPeriodStart =
        expirationDateTimestamp -
        AuthManager.TOKEN_EXPIRATION_SHUNT_REFRESH_THRESHOLD,
      currentTimestamp = Date.now();

    // JWT hasn't expired, but it will within the next 5 minutes
    return (
      currentTimestamp >= expirationShuntPeriodStart &&
      currentTimestamp < expirationDateTimestamp
    );
  }

  // JWT Generation
  /**
   * Generates a short-lived access token for the client to use to acesss protected resources
   * and API routes. This access token is the user's proof of authorization to access
   * and or mutate restricted data; it's generated alongside a refresh token when a user first
   * logs in and sent back to the client to be used as needed. This token expires after an hour
   * and has to be refreshed by a valid refresh token.
   *
   * @param userID -> UID of the user the JWT belongs to and is authorized for.
   * @param role -> The role of the user 'admin' etc, to provide extra security granularity
   * @param audience -> The platform / website this JWT is designated for.
   *
   * @returns -> A JSON Web Token string encoded with the provided claims / data
   * to pass back to the client.
   */
  private static generateJWTAccessToken({
    userID,
    role,
    audience,
  }: {
    userID: string;
    role: UserRoles;
    audience?: SupportedFonciiPlatforms;
  }) {
    return jwt.sign(
      {
        userID,
        role,
      },
      process.env.FONCII_SERVER_API_SECRET,
      {
        expiresIn: AuthManager.ACCESS_TOKEN_EXP_INTERVAL,
        algorithm: AuthManager.SIG_HASHING_ALGO,
        audience,
      }
    );
  }

  /**
   * Generates a long-lived refresh token for the client to use to refresh the user's short-lived
   * access token when it expires. The refresh token expires after 30 days, which is desirable for our
   * specific use case as some users will use our application in-frequently due to the hands off nature
   * of the services we provide.
   *
   * @param userID
   * @param audience
   *
   * @returns -> A long-lived refresh token string for the client to use to refresh the user's short-lived
   * access token when it expires and its uid for referencing it as a database record.
   */
  private static generateJWTRefreshToken({
    userID,
    audience,
  }: {
    userID: string;
    audience?: SupportedFonciiPlatforms;
  }): {
    id: string;
    token: string;
    expirationDate: string;
  } {
    const jwtid = DatabaseServiceAdapter.generateUUIDHexString(),
      signedRefreshToken = jwt.sign(
        { userID },
        process.env.FONCII_SERVER_API_SECRET,
        {
          expiresIn: AuthManager.REFRESH_TOKEN_EXP_INTERVAL,
          algorithm: AuthManager.SIG_HASHING_ALGO,
          audience,
          jwtid,
        }
      );

    // One month expiration date, keep in parity with the `REFRESH_TOKEN_EXP_INTERVAL` constant
    const oneMonthFromNowInMS = Date.now() + UnitsOfTimeInMS.month,
      expirationDate = convertMSTimeToISODate(oneMonthFromNowInMS);

    return {
      id: jwtid,
      expirationDate,
      token: signedRefreshToken,
    };
  }
}
