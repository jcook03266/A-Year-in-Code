//
//  GenericViewModelProtocol.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI

/// Basis for observable view models, allows a view to respond to changes within the target object's values
protocol GenericViewModel: ObservableObject, Identifiable {
    var id: UUID { get }
}

// MARK: - Implementations
extension GenericViewModel {
    var id: UUID {
        return .init()
    }
}

/// View model that uses a coordinator object for navigation and routing
protocol CoordinatedGenericViewModel: GenericViewModel {
    associatedtype coordinator = any Coordinator

    // MARK: - Observed Object
    var coordinator: coordinator { get set }
}
