//
//  LoginScreenViewModel.swift
//  Foncii
//
//  Created by Justin Cook on 2/18/23.
//

import SwiftUI
import Combine

/// A view model for the login screen and a proxy for interfacing with the authentication service layer which allows the user to authenticate themselves using various methods and gain access to the app's main content`
class LoginScreenViewModel: CoordinatedGenericViewModel {
    typealias coordinator = OnboardingCoordinator
    
    // MARK: - Properties
    var coordinator: coordinator
    
    // MARK: - Published
    @Published var textFieldCurrentlyFocused: Bool = false
    @Published var currentlySelectedTextField: UserInputTextFieldViewModel? = nil
    
    // State Management
    /// Used to determine whether or not some async validation process is currently in-progress, if one is then the user can't proceed until the process finishes
    @Published var isValidationInProgress: Bool = true
    @Published var displayActivityIndicator: Bool = false
    
    // Validation
    @Published var isAuthenticated: Bool = false
    @Published var didValidateUserIdentifierInput: Bool = false
    @Published var didAttemptDefaultAuthentication: Bool = false
    @Published var didAttempOAuthentication: Bool = false
    
    /// True when the identifier exists and is attached to some real user in the backend, false otherwise (Authentication not possible for an account that doesn't exist)
    @Published var doesEmailExist: Bool = true
    @Published var doesPhoneNumberExist: Bool = true
    @Published var doesUsernameExist: Bool = true
    
    // MARK: - Result Caching
    /// Keeps track of the last entered input for the asynchronously verified fields to prevent refetching the same result when the input hasn't been altered
    var lastEnteredUserIdentifier: String = ""
    
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
    var shouldDisplayInvalidEntryPrompts: Bool {
        return shouldDisplayInvalidUserIdentifierInputFieldWarning || shouldDisplayInvalidPasswordInputFieldWarning
    }
    
    var shouldDisplayInvalidUserIdentifierInputFieldWarning: Bool {
        return didValidateUserIdentifierInput && !isUserIdentifierFieldValid
    }
    
    var shouldDisplayInvalidPasswordInputFieldWarning: Bool {
        return !isAuthenticated && didAttemptDefaultAuthentication
    }
    
    var isUserIdentifierFieldValid: Bool {
        return userIdentifierInputTextFieldModel.validEntry
    }
    
    var isInternetAvailable: Bool {
        return dependencies.appService.isClientOnline
    }
    
