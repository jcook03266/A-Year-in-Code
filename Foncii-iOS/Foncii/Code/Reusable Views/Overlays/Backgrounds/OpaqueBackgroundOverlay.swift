//
// OpaqueBackgroundOverlay.swift
// Foncii
//
// Created by Justin Cook on 5/23/23 at 1:06 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

/// A tinted and transparent overlay to display on top of background content when
/// displaying some modal view such as a confirmation dialog
struct OpaqueBackgroundOverlay: View {
    // MARK: - Properties
    var backgroundColor: Color = .black,
        opacity: CGFloat = 0.75
    
    var body: some View {
        ZStack {
            backgroundColor
                .opacity(opacity)
                .edgesIgnoringSafeArea(.all)
        }
    }
}

struct OpaqueBackgroundOverlay_Previews: PreviewProvider {
    static var previews: some View {
        OpaqueBackgroundOverlay()
    }
}
