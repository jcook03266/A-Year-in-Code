// Dependencies
// Types
import { AggregationSortOrders, FonciiDBCollections } from "../../../types/namespaces/database-api";
import { SupportedFonciiPlatforms } from "../../../types/namespaces/microservice-api";
import express from 'express';

// Models
import UserSessionModel from "../../../models/shared/userSessionModel";

// Services
import { DatabaseServiceAdapter } from "../../services/database/databaseService";

// Managers
import AuthManager from "../auth/authManager";

// Utilities
import { computeDistanceBetweenCoordinatePoints } from "../../../foncii-toolkit/math/euclideanGeometryMath";
import { currentDateAsISOString, currentDateAsMSTime, getMSTimeFromDateString } from "../../../foncii-toolkit/utilities/convenienceUtilities";
import { UnitsOfTimeInMS } from "../../../foncii-toolkit/utilities/time";

// Logging
import logger from "../../../foncii-toolkit/debugging/debugLogger";

// Local Types
type UserSessionSortOptions = { [K in keyof Partial<UserSession>]: AggregationSortOrders };
type UserSessionPropertyOptions = { [K in keyof Partial<UserSession>]: any };

/**
 * Manages the life cycle of user sessions
 */
export default class UserSessionManager {
    // Properties
    private platform: SupportedFonciiPlatforms = SupportedFonciiPlatforms.foncii;

    // Services
    database = new DatabaseServiceAdapter();

    // Managers
    authManager = () => new AuthManager(this.platform);

    // Properties
    /**
     * A heart beat signal must be sent every minute from the client to keep
     * the session alive. The server will assume the session is dead if the
     * last heart beat / update exceeds this time threshold below: 30 minutes
     * 
     * ~ Can be adjusted as needed when we analyze user behavior patterns and see 
     * how users behave between sessions and if the session duration is too long or too short.
     */
    private static SESSION_HEART_BEAT_INACTIVITY_THRESHOLD = 30 * UnitsOfTimeInMS.minute;

    /**
     * The client is required to send a heart beat signal every minute (60 seconds)
     * to inform the backend that the user is active and using the application. If the
     * client doesn't then the user is deemed inactive but the session is kept alive until
     * the user becomes active again
     */
    private static SESSION_HEART_BEAT_INTERVAL = UnitsOfTimeInMS.minute;

    /**
     * The maximum time for the last heart beat / update to have occurred in order for the session to still be alive
     * @returns -> ISO-8601 formatted date string to be used to compare other ISO-8601 date strings in the database with
     */
    currentMaxLastHeartBeatThresholdOffset = (): string => new Date(currentDateAsMSTime() - UserSessionManager.SESSION_HEART_BEAT_INACTIVITY_THRESHOLD).toISOString();

    /**
     * The minimum time for the last heart beat / update to have occurred in order for the session to still be 'active' (> 1 minute ago)
     * @returns -> ISO-8601 formatted date string to be used to compare other ISO-8601 date strings in the database with
     */
    currentMinLastHeartBeatThresholdOffset = (): string => new Date(currentDateAsMSTime() - UserSessionManager.SESSION_HEART_BEAT_INTERVAL).toISOString();

    // Reusable Database Ops
    async findUserSessionWith(
        properties: UserSessionPropertyOptions
    ) {
        const result = await this.database
            .paginatableAggregationPipeline<UserSession>({
                collectionName: FonciiDBCollections.UserSessions,
                properties,
                resultsPerPage: 1
            });

        return result.length > 0 ? result[0] : null;
    }

    async findUserSessionsWith({
        properties = {},
        resultsPerPage = 100,
        paginationPageIndex = 0,
        sortOptions
    }: {
        properties?: UserSessionPropertyOptions,
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: UserSessionSortOptions
    }) {
        return await this.database
            .paginatableAggregationPipeline<UserSession>({
                collectionName: FonciiDBCollections.UserSessions,
                properties,
                resultsPerPage,
                paginationPageIndex,
                sortOptions
            });
    }

