//
// FonciiInterceptorProvider.swift
// Foncii
//
// Created by Justin Cook on 4/22/23 at 12:07 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Apollo
import FonciiApollo

class FonciiInterceptorProvider: InterceptorProvider {
    // MARK: - Properties
    /// Note: These props will remain the static throughout the life of this provider despite being passed to other interceptors
    private let store: ApolloStore
    private let sessionClient: URLSessionClient
    private let headerAccessor: (String) -> [String: String]?
    
    init(
        store: ApolloStore,
        sessionClient: URLSessionClient,
        headerAccessor: @escaping (String) -> [String: String]?
    ) {
        self.store = store
        self.sessionClient = sessionClient
        self.headerAccessor = headerAccessor
    }
    
    func interceptors<Operation>(for operation: Operation) -> [ApolloInterceptor] where Operation : GraphQLOperation {
        return [
            HeaderProvisioningInterceptor(headerAccessor: headerAccessor),
            MaxRetryInterceptor(),
            CacheReadInterceptor(store: store),
            NetworkFetchInterceptor(client: sessionClient),
            JSONResponseParsingInterceptor(),
            AutomaticPersistedQueryInterceptor(),
            CacheWriteInterceptor(store: store)
        ]
    }
}
