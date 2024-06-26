//
// CloseButton.swift
// Foncii
//
// Created by Justin Cook on 6/16/23 at 1:26 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct CloseButton: View {
    // MARK: - Properties
    // Styling
    var style: StyledCircularUtilityButton.Style = .plain

    // Actions
    /// Executes the custom 'Closing' logic specified within this closure
    var closeAction: (() -> Void)
    
    // Xmark / Close Button Image
    var closeIcon: Image = Icons
        .getIconImage(named: .close_xmark)
 
    var body: some View {
        StyledCircularUtilityButton(
            style: style,
            action: closeAction,
            icon: closeIcon
        )
    }
}

struct CloseButton_Previews: PreviewProvider {
    static var previews: some View {
        GeometryReader { geom in
            VStack {
                CloseButton(style: .encased,
                            closeAction: {})
            }
            .frame(width: geom.size.width,
                   height: geom.size.height)
            .background(Colors.black_1)
        }
    }
}
