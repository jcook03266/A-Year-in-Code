//
//  ValidatorManager.swift
//  Foncii
//
//  Created by Justin Cook on 2/19/23.
//

import Foundation

/// Validation manager that encapsulates all supported validators
struct ValidatorManager {
    // MARK: - Properties
    struct Validators {
        let personNameValidator: PersonNameValidator = .init(),
            emailValidator: EmailValidator = .init(),
            USPhoneNumberValidator: USPhoneNumberValidator = .init(),
            usernameValidator: UsernameValidator = .init(),
            passwordValidator: PasswordValidator = .init()
    }
    let validators = Validators()
    
    /// Returns an array of all supported validators
    private var validatorCollection: [any Validator] {
        return [
            validators.personNameValidator,
            validators.emailValidator,
            validators.USPhoneNumberValidator,
            validators.usernameValidator,
            validators.passwordValidator
    ]}
    
    init() {}
    
    /** Determines the content type of the given input by chain of responsibility handling with the supported validators, if the content type can't be determined then it's deemed unknown*/
    func determineTextEntryContentType(from input: String) -> TextFieldExtendedFunctionality.TextFieldEntryContentType {
        for validator in validatorCollection {
            if validator.validate(input) {
                return validator.textFieldContentType
            }
        }
        
        return .unknown
    }
    
    func getValidator(for validatorType: SupportedValidators) -> any Validator {
        switch validatorType {
        case .personNameValidator:
            return validators.personNameValidator
        case .emailValidator:
            return validators.emailValidator
        case .USPhoneNumberValidator:
            return validators.USPhoneNumberValidator
        case .usernameValidator:
            return validators.usernameValidator
        case .passwordValidator:
            return validators.passwordValidator
        }
    }
    
    enum SupportedValidators: String, CaseIterable {
        case personNameValidator
        case emailValidator
        case USPhoneNumberValidator
        case usernameValidator
        case passwordValidator
    }
}
