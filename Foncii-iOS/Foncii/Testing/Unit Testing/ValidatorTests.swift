//
//  ValidatorTests.swift
//  FonciiTests
//
//  Created by Justin Cook on 2/21/23.
//

import XCTest
@testable import Foncii

/// Various test sequences for supported validators contained by the validator manager
final class ValidatorTests: XCTestCase {
    // MARK: - Test Subjects Container
    var validators: ValidatorManager.Validators {
        return ValidatorManager().validators
    }
    
    // MARK: - Email Validator
    func testEmailValidator() {
        // Test Subject
        let emailValidator = validators.emailValidator
        
        // Test Cases
        let validEmails: [String] = ["validEmailAddress@example.com",
                                     "validEmailAddress@example..com",
                                     "12337329227@example.com",
                                     ".valid@gmail.com",
                                     "_@gmail.com",
                                     "-@gmail.com",
                                     ".@gmail.com",
                                     "test@gmail.co",
        "validEmailAddresssduhdkdhdufdjiEmailAddresssduhdkdhdufdjil@example.com",
        "validEmailAddresssduhdkdhdufdjiEmailAddresssduhdkdhdufdjil@validEmailAddresssduhdkdhdufdjilwjdilwjljdiwvfhukfhukfhdfkhfukdhkduhfkuhdfkhdkufhusehfuefhukehefvalidEmailAddresssduhdkdhdufdjilwjdilwjljdiwvfhukfhukfhdfkhfukdhkduhfkuhdfkhdkufhusehfuefhukehefvalidEmailAddresssduhdk.com"],
            invalidEmails: [String] = ["invalidEmailAddress.com",
                                       "invalidEmailAddress@example./.com",
                                       "😃@gmail.com",
                                       "hello😃@gmail.com",
                                        "@gmail.com",
                                       "/@gmail.com",
                                       "\\@gmail.com",
                                       "!@gmail.com",
                                       "`@gmail.com",
                                       "invalidEmailAddress@.com",
                                       "invalidEmailAddress@com",
                                       "invalid@gmailcom",
                                       "invalid@gmailcom.",
                                       "invalid@gmail,com",
                                       "invalid@gmail.com.",
                                       "$invalid@gmail.com",
                                       "~invalid@gmail.com",
                                       "()invalid@gmail.com",
                                       "⇢invalid@gmail.com",
                                       "test@gmail.c",
                                       "email@localhost",
                                       "validEmailAddresssduhdkdhdufdjilwjdilwjljdiwvfhukfhukfhdfkhfukdhkduhfkuhdfkhdkufhusehfuefhukehefvalidEmailAddresssduhdkdhdufdjilwjdilwjljdiwvfhukfhukfhdfkhfukdhkduhfkuhdfkhdkufhusehfuefhukehefvalidEmailAddresssduhdkdhdufdjilwjdilwjljdiwvfhukfhukfhdfkhfukdhkduhfkuhdfkhdkufhusehfuefhukehef@example.com",
                                       "validEmailAddresssduhdkdhdufdjiEmailAddresssduhdkdhdufdjil@validEmailAddresssduhdkdhdufdjilwjdilwjljdiwvfhukfhukfhdfkhfukdhkduhfkuhhdfkhdkufhusehfuehdfkhdkufhusehfuehdfkhdkufhusehfuedfkhdkufhusehfuefhukehefvalidEmailAddresssduhdkdhdufdjilwjdilwjljdiwvfhukfhukfhdfkhfukdhkduhfkuhdfkhdkufhusehfuefhukehefvalidEmailAddresssduhdk.com"]
        
        // Valid emails should return true as an indication of their validity
        for email in validEmails {
            XCTAssertTrue(emailValidator.validate(email))
        }
        
        // Invalid emails should return false as an indication of their failure to conform to standard email syntax
        for email in invalidEmails {
            XCTAssertFalse(emailValidator.validate(email))
        }
    }
    
    // MARK: - Password Validator
    func testPasswordValidator() {
        // Test Subject
        let passwordValidator = validators.passwordValidator
        
        // Test Cases
        let validPasswords: [String] = [
            "Abcde1@fghijklmnop#",
            "abcdefgHIJKLMNOPQRSTU@#$",
            "1234567aBcDeFgHiJkL@",
            "sAfd23$%84DdfhFJD!@#",
            "aaaaaaa#1bbbbbbbcccccc",
            "1ABCD$%23efghijklm",
            "ABCDEFGH12345!@#$",
            "!!!!@@##$$%%^^&&*"
        ],
        invalidPasswords: [String] = [
            "Abcde1fghijklmnop",
            "a@bcdefghijklmno# ",
            "abcdefghi!jklmnopqr1>",
            "password!@#1234567()",
            "short",
            "longlonglonglonglonglonglonglonglongpassword1234@",
            "passwordwithoutspecialchar1234",
            "   abcdefg#hi%jkl   "
        ]
        
        for password in validPasswords {
            XCTAssertTrue(passwordValidator.validate(password))
        }

        for password in invalidPasswords {
            if passwordValidator.validate(password) {
                print(password)
            }
            
            XCTAssertFalse(passwordValidator.validate(password))
        }
    }
    
    // MARK: - Username Validator
    func testUsernameValidator() {
        // Test Subject
        let userNameValidator = validators.usernameValidator
        
        // Test Cases
        let validUsernames = ["user1234",
                              "USER1234",
                              "username123",
                              "username",
                              "1234",
                              "user1234567890123456"],
            invalidUsernames = ["us",
                                "username!",
                                "user name",
                                "us€r",
                                "user+name",
                                "User 1234",
                                "user-name-123456789012345"]
        
        for username in validUsernames {
            
            XCTAssertTrue(userNameValidator.validate(username))
        }
        
        for username in invalidUsernames {
            XCTAssertFalse(userNameValidator.validate(username))
        }
    }
    
    // MARK: - Person / Full Name Validator
    func testPersonNameValidator() {
        // Test Subject
        let personNameValidator = validators.personNameValidator
        
        // Test Cases
        let validFullNames: [String] = ["Justin J Cook",
                                        "John Doe",
                                        "Jane M Doe",
                                        "John S S",
                                        "J J C",
                                        "Justin C",
                                        "J J C",
                                        "J J C",
                                        "J J C",
                                        "averyveryveryverylongand validname",
                                        "a veryveryveryveryverylongandvalidlastname",
                                        "a veryveryveryveryveryverylongandvalidmiddlename c",
                                        "Justin Cook",
                                        "Mary S"],
    invalidFullNames: [String] = ["J",
                                  "John",
                                  "",
                                  " ",
                                  "123",
                                  "M1",
                                  "Mary 1",
                                  "Tim. Mu0n",
                                  "James Madison1",
                                  "1Tim Burton",
                                  "Victor 1 New",
                                  "Albert. 1. Herman",
                                  "J. J. C.",
                                  "J1. J. C.",
                                  "J. J1. C.",
                                  "J. J. C1.",
                                  "J1. J2. C3.",
                                  "J1 J2 C3",
                                  "~&3*MN Doe",
                                  "Ben~ Cal",
                                  "averyveryveryveryveryveryveryveryveryveryverylongandinvalidname",
                                  "averyveryveryveryveryveryveryveryveryverylongand invalidname",
                                "😃John Doe"]
        
        // Valid full names should return true as an indication of their validity
        for name in validFullNames {
            XCTAssertTrue(personNameValidator.validate(name))
        }
        
        // Invalid full names should return false as an indication of their failure to conform to required
        for name in invalidFullNames {
            XCTAssertFalse(personNameValidator.validate(name))
        }
    }
}
