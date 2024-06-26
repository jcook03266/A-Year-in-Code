//
//  ErrorCodeDispatcher.swift
//  Foncii
//
//  Created by Justin Cook on 2/9/23.
//

import Foundation
import ApolloAPI

struct ErrorCodeDispatcher: ErrorCodeDispatcherProtocol {
    // MARK: - Supported Error Domains
    struct UserDefaultsErrors {}
    struct BundleErrors {}
    struct SwiftErrors {}
    struct ResourceErrors {}
    struct NetworkingErrors {}
    struct FileManagerErrors {}
    struct CoreDataErrors {}
    struct DeeplinkingErrors {}
    struct KeychainErrors {}
    struct AuthenticationErrors {}
    struct GraphQLErrors {}
    
    // MARK: - Global state management
    static var fatalErrorsEnabled: Bool {
        // Fatal errors are only applicable in development environments, so this is disabled for all production releases
        return !AppInformation.isProduction && isEnabled
    }
    fileprivate static var preconditionFailuresEnabled: Bool {
        return true && isEnabled
    }
    // MARK: - Disables all error dispatching
    fileprivate static var isEnabled: Bool {
        return true
    }
    
    /// Self referential error codes that define errors associated with the error code dispatcher itself
    enum codes: String, CaseIterable, Hashable {
        case preconditionFailureNotImplemented = "triggerPreconditionFailure(for code: ErrorCodes, using extendedInformation: String) Precondition Failure Function Not Yet Implemented",
             fatalErrorsNotImplemented = "triggerFatalError(for code: ErrorCodes, with vestigialMessage: String) Fatal Error Function Not Yet Implemented",
             errorCodePrintingNotImplemented = "printErrorCodeFor(for code: ErrorCodes) Print Error Code To Console Function Not Yet Implemented"
    }
    
    static func getErrorCodeFor(code: codes) -> String {
        return code.rawValue
    }
    
    /// Advisory: Do not call this function outside of its relevant file scope, for specific error codes select the relevant routes (ex. Resources for image, animation, color resources etc.)
    static func triggerFatalError(for code: codes,
                                  with vestigialMessage: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher
            .fatalErrorsEnabled
        else {
            return { preconditionFailure() }}
        
        fatalError(code.rawValue + ", " + vestigialMessage)
    }
}

// MARK: - Error Codes for GraphQL
extension ErrorCodeDispatcher.GraphQLErrors: ThrowableErrorCodeDispatcherProtocol {
    typealias ErrorCodes = codes
    
    enum codes: Hashable, LocalizedError {
        case resultHandlingError(operation: any GraphQLOperation,
                                 errors: [String])
        
        var errorDescription: String? {
            switch self {
            case .resultHandlingError(operation: let operation,
                                      errors: let errors):
                return "An error was encountered handling the given GraphQL Operation \(operation.self), errors: \(errors.description)"
            }
        }
        
        // MARK: - Protocol Conformance
        func hash(into hasher: inout Hasher) {
            hasher.combine(self.hashValue)
        }
        
        static func == (lhs: ErrorCodeDispatcher.GraphQLErrors.codes, rhs: ErrorCodeDispatcher.GraphQLErrors.codes) -> Bool {
            return lhs.hashValue == rhs.hashValue
        }
    }
    
    static func printErrorCode(for code: ErrorCodes) {
        print(code.errorDescription ?? "")
    }
    
    static func getErrorCodeFor(code: ErrorCodes) -> String {
        return code.localizedDescription
    }
    
    static func throwError(for code: codes) -> Error {
        return code
    }
    
    static func triggerPreconditionFailure(for code: codes,
                                           using extendedInformation: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher.preconditionFailuresEnabled
        else {
            return { preconditionFailure() }}
        
        preconditionFailure(code.localizedDescription + ", " + extendedInformation)
    }
}

// MARK: - Authentication Error Codes
extension ErrorCodeDispatcher.AuthenticationErrors: ThrowableErrorCodeDispatcherProtocol {
    typealias ErrorCodes = codes
    
