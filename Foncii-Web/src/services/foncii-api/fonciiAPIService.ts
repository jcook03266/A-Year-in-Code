// Dependencies
// Types
import {
  Query,
  Mutation,
  SupportedFonciiPlatforms,
} from "../../__generated__/graphql";

// Apollo Client Framework
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  DocumentNode,
  TypedDocumentNode,
  ApolloLink,
  NormalizedCacheObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Managers
import AuthenticationManager from "../../managers/authenticationManager";

/** A cache policy that specifies whether results should be fetched from the server or loaded from the local cache. */
export enum CachePolicy {
  /** Return data from the cache if available, else fetch results from the server. */
  returnCacheDataElseFetch,
  /** Always fetch results from the server, and store these in the cache for later use if necessary */
  fetchIgnoringCacheData,
  /** Always fetch results from the server, and don't store these in the cache. */
  fetchIgnoringCacheCompletely,
  /** Return data from the cache if available, else return null. */
  returnCacheDataDontFetch,
  /** Return data from the cache if available, and always fetch results from the server. */
  returnCacheDataAndFetch,
}

// Updatable Singleton, singleton can be updated by subsequent constructor calls with session ID param
let shared: FonciiAPIClient;

/**
 * Service class that permits managed interactions with the Foncii GraphQL API
 */
export class FonciiAPIClient {
  // Properties
  private static serverEndPoint = process.env.NEXT_PUBLIC_FONCII_API_ENDPOINT;
  private static apiAuthToken = process.env.NEXT_PUBLIC_FONCII_API_AUTH_TOKEN;

  private client!: ApolloClient<NormalizedCacheObject>;
  private sessionID: string | undefined = undefined;

  // Only fetch and return data, don't cache anything at all
  static defaultCachePolicy = CachePolicy.fetchIgnoringCacheCompletely;

  // Managers
  private authenticationManager = () => new AuthenticationManager();

  // Request Header Interceptor
  /**
   * GraphQL API Server endpoint
   * @returns -> An Apollo link to link with the httpLink containing the server's endpoint URI
   */
  private httpLink = createHttpLink({
    uri: FonciiAPIClient.serverEndPoint,
    // Allow cookies to be sent alongside requests. Note: doesn't work for same same-site
    // and wildcard (*) CORS policies. An explicit CORS policy is required to pass cookies.
    credentials: "include",
  });

  /**
   * GraphQL API Middleware for passing auth creds to the server
   * using the contextual headers referenced by the context setter and the
   * required auth header
   *
   * @returns -> An Apollo link to link with the httpLink containing the server's endpoint URI
   */
  private authLink = setContext(async (_, { headers }) => {
    const firebaseUserIDTokenResult =
        await this.authenticationManager().getCurrentUserIDTokenResult(),
      firebaseUserIDToken = firebaseUserIDTokenResult?.token;

    // Return the headers to the original context so httpLink can read them
    return {
      headers: {
        ...headers,
        "firebase-user-id-token": firebaseUserIDToken,
        "foncii-platform": SupportedFonciiPlatforms.Foncii,
        sessionID: shared.sessionID,
        authorization: FonciiAPIClient.apiAuthToken,
      },
    };
  });

  /// Identifier for this client in order to differentiate the origin of operations passed to the Apollo router
  private clientIdentifier = `Foncii ${process.env.NEXT_PUBLIC_NODE_ENV_CUSTOM}`;

  constructor({ sessionID }: { sessionID?: string }) {
    if (shared) {
      // Update the session ID as needed
      shared.sessionID = sessionID;
      return;
    } else shared = this;

    shared.sessionID = sessionID;
    shared.client = new ApolloClient({
      link: shared.linkApolloMiddleware(),
      connectToDevTools: true,
      cache: new InMemoryCache(),
      name: shared.clientIdentifier,
      defaultOptions: {
        // Disable returning query data from the cache by default
        query: {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
        },
        watchQuery: {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
        },
      },
    });
  }

  /**
   * Applies the API auth token headers as a middle process to the httpLink
   * used to connect the client to the required URI the GraphQL API server is located on
   *
   * @returns ApolloLink object containing the necessary authorization header information
   * plus other desired headers and the uri pointing to the GraphQL API server endpoint
   */
  private linkApolloMiddleware(): ApolloLink {
    return shared.authLink.concat(shared.httpLink);
  }

