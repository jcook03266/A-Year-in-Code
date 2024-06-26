// Dependencies
// Logging
import logger from "../../foncii-toolkit/debugging/debugLogger";

// GraphQL Error Handling
import { GraphQLError } from "graphql";

/**
 * Centralized error code service class that provides error codes for specific
 * usage cases, and can optionally display error messages from a centralized source
 */
export default class ErrorCodeDispatcher {
  static HTTPStatusCodes = {
    // The request succeeded. The result meaning of "success" depends on the method (query, mutation etc)
    OK: 200,
    // The request succeeded, and a new resource was created as a result.
    CREATED: 201,
    // The server cannot or will not process the request due to something that is perceived to be a client error
    BAD_REQUEST: 400,
    // Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated". That is, the client must authenticate itself to get the requested response.
    UNAUTHORIZED: 401,
    // The client does not have access rights to the content; that is, it is unauthorized, so the server is refusing to give the requested resource. Unlike 401 Unauthorized, the client's identity is known to the server.
    FORBIDDEN: 403,
    // The server cannot find the requested resource. In the browser, this means the URL is not recognized.
    // Note: Servers may also send this response instead of 403 Forbidden to hide the existence of a resource from an unauthorized client.
    NOT_FOUND: 404,
    // The server has encountered a situation it does not know how to handle.
    INTERNAL_SERVER_ERROR: 500,
  };

  // For internal server errors
  static ServerErrors = {
    // Client either didn't pass an auth token, or the token is invalid
    UNAUTHORIZED_CLIENT: "UNAUTHORIZED_CLIENT",
  };

  // Custom Errors for generic usage cases where highly specified error codes aren't needed
  static GenericAPIErrors = {
    /// Passed identifier could locate the target resource
    ENTITY_NOT_FOUND: "ENTITY_NOT_FOUND",
    /// The required input data is missing, (username etc.)
    INPUT_MISSING: "INPUT_MISSING",
    /// The input data is not unique, (username etc.)
    INPUT_NOT_UNIQUE: "INPUT_NOT_UNIQUE",
    /// The intended operation failed gracefully and could not be completed at this time
    REQUEST_FAILED: "REQUEST_FAILED",
  };

  // Errors specific to Restaurants and associated types
  static RestaurantAPIErrors = {
    /// Invalid or unknown restaurant identifier passed resulting in no restaurant data being returned
    RESTAURANT_NOT_FOUND: "RESTAURANT_NOT_FOUND",
    /// A restaurantID for the target user resource was not given
    RESTAURANT_NOT_SPECIFIED: "USER_NOT_SPECIFIED",
  };

  // Errors specific to Users and associated types
  static UserAPIErrors = {
    /// Invalid auth token or no token passed for user dependent request
    USER_NOT_AUTHENTICATED: "USER_NOT_AUTHENTICATED",
    /// Invalid user, or unauthorized user, or suspended user trying to access restricted resource
    USER_FORBIDDEN: "USER_FORBIDDEN",
    /// Invalid or unknown user identifier passed resulting in no user data being returned
    USER_NOT_FOUND: "USER_NOT_FOUND",
    /// A userID for the target user resource was not given
    USER_NOT_SPECIFIED: "USER_NOT_SPECIFIED",
    /// User being created already exists in our database, don't overwrite user data
    USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
    /// User doesn't have the rights to write to a protected resource
    USER_NOT_AUTHORIZED: "USER_NOT_AUTHORIZED",
  };

  /**
   * Logs a given error code or message and optional stack trace (i.e function name,
   * callers, intention of the operation that resulted in the error etc.)
   *
   * @param error
   * @param stackTrace
   */
  static logError(error: string, stackTrace?: string) {
    logger.error(`Error: ${error}, Stack Trace: ${stackTrace}`);
  }

  /**
   * Throws a custom GraphQL error using the specified error code
   * and error description
   *
   * @param errorCode
   * @param errorDescription
   */
  static throwGraphQLError(
    errorCode: string,
    errorDescription: string,
    HTTPStatusCode = ErrorCodeDispatcher.HTTPStatusCodes.BAD_REQUEST
  ) {
    const error = new GraphQLError(errorDescription, {
      extensions: {
        code: errorCode,
        http: { status: HTTPStatusCode },
      }
    });

    ErrorCodeDispatcher.logError(errorCode, error.stack);

    throw error;
  }
}
