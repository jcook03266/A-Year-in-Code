//
//  UIApplicationExtension.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import UIKit

extension UIApplication {
    /// Get the top most view controller from the application's current scene
    var topViewController: UIViewController? {
        var topViewController: UIViewController? = nil
        
        topViewController = connectedScenes.compactMap {
            return ($0 as? UIWindowScene)?.windows.filter { $0.isKeyWindow }.first?.rootViewController
        }.first
        
        if let presented = topViewController?.presentedViewController {
            topViewController = presented
        } else if let navController = topViewController as? UINavigationController {
            topViewController = navController.topViewController
        } else if let tabBarController = topViewController as? UITabBarController {
            topViewController = tabBarController.selectedViewController
        }
        return topViewController
    }
}
