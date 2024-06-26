//
//  UsernameValidator.swift
//  Foncii
//
//  Created by Justin Cook on 3/4/23.
//

import Foundation

/// Validates that a given 'username' string conforms to the required criteria
struct UsernameValidator: Validator {
    typealias CriteriaKeysEnumType = CriteriaKeys
    
    // MARK: - Properties
    let textFieldContentType: TextFieldExtendedFunctionality.TextFieldEntryContentType = .username
    
    // MARK: - Validation Criteria
    /// Breakdown of this REGEX:
    /**
     This regular expression matches usernames that:
     
     - Have a minimum of 4 characters.
     - Have a maximum of 24 characters.
     - Do not contain any special characters. Only letters and numbers are allowed.
     
     - The pattern starts with the `^` character, which matches the beginning of the string, and ends with the `$` character, which matches the end of the string.
     
     - The pattern includes a character set (`[a-zA-Z0-9]`) that matches any letter (uppercase or lowercase) or number, and specifies that there must be between 4 and 24 of those characters (`{4,24}`).
     */
    var validationCriteria: [String : Any] {
        return [CriteriaKeys.regex.rawValue : #"^[a-zA-Z0-9]{4,24}$"#]
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
