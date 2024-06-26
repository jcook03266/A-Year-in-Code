//
//  ForgotUsernameScreenViewModel.swift
//  Foncii
//
//  Created by Justin Cook on 2/20/23.
//

import SwiftUI
import Combine

class ForgotUsernameScreenViewModel: CoordinatedGenericViewModel {
    typealias coordinator = OnboardingCoordinator
    
    // MARK: - Properties
    var coordinator: coordinator
    
    // MARK: - Published
    // State Management
    @Published var isValidationInProgress: Bool = true
    @Published var displayActivityIndicator: Bool = false
    
    /// Exception handling - Default is true
    @Published var doesEmailExist: Bool = true
    
    // MARK: - Result Caching
    /// Keeps track of the last entered input for the asynchronously verified fields to prevent refetching the same result when the input hasn't been altered
    var lastEnteredEmail: String = ""
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let authService: AuthenticationService = inject(),
            validatorManager: ValidatorManager = inject(),
            alertManager: AlertManager = inject(),
            appService: AppService = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Assets
    let appLogoTextImage: Image = Images
        .getImage(named: .foncii_logo_text_accent_transparent)
    
    // MARK: - Styling
    // Colors
    let backgroundColor: Color = Colors.black_1,
        titleColor: Color = Colors.permanent_white,
        textColor: Color = Colors.permanent_white,
    invalidInputTextColor: Color = Colors.invalid_input_red
    
    // Fonts
    let titleFont: FontStyleRepository = .subtitle,
        titleFontWeight: UIFont.Weight = .semibold,
        textFont: FontStyleRepository = .subtitle,
        instructionsFont: FontStyleRepository = .caption
    
    // MARK: - Localized Text
    let titleText: String = LocalizedStrings
        .getLocalizedString(for: .FORGOT_USERNAME_SCREEN_TITLE),
sendButtonTitle: String = LocalizedStrings
        .getLocalizedString(for: .SEND),
instructionsText: String = LocalizedStrings
        .getLocalizedString(for: .FORGOT_USERNAME_SCREEN_INSTRUCTIONS),
emailPlaceholder: String = LocalizedStrings
        .getLocalizedString(for: .EMAIL_PLACEHOLDER),
unrecognizedEmailWarning: String = LocalizedStrings
        .getLocalizedString(for: .FORGOT_USERNAME_SCREEN_UNKNOWN_EMAIL)
    
    // MARK: - Convenience
    var canSubmit: Bool {
        let condition = emailInputTextFieldModel.validEntry
        
        return condition && isInternetAvailable
    }
    
    /// Display the error message when a valid email has been entered but it's one that doesn't exist on our backend
    var shouldDisplayErrorMessage: Bool {
        return hasUserEnteredEmailAddress && !doesEmailExist
    }
    
    /// Describes whether or not the text field contains a valid email address or not
    var hasUserEnteredEmailAddress: Bool {
        return emailInputTextFieldModel.determineContentType() == .email
    }
    
    var isInternetAvailable: Bool {
        return dependencies.appService.isClientOnline
    }
    
    // MARK: - Models
    var emailInputTextFieldModel: UserInputTextFieldViewModel!
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
        
        initModels()
    }
    
    // MARK: - Model Factory
    func initModels() {
        emailInputTextFieldModel = .init()
        
        emailInputTextFieldModel
            .configurator { [weak self] model in
                guard let self = self
                else { return }
                
                // Main properties
                model.textContentType = .emailAddress
                model.keyboardType = .emailAddress
                model.submitLabel = .done
                model.placeholderText = self.emailPlaceholder
                model.realTimeEntryValidationEnabled = false
                
                model.validationCondition = { @MainActor [weak self] emailString in
                    guard let self = self,
                          dependencies
                        .appService
                        .isClientOnline
                    else { return false }
                    
                    let textContentType = model.determineContentType()
                    let isEmailValid = (textContentType == .email)
                    isValidationInProgress = true
                    
                    /// Only send requests to the API if the email is at least valid on the client side
                    if isEmailValid {
                        /// Email not available means it already belongs to someone therefore it exists
                        self.doesEmailExist = await !self.dependencies
                            .authService
                            .isEmailAvailable(email: model.textEntry)
                    }
                    
                    isValidationInProgress = false
                    self.objectWillChange.send()
                    
                    return isEmailValid && self.doesEmailExist
                }
                
                model.onSubmitAction = { [weak self] in
                    guard let self = self,
                          lastEnteredEmail != model.textEntry
                    else { return }
                    
                    // Cache the last input
                    lastEnteredEmail = model.textEntry
                    
                    // Execute the asynchronous validation condition
                    Task { @MainActor in
                        model.isValidating = true
                        await model.executeValidationCondition()
                        model.isValidating = false
                        
                        self.objectWillChange.send()
                    }
                }
            }
    }
    
    /// Presents a confirmation view upon a successful email request
    private func presentConfirmationView() {
        self.coordinator
            .displayConfirmationScreen(
                destinationRoute: .main,
                confirmationMessage: LocalizedStrings
                .getLocalizedString(for:
                        .CONFIRMATION_MESSAGE_1),
                presentationDuration: ConfirmationScreenViewModel<coordinator>.totalDuration)
    }
}

// MARK: - Business Logic
extension ForgotUsernameScreenViewModel {
    // MARK: - Actions
    @MainActor
    var sendRequestAction: (() -> Void) {
        return { [weak self] in
            Task { @MainActor in
                
                guard let self = self,
                      self.canSubmit
                else { return }
                
                hideKeyboard()
                
                guard self.dependencies
                    .authService
                    .canTriggerPasswordResetRequest
                else {
                    // Inform the user that they cannot send any more requests
                    self.dependencies
                        .alertManager
                        .triggerErrorAlert(alertType: .FORGOT_USERNAME_ERROR_REQUEST_LIMIT_REACHED)
                    
                    return
                }
                
                // Start network activity indicator
                self.displayActivityIndicator = true
                
                // Await positive response, else display error message, enable button again and return
                let requestSuccessful = await self.dependencies
                    .authService
                    .triggerUsernameReminderAutomation()
                
                guard requestSuccessful
                else {
                    // Inform the user of the error and return
                    self.dependencies
                        .alertManager
                        .triggerErrorAlert(alertType: .FORGOT_USERNAME_ERROR_REQUEST_FAILED)
                    
                    return
                }
                
                // Stop network activity indicator and present confirmation view after a slight (0.5 second) delay
                try! await Task.sleep(until: .now + .seconds(0.5),
                                      clock: .suspending)
                
                self.displayActivityIndicator = false
                self.presentConfirmationView()
            }
        }
    }
}
