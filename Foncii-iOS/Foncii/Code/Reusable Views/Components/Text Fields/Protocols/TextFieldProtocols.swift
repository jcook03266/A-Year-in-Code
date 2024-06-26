//
//  TextFieldProtocols.swift
//  Foncii
//
//  Created by Justin Cook on 2/18/23.
//

import SwiftUI

protocol GenericTextFieldModelProtocol: GenericViewModel {
    // MARK: - Properties
    var keyboardType: UIKeyboardType { get set }
    var textContentType: UITextContentType? { get set }
    var textInputAutocapitalization: TextInputAutocapitalization { get set }
    var submitLabel: SubmitLabel { get set }
    var autoCorrectionDisabled: Bool { get set }
    
    // MARK: - States
    var title: String { get set }
    var placeholderText: String { get set }
    var textEntry: String { get set } // Text entered by the user, use this to access the contents of the text field
    
    // MARK: - Bindings
    /// (Non-property wrapper b/c this isn't a view and no parent has to be informed when the wrapped value updates)
    var boundTextEntry: Binding<String> { get } // Bound to the text field, shouldn't be used to view the text entry's contents for lack of simplicity
    
    // MARK: - Published - Forces parent view to update when updates occur
    var enabled: Bool { get set }
    var focused: Bool { get set }
    
    // MARK: - Actions
    var onSubmitAction: (() -> Void)? { get set }
    
    // MARK: - Extended Functionality
    var extendedFunctionality: TextFieldExtendedFunctionality { get set }
    
    // MARK: - Functions
    @discardableResult
    func determineContentType() -> TextFieldExtendedFunctionality.TextFieldEntryContentType
    
    /// Simplified way of focusing the textfield attached to this model from an external source, i.e another textfield on submission
    func focus()
    
    /// Clears the textfield and revokes its focus
    func clear()
    
    /// Dismisses the textfield by unfocusing it
    func dismiss()
}

/// Implementing modular functions
extension GenericTextFieldModelProtocol {
    func focus() {
        DispatchQueue.main.async {
            self.focused = true
        }
    }
    
    func clear() {
        self.textEntry.clear()
    }
    
    func dismiss() {
        DispatchQueue.main.async {
            self.focused = false
        }
    }
}

/// An encapsulation that provides extra functionality to the textfield model such as determining the type of content the textfield currently contains
struct TextFieldExtendedFunctionality {
    // MARK: - Properties
    var inferredTextFieldContentType: TextFieldEntryContentType = .unknown
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let validatorManager: ValidatorManager = inject()
    }
    let dependencies = Dependencies()
    
    enum TextFieldEntryContentType: String, CaseIterable {
        case name
        case username
        case password
        case email
        case phoneNumber
        case unknown
    }
    
    /// Runs the current content of the text field through a set of validators and chooses the first validator that matches the given content type
    mutating func determineEntryContentType(from input: String) {
        inferredTextFieldContentType =
            dependencies
            .validatorManager
            .determineTextEntryContentType(from: input)
    }
}

extension GenericTextFieldModelProtocol {
    @discardableResult
    func determineContentType() -> TextFieldExtendedFunctionality.TextFieldEntryContentType {
        extendedFunctionality.determineEntryContentType(from: textEntry)
        
        return extendedFunctionality.inferredTextFieldContentType
    }
}

// MARK: - Search Bar Text Field
protocol SearchBarTextFieldModelProtocol: GenericTextFieldModelProtocol {
    // MARK: - General Properties
    // Interior
    var fieldBackgroundColor: Color { get set }
    var textFieldTextColor: Color { get set }
    var defaultBorderColor: Color { get }
    var focusedBorderColor: Color { get }
    var textFont: FontStyleRepository { get set }
    var textFieldPlaceholderText: String { get }
    
    // MARK: - Published - Forces parent view to update when updates occur
    var clearButtonEnabled: Bool { get set }
    
