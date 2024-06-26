//
// SegmentedTextFieldView.swift
// Foncii
//
// Created by Justin Cook on 4/7/23 at 5:07 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//
    
import SwiftUI

struct SegmentedTextFieldView: View {
    // MARK: - Observed
    @StateObject var model: SegmentedTextFieldViewModel
    
    // MARK: - States
    @FocusState private var textFieldFocused: Bool
    
    // MARK: - Properties
    private let animationDuration: CGFloat = 0.3
    
    // MARK: - Dimensions
    var size: CGSize = .init(width: 44,
                             height: 71),
        cornerRadius: CGFloat = 8,
        borderWidth: CGFloat = 1
    
    /// Computed text field size dependent on the overall size of this view
    var textFieldSize: CGSize {
        let widthRatio: CGFloat = 17/44,
        heightRatio: CGFloat = 36/71
        
        let width = size.width * widthRatio,
            height = size.height * heightRatio
        
        return .init(width: width,
                     height: height)
    }
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.focused)
    }
}

// MARK: - Functions
extension SegmentedTextFieldView {
    private func triggerFocusAction() {
        guard model.enabled else { return }
        
        withAnimation(.easeInOut(duration: animationDuration)) {
            HapticFeedbackDispatcher.textFieldPressed()
            
            textFieldFocused = true
        }
    }
}

// MARK: - Sections
extension SegmentedTextFieldView {
    var mainSection: some View {
        contentSection
    }
    
    var contentSection: some View {
        ZStack(alignment: .center) {
            textFieldBackgroundSection
            textField
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
            model.focused = newValue
        }
        .onChange(of: model.focused) { newValue in
            textFieldFocused = newValue
        }
        .animation(.easeInOut(duration: animationDuration),
                   value: model.focused)
        .animation(.easeInOut(duration: animationDuration),
                   value: model.validEntry)
    }
    
    var textFieldBackgroundSection: some View {
        ZStack {
            textFieldBackground
            textFieldBorder
        }
        .frame(width: size.width,
               height: size.height)
        .fixedSize()
    }
}

// MARK: - Subviews
extension SegmentedTextFieldView {
    var textFieldBackground: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(model.fieldBackgroundColor)
            .frame(width: size.width,
                   height: size.height)
            .fixedSize()
    }
    
    var textFieldBorder: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .strokeBorder(model.borderColor,
                          lineWidth: borderWidth,
                          antialiased: true)
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
                
                // Placeholder isn't visible with its default text color so this is used instead
                if model.shouldDisplayPlaceholder {
                    HStack {
                        Text(model.textFieldPlaceholderText)
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
        .frame(width: textFieldSize.width,
               height: textFieldSize.height)
    }
}

struct SegmentedTextFieldView_Previews: PreviewProvider {
    static func getOTPTextFieldModel() -> SegmentedTextFieldViewModel {
        let otpTextFieldModel: SegmentedTextFieldViewModel = .init()
        
        otpTextFieldModel.configurator { model in
            // Main properties
            model.title = ""
            model.placeholderText = ""
            model.protected = false
        }
        
        return otpTextFieldModel
    }
    
    /// Note: Put the text field view inside of a parent view like a VStack in order to use the focus state, it's a weird bug that prevents the focus state from toggling when the view isn't hosted inside of another view
    static var previews: some View {
        HStack(spacing: 14) {
            SegmentedTextFieldView(model: getOTPTextFieldModel())
            
            SegmentedTextFieldView(model: getOTPTextFieldModel())
            
            SegmentedTextFieldView(model: getOTPTextFieldModel())
            
            SegmentedTextFieldView(model: getOTPTextFieldModel())
            
            SegmentedTextFieldView(model: getOTPTextFieldModel())
            
            SegmentedTextFieldView(model: getOTPTextFieldModel())
        }
    }
}
