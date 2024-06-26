//
//  ErrorCodeDispatcherProtocol.swift
//  Foncii
//
//  Created by Justin Cook on 2/9/23.
//

import Foundation

/// Useful dispatcher object used for centralizing error codes and dispatching them from one unified directory for a testable, trackable, and maintainable hierarchy of error management
protocol ErrorCodeDispatcherProtocol {
    // MARK: - Types for defining generic behavior
    typealias ErrorCodeType = Hashable
    associatedtype ErrorCodes: ErrorCodeType
    
    // MARK: - Functions
    static func getErrorCodeFor(code: ErrorCodes) -> String
    static func printErrorCode(for code: ErrorCodes)
    static func triggerFatalError(for code: ErrorCodes, with vestigialMessage: String) -> (() -> (Never))
    static func triggerPreconditionFailure(for code: ErrorCodes, using extendedInformation: String) -> (() -> (Never))
}

extension ErrorCodeDispatcherProtocol {
    static func printErrorCode(for code: ErrorCodes) {
        guard ErrorCodeDispatcher
            .fatalErrorsEnabled
        else { preconditionFailure() }
        
        ErrorCodeDispatcher.triggerFatalError(for: .errorCodePrintingNotImplemented)()
    }
    
    static func triggerFatalError(for code: ErrorCodes,
                                  with vestigialMessage: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher
            .fatalErrorsEnabled
        else { return { preconditionFailure() } }
        
        return ErrorCodeDispatcher.triggerFatalError(for: .fatalErrorsNotImplemented)
    }
    
    static func triggerPreconditionFailure(for code: ErrorCodes,
                                           using extendedInformation: String) -> (() -> (Never)) {
        guard ErrorCodeDispatcher
            .fatalErrorsEnabled
        else { return { preconditionFailure() } }
        
        return ErrorCodeDispatcher.triggerFatalError(for: .preconditionFailureNotImplemented)
    }
}

/// Enables throwable errors for custom error types handled outside of this scope
protocol ThrowableErrorCodeDispatcherProtocol: ErrorCodeDispatcherProtocol {
    static func throwError(for code: ErrorCodes) -> Error
}
