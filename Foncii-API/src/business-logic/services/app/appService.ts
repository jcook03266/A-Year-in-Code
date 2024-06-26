// Dependencies
// Types
import {
    FonciiJWTPayload,
    ServerContext,
} from "../../../types/namespaces/gql-server-api";
import { SupportedFonciiPlatforms } from "../../../types/namespaces/microservice-api";

// File System
import fs from 'fs';

// Apollo Server SDK
import { ApolloServer } from "@apollo/server";
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";

// Apollo Plugins
import {
    ApolloServerPluginInlineTrace,
    ApolloServerPluginInlineTraceOptions,
} from "@apollo/server/plugin/inlineTrace";
import { ApolloServerPluginUsageReporting } from "@apollo/server/plugin/usageReporting";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

// Express, CORS, and HTTP
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

// Websocket
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

// Logging
import logger from "../../../foncii-toolkit/debugging/debugLogger";

// Schema Definitions
import schema from "../../../graphql/schema/executableSchema";

// Error Coding
import ErrorCodeDispatcher from "../../../core-foncii/error-coding/errorCodeDispatcher";

// Services
import FonciiMapsPostService from "../foncii-maps/user-posts/fmPostService";
import FMIntegrationCredentialService from "../foncii-maps/users/fmIntegrationCredentialService";
import InstagramAPIService from "../foncii-maps/user-posts/integrations/instagram-api/instagramAPIService";
import UserService from "../shared/users/userService";

// Managers
import AuthManager from "../../managers/auth/authManager";
import { MicroserviceRepository } from "../../../core-foncii/microservices/repository/microserviceRepository";
import { FMIntegrationProviders } from "../../../types/common";
import PostImportationService from "../foncii-maps/user-posts/postImportationService";

// Express Middleware Integration
// Required logic for integrating with Express
const app = express();

// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);
const webSocketServer = new WebSocketServer({
    server: httpServer,
    path: "/", // Same path as middleware
});

// Websocket lifecycle
const webSocketServerCleanUp = useServer({ schema }, webSocketServer);

// Service class encapsulated Apollo Server + Express App Server definitions functionality
export default class AppService {
    // Server Properties & Defs
    server;
    accessPort = process.env.PORT || 8080;

    constructor() {
        this.server = new ApolloServer({
            schema,
            introspection: true,
            cache: new InMemoryLRUCache({
                // ~500MiB
                maxSize: Math.pow(2, 20) * 500,
                // 10 minutes (in seconds)
                ttl: 600,
            }),
            plugins: [
                ApolloServerPluginUsageReporting({
                    sendVariableValues: { exceptNames: ["accessToken"] }, // Send all non-sensitive variable values
                    sendErrors: { unmodified: true }, // Include errors, don't mask them, we can format errors manually
                }),
                ApolloServerPluginInlineTrace({
                    unmodified: true
                } as ApolloServerPluginInlineTraceOptions), // Include unmasked error descriptions
                // Disable the landing page in production, it's not usable and directly tells people we use GraphQL on our backend
                ApolloServerPluginLandingPageLocalDefault(),
                // Proper shutdown for the HTTP server.
                ApolloServerPluginDrainHttpServer({ httpServer: httpServer }),
                // Proper shutdown for the WebSocket server.
                {
                    // Clean up any lingering web socket connections to prevent memory leaks
                    async serverWillStart() {
                        return {
                            async drainServer() {
                                await webSocketServerCleanUp.dispose();
                            },
                        };
                    },
                },
            ],
        });
    }

    // Various settings for the application to adhere to
    configureSettings() {
        // Enable trust for proxies
        app.set('trust proxy', true);
    }

