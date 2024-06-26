//
//  PasswordValidator.swift
//  Foncii
//
//  Created by Justin Cook on 2/19/23.
//

import Foundation
 
/// Validates that a given 'password' string conforms to the required REGEX criteria in order
/// to ensure the safety and validity of our userbase
struct PasswordValidator: Validator {
    typealias CriteriaKeysEnumType = CriteriaKeys
    
    // MARK: - Properties
    let textFieldContentType: TextFieldExtendedFunctionality.TextFieldEntryContentType = .password
    
    // MARK: - Validation Criteria
    /// Breakdown of this REGEX:
    /**
     This regular expression matches passwords that:
     
     - Have a minimum of 8 characters.
     - Have a maximum of 30 characters.
     - Contain at least one special character (!,@,?,#).
     - Only contain letters (uppercase or lowercase), numbers, and the specified special characters.
     
     - The pattern starts with the `^` character, which matches the beginning of the string, and ends with the `$` character, which matches the end of the string.
     
     - (?=.*[!@#?$%^&*]) a positive lookahead assertion that requires the presence of at least one of the specified special characters in the password.
     
     - The pattern also includes a character set (`[a-zA-Z0-9!@?#]`) that matches any letter (uppercase or lowercase), number, or one of the specified special characters.
     
     - The pattern specifies that there must be at least 8 characters in the string (`{8,30}`)
     */
    var validationCriteria: [String : Any] {
        return [CriteriaKeys.regex.rawValue :  #"^(?=.*[!@#?$%^&*])[a-zA-Z0-9!@#?$%^&*]{8,30}$"#]
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
