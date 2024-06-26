//
//  SignUpScreen.swift
//  Foncii
//
//  Created by Justin Cook on 2/25/23.
//

import SwiftUI

struct SignUpScreen: View {
    // MARK: - Observed
    @StateObject var model: SignUpScreenViewModel
    /// Listen for upstream source changes to the app's internet connection
    @EnvironmentObject var appService: AppService
    
    // MARK: - Dimensions
    private let appLogoTextImageSize: CGSize = .init(width: 110,
                                                     height: 34),
                submitButtonSize: CGSize = .init(width: 208,
                                                 height: 48),
                thirdPartyAuthProviderButtonSize: CGSize = .init(width: 30,
                                                                 height: 30),
                instructionsTextViewWidth: CGFloat = 335
    
    // MARK: - Padding + Spacing
    private let backButtonLeadingPadding: CGFloat = 34,
                titleBottomPadding: CGFloat = 34,
                topPromptTopPadding: CGFloat = 40,
                topPromptHorizontalPadding: CGFloat = 20,
                userInputSectionTopPadding: CGFloat = 32,
                userInputSectionItemSpacing: CGFloat = 12,
                topPadding: CGFloat = 10,
                inlineButtonSpacing: CGFloat = 6,
                submitButtonTopPadding: CGFloat = 42,
                bottomSectionTopPadding: CGFloat = 24,
                thirdPartyAuthProviderSectionItemSpacing: CGFloat = 24,
                thirdPartyAuthProviderSectionTopPadding: CGFloat = 24,
                bottomSectionBottomPadding: CGFloat = 48.5,
                instructionsTextViewTopPadding: CGFloat = 22
    
    var body: some View {
        mainSection
            .animation(.easeInOut,
                       value: model.currentInstructions)
            .animation(.spring(),
                       value: model.shouldDisplayInstructions)
            .animation(.spring(),
                       value: model.isInternetAvailable)
            .toggleKeyboardDoneButton()
    }
}

// MARK: - Sections
extension SignUpScreen {
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
    }
    
    var userInputSection: some View {
        VStack(spacing: 0) {
            VStack(spacing: userInputSectionItemSpacing) {
                fullNameInputTextField
                emailInputTextField
                phoneNumberInputTextField
                usernameInputTextField
                passwordInputTextField
            }
            
            instructionsTextView
            
            submitButton
                .padding(.top,
                         submitButtonTopPadding)
        }
        .padding(.top,
                 userInputSectionTopPadding)
    }
    
    var bottomSection: some View {
        VStack(spacing: 0) {
            orBranchingPrompt
            
            thirdPartyAuthProviderSection
            
            Spacer()
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
                    model.signUpWithAppleAction()
                    HapticFeedbackDispatcher.genericButtonPress()
                } label: {
                    model.appleLogo
                }
                
                // Sign-in with Twitter
                Button {
                    model.signUpWithTwitterAction()
                    HapticFeedbackDispatcher.genericButtonPress()
                } label: {
                    model.twitterLogo
                }
                
                // Sign-in with Google
                Button {
                    model.signUpWithGoogleAction()
                    HapticFeedbackDispatcher.genericButtonPress()
                } label: {
                    model.googleLogo
                }
                
                // Sign-in with Facebook
                Button {
                    model.signUpWithFacebookAction()
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
extension SignUpScreen {
    var orBranchingPrompt: some View {
        Text(model.orBranchPrompt)
            .withFont(model.orBranchPromptFont)
            .foregroundColor(model.textColor)
            .lineLimit(1)
    }
    
    var submitButton: some View {
        RoundedCTAButton(title: model.submitButtonTitle,
                         action: model.submitButtonAction,
                         disabled: !model.canSubmit,
                         displayActivityIndicator: model.displayActivityIndicator,
                         size: submitButtonSize)
    }
    
    // User Input Fields
    var fullNameInputTextField: some View {
        UserInputTextFieldView(model: model.fullNameInputTextFieldModel)
    }
    
    var emailInputTextField: some View {
        UserInputTextFieldView(model: model.emailInputTextFieldModel)
    }
    
    var phoneNumberInputTextField: some View {
        UserInputTextFieldView(model: model.phoneNumberInputTextFieldModel)
    }
    
    var usernameInputTextField: some View {
        UserInputTextFieldView(model: model.usernameInputTextFieldModel)
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
            model.navigateToLoginScreenAction()
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
    
    var instructionsTextView: some View {
        Group {
            if model.shouldDisplayInstructions {
                HStack {
                    Text(model.currentInstructions)
                        .withFont(model.instructionsFont)
                        .multilineTextAlignment(.leading)
                        .foregroundColor(model.bottomInstructionsTextColor)
                        .padding(.top,
                                 instructionsTextViewTopPadding)
                        .fixedSize(horizontal: false,
                                   vertical: true)
                    
                    Spacer()
                }
                    .frame(width: instructionsTextViewWidth)
            }
        }
        .id(model.currentInstructions)
        .transition(.push(from: .trailing))
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

struct SignUpScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .rootCoordinatorSelector
            .onboardingCoordinator
            .router
            .view(for: .signUp(referralID: nil))
    }
    
    static var previews: some View {
        getView()
    }
}