    enum codes: Hashable, LocalizedError {
        case userDoesNotExist
        case otpRequestFailed(error: String)
        case otpValidationFailed(error: String)
        case authenticationFailed(error: String)
        case userCreationFailed(error: String)
        
        var errorDescription: String? {
            switch self {
            case .userDoesNotExist:
                return "An active user is required to perform this operation!"

            case .otpRequestFailed(error: let error):
                return "A one-time passcode request failed with the following error: \(error)"
                
            case .otpValidationFailed(error: let error):
                return "A one-time passcode validation attempt failed with the following error: \(error)"
                
            case .authenticationFailed(error: let error):
                return "An authentication attempt has failed with the following error: \(error)"
                
            case .userCreationFailed(error: let error):
                return "An attempt to create a new user has failed with the following error: \(error)"
            }
        }
    }
    
    static func printErrorCode(for code: ErrorCodes) {
        print(code.errorDescription ?? "")
    }
    
    static func getErrorCodeFor(code: ErrorCodes) -> String {
        return code.localizedDescription
    }
    
    static func throwError(for code: codes) -> Error {
        return code
    }
    
    static func triggerPreconditionFailure(for code: codes,
                                           using extendedInformation: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher.preconditionFailuresEnabled
        else {
            return { preconditionFailure() }}
        
        preconditionFailure(code.localizedDescription + ", " + extendedInformation)
    }
}

// MARK: - Error Codes for Keychain
extension ErrorCodeDispatcher.KeychainErrors: ThrowableErrorCodeDispatcherProtocol {
    typealias ErrorCodes = codes
    
    enum codes: Hashable, LocalizedError {
        case saveFailed(key: String, value: String)
        case deletionFailed(key: String)
        case loadFailed(key: String)
        case updateFailed(key: String, value: String)
        
        var errorDescription: String? {
            switch self {
            case .saveFailed(key: let key, value: let value):
                return "The value \(value) for the key: \(key) could not be saved to the keychain"
                
            case .deletionFailed(key: let key):
                return "The value for the given key \(key), could not be deleted from the keychain, this value might be absent from the secure store"
                
            case .loadFailed(key: let key):
                return "The value for the given key \(key), could not be fetched from the keychain, this value might be absent from the secure store"
                
            case .updateFailed(key: let key, value: let value):
                return "The updated value \(value) for the key: \(key) could not be saved to the keychain, please make sure this value exists prior to using this operation."
            }
        }
    }
    
    static func printErrorCode(for code: ErrorCodes) {
        print(code.errorDescription ?? "")
    }
    
    static func getErrorCodeFor(code: ErrorCodes) -> String {
        return code.localizedDescription
    }
    
    static func throwError(for code: codes) -> Error {
        return code
    }
    
    static func triggerPreconditionFailure(for code: codes,
                                           using extendedInformation: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher.preconditionFailuresEnabled
        else {
            return { preconditionFailure() }}
        
        preconditionFailure(code.localizedDescription + ", " + extendedInformation)
    }
}

// MARK: - Error Codes for Deeplinking
extension ErrorCodeDispatcher.DeeplinkingErrors: ThrowableErrorCodeDispatcherProtocol {
    typealias ErrorCodes = codes
    
    enum codes: Hashable, LocalizedError {
        case urlDoesNotConformToScheme(url: URL)
        case noHandlerFoundFor(url: URL)
        case routeCouldNotBeInitialized(routeRawValue: String, url: URL)
        case routeUnreachableFromCurrentRoute
        case unauthorizedUser(url: URL)
        case webLinkCouldNotBeOpened(url: URL)
        
