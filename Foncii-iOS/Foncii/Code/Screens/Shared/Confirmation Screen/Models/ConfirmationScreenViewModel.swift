//
//  ConfirmationScreenViewModel.swift
//  Foncii
//
//  Created by Justin Cook on 2/19/23.
//

import SwiftUI

class ConfirmationScreenViewModel<coordinatorType: Coordinator>: CoordinatedGenericViewModel {
    typealias coordinator = coordinatorType
    
    // MARK: - Properties
    var coordinator: coordinator,
        confirmationMessage: String = "",
        /// Where to navigate to after the animation finishes
        destinationRoute: coordinator.Router.Route? = nil
    
    static var animationDuration: Int {
        return 2
    }
    
    static var didAppearAnimationDelay: Int {
        return 0
    }
    
    /// The total amount of time this screen should be displayed for
    static var totalDuration: Int {
        return animationDuration + didAppearAnimationDelay + 1
    }
    
    // MARK: - Published
    @Published var didAppear: Bool = false
    
    // MARK: - Assets
    let mascotImage: Image = ArtAssets
        .getArtAssetImage(named: .confirmation_screen_mascot),
mascotRingBorderImage: Image = ArtAssets
    .getArtAssetImage(named: .confirmation_screen_mascot_ring)
    
    // MARK: - Styling
    // Colors
    let backgroundColor: Color = Colors.primary_1,
        textColor: Color = Colors.permanent_white,
        imageTintColor: Color = Colors.permanent_white
    
    // Fonts
    let messageFont: FontStyleRepository = .subtitle,
        messageFontWeight: UIFont.Weight = .semibold
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
    }
    
    // MARK: - Animation Functions
    func triggerDidAppearAnimation() {
        DispatchQueue
            .main
            .asyncAfter(deadline: .now() + .seconds(ConfirmationScreenViewModel.didAppearAnimationDelay))
        { [self] in
            didAppear = true
        }
        
        startTransition()
    }
    
    /// Disappear the UI and navigate to the destination view
    func startTransition() {
        DispatchQueue
            .main
            .asyncAfter(deadline: .now() + .seconds(ConfirmationScreenViewModel.animationDuration))
        { [self] in
            didAppear = false
            goToDestinationView()
        }
    }
    
    func goToDestinationView() {
        guard let destinationRoute = destinationRoute
        else { return }
        
        self.coordinator
            .popToView(with: destinationRoute)
    }
}
