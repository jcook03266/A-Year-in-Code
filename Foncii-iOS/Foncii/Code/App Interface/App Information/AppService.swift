//
//  AppService.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import Combine
import ComposableArchitecture

/** Singleton centralized service that stands as a logical reference point for this application*/
final class AppService: ObservableObject {
    // MARK: - State Management
    // Redux
    let globalStore: Store<AppDomain.State, AppDomain.Action> = {
        Store(initialState: .prod)
        { AppDomain() }
    }()
    let globalViewStore: ViewStoreOf<AppDomain> = {
        let globalStore = Store(initialState: .prod)
        { AppDomain() }
        
        return ViewStore(globalStore)
    }()
    
    // Singleton
    static let shared: AppService = .init()
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Published
    // Networking - Use this to determine whether or not the client is currently online,
    /// Simpler than injecting the networking service if you've already injected this service into an existing instance
    /// Note: [default is true to avoid triggering some client offline user notification logic]
    /// When used as an environment object the scene in which it's observed is notified of changes
    var isClientOnline: Bool {
        return self.getCurrentState(of: \.clientState)
            .isClientOnline
    }
    
    // State Management
    @Published var isPerformingOnloadTasks: Bool = false
    @Published var hasCompletedOnloadTasks: Bool = false
    var onloadTask: Task<(), Never>? = nil
    
    // Deep Linking
    @Published var deepLinkManager: DeepLinkManager = .shared
    
    // MARK: - Debug Environment Properties
    /// Determines whether or not the current build is in a debug environment, (can be overridden if needed)
    static var isDebug: Bool = {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }()
    
    static var runningOnSimulator: Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }

    // MARK: - Dependencies
    /// Lazy loaded to prevent race conditions with shared dependencies when the application is launched
    struct Dependencies: InjectableServices {
        lazy var networkingService: NetworkingService = AppService.Dependencies.inject()
        lazy var userManager: UserManager = AppService.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Navigation Logic
    /// Returns the shared instance of the root coordinator delegate for access wherever this service is injected
    var rootCoordinatorDelegate: RootCoordinatorDelegate {
        return .shared
    }
    
    private init() { setup() }
    
    func setup() {
        addSubscribers()
    }
    
    /// Various network dependent on-load tasks that need to be completed in order to transition the user to the next scene when the app is launched
    func load() {
        onloadTask = Task { @MainActor [weak self] in
            guard let self = self
            else { return }
            
            isPerformingOnloadTasks = true
            
            /// Start managing user data and monitoring / responding to auth changes
            await dependencies
                .userManager
                .start()
            
            isPerformingOnloadTasks = false
            hasCompletedOnloadTasks = true
            onloadTask = nil
        }
    }
    
    // MARK: - Redux State Accessor
    func getCurrentState<State: Any>(of keyPath:
                                              KeyPath<ViewStore<AppDomain.State,
                                              AppDomain.Action>, State>
    ) -> State {
        return self.globalViewStore[keyPath: keyPath]
    }
    
    // MARK: - Subscriptions
    func addSubscribers() {
        /// Listen to internet connection status updates and manage the app's state accordingly
        dependencies
            .networkingService
            .$isInternetAvailable
            .receive(on: scheduler)
            .sink { [weak self] isInternetAvailable in
                guard let self = self
                else { return }
                
                /// Perform on load tasks when an internet connection has been established
                if isClientOnline && !hasCompletedOnloadTasks {
                    load()
                }
            }
            .store(in: &cancellables)
    }
}
