//
//  KeyboardToolbarViewModifier.swift
//  Foncii
//
//  Created by Justin Cook on 3/4/23.
//

import SwiftUI

struct KeyboardToolbarViewModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .toolbar {
                // Right aligns the done button
                ToolbarItem(id: "Spacer",
                            placement: .keyboard) {
                    Spacer()
                }
                
                // Done button above the keyboard that allows the user to dismiss the keyboard at any time
                ToolbarItem(placement: .keyboard) {
                    ToolbarDoneButton()
                }
            }
    }
}

extension View {
    func toggleKeyboardDoneButton() -> some View {
        modifier(KeyboardToolbarViewModifier())
    }
}