    async countTotalSessionsWith(properties: UserSessionPropertyOptions) {
        return await this.database.countTotalDocumentsWithProperties(
            FonciiDBCollections.UserSessions,
            properties
        );
    }

    async doesUserSessionExistWith(properties: UserSessionPropertyOptions) {
        return (await this.countTotalSessionsWith(properties)) > 0;
    }

    // CRUD Mutation Ops
    async createSession(
        initialProperties:
            UserSessionPropertyOptions & {
                userID?: string,
                platform: SupportedFonciiPlatforms,
                deviceID: string,
                userAgent: string,
                operatingSystem: string,
                language: string,
                ipAddress?: string,
                clientGeolocation?: CoordinatePoint,
                amplitudeSessionID?: number
            }
    ) {
        const userSession = new UserSessionModel({
            ...initialProperties,
            clientGeolocationHistory: initialProperties.clientGeolocation != undefined ? [initialProperties.clientGeolocation] : [],
            currentClientGeolocation: initialProperties.clientGeolocation,
            sessionDuration: 0,
            isSuspicious: false,
            terminated: false
        }),
            documentID = userSession.id;

        // Precondition failure
        if (userSession == undefined) return null;

        // This pre-process terminates the last session for the target device if the last session is still alive.
        const currentSessionForDevice = await this.getCurrentSessionForDevice(initialProperties.deviceID);

        // If a session already exists and is alive then return it to prevent unnecessary sessions
        if (currentSessionForDevice) return currentSessionForDevice;

        const didSucceed = await this.database.createNewDocumentWithID(
            FonciiDBCollections.UserSessions,
            documentID,
            userSession.toObject()
        );

        return didSucceed ? userSession : null;
    }

    private async updateSession({
        sessionID,
        properties
    }: {
        sessionID: string
        properties: UserSessionPropertyOptions
    }) {
        const documentID = sessionID,
            updatedProperties = {
                ...properties,
                lastUpdated: currentDateAsISOString(), // Will overwrite any property named 'lastUpdated' as intended if included
            }

        return await this.database
            .updateFieldsInDocumentWithID(
                FonciiDBCollections.UserSessions,
                documentID,
                updatedProperties);
    }

    /**
     * Marks all active and alive sessions for the curretn user with
     * the given user uid as terminated to prevent them from being used further.
     * 
     * @async
     * @param userID 
     */
    async endAllSessionsForUser(userID: string) {
        const allAliveSessions = await this.getAllAliveSessionsFor(userID);

        await Promise.all(
            allAliveSessions.map(async (session) => {
                await this.endSession(session.id);
            })
        );
    }

    async endSession(sessionID: string) {
        const sessionExists = await this.doesUserSessionExistWith({ id: sessionID, terminated: false });

        // Can't end a non-existent / already terminated session
        if (!sessionExists) return false;

        const documentID = sessionID,
            updatedProperties = {
                terminated: true
            } as UserSessionPropertyOptions

        logger.info('User session: ', sessionID, ' terminated at:', currentDateAsISOString());

        return await this.database
            .updateFieldsInDocumentWithID(
                FonciiDBCollections.UserSessions,
                documentID,
                updatedProperties
            );
    }

    /**
     * This shouldn't be used in a production scenario as sessions are not volatile, 
     * it's just implemented for any development related purposes.
     */
    async deleteSessionWithID(sessionID: string) {
        return await this.database
            .deleteDocumentWithID(
                FonciiDBCollections.UserSessions,
                sessionID);
    }

    // Query Ops
    async getSessionWithID(sessionID: string) {
        return await this.database.findDocumentWithID<UserSession>(FonciiDBCollections.UserSessions, sessionID);
    }

    /**
     * @async
     * @param userID 
     * 
     * @returns -> The currently active session for the user with the given ID. An active session is a session
     * that was last updated (received a heart beat signal less than the required threshold time ~ 30 minutes ago for example)
     */
    async getCurrentSessionForUser(userID: string) {
        return await this.findUserSessionWith({
            userID,
            lastUpdated: { $gte: this.currentMaxLastHeartBeatThresholdOffset() },
            terminated: false
        });
    }

