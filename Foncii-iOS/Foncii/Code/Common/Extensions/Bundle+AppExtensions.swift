//
//  Bundle+AppExtensions.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import Foundation

extension Bundle {
    // MARK: - Bundle Keys
    fileprivate enum Keys: AssociatedEnum, CaseIterable {
        static var allCases: [Bundle.Keys] = [.nameKey(),
                                              shortVersionKey(),
                                              .versionKey()]
        typealias associatedValue = String
        
        case nameKey(String = kCFBundleNameKey as String)
        case versionKey(String = kCFBundleVersionKey as String)
        case shortVersionKey(String = "CFBundleShortVersionString")
        
        func getAssociatedValue() -> String {
            switch self {
            case .versionKey(let key):
                return key
            case .nameKey(let key):
                return key
            case .shortVersionKey(let key):
                return key
            }
        }
    }
    
    /// Simplifies accessing the optional information dictionary of the main bundle
    var informationDictionary: [String : Any] {
        guard let info = infoDictionary
        else {
            ErrorCodeDispatcher.BundleErrors.triggerFatalError(for: .infoDictionaryNotFound,
                                                               with: "\(#function) in \(#filePath)")()
        }
        
        return info
    }
    
    var name: String {
        guard let name = getInformation(using: .nameKey())
        else {
            guard AppInformation.isProduction else {
                ErrorCodeDispatcher.BundleErrors.triggerFatalError(for: .bundleNameNotFound,
                                                                   with: "\(#function) in \(#filePath)")()
            }
            
            return ""
        }
        
        return name
    }
    
    var version: String {
        guard let version = getInformation(using: .versionKey())
        else {
            guard AppInformation.isProduction else {
                ErrorCodeDispatcher.BundleErrors.triggerFatalError(for: .bundleVersionNotFound,
                                                                   with: "\(#function) in \(#filePath)")()
            }
            
            return ""
        }
        
        return version
    }
    
    var releaseVersion: String {
        guard let shortenedVersion = getInformation(using: .shortVersionKey())
        else {
            ErrorCodeDispatcher.BundleErrors.triggerFatalError(for: .bundleShortVersionNotFound,
                                                               with: "\(#function) in \(#filePath)")()
        }
        
        return shortenedVersion
    }
    
    var buildID: Int {
        guard let buildID = version.components(separatedBy: ".").last,
              let numericalBuildID = Int(buildID)
        else {
            if AppInformation.isProduction {
                return -1
            }
            else {
                ErrorCodeDispatcher.BundleErrors.triggerFatalError(for: .bundleBuildIDNotFound,
                                                                   with: "\(#function) in \(#filePath)")()
            }
        }
        
        return numericalBuildID
    }
    
    fileprivate func getInformation(using key: Keys) -> String? {
        return informationDictionary[key.getAssociatedValue()] as? String
    }
}
