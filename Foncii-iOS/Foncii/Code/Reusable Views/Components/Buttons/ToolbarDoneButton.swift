//
//  ToolbarDoneButton.swift
//  Foncii
//
//  Created by Justin Cook on 3/4/23.
//

import SwiftUI

/// A reusable done button to display in a tool bar above a keyboard to dismiss it
struct ToolbarDoneButton: View {
    // MARK: - Properties
    private let textFont: FontStyleRepository = .body,
                title: String = LocalizedStrings
        .getLocalizedString(for: .DONE)
    
    var body: some View {
        VStack(alignment: .trailing) {
            Button {
                hideKeyboard()
            } label: {
                Text(title)
                    .withFont(textFont)
                    .foregroundColor(Color.accentColor)
            }
            .buttonStyle(.genericSpringyShrink)
        }
    }
}
