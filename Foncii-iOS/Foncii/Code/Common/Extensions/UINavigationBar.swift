//
//  UINavigationBar.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import UIKit

/// Allows configuration of the app wide navigation bar, can enable and disable transparent navigation bar
extension UINavigationBar {
    static func changeAppearance(clear: Bool) {
        let appearance = UINavigationBarAppearance()
        
        clear ? appearance.configureWithTransparentBackground() :
        appearance.configureWithDefaultBackground()

        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
    }
}
