//
// HeaderProvisioningInterceptor.swift
// Foncii
//
// Created by Justin Cook on 4/22/23 at 12:15 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Apollo
import Combine
import FonciiApollo

final class HeaderProvisioningInterceptor: ApolloInterceptor {
    private let headerAccessor: (String) -> [String: String]?
    // TODO: private let authCredentialValidator: - Validate that the current user has authorization to use the endpoint
    
    init(
        headerAccessor: @escaping (String) -> [String: String]?
    ) {
        self.headerAccessor = headerAccessor
    }
    
    func interceptAsync<Operation: GraphQLOperation>(
        chain: RequestChain,
        request: HTTPRequest<Operation>,
        response: HTTPResponse<Operation>?,
        completion: @escaping (Result<GraphQLResult<Operation.Data>, Error>) -> Void
    ) {
        provisionHeadersAndContinue(chain: chain,
                                    request: request,
                                    response: response,
                                    completion: completion)
    }
    
    /**
     * Supports the AQS functionality and adds required auth headers to each outgoing request
     * AQS Docs here: https://www.apollographql.com/docs/ios/fetching/apqs
     */
    func provisionHeadersAndContinue<Operation: GraphQLOperation>(
        chain: RequestChain,
        request: HTTPRequest<Operation>,
        response: HTTPResponse<Operation>?,
        completion: @escaping (Result<GraphQLResult<Operation.Data>, Error>) -> Void
    ) {
        // Find the header value associated with the operation id of the given request and add it to the request's headers to persist the query on the server
        if let operationID = Operation.operationIdentifier,
           let headers = headerAccessor(operationID) {
            for headerKey in headers.keys {
                if let headerValue = headers[headerKey] {
                    request.addHeader(name: headerKey, value: headerValue)
                }
            }
        }
        
        // Authorization Header Properties
        let authToken = ClientNetworkingInfo.shared.fonciiServerAPIKey,
            authHeaderKey = "Authorization",
            authHeaderValue = "Bearer \(authToken)"
        
        // Add the required header and proceed with the async operation
        request.addHeader(name: authHeaderKey, value: authHeaderValue)
        chain.proceedAsync(request: request,
                           response: response,
                           completion: completion)
    }
}