    /**
     * @async
     * @param userID 
     * 
     * @returns -> The currently active session for the device with the given device ID. An active session is a session
     * that was last updated (received a heart beat signal less than the required threshold time ~ 30 minutes ago for example)
     */
    async getCurrentSessionForDevice(deviceID: string) {
        return await this.findUserSessionWith({
            deviceID,
            lastUpdated: { $gte: this.currentMaxLastHeartBeatThresholdOffset() },
            terminated: false
        });
    }

    // Useful for merging all sessions across a user's device
    async getAllDeviceSessionsForUser(args: {
        userID: string,
        deviceID: string
    }) {
        return (await this.findUserSessionsWith({ properties: args }));
    }

    async getAllSessionsForDevice(args: { deviceID: string }) {
        return (await this.findUserSessionsWith({ properties: args }));
    }

    async getAllAliveUserSessions() {
        return (await this.findUserSessionsWith({
            properties: {
                lastUpdated: { $gte: this.currentMaxLastHeartBeatThresholdOffset() },
                terminated: false
            },
            sortOptions: {
                lastUpdated: -1
            }
        }));
    }

    async getLatestActiveUserSessionFor(userID: string): Promise<UserSession | null> {
        const sessions = (await this.findUserSessionsWith({
            properties: {
                userID,
                lastUpdated: { $gte: this.currentMinLastHeartBeatThresholdOffset() },
                terminated: false
            },
            sortOptions: {
                lastUpdated: -1
            },
            resultsPerPage: 1
        }));

        return sessions[0];
    }

    async getAllActiveUserSessions() {
        return (await this.findUserSessionsWith({
            properties: {
                lastUpdated: { $gte: this.currentMinLastHeartBeatThresholdOffset() },
                terminated: false
            },
            sortOptions: {
                lastUpdated: -1
            }
        }));
    }

    /**
     * @async
     * @param userID 
     * 
     * @returns -> A list of active user sessions. Active sessions are sessions which are still
     * within the minimum last heart beat period, if the last update was less or equal to this offset
     * then the session is no longer active, but is maybe still alive if it's greater than the
     * current value for `currentMaxLastHeartBeatThresholdOffset`.
     */
    async getAllActiveSessionsFor(userID: string) {
        return (await this.findUserSessionsWith({
            properties: {
                userID,
                lastUpdated: { $gte: this.currentMinLastHeartBeatThresholdOffset() },
                terminated: false
            },
            resultsPerPage: 0
        }));
    }

    /**
     * @async
     * @param userID 
     * 
     * @returns -> A list of alive user sessions. Active sessions are sessions which are still
     * within the maximum last heart beat period, if the last update was less or equal to this offset
     * then the session is no longer alive.
     */
    async getAllAliveSessionsFor(userID: string) {
        return (await this.findUserSessionsWith({
            properties: {
                userID,
                lastUpdated: { $gte: this.currentMaxLastHeartBeatThresholdOffset() },
                terminated: false
            },
            resultsPerPage: 0
        }));
    }

    /**
     * Useful for merging all devices used by a user and then merging all sessions across 
     * those devices, effectively connecting all user sessions together
     * so long as the person has established an authenticated session at least once on all devices.
     * 
     * @async
     * @param userID 
     * 
     * @returns -> All user sessions that have ever been created by / associated with the given user.
     */
    async getAllSessionsForUser(args: { userID: string }) {
        return (await this.findUserSessionsWith({ properties: args }));
    }

    // Specialized Methods
    /**
     * Determines if the session is valid (the session exists and is alive and is not deemed 
     * suspicious) or not.
     * 
     * @async
     * @param sessionID 
     * 
     * @returns -> True the session exists and is alive and is not deemed 
     * suspicious, false the session does not exist or is not alive and or is
     * marked as suspicious.
     */
    async isUserSessionValid(sessionID: string): Promise<Boolean> {
        const session = await this.getSessionWithID(sessionID);

        // No session exists with the given ID, not valid
        if (!session) return false;

        return !session.isSuspicious && UserSessionManager.isSessionAlive(session);
    }

