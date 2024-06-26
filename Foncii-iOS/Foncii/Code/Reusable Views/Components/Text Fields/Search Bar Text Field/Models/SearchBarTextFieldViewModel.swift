//
// SearchBarTextFieldViewModel.swift
// Foncii
//
// Created by Justin Cook on 5/1/23 at 9:42 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

class SearchBarTextFieldViewModel: SearchBarTextFieldModelProtocol {
    // MARK: - Properties
    var keyboardType: UIKeyboardType = .default,
        textContentType: UITextContentType? = .nickname,
        textInputAutocapitalization: TextInputAutocapitalization = .never,
        submitLabel: SubmitLabel = .done,
        autoCorrectionDisabled: Bool = true,
        extendedFunctionality: TextFieldExtendedFunctionality = .init(),
        
        // Labels and initial text to be displayed
        title: String,
        placeholderText: String,
        
        // MARK: - Actions
        onSubmitAction: (() -> Void)? = nil
    
    // MARK: - Binding (Non-property wrapper)
    var boundTextEntry: Binding<String> {
        .init {
            return self.textEntry
        } set: { newVal in
            self.textEntry = newVal.removeLeadingSpaces()
        }
    }
    
    // MARK: - Published
    @Published var textEntry: String
    @Published var enabled: Bool = true
    @Published var focused: Bool = false
    @Published var clearButtonEnabled: Bool = true
    
    // MARK: - Styling
    var fieldBackgroundColor: Color = Colors.dark_grey_1,
textFieldTextColor: Color = Colors.neutral_1,
defaultBorderColor: Color = Colors.medium_dark_grey_1,
focusedBorderColor: Color = Colors.primary_1,
textFont: FontStyleRepository = .body
    
    // MARK: - Optional in-field icon
    var inFieldIcon: Image? = nil
    var inFieldIconTint: Color? = Colors.neutral_1
    
    // MARK: - Clear textfield button properties
    var clearTextFieldButtonIcon: Image = Icons.getIconImage(named: .xmark),
        clearTextFieldButtonIconTintColor: Color = Colors.permanent_white,
        clearTextFieldButtonBackgroundColor: Color = Colors.black_1
    
    init(title: String = "",
         placeholderText: String = "",
         textEntry: String = "")
    {
        self.title = title
        self.placeholderText = placeholderText
        self.textEntry = textEntry
    }
    
    func configurator(configuration: @escaping ((SearchBarTextFieldViewModel)-> Void)) {
        configuration(self)
    }
}
