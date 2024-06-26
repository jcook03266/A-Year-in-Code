//
//  Colors.swift
//  Foncii
//
//  Created by Justin Cook on 2/9/23.
//

import Foundation
import SwiftUI
import UIKit

/// Simplified and organized way of referencing the colors stored in the Colors assets directory.
/// Note: If a new color is added, update the respective test in ResourcesTests.swift
struct Colors {
    // MARK: - Colors
    // UI Colors
    static func getUIColor(named colorName: ColorRepository) -> UIColor {
        guard let uiColor = UIColor(named: colorName.rawValue)
        else {
            ErrorCodeDispatcher
                .ResourceErrors
                .triggerPreconditionFailure(for: .colorNotFound,
                                            using: "Error: The color named \(colorName) was not found, Function: \(#function)")()
        }
        
        return uiColor
    }
    
    static func getUIColors(named colors: [ColorRepository]) -> [UIColor] {
        var uiColors: [UIColor] = []
        
        for color in colors {
            guard let uiColor = UIColor(named: color.rawValue)
            else {
                ErrorCodeDispatcher
                    .ResourceErrors
                    .triggerPreconditionFailure(for: .colorNotFound,
                                                using: "Error: The color named \(color.rawValue) could not found, Function: \(#function)")()
            }
            
            uiColors.append(uiColor)
        }
        
        return uiColors
    }
    
    static func getUIColorTuple(from colors: (ColorRepository, ColorRepository)) -> (UIColor, UIColor) {
        let colorArray = getUIColors(named: [ColorRepository](mirrorChildValuesOf: colors))
        
        guard colorArray.count == 2
        else {
            ErrorCodeDispatcher
                .SwiftErrors
                .triggerPreconditionFailure(for: .indexOutOfBounds,
                                            using: "Collection: \(Mirror(reflecting: colorArray).description) \(#function) \(#file)")()
        }
        
        return (colorArray[0], colorArray[1])
    }
    
    // SwiftUI Colors
    static func getColors(named colors: [ColorRepository]) -> [Color] {
        return getUIColors(named: colors).compactMap { Color($0) }
    }
    
    static func getColor(named colorName: ColorRepository) -> Color {
        return Color(getUIColor(named: colorName))
    }
    
    static func getColorTuple(from colors: (ColorRepository, ColorRepository)) -> (Color, Color) {
        let colorArray = getColors(named: [ColorRepository](mirrorChildValuesOf: colors))
        
        guard colorArray.count == 2
        else {
            ErrorCodeDispatcher
                .SwiftErrors
                .triggerPreconditionFailure(for: .indexOutOfBounds,
                                            using: "Collection: \(Mirror(reflecting: colorArray).description) \(#function) \(#file)")()
        }
        
        return (colorArray[0], colorArray[1])
    }
    
    // MARK: - Color Literals
    // Main: [#EB5757]
    /// Note: [#EB5757] is used for icons' active state
    static var primary_1: Color {
        return getColor(named: .primary_1)
    }
    
    static var primary_2: Color {
        return getColor(named: .primary_2)
    }
    
    static var primary_3: Color {
        return getColor(named: .primary_3)
    }
    
    static var primary_4: Color {
        return getColor(named: .primary_4)
    }
    
    // Neutral: [#A4A8B7] | Medium: [#697086]
    /// Note: [#697086] is used for icons' inactive state
    /// [#A4A8B7]
    static var neutral_1: Color {
        return getColor(named: .netural_1)
    }
    
    static var neutral_2: Color {
        return getColor(named: .netural_2)
    }
    
    static var neutral_3: Color {
        return getColor(named: .netural_3)
    }
    
    /// [#697086]
    static var medium_1: Color {
        return getColor(named: .medium_1)
    }
    
    static var medium_2: Color {
        return getColor(named: .medium_2)
    }
    
    static var medium_3: Color {
        return getColor(named: .medium_3)
    }
    
    // Black: [#191D2C]  |  Medium Dark Grey: [#2F3447]  | Dark Grey: [#1E2334] | Shadow: [System-Black: 20% opacity]
    /// [#191D2C]
    static var black_1: Color {
        return getColor(named: .black_1)
    }
    
    static var black_2: Color {
        return getColor(named: .black_2)
    }
    
    static var black_3: Color {
        return getColor(named: .black_3)
    }
    
    /// [#2F3447]
    static var medium_dark_grey_1: Color {
        return getColor(named: .medium_dark_grey_1)
    }
    
    static var medium_dark_grey_2: Color {
        return getColor(named: .medium_dark_grey_2)
    }
    
    static var medium_dark_grey_3: Color {
        return getColor(named: .medium_dark_grey_3)
    }
    
    /// [#1E2334]
    static var dark_grey_1: Color {
        return getColor(named: .dark_grey_1)
    }
    
    static var dark_grey_2: Color {
        return getColor(named: .dark_grey_2)
    }
    
    static var dark_grey_3: Color {
        return getColor(named: .dark_grey_3)
    }
    
    /// [System-Black: 20% opacity]
    static var shadow: Color {
        return getColor(named: .shadow)
    }
    
