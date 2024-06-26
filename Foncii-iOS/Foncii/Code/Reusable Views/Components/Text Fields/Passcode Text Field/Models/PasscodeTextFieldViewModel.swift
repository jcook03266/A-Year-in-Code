//
// PasscodeTextFieldViewModel.swift
// Foncii
//
// Created by Justin Cook on 4/7/23 at 5:47 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Combine

/**
 * An entity that manages multiple segmented text fields for OTP entries
 */
class PasscodeTextFieldViewModel: GenericViewModel {
    // MARK: - Published
    @Published var currentlyFocusedTextField: SegmentedTextFieldViewModel? = nil
    @Published var enteredPasscode: String = ""
    
    /// Specifies whether or not the passcode meets its required length
    @Published var isPasscodeComplete: Bool = false
    
    // Auto-fill
    /// When one of the fields has an auto-fill OTP pasted, it's then distributed amongst its siblings
    @Published var autoFillText: String? = nil
    /// Disables sibling to sibling navigation when auto filling is in progress
    @Published var autoFillingInProgress: Bool = false
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let authenticationService: AuthenticationService = .shared
    }
    let dependencies = Dependencies()
    
    // MARK: - Properties
    // The amount of text fields to instantiate and embed in the passcode view module
    private static let segmentedTextFieldQuantity: Int = 6
    var requiredPasscodeLength: Int {
        return dependencies.authenticationService.requiredPasscodeLength
    }
    
    // Text Field View Models
    let segmentedTextFields: [SegmentedTextFieldViewModel] =
    [.init(),
     .init(),
     .init(),
     .init(),
     .init(),
     .init()]
    
    // MARK: - Convenience
    var isFocused: Bool {
        return currentlyFocusedTextField != nil
    }
    
    init() {
        configureViewModels()
        addSubscribers()
    }
    
    // MARK: - Subscriptions
    func addSubscribers() {
        /// Note: This subscriber has to be placed here to allow the auto fill in progress var to trigger and override the state of the textfields below
        $autoFillText
            .receive(on: scheduler)
            .sink { [weak self] autoFillText in
                guard let self = self,
                      let autoFillText = autoFillText,
                      autoFillText.count == requiredPasscodeLength
                else { return }
                
                distributeAutoFillText()
            }
            .store(in: &cancellables)
        
        for textField in segmentedTextFields {
            // Navigate when the text entry changes
            textField
                .$textEntry
                .receive(on: scheduler)
                .sink { [weak self] text in
                    guard let self = self,
                          textField.id == self.currentlyFocusedTextField?.id,
                          !autoFillingInProgress
                    else { return }
                
                    if !text.isEmpty {
                        self.goForward()
                    }
                    else if text.isEmpty {
                        self.goBackward()
                    }
                }
                .store(in: &cancellables)
                
            // Listen for changes to the currently focused text field
            textField
                .$focused
                .combineLatest(textField.$textEntry)
                .receive(on: scheduler)
                .sink { [weak self] (focused, _) in
                    guard let self = self
                    else { return }
                    
                    if focused {
                        self.currentlyFocusedTextField = textField
                    }
                    
                    self.computeConcatenatedPasscodeString()
                }
                .store(in: &cancellables)
            
            textField
                .$autoFillText
                .receive(on: scheduler)
                .sink { [weak self] autoFillText in
                    guard let self = self,
                          let autoFillText = autoFillText
                    else { return }
                    
                    /// Store the new auto-fill text in this instance
                    self.autoFillText = autoFillText
                }
                .store(in: &cancellables)
        }
        
        // Listen to the entered passcode and mark it as complete if the required length is fulfilled
        $enteredPasscode
            .receive(on: scheduler)
            .sink { [weak self] currentPasscode in
                guard let self = self
                else { return }
                
                isPasscodeComplete = currentPasscode.count == requiredPasscodeLength
            }
            .store(in: &cancellables)
    }
    
    /// Distributes the current auto-fill OTP amongst the segmented text fields
    private func distributeAutoFillText() {
        guard let autoFillText = autoFillText,
              autoFillText.count == requiredPasscodeLength
        else { return }
        
        self.autoFillingInProgress = true
        
        // Fill in all the text fields character by character
        for (index, character) in autoFillText.enumerated() {
            segmentedTextFields[index].textEntry = character.toString()
            segmentedTextFields[index].dismiss()
        }
        
        self.currentlyFocusedTextField = nil
    }
    
    // MARK: - Configuration and Management Logic
    /// Combines the concatenated text content from all the segmented text fields into a single passcode string for ease of transport elsewhere
    private func computeConcatenatedPasscodeString() {
        var text = ""
        
        segmentedTextFields.forEach({ model in
            text.append(model.textEntry)
        })
    
        enteredPasscode = text
    }
    
    /// Moves the user's focus to the next text field from the currently focused one (if any), dismisses focus if no text field succeeds the current one, but maintains the last field as currently focused
    func goForward() {
        guard let currentlyFocusedTextField = currentlyFocusedTextField
        else { return }
        
        segmentedTextFields.forEach { textField in
            if textField.id == currentlyFocusedTextField.id {
                textField.onSubmitAction?()
            }
        }
    }
    
    /// Moves the user's focus to the previous text field from the currently focused one (if any), dismisses focus if no text field precedes the current one
    func goBackward() {
        guard let currentlyFocusedTextField = currentlyFocusedTextField
        else { return }
        
        for (index, textField) in segmentedTextFields.enumerated() {
            if textField.id == currentlyFocusedTextField.id {
                if (index > 0) {
                    let precedingTextFieldIndex = index.decrementBy(1),
                    precedingTextField = segmentedTextFields[precedingTextFieldIndex]
                    
                    precedingTextField.focus()
                }
                else {
                    currentlyFocusedTextField.dismiss()
                    self.currentlyFocusedTextField = nil
                }
            }
        }
    }
    
    /// Drops the currently focused text field and releases the current focus state
    func releaseFocus() {
        guard let currentlyFocusedTextField = currentlyFocusedTextField
        else { return }
        
        currentlyFocusedTextField.dismiss()
        self.currentlyFocusedTextField = nil
    }
    
    /// Clears all text fields simultaneously
    func clearAllTextFields() {
        segmentedTextFields.forEach { textField in
            textField.clear()
        }
    }
    
    /// Removes all validation indicators
    func resetValidationState() {
        segmentedTextFields.forEach { textField in
            textField.resetValidationStatus()
        }
    }
    
    /// Sets the validation indicator for each text field to the specified validation state (Bool)
    func toggleValidationIndicator(isValid: Bool) {
        segmentedTextFields.forEach { textField in
            textField.validEntry = isValid
            textField.didValidate = true
        }
    }
    
    func configureViewModels() {
        for (index, textField) in segmentedTextFields.enumerated() {
            textField
                .configurator { model in
                    let canContinueOnSubmit = index < self.segmentedTextFields.zeroIndexedCount
                    
                    // Main properties
                    model.protected = false
                    model.textContentType = .oneTimeCode
                    if canContinueOnSubmit {
                        model.submitLabel = .continue
                    }
                    else {
                        model.submitLabel = .done
                    }
                    
                    model.onSubmitAction = { [weak self] in
                        guard let self = self
                        else { return }
                        
                        // Only move forward on submit when the text field is succeeded by another
                        if canContinueOnSubmit {
                            let nextIndex = index.advanced(by: 1),
                                nextTextField = self.segmentedTextFields[nextIndex]
                            
                            nextTextField.focus()
                        }
                        else {
                            model.focus()
                        }
                    }
                }
        }
    }
}
