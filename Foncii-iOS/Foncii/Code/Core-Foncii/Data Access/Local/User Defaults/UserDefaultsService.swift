//
//  UserDefaultsService.swift
//  Foncii
//
//  Created by Justin Cook on 2/21/23.
//

import Foundation
import CoreLocation

/// Service used for interfacing with the UserDefaults API in order to store small as-needed data neccessary for customizing the application's UX. This data can be user progression dependent feature flags, and user preferences
final class UserDefaultsService {
    /// Shared userdefaults database
    var shared: UserDefaults {
        guard let userDefaultsDatabase = UserDefaults(suiteName: self.databaseName)
        else {
            ErrorCodeDispatcher.UserDefaultsErrors.triggerFatalError(for: .invalidAppGroup)()
        }
        
        return userDefaultsDatabase
    }
    
    /// The name of the domain in which this user defaults database lies
    private var databaseName: String {
        return "group.com.Foncii"
    }
    
    // MARK: - All User Defaults Keys
    enum NonOptionalKeys: AssociatedEnum {
        static var allCases: [UserDefaultsService.NonOptionalKeys] = []
        
        typealias associatedValue = UserDefaultsValueKey<Any>
        
        // MARK: - Default Implementation
        case none(UserDefaultsValueKey<Any> = UserDefaultsValueKey<Any>("none",
                                                                        defaultReturnValue: false))
        
        // MARK: - Restaurant Data Aggregation Pipeline
        case totalAggregationEvents(UserDefaultsValueKey<Any> = UserDefaultsValueKey<Any>("totalAggregationEvents",
                                                                                          defaultReturnValue: 0))
        
        // MARK: - User Settings & FTUE
        case didCompleteOnboarding(UserDefaultsValueKey<Any> = UserDefaultsValueKey<Any>("didCompleteOnboarding",
                                                                                         defaultReturnValue: false))
        
    
        func getAssociatedValue() -> UserDefaultsValueKey<Any> {
            switch self {
            case .none(let value):
                return value
            case .totalAggregationEvents(let value):
                return value
            case .didCompleteOnboarding(let value):
                return value
            }
        }
    }
    
    /// Reserved for optional primitive property list types (Int, Date, etc.)
    enum OptionalKeys: AssociatedEnum {
        static var allCases: [UserDefaultsService.OptionalKeys] = []
        
        typealias associatedValue = UserDefaultsOptionalKey<Any?>
        
        // MARK: - Restaurant Data Aggregation Pipeline
        case defaultImplementation(UserDefaultsOptionalKey<Any?> = UserDefaultsOptionalKey<Any?>("defaultImplementation"))
        
        func getAssociatedValue() -> UserDefaultsOptionalKey<Any?> {
            switch self {
            case .defaultImplementation(let value):
                return value
            }
        }
    }
    
    enum OptionalCLLCoordinate2DKeys: AssociatedEnum {
        static var allCases: [UserDefaultsService.OptionalCLLCoordinate2DKeys] = []
        
        typealias associatedValue = UserDefaultsOptionalKey<CLLocationCoordinate2D?>
        
        // MARK: - Restaurant Data Aggregation Pipeline
        case lastAggregationLocation(UserDefaultsOptionalKey<CLLocationCoordinate2D?> = UserDefaultsOptionalKey<CLLocationCoordinate2D?>("lastAggregationLocation"))
        
        func getAssociatedValue() -> UserDefaultsOptionalKey<CLLocationCoordinate2D?> {
            switch self {
            case .lastAggregationLocation(let value):
                return value
            }
        }
    }
    
    enum OptionalDateKeys: AssociatedEnum {
        static var allCases: [UserDefaultsService.OptionalDateKeys] = []
        
        typealias associatedValue = UserDefaultsOptionalKey<Date?>
        
        // MARK: - Restaurant Data Aggregation Pipeline
        case lastAggregationEventDate(UserDefaultsOptionalKey<Date?> =  UserDefaultsOptionalKey<Date?>("lastAggregationEventDate"))
        
        func getAssociatedValue() -> UserDefaultsOptionalKey<Date?> {
            switch self {
            case .lastAggregationEventDate(let value):
                return value
            }
        }
    }
    
    enum OptionalURLKeys: AssociatedEnum {
        static var allCases: [UserDefaultsService.OptionalURLKeys] = []
        
        typealias associatedValue = UserDefaultsOptionalKey<URL?>
        
        // MARK: - Deeplink Manager
        case lastActiveDeeplink(UserDefaultsOptionalKey<URL?> =  UserDefaultsOptionalKey<URL?>("lastActiveDeeplink"))
        
        func getAssociatedValue() -> UserDefaultsOptionalKey<URL?> {
            switch self {
            case .lastActiveDeeplink(let value):
                return value
            }
        }
    }
    
    // MARK: - Get set methods for all supported keys
    // MARK: - Non-Optional Keys
    /// Note: Specifying the type 't' gives the compiler enough information to interpret the return type even if the generic function isn't specialized
    func getValueFor<T: Any>(type t: T.Type, key: NonOptionalKeys) -> T {
        guard let value = shared[key.getAssociatedValue()] as? T
        else {
            ErrorCodeDispatcher.UserDefaultsErrors.triggerFatalError(for: .mismatchingGenericTypes,
                                                                     with: "\(#function) in \(#file) for type: \(T.self)")()
        }
        
        return value
    }
    
    func setValueFor<T: Any>(type t: T.Type, key: NonOptionalKeys, value: T){
        shared[key.getAssociatedValue()] = value
    }
    
    func removeValueFor(key: NonOptionalKeys){
        let key = key.getAssociatedValue().literalValue
        
        shared.removeObject(forKey: key)
    }
    
    // MARK: - Optional Keys
    func getValueFor<T: Any>(type t: T.Type, key: OptionalKeys) -> T? {
        return shared[key.getAssociatedValue()] as? T
    }
    
    func removeValueFor(key: OptionalKeys){
        let key = key.getAssociatedValue().literalValue
        
        shared.removeObject(forKey: key)
    }
    
    // MARK: - Optional CLLocationCoordinate2D Keys
    func getValueFor(key: OptionalCLLCoordinate2DKeys) -> CLLocationCoordinate2D? {
        return shared[key.getAssociatedValue()]
    }
    
    func setValueFor(key: OptionalCLLCoordinate2DKeys,
                     value: CLLocationCoordinate2D?)
    {
        shared[key.getAssociatedValue()] = value
    }
    
    func removeValueFor(key: OptionalCLLCoordinate2DKeys){
        let key = key.getAssociatedValue().literalValue
        
        shared.removeObject(forKey: key)
    }
    
    // MARK: - Optional Date Keys
    func getValueFor(key: OptionalDateKeys) -> Date? {
        return shared[key.getAssociatedValue()]
    }
    
    func setValueFor(key: OptionalDateKeys,
                     value: Date?)
    {
        shared[key.getAssociatedValue()] = value
    }
    
    func removeValueFor(key: OptionalDateKeys){
        let key = key.getAssociatedValue().literalValue
        
        shared.removeObject(forKey: key)
    }
    
    // MARK: - Optional URL Keys
    func getValueFor(key: OptionalURLKeys) -> URL? {
        return shared[key.getAssociatedValue()]
    }
    
    func setValueFor(key: OptionalURLKeys,
                     value: URL?)
    {
        shared[key.getAssociatedValue()] = value
    }
    
    func removeValueFor(key: OptionalURLKeys){
        let key = key.getAssociatedValue().literalValue
        
        shared.removeObject(forKey: key)
    }
}

