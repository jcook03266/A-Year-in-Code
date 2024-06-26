//
// FonciiApolloClient.swift
// Foncii
//
// Created by Justin Cook on 4/21/23 at 10:53 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Apollo
import Foundation
import SwiftUI
import ApolloAPI
import FonciiApollo

/**
 * Apollo GraphQL API gateway and service interactor
 * Apollo Studio Playground for experimenting with the schema's operations live:
 * https://studio.apollographql.com/graph/foodie-supergraph/variant/main/explorer
 */
final class FonciiApolloService: ApolloServiceProtocol, ObservableObject {
    // MARK: - Properties
    private let serverEndpoint = ClientNetworkingInfo.shared.fonciiServerEndpoint
    static let shared: FonciiApolloService = .init()
    var client: ApolloClient!
    
    // MARK: - Published
    /// Logging
    @Published var lastQuery: (any GraphQLQuery)? = nil
    @Published var lastSearchQuery: (any GraphQLQuery)? = nil
    @Published var lastMutation: (any GraphQLMutation)? = nil
    
    @Published var lastFailedQuery: (any GraphQLQuery)? = nil
    @Published var lastFailedSearchQuery: (any GraphQLQuery)? = nil
    @Published var lastFailedMutation: (any GraphQLMutation)? = nil
    
    /// Search Metrics
    @Published var totalQueries: Int = 0
    @Published var totalSearchQueries: Int = 0
    @Published var totalMutations: Int = 0
    
    @Published var totalFailedQueries: Int = 0
    @Published var totalFailedSearchQueries: Int = 0
    @Published var totalFailedMutations: Int = 0
    
    /// Client Metrics
    @Published var clientResets: Int = 0
    @Published var cacheInvalidations: Int = 0
    
    var querySuccessRate: Double {
        /// Avoid dividing by zero exception
        guard totalQueries > 0
        else { return 0 }
        
        let successfulQueries = totalQueries - totalFailedQueries
        
        let percentage = Double(successfulQueries/totalQueries)
        
        // Rounded to 2 trailing decimal places
        return round(percentage * 100) / 100.0
    }
    
    var searchQuerySuccessRate: Double {
        /// Avoid dividing by zero exception
        guard totalSearchQueries > 0
        else { return 0 }
        
        let successfulSearchQueries = totalSearchQueries - totalFailedSearchQueries
        
        let percentage = Double(successfulSearchQueries/totalSearchQueries)
        
        // Rounded to 2 trailing decimal places
        return round(percentage * 100) / 100.0
    }
    
    var mutationSuccessRate: Double {
        /// Avoid dividing by zero exception
        guard totalMutations > 0
        else { return 0 }
        
        let successfulMutations = totalMutations - totalFailedMutations
        
        let percentage = Double(successfulMutations/totalMutations)
        
        // Rounded to 2 trailing decimal places
        return round(percentage * 100) / 100.0
    }
    
    // MARK: - Queues
    let operationQueue = DispatchQueue(label: "Foncii-iOS Operation Queue",
                                               qos: .userInitiated)
    let headerQueue = DispatchQueue(label: "Header Accessor Queue",
                                            qos: .background)
    
    // MARK: - Header Key Value Pairs
    /// Stores operation request header key value pairs keyed to their operation identifier
    var headers: [String: [String: String]] = [:]
    
    // MARK: - Requests
    var searchRequestTask: Cancellable?
    
    private init() {
        configure()
    }
    
    /// Configure the client with the target endpoint
    func configure() {
        guard let serverEndpoint = serverEndpoint.asURL
        else {
            ErrorCodeDispatcher
                .SwiftErrors
                .triggerPreconditionFailure(for: .urlCouldNotBeParsed,
                                            using: "URL: \(serverEndpoint) in: \(#file) caller: \(#function)")()
        }
        
        // Configure operation queue
        let operationQueue = OperationQueue()
        operationQueue.underlyingQueue = self.operationQueue
        
        // Setup URL Session Client with queue
        let sessionClient = URLSessionClient(sessionConfiguration: .default,
                                             callbackQueue: operationQueue)
        
        // Create an in-memory cache to store cachable operations
        let cache = InMemoryNormalizedCache(),
            store = ApolloStore(cache: cache),
            interceptorProvider = FonciiInterceptorProvider(
                store: store,
                sessionClient: sessionClient,
                headerAccessor: { [weak self] id in
                    guard let self = self
                    else { return [:] }
                    
                    /// Access the header key value pair keyed to the given id
                    var keyValuePair: [String: String]?
                    self.headerQueue.sync {
                        keyValuePair = self.headers[id]
                    }
                    
                    return keyValuePair
                }),
            transport = RequestChainNetworkTransport(
                interceptorProvider: interceptorProvider,
                endpointURL: serverEndpoint)
        
        /// Init Apollo Client with the network transport and in-memory cache
        self.client = ApolloClient(networkTransport: transport, store: store)
    }
    
    /// Resets the apollo client and sets it back to its default config
    func reset() {
        /// Clear the Apollo client if it's in memory
        if client != nil {
            searchRequestTask?.cancel()
            clearCache()
            client = nil
            
            clientResets += 1
        }
        
        configure()
    }
    
    /// Clears the client's underlying cache,
    /// Note: This cache can be shared between instances so be careful to not clear required caches
    func clearCache() {
        client.clearCache()
        cacheInvalidations += 1
    }
}

