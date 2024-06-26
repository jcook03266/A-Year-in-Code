//
//  SplashScreenViewModel.swift
//  Foncii
//
//  Created by Justin Cook on 2/12/23.
//

import SwiftUI
import Combine

class SplashScreenViewModel: GenericViewModel {
    // MARK: - Properties
    let launchScreenManager: LaunchScreenManager = .shared
    let transitionAnimationDelay: CGFloat = 2
    
    // MARK: - Published
    @Published var transitionAnimation: Bool = false
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Assets
    let appMascotImage: Image = Images.getImage(named: .foncii_logo_mascot_white_transparent),
        appLogoTextImage: Image = Images.getImage(named: .foncii_logo_text_white_transparent)
    
    // MARK: Styling
    // Colors
    let backgroundColor: Color = Colors.primary_1,
        foregroundColor: Color = Colors.permanent_white,
        textColor: Color = Colors.permanent_white,
        activityIndicatorColor: Color = Colors.permanent_white
    
    var circleMaskColor: Color {
        return transitionAnimation ? Colors.black_1 : Colors.permanent_white
    }
    
    // Fonts
    let appSloganTextFont: FontStyleRepository = .caption_bold
    
    // MARK: - Localized Text
    let appNameText: String = LocalizedStrings
        .getLocalizedString(for: .APP_NAME)
        .localizedUppercase,
sloganText: String = LocalizedStrings
        .getLocalizedString(for: .APP_SLOGAN)
    
    init() {}
    
    /// Triggers the transition animation for the splash screen where the circle mask expands and engulfs the rest of the screen's content
    func triggerTransitionAnimation() {
        launchScreenManager
            .onComplete { [weak self] in
                guard let self = self
                else { return }
                
                Task { @MainActor in
                    try await Task.sleep(until: .now + .seconds(self.transitionAnimationDelay),
                                         clock: .suspending)
                    
                    self.transitionAnimation = true
                }
            }
    }
}
