//
//  ResourcesTests.swift
//  FonciiTests
//
//  Created by Justin Cook on 2/10/23.
//

import XCTest
@testable import Foncii

final class ResourcesTests: XCTestCase {
    // MARK: - Precondition Failure Tests
    func testLatoFontSystemExists() {
        let designSystemFontStyles = FontStyleRepository.allCases
        
        for style in designSystemFontStyles {
            // Italicized
            _ = Fonts.getLatoUIFont(named: style)
            
            // Not Italicized
            _ = Fonts.getLatoUIFont(named: style,
                                italicized: true)
        }
    }
    
    func testAllImagesExist() {
        let images = ImageRepository.allCases,
        icons = CustomIconRepository.allCases,
        artAssets = ArtAssetRepository.allCases
        
        // Custom Images
        for image in images {
            _ = Images.getUIImage(named: image)
        }
        
        // Custom Icons
        for icon in icons {
            _ = Icons.getIconUIImage(named: icon)
        }
        
        // Background / Foreground Art Assets
        for artAsset in artAssets {
            _ = ArtAssets.getArtAssetUIImage(named: artAsset)
        }
    }
    
    func testAllColorsExist() {
        _ = Colors.getColors(named: ColorRepository.allCases)
    }
}
