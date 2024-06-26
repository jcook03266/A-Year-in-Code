//
//  UserInputTextFieldView.swift
//  Foncii
//
//  Created by Justin Cook on 2/18/23.
//

import SwiftUI
import ActivityIndicatorView

/// A simple custom textfield with async entry validation, in-field custom button based logic, a clear text button, and other customizable attributes
struct UserInputTextFieldView: View {
    // MARK: - Observed
    @StateObject var model: UserInputTextFieldViewModel
    
    // MARK: - States
    @FocusState private var textFieldFocused: Bool
    
    // MARK: - Properties
    private let animationDuration: CGFloat = 0.3
    
    // MARK: - Dimensions
    var size: CGSize = .init(width: 335,
                             height: 54),
        cornerRadius: CGFloat = 36,
        validationIndicatorSize: CGSize = .init(width: 12,
                                                height: 12),
        clearTextFieldButtonSize: CGSize = .init(width: 20,
                                                 height: 20),
        inFieldButtonSize: CGSize = .init(width: 20,
                                          height: 20)
    
    // MARK: - Padding + Spacing
    private let horizontalPadding: CGFloat = 20,
                verticalPadding: CGFloat = 16,
                inFieldButtonHorizontalPadding: CGFloat = 20
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.focused)
    }
}

// MARK: - Functions
extension UserInputTextFieldView {
    private func triggerFocusAction() {
        guard model.enabled || !model.focused else { return }
        
        withAnimation(.easeInOut(duration: animationDuration)) {
            HapticFeedbackDispatcher.textFieldPressed()
            textFieldFocused = true
        }
    }
}

// MARK: - Sections
extension UserInputTextFieldView {
    var mainSection: some View {
        contentSection
    }
    
    var contentSection: some View {
        ZStack {
            textFieldBackground
            
            HStack(spacing: 0) {
                Group {
                    textField
                        .padding(.leading, horizontalPadding)
                        .padding(.trailing, horizontalPadding/2)
                    
                    validationStatusIndicator
                        .padding(.trailing, horizontalPadding)
                }
                .padding(.vertical, verticalPadding)
                
                // The optional in-field button is displayed only when the user isn't focused on the textfield
                Group {
                    if model.focused {
                        clearTextFieldButton
                    }
                    else {
                        inFieldButton
                    }
                }
                .padding(.trailing, horizontalPadding)
            }
        }
        .frame(width: size.width,
               height: size.height)
        .onTapGesture {
            triggerFocusAction()
        }
        .onLongPressGesture(perform: {
            triggerFocusAction()
        })
        .onChange(of: textFieldFocused) { newValue in
            /// Trigger the model's on submit action when the textfield is no longer focused
            if !textFieldFocused {
                model.onSubmitAction?()
            }
            
            model.focused = newValue
        }
        .onChange(of: model.focused) { newValue in
            textFieldFocused = newValue
        }
        .animation(.easeInOut(duration: animationDuration),
                   value: model.focused)
    }
}

// MARK: - Subviews
extension UserInputTextFieldView {
    var inFieldButton: some View {
        Group {
            if let icon = model.inFieldButtonIcon,
               let action = model.inFieldButtonAction {
                
                CircularUtilityButton(action: {
                    action()
                },
                                      icon: icon,
                                      backgroundColor: .clear,
                                      foregroundColor: model.inFieldButtonIconTint ?? Colors.neutral_1,
                                      explicitImageSize: inFieldButtonSize,
                                      size: inFieldButtonSize,
                                      isEnabled: .constant(true),
                                      animate:  .constant(false))
                .zIndex(1)
                .transition(.scale
                    .animation(.spring()))
            }
        }
    }
    
    var clearTextFieldButton: some View {
        Group {
            if model.clearButtonEnabled
                && model.focused {
                CircularUtilityButton(action: model.clearTextFieldButtonAction,
                                      icon: model.clearTextFieldButtonIcon,
                                      backgroundColor: model.clearTextFieldButtonBackgroundColor,
                                      foregroundColor: model.clearTextFieldButtonIconTintColor,
                                      size: clearTextFieldButtonSize,
                                      isEnabled: .constant(model.focused),
                                      animate: .constant(false))
                .zIndex(1)
                .transition(.scale
                    .animation(.spring()))
            }
        }
    }
    
    var validationStatusIndicator: some View {
        Group {
            if model.isValidating {
                ActivityIndicatorView(isVisible: .constant(true),
                                      type: .flickeringDots())
                    .foregroundColor(model.activityIndicatorTintColor)
                
            }
            else if model.shouldDisplayValidationIndicator {
                model.validationIndicatorImage
                    .filledResizableTemplateImageModifier()
                    .foregroundColor(model.validationIndicatorColor)
            }
        }
        .frame(width: validationIndicatorSize.width,
               height: validationIndicatorSize.height)
        .zIndex(1)
        .transition(.scale
            .animation(.spring()))
    }
    
    var textFieldBackground: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(model.fieldBackgroundColor)
            .frame(width: size.width,
                   height: size.height)
            .fixedSize()
    }
    
    var textField: some View {
        Group {
            ZStack {
                if model.protected {
                    SecureField(String.empty,
                                text: model.boundTextEntry)
                }
                else {
                    TextField(String.empty,
                              text: model.boundTextEntry)
                }
                
                /// Placeholder isn't visible with its default text color so this is used instead
                if model.shouldDisplayPlaceholder {
                    HStack {
                        Text(model.textFieldPlaceholderText)
                        Spacer()
                    }
                }
            }
        }
        .withFont(model.textFont)
        .foregroundColor(model.textFieldTextColor)
        .textInputAutocapitalization(model.textInputAutocapitalization)
        .textContentType(model.textContentType)
        .keyboardType(model.keyboardType)
        .autocorrectionDisabled(model.autoCorrectionDisabled)
        .focused($textFieldFocused)
        .submitLabel(model.submitLabel)
        .onSubmit { model.onSubmitAction?() }
    }
}

struct UserInputTextFieldView_Previews: PreviewProvider {
    static func getUsernameTextFieldModel() -> UserInputTextFieldViewModel {
        let usernameTextFieldModel: UserInputTextFieldViewModel = .init()
        
        usernameTextFieldModel.configurator { model in
            // Main properties
            model.title = "Username"
            model.placeholderText = ""
            model.validationCondition = { text in
                return text == "hello"
            }
        }
        
        return usernameTextFieldModel
    }
    
    static func getPasswordTextFieldModel() -> UserInputTextFieldViewModel {
        let passwordTextFieldModel: UserInputTextFieldViewModel = .init()
        
        passwordTextFieldModel.configurator { model in
            // Main properties
            model.title = "Password"
            model.placeholderText = ""
            model.validationCondition = { text in
                return text == "hello"
            }
            
            // In-field button
            model.inFieldButtonIcon = Icons.getIconImage(named: .eye_slash)
            model.protected = true
            model.inFieldButtonAction = {
                model.protected.toggle()
                
                model.inFieldButtonIcon = model.protected ? Icons.getIconImage(named: .eye_slash) : Icons.getIconImage(named: .eye)
            }
        }
        
        return passwordTextFieldModel
    }
    
    static var previews: some View {
        VStack(spacing: 20) {
            UserInputTextFieldView(model: getUsernameTextFieldModel())
            UserInputTextFieldView(model: getPasswordTextFieldModel())
        }
    }
}
