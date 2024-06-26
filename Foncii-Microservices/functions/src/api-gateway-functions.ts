// Dependencies
// Types
import { SupportedFonciiPlatforms } from './types/common.js';

// V1 Types
import { Response } from "firebase-functions/v1";

// Services
import UserService from "./services/foncii-universal/userService.js";

// Namespace Declarations
import * as RESTAPI from './types/namespaces/rest-api.js'

// Modular functions for this API gateway
/**
 * @param platform 
 * @param response 
 * 
 * @returns -> True if the request is valid, false otherwise.
 */
export function validateCrossPlatformRequest(
    platform: string | undefined,
    response: Response
): boolean {
    const isInvalid = (platform == undefined || !Object.values(SupportedFonciiPlatforms)
    .includes(platform as SupportedFonciiPlatforms));

    if (isInvalid) {
        response.status(RESTAPI.HTTPStatusCodes.NOT_FOUND)
        .send('Request missing required Foncii platform identifier parameter.');
    }

    return !isInvalid;
}

/**
 * @async
 * @param api_key 
 * @param userID 
 * @param platform 
 * @param response 
 * 
 * @returns -> True if the user is authorized to make this request, false otherwise
 */
export async function authorizeUserRequest(
    api_key: RESTAPI.RequestHeaderArgument,
    userID: string | undefined,
    platform: SupportedFonciiPlatforms,
    response: Response
): Promise<boolean> {
    // Authorization dependencies
    if (!authorizeRequest(api_key, response)) return false;

    // Properties
    const userService = new UserService();

    // Validate user input data
    if (userID == undefined || userID == "") {
        response.status(RESTAPI.HTTPStatusCodes.NOT_FOUND).send('Request missing required user identifier parameter.');
    }

    const userExists = await userService.doesUserExist(userID!, platform as SupportedFonciiPlatforms);

    if (!userExists) {
        response.status(RESTAPI.HTTPStatusCodes.BAD_REQUEST).send(`The specified user does not exist on the target Foncii platform ${platform}.`);
    }

    return userExists;
}

/**
 * @param api_key 
 * @param response 
 * 
 * @returns -> True if the user is authorized to make this request, false otherwise
 */
export function authorizeRequest(api_key: RESTAPI.RequestHeaderArgument, response: Response): boolean {
    // Authorization
    if (api_key != process.env.FONCII_SERVER_API_KEY) {
        response.status(RESTAPI.HTTPStatusCodes.UNAUTHORIZED).send('Required API key value pair missing in request header.')
    }

    return api_key == process.env.FONCII_SERVER_API_KEY;
}