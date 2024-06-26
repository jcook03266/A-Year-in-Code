//
// SegmentedTextFieldViewModel.swift
// Foncii
//
// Created by Justin Cook on 4/7/23 at 4:04 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

/**
 * A single character textfield artificially limited to one character to support a segmented one time passcode textfield array for entering SMS codes when signing up or logging in via phone #
 */
class SegmentedTextFieldViewModel: SegmentedTextFieldModelProtocol {
    // MARK: - Properties
    var id: UUID = .init(),  /// Need the ID to be non-computed when using this text field in a foor loop for some reason, ignores the computed ID in the protocol
        keyboardType: UIKeyboardType = .numberPad,
        textContentType: UITextContentType? = .oneTimeCode,
        textInputAutocapitalization: TextInputAutocapitalization = .never,
        submitLabel: SubmitLabel = .next,
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
            guard newVal != self.textEntry
            else { return }
            
            // Auto-fill detected and stored
            if newVal.count == AuthenticationService.shared.requiredPasscodeLength {
                // Make sure the text is a discrete number as well
                if Int(newVal) != nil {
                    self.autoFillText = newVal
                }
            }
            else { self.autoFillText = nil }
            
            // Force only a single character at all times to be entered into the textfield
            self.textEntry = newVal.isFirstCharacterANumber() ? newVal.getFirstCharacterAsString() : ""
        }
    }
    
    // MARK: - Published
    @Published var textEntry: String {
        didSet {
            shouldValidateEntry = self.hasText
        }
    }
    @Published var enabled: Bool = true
    @Published var focused: Bool = false
    @Published var protected: Bool = false
    
    // Entry validation
    @Published var validEntry: Bool = false
    @Published var shouldValidateEntry: Bool = false
    @Published var didValidate: Bool = false
    
    // Auto-fill
    /// When auto-filling an OTP from a text message if the input string is the exact length as the required passcode then it's sent here to be distributed amongst
    /// this segmented text field's siblings
    @Published var autoFillText: String? = nil
    
    // MARK: - Styling
    var fieldBackgroundColor: Color = Colors.dark_grey_1,
        textFieldTextColor: Color = Colors.primary_1,
        defaultBorderColor: Color = Colors.medium_dark_grey_1,
        focusedBorderColor: Color = Colors.primary_1,
        textFont: FontStyleRepository = .heading_1
    
    init(title: String = "",
         placeholderText: String = "",
         textEntry: String = "")
    {
        self.title = title
        self.placeholderText = placeholderText
        self.textEntry = textEntry
    }
    
    func configurator(configuration: @escaping ((SegmentedTextFieldViewModel)-> Void)) {
        configuration(self)
    }
}