    // MARK: - Optional in-field icon
    /// Magnifying glass to symbolize searching etc.
    var inFieldIcon: Image? { get set }
    var inFieldIconTint: Color? { get set }
    
    // MARK: - Clear textfield button properties
    var clearTextFieldButtonIcon: Image { get set }
    var clearTextFieldButtonIconTintColor: Color { get set }
    var clearTextFieldButtonBackgroundColor: Color { get set }
    var clearTextFieldButtonAction: (() -> Void) { get }
    
    /// Allows configuration of the model after it has been initialized, used to simplify the constructor call
    func configurator(configuration: @escaping ((SearchBarTextFieldViewModel)-> Void))
    
    /// Simplified way of focusing the textfield attached to this model from an external source
    func focus()
}

extension SearchBarTextFieldModelProtocol {
    // MARK: - Convenience
    var textFieldPlaceholderText: String {
        return placeholderText.isEmpty ? title : placeholderText
    }
    
    var borderColor: Color {
        return focused ? focusedBorderColor : defaultBorderColor
    }
    
    var hasText: Bool {
        return !textEntry.isEmpty
    }
    
    var shouldDisplayPlaceholder: Bool {
        return !hasText && !textFieldPlaceholderText.isEmpty
    }
    
    /// Clears the textfield's current text entry
    var clearTextFieldButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self else { return }
            
            self.hasText ? self.clear() : self.dismiss()
        }
    }
}


// MARK: - Segmented Text Field
protocol SegmentedTextFieldModelProtocol: GenericTextFieldModelProtocol {
    // MARK: - General Properties
    // Interior
    var fieldBackgroundColor: Color { get set }
    var textFieldTextColor: Color { get set }
    var defaultBorderColor: Color { get set }
    var focusedBorderColor: Color { get set }
    var borderColor: Color { get }
    var textFont: FontStyleRepository { get set }
    var textFieldPlaceholderText: String { get }
    
    // MARK: - Published - Forces parent view to update when updates occur
    var protected: Bool { get set }
    
    // Entry validation
    /// Trigger this when validating the text entry with some separate validation module
    var validEntry: Bool { get set }
    var shouldValidateEntry: Bool { get set }
    /// Triggers the validation indicators after some condition is met
    var didValidate: Bool { get set }
    // Auto-fill
    /// When auto-filling an OTP from a text message if the input string is the exact length as the required passcode then it's sent here to be distributed amongst
    /// this segmented text field's siblings. Note this string is intended to be numerical and should be validated to be as such
    var autoFillText: String? { get set }
    
    // UI-Based Validation status indication
    var validEntryBorderColor: Color { get }
    var invalidEntryBorderColor: Color { get }
    
    /// Allows configuration of the model after it has been initialized, used to simplify the constructor call
    func configurator(configuration: @escaping ((SegmentedTextFieldViewModel)-> Void))
}

extension SegmentedTextFieldModelProtocol {
    // MARK: - Convenience
    var textFieldPlaceholderText: String {
        return placeholderText.isEmpty ? title : placeholderText
    }
    
    var borderColor: Color {
        if shouldDisplayValidationIndicator {
            return validEntry ? validEntryBorderColor : invalidEntryBorderColor
        }
        
        return focused ? focusedBorderColor : defaultBorderColor
    }
    
    var validEntryBorderColor: Color {
        return Colors.valid_green
    }
    
    var invalidEntryBorderColor: Color {
        return Colors.invalid_red
    }
    
    var hasText: Bool {
        return !textEntry.isEmpty
    }
    
    var shouldDisplayPlaceholder: Bool {
        return !hasText && !textFieldPlaceholderText.isEmpty
    }
    
    var shouldDisplayValidationIndicator: Bool {
        return shouldValidateEntry && didValidate
    }
    
    /// Used to reset the validation state of the text field
    func resetValidationStatus() {
        validEntry = false
        didValidate = false
        shouldValidateEntry = false
    }
}