    // Routing logic for apollo server and other custom endpoint implementations
    configureRoutes() {
        // Serve favicon.ico for api server URL metadata
        app.get('/favicon.ico', ({ res }) => {
            const FAVICON_FILE_PATH = 'favicon.ico';

            // Pipe the favicon image to the response
            if (res) {
                res?.setHeader('Content-Type', 'image/x-icon');
                fs.createReadStream(FAVICON_FILE_PATH).pipe(res);
            }

            return;
        });

        /**
         * Custom common middleware to handle /_ah/start endpoint for basic / manual App Engine scaling
         * Sending an 'OK' status of 200 tells the instance that it can start
         */
        app.use("/_ah/start", ({ res }) => {
            return res?.status(200).send("OK");
        });

        /**
         * Health check route for polling the api server to determine whether or not the server is 
         * up and running as expected.
         */
        app.get("/health-check", ({ res }) => {
            return res?.status(200).send("OK");
        });

        /**
         * Use this route to resolve any pending deletions as needed. This will be triggered using a
         * periodic job that fires once a day to delete any user posts currently up for deletion.
         */
        app.post("/resolve-pending-deletions", async ({ res }) => {
            const fmPostService = new FonciiMapsPostService(),
                didSucceed = await fmPostService.resolvePendingDeletions();

            if (didSucceed) {
                return res?.status(200)
                    .send("Pending Post Deletions Resolved Successfully");
            } else {
                return res?.status(500)
                    .send("Pending Post Deletions Could Not Be Resolved Properly");
            }
        });

        /**
         * Use this route to refresh the user's map with new posts + classifications. This is 
         * meant to be used by a CRON job to refresh user posts automatically without any
         * further input from anybody.
         * 
         * This covers both users with integration credentials / connected Instagram accounts
         * and without (most likely auto-generated users)
         */
        app.post("/automatic-influencer-map-refresh-instagram", async ({ res }) => {
            // Service defs
            const userService = new UserService(),
                integrationCredService = new FMIntegrationCredentialService();

            // Constants
            // Load up to 20 posts to update / refresh the user's map with
            const MAX_POST_REFRESH_AMOUNT = 20,
                USERS_PER_PAGE = 100;

            // Pagination control
            let currentPage = 0;

            // Iterate through all users and refresh their maps
            let users = await userService.getAllUsers(USERS_PER_PAGE, currentPage);

            while (users.length > 0) {
                Promise.all(users.map(async (user) => {
                    // Parsing
                    const userID = user.id,
                        username = user.username;

                    // Get the user's connected integration credential for Instagram (if it exists)
                    const igIntegrationCredential = await integrationCredService
                        .findIntegrationCredentialWith({
                            userID,
                            provider: FMIntegrationProviders.Instagram
                        });

                    // User hasn't connected their Instagram yet, we have to do the brute force approach and scrape 
                    // their social media to refresh their map with new posts + classifications.
                    if (!igIntegrationCredential) {
                        // This is usually the case, the user's Instagram username is their Foncii username. 
                        // keep in mind there may be cases where this isn't true, but for the majority of users without 
                        // existing integration creds this will work since we probably scraped their Instagram in the first place 
                        // to create their account. This endpoint is fault tolerant as well so it won't try to 
                        // insert ingested information for a user that doesn't exist.
                        const fonciiUsername = username,
                            instagramUsername = fonciiUsername;

                        return await MicroserviceRepository.fonciiInstascraper()
                            .classifyAndIngestPosts({
                                fonciiUsername,
                                instagramUsername,
                                postAmount: MAX_POST_REFRESH_AMOUNT
                            });
                    }

                    // Try to import posts like normal with the fetched integration credential
                    const postImportationService = new PostImportationService(
                        igIntegrationCredential
                    );

                    return await postImportationService.importPosts({
                        useAuxillaryService: true,
                        classificationEnabled: true,
                        isFirstImport: false
                    });
                }));

                // Move to the next page
                currentPage += 1;
                users = await userService.getAllUsers(USERS_PER_PAGE, currentPage);
            }

            return res?.status(200)
                .send("Automatic Influencer Map Refresh Successful");
        });

        app.post(
            "/ig-deauth",
            bodyParser.urlencoded({ extended: true }),
            async (req, res) => {
                const signedRequest = req.body["signed_request"];

                // Verify input
                if (
                    typeof signedRequest !== "string" ||
                    signedRequest.length < 3 ||
                    !signedRequest.includes(".")
                )
                    return res.status(400).send("Malformed signed request");

                const appScopedUID =
                    InstagramAPIService.parseUIDFromSignedRequestPayload(signedRequest);

                // Precondition failure, request invalid
                if (!appScopedUID) return res.status(400).end("Invalid signed request");

                const fmIntegrationCredentialService =
                    new FMIntegrationCredentialService(),
                    didSucceed = await fmIntegrationCredentialService
                        .revokeIntegrationCredentialWithAppScopedUID(
                            appScopedUID
                        );

                if (didSucceed) {
                    return res
                        .status(200)
                        .send("Instagram user deauthenticated successfully");
                } else {
                    return res
                        .status(500)
                        .send("Instagram user deauthentication failed.");
                }
            }
        );

        /**
         * Specify no-index for search engines. We don't want the apollo
         * landing page being indexed and shown amongst our search results.
         */
        app.use("/robots.txt", ({ res }) => {
            res?.type("text/plain");
            res?.send("User-agent: *\nDisallow: /");
        });

        /**
         * Set up our Express middleware to handle CORS, body parsing,
         * and our expressMiddleware function.
         */
        app.use(
            "/",
            cookieParser(),
            cors({
                // Allows requests from other servers with no request origin and validates requests from browser contexts where the
                // request origin is specified. Only white-listed origins are allowed to access this api. All other request origins
                // are blocked by CORS and an error will be thrown if this api is accessed from other origins.
                origin(requestOrigin, callback) {
                    // [Browsers only] Explicitly accept requests from and authorize credential passing from these request origins only
                    const whitelistedOrigins = [
                        "http://localhost:3000",
                        "https://foncii.com",
                        "https://www.foncii.com",
                        "https://maps.foncii.com",
                        "https://www.maps.foncii.com",
                        "https://staging.foncii.com",
                        "http://localhost:8080",
                        "https://studio.apollographql.com",
                        "https://main--foodie-supergraph.apollographos.net",
                    ];

                    // Validate incoming request origin (if any), otherwise approve requests coming from other servers
                    if (requestOrigin) {
                        // Request sent from browser / client side context
                        if (whitelistedOrigins.includes(requestOrigin)) {
                            return callback(null, true);
                        } else {
                            // Origin not explicitly allowed
                            callback(
                                new Error(
                                    `Request origin: ${requestOrigin} is not allowed by the current CORS policy. Include it in the white-list if it is a valid request origin.`
                                )
                            );
                        }
                    } else {
                        // Request sent from another server / SSR context, no origin
                        return callback(null, true);
                    }
                },
                credentials: true,
            }),
            // 50mb is the limit that `startStandaloneServer` uses, but you may configure this to suit your needs
            bodyParser.json({ limit: "50mb" }),
            // expressMiddleware accepts the same arguments:
            // an Apollo Server instance and optional configuration options
            expressMiddleware(this.server, {
                context: async ({ req, res }): Promise<ServerContext> => {
                    // Headers
                    const authToken = req.headers.authorization || "",
                        fonciiPlatform = (req.headers["foncii-platform"] !== "undefined" ? req.headers["foncii-platform"] : undefined) as SupportedFonciiPlatforms | undefined,
                        firebaseIDToken = (req.headers["firebase-user-id-token"] !== "undefined" ? req.headers["firebase-user-id-token"] : undefined) as string | undefined,
                        sessionID = (req.headers["sessionid"] !== "undefined" ? req.headers["sessionid"] : undefined) as string | undefined,
                        requesterUserAgent = (req.headers["user-agent"] as string) ?? "",
                        requesterOperatingSystem = (req.headers["sec-ch-ua-platform"] as string) ?? "",
                        // Debug Note: Getting ::1 is normal, it's the internal IP when using a local host ~ loop back address that routes back to the local system
                        // https://www.sciencedirect.com/topics/computer-science/loopback-address#:~:text=It%20is%20an%20internal%20address,0%3A1%20or%20%3A%3A1.
                        requesterIPAddress = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress;

                    // Cookies
                    const cookies: { [key: string]: string } = req.cookies ?? {},
                        parsedAccessToken: string | undefined = cookies["access-token"],
                        parsedRefreshToken: string | undefined = cookies["refresh-token"];

                    // API Key / Auth Token Authorization - For all users
                    // Validate the request and throw if invalid (doesn't contain a basic auth token for talking to the api)
                    await this.simpleAuthorizationGateway({ authToken });

                    // JWT Authorization - For authenticated users
                    let accessTokenPayload: FonciiJWTPayload | undefined,
                        refreshTokenPayload: FonciiJWTPayload | undefined;

                    // Use refresh token (if available) to refresh the access token and consume itself to create a new refresh token
                    if (parsedRefreshToken) {
                        const { accessToken, refreshToken } =
                            (await this.jwtAuthorizationGateway({
                                platform: fonciiPlatform ?? SupportedFonciiPlatforms.foncii, // Default to the Foncii platform if not provided
                                // Undefined when token expires on the client, not required, the refresh token is required
                                accessToken: parsedAccessToken,
                                refreshToken: parsedRefreshToken,
                            })) ?? {};

                        // Decode the validated access token (if any)
                        accessTokenPayload = AuthManager.decodeJWT(accessToken);
                        refreshTokenPayload = AuthManager.decodeJWT(refreshToken);

                        // Set the updated secure jwt cookies in the response to return to the client
                        if (accessToken && refreshToken) {
                            AuthManager.setSecureJWTCookies({
                                accessToken,
                                refreshToken,
                                res,
                            });
                        }
                    }

                    /**
                     * The requester specified some access token or refresh token, but no valid access token
                     * was created / retrieved and decoded. The requester is making an invalid auth request
                     * using expired or malformed credentials and should be terminated to invalidate any
                     * unauthorized auth state on the client side.
                     */
                    const userHasFirebaseIDToken = firebaseIDToken != undefined,
                        userHasFonciiRefreshToken = parsedRefreshToken != undefined,
                        userAuthenticated = userHasFirebaseIDToken || userHasFonciiRefreshToken,
                        validAccessTokensAbsent = !accessTokenPayload || !refreshTokenPayload,
                        userSessionShouldBeTerminated = userAuthenticated && validAccessTokensAbsent;

                    return {
                        response: res,
                        accessTokenPayload,
                        refreshTokenPayload,
                        firebaseIDToken,
                        requesterSessionID: sessionID,
                        requesterUserAgent,
                        requesterOperatingSystem,
                        // Pass the requesting client's IP address to the context from the request object
                        requesterIPAddress,
                        userSessionShouldBeTerminated,
                    };
                },
            })
        );
    }

