//
//  LoginScreen.swift
//  Foncii
//
//  Created by Justin Cook on 2/18/23.
//

import SwiftUI

struct LoginScreen: View {
    // MARK: - Observed
    @StateObject var model: LoginScreenViewModel
    /// Listen for upstream source changes to the app's internet connection
    @EnvironmentObject var appService: AppService
    
    // MARK: - Dimensions
    private let appLogoTextImageSize: CGSize = .init(width: 110,
                                                     height: 34),
                loginButtonSize: CGSize = .init(width: 208,
                                                height: 48),
                thirdPartyAuthProviderButtonSize: CGSize = .init(width: 30,
                                                                 height: 30),
                invalidUserInputWarningSize: CGSize = .init(width: 335,
                                                             height: 40)
    
    // MARK: - Padding + Spacing
    private let backButtonLeadingPadding: CGFloat = 34,
                titleBottomPadding: CGFloat = 34,
                topPromptTopPadding: CGFloat = 40,
                topPromptHorizontalPadding: CGFloat = 20,
                userInputSectionTopPadding: CGFloat = 32,
                userInputSectionItemSpacing: CGFloat = 12,
                loginButtonTopPadding: CGFloat = 32,
                bottomSectionTopPadding: CGFloat = 24,
                inlineButtonSpacing: CGFloat = 6,
                thirdPartyAuthProviderSectionItemSpacing: CGFloat = 24,
                thirdPartyAuthProviderSectionTopPadding: CGFloat = 24,
                bottomSectionBottomPadding: CGFloat = 48.5,
                topPadding: CGFloat = 10,
invalidUserInputWarningsContainerItemSpacing: CGFloat = 12
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.didValidateUserIdentifierInput)
            .animation(.spring(),
                       value: model.isInternetAvailable)
            .animation(.spring(),
                       value: model.shouldDisplayInvalidEntryPrompts)
            .toggleKeyboardDoneButton()
    }
}

// MARK: - Sections
extension LoginScreen {
    var mainSection: some View {
        GeometryReader { geom in
            ZStack {
                ScrollView(.vertical) {
                    VStack(spacing: 0) {
                        topSection
                        
                        userInputSection
                        
                        bottomSection
                        
                        Spacer()
                    }
                    .frame(width: geom.size.width,
                           height: geom.size.height)
                }
                
                backButton
            }
        }
        .background(model.backgroundColor)
        .ignoresSafeArea(.keyboard)
    }
    
    var topSection: some View {
        VStack(spacing: 0) {
            titleSection
            
            appLogoTextImage
            
            topPromptSection
        }
        .padding(.top, topPadding)
    }
    
    var titleSection: some View {
        ZStack {
            titleView
        }
        .padding(.bottom,
                 titleBottomPadding)
    }
    
    var userInputSection: some View {
        VStack(spacing: 0) {
            VStack(spacing: userInputSectionItemSpacing) {
                userIdentifierInputTextField
                passwordInputTextField
                
                invalidUserInputWarningsContainer
            }
            
            loginButton
                .padding(.top,
                         loginButtonTopPadding)
        }
        .padding(.top,
                 userInputSectionTopPadding)
    }
    
    var invalidUserInputWarningsContainer: some View {
        Group {
            if model
                .shouldDisplayInvalidEntryPrompts
            {
                VStack(spacing: invalidUserInputWarningsContainerItemSpacing) {
                    Group {
                        invalidUserIdentifierTextFieldInputView
                        invalidPasswordTextFieldInputView
                    }
                    .fixedSize(horizontal: false, vertical: true)
                    .transition(.slide)
                    .withFont(model.invalidEntryPromptFont)
                    .foregroundColor(model.invalidInputTextColor)
                    .minimumScaleFactor(1)
                    .multilineTextAlignment(.leading)
                    .frame(width: invalidUserInputWarningSize.width,
                           height: invalidUserInputWarningSize.height)
                }
            }
        }
    }
    
    var bottomSection: some View {
        VStack(spacing: 0) {
            orBranchingPrompt
            
            thirdPartyAuthProviderSection
            
            Spacer()
            
            forgotPromptSection
        }
        .padding(.top,
                 bottomSectionTopPadding)
        .padding(.bottom,
                 bottomSectionBottomPadding)
    }
    
    var thirdPartyAuthProviderSection: some View {
        HStack(spacing: thirdPartyAuthProviderSectionItemSpacing) {
            Group {
                // Sign-in with Apple
                Button {
                    model.logInWithAppleAction()
                    HapticFeedbackDispatcher.genericButtonPress()
                } label: {
                    model.appleLogo
                }
                
                // Sign-in with Twitter
                Button {
                    model.logInWithTwitterAction()
                    HapticFeedbackDispatcher.genericButtonPress()
                } label: {
                    model.twitterLogo
                }
                
                // Sign-in with Google
                Button {
                    model.logInWithGoogleAction()
                    HapticFeedbackDispatcher.genericButtonPress()
                } label: {
                    model.googleLogo
                }
                
                // Sign-in with Facebook
                Button {
                    model.logInWithFacebookAction()
                    HapticFeedbackDispatcher.genericButtonPress()
                } label: {
                    model.facebookLogo
                }
            }
            .buttonStyle(.genericSpringyShrink)
            .frame(width: thirdPartyAuthProviderButtonSize.width,
                   height: thirdPartyAuthProviderButtonSize.height)
        }
        .padding(.top,
                 thirdPartyAuthProviderSectionTopPadding)
    }
    
