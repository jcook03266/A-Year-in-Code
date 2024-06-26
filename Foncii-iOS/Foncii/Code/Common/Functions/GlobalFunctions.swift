//
//  GlobalFunctions.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import Foundation
import UIKit

// MARK: - A collection of functions to be used in any global scope regardless of relevance
func hideKeyboard() {
    UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder),
                                    to: nil,
                                    from: nil,
                                    for: nil)
}
