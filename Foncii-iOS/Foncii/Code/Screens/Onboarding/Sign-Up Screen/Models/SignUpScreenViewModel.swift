//
//  SignUpScreenViewModel.swift
//  Foncii
//
//  Created by Justin Cook on 2/25/23.
//

import SwiftUI
import Combine

/// The sign up screen is the basic entry point into the application's restricted content areas and allows the user to login or
/// create an account using custom attributes, and flexible account identifiers such as email / phone number / username or OAuth providers of their choice
class SignUpScreenViewModel: CoordinatedGenericViewModel {
    typealias coordinator = OnboardingCoordinator
    
    // MARK: - Properties
    var coordinator: coordinator
    
    // MARK: - Published
    @Published var textFieldCurrentlyFocused: Bool = false
    @Published var currentlySelectedTextField: UserInputTextFieldViewModel? = nil
    
    // UI State Management
    /// Used to determine whether or not some async validation process is currently in-progress, if one is then the user can't proceed until the process finishes
    @Published var isValidationInProgress: Bool = true
    @Published var displayActivityIndicator: Bool = false
    
    /// True when the unique identifier is verified to be unique [not in use already], false otherwise, default is true
    @Published var emailAvailable: Bool = true
    @Published var phoneNumberAvailable: Bool = true
    @Published var usernameAvailable: Bool = true
    
    // MARK: - Result Caching
    /// Keeps track of the last entered input for the asynchronously verified fields to prevent refetching the same result when the input hasn't been altered
    var lastEnteredUsernameInput: String = ""
    var lastEnteredPhoneNumberInput: String = ""
    var lastEnteredEmailInput: String = ""
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let authService: AuthenticationService = inject(),
            validatorManager: ValidatorManager = inject(),
            userManager: UserManager = inject(),
            appService: AppService = inject(),
            alertManager: AlertManager = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Convenience
    var shouldDisplayInstructions: Bool {
        return !currentInstructions.isEmpty
    }
    
    // Validation State Accessors
    var enteredEmailValid: Bool {
        return emailInputTextFieldModel.validEntry
    }
    
    var enteredPhoneNumberValid: Bool {
        return phoneNumberInputTextFieldModel.validEntry
    }
    
    var enteredUsernameValid: Bool {
        return usernameInputTextFieldModel.validEntry
    }
    
    var enteredPasswordValid: Bool {
        return passwordInputTextFieldModel.validEntry
    }
    
    var isInternetAvailable: Bool {
        return dependencies.appService.isClientOnline
    }
    
    /// True if a warning instruction is supposed to be currently displayed for the selected field with a previously incorrect input
    var warningIsBeingDisplayed: Bool {
        guard let textField = currentlySelectedTextField,
              textField.hasText
        else { return false }
        
        if textField === emailInputTextFieldModel {
            return !emailAvailable && !enteredEmailValid
        }
        else if textField === phoneNumberInputTextFieldModel {
            return !phoneNumberAvailable && !enteredPhoneNumberValid
        }
        else if textField === usernameInputTextFieldModel {
            return !usernameAvailable && !enteredUsernameValid
        }
        else if textField === passwordInputTextFieldModel {
            return !enteredPasswordValid
        }
        else {
            return false
        }
    }
    
    /// Determines whether or not the user can press the submit button (network dependent as well)
    var canSubmit: Bool {
        let userInput = getTextFieldContents()
        
        guard let fullName = userInput[.fullName],
              let email = userInput[.email],
              let phoneNumber = userInput[.phoneNumber],
              let username = userInput[.username],
              let password = userInput[.password]
        else { return false }
        
        /// All fields must be valid and filled
        let condition = !fullName.isEmpty
        && !email.isEmpty
        && !phoneNumber.isEmpty
        && !username.isEmpty
        && !password.isEmpty
        
        return condition && isInternetAvailable && !isValidationInProgress
    }
    
    // MARK: - Assets
    let appLogoTextImage: Image = Images.getImage(named: .foncii_logo_text_accent_transparent),
        /// Third-party auth provider company logos
        appleLogo: Image = Images.getImage(named: .apple_logo),
        twitterLogo: Image = Images.getImage(named: .twitter_logo),
        googleLogo: Image = Images.getImage(named: .google_logo),
        facebookLogo: Image = Images.getImage(named: .facebook_logo)
    
