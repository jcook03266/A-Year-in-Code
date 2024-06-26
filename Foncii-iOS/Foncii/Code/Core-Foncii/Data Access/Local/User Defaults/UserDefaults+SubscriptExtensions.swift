//
//  UserDefaults+SubscriptExtensions.swift
//  Foncii
//
//  Created by Justin Cook on 2/21/23.
//

import Foundation
import CoreLocation

// MARK: - Statically typed subscript access to the UserDefaults API
extension UserDefaults {
    class Key {
        let literalValue: String
        init(_ key: String) { literalValue = key }
    }
}

class UserDefaultsOptionalKey<T>: UserDefaults.Key {}

extension UserDefaults {
    subscript(key: UserDefaultsOptionalKey<Any?>) -> Any? {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) }
    }

    subscript(key: UserDefaultsOptionalKey<URL?>) -> URL? {
        set { set(newValue, forKey: key.literalValue) }
        get { return url(forKey: key.literalValue) }
    }

    subscript(key: UserDefaultsOptionalKey<[Any]?>) -> [Any]? {
        set { set(newValue, forKey: key.literalValue) }
        get { return array(forKey: key.literalValue) }
    }

    subscript(key: UserDefaultsOptionalKey<[AnyHashable: Any]?>) -> [AnyHashable: Any]? {
        set { set(newValue, forKey: key.literalValue) }
        get { return dictionary(forKey: key.literalValue) }
    }

    subscript(key: UserDefaultsOptionalKey<String?>) -> String? {
        set { set(newValue, forKey: key.literalValue) }
        get { return string(forKey: key.literalValue) }
    }

    subscript(key: UserDefaultsOptionalKey<[String]?>) -> [String]? {
        set { set(newValue, forKey: key.literalValue) }
        get { return stringArray(forKey: key.literalValue) }
    }
    
    /// Custom setter / getter for 2D Core Location coordinate objects
    /// Encoded and decoded b/c the coordinate object is not a primitive
    /// property list type (Date, Int, etc.)
    subscript(key: UserDefaultsOptionalKey<CLLocationCoordinate2D?>) -> CLLocationCoordinate2D? {
        set {
            let encodedValue = try? JSONEncoder()
                .encode(newValue)
            
            set(encodedValue, forKey: key.literalValue)
        }
        get {
            let data = object(forKey: key.literalValue)
            
            guard let data = data as? Data
            else { return nil }
            
            let decodedData = try? JSONDecoder().decode(CLLocationCoordinate2D.self, from: data)
            
            return decodedData
        }
    }
    
    subscript(key: UserDefaultsOptionalKey<Date?>) -> Date? {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? Date }
    }

    subscript(key: UserDefaultsOptionalKey<Data?>) -> Data? {
        set { set(newValue, forKey: key.literalValue) }
        get { return data(forKey: key.literalValue) }
    }

    subscript(key: UserDefaultsOptionalKey<Bool?>) -> Bool? {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? Bool }
    }

    subscript(key: UserDefaultsOptionalKey<Int?>) -> Int? {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? Int }
    }

    subscript(key: UserDefaultsOptionalKey<Float?>) -> Float? {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? Float }
    }

    subscript(key: UserDefaultsOptionalKey<Double?>) -> Double? {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? Double }
    }
}

// MARK: - Enable support for Enum types
extension UserDefaults {
    subscript<Raw>(key: UserDefaultsValueKey<Raw>) -> Raw where Raw: RawRepresentable {
        set { set(newValue.rawValue, forKey: key.literalValue) }
        get {
            if let rawValue = object(forKey: key.literalValue) as? Raw.RawValue,
               let value = Raw(rawValue: rawValue) {
                return value
            }
            return key.defaultReturnValue
        }
    }

    subscript<Raw>(key: UserDefaultsOptionalKey<Raw?>) -> Raw? where Raw: RawRepresentable {
        set { set(newValue?.rawValue, forKey: key.literalValue) }
        get {
            if let rawValue = object(forKey: key.literalValue) as? Raw.RawValue,
               let value = Raw(rawValue: rawValue) {
                return value
            }
            return nil
        }
    }

    func removeObject(forKey key: UserDefaults.Key) {
        removeObject(forKey: key.literalValue)
    }
}

// MARK: - Keys for non-optional types
class UserDefaultsValueKey<T>: UserDefaults.Key {
    /// If a value can't be retrieved for the specified key then this default value is fell back on
    let defaultReturnValue: T
    
    init(_ key: String, defaultReturnValue: T) {
        self.defaultReturnValue = defaultReturnValue
        super.init(key)
    }
}

extension UserDefaults {
    subscript(key: UserDefaultsValueKey<Any>) -> Any {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) ?? key.defaultReturnValue }
    }

    subscript(key: UserDefaultsValueKey<URL>) -> URL {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? URL ?? key.defaultReturnValue }
    }

    subscript(key: UserDefaultsValueKey<[Any]>) -> [Any] {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? [Any] ?? key.defaultReturnValue }
    }

    subscript(key: UserDefaultsValueKey<[AnyHashable: Any]>) -> [AnyHashable: Any] {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? [AnyHashable: Any] ?? key.defaultReturnValue }
    }

    subscript(key: UserDefaultsValueKey<String>) -> String {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? String ?? key.defaultReturnValue }
    }

    subscript(key: UserDefaultsValueKey<[String]>) -> [String] {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? [String] ?? key.defaultReturnValue }
    }
    
    subscript(key: UserDefaultsValueKey<Date>) -> Date {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? Date ?? key.defaultReturnValue }
    }

    subscript(key: UserDefaultsValueKey<Data>) -> Data {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? Data ?? key.defaultReturnValue }
    }

    subscript(key: UserDefaultsValueKey<Bool>) -> Bool {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? Bool ?? key.defaultReturnValue }
    }

    subscript(key: UserDefaultsValueKey<Int>) -> Int {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? Int ?? key.defaultReturnValue }
    }

    subscript(key: UserDefaultsValueKey<Float>) -> Float {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? Float ?? key.defaultReturnValue }
    }

    subscript(key: UserDefaultsValueKey<Double>) -> Double {
        set { set(newValue, forKey: key.literalValue) }
        get { return object(forKey: key.literalValue) as? Double ?? key.defaultReturnValue }
    }
}