    // Subscription
    // /**
    //  * Subscribes to updates to the given user's session activity
    //  * via webhook.
    //  *
    //  * @async
    //  * @param userID 
    //  */
    // async subscribeToUserActivity(userID: string) {

    // }

    /**
     * Resolves heart beat signals sent from the client to keep their session alive or to 
     * create new sessions in case their old session died out.
     * 
     * @async
     * @param sessionID
     * @param clientGeolocation
     * @param forceTerminate -> True if the session should be force terminated and sent back to 
     * the client so that the client can be forced to end any unauthorized session.
     * 
     * @returns -> Null if no session exists for the given ID, and user session if 
     * the heart beat signal was resolved. If the session is not alive a new session is 
     * created automatically and the old session is retired. If the session is alive it's
     * updated and returned.
     */
    async resolveHeartBeatSignal({
        sessionID,
        clientGeolocation,
        forceTerminate = false,
        response
    }: {
        sessionID: string,
        clientGeolocation?: CoordinatePoint,
        forceTerminate?: boolean,
        response: express.Response
    }): Promise<UserSession | null> {
        const userSession = await this.getSessionWithID(sessionID);

        // No session exists with that ID
        if (!userSession) return null;

        // Remove any secure JWT access tokens from the requesting client alongside terminating their session
        if (forceTerminate) AuthManager.clearSecureJWTCookies(response);

        if (UserSessionManager.isSessionAlive(userSession)) {
            // Security
            const userID = userSession.userID,
                isSuspicious = UserSessionManager.isSessionSuspicious({ session: userSession, newCoordinatePoint: clientGeolocation });

            // Terminate all active sessions + revoke all refresh tokens
            if (isSuspicious && userID) {
                await this.authManager().invalidateAllAuthStatesForUser(userID);
                AuthManager.clearSecureJWTCookies(response);
            }

            // Update
            const updatedSession = new UserSessionModel({
                ...userSession,
                // Important: Due to weird behavior and memory access weirdness 'updateClientGeolocationHistory' mutates the history array, so 'isSessionSuspicious' has to come first
                isSuspicious: isSuspicious,
                terminated: forceTerminate || isSuspicious,
                clientGeolocationHistory: UserSessionManager.updateClientGeolocationHistory({ session: userSession, newCoordinatePoint: clientGeolocation }),
                currentClientGeolocation: clientGeolocation ?? userSession.currentClientGeolocation, // Don't replace a defined user location, use the last known location if the new location is undefined
                sessionDuration: UserSessionManager.computeSessionDurationInMS(userSession),
            });

            const didSucceed = await this.updateSession({
                sessionID: updatedSession.id,
                properties: updatedSession.toObject()
            })

            // Return the old session if the update wasn't successful in order to allow the client to keep functioning like normal
            // until the next heart beat signal is sent. The server may be experiencing issues so it's important to not
            // disrupt the client's session if this is the case.
            return didSucceed ? updatedSession : userSession;
        }
        else {
            // Terminate the inactive session and create a new one
            await this.endSession(sessionID);

            // Create a new session to respond to heart beats
            return await this.createSession({
                ...userSession,
                // Pass in the force terminate flag so that the client can be forced to end any unauthorized session
                terminated: forceTerminate,
                clientGeolocation
            });
        }
    }

    // Helper Methods
    static isSessionActive(session: UserSession): boolean {
        if (session.terminated) return false;

        const { lastUpdated } = session,
            lastHeartBeatTime = getMSTimeFromDateString(lastUpdated);

        return currentDateAsMSTime() <= (this.SESSION_HEART_BEAT_INTERVAL + lastHeartBeatTime);
    }

    static isSessionAlive(session: UserSession): boolean {
        if (session.terminated) return false;

        const { lastUpdated } = session,
            lastHeartBeatTime = getMSTimeFromDateString(lastUpdated);

        return currentDateAsMSTime() < (this.SESSION_HEART_BEAT_INACTIVITY_THRESHOLD + lastHeartBeatTime);
    }