    // MARK: - Styling
    // Colors
    let backgroundColor: Color = Colors.black_1,
        titleColor: Color = Colors.permanent_white,
        textColor: Color = Colors.neutral_1,
        inlineTextButtonColor: Color = Colors.primary_1
    
    var bottomInstructionsTextColor: Color {
        return warningIsBeingDisplayed ? Colors.invalid_input_red : Colors.neutral_1
    }
    
    // Fonts
    let orBranchPromptFont: FontStyleRepository = .body,
        forgotPromptFont: FontStyleRepository = .subtitle,
        titleFont: FontStyleRepository = .subtitle,
        titleFontWeight: UIFont.Weight = .semibold,
        topPromptSubtitleFont: FontStyleRepository = .subtitle,
        instructionsFont: FontStyleRepository = .caption
    
    // MARK: - Localized Text
    let submitButtonTitle: String = LocalizedStrings
        .getLocalizedString(for: .SUBMIT),
topPromptSubtitleText_Fragment_1: String = LocalizedStrings
        .getLocalizedString(for: .SIGN_UP_SCREEN_PROMPT_SUBTITLE_FRAGMENT_1),
topPromptSubtitleText_Fragment_2: String = LocalizedStrings
        .getLocalizedString(for: .SIGN_UP_SCREEN_PROMPT_SUBTITLE_FRAGMENT_2),
topPromptSubtitleInlineButtonText: String = LocalizedStrings
        .getLocalizedString(for: .SIGN_UP_SCREEN_PROMPT_SUBTITLE_FRAGMENT_3),
titleText: String = LocalizedStrings
        .getLocalizedString(for: .SIGN_UP),
orBranchPrompt: String = LocalizedStrings
        .getLocalizedString(for: .OR),
fullNameFieldPlaceholder: String = LocalizedStrings
        .getLocalizedString(for: .FULL_NAME),
emailFieldPlaceholder: String = LocalizedStrings
        .getLocalizedString(for: .EMAIL),
phoneNumberFieldPlaceholder: String = LocalizedStrings
        .getLocalizedString(for: .PHONE_NUMBER),
usernameFieldPlaceholder: String = LocalizedStrings
        .getLocalizedString(for: .USERNAME),
passwordFieldPlaceholder: String = LocalizedStrings
        .getLocalizedString(for: .PASSWORD)
    
    // Bottom Instructions
    // User instructions
    let phoneNumberInstructions: String = LocalizedStrings
        .getLocalizedString(for: .SIGN_UP_SCREEN_PHONE_NUMBER_INSTRUCTIONS),
usernameInstructions: String = LocalizedStrings
        .getLocalizedString(for: .SIGN_UP_SCREEN_USERNAME_INSTRUCTIONS),
passwordInstructions: String = LocalizedStrings
        .getLocalizedString(for: .SIGN_UP_SCREEN_PASSWORD_INSTRUCTIONS),
    
    // Warnings
phoneNumberWarning: String = LocalizedStrings
        .getLocalizedString(for: .SIGN_UP_SCREEN_PHONE_NUMBER_ALREADY_IN_USE_WARNING),
emailWarning: String = LocalizedStrings
        .getLocalizedString(for: .SIGN_UP_SCREEN_EMAIL_ALREADY_IN_USE_WARNING),
usernameWarning: String = LocalizedStrings
        .getLocalizedString(for: .SIGN_UP_SCREEN_USERNAME_ALREADY_IN_USE_WARNING)
    
    /// The current instructions to display at the bottom of the user entry section
    var currentInstructions: String {
        var instructions: String = ""
        
        // Full Name Text Field
        if fullNameInputTextFieldModel.focused {}
        // Email Text Field
        else if emailInputTextFieldModel.focused {
            instructions = emailAvailable ? "" : emailWarning
        }
        // Phone Number Text Field
        else if phoneNumberInputTextFieldModel.focused {
            instructions = phoneNumberAvailable ? phoneNumberInstructions : phoneNumberWarning
        }
        // Username Text Field
        else if usernameInputTextFieldModel.focused {
            instructions = usernameAvailable ? usernameInstructions : usernameWarning
        }
        // Password Text Field
        else if passwordInputTextFieldModel.focused
        { instructions = passwordInstructions }
        
        return instructions
    }
    
