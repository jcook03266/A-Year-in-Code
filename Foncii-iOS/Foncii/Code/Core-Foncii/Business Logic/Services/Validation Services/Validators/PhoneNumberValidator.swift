//
//  PhoneNumberValidator.swift
//  Foncii
//
//  Created by Justin Cook on 3/3/23.
//

import Foundation

/// A static object that validates whether or not an input string is a valid US Phone Number
/// Since we're only supporting US Customers this REGEX is locked to only that set of numbers
struct USPhoneNumberValidator: Validator {
    typealias CriteriaKeysEnumType = CriteriaKeys
    
    // MARK: - Properties
    let textFieldContentType: TextFieldExtendedFunctionality.TextFieldEntryContentType = .phoneNumber
    
    // MARK: - Validation Criteria
    /// Breakdown of this REGEX:
    /**
     This regular expression matches the following three formats for phone numbers:

     - The first format is xxx-xxx-xxxx, where x is a digit. This format includes only dashes.
     - The second format is simply xxxxxxxxxx, where x is a digit. This format does not include any separators.
     - The third format is xxx xxx xxxx, where x is a digit. This format includes only spaces.
     - The \d represents a digit and {3} represents that the preceding pattern should be repeated 3 times, in each format.

     Note: The | operator is used to match any of the above formats.
     */
    var validationCriteria: [String : Any] {
        return [CriteriaKeys.regex.rawValue : #"^(?:\d{3}-\d{3}-\d{4}|\d{10}|\d{3}\s\d{3}\s\d{4})$"#]
    }
    
    func validate(_ input: String) -> Bool {
        guard let regex = getCriteriaFor(key: .regex) as? String
        else { return false }
        
       return executeRegex(input: input, expression: regex)
    }
    
    func getCriteriaFor(key: CriteriaKeys) -> Any? {
        return validationCriteria[key.rawValue]
    }
    
    enum CriteriaKeys: String, CaseIterable {
        case regex
    }
}

// MARK: - Extended Functionality
extension USPhoneNumberValidator {
    /// Formats the given phone number string into a separated form with dash character delimiters
    func formatPhoneNumber(phoneNumberString: String) -> String
    {
        guard let regex = try? NSRegularExpression(pattern: "^(\\d{3})(\\d{3})(\\d{4})$"),
              validate(phoneNumberString)
        else { return phoneNumberString }
        
        // Clean up any supported delimiters and format the string
        let mutableInput = removeDelimiters(phoneNumberString: phoneNumberString),
            range = NSRange(location: 0,
                                length: mutableInput.count),
                formattedString = regex
            .stringByReplacingMatches(in: mutableInput,
                                      options: [],
                                      range: range,
                                      withTemplate: "$1-$2-$3")
        
            return formattedString
    }
    
    /// Removes dashes or spaces between string capturing groups
    func removeDelimiters(phoneNumberString: String) -> String {
        var mutableString = phoneNumberString
        mutableString.removeAll { $0 == "-" || $0 == " " }
        
        return mutableString
    }
    
    /**
     * Formats the valid input phone number string to a valid US Phone number ready to be transported to an external service such as a 2FA client
     * Transformation Ex.) 555-123-4567 -> +15551234567
     */
    func formatToPhoneNumber(countryCode: PhoneNumberModel.SupportedCountryCodes = .US,
                               phoneNumberString: String) -> String
    {
        guard validate(phoneNumberString)
        else { return phoneNumberString }
        
        let cleanedPhoneNumberString = removeDelimiters(phoneNumberString: phoneNumberString)
        
        return countryCode.rawValue + cleanedPhoneNumberString
    }
}
