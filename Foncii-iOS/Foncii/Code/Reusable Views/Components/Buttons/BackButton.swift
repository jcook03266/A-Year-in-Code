//
//  BackButton.swift
//  Foncii
//
//  Created by Justin Cook on 2/19/23.
//

import SwiftUI

/// A custom back button used to replace the functionality of the usual back default button displayed by the navigation bar
struct BackButton: View {
    // MARK: - Properties
    // Color
    let tintColor: Color = Colors.medium_1
    
    // Actions
    /// Goes back to the last presented view in the navigation stack when pressed
    var backAction: (() -> Void) = {
        RootCoordinatorDelegate
            .shared
            .activeRootCoordinator
            .popView()
    }
    
    var customBackAction: (() -> Void)? = nil
    
    // Back Button Image
    var backIcon: Image = Icons
        .getIconImage(named: .back_chevron)
    
    // MARK: - Dimensions
    private let size: CGSize = .init(width: 28,
                                     height: 28),
                iconSize: CGSize = .init(width: 14,
                             height: 14)
    
    var body: some View {
        button
    }
}

// MARK: - Subviews
extension BackButton {
    var button: some View {
        Button {
            customBackAction?() ?? backAction()
            HapticFeedbackDispatcher
                .backButtonPress()
        } label: {
            image
        }
        .buttonStyle(.offsettableShrinkButtonStyle)
        .frame(width: size.width,
               height: size.height)
    }
    
    var image: some View {
        backIcon
            .fittedResizableTemplateImageModifier()
            .foregroundColor(tintColor)
            .frame(width: iconSize.width,
                   height: iconSize.height)
    }
}

struct BackButton_Previews: PreviewProvider {
    static var previews: some View {
        BackButton(backAction: {})
    }
}
