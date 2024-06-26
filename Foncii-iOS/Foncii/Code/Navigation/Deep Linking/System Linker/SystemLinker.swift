//
//  SystemLinker.swift
//  Foncii
//
//  Created by Justin Cook on 2/21/23.
//

import Foundation
import UIKit

/// A static linker that opens up links pointing to global system wide locations such as the settings menu
struct SystemLinker {
    // MARK: - Singleton
    static let shared: SystemLinker = .init()
    
    // MARK: - Properties
    let applicationInterface = UIApplication.shared
    
    private init() {}
    
    func open(link: Links) {
        guard let linkURL = getURL(for: link)
        else { return }
        
        applicationInterface.open(linkURL)
    }
    
    private func getURL(for link: Links) -> URL? {
        switch link {
        case .openSettings:
            return UIApplication.openSettingsURLString.asURL
            
        case .openNotificationSettings:
            return UIApplication.openNotificationSettingsURLString.asURL
            
        case .appStoreWriteReview:
            let appStoreID = AppInformation.appStoreID,
                appStoreWriteReviewURL = "https://apps.apple.com/app/id\(appStoreID)?action=write-review"
            
            return appStoreWriteReviewURL.asURL
        }
    }
    
    enum Links: String, CaseIterable, Hashable {
        case openSettings
        case openNotificationSettings
        case appStoreWriteReview
    }
}
