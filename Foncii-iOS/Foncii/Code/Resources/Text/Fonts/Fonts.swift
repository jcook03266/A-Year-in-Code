//
//  Fonts.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import Foundation
import UIKit
import SwiftUI

/// Struct for easily accessing enumerated font types for specific text styles
/// Testing is required for this because a custom font is used, tests located in ResourcesTests.swift
struct Fonts {
    static func getLatoFont(named fontStyle: FontStyleRepository) -> Font {
        return Font(getLatoUIFont(named: fontStyle))
    }
    
    static func getLatoFont(named fontStyle: FontStyleRepository,
                            with weight: UIFont.Weight) -> Font
    {
        return Font(getLatoUIFont(named: fontStyle,
                                  with: weight))
    }
    
    static func getLatoFont(named fontStyle: FontStyleRepository,
                            with weight: UIFont.Weight,
                            size: CGFloat) -> Font
    {
        return Font(getLatoUIFont(named: fontStyle,
                                  with: weight,
                                  size: size))
    }
    
    /// Used pre-defined attributes for the font style, but you can specify italics preference
    static func getLatoUIFont(named fontStyle: FontStyleRepository,
                              italicized: Bool = false) -> UIFont
    {
        let attributes = getAttributes(for: fontStyle),
            size = attributes.0,
            weight = attributes.2,
            latoFontStyle = getLatoFontStyle(for: weight,
                                             italicized: italicized)
        
        guard let latoFont = UIFont(name: latoFontStyle.rawValue,
                                    size: size)
        else {
            ErrorCodeDispatcher
                .ResourceErrors
                .triggerPreconditionFailure(for: .customFontStyleNotFound,
                                            using: "Error: The font style named \(latoFontStyle) could not be found, Function: \(#function)")()
        }
        
        return latoFont
    }
    
    /** Polymorphism for specifying a custom weight for a given font name*/
    static func getLatoUIFont(named fontStyle: FontStyleRepository,
                              with weight: UIFont.Weight,
                              italicized: Bool = false) -> UIFont
    {
        let attributes = getAttributes(for: fontStyle),
            size = attributes.0,
            latoFontStyle = getLatoFontStyle(for: weight,
                                             italicized: italicized)
        
        guard let latoFont = UIFont(name: latoFontStyle.rawValue,
                                    size: size)
        else {
            ErrorCodeDispatcher
                .ResourceErrors
                .triggerPreconditionFailure(for: .customFontStyleNotFound,
                                            using: "Error: The font style named \(latoFontStyle) could not be found, Function: \(#function)")()
        }
        
        return latoFont
    }
    
    /// Specify font name, weight, size, and italics preference
    static func getLatoUIFont(named fontStyle: FontStyleRepository,
                              with weight: UIFont.Weight,
                              size: CGFloat,
                              italicized: Bool = false) -> UIFont
    {
        let latoFontStyle = getLatoFontStyle(for: weight,
                                             italicized: italicized)
        
        guard let latoFont = UIFont(name: latoFontStyle.rawValue,
                                    size: size)
        else {
            ErrorCodeDispatcher
                .ResourceErrors
                .triggerPreconditionFailure(for: .customFontStyleNotFound,
                                            using: "Error: The font style named \(latoFontStyle) could not be found, Function: \(#function)")()
        }
        
        return latoFont
    }
    
    /// Maps lato font styles to font weights and italics preference
    static func getLatoFontStyle(for weight: UIFont.Weight,
                                 italicized: Bool = false) -> LatoFontStyles
    {
        switch (weight, italicized) {
            // Not Italicized
        case (.regular, false):
            return .lato_regular
        case (.medium, false):
            return .lato_medium
        case (.semibold, false):
            return .lato_semibold
        case (.black, false):
            return .lato_black
        case (.bold, false):
            return .lato_bold
        case (.light, false):
            return .lato_light
        case (.thin, false):
            return .lato_thin
            
            // Italicized
        case (.regular, true):
            return .lato_italic
        case (.bold, true):
            return .lato_bold_italic
        case (.black, true):
            return .lato_black_italic
        case (.light, true):
            return .lato_light_italic
        case (.thin, true):
            return .lato_thin_italic
        default:
            return .lato_regular
        }
    }
    