        var errorDescription: String? {
            switch self {
            case .urlDoesNotConformToScheme(url: let url):
                return "The given url \(url) doesn't conform to the expected URL scheme supported by the application."
                
            case .noHandlerFoundFor(url: let url):
                return "No handler could be found to open the given URL \(url)"
                
            case .routeCouldNotBeInitialized(routeRawValue: let routeRawValue,
                                             url: let url):
                return "A route could not be resolved be from the Raw Value \(routeRawValue), for url: \(url)"
                
            case .routeUnreachableFromCurrentRoute:
                let currentURL: String = DeepLinkManager.shared.activeDeepLinkTarget?.absoluteString ?? "ACTIVE_URL_NOT_STORED_PLEASE_CHECK"
                
                return "The route parsed from the url: \(currentURL), could not be reached from the current context"
                
            case .unauthorizedUser(url: let url):
                return "An unauthorized user tried to open the following url: \(url), this user must authenticate themselves first in order to open URLs in this app"
                
            case .webLinkCouldNotBeOpened(url: let url):
                return "The external web URL: \(url), could not be opened at this time, please make sure it's properly formatted."
            }
        }
    }
    
    static func printErrorCode(for code: ErrorCodes) {
        print(code.errorDescription ?? "")
    }
    
    static func getErrorCodeFor(code: ErrorCodes) -> String {
        return code.localizedDescription
    }
    
    static func throwError(for code: codes) -> Error {
        return code
    }
    
    static func triggerPreconditionFailure(for code: codes,
                                           using extendedInformation: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher.preconditionFailuresEnabled
        else {
            return { preconditionFailure() }}
        
        preconditionFailure(code.localizedDescription + ", " + extendedInformation)
    }
}

// MARK: - Error Codes for CoreData
extension ErrorCodeDispatcher.CoreDataErrors: ThrowableErrorCodeDispatcherProtocol {
    typealias ErrorCodes = codes
    
    enum codes: Hashable, LocalizedError {
        case containerPersistenStoreLoadFailure(containerName: String, localErrorDescription: String)
        case entityFetchRequestError(entityName: String, localErrorDescription: String)
        case entitySaveError(entityName: String, localErrorDescription: String)
        
        var errorDescription: String? {
            switch self {
            case .containerPersistenStoreLoadFailure(containerName: let containerName,
                                                     localErrorDescription: let localErrorDescription):
                return "The container named \(containerName) could not be loaded at this time, with error: \(localErrorDescription)"
                
            case .entityFetchRequestError(entityName: let entityName,
                                          localErrorDescription: let localErrorDescription):
                return "An entity named \(entityName) could not be fetched successfully, with error: \(localErrorDescription)"
                
            case .entitySaveError(entityName: let entityName,
                                  localErrorDescription: let localErrorDescription):
                return "An entity named \(entityName) could not be saved successfully, with error: \(localErrorDescription)"
            }
        }
    }
    
    static func printErrorCode(for code: ErrorCodes) {
        print(code.errorDescription ?? "")
    }
    
    static func getErrorCodeFor(code: ErrorCodes) -> String {
        return code.localizedDescription
    }
    
    static func throwError(for code: codes) -> Error {
        return code
    }
    
    static func triggerPreconditionFailure(for code: codes,
                                           using extendedInformation: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher.preconditionFailuresEnabled
        else {
            return { preconditionFailure() }}
        
        preconditionFailure(code.localizedDescription + ", " + extendedInformation)
    }
}

// MARK: - Error Codes for File Manager
extension ErrorCodeDispatcher.FileManagerErrors: ThrowableErrorCodeDispatcherProtocol {
    typealias ErrorCodes = codes
    
    enum codes: Hashable, LocalizedError {
        case imageNotSaved(fileName: String, folderName: String, localErrorDescription: String)
        case fileDirectoryNotCreated(folderName: String, localErrorDescription: String)
        case imageNotFound(fileName: String, folderName: String)
        case imageCouldNotBeDeleted(fileName: String, url: URL, folderName: String, localErrorDescription: String)
        case fileDirectoryCouldNotBeDeleted(url: URL, folderName: String, localErrorDescription: String)
        
