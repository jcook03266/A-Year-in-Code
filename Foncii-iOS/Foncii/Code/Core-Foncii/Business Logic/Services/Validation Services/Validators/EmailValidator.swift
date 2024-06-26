//
//  EmailValidator.swift
//  Foncii
//
//  Created by Justin Cook on 2/19/23.
//

import Foundation

/// A static object that validates whether or not an input string is an email
struct EmailValidator: Validator {
    typealias CriteriaKeysEnumType = CriteriaKeys
    
    // MARK: - Properties
    let textFieldContentType: TextFieldExtendedFunctionality.TextFieldEntryContentType = .email
    
    // MARK: - Validation Criteria
    /// Most common emails conform to the following REGEX sequence
    /// Note: This is a raw string to avoid the escaping back slash character, of course a double back slash solves this but it will make the regex confusing as a string literal
    /// This REGEX conforms to the character limits imposed by the RFC 5321 standard
    /// https://www.rfc-editor.org/rfc/rfc5321.txt
    
    /// Breakdown of this REGEX:
    /**
     - ^ matches the start of the string
     - [a-zA-Z0-9._%+-]+ matches one or more of the following characters: letters (upper and lowercase), digits, and the special characters ., _, %, +, and -
     - @ matches the @ symbol
     - [a-zA-Z0-9.-]+ matches one or more of the following characters: letters (upper and lowercase), digits, and the special characters . and -
     - \. matches a literal period (the \ is used to escape the special meaning of the . character in regex)
     - [a-zA-Z]{2,} matches two or more letters (upper or lowercase) at the end of the string
     - $ matches the end of the string
     - This regex limits the local part of the email address to a maximum of 64 characters, and the domain part (including the TLD) to a maximum of 255 characters. Note that these limits are somewhat arbitrary and some email servers may accept longer email addresses, but adhering to the RFC 5321 standard is a good practice for ensuring compatibility with most email systems.
     */
    var validationCriteria: [String : Any] {
        return [CriteriaKeys.regex.rawValue : #"^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,255}\.[a-zA-Z]{2,}$"#]
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