    /**
     * Determines whether or not the user's session is suspicious or not. A session is deemed
     * suspicious if their geolocation data (if any) changes drastically in a short period of time.
     * If the user's new location is 120+ miles away from their last location their session is deemed suspicious
     * and their auth state should be invalidated which translates to signing them out of every active client session.
     * Given the current heart beat aliveness threshold of 30 minutes ~, it's unlikely the user will travel this far 
     * in that amount of time.
     * 
     * @param session
     * @param newCoordinatePoint 
     * 
     * @returns -> True if the user's new location is 120+ miles 
     * away from their last location, false otherwise. Given the current 
     * heart beat aliveness threshold of 30 minutes ~, it's unlikely the 
     * user will travel this far in that amount of time. Refine this logic as 
     * needed, but for now this is a good starting point for determining 
     * the validity of user sessions relative to dynamic temporal and geospatial factors. 
     */
    static isSessionSuspicious({
        session,
        newCoordinatePoint
    }: {
        session: UserSession,
        newCoordinatePoint?: CoordinatePoint
    }): boolean {
        const existingClientHistory: CoordinatePoint[] = session.clientGeolocationHistory ?? [];

        if (!newCoordinatePoint || existingClientHistory.length < 1) return session.isSuspicious;
        else if (session.isSuspicious == true) return true;

        const lastCoordinatePoint = existingClientHistory[existingClientHistory.length - 1],
            newLocationIsTooFar = lastCoordinatePoint && computeDistanceBetweenCoordinatePoints(newCoordinatePoint, lastCoordinatePoint) >= 200;

        if (newLocationIsTooFar) {
            logger.warn(`Suspicious session activity detected for session: ${session.id} at: ${currentDateAsISOString()}`)
        }

        return newLocationIsTooFar;
    }

    /**
     * Updates the passed client geolocation history with the latest coordinate point so long 
     * as the coordinate point is far enough to delegate a meaningful travel insight from the 
     * user's session (i.e >= 0.25[km] ~ 800 feet of distance which can sometimes take you from
     * one neighborhood to the next like in the case of Manhattan)
     * 
     * @param existingClientHistory
     * @param newCoordinatePoint
     *  
     * @returns -> Updated client geolocation history array with the newest location if it's not
     * too close (< 0.25[km]) to the last coordinate point
     */
    private static updateClientGeolocationHistory({
        session,
        newCoordinatePoint
    }: {
        session: UserSession,
        newCoordinatePoint?: CoordinatePoint
    }): CoordinatePoint[] {
        const existingClientHistory: CoordinatePoint[] = session.clientGeolocationHistory ?? [];

        // Precondition failure
        if (!newCoordinatePoint) return existingClientHistory;

        if (existingClientHistory.length > 0) {
            const lastCoordinatePoint = existingClientHistory[existingClientHistory.length - 1],
                newLocationIsTooClose = lastCoordinatePoint && computeDistanceBetweenCoordinatePoints(newCoordinatePoint, lastCoordinatePoint) < 0.25;

            if (!newLocationIsTooClose) {
                existingClientHistory.push(newCoordinatePoint)
            }
        }
        else {
            existingClientHistory.push(newCoordinatePoint)
        }

        return existingClientHistory;
    }

    /**
     * Computes session duration relative to the last update (heart beat signal)
     * and returns the time in [ms]
     * 
     * @param session
     * 
     * @returns -> Session duration in [ms]
     */
    static computeSessionDurationInMS(session: UserSession): number {
        const {
            creationDate,
            lastUpdated
        } = session;

        const startDateTime = getMSTimeFromDateString(creationDate),
            endDateTime = getMSTimeFromDateString(lastUpdated);

        return Math.abs(endDateTime - startDateTime);
    }

    /**
     * Computes the session duration relative to the current time
     * and returns the time in [ms]
     * 
     * @param session
     * 
     * @returns -> Session duration in [ms]
     */
    static computeRelativeSessionDurationInMS(session: UserSession): number {
        const { creationDate } = session;

        const startDateTime = getMSTimeFromDateString(creationDate),
            endDateTime = currentDateAsMSTime();

        return Math.abs(endDateTime - startDateTime);
    }
}