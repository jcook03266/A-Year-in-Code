//
// AlertManager.swift
// Foncii
//
// Created by Justin Cook on 4/8/23 at 2:59 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Combine

 class AlertManager: GenericViewModel {
    // MARK: - Published
    @Published var isAlertBeingPresented: Bool = false
    @Published var isActionSheetBeingPresented: Bool = false
    
    // Alert / Action Sheet Configurations
    @Published var currentAlertConfiguration: AlertConfiguration?
    @Published var currentActionSheetConfiguration: AlertConfiguration?
    
    // MARK: - Singleton
    static let shared: AlertManager = .init()
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        lazy var authenticationService: AuthenticationService = AlertManager.Dependencies.inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Supported Alerts
    /// Custom Error codes and localized descriptions.
    enum ErrorAlertTypes: String, CaseIterable {
        // OTP Errors
        case OTP_ERROR_REQUEST_UNAVAILABLE,
             OTP_ERROR_RESEND_REQUEST_UNAVAILABLE,
             OTP_ERROR_VALIDATION_UNAVAILABLE,
             OTP_ERROR_VALIDATION_FAILED,
             
             // Forgot Password Errors
             FORGOT_PASSWORD_ERROR_REQUEST_LIMIT_REACHED,
             FORGOT_PASSWORD_ERROR_REQUEST_FAILED,
             
             // Forgot Username Errors
            FORGOT_USERNAME_ERROR_REQUEST_LIMIT_REACHED,
            FORGOT_USERNAME_ERROR_REQUEST_FAILED,
             
             // Login Errors
             LOGIN_ERROR_NO_USER_DATA_FETCHED, /// User data request turned up no user data, either server outage, internal server issue, or no internet
        
            // Sign-Up Errors
            SIGN_UP_ERROR_NO_USER_DATA_FETCHED, /// User data fetch request turned up no user data, either server outage, internal server issue, or no internet
            SIGN_UP_ERROR_FIREBASE_USER_CREATION_FAILED, /// User can't create a firebase account for some reason, they have to try again
             
            // Aggregation Errors
            AGGREGATION_ERROR_NO_INTERNET,
             
            // Restaurant Interaction Errors
            RESTAURANT_INTERACTION_ERROR_OPERATION_FAILED, /// Generic error message for some restaurant interaction that didn't go through (internet unavailable or server is down)
        
            // Network Errors
            NETWORK_ERROR_INTERNET_UNAVAILABLE_OK,
            NETWORK_ERROR_INTERNET_UNAVAILABLE_RETRY /// Internet unavailable, allow the user to retry whatever network dependent task they were trying to accomplish
        
        // MARK: - Title and Message String getters
        func getMessage() -> String {
            var message: String = LocalizedStrings.getLocalizedString(for: .GENERIC_ALERT_MESSAGE)
            
            switch self {
            case .OTP_ERROR_REQUEST_UNAVAILABLE:
                message = LocalizedStrings.getLocalizedString(for: .OTP_ERROR_REQUEST_UNAVAILABLE_ALERT_MESSAGE)
                
            case .OTP_ERROR_RESEND_REQUEST_UNAVAILABLE:
                message = LocalizedStrings.getLocalizedString(for: .OTP_ERROR_RESEND_REQUEST_UNAVAILABLE_ALERT_MESSAGE)
                
            case .OTP_ERROR_VALIDATION_FAILED:
                var dependencies = AlertManager.Dependencies()
                let authService = dependencies.authenticationService
                let attemptsRemaining = authService.numberOfPasscodeValidationAttemptsRemaining

                message = LocalizedStrings.getLocalizedString(for: .OTP_ERROR_VALIDATION_FAILED_ALERT_MESSAGE) + " \(attemptsRemaining)"
                
            case .OTP_ERROR_VALIDATION_UNAVAILABLE:
                message = LocalizedStrings.getLocalizedString(for: .OTP_SCREEN_SUBHEADING)
                
            case .LOGIN_ERROR_NO_USER_DATA_FETCHED:
                message = LocalizedStrings.getLocalizedString(for: .LOGIN_ERROR_NO_USER_DATA_FETCHED_ALERT_MESSAGE)
                
            case .SIGN_UP_ERROR_NO_USER_DATA_FETCHED:
                message = LocalizedStrings.getLocalizedString(for: .SIGN_UP_ERROR_NO_USER_DATA_FETCHED_ALERT_MESSAGE)
                
            case .SIGN_UP_ERROR_FIREBASE_USER_CREATION_FAILED:
                message = LocalizedStrings.getLocalizedString(for: .SIGN_UP_ERROR_FIREBASE_USER_CREATION_FAILED_MESSAGE)
            
            case .AGGREGATION_ERROR_NO_INTERNET:
                message = LocalizedStrings.getLocalizedString(for: .AGGREGATION_ERROR_NO_INTERNET_ALERT_MESSAGE)
                
            case .RESTAURANT_INTERACTION_ERROR_OPERATION_FAILED:
                message = LocalizedStrings.getLocalizedString(for: .RESTAURANT_INTERACTION_ERROR_OPERATION_FAILED_ALERT_MESSAGE)
                
            case .NETWORK_ERROR_INTERNET_UNAVAILABLE_OK, .NETWORK_ERROR_INTERNET_UNAVAILABLE_RETRY:
                message = LocalizedStrings.getLocalizedString(for: .NETWORK_ERROR_INTERNET_UNAVAILABLE_ALERT_MESSAGE)
                
            case .FORGOT_PASSWORD_ERROR_REQUEST_LIMIT_REACHED:
                message = LocalizedStrings.getLocalizedString(for: .FORGOT_PASSWORD_ERROR_REQUEST_LIMIT_REACHED_ALERT_MESSAGE)
                
            case .FORGOT_PASSWORD_ERROR_REQUEST_FAILED:
                message = LocalizedStrings.getLocalizedString(for: .FORGOT_PASSWORD_ERROR_REQUEST_FAILED_ALERT_MESSAGE)
                
            case .FORGOT_USERNAME_ERROR_REQUEST_LIMIT_REACHED:
                message = LocalizedStrings.getLocalizedString(for: .FORGOT_USERNAME_ERROR_REQUEST_LIMIT_REACHED_ALERT_MESSAGE)
                
            case .FORGOT_USERNAME_ERROR_REQUEST_FAILED:
                message = LocalizedStrings.getLocalizedString(for: .FORGOT_USERNAME_ERROR_REQUEST_FAILED_ALERT_MESSAGE)

            }
            
            return message
        }
        
        func getTitle() -> String {
            var title: String = LocalizedStrings.getLocalizedString(for: .GENERIC_ALERT_TITLE)
            
            switch self {
            case .OTP_ERROR_REQUEST_UNAVAILABLE, .OTP_ERROR_VALIDATION_UNAVAILABLE, .OTP_ERROR_VALIDATION_FAILED, .OTP_ERROR_RESEND_REQUEST_UNAVAILABLE:
                title = LocalizedStrings.getLocalizedString(for: .OTP_ERROR_ALERT_TITLE)
                
            case .LOGIN_ERROR_NO_USER_DATA_FETCHED:
                title = LocalizedStrings.getLocalizedString(for: .LOGIN_ERROR_ALERT_TITLE)
                
            case .SIGN_UP_ERROR_NO_USER_DATA_FETCHED, .SIGN_UP_ERROR_FIREBASE_USER_CREATION_FAILED:
                title = LocalizedStrings.getLocalizedString(for: .SIGN_UP_ERROR_ALERT_TITLE)
                
            case .AGGREGATION_ERROR_NO_INTERNET:
                title = LocalizedStrings.getLocalizedString(for: .AGGREGATION_ERROR_ALERT_TITLE)
                
            case .RESTAURANT_INTERACTION_ERROR_OPERATION_FAILED:
                title = LocalizedStrings
                    .getLocalizedString(for: .RESTAURANT_INTERACTION_ERROR_ALERT_TITLE)
                
            case .NETWORK_ERROR_INTERNET_UNAVAILABLE_OK, .NETWORK_ERROR_INTERNET_UNAVAILABLE_RETRY:
                title = LocalizedStrings.getLocalizedString(for: .NETWORK_ERROR_ALERT_TITLE)
                
            case .FORGOT_PASSWORD_ERROR_REQUEST_LIMIT_REACHED, .FORGOT_PASSWORD_ERROR_REQUEST_FAILED:
                title = LocalizedStrings.getLocalizedString(for: .FORGOT_PASSWORD_ERROR_TITLE)
                
            case .FORGOT_USERNAME_ERROR_REQUEST_LIMIT_REACHED, .FORGOT_USERNAME_ERROR_REQUEST_FAILED:
                title = LocalizedStrings.getLocalizedString(for: .FORGOT_USERNAME_ERROR_TITLE)
            }
            
            return title
        }
    }
    
    // MARK: - Main View Modifier
    struct AlertManagerViewModifier: ViewModifier {
        // MARK: - Observed - Necessary for updating this modifier when changes are made to the alert manager
        @ObservedObject var alertManager: AlertManager = .shared
        
        func body(content: Content) -> some View {
            Group {
                content
                    .alert(alertManager.currentAlertConfiguration?.title ?? "",
                           isPresented: $alertManager.isAlertBeingPresented,
                           actions: { alertManager.currentAlertConfiguration?.actionView ?? AnyView(EmptyView()) },
                           message: { alertManager.currentAlertConfiguration?.messageView ?? AnyView(EmptyView()) })
            }
        }
    }
    
    private init() {}
    
    // MARK: - Life Cycle Management
    /// Presentation
    /// Note: Dimissal of any action sheet is necessary before displaying an alert, likewise for action sheets and alerts
    func presentAlert() {
        self.isAlertBeingPresented = true
    }
    
    func presentActionSheet() {
        self.isActionSheetBeingPresented = true
    }
    
    /// Dismissal
    func dismissAll() {
        self.isAlertBeingPresented = false
        self.isActionSheetBeingPresented = false
    }
}

