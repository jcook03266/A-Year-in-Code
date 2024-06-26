//
// OTPScreenViewModel.swift
// Foncii
//
// Created by Justin Cook on 4/7/23 at 3:51 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//


import SwiftUI
import Combine

class OTPScreenViewModel: CoordinatedGenericViewModel {
    typealias coordinator = OnboardingCoordinator
    
    // MARK: - Properties
    var coordinator: coordinator
    
    // MARK: - Published
    // User Input
    @Published var passcode: String = ""
    
    // Validation
    @Published var passcodeIsValid: Bool = false
    @Published var wasPasscodeValidated: Bool = false
    @Published var numberOfResendPasscodeRequests: Int = 0
    @Published var numberOfPasscodeValidationAttempts: Int = 0
    
    // UI State Management
    @Published var isOTPAvailable: Bool = false
    @Published var isValidating: Bool = false
    @Published var displayActivityIndicator: Bool = false
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let authenticationService: AuthenticationService = inject(),
            userManager: UserManager = inject(),
            alertManager: AlertManager = inject(),
            appService: AppService = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Assets
    let appLogoTextImage: Image = Images.getImage(named: .foncii_logo_text_accent_transparent)
    
    // MARK: - Styling
    // Colors
    let backgroundColor: Color = Colors.black_1,
        titleColor: Color = Colors.permanent_white,
        textColor: Color = Colors.neutral_1,
        inlineTextButtonColor: Color = Colors.primary_1
    
    // Fonts
    let titleFont: FontStyleRepository = .subtitle,
        titleFontWeight: UIFont.Weight = .semibold,
        subheadingFont: FontStyleRepository = .heading_3,
        topPromptSubtitleFont: FontStyleRepository = .subtitle,
        bottomPromptFont: FontStyleRepository = .caption
    
    // MARK: - Localized Text
    let nextButtonTitle: String = LocalizedStrings
        .getLocalizedString(for: .NEXT),
titleText: String = LocalizedStrings
        .getLocalizedString(for: .ONE_TIME_PASSCODE),
subheadingText: String = LocalizedStrings
        .getLocalizedString(for: .OTP_SCREEN_SUBHEADING),
topPromptText: String = LocalizedStrings
        .getLocalizedString(for: .OTP_SCREEN_TOP_PROMPT),
    bottomPromptTextFragment_1 = LocalizedStrings
        .getLocalizedString(for: .OTP_SCREEN_RESEND_PROMPT_FRAGMENT_1),
    bottomPromptSubtitleInlineButtonText = LocalizedStrings
        .getLocalizedString(for: .OTP_SCREEN_RESEND_PROMPT_FRAGMENT_2)
    
    // MARK: - Actions
    /// Moves on to the next screen
    var nextButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self,
                  canContinue
            else { return }
            
            let userManager = dependencies.userManager
            
            guard let userRequirements = userManager.userRequirements
            else { return }
            
