//
//  LaunchScreenManager.swift
//  Foncii
//
//  Created by Justin Cook on 2/12/23.
//

import Foundation
import Combine

/// Manages the lifecycle and states of the launch screen
class LaunchScreenManager: ObservableObject {
    // MARK: - Life Cycle Properties
    /// In seconds [s]
    static var displayDuration: CGFloat = 3
    static var displayloadingIndicatorAfterDelay: CGFloat = 3
    
    // Asynchronous Task Handlers
    @Published var onCompleteTasks: [UUID: Task<(), Error>?] = [:]
    private var cancellables: Set<AnyCancellable> = []
    
    // MARK: - Singleton
    static let shared: LaunchScreenManager = .init()
    
    // MARK: - Dependencies
    /// Lazy loaded to prevent race conditions with shared dependencies when the application is first launched
    struct Dependencies: InjectableServices {
        lazy var appService: AppService = LaunchScreenManager.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    private init() {}
    
    /// Delayed and network dependent closure to be run when the launch screen is done being displayed
    func onDelayedComplete(
        execute task: @escaping (() -> Void),
        taskID: UUID = .init()
    ) {
             dependencies
            .appService
            .$hasCompletedOnloadTasks
            .sink(receiveValue: { canContinue in
               
                // Continue with the required task
                if canContinue {
                    Task { @MainActor in
                        try await Task.sleep(until: .now + .seconds(LaunchScreenManager.displayDuration),
                                             clock: .suspending)
        
                        task()
                    }
                }
            })
            .store(in: &cancellables)
    }
    
    /// Non-delayed and network dependent closure to be run when on load tasks have
    func onComplete(
        execute task: @escaping (() -> Void),
        taskID: UUID = .init()
    ) {
        dependencies
       .appService
       .$hasCompletedOnloadTasks
       .sink(receiveValue: { canContinue in
           
           // Continue with the required task
           if canContinue {
               task()
           }
       })
       .store(in: &cancellables)
    }
}
