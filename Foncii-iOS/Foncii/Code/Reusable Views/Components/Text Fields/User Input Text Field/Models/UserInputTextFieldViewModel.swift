//
//  UserInputTextFieldViewModel.swift
//  Foncii
//
//  Created by Justin Cook on 2/18/23.
//

import SwiftUI

class UserInputTextFieldViewModel: UserInputTextFieldModelProtocol {
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
            self.textEntry = newVal
        }
    }
    
    // MARK: - Published
    @Published var textEntry: String {
        didSet {
            shouldValidateEntry = self.hasText
            guard realTimeEntryValidationEnabled else { return }
           
            Task {@MainActor in
                await executeValidationCondition()
            }
        }
    }
    @Published var enabled: Bool = true
    @Published var focused: Bool = false
    @Published var protected: Bool = false
    @Published var clearButtonEnabled: Bool = true
    
    // Entry validation
    @Published var validEntry: Bool = false
    @Published var shouldValidateEntry: Bool = false
    /// Set this to enable or disable entry validation visual indication entirely
    @Published var realTimeEntryValidationEnabled: Bool = false
    @Published var didValidate: Bool = false
    /// Trigger this when validating using some async process, this will toggle the loading indicator
    @Published var isValidating: Bool = false
    var validationCondition: ((String) async -> Bool)? = nil
    
    // Validation Image Assets
    var validEntryImage: Image = Icons.getIconImage(named: .valid_checkmark_green)
    var validEntryImageTintColor: Color = Colors.valid_green
    var invalidEntryImage: Image = Icons.getIconImage(named: .invalid_xmark_red)
    var invalidEntryImageTintColor: Color = Colors.invalid_red
    var activityIndicatorTintColor: Color = Colors.primary_1
    
    // MARK: - Styling
    var fieldBackgroundColor: Color = Colors.dark_grey_1,
        textFieldTextColor: Color = Colors.neutral_1,
        textFont: FontStyleRepository = .body
    
    // MARK: - Optional in-field button properties
    var inFieldButtonIcon: Image? = nil,
        inFieldButtonAction: (() -> Void)? = nil,
        inFieldButtonIconTint: Color? = Colors.neutral_1
    
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
    
    func configurator(configuration: @escaping ((UserInputTextFieldViewModel)-> Void)) {
        configuration(self)
    }
}