            /// If all requirements are fulfilled then navigate to the main scene, else fulfill the other requirements
            if userRequirements.areAllUserRequirementsFulfilled {
                self.coordinator.rootCoordinatorDelegate.switchToMainScene()
            }
            else {
                let nextRoute = self.coordinator
                    .router
                    .getNextRouteFrom(route: .otp)
                
                self.coordinator.navigateTo(targetRoute: nextRoute)
            }
        }
    }
    
    /// Requests another passcode for the user to receive and enter to authenticate
    var resendPasscodeAction: (() -> Void) {
        return { [weak self] in
            guard let self = self,
                  self.canRequestResend
            else {
                /// Inform the user that they cannot request more resends at this time and to try again later
                self?.dependencies
                    .alertManager
                    .triggerErrorAlert(alertType: .OTP_ERROR_RESEND_REQUEST_UNAVAILABLE)
                
                return
            }
            
            requestOTP()
        }
    }
    
    // MARK: - Convenience
    var isUserInputEnabled: Bool {
        return authService.canSendPasscodeValidationRequest && isOTPAvailable
    }
    
    /// Continue when internet is available and the passcode is valid
    var canContinue: Bool {
        return passcodeIsValid && dependencies.appService.isClientOnline
    }
    
    /// A user can request another passcode be sent if they're under the resend limit and if they have internet available, the resend button is disable if this condition is not met
    var canRequestResend: Bool {
        return dependencies.authenticationService.canRequestNewOTP && dependencies.appService.isClientOnline
    }
    
    var authService: AuthenticationService {
        return dependencies.authenticationService
    }
    
    // MARK: - Models
    let passcodeTextFieldViewModel: PasscodeTextFieldViewModel = .init()
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
        addSubscriptions()
    }
    
    // MARK: - Subscriptions
    func addSubscriptions() {
        /// When the passcode is complete, internet is available, and the user is done typing, try to verify it the passcode the auth backend
        passcodeTextFieldViewModel
            .$isPasscodeComplete
            .combineLatest(passcodeTextFieldViewModel.$currentlyFocusedTextField)
            .receive(on: scheduler)
            .sink { [weak self] passcodeComplete, focusedTextField in
                guard let self = self,
                      !isValidating
                else { return }
                
                let internetAvailable = dependencies
                    .appService
                    .isClientOnline
                
                // Verify the passcode
                if passcodeComplete && internetAvailable {
                    hideKeyboard()
                    validateOTP()
                }
                else if passcodeComplete && !internetAvailable {
                    /// Notify the user that their internet is unavailable and that they must reconnect in order to verify the passcode
                    /// No retry necessary, auto-retry is possible through this publisher
                    dependencies
                        .alertManager
                        .triggerErrorAlert(alertType: .NETWORK_ERROR_INTERNET_UNAVAILABLE_OK)
                }
            }
            .store(in: &cancellables)
        
        /// Subscribe to the text field's passcode publisher to pass the passcode along within this scope easily
        passcodeTextFieldViewModel
            .$enteredPasscode
            .receive(on: scheduler)
            .assign(to: &$passcode)
        
        /// Listen for the stored otp verification ID, if the ID isn't present this means the user can't type
        authService
            .$otpVerificationID
            .receive(on: scheduler)
            .sink { [weak self] otpVerificationID in
                guard let self = self
                else { return }
                
                self.isOTPAvailable = otpVerificationID != nil
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Verification Logic
    /// Validates the passcode the user entered asynchronously if an OTP verification ID has been successfully provided by the backend and the
    /// user hasn't maxed out their auth attempts
    private func validateOTP() {
        guard isUserInputEnabled,
              !isValidating
        else { return }
        
        Task { @MainActor in
            displayActivityIndicator = true
            isValidating = true
            
            self.passcodeIsValid = await authService
                .validateOTP(passcode: passcode)
            
            isValidating = false
            displayActivityIndicator = false
            
            /// Clear the passcode if the entered passcode is invalid
            if !self.passcodeIsValid {
                passcodeTextFieldViewModel.releaseFocus()
                passcodeTextFieldViewModel.clearAllTextFields()
                
                /// Inform the user that the passcode they entered was incorrect
                dependencies
                    .alertManager
                    .triggerErrorAlert(alertType: .OTP_ERROR_VALIDATION_FAILED)
            }
        }
    }
    
    /// For initial requests and follow-up requests if the first request fails, request an OTP from the firebase auth backend
    func requestOTP() {
        Task { @MainActor in
            guard let userPhoneNumber = dependencies.userManager.currentUser?.phoneNumber
            else {
                /// Requesting a code is not available at this time because the user's data is not available
                self.dependencies
                    .alertManager
                    .triggerErrorAlert(alertType: .OTP_ERROR_REQUEST_UNAVAILABLE)

                return
            }

            let otpFormattedPhoneString = PhoneNumberModel
                .formattedPhoneNumberToOTPString(phoneNumberString: userPhoneNumber)

            await authService
                .triggerOTPRequest(phoneNumber: otpFormattedPhoneString)
        }
    }
    
}
