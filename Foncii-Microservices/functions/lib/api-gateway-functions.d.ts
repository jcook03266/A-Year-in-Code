/// <reference types="express" />
import { SupportedFonciiPlatforms } from './types/common.js';
import { Response } from "firebase-functions/v1";
import * as RESTAPI from './types/namespaces/rest-api.js';
/**
 * @param platform
 * @param response
 *
 * @returns -> True if the request is valid, false otherwise.
 */
export declare function validateCrossPlatformRequest(platform: string | undefined, response: Response): boolean;
/**
 * @async
 * @param api_key
 * @param userID
 * @param platform
 * @param response
 *
 * @returns -> True if the user is authorized to make this request, false otherwise
 */
export declare function authorizeUserRequest(api_key: RESTAPI.RequestHeaderArgument, userID: string | undefined, platform: SupportedFonciiPlatforms, response: Response): Promise<boolean>;
/**
 * @param api_key
 * @param response
 *
 * @returns -> True if the user is authorized to make this request, false otherwise
 */
export declare function authorizeRequest(api_key: RESTAPI.RequestHeaderArgument, response: Response): boolean;
