//
// SearchBarTextFieldView.swift
// Foncii
//
// Created by Justin Cook on 5/1/23 at 9:42 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct SearchBarTextFieldView: View {
    // MARK: - Observed
    @StateObject var model: SearchBarTextFieldViewModel
    
    // MARK: - States
    @FocusState private var textFieldFocused: Bool
    
    // MARK: - Properties
    private let animationDuration: CGFloat = 0.3
    
    // MARK: - Dimensions
    var height: CGFloat = 48,
        cornerRadius: CGFloat = 36,
        clearTextFieldButtonSize: CGSize = .init(width: 20,
                                                 height: 20),
        inFieldButtonSize: CGSize = .init(width: 14,
                                          height: 14),
        borderWidth: CGFloat = 1
    
    // MARK: - Padding + Spacing
    private let horizontalPadding: CGFloat = 20,
                verticalPadding: CGFloat = 14,
                textFieldLeadingPadding: CGFloat = 20,
                inFieldButtonTrailingPadding: CGFloat = 12
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.focused)
            .animation(.easeIn,
                       value: model.placeholderText)
    }
}

// MARK: - Functions
extension SearchBarTextFieldView {
    private func triggerFocusAction() {
        guard model.enabled || !model.focused else { return }
        
        withAnimation(.easeInOut(duration: animationDuration)) {
            HapticFeedbackDispatcher.textFieldPressed()
            textFieldFocused = true
        }
    }
}

// MARK: - Sections
extension SearchBarTextFieldView {
    var mainSection: some View {
        contentSection
    }
    
    var contentSection: some View {
        ZStack {
            textFieldBackgroundSection
            
            HStack(spacing: 0) {
                inFieldIcon
                
                textField
                    .padding(.trailing, horizontalPadding/2)
                    .padding(.vertical, verticalPadding)
                
                Group {
                    if model.focused {
                        clearTextFieldButton
                    }
                }
                .padding(.trailing, horizontalPadding)
            }
            .padding(.leading, textFieldLeadingPadding)
        }
        .frame(height: height)
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
    
    var textFieldBackgroundSection: some View {
        ZStack {
            textFieldBackground
            textFieldBorder
        }
        .frame(height: height)
    }
}

// MARK: - Subviews
extension SearchBarTextFieldView {
    var inFieldIcon: some View {
        Group {
            if let icon = model.inFieldIcon {
                icon
                    .fittedResizableTemplateImageModifier()
                    .foregroundColor(model.inFieldIconTint)
                    .frame(width: inFieldButtonSize.width,
                           height: inFieldButtonSize.height)
                    .padding(.trailing, inFieldButtonTrailingPadding)
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
                .transition(.scale.animation(.spring()))
            }
        }
    }

    var textFieldBackground: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(model.fieldBackgroundColor)
            .frame(height: height)
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
                TextField(String.empty,
                          text: model.boundTextEntry)
                
                /// Placeholder isn't visible with its default text color so this is used instead
                Group {
                    if model.shouldDisplayPlaceholder {
                        HStack {
                            Text(model.textFieldPlaceholderText)
                            Spacer()
                        }
                    }
                }
                .transition(.scale)
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

struct SearchBarTextFieldView_Previews: PreviewProvider {
    static func getSearchBarTextFieldModel() -> SearchBarTextFieldViewModel {
        let searchBarTextFieldViewModel: SearchBarTextFieldViewModel = .init()
        
        searchBarTextFieldViewModel.configurator { model in
            // Main properties
            model.title = "Search"
            model.placeholderText = ""
     
            // In-field Icon
            model.inFieldIcon = Icons.getIconImage(named: .search)
        }
        
        return searchBarTextFieldViewModel
    }
    
    static var previews: some View {
        GeometryReader { geom in
            VStack {
                SearchBarTextFieldView(model: getSearchBarTextFieldModel())
            }
            .frame(width: geom.size.width,
                   height: geom.size.height)
            .background(Colors.black_1)
        }
    }
}
