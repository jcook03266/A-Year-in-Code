//
//  UINavigationController+Extensions.swift
//  Foncii
//
//  Created by Justin Cook on 2/19/23.
//

import UIKit

/// Allows a navigation controller / navigation stack to pop views via swiping gesture even when the back button is hidden
extension UINavigationController: UIGestureRecognizerDelegate {
    override open func viewDidLoad() {
        super.viewDidLoad()
        interactivePopGestureRecognizer?.delegate = self
    }

    public func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        return viewControllers.count > 1
    }
}
