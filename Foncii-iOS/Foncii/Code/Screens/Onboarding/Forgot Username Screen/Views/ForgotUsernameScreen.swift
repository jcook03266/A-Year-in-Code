//
//  ForgotUsernameScreen.swift
//  Foncii
//
//  Created by Justin Cook on 2/20/23.
//

import SwiftUI

struct ForgotUsernameScreen: View {
    // MARK: - Observed
    @StateObject var model: ForgotUsernameScreenViewModel
    /// Listen for upstream source changes to the app's internet connection
    @EnvironmentObject var appService: AppService
    
    // MARK: - Dimensions
    private let appLogoTextImageSize: CGSize = .init(width: 110,
                                                     height: 34),
                sendButtonSize: CGSize = .init(width: 208,
                                               height: 48),
                warningsTextViewWidth: CGFloat = 335
    
    // MARK: - Padding + Spacing
    private let backButtonLeadingPadding: CGFloat = 34,
                titleBottomPadding: CGFloat = 34,
                userInputSectionTopPadding: CGFloat = 32,
                userInputSectionItemSpacing: CGFloat = 12,
                sendButtonTopPadding: CGFloat = 32,
                topPadding: CGFloat = 10,
                instructionsTextTopPadding: CGFloat = 40,
                instructionsTextViewHorizontalPadding: CGFloat = 20,
                warningsTextViewTopPadding: CGFloat = 22
    
    var body: some View {
        mainSection
            .animation(.easeInOut,
                       value: model.canSubmit)
            .animation(.spring(),
                       value: model.shouldDisplayErrorMessage)
    }
}

// MARK:  - Sections
extension ForgotUsernameScreen {
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
                
                backButton
            }
        }
        .background(model.backgroundColor)
        .ignoresSafeArea(.keyboard)
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
            emailInputTextField
            warningsTextView
            sendButton
                .padding(.top,
                         sendButtonTopPadding)
        }
        .padding(.top,
                 userInputSectionTopPadding)
    }
    
    var topSection: some View {
        VStack(spacing: 0) {
            titleSection
            
            appLogoTextImage
            
            instructionsTextView
        }
        .padding(.top, topPadding)
    }
    
}

// MARK: - Subviews
extension ForgotUsernameScreen {
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
        Text(model.instructionsText)
            .withFont(model.textFont)
            .lineLimit(2)
            .multilineTextAlignment(.center)
            .foregroundColor(model.textColor)
            .padding(.top,
                     instructionsTextTopPadding)
            .padding(.horizontal,
                     instructionsTextViewHorizontalPadding)
    }
    
    var warningsTextView: some View {
        Group {
            if model.shouldDisplayErrorMessage {
                HStack {
                    Text(model.unrecognizedEmailWarning)
                        .withFont(model.instructionsFont)
                        .multilineTextAlignment(.leading)
                        .foregroundColor(model.invalidInputTextColor)
                        .padding(.top,
                                 warningsTextViewTopPadding)
                        .fixedSize(horizontal: false,
                                   vertical: true)
                    Spacer()
                }
                .frame(width: warningsTextViewWidth)
            }
        }
        .id(model.unrecognizedEmailWarning)
        .transition(.push(from: .trailing))
    }
    
    var sendButton: some View {
        RoundedCTAButton(title: model.sendButtonTitle,
                         action: model.sendRequestAction,
                         disabled: !model.canSubmit,
                         displayActivityIndicator: model.displayActivityIndicator,
                         size: sendButtonSize)
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
    
    // User Input Fields
    var emailInputTextField: some View {
        UserInputTextFieldView(model: model.emailInputTextFieldModel)
    }
}

struct ForgotUsernameScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .rootCoordinatorSelector
            .onboardingCoordinator
            .router
            .view(for: .forgotUsername)
    }
    
    static var previews: some View {
        getView()
    }
}
