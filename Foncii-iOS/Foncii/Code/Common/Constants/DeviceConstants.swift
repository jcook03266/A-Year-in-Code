//
//  DeviceConstants.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import UIKit
import SwiftUI

/// Object with device constants for simplified application across the scope of the codebase
struct DeviceConstants {
    static var device = UIDevice()
    static var screen = UIScreen()
    
    /// - Returns: Tuple<Width,Height>
    static func getDeviceSize() -> (CGFloat, CGFloat) {
        let bounds = UIApplication.shared.topViewController?.view.frame ?? CGRect.zero
        return (bounds.width, bounds.height)
    }
    
    /// Detects if the current device has a small screen height <= 670 (iPhone SE)
    static func isDeviceSmallFormFactor() -> Bool {
        return getDeviceSize().1 <= 670
    }
}