// MARK: - User Input Text Field
protocol UserInputTextFieldModelProtocol: GenericTextFieldModelProtocol {
    // MARK: - General Properties
    // Interior
    var fieldBackgroundColor: Color { get set }
    var textFieldTextColor: Color { get set }
    var textFont: FontStyleRepository { get set }
    var textFieldPlaceholderText: String { get }
    
    // MARK: - Published - Forces parent view to update when updates occur
    var protected: Bool { get set }
    var clearButtonEnabled: Bool { get set }
    
    // Entry validation
    /// Trigger this when validating the text entry with some separate validation module
    var validEntry: Bool { get set }
    var shouldValidateEntry: Bool { get set }
    /// Set this to enable or disable entry validation visual indication entirely | validates input in real-time as the user types
    /// (don't use this for password and username fields because those are network dependent and should only be triggered when the user submits their information to the backend service)
    var realTimeEntryValidationEnabled: Bool { get set }
    /// Use this for network dependent validation conditions, it triggers the validation indicators after the condition is executed
    var didValidate: Bool { get set }
    var validationCondition: ((String) async -> Bool)? { get set }
    /// Trigger this when validating using some async process, this will toggle the loading indicator
    var isValidating: Bool { get set }
    
    // UI-Based Validation status indication
    /// In-field images to display after a validation condition has been executed
    var validEntryImage: Image { get set }
    var validEntryImageTintColor: Color { get set }
    var invalidEntryImage: Image { get set }
    var invalidEntryImageTintColor: Color { get set }
    var activityIndicatorTintColor: Color { get set }
    
    // MARK: - Optional in-field button properties
    /// i.e hide password button for password textfields
    var inFieldButtonIcon: Image? { get set }
    var inFieldButtonAction: (() -> Void)? { get set }
    var inFieldButtonIconTint: Color? { get set }
    
    // MARK: - Clear textfield button properties
    var clearTextFieldButtonIcon: Image { get set }
    var clearTextFieldButtonIconTintColor: Color { get set }
    var clearTextFieldButtonBackgroundColor: Color { get set }
    var clearTextFieldButtonAction: (() -> Void) { get }
    
    /// Allows configuration of the model after it has been initialized, used to simplify the constructor call
    func configurator(configuration: @escaping ((UserInputTextFieldViewModel)-> Void))
    
    /// Simplified way of focusing the textfield attached to this model from an external source, i.e another textfield on submission
    func focus()
}

extension UserInputTextFieldModelProtocol {
    // MARK: - Convenience
    var textFieldPlaceholderText: String {
        return placeholderText.isEmpty ? title : placeholderText
    }
    
    var validationIndicatorImage: Image {
        return validEntry ? validEntryImage : invalidEntryImage
    }
    
    var validationIndicatorColor: Color {
        return validEntry ? validEntryImageTintColor : invalidEntryImageTintColor
    }
    
    var hasText: Bool {
        return !textEntry.isEmpty
    }
    
    var shouldDisplayPlaceholder: Bool {
        return !hasText && !textFieldPlaceholderText.isEmpty
    }
    
    var shouldDisplayValidationIndicator: Bool {
        return shouldValidateEntry && didValidate
    }
    
    /// Clears the textfield's current text entry
    var clearTextFieldButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self else { return }
            
            self.hasText ? self.clear() : self.dismiss()
        }
    }
    
    /// Execute some async validation operation and inform the model of the outcome via the published valid entry property
    @MainActor func executeValidationCondition() async {
        guard let condition = validationCondition else { return }
        
        validEntry = await condition(textEntry)
        didValidate = true
    }
    
    /// Used to reset the validation state of the text field, effectively wiping out all prior validation attempts
    func resetValidationStatus() {
        didValidate = false
        shouldValidateEntry = false
        validEntry = false
    }
}