  /**
   * Exposes client interface outside of this instance.
   * @returns the privatized apollo client encapsulated in this class
   */
  getClient(): ApolloClient<any> {
    return shared.client;
  }

  // Fetching Logic
  /**
   * Executes the passed GraphQL query and any applicable variables
   *
   * @async
   * @param query -> The GraphQL query type definition / document node
   * @param variables -> An optional object containing any required or optional inputs for this operation
   *
   * @returns Requested data from the query
   */
  async performQuery({
    query,
    variables,
    cachePolicy = FonciiAPIClient.defaultCachePolicy,
  }: {
    query: DocumentNode | TypedDocumentNode<any, { string: any }>;
    variables?: any;
    cachePolicy?: CachePolicy;
  }): Promise<Query> {
    // Update middleware links + headers with latest props
    shared.client.setLink(shared.linkApolloMiddleware());

    // Cache Policy handler
    if (
      cachePolicy == CachePolicy.returnCacheDataAndFetch ||
      cachePolicy == CachePolicy.returnCacheDataDontFetch ||
      cachePolicy == CachePolicy.returnCacheDataElseFetch
    ) {
      // Check if the query's data is already cached
      const cachedData = shared.readQueryFromCache({
        query,
        variables,
      });

      if (cachePolicy == CachePolicy.returnCacheDataDontFetch) {
        return cachedData;
      } else if (
        cachePolicy == CachePolicy.returnCacheDataElseFetch &&
        cachedData
      ) {
        return cachedData;
      } else if (
        cachePolicy == CachePolicy.returnCacheDataAndFetch &&
        cachedData
      ) {
        shared.performQuery({
          query,
          variables,
          cachePolicy: CachePolicy.fetchIgnoringCacheData,
        });

        // Return the defined cached data immediately and fetch then cache in the background
        return cachedData;
      }
    }

    return await shared.client
      .query({
        query: query,
        variables: variables,
      })
      .then((result) => {
        if (result.errors) {
          // If an error is encountered log the error and continue
          console.error(result.errors);
        } else {
          // If no errors are present then return the data from the result
          const data = result.data;

          // Cache the query's resulting data if the cache policy allows it
          if (
            cachePolicy == CachePolicy.fetchIgnoringCacheData ||
            cachePolicy == CachePolicy.returnCacheDataAndFetch ||
            cachePolicy == CachePolicy.returnCacheDataElseFetch
          ) {
            shared.writeQueryToCache({
              query,
              data,
              variables,
            });
          }

          return data;
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Executes the passed GraphQL mutation and any applicable variables
   *
   * @async
   * @param mutation -> The GraphQL mutation type definition / document node
   * @param variables -> An optional object containing any required or optional inputs for this operation
   * @returns Response data from the mutation
   */
  async performMutation({
    mutation,
    variables,
  }: {
    mutation: DocumentNode | TypedDocumentNode<any, { string: any }>;
    variables?: any;
  }): Promise<Mutation> {
    // Update middleware links + headers with latest props (session ids are volatile so this updates the header for it on demand)
    shared.client.setLink(shared.linkApolloMiddleware());

    return await shared.client
      .mutate({
        mutation: mutation,
        variables: variables,
      })
      .then((result: any) => {
        if (result.errors) {
          // If an error is encountered log the error and continue
          console.error(result.errors);
        } else {
          // If no erros are present then return the data from the result
          return result.data;
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // Cache Logic
  writeQueryToCache({
    query,
    data,
    variables,
  }: {
    query: DocumentNode | TypedDocumentNode<any, { string: any }>;
    data: any;
    variables?: any;
  }) {
    shared.client.writeQuery({
      query: query,
      data,
      variables: variables,
    });
  }

  readQueryFromCache({
    query,
    variables,
  }: {
    query: DocumentNode | TypedDocumentNode<any, { string: any }>;
    variables?: any;
  }): Promise<Query> {
    return shared.client.readQuery({
      query: query,
      variables: variables,
    });
  }
}