    /**
     * Starts Express application and connects Express to Apollo Server instance.
     */
    async startServer() {
        logger.info(`Starting server...`);
        await this.server.start();

        // Modified server startup
        await new Promise((resolve: any) =>
            httpServer.listen({ port: this.accessPort }, resolve)
        );

        // Server Diagnostics
        logger.info(`First Runtime: ${new Date()}`);
        logger.info(`SERVER RUNNING ON PORT ${this.accessPort}`);
        logger.info(
            `🚀 HTTP Server Ready At: http://localhost:${this.accessPort}/`
        );
        logger.info(
            `🚀 WebSocket Server Ready At: ws://localhost:${this.accessPort}/`
        );
        logger.level =
            process.env.LOGGER_LEVEL ||
            (process.env.NODE_ENV === "production" ? "warn" : "debug");

        this.configureSettings();
        this.configureRoutes();
    }

    async stopServer() {
        if (this.server == undefined) return;
        await this.server.stop();
    }

    /**
     * Refreshes the access token and refresh token if the access token has expired and
     * returns the new valid access token and refresh token. But, if the access token passed in
     * is still valid both original tokens are returned to be used again later since they're still valid.
     *
     * @async
     * @param accessToken -> Defined if the access token is still valid, undefined if the access token has expired on the client.
     * @param refreshToken
     *
     * @returns -> A valid access token and refresh token if the refresh token passed in was valid
     * and can be used to create more access tokens and refresh tokens, undefined otherwise.
     */
    private async jwtAuthorizationGateway({
        platform,
        accessToken,
        refreshToken,
    }: {
        platform: SupportedFonciiPlatforms;
        accessToken?: string;
        refreshToken: string;
    }): Promise<
        | {
            accessToken: string;
            refreshToken: string;
        }
        | undefined
    > {
        const authManager = new AuthManager(platform);

        // Validate the given access token and refresh token
        const accessTokenIsValid = AuthManager.verifyJWT(accessToken),
            decodedRefreshToken = AuthManager.decodeJWT(refreshToken),
            accessTokenWillExpireSoon = accessToken
                ? AuthManager.willJWTExpireSoon(accessToken)
                : false,
            refreshTokenID = decodedRefreshToken?.jti,
            refreshTokenIsValid = refreshTokenID
                ? await authManager.isRefreshTokenRecordValid(refreshTokenID)
                : false;

        // The refresh token either doesn't have an identifier or its remote record has been marked as invalidated and the token can't be
        // used anymore. Return and let the server handle invalidating any affected user session.
        if (!refreshTokenIsValid || !refreshTokenID) return undefined;

        // Refresh the access token and generate a new refresh token if required, else
        // return the existing valid tokens.
        if (!accessTokenIsValid || !accessToken || accessTokenWillExpireSoon) {
            return await authManager.refreshAccessToken(refreshTokenID);
        } else {
            return {
                accessToken,
                refreshToken,
            };
        }
    }