    var forgotPromptSection: some View {
        HStack(spacing: inlineButtonSpacing) {
            forgotPromptFragment_1
            
            forgotPromptFragment_1_Button
                .foregroundColor(model.inlineTextButtonColor)
            
            forgotPromptFragment_2
            
            forgotPromptFragment_2_Button
                .foregroundColor(model.inlineTextButtonColor)
            
            forgotPromptFragment_3
        }
        .withFont(model.forgotPromptFont)
        .foregroundColor(model.textColor)
        .lineLimit(1)
        .minimumScaleFactor(1)
        .multilineTextAlignment(.leading)
    }
    
    var topPromptSection: some View {
        HStack {
            VStack(alignment: .leading,
                   spacing: 0)
            {
                topPromptTextFragment_1
                    .lineLimit(2)
                
                HStack(spacing: inlineButtonSpacing) {
                    topPromptTextFragment_2
                    
                    topPromptInlineTextButton
                        .foregroundColor(model.inlineTextButtonColor)
                }
            }
            .withFont(model.topPromptSubtitleFont)
            .foregroundColor(model.textColor)
            .lineLimit(1)
            .minimumScaleFactor(1)
            .multilineTextAlignment(.leading)
        }
        .padding(.top,
                 topPromptTopPadding)
        .padding(.horizontal,
                 topPromptHorizontalPadding)
    }
}


// MARK: - Subviews
extension LoginScreen {
    var invalidUserIdentifierTextFieldInputView: some View {
        Group {
            if model.shouldDisplayInvalidUserIdentifierInputFieldWarning {
                HStack {
                    Text(model.invalidUserIdentifierFieldPrompt)
                    Spacer()
                }
            }
        }
    }
    
    var invalidPasswordTextFieldInputView: some View {
        Group {
            if model.shouldDisplayInvalidPasswordInputFieldWarning {
                HStack {
                    Text(model.invalidPasswordPrompt)
                 Spacer()
                }
            }
        }
    }
    
    // Forgot / Bottom Prompt
    var forgotPromptFragment_1: some View {
        Text(model.forgotPromptFragment_1)
    }
    
    var forgotPromptFragment_1_Button: some View {
        Button {
            model.forgotUsernameAction()
            HapticFeedbackDispatcher.genericButtonPress()
        } label: {
            Text(model.forgotPromptFragment_1_Button_Text)
        }
    }
    
    var forgotPromptFragment_2: some View {
        Text(model.forgotPromptFragment_2)
    }
    
    var forgotPromptFragment_2_Button: some View {
        Button {
            model.resetPasswordAction()
            HapticFeedbackDispatcher.genericButtonPress()
        } label: {
            Text(model.forgotPromptFragment_2_Button_Text)
        }
    }
    
    var forgotPromptFragment_3: some View {
        Text(model.forgotPromptFragment_3)
    }
    
    var orBranchingPrompt: some View {
        Text(model.orBranchPrompt)
            .withFont(model.orBranchPromptFont)
            .foregroundColor(model.textColor)
            .lineLimit(1)
    }
    
    var loginButton: some View {
        RoundedCTAButton(title: model.loginButtonTitle,
                         action: model.loginButtonAction,
                         disabled: !model.canSubmit,
                         displayActivityIndicator: model.displayActivityIndicator,
                         size: loginButtonSize)
    }
    
    // User Input Fields
    var userIdentifierInputTextField: some View {
        UserInputTextFieldView(model: model.userIdentifierInputTextFieldModel)
    }
    
    var passwordInputTextField: some View {
        UserInputTextFieldView(model: model.passwordInputTextFieldModel)
    }
    
    // Top Prompt
    var topPromptTextFragment_1: some View {
        Text(model.topPromptSubtitleText_Fragment_1)
    }
    
    var topPromptTextFragment_2: some View {
        Text(model.topPromptSubtitleText_Fragment_2)
    }
    
    var topPromptInlineTextButton: some View {
        Button {
            model.navigateToSignUpScreenAction()
            HapticFeedbackDispatcher.genericButtonPress()
        } label: {
            Text(model.topPromptSubtitleInlineButtonText)
        }
    }
    
    var appLogoTextImage: some View {
        model.appLogoTextImage
            .fittedResizableOriginalImageModifier()
            .frame(width: appLogoTextImageSize.width,
                   height: appLogoTextImageSize.height)
            .scaledToFit()
    }
    
    var titleView: some View {
        Text(model.titleText)
            .withFont(model.titleFont,
                      weight: model.titleFontWeight)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .foregroundColor(model.titleColor)
    }
    
    var backButton: some View {
        VStack {
            HStack {
                BackButton()
                Spacer()
            }
            Spacer()
        }
        .padding(.top, topPadding)
        .padding(.leading, backButtonLeadingPadding)
    }
}

struct LoginScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .rootCoordinatorSelector
            .onboardingCoordinator
            .router
            .view(for: .login)
    }
    
    static var previews: some View {
        getView()
    }
}
