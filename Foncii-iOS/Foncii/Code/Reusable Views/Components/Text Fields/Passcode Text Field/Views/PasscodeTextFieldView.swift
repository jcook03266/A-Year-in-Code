//
// PasscodeTextFieldView.swift
// Foncii
//
// Created by Justin Cook on 4/7/23 at 5:48 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct PasscodeTextFieldView: View {
    // MARK: - Observed
    @StateObject var model: PasscodeTextFieldViewModel
    
    // MARK: - Spacing
    var textfieldSpacing: CGFloat = 14
    
    var body: some View {
        VStack {
            mainSection
        }
    }
}

// MARK: - Sections
extension PasscodeTextFieldView {
    var mainSection: some View {
        segmentedTextFields
            .animation(.easeInOut,
                       value: model.currentlyFocusedTextField?.id)
    }
}

// MARK: - Subviews
extension PasscodeTextFieldView {
    var segmentedTextFields: some View {
        HStack(alignment: .center,
               spacing: textfieldSpacing) {
            
            ForEach(model.segmentedTextFields,
                    id: \.id) { textFieldModel in
                SegmentedTextFieldView(model: textFieldModel)
            }
        }
    }
}

struct PasscodeTextFieldView_Previews: PreviewProvider {
    static var previews: some View {
        PasscodeTextFieldView(model: .init())
    }
}