    /**
     * Runs the current request through the authentication criteria to ensure the
     * client sending the request is authorized to access its resources.
     * Note: When the server is in development mode no authorization is required
     *
     * @param authToken
     * @throws {GraphQLError} if the requester is not authorized
     */
    private async simpleAuthorizationGateway({
        authToken,
    }: {
        authToken?: string;
    }): Promise<never | void> {
        // Development mode
        if (process.env.NODE_ENV == "local") return;

        // Production mode
        // Bearer Token
        if (authToken)
            if (AppServiceAuthAdapter.detectBearerToken(authToken)) {
                const bearerToken = AppServiceAuthAdapter.stripBearerToken(authToken),
                    saltedAPIKey =
                        process.env.FONCII_SERVER_API_SECRET +
                        process.env.API_KEY_SALT_SECRET;

                if (saltedAPIKey == AppServiceAuthAdapter.decodeAuthToken(bearerToken))
                    return;
            }

        // Throw if all else falls through
        ErrorCodeDispatcher.throwGraphQLError(
            ErrorCodeDispatcher.ServerErrors.UNAUTHORIZED_CLIENT,
            "Client Unauthorized",
            ErrorCodeDispatcher.HTTPStatusCodes.UNAUTHORIZED
        );
    }
}

// Extension of the app service that allows for decoding encoded bearer tokens
class AppServiceAuthAdapter extends AppService {
    // Flags
    private static BEARER_FLAG = "Bearer";