        var errorDescription: String? {
            switch self {
            case .imageNotSaved(fileName: let fileName,
                                folderName: let folderName,
                                localErrorDescription: let localErrorDescription):
                return "The image named: \(fileName) could not be saved to the \(folderName) directory, with error: \(localErrorDescription)"
                
            case .fileDirectoryNotCreated(folderName: let folderName, localErrorDescription: let localErrorDescription):
                return "There was an error encountered when creating a file directory for the folder: \(folderName), with error: \(localErrorDescription)"
                
            case .imageNotFound(fileName: let fileName,
                                folderName: let folderName):
                return "The image named: \(fileName) could not be fetched from the \(folderName) directory"
                
            case .imageCouldNotBeDeleted(fileName: let fileName,
                                         url: let url,
                                         folderName: let folderName,
                                         localErrorDescription: let localErrorDescription):
                return "The image named: \(fileName), with the url: \(url), could not be deleted from the \(folderName) directory, with error: \(localErrorDescription)"
                
            case .fileDirectoryCouldNotBeDeleted(url: let url,
                                                 folderName: let folderName,
                                                 localErrorDescription: let localErrorDescription):
                return "The file directory named: \(folderName), with the url: \(url), could not be deleted, with error: \(localErrorDescription)"
            }
        }
    }
    
    static func getErrorCodeFor(code: ErrorCodes) -> String {
        return code.localizedDescription
    }
    
    static func throwError(for code: codes) -> Error {
        return code
    }
    
    static func triggerPreconditionFailure(for code: codes,
                                           using extendedInformation: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher.preconditionFailuresEnabled
        else {
            return { preconditionFailure() }}
        
        preconditionFailure(code.localizedDescription + ", " + extendedInformation)
    }
}

// MARK: - Error Codes for Networking
extension ErrorCodeDispatcher.NetworkingErrors: ThrowableErrorCodeDispatcherProtocol {
    typealias ErrorCodes = codes
    
    enum codes: Hashable, LocalizedError {
        case unknown(endpoint: URL)
        case badURLResponse(endpoint: URL)
        case imageCouldNotBeDownloaded(endpoint: URL)
        
        var errorDescription: String? {
            switch self {
            case .unknown(endpoint: let endpoint):
                return "An unknown response was received from the endpoint: \(endpoint), please check. [❓]"
            case .badURLResponse(endpoint: let endpoint):
                return "A bad response has occurred when fetching from the endpoint: \(endpoint) [🚫]"
            case .imageCouldNotBeDownloaded(endpoint: let endpoint):
                return "The image being downloaded could not be parsed into a UIImage from the endpoint: \(endpoint), please check the resource to make sure it has a valid file format. [🌃]"
            }
        }
    }
    
    static func printErrorCode(for code: ErrorCodes) {
        print(code.localizedDescription)
    }
    
    static func getErrorCodeFor(code: ErrorCodes) -> String {
        return code.localizedDescription
    }
    
    static func throwError(for code: codes) -> Error {
        return code
    }
    
    static func triggerPreconditionFailure(for code: codes,
                                           using extendedInformation: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher.preconditionFailuresEnabled
        else {
            return { preconditionFailure() }}
        
        preconditionFailure(code.localizedDescription + ", " + extendedInformation)
    }
}

// MARK: - Error Codes for resource access errors
extension ErrorCodeDispatcher.ResourceErrors: ErrorCodeDispatcherProtocol {
    typealias ErrorCodes = codes
    
    enum codes: String, CaseIterable, Hashable {
        case imageNotFound
        case colorNotFound
        case customFontStyleNotFound
        case lottieAnimationNotFound
    }
    
    static func getErrorCodeFor(code: ErrorCodes) -> String {
        return code.rawValue
    }
    
    static func triggerFatalError(for code: codes,
                                  with vestigialMessage: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher
            .fatalErrorsEnabled
        else {
            return { preconditionFailure() }}
        
        fatalError(code.rawValue + ", " + vestigialMessage)
    }
    
    static func triggerPreconditionFailure(for code: codes,
                                           using extendedInformation: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher.preconditionFailuresEnabled
        else {
            return { preconditionFailure() }}
        
        preconditionFailure(code.rawValue + ", " + extendedInformation)
    }
}