    /// Note: Line height can't be explicitly set for UIFonts, so they must be used via Font modifiers or modification of labels
    /// Letter spacing must be used w/ attributed strings for UIFonts, Fonts use it normally via modifier
    /// Since letter spacing isn't specified in this design system it won't be considered within this attribute getter
    /** - Returns: (Font Size, LineHeight, Font Weight)*/
    static func getAttributes(for fontStyle: FontStyleRepository) -> (CGFloat, CGFloat, UIFont.Weight) {
        switch fontStyle {
        case .heading_1:
            return (28, 36, .bold)
        case .heading_2:
            return (24, 32, .medium)
        case .heading_3:
            return (20, 26, .medium)
        case .subtitle:
            return (16, 24, .regular)
        case .subtitle_2:
            return (12, 24, .regular)
        case .body:
            return (15, 22, .regular)
        case .caption:
            return (14, 20, .regular)
        case .caption_2:
            return (10, 20, .regular)
        case .heading_2_bold:
            return (24, 32, .bold)
        case .heading_3_bold:
            return (20, 26, .bold)
        case .subtitle_bold:
            return (16, 24, .bold)
        case .subtitle_2_bold:
            return (12, 24, .bold)
        case .body_bold:
            return (15, 22, .bold)
        case .caption_bold:
            return (14, 20, .bold)
        case .caption_2_bold:
            return (10, 20, .regular)
        }
    }
}


// MARK: Supported Design-System Font Styles
enum FontStyleRepository: String, CaseIterable {
    // Regular
    case heading_1, heading_2, heading_3, subtitle, subtitle_2, body, caption, caption_2,
         // Bold
         heading_2_bold, heading_3_bold, subtitle_bold, subtitle_2_bold, body_bold, caption_bold, caption_2_bold
}

// MARK: - Custom Fonts
// Lato
enum LatoFontStyles: String, CaseIterable {
    case lato_black = "Lato-Black",
         lato_black_italic = "Lato-BlackItalic",
         lato_bold = "Lato-Bold",
         lato_bold_italic = "Lato-BoldItalic",
         lato_italic = "Lato-Italic",
         lato_light = "Lato-Light",
         lato_light_italic = "Lato-LightItalic",
         lato_medium = "Lato-Medium",
         lato_regular = "Lato-Regular",
         lato_semibold = "Lato-SemiBold",
         lato_thin = "Lato-Thin",
         lato_thin_italic = "Lato-ThinItalic"
}

// MARK: - Structs and extensions
/// SwiftUI Font view modifier, makes using specific fonts easier in SwiftUI
extension View {
    func fontWithLineHeight(font: UIFont, lineHeight: CGFloat) -> some View {
        ModifiedContent(content: self, modifier: FontWithLineHeight(font: font,
                                                                    lineHeight: lineHeight))
    }
    
    func withFont(_ fontName: FontStyleRepository) -> some View {
        let attributes = Fonts.getAttributes(for: fontName),
            font = Fonts.getLatoUIFont(named: fontName)
        
        return ModifiedContent(content: self, modifier: FontModifier(font: font,
                                                                     lineHeight: attributes.1))
    }
    
    func withFont(_ fontName: FontStyleRepository,
                  weight: UIFont.Weight) -> some View {
        let attributes = Fonts.getAttributes(for: fontName),
            font = Fonts.getLatoUIFont(named: fontName,
                                       with: weight)
        
        return ModifiedContent(content: self, modifier: FontModifier(font: font,
                                                                     lineHeight: attributes.1))
    }
}

private struct FontModifier: ViewModifier {
    let font: UIFont,
        lineHeight: CGFloat
    
    func body(content: Content) -> some View {
        content
            .font(Font(font))
            .fontWithLineHeight(font: font, lineHeight: lineHeight)
    }
}

private struct FontWithLineHeight: ViewModifier {
    let font: UIFont
    let lineHeight: CGFloat
    
    func body(content: Content) -> some View {
        content
            .font(Font(font))
            .lineSpacing(lineHeight - font.lineHeight)
            .padding(.vertical, (lineHeight - font.lineHeight) / 2)
    }
}

// MARK: - String Extensions
/** Best suited for use with UIKit, use this whenever because UIFonts don't support the extra attributes enabled by the attributed String object*/
extension String {
    func getAttributedString(for font: FontStyleRepository) -> NSAttributedString
    {
        let attributedString = NSMutableAttributedString(string: self)
        
        guard !self.isEmpty else { return attributedString}
        
        let fontAttributes = Fonts.getAttributes(for: font),
            style = NSMutableParagraphStyle(),
            font = fontAttributes.0,
            lineHeight = fontAttributes.1,
            range = NSRange(location: 0, length: self.count)
        
        var attributes = [NSAttributedString.Key: Any]()
        
        style.lineSpacing = lineHeight
        attributes[.font] = font
        attributes[.paragraphStyle] =  style
        ///attributes[.tracking] = letterSpacing
        
        attributedString.addAttributes(attributes, range: range)
        
        return attributedString
    }
}