// MARK: - View Extension For Ease of Use
extension View {
    func useAlertManager() -> some View {
        return modifier(AlertManager.AlertManagerViewModifier())
    }
}


// MARK: - Alert View Modifiers and functionality
extension AlertManager {
    
    /// A set of properties for configurating a reusable confirmation dialogue popup
    struct AlertConfiguration {
        // MARK: - Properties
        // Custom Views
        /// The main title for the alert
        var title: String,
            /// A text view with whatever information you want to convey
            messageView: AnyView,
            /// A group of buttons with custom actions
            actionView: AnyView
        
        init(title: String,
             messageView: AnyView,
             actionView: AnyView)
        {
            self.title = title
            self.messageView = messageView
            self.actionView = actionView
        }
    }
    
    // MARK: - Alert Trigger Functions
    nonisolated func triggerErrorAlert(
        alertType: ErrorAlertTypes,
        primaryAction: (() -> Void)? = nil,
        cancelAction: (() -> Void)? = nil,
        hasCancelButton: Bool = false
    ) {
        Task { @MainActor in
            // MARK: - Alert View Templates
            // Reusable action view templates
            // Buttons: [Cancel, Ok]
            let genericCancellableActionView: ((LocalizedStrings?) -> AnyView) = { primaryActionTitle in
                AnyView(
                    Group {
                        Button(LocalizedStrings.getLocalizedString(for: primaryActionTitle ?? .GENERIC_ALERT_CONFIRM_ACTION)) {
                            primaryAction?()
                        }
                        
                        Button(LocalizedStrings.getLocalizedString(for: .GENERIC_ALERT_CANCEL_ACTION),
                               role: .cancel) {
                            cancelAction?()
                        }
                    })
            }
            
            // Buttons: [Ok]
            let genericOkActionView: ((LocalizedStrings?) -> AnyView) = { primaryActionTitle in
                AnyView(
                    Group {
                        Button(LocalizedStrings.getLocalizedString(for: primaryActionTitle ?? .GENERIC_ALERT_OK_ACTION),
                               role: .cancel) {
                            primaryAction?()
                        }
                    })
            }
            
            // Buttons: [Cancel, Retry]
            let genericRetryableActionView: AnyView = genericCancellableActionView(.GENERIC_ALERT_RETRY_ACTION)
            
            // Buttons: [Cancel, Submit]
            let genericSendableActionView: AnyView = genericCancellableActionView(.GENERIC_ALERT_SUBMIT_ACTION)
            
            // Buttons: [Cancel, Delete]
            let genericDestructableActionView: ((LocalizedStrings?) -> AnyView) = { primaryActionTitle in
                AnyView(
                    Group {
                        Button(LocalizedStrings.getLocalizedString(for: primaryActionTitle ?? .GENERIC_ALERT_DELETE_ACTION),
                               role: .destructive) {
                            primaryAction?()
                        }
                        
                        Button(LocalizedStrings.getLocalizedString(for: .GENERIC_ALERT_CANCEL_ACTION),
                               role: .cancel) {
                            cancelAction?()
                        }
                    })
            }
            
            let messageView = AnyView(Text(alertType.getMessage()))
            
            switch alertType {
            case .OTP_ERROR_REQUEST_UNAVAILABLE:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericOkActionView(nil))
                
            case .OTP_ERROR_VALIDATION_UNAVAILABLE:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericRetryableActionView)
                
            case .LOGIN_ERROR_NO_USER_DATA_FETCHED:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericRetryableActionView)
                