    // MARK: - Actions
    /// Backtracks or progresses forward toward the login screen
    var navigateToLoginScreenAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .seekOutView(with: .login)
        }
    }
    
    /// Navigates to the next required screen depending on the user's sign up preferences
    var navigateToNextScreenAction: (() -> Void) {
        return { [weak self] in
            guard let self = self,
                  canSubmit
            else { return }
            
            let nextRoute = self.coordinator
                .router
                .getNextRouteFrom(route: .signUp(referralID: nil))
            
            self.coordinator.pushView(with: nextRoute)
        }
    }
    
    // MARK: - Models
    var fullNameInputTextFieldModel: UserInputTextFieldViewModel!
    var emailInputTextFieldModel: UserInputTextFieldViewModel!
    var phoneNumberInputTextFieldModel: UserInputTextFieldViewModel!
    var usernameInputTextFieldModel: UserInputTextFieldViewModel!
    var passwordInputTextFieldModel: UserInputTextFieldViewModel!
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
        
        initModels()
        addSubscribers()
    }
    
    func addSubscribers() {
        // Update the UI whenever a textfield is focused in order to trigger necessary UI elements to appear
        fullNameInputTextFieldModel
            .$focused
            .receive(on: scheduler)
            .combineLatest(emailInputTextFieldModel.$focused,
                           phoneNumberInputTextFieldModel.$focused,
                           usernameInputTextFieldModel.$focused)
            .combineLatest(passwordInputTextFieldModel.$focused)
            .sink { [weak self] (textFieldFocusStates, t5) in
                guard let self = self
                else { return }
                
                let (t1, t2, t3, t4) = textFieldFocusStates
                self.textFieldCurrentlyFocused = t1 || t2 || t3 || t4 || t5
                
                if textFieldCurrentlyFocused {
                    switch self.textFieldCurrentlyFocused {
                    case t1:
                        currentlySelectedTextField = fullNameInputTextFieldModel
                    case t2:
                        currentlySelectedTextField = emailInputTextFieldModel
                    case t3:
                        currentlySelectedTextField = phoneNumberInputTextFieldModel
                    case t4:
                        currentlySelectedTextField = usernameInputTextFieldModel
                    case t5:
                        currentlySelectedTextField = passwordInputTextFieldModel
                    default:
                        currentlySelectedTextField = nil
                    }
                }
                else { currentlySelectedTextField = nil }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Model Factory
    private func initModels() {
        // Password Entry & Validation
        passwordInputTextFieldModel = .init()
        passwordInputTextFieldModel
            .configurator { [weak self] model in
                guard let self = self
                else { return }
                
                // Main properties
                model.textContentType = .newPassword
                model.keyboardType = .asciiCapable
                model.submitLabel = .done
                model.protected = true
                model.placeholderText = self.passwordFieldPlaceholder
                model.realTimeEntryValidationEnabled = true
                
                model.validationCondition = { inputString in
                    return self.dependencies
                        .validatorManager
                        .getValidator(for: .passwordValidator)
                        .validate(inputString)
                }
                
                // In-field button
                model.inFieldButtonIcon = Icons.getIconImage(named: .eye_slash)
                model.inFieldButtonAction = {
                    model.protected.toggle()
                    
                    model.inFieldButtonIcon = model.protected ? Icons.getIconImage(named: .eye_slash) : Icons.getIconImage(named: .eye)
                }
            }
        
        // Username Entry & Validation
        usernameInputTextFieldModel = .init()
        usernameInputTextFieldModel
            .configurator { [weak self] model in
                guard let self = self
                else { return }
                
                // Main properties
                model.textContentType = .username
                model.keyboardType = .alphabet
                model.submitLabel = .continue
                model.placeholderText = self.usernameFieldPlaceholder
                model.realTimeEntryValidationEnabled = false
                
                model.validationCondition = { @MainActor [weak self] inputString in
                    guard let self = self,
                          dependencies
                        .appService
                        .isClientOnline
                    else { return false}
                    
                    let isUsernameValid = self.dependencies
                        .validatorManager
                        .getValidator(for: .usernameValidator)
                        .validate(inputString)
                    
                    self.usernameAvailable = await self.dependencies
                        .authService
                        .isUsernameAvailable(username: model.textEntry)
                    
                    return isUsernameValid && self.usernameAvailable
                }
                
                /// Only validate when the input changes and internet is available
                model.onSubmitAction = { [weak self] in
                    guard let self = self,
                          lastEnteredUsernameInput != model.textEntry
                    else { return }
                    
                    // Cache the last input
                    lastEnteredUsernameInput = model.textEntry
                    
                    // Execute the asynchronous validation condition
                    Task { @MainActor in
                        model.isValidating = true
                        self.isValidationInProgress = true
                        
                        await model.executeValidationCondition()
                        
                        model.isValidating = false
                        self.isValidationInProgress = false
                    }
                    
                    self.passwordInputTextFieldModel
                        .focused = true
                }
            }
        
        // Phone Number & Validation
        phoneNumberInputTextFieldModel = .init()
        phoneNumberInputTextFieldModel
            .configurator { [weak self] model in
                guard let self = self
                else { return }
                
                // Main properties
                model.textContentType = .telephoneNumber
                model.keyboardType = .numberPad
                model.submitLabel = .continue
                model.placeholderText = self.phoneNumberFieldPlaceholder
                model.realTimeEntryValidationEnabled = false
                
                /// Validates the dynamic input of this field by determining the content type of the input text to be either a phone number or email
                model.validationCondition = { @MainActor [weak self] inputString in
                    guard let self = self,
                          dependencies
                        .appService
                        .isClientOnline
                    else { return false }
                    let textFieldContentType = model.determineContentType()
                    
                    if textFieldContentType == .phoneNumber {
                        /// Split the phone number's components
                        let phoneNumberModel = PhoneNumberModel(countryCode: .US,
                                                                nsn: model.textEntry)
                        self.phoneNumberAvailable = await self.dependencies
                            .authService
                            .isPhoneNumberAvailable(phoneNumber: phoneNumberModel)
                        
                        return self.phoneNumberAvailable
                    }
                    
                    return false
                }
                
                /// Only validate when the input changes and internet is available
                model.onSubmitAction = { [weak self] in
                    guard let self = self,
                          lastEnteredPhoneNumberInput != model.textEntry
                    else { return }
                    
                    // Cache the last input
                    lastEnteredPhoneNumberInput = model.textEntry
                    
                    /// If the text input has been inferred to be a phone # then format it as such
                    if model.determineContentType() == .phoneNumber {
                        model.textEntry = self.dependencies
                            .validatorManager
                            .validators
                            .USPhoneNumberValidator
                            .formatPhoneNumber(phoneNumberString: model.textEntry)
                    }
                    
                    // Execute the asynchronous validation condition
                    Task { @MainActor in
                        model.isValidating = true
                        self.isValidationInProgress = true
                        
                        await model.executeValidationCondition()
                        
                        model.isValidating = false
                        self.isValidationInProgress = false
                    }
                    
                    self.usernameInputTextFieldModel
                        .focused = true
                }
            }
        
        // Email & Validation
        emailInputTextFieldModel = .init()
        emailInputTextFieldModel
            .configurator { [weak self] model in
                guard let self = self
                else { return }
                
                // Main properties
                model.textContentType = .emailAddress
                model.keyboardType = .emailAddress
                model.submitLabel = .continue
                model.placeholderText = self.emailFieldPlaceholder
                model.realTimeEntryValidationEnabled = false
                
                /// Validates the dynamic input of this field by determining the content type of the input text to be either a phone number or email
                model.validationCondition = { @MainActor [weak self] inputString in
                    guard let self = self,
                          dependencies
                        .appService
                        .isClientOnline
                    else { return false }
                    let textFieldContentType = model.determineContentType()
                    
                    if textFieldContentType == .email {
                        self.emailAvailable = await self.dependencies
                            .authService
                            .isEmailAvailable(email: model.textEntry)
                        
                        return self.emailAvailable
                    }
                    
                    return false
                }
                
                /// Only validate when the input changes and internet is available
                model.onSubmitAction = { [weak self] in
                    guard let self = self,
                          lastEnteredEmailInput != model.textEntry
                    else { return }
                    
                    /// Cache the last input
                    lastEnteredEmailInput = model.textEntry
                    
                    /// Execute the asynchronous validation condition
                    Task { @MainActor in
                        self.isValidationInProgress = true
                        model.isValidating = true
                        
                        await model.executeValidationCondition()
                        
                        self.isValidationInProgress = false
                        model.isValidating = false
                    }
                    
                    self.phoneNumberInputTextFieldModel
                        .focused = true
                }
            }
        
        // Full Name Input & Validation
        fullNameInputTextFieldModel = .init()
        fullNameInputTextFieldModel
            .configurator { [weak self] model in
                guard let self = self
                else { return }
                
                // Main properties
                model.textContentType = .name
                model.keyboardType = .alphabet
                model.submitLabel = .continue
                model.textInputAutocapitalization = .words
                model.placeholderText = self.fullNameFieldPlaceholder
                model.realTimeEntryValidationEnabled = true
                
                model.validationCondition = { inputString in
                    return self.dependencies
                        .validatorManager
                        .getValidator(for: .personNameValidator)
                        .validate(inputString)
                }
                
                model.onSubmitAction = { [weak self] in
                    guard let self = self
                    else { return }
                    
                    self.emailInputTextFieldModel
                        .focused = true
                }
            }
    }
    
    /// For keeping track of transportable field data in dictionary form when a user is ready to submit their info
    enum SignUpFields: String, CaseIterable {
        case fullName
        case email
        case phoneNumber
        case username
        case password
    }
}

// MARK: - Business Logic
extension SignUpScreenViewModel {
    /**
     Returns the user's input from the text fields in an organized dictionary
     The contents of the dictionary are pre-validated, if the value is an empty string then that means the textfield's content is invalid or empty
     */
    func getTextFieldContents() -> [SignUpFields : String] {
        return [
            .fullName : fullNameInputTextFieldModel.validEntry ?
            fullNameInputTextFieldModel.textEntry : .empty,
            
                .email : emailInputTextFieldModel.validEntry ?
            emailInputTextFieldModel.textEntry : .empty,
            
                .phoneNumber : phoneNumberInputTextFieldModel.validEntry ?
            phoneNumberInputTextFieldModel.textEntry : .empty,
            
                .username : usernameInputTextFieldModel.validEntry ?
            usernameInputTextFieldModel.textEntry : .empty,
            
                .password : passwordInputTextFieldModel.validEntry ?
            passwordInputTextFieldModel.textEntry : .empty
        ]
    }
    
    // MARK: - Actions
    var submitButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.signUp()
        }
    }
    
    
    // OAuth Provider Actions
    var signUpWithAppleAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.signUp(with: .apple)
        }
    }
    
    var signUpWithTwitterAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.signUp(with: .twitter)
        }
    }
    
    var signUpWithGoogleAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.signUp(with: .google)
        }
    }
    
    var signUpWithFacebookAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.signUp(with: .facebook)
        }
    }
    
    /// Routes to the specified third party strategy's authentication handler
    private func signUp(with strategy: AuthenticationService.ThirdPartyAuthStrategies) {
        Task { @MainActor in
            // Start network activity indicator
            self.displayActivityIndicator = true
            
            await dependencies
                .authService
                .createNewAuthUser(using: strategy)
            
            self.displayActivityIndicator = false
            
            transitionFollowingSignUp()
        }
    }
    
    /// Routes to the determined first party strategy's authentication handler, i.e email, phone, etc depending on what the user's entry type is for the first text field
    private func signUp() {
        Task { @MainActor in
            guard canSubmit
            else { return }
            let userInput = getTextFieldContents()
            
            // Only continue if the required inputs are provided
            guard let fullName = userInput[.fullName],
                  let email = userInput[.email],
                  let phoneNumber = userInput[.phoneNumber],
                  let username = userInput[.username],
                  let password = userInput[.password]
            else { return }
            
            // Start network activity indicator
            self.displayActivityIndicator = true
            
            await dependencies
                .authService
                .createNewAuthUser(email: email,
                                   password: password,
                                   attributes: [
                                    .fullName : fullName,
                                    .phoneNumber: phoneNumber,
                                    .username : username
                                   ])
            
            self.displayActivityIndicator = false
            
            transitionFollowingSignUp()
        }
    }
    
    /// Transition to the next scene if the sign up was successful, display an error if it wasn't
    private func transitionFollowingSignUp() {
        if dependencies.authService.isAuthenticated {
            if dependencies.userManager.currentUser != nil {
                navigateToNextScreenAction()
            }
            else {
                /// Present error informing the user that they must try to submit their credentials again
                dependencies
                    .alertManager
                    .triggerErrorAlert(alertType: .SIGN_UP_ERROR_NO_USER_DATA_FETCHED) {
                        self.signUp()
                    }
            }
        }
    }
}
