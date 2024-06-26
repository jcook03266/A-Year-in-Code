//
// OTPScreen.swift
// Foncii
//
// Created by Justin Cook on 4/7/23 at 3:51 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//


import SwiftUI

struct OTPScreen: View {
    // MARK: - Observed
    @StateObject var model: OTPScreenViewModel
    /// Listen and respond to internet updates
    @EnvironmentObject var appService: AppService
    
    // MARK: - Dimensions
    private let appLogoTextImageSize: CGSize = .init(width: 110,
                                                     height: 34),
                nextButtonSize: CGSize = .init(width: 208,
                                               height: 48)
    
    // MARK: - Padding + Spacing
    private let titleBottomPadding: CGFloat = 34,
                topPadding: CGFloat = 10,
                inlineButtonSpacing: CGFloat = 6,
                topPromptSectionTopPadding: CGFloat = 40,
                topPromptSectionBottomPadding: CGFloat = 32,
                promptHorizontalPadding: CGFloat = 20,
                topPromptSectionSpacing: CGFloat = 8,
                bottomPromptSectionTopPadding: CGFloat = 12
    
    var body: some View {
        mainSection
            .onAppear {
                onAppearTasks()
            }
            .toggleKeyboardDoneButton()
    }
}

// MARK: - Functions
extension OTPScreen {
    /// SImple tasks to execute when this view appears
    func onAppearTasks() {
        /// Only request OTP when running on an actual device
        if !AppService.runningOnSimulator {
            model.requestOTP()
        }
    }
}

// MARK: - Sections
extension OTPScreen {
    var mainSection: some View {
        GeometryReader { geom in
            ZStack {
                ScrollView(.vertical) {
                    VStack(spacing: 0) {
                        topSection
                        
                        userInputSection
                        
                        Spacer()
                    }
                    .frame(width: geom.size.width,
                           height: geom.size.height)
                }
            }
        }
        .background(model.backgroundColor)
    }
    
    var userInputSection: some View {
        VStack(spacing: 0) {
            passcodeTextFieldView
            
            bottomPromptSection
            
            Spacer()
            
            nextButton
        }
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
        VStack(spacing: topPromptSectionSpacing) {
            subheadingView
            
            topPromptView
        }
        .padding(.top, topPromptSectionTopPadding)
        .padding(.bottom, topPromptSectionBottomPadding)
        .padding(.horizontal, promptHorizontalPadding)
    }
    
    var bottomPromptSection: some View {
        HStack(spacing: inlineButtonSpacing) {
            bottomPromptTextFragment_1
            
            bottomPromptInlineTextButton
                .foregroundColor(model.inlineTextButtonColor)
            
        }
        .withFont(model.bottomPromptFont)
        .foregroundColor(model.textColor)
        .fixedSize(horizontal: false, vertical: true)
        .multilineTextAlignment(.center)
        .padding(.horizontal,
                 promptHorizontalPadding)
        .padding(.top,
                 bottomPromptSectionTopPadding)
    }
}

// MARK: - Subviews
extension OTPScreen {
    // Bottom Prompt
    var bottomPromptTextFragment_1: some View {
        Text(model.bottomPromptTextFragment_1)
    }
    
    /// Button triggers a resend of the passcode (limited)
    var bottomPromptInlineTextButton: some View {
        Button {
            model.resendPasscodeAction()
            
            HapticFeedbackDispatcher.genericButtonPress()
        } label: {
            Text(model.bottomPromptSubtitleInlineButtonText)
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
    
    var subheadingView: some View {
        Text(model.subheadingText)
            .withFont(model.subheadingFont)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .foregroundColor(model.titleColor)
    }
    
    var topPromptView: some View {
        Text(model.topPromptText)
            .withFont(model.topPromptSubtitleFont)
            .fixedSize(horizontal: false, vertical: true)
            .multilineTextAlignment(.leading)
            .foregroundColor(model.textColor)
    }
    
    var passcodeTextFieldView: some View {
        PasscodeTextFieldView(model: model.passcodeTextFieldViewModel)
            .disabled(!model.isUserInputEnabled)
    }
    
    var nextButton: some View {
        RoundedCTAButton(title: model.nextButtonTitle,
                         action: model.nextButtonAction,
                         disabled: !model.canContinue,
                         displayActivityIndicator: model.displayActivityIndicator,
                         size: nextButtonSize)
    }
    
}

struct OTPScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .rootCoordinatorSelector
            .onboardingCoordinator
            .router
            .view(for: .otp)
    }
    
    static var previews: some View {
        getView()
    }
}
