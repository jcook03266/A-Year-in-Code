//
//  PersonNameValidator.swift
//  Foncii
//
//  Created by Justin Cook on 3/4/23.
//

import Foundation

/// Validates a 'full name' string to ensure that it conforms to a universal format for human names
/// First Name -> Last Name | Middle name isn't required but is allowed, names can only be alphabetical with one character per first/last name being permissible
struct PersonNameValidator: Validator {
    typealias CriteriaKeysEnumType = CriteriaKeys
    
    // MARK: - Properties
    let textFieldContentType: TextFieldExtendedFunctionality.TextFieldEntryContentType = .name
    
    // MARK: - Validation Criteria
    /// Breakdown of this REGEX:
    /**
     This regular expression matches full names that:
     
     - Have a first and last name, with an optional middle name.
     - Only contain alphabetical characters.
     - Require at least one character per first and last name.
     - Minimum of 2 characters, maximum of 50 characters, space exclusive
     
     -This regex pattern matches a string that starts with one or more letters (uppercase or lowercase), followed by an optional space and one or more letters (uppercase or lowercase) for the middle name, and ends with a space and one or more letters (uppercase or lowercase) for the last name. The minimum length for first and last name is 1, and the maximum length for all three names combined is 50 characters.
     
     - ^: Start of string anchor
     
     - (?=.{2,50}$): Positive lookahead to ensure the entire string is between 2 to 50 characters (excluding spaces)
     
     - [a-zA-Z]{1,50}: First name capture group, 1 to 50 alphabetical characters allowed
     
     - ( [a-zA-Z]{1,50}){0,1}: Optional middle name capture group, consisting of a single space followed by 1 to 50 alphabetical characters, repeated 0 to 1 times
     
     - : A single space character to separate the names
     
     - [a-zA-Z]{1,50}: Last name capture group, 1 to 50 alphabetical characters allowed
     
     - $: End of string anchor
     */
    var validationCriteria: [String : Any] {
        return [CriteriaKeys.regex.rawValue :  #"^(?=.{2,50}$)[a-zA-Z]{1,50}( [a-zA-Z]{1,50}){0,1} [a-zA-Z]{1,50}$"#]
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