    /// Determines whether or not the user can press the login button
    var canSubmit: Bool {
        let userInput = getTextFieldContents()
        
        guard let userIdentifier = userInput[.userIdentifier],
              let password = userInput[.password]
        else { return false }
        
        /// All fields must be valid and filled
        let condition = !userIdentifier.isEmpty
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
        inlineTextButtonColor: Color = Colors.primary_1,
        invalidInputTextColor: Color = Colors.invalid_input_red
    
    // Fonts
    let invalidEntryPromptFont: FontStyleRepository = .caption,
        orBranchPromptFont: FontStyleRepository = .body,
        forgotPromptFont: FontStyleRepository = .subtitle,
        titleFont: FontStyleRepository = .subtitle,
        titleFontWeight: UIFont.Weight = .semibold,
        topPromptSubtitleFont: FontStyleRepository = .subtitle
    
    // MARK: - Localized Text
    let loginButtonTitle: String = LocalizedStrings
        .getLocalizedString(for: .LOG_IN)
        .capitalizedFirstLetter,
invalidUserIdentifierFieldPrompt: String = LocalizedStrings
        .getLocalizedString(for: .LOGIN_SCREEN_INCORRECT_USER_IDENTIFIER),
invalidPasswordPrompt: String = LocalizedStrings
        .getLocalizedString(for: .LOGIN_SCREEN_INCORRECT_PASSWORD),
titleText: String = LocalizedStrings
        .getLocalizedString(for: .LOG_IN)
        .capitalizedFirstLetter,
orBranchPrompt: String = LocalizedStrings
        .getLocalizedString(for: .OR),
userIdentifierPlaceholder: String = LocalizedStrings
        .getLocalizedString(for: .LOGIN_SCREEN_INPUT_FIELD_1_PLACEHOLDER),
passwordFieldPlaceholder: String = LocalizedStrings
        .getLocalizedString(for: .PASSWORD),
topPromptSubtitleText_Fragment_1: String = LocalizedStrings
        .getLocalizedString(for: .LOGIN_SCREEN_PROMPT_SUBTITLE_FRAGMENT_1),
topPromptSubtitleText_Fragment_2: String = LocalizedStrings
        .getLocalizedString(for: .LOGIN_SCREEN_PROMPT_SUBTITLE_FRAGMENT_2),
topPromptSubtitleInlineButtonText: String = LocalizedStrings
        .getLocalizedString(for: .LOGIN_SCREEN_PROMPT_CREATE_NEW_ACCOUNT_BUTTON_TEXT),
    
    // Forgot password / username fragments
forgotPromptFragment_1: String = LocalizedStrings
        .getLocalizedString(for: .LOGIN_SCREEN_FORGOT_LOGIN_PROMPT_FRAGMENT_1),
forgotPromptFragment_1_Button_Text: String = LocalizedStrings
        .getLocalizedString(for: .USERNAME),
forgotPromptFragment_2: String = LocalizedStrings
        .getLocalizedString(for: .LOGIN_SCREEN_FORGOT_LOGIN_PROMPT_FRAGMENT_2),
forgotPromptFragment_2_Button_Text: String = LocalizedStrings
        .getLocalizedString(for: .PASSWORD),
forgotPromptFragment_3: String = LocalizedStrings
        .getLocalizedString(for: .LOGIN_SCREEN_FORGOT_LOGIN_PROMPT_FRAGMENT_3)
    
    // MARK: - Actions
    var forgotUsernameAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .pushView(with: .forgotUsername)
        }
    }
    
    var resetPasswordAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .pushView(with: .resetPassword)
        }
    }
    
    var navigateToSignUpScreenAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .seekOutView(with: .signUp(referralID: nil))
        }
    }
    
    /// Navigates to the next required screen depending on the user's current state
    var navigateToNextScreenAction: (() -> Void) {
        return { [weak self] in
            guard let self = self,
                  canSubmit
            else { return }
            
            let userManager = dependencies.userManager
            
            guard let userRequirements = userManager.userRequirements
            else { return }
            
            if userRequirements.areAllUserRequirementsFulfilled {
                self.coordinator.rootCoordinatorDelegate.switchToMainScene()
            }
            else {
                let nextRoute = self.coordinator
                    .router
                    .getNextRouteFrom(route: .login)
                
                self.coordinator.pushView(with: nextRoute)
            }
        }
    }
    
    // MARK: - Models
    var userIdentifierInputTextFieldModel: UserInputTextFieldViewModel!
    var passwordInputTextFieldModel: UserInputTextFieldViewModel!
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
        
        initModels()
        addSubscribers()
    }
    
    func addSubscribers() {
        /// Update the UI whenever a textfield is focused in order to trigger necessary UI elements to appear
        userIdentifierInputTextFieldModel
            .$focused
            .receive(on: scheduler)
            .combineLatest(passwordInputTextFieldModel.$focused)
            .sink { [weak self] (t1, t2) in
                guard let self = self
                else { return }
                
                self.textFieldCurrentlyFocused = t1 || t2
                
                if textFieldCurrentlyFocused {
                    switch self.textFieldCurrentlyFocused {
                    case t1:
                        currentlySelectedTextField = userIdentifierInputTextFieldModel
                    case t2:
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
        passwordInputTextFieldModel = .init()
        passwordInputTextFieldModel
            .configurator { [weak self] model in
                guard let self = self
                else { return }
                
                // Main properties
                model.placeholderText = self.passwordFieldPlaceholder
                model.textContentType = .password
                model.submitLabel = .done
                model.protected = true
                
                // In-field button
                model.inFieldButtonIcon = Icons.getIconImage(named: .eye_slash)
                model.inFieldButtonAction = {
                    model.protected.toggle()
                    
                    model.inFieldButtonIcon = model.protected ? Icons.getIconImage(named: .eye_slash) : Icons.getIconImage(named: .eye)
                }
            }
        
        userIdentifierInputTextFieldModel = .init()
        userIdentifierInputTextFieldModel
            .configurator { [weak self] model in
                guard let self = self
                else { return }
                
                // Main properties
                model.textContentType = .username
                model.keyboardType = .emailAddress
                model.submitLabel = .continue
                model.placeholderText = self.userIdentifierPlaceholder
                model.realTimeEntryValidationEnabled = false
                
                /// Validate that the entered credentials actually correspond to a known user account
                /// If the credential is not available that means it belongs to an actual user
                model.validationCondition = { @MainActor [weak self] inputString in
                    guard let self = self,
                          dependencies
                        .appService
                        .isClientOnline
                    else { return false }
                    let textFieldContentType = model.determineContentType()
                    var isValid: Bool = false
                    
                    didValidateUserIdentifierInput = false
                    isValidationInProgress = true
                    
                    switch textFieldContentType {
                    case .email:
                        self.doesEmailExist = await !self.dependencies
                            .authService
                            .isEmailAvailable(email: model.textEntry)
                        
                        isValid = self.doesEmailExist
                    case .username:
                        self.doesUsernameExist = await !self.dependencies
                            .authService
                            .isUsernameAvailable(username: model.textEntry)
                        
                        isValid = self.doesUsernameExist
                    case .phoneNumber:
                        /// Split the phone number's components
                        let phoneNumberModel = PhoneNumberModel(countryCode: .US,
                                                                nsn: model.textEntry)
                        self.doesPhoneNumberExist = await !self.dependencies
                            .authService
                            .isPhoneNumberAvailable(phoneNumber: phoneNumberModel)
                        
                        isValid = self.doesPhoneNumberExist
                    case .name, .password, .unknown:
                        break
                    }
                    
                    didValidateUserIdentifierInput = true
                    isValidationInProgress = false
                    
                    return isValid
                }
                
                /// Only validate when the input changes and internet is available
                model.onSubmitAction = { [weak self] in
                    guard let self = self,
                          lastEnteredUserIdentifier != model.textEntry
                    else { return }
                    
                    // Cache the last input
                    lastEnteredUserIdentifier = model.textEntry
                    
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
                        await model.executeValidationCondition()
                        model.isValidating = false
                    }
                    
                    self.passwordInputTextFieldModel
                        .focused = true
                }
            }
    }
    
    /// For keeping track of transportable field data in dictionary form when a user is ready to submit their info
    enum LoginFields: String, CaseIterable {
        case userIdentifier
        case password
    }
}

// MARK: - Business Logic
extension LoginScreenViewModel {
    /**
     Returns the user's input from the text fields in an organized dictionary
     The contents of the dictionary are pre-validated, if the value is an empty string then that means the textfield's content is invalid or empty
     */
    func getTextFieldContents() -> [LoginFields : String] {
        return [
            .userIdentifier : userIdentifierInputTextFieldModel.validEntry ?
            userIdentifierInputTextFieldModel.textEntry : .empty,
            .password : passwordInputTextFieldModel.textEntry
        ]
    }
    
    // MARK: - Actions
    // First Party Auth Provider action
    var loginButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.logIn()
        }
    }
    
    // OAuth Provider Actions
    var logInWithAppleAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.logIn(with: .apple)
        }
    }
    
    var logInWithTwitterAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.logIn(with: .twitter)
        }
    }
    
    var logInWithGoogleAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.logIn(with: .google)
        }
    }
    
    var logInWithFacebookAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.logIn(with: .facebook)
        }
    }
    
    /// Routes to the specified third party strategy's authentication handler
    private func logIn(with strategy: AuthenticationService.ThirdPartyAuthStrategies) {
        Task { @MainActor in
            // Start network activity indicator
            self.displayActivityIndicator = true
            self.didAttemptDefaultAuthentication = false
            
            await dependencies
                .authService
                .authenticate(using: strategy)
            
            self.displayActivityIndicator = false
            self.didAttempOAuthentication = true
            
            transitionFollowingLogin()
        }
    }
    
    /// Routes to the determined first party strategy's authentication handler, i.e email, phone, etc depending on what the user's entry type is for the first text field
    private func logIn() {
        Task { @MainActor in
            guard canSubmit
            else { return }
            let userIdentifierInputTextFieldContentType: TextFieldExtendedFunctionality
                .TextFieldEntryContentType = userIdentifierInputTextFieldModel.determineContentType()
            
            let textFieldContents = getTextFieldContents()
            
            let userIdentifier = textFieldContents[.userIdentifier],
                password = textFieldContents[.password]
            
            // Only continue if the required inputs are provided
            guard userIdentifierInputTextFieldContentType == .phoneNumber ||
                    userIdentifierInputTextFieldContentType == .email ||
                    userIdentifierInputTextFieldContentType == .username,
                  let userIdentifier = userIdentifier,
                  let password = password
            else { return }
            
            // Start network activity indicator
            self.displayActivityIndicator = true
            self.didAttempOAuthentication = false
            
            await dependencies
                .authService
                .selectStrategyFromTextualContextType(userIdentifierInputTextFieldContentType,
                                                      accountIdentifier: userIdentifier,
                                                      password: password)
            
            self.displayActivityIndicator = false
            self.didAttemptDefaultAuthentication = true
            
            transitionFollowingLogin()
        }
    }
    
    /// Transition to the next scene if the login was successful, display an error if it wasn't
    private func transitionFollowingLogin() {
        if dependencies.authService.isAuthenticated {
            if dependencies.userManager.currentUser != nil {
                navigateToNextScreenAction()
            }
            else {
                /// Present error informing the user that they must try again
                dependencies
                    .alertManager
                    .triggerErrorAlert(alertType: .LOGIN_ERROR_NO_USER_DATA_FETCHED) {
                        /// If the user tried to login via user identifier + password then retry automatically
                        if self.didAttemptDefaultAuthentication {
                            self.logIn()
                        }
                    }
            }
        }
    }
}