    // MARK: - Supplementary Colors
    static var system_black: Color {
        return getColor(named: .system_black)
    }
    
    static var permanent_black: Color {
        return getColor(named: .permanent_black)
    }
    
    static var system_white: Color {
        return getColor(named: .system_white)
    }
    
    static var permanent_white: Color {
        return getColor(named: .permanent_white)
    }
    
    static var invalid_red: Color {
        return getColor(named: .invalid_red)
    }
    
    static var invalid_input_red: Color {
        return getColor(named: .invalid_input_red)
    }
    
    static var valid_green: Color {
        return getColor(named: .valid_green)
    }
    
    /// Applicable to this icon: https://www.figma.com/file/dxq8XnrUBPYBwkJmgHpTCz/Foncii-HiFi_v7?node-id=2322%3A7728&t=nnlhGgMBsSEqXHyQ-0
    static var icon_gray_opaque_1: Color {
        return getColor(named: .icon_gray_opaque_1)
    }
    
    /// Applicable to this icon: https://www.figma.com/file/dxq8XnrUBPYBwkJmgHpTCz/Foncii-HiFi_v7?node-id=2307%3A11636&t=jlefuleQdVQmd1n8-0
    static var icon_gray_opaque_2: Color {
        return getColor(named: .icon_gray_opaque_2)
    }
    
    // MARK: - Gradients
    static func getLinearGradient(named gradientName: GradientRepository) -> LinearGradient {
        switch gradientName {
        case .profileProgressBarGradient:
            let color1 = Color(red: 235/255, green: 87/255, blue: 87/255),
                color2 = Color(red: 245/255, green: 163/255, blue: 140/255),
                color3 = Color(red: 255/255, green: 243/255, blue: 195/255),
                startPoint = UnitPoint(x: 0.25, y: 0.5),
                endPoint = UnitPoint(x: 0.75, y: 0.5),
                colorStop1 = Gradient.Stop(color: color1, location: 0.2),
                colorStop2 = Gradient.Stop(color: color2, location: 0.41),
                colorStop3 = Gradient.Stop(color: color3, location: 0.75),
                colorStops = [colorStop1, colorStop2, colorStop3]
            
            return LinearGradient(stops: colorStops,
                                  startPoint: startPoint,
                                  endPoint: endPoint)
            
        /// Reference: https://www.figma.com/file/dxq8XnrUBPYBwkJmgHpTCz/Foncii-HiFi_v7?node-id=2636%3A14375&t=uAjCjzJRTeJSSmYv-0
        case .restaurantHeroOverlayGradient:
            let color1 = Color(red: 0/255, green: 0/255, blue: 0/255,
                               opacity: 0),
                color2 = Color(red: 0/255, green: 0/255, blue: 0/255,
                               opacity: 0.96),
                startPoint = UnitPoint(x: 0.49999996456317697, y: 8.881780689755455e-16),
                endPoint = UnitPoint(x: 0.5000000241678184, y: 2.3781249342203967)
            
            return LinearGradient(colors: [color1, color2],
                                  startPoint: startPoint,
                                  endPoint: endPoint)
            
        case .openingScreenGradient:
            let color1 = Color(red: 0.1, green: 0.11, blue: 0.17,
                               opacity: 1),
                color2 = Color(red: 0.09, green: 0.1, blue: 0.13,
                               opacity: 1),
                startPoint = UnitPoint(x: 0.25, y: 0.5),
                endPoint = UnitPoint(x: 0.75, y: 0.5),
                colorStop1 = Gradient.Stop(color: color1, location: 0),
                colorStop2 = Gradient.Stop(color: color2, location: 1),
                colorStops = [colorStop1, colorStop2]
            
            return LinearGradient(stops: colorStops,
                                  startPoint: startPoint,
                                  endPoint: endPoint)
        }
    }
    
    // MARK: - Gradient Literals
    static var profileProgressBarGradient: LinearGradient {
        return getLinearGradient(named: .profileProgressBarGradient)
    }
    
    static var restaurantHeroOverlayGradient: LinearGradient {
        return getLinearGradient(named: .restaurantHeroOverlayGradient)
    }
    
    static var openingScreenGradient: LinearGradient {
        return getLinearGradient(named: .openingScreenGradient)
    }
}

// MARK: All Supported Design System Colors / Supplementary Colors / Gradients
// Colors
enum ColorRepository: String, CaseIterable {
    case primary_1, primary_2, primary_3, primary_4,
         medium_1, medium_2, medium_3,
         netural_1, netural_2, netural_3,
         black_1, black_2, black_3,
         medium_dark_grey_1, medium_dark_grey_2, medium_dark_grey_3,
         dark_grey_1, dark_grey_2, dark_grey_3,
         shadow,
         system_black, permanent_black,
         system_white, permanent_white,
         invalid_red, valid_green, invalid_input_red,
         icon_gray_opaque_1, icon_gray_opaque_2
}

// Gradients
enum GradientRepository: String, CaseIterable {
    case profileProgressBarGradient
    case restaurantHeroOverlayGradient
    case openingScreenGradient
}

