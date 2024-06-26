//
//  ValidatorProtocol.swift
//  Foncii
//
//  Created by Justin Cook on 2/19/23.
//

import Foundation

/// A generic validator used to validate some input of type string against a dictionary of conditions to be handled individually in the validation handler
protocol Validator {
    typealias CriteriaKeysEnumType = Hashable & CaseIterable
    associatedtype CriteriaKeysEnum = CriteriaKeysEnumType
    
    // MARK: - Instance Variables
    var validationCriteria: [String : Any] { get }
    var textFieldContentType: TextFieldExtendedFunctionality.TextFieldEntryContentType { get }
    
    // MARK: - Methods
    /// Validates the input given some arbitrary criteria
    func validate(_ input: String) -> Bool
    
    /// Criteria dictionary accessor
    func getCriteriaFor(key: CriteriaKeysEnum) -> Any?
    
    /// Execute any regular expression stored in the validationCriteria dictionary
    func executeRegex(input: String,
                      expression: String) -> Bool
}

extension Validator {
    func executeRegex(input: String,
                      expression: String) -> Bool
    {
        let test = NSPredicate(format: "SELF MATCHES %@", expression)
        return test.evaluate(with: input)
    }
}
