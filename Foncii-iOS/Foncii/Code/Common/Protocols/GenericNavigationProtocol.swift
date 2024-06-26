//
//  GenericNavigationProtocol.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI

/// Generic navigation functions that enable useful logic for forward and backward sequential and random traversal
protocol GenericNavigationProtocol: AnyObject {
    func moveForward()
    func moveBackward()
    func skipToFirst()
    func skipToLast()
}
