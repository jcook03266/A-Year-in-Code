//
// PhoneNumberDataModel.swift
// Foncii
//
// Created by Justin Cook on 4/22/23 at 4:22 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation

/**
 * Simple data model for storing and transporting the components of a typical phone number
 * Currently only US Phone numbers are supported at this time
 */
class PhoneNumberModel {
    // MARK: - Properties
    /// Numerical number code corresponding to the country the phone number belongs to
    var countryCode: SupportedCountryCodes = .US
    /// National significant number ~ the body of the phone number ex.) 555-123-4567 or 5551234567 or 555 123 4567, (only acceptable combinations)
    var nsn: String = ""
    
    // MARK: Dependencies
    struct Dependencies: InjectableServices {
        let validatorManager: ValidatorManager = inject()
    }
    internal let dependencies = Dependencies()
    
    // MARK: - Convenience
    private var phoneNumberValidator: USPhoneNumberValidator {
        return dependencies.validatorManager.validators.USPhoneNumberValidator
    }
    
    /// Determines whether or not the country code + nsn combination forms a valid US Phone number
    var isValid: Bool {
        phoneNumberValidator
            .validate(self.toString())
    }
    
    /**
     * Note: Acceptable NSN strings are formatted like so: 555-123-4567 or 5551234567 or 555 123 4567
     */
    init(countryCode: SupportedCountryCodes = .US, nsn: String) {
        self.countryCode = countryCode
        self.nsn = phoneNumberValidator
            .removeDelimiters(phoneNumberString: nsn)
    }
    
    // MARK: - Phone Number Logic methods
    /// Creates a phone number string from the phone number's components
    func toString() -> String {
        return phoneNumberValidator
            .formatToPhoneNumber(countryCode: self.countryCode,
                                 phoneNumberString: self.nsn)
    }
    
    /// Converts a formatted phone number string to a compact one ex.) `+1 3475551234` or `+1 347-555-1234` to `+13475551234` for use in OTP validation
    static func formattedPhoneNumberToOTPString(phoneNumberString: String) -> String {
        return PhoneNumberModel
            .Dependencies()
            .validatorManager
            .validators
            .USPhoneNumberValidator
            .removeDelimiters(phoneNumberString: phoneNumberString)
    }
    
    /// A table of the country codes currently supported by our infrastructure
    enum SupportedCountryCodes: String, CaseIterable {
        case US = "1"
    }
}