    /**
     * The API Key is twice encoded so that there are two decoy states in case either two decoy states get leaked
     * With one of the decoy states being the actual API key, and the second being its first encoded value
     *
     * @param authToken
     * @returns -> Decoded API key
     */
    static decodeAuthToken(authToken: string): string {
        const firstIterationDecodedAPIKey = Buffer.from(
            authToken,
            "base64"
        ).toString("utf-8"),
            decodedAPIKey = Buffer.from(
                firstIterationDecodedAPIKey,
                "base64"
            ).toString("utf-8");

        return decodedAPIKey;
    }

    /**
     * Removes flags from bearer token
     *
     * @param bearerToken
     * @returns -> Auth Token string stripped of flag and whitespace chars trimmed
     */
    static stripBearerToken(bearerToken: string): string {
        return bearerToken.replace(this.BEARER_FLAG, "").trim();
    }

    /**
     * Detects if the given token is a bearer token by looking for the 'Bearer' flag
     * Note: The flag is case sensitive
     *
     * @param authToken
     * @returns -> True if the auth token is a bearer token, false otherwise
     */
    static detectBearerToken(authToken: string): boolean {
        return authToken.includes(this.BEARER_FLAG);
    }

    /**
     * !For developer use only!
     * Generates the auth token necessary to access the API service
     *
     * @returns -> Salted and twice encoded auth token string
     */
    static generateAuthToken(): string {
        const saltedAPIKey =
            process.env.FONCII_SERVER_API_SECRET + process.env.API_KEY_SALT_SECRET;

        const firstEncode = Buffer.from(saltedAPIKey, "utf-8").toString("base64"),
            encodedSaltedAuthToken = Buffer.from(firstEncode, "utf-8").toString(
                "base64"
            );

        return encodedSaltedAuthToken;
    }
}