            case .SIGN_UP_ERROR_NO_USER_DATA_FETCHED:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericRetryableActionView)
                
            case .SIGN_UP_ERROR_FIREBASE_USER_CREATION_FAILED:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericOkActionView(nil))
                
            case .AGGREGATION_ERROR_NO_INTERNET:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericRetryableActionView)
                
            case .RESTAURANT_INTERACTION_ERROR_OPERATION_FAILED:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericOkActionView(nil))
                
            case .NETWORK_ERROR_INTERNET_UNAVAILABLE_OK:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericOkActionView(nil))
                
            case .NETWORK_ERROR_INTERNET_UNAVAILABLE_RETRY:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericRetryableActionView)
                
            case .OTP_ERROR_RESEND_REQUEST_UNAVAILABLE:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericOkActionView(nil))
            case .OTP_ERROR_VALIDATION_FAILED:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericOkActionView(nil))
            case .FORGOT_PASSWORD_ERROR_REQUEST_LIMIT_REACHED, .FORGOT_PASSWORD_ERROR_REQUEST_FAILED:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericOkActionView(nil))
                
            case .FORGOT_USERNAME_ERROR_REQUEST_LIMIT_REACHED, .FORGOT_USERNAME_ERROR_REQUEST_FAILED:
                self.currentAlertConfiguration = .init(title: alertType.getTitle(),
                                                       messageView: messageView,
                                                       actionView: genericOkActionView(nil))
            }
            
            presentAlert()
        }
    }
    
    // TODO: - Implement
    func triggerConfirmationAlert() {}
    func triggerActionSheet() {}
}
