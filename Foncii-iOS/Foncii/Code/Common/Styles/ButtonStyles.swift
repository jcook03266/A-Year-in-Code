//
//  ButtonStyles.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import UIKit

/// A more opaque version of the generic springy shrink style
struct KeypadButtonStyle: ButtonStyle {
    // MARK: - Animation Properties
    var springResponse: CGFloat = 0.6
    var scaleAmount: CGFloat = 0.8
    
    func makeBody(configuration: Configuration) -> some View {
        configuration
            .label
            .opacity(configuration.isPressed ? 0.25 : 1)
            .scaleEffect(configuration.isPressed ? scaleAmount : 1)
            .animation(.spring(response: springResponse),
                       value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == KeypadButtonStyle {
    static var keypadButtonStyle: Self {
        return .init()
    }
}

/// Shrinks the button by the specified amount, button's opacity changes when button is disabled like .plain style
struct GenericSpringyShrink: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled: Bool
    
    var springResponse: CGFloat = 0.6
    var scaleAmount: CGFloat = 0.8
    
    func makeBody(configuration: Configuration) -> some View {
        configuration
            .label
            .opacity(isEnabled ? (configuration.isPressed ? 0.75 : 1) : 0.5)
            .scaleEffect(configuration.isPressed ? scaleAmount : 1)
            .animation(.spring(response: springResponse),
                       value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == GenericSpringyShrink {
    static var genericSpringyShrink: Self {
        return .init()
    }
}

/// Offsets the button depending on the specified CGSize
struct OffsettableButtonStyle: ButtonStyle {
    var springResponse: CGFloat = 0.6
    var offset: CGSize = CGSize(width: -20, height: 0)
    
    func makeBody(configuration: Configuration) -> some View {
        configuration
            .label
            .opacity(configuration.isPressed ? 0.75 : 1)
            .offset(configuration.isPressed ? offset : .zero)
            .animation(.spring(response: springResponse),
                       value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == OffsettableButtonStyle {
    static var offsettableButtonStyle: Self {
        return .init()
    }
}

/// Offsets and shrinks the button in parallel
struct OffsettableShrinkButtonStyle: ButtonStyle {
    var springResponse: CGFloat = 0.6
    var offset: CGSize = CGSize(width: -20, height: 0)
    var scaleAmount: CGFloat = 0.95
    
    func makeBody(configuration: Configuration) -> some View {
        configuration
            .label
            .opacity(configuration.isPressed ? 0.75 : 1)
            .offset(configuration.isPressed ? offset : .zero)
            .scaleEffect(configuration.isPressed ? scaleAmount : 1)
            .animation(.spring(response: springResponse),
                       value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == OffsettableShrinkButtonStyle {
    static var offsettableShrinkButtonStyle: Self {
        return .init()
    }
}
