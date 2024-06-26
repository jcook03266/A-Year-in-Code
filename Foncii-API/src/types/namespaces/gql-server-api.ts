// Dependencies
// Types
import { UserRoles } from "../common";
import { JwtPayload } from "jsonwebtoken";
import type express from "express";

/**
 * Enumerates the specific contents of the server's context
 * which is passed to resolvers when resolving operations.
 */
export interface ServerContext {
  /** Server response to set and send back to the client */
  response: express.Response;
  accessTokenPayload?: FonciiJWTPayload;
  refreshTokenPayload?: FonciiJWTPayload;
  /**
   * Optional Firebase ID token to pass in as a secure cookie for authenticated users from the client.
   * Used when logging the user / updating the user's login state in the database.
   */
  firebaseIDToken?: string;
  requesterSessionID?: string;
  requesterUserAgent: string;
  requesterOperatingSystem: string;
  requesterIPAddress?: string;
  /** True if a user's session should be terminated (they've lost their auth state) */
  userSessionShouldBeTerminated?: boolean;
}

/**
 * Custom claims to include inside of the JWT as payload.
 * General Reference: https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims
 */
export interface FonciiJWTPayload extends JwtPayload {
  userID: string;
  role: UserRoles;
  sessionID: string;
}

/**
 * Topics for the gql Pubsub implementation
 * to listen for when resolving subscription
 * requests through the web socket server
 */
export enum SubscriptionPubSubTopics {
  userSessionEnded = "USER_SESSION_ENDED",
}
