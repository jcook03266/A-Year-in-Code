//
//  GradientModifiers.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI

extension View {
    func applyGradient(gradient: LinearGradient) -> some View {
        self.overlay(gradient)
            .mask(self)
    }
}
