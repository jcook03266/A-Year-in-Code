//
// Animations.swift
// Foncii
//
// Created by Justin Cook on 5/20/23 at 6:12 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import UIKit
import Lottie

// Simplified accessor for accessing supported animation JSON files in a controlled manner
struct LottieAnimations {
    static func getAnimation(named animationName: LottieAnimationRepository) -> LottieAnimation {
        guard let animation = LottieAnimation.named(animationName.rawValue) else {
            ErrorCodeDispatcher
                .ResourceErrors
                .triggerPreconditionFailure(for: .lottieAnimationNotFound,
                                            using: "The lottie animation JSON file named \(animationName) was not found, Function: \(#function)")()
        }
        
        return animation
    }
    
    static var globe_spin_animation: LottieAnimation {
        return getAnimation(named: .globe_spin_animation)
    }
}

// MARK: - Animation JSON File Enumerations
// Please update this repo whenever any new animations are added
enum LottieAnimationRepository: String, CaseIterable {
    case globe_spin_animation
}


