//
//  NetworkingService.swift
//  Foncii
//
//  Created by Justin Cook on 2/20/23.
//

import Foundation
import SwiftUI
import Combine
import Network

/// General service that monitors network conditions and continuously updates the application based on the changes observed
class NetworkingService: ObservableObject {
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.clientActionDispatcher) var clientActionDispatcher
    
    // MARK: - Published
    @Published var isInternetAvailable: Bool = false
    @Published private var queue: DispatchQueue!
    
    // MARK: - URL Session Activity
    var session = URLSession.shared
    
    // MARK: - Singleton
    static let shared: NetworkingService = .init()
    
    // MARK: - Monitor and Queue for keeping the monitor alive
    private var networkMonitor: NWPathMonitor = .init()
    /// This queue is a path specifically designated for receiving events specific to this network monitor's operation
    private let queueLabel: String = "Network Monitor Update Queue"
    var currentPath: NWPath {
        return networkMonitor.currentPath
    }
    var isConnectionReliable: Bool {
        return !networkMonitor.currentPath.isExpensive
    }
    var isLowDataModeEnabled: Bool {
        return networkMonitor.currentPath.isConstrained
    }
    /// Returns: - Information about the path's DNS and supported internet protocols in the following tuple combination (Supports DNS, SupportsIPv4, SupportsIPv6)
    var dnsInfo: (Bool, Bool, Bool) {
        let path = networkMonitor.currentPath
        
        return (path.supportsDNS,
                path.supportsIPv4,
                path.supportsIPv6)
    }
    var pathStatus: NWPath.Status {
        return networkMonitor.currentPath.status
    }
    var activeQueue: DispatchQueue? {
        return networkMonitor.queue
    }
    /// For debugging purposes and user-facing diagnostics
    var reasonForNoConnection: NWPath.UnsatisfiedReason {
        return networkMonitor.currentPath.unsatisfiedReason
    }
    var pathDebugDescription: String {
        return networkMonitor.currentPath.debugDescription
    }
    
    // MARK: - Information about the endpoint (local / remote) currently in use by the network connection's path
    var currentRemoteEndPoint: NWEndpoint? {
        return networkMonitor.currentPath.remoteEndpoint
    }
    var currentLocalEndPoint: NWEndpoint? {
        return networkMonitor.currentPath.localEndpoint
    }
    var activeEndPoint: NWEndpoint? {
        return currentRemoteEndPoint ?? currentLocalEndPoint
    }
    
    // MARK: - URL Downloading Task Properties
    let subscriptionScheduler = DispatchQueue.global(qos: .default),
        receiverScheduler = DispatchQueue.main
    
    private init() {  startMonitoring() }
    
    /// Converts the reason for no connection into an intelligent statement interpretable by the user
    func getHumanReadableReasonForNoConnection() -> String {
        var statement = LocalizedStrings.getLocalizedString(for: .HUMAN_READABLE_INTERNET_UNAVAILABLE_UNKNOWN_REASON)
        
        switch self.reasonForNoConnection {
        case .notAvailable:
            statement = LocalizedStrings.getLocalizedString(for: .HUMAN_READABLE_INTERNET_NOT_AVAILABLE)
        case .cellularDenied:
            statement = LocalizedStrings.getLocalizedString(for: .HUMAN_READABLE_INTERNET_CELLULAR_DENIED)
        case .wifiDenied:
            statement = LocalizedStrings.getLocalizedString(for: .HUMAN_READABLE_INTERNET_WIFI_DENIED)
        case .localNetworkDenied:
            statement = LocalizedStrings.getLocalizedString(for: .HUMAN_READABLE_INTERNET_LOCAL_NETWORK_DENIED)
        @unknown default:
            break
        }
        
        return statement
    }
    
    /// Check if connections using the path may send traffic over the given interface type.
    private func canUseInterfaceType(type: NWInterface.InterfaceType) -> Bool {
        let path = networkMonitor.currentPath
        
        return path.usesInterfaceType(type)
    }
    
    private func startMonitoring() {
        networkMonitor.pathUpdateHandler = { [weak self] path in
            guard let self = self
            else { return }
            
            self.isInternetAvailable = path.status == .satisfied
            
            Task { @MainActor in
                /// Update the appropriate store with the new network state
                self.clientActionDispatcher.setClientInternetStatus(isClientOnline: self.isInternetAvailable)
            }
        }
        
        queue = DispatchQueue(label: queueLabel)
        networkMonitor.start(queue: queue)
    }
    
    private func restartMonitor() {
        startMonitoring()
    }
    
    private func stopMonitor() {
        networkMonitor.cancel()
    }
}

/// An extension to the networking service which enables response management when interfacing with endpoints
extension NetworkingService {
    /// Asynchronously fetches data from the specified endpoint and throws an error if something goes wrong
    func fetchData(from endpoint: URL) async throws -> Data {
        do {
            let (data, _) = try await self.session.data(from: endpoint)
            
            return data
        }
        catch {
            throw ErrorCodeDispatcher.NetworkingErrors.throwError(for: .badURLResponse(endpoint: endpoint))
        }
    }
    
    /// Subscribes to a publisher that updates when data is received from the given endpoint
    /// When the endpoint is done sending data the data task is finished and the publisher <-> subscriber connection is cancelled
    func fetchPublishedData(from endpoint: URL) -> AnyPublisher<Data, Error> {
        self.session.dataTaskPublisher(for: endpoint)
            .subscribe(on: subscriptionScheduler)
            .tryMap { [weak self] (output) -> Data in
                
                guard let self = self,
                      let response = output.response as? HTTPURLResponse,
                      self.isEndpointResponseValid(response: response)
                else {
                    throw ErrorCodeDispatcher.NetworkingErrors.throwError(for: .badURLResponse(endpoint: endpoint))
                }
                
                return output.data
            }
            .receive(on: receiverScheduler)
            .eraseToAnyPublisher()
    }
    
    /// When a request finished this handler checks to see if an error has occurred during the process
    func getRequestCompletionHandler(completion: Subscribers.Completion<Error>) {
        switch completion {
        case .finished:
            break
        case .failure(let failure):
            print(failure.localizedDescription)
        }
    }
    
    
    /// Validates that the response from the endpoint has an ok / operational status before proceeding with some other action by checking the status code
    private func isEndpointResponseValid(response: HTTPURLResponse?) -> Bool {
        guard let response = response else { return false }
        
        let statusCode = response.statusCode
        let normalStatusCodeRange: ClosedRange<Int> = 200...300
        
        return normalStatusCodeRange.contains(statusCode)
    }
}
