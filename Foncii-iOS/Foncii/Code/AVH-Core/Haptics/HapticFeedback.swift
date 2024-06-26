//
//  HapticFeedback.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import CoreHaptics
import UIKit

/// Dispatcher that dispatches specific preconfigured bursts of haptic feedback to further enhance UX
struct HapticFeedbackDispatcher {
    static func gentleButtonPress() {
        Impacts.generateImpact(with: .soft, intensity: 0.45)
    }
    
    static func tabbarButtonPress() {
        Impacts.generateImpact(with: .soft, intensity: 0.5)
    }
    
    static func arrowButtonPress() {
        Impacts.generateImpact(with: .light, intensity: 0.8)
    }
    
    static func backButtonPress() {
        Impacts.generateImpact(with: .light, intensity: 0.75)
    }
    
    static func radioButtonPress() {
        Impacts.generateImpact(with: .light, intensity: 0.9)
    }
    
    static func utilityButtonPress() {
        Impacts.generateImpact(with: .light, intensity: 1)
    }
    
    static func interstitialCTAButtonPress() {
        Impacts.generateImpact(with: .medium, intensity: 0.9)
    }
    
    static func CTAButtonPress() {
        Impacts.generateImpact(with: .medium, intensity: 0.8)
    }
    
    static func textSectionExpanded() {
        Impacts.generateImpact(with: .light, intensity: 0.5)
    }
    
    static func textFieldPressed() {
        Impacts.generateImpact(with: .light, intensity: 0.35)
    }
    
    static func textFieldInFieldButtonPressed() {
        Impacts.generateImpact(with: .light, intensity: 0.3)
    }
    
    static func genericButtonPress() {
        Impacts.generateImpact(with: .light, intensity: 0.6)
    }
    
    static func eventBannerTapped() {
        Impacts.generateImpact(with: .light, intensity: 1)
    }
    
    static func bottomSheetPresented() {
        Impacts.generateImpact(with: .medium, intensity: 0.4)
    }
    
    static func fullScreenCoverDismissed() {
        Impacts.generateImpact(with: .light, intensity: 1)
    }
    
    static func keyPadButtonPressed() {
        Impacts.generateImpact(with: .soft, intensity: 1)
    }
    
    static func warningDidOccur() {
        Notifications.generateImpact(for: .warning)
    }
    
    static func detailChipSelected() {
        Impacts.generateImpact(with: .light, intensity: 0.8)
    }
    
    static func navigationTransition() {
        Impacts.generateImpact(with: .medium, intensity: 0.5)
    }
    
    struct Impacts {}
    struct Notifications {}
}

private extension HapticFeedbackDispatcher.Notifications {
    static func generateImpact(for notification: UINotificationFeedbackGenerator.FeedbackType)
    {
        let generator = UINotificationFeedbackGenerator()
        
        generator.prepare()
        generator.notificationOccurred(notification)
    }
}

private extension HapticFeedbackDispatcher.Impacts {
    /// Impact with specific style and intensity from 0 - 1
    static func generateImpact(with style: UIImpactFeedbackGenerator.FeedbackStyle, intensity: CGFloat) {
        let generator = UIImpactFeedbackGenerator(style: style)
    
        generator.prepare()
        generator.impactOccurred(intensity: intensity)
    }
}
