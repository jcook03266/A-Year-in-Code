//
//  OpeningScreenViewModel.swift
//  Foncii
//
//  Created by Justin Cook on 2/18/23.
//

import SwiftUI

/// View model for the opening screen, transitions the user to either the login or sign up screens
class OpeningScreenViewModel: CoordinatedGenericViewModel {
    typealias coordinator = OnboardingCoordinator
    
    @Published
    
    // MARK: - Properties
    var coordinator: coordinator
    
    // MARK: - Assets
    /// App logo
    let appLogoTextImage: Image = Images.getImage(named: .foncii_logo_text_accent_transparent),
    /// Background Art
        topBackgroundArt: Image = ArtAssets.getArtAssetImage(named: .opening_screen_top_background),
        bottomBackgroundArt: Image = ArtAssets.getArtAssetImage(named: .opening_screen_bottom_background)
    
    // MARK: - Styling
    // Colors
    let backgroundGradient: LinearGradient = Colors.openingScreenGradient,
        textColor: Color = Colors.permanent_white
    
    // Fonts
    let appSloganTextFont: FontStyleRepository = .caption_bold
    
    // MARK: - Localized Text
    let sloganText: String = LocalizedStrings
        .getLocalizedString(for: .APP_SLOGAN),
loginButtonTitle: String = LocalizedStrings.getLocalizedString(for: .LOG_IN),
signUpButtonTitle: String = LocalizedStrings.getLocalizedString(for: .SIGN_UP)
    
    // MARK: - Actions
    var loginButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .pushView(with: .login)
        }
    }
    
    var signUpButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .pushView(with: .signUp(referralID: nil))
        }
    }
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
    }
}
