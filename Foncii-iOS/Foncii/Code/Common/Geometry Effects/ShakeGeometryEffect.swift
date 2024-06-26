//
//  ShakeGeometryEffect.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI

/// Shakes the view horizontally in an animated fashion given the input parameters provided below, the default shake oscillations quantity is 3, with the offset being 10
/// Ex.) 0 -> 10 | 10 -> -10 | -10 -> 0 oscillation pattern
private struct Shake: GeometryEffect {
    var amount: CGFloat = 10
    var shakesPerUnit = 3
    var animatableData: CGFloat

    func effectValue(size: CGSize) -> ProjectionTransform {
        ProjectionTransform(CGAffineTransform(translationX:
            amount * sin(animatableData * .pi * CGFloat(shakesPerUnit)),
            y: 0))
    }
}

private struct ShakeGeometryEffectViewModifier: ViewModifier {
    var amount: CGFloat = 10
    var shakesPerUnit = 3
    var animatableData: CGFloat
    
    func body(content: Content) -> some View {
        content
            .modifier(Shake(amount: amount,
                            shakesPerUnit: shakesPerUnit,
                            animatableData: animatableData))
    }
}

extension View {
    func shake(amount: CGFloat = 10,
               shakesPerUnit: Int = 3,
               animatableData: CGFloat) -> some View
    {
        modifier(ShakeGeometryEffectViewModifier(amount: amount,
                                                 shakesPerUnit: shakesPerUnit,
                                                 animatableData: animatableData))
    }
}