/// Generic query and mutation operation methods and handlers for reusable and modular operations across this application
extension FonciiApolloService {
    /// Generic query operation executor, error catch, and handler
    func performQuery<T: GraphQLQuery>(
        query: T,
        headers: [String: String]?,
        cachePolicy: CachePolicy?
    ) async -> T.Data? {
        var data: T.Data?
        
        /// Store the cached headers and await a response from the fetch request
        self.storeHeaders(headers: headers, operation: query)
        
        /// Log the query for debugging
        self.lastQuery = query
        self.totalQueries += 1
        
        let result = await self.fetch(query: query,
                                      cachePolicy: cachePolicy)
        
        /// Clear the cached headers
        self.storeHeaders(headers: headers,
                          operation: query,
                          invalidateCache: true)
        
        /// Handle the result from the fetch request
        do {
            data = try await self.handleResult(
                for: query,
                result: result)
            .get()
        }
        catch {
            self.totalFailedQueries += 1
            self.lastFailedQuery = query
            
            /// Log the error and continue
            ErrorCodeDispatcher
                .GraphQLErrors
                .printErrorCode(for:
                        .resultHandlingError(operation: query,
                                             errors: [error.localizedDescription]))
        }
        
        /// Release the search request task after it has been completed (if any)
        if isQueryACancellableSearchRequest(query: query) {
            if data == nil {
                self.totalFailedSearchQueries += 1
                self.lastFailedSearchQuery = query
            }
            else {
                self.lastSearchQuery = query
            }
            
            searchRequestTask = nil
        }
        
        return data
    }
    
    /// Generic mutation operation executor, error catcher, and handler
    @discardableResult
    func performMutation<T: GraphQLMutation>(
        mutation: T,
        headers: [String: String]?
    ) async -> T.Data? {
        var data: T.Data?
        
        /// Store the cached headers and await a response from the mutation request
        self.storeHeaders(headers: headers, operation: mutation)
        
        /// Log the mutation for debugging
        self.lastMutation = mutation
        self.totalMutations += 1
        
        let result = await self.mutate(mutation: mutation)
        
        /// Clear the cached headers
        self.storeHeaders(headers: headers,
                          operation: mutation,
                          invalidateCache: true)
        
        /// Handle the result from the fetch request
        do {
            data = try await self.handleResult(
                for: mutation,
                result: result)
            .get()
        }
        catch {
            self.totalFailedMutations += 1
            self.lastFailedMutation = mutation
            
            /// Log the error and continue
            ErrorCodeDispatcher
                .GraphQLErrors
                .printErrorCode(for:
                        .resultHandlingError(operation: mutation,
                                             errors: [error.localizedDescription]))
        }
        
        return data
    }
    
    /**
     * Asynchronously posts a mutation request to the server and gets a response back containing either data or errors
     * (Completion Handler converted to async await)
     */
    private func mutate<T: GraphQLMutation>(mutation: T)
    async ->  Result<GraphQLResult<T.Data>, Error> {
        return await withCheckedContinuation({ continuation in
            client.perform(mutation: mutation,
                           queue: operationQueue) { result in
                continuation.resume(returning: result)
            }
        })
    }
    
    /**
     * Asynchronously fetches a query from the server or from the local cache, depending on the current
     * contents of the cache and the specified cache policy.
     * (Completion Handler converted to async await)
     */
    private func fetch<T: GraphQLQuery>(
        query: T,
        cachePolicy: CachePolicy?
    ) async -> Result<GraphQLResult<T.Data>, Error> {
        return await withCheckedContinuation({ continuation in
            let task = client.fetch(query: query,
                                    cachePolicy: cachePolicy ?? .fetchIgnoringCacheCompletely,
                                    contextIdentifier: nil,
                                    queue: operationQueue) { result in
                continuation.resume(returning: result)
            }
            
            // Cancel any pending search requests
            if isQueryACancellableSearchRequest(query: query) {
                self.totalSearchQueries += 1
                
                searchRequestTask?.cancel()
                searchRequestTask = task
            }
        })
    }
    
    /// Handles the result of each GraphQL operation and responds accordingly to errors when encountered
    func handleResult<T: GraphQLOperation>(
        for operationType: T,
        result: Result<GraphQLResult<T.Data>, Error>
    ) async -> Result<T.Data?, Error> {
        switch result {
        case .success(let gqlResult):
            var errorMessages: [String] = []
            
            if let errors = gqlResult.errors,
               !errors.isEmpty {
                errorMessages = errors.compactMap({ $0.errorDescription })
            }
            
            if let data = gqlResult.data {
                // Data fetched successfully
                return .success(data)
            }
            else {
                // Data is null | something's wrong
                return .failure(
                    ErrorCodeDispatcher
                        .GraphQLErrors
                        .throwError(for: .resultHandlingError(operation: operationType,
                                                              errors: errorMessages)))
            }
            
            // Errors thrown from the server when processing the operation
        case .failure(let error):
            return .failure(
                ErrorCodeDispatcher
                    .GraphQLErrors
                    .throwError(for: .resultHandlingError(operation: operationType,
                                                          errors: [error.localizedDescription])))
        }
    }
    
    // MARK: - Caching
    /// Determines whether or not the target query is a restaurant search request that can be cancelled to make way for another search request query
    func isQueryACancellableSearchRequest<T: GraphQLQuery>(
        query: T
    ) -> Bool {
        return query is FonciiSchema.OnboardingRestaurantSearchQuery ||
        query is FonciiSchema.MainRestaurantSearchQuery
    }
    
    /**
     * Method stores the headers corresponding to a specific operation keyed to the operation identifier of the operation
     * After the call is complete the cached header key value pair should be invalidated
     */
    private func storeHeaders<T: GraphQLOperation>(
        headers: [String: String]?,
        operation: T,
        invalidateCache: Bool = false
    ) {
        headerQueue.sync {
            if let headers = headers,
               let operationID = T.operationIdentifier {
                
                // Nullify the cached header when specified
                if invalidateCache {
                    self.headers[operationID] = nil
                } else {
                    self.headers[operationID] = headers
                }
            }
        }
    }
}