// MARK: - Error Codes for common Swift errors
extension ErrorCodeDispatcher.SwiftErrors: ErrorCodeDispatcherProtocol {
    typealias ErrorCodes = codes
    
    enum codes: String, CaseIterable, Hashable, Error {
        case inheritedCoderNotImplemented = "init(coder:) has not been implemented"
        case urlCouldNotBeParsed = "The given URL could not be transformed"
        case jsonCouldNotBeParsed = "The given JSON data could not be parsed into the target type, please make sure your data and types match"
        case jsonCouldNotBeEncoded = "The given value could not be encoded into a transportable data type, please make sure that your value conforms to the encodable protocol with coding keys"
        case nilValueUnwrapped = "A nil value was unwrapped"
        case indexOutOfBounds = "An index out of bounds error has occurred, please ensure that your pointer is within bounds of the target collection's size"
        case localizedStringNotFound = "A localization could not be located for the given string"
        case genericConversionError = "The given value could not be converted to the specified value"
        case infoPlistException = "An unexpected exception has occurred while parsing an info.plist file"
        case userNotificationAuthorizationRequestFailed = "Requesting authorization to use notification services failed unexpectedly"
        case reverseGeocodingFailed = "An error occurred while reverse geocoding the location provided."
    }
    
    static func getErrorCodeFor(code: ErrorCodes) -> String {
        return code.rawValue
    }
    
    static func printErrorCode(for code: ErrorCodes,
                               with extendedInformation: String = ""
    ) {
        print(code.rawValue + " " + extendedInformation)
    }
    
    static func triggerPreconditionFailure(
        for code: codes,
        using extendedInformation: String = ""
    ) -> (() -> (Never)) {
        guard ErrorCodeDispatcher.preconditionFailuresEnabled
        else {
            return { preconditionFailure() }}
        
        preconditionFailure(code.rawValue + ", " + extendedInformation)
    }
    
    static func triggerFatalError(
        for code: codes,
        with vestigialMessage: String = ""
    ) -> (() -> (Never)) {
        guard ErrorCodeDispatcher
            .fatalErrorsEnabled
        else {
            return { preconditionFailure() }}
        
        fatalError(code.rawValue + ", " + vestigialMessage)
    }
    
    static func throwError(for code: codes) -> Error {
        return code
    }
}

// MARK: - Error Codes for UserDefaults
extension ErrorCodeDispatcher.UserDefaultsErrors: ErrorCodeDispatcherProtocol {
    typealias ErrorCodes = codes
    
    enum codes: String, CaseIterable, Hashable {
        case invalidAppGroup = "Invalid App Group"
        case mismatchingGenericTypes = "The Generic Type given does not match what was returned"
    }
    
    static func getErrorCodeFor(code: ErrorCodes) -> String {
        return code.rawValue
    }
    
    static func triggerFatalError(for code: codes,
                                  with vestigialMessage: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher
            .fatalErrorsEnabled
        else {
            return { preconditionFailure() }}
        
        fatalError(code.rawValue + ", " + vestigialMessage)
    }
}

// MARK: - Error Codes for Bundle
extension ErrorCodeDispatcher.BundleErrors: ErrorCodeDispatcherProtocol {
    typealias ErrorCodes = codes
    
    enum codes: String, CaseIterable, Hashable {
        case infoDictionaryNotFound = "Info dictionary could not be resolved",
             bundleNameNotFound = "Bundle name could not be parsed",
             bundleVersionNotFound = "Bundle version could not be parsed",
             bundleShortVersionNotFound = "Bundle shortened version could not be parsed",
             bundleBuildIDNotFound = "Bundle build ID could not be parsed"
    }
    
    static func getErrorCodeFor(code: ErrorCodes) -> String {
        return code.rawValue
    }
    
    static func triggerFatalError(for code: codes,
                                  with vestigialMessage: String = "") -> (() -> (Never)) {
        guard ErrorCodeDispatcher
            .fatalErrorsEnabled
        else {
            return { preconditionFailure() }}
        
        fatalError(code.rawValue + ", " + vestigialMessage)
    }
}
