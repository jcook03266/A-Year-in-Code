//
//  Images.swift
//  Foncii
//
//  Created by Justin Cook on 2/9/23.
//

import UIKit
import SwiftUI

/// Image / icon selector for picking out all enumerated images stored in the corresponding Images xcassets file
/// Please update the appropriate enumerations whenever an image is added or removed from the xcassets
// MARK: - Selectors
struct Images {
    static func getImage(named imageName: ImageRepository) -> Image {
        return Image(uiImage: getUIImage(named: imageName))
    }
    
    static func getUIImage(named imageName: ImageRepository) -> UIImage {
        guard let image = UIImage(named: imageName.rawValue)
        else {
            ErrorCodeDispatcher
                .ResourceErrors
                .triggerPreconditionFailure(for: .imageNotFound,
                                            using: "Error: The image named \(imageName) was not found, Function: \(#function)")()
        }
        
        return image
    }
}

/// Use this struct to select custom or system icons
struct Icons {
    static func getIconImage(named customName: CustomIconRepository,
                             renderingMode: Image.TemplateRenderingMode = .template) -> Image {
        return Image(uiImage: getIconUIImage(named: customName))
            .renderingMode(renderingMode)
    }
    
    static func getIconUIImage(named customName: CustomIconRepository,
                               renderingMode: UIImage.RenderingMode = .alwaysTemplate) -> UIImage {
        guard let image = UIImage(named: customName.rawValue)
        else {
            ErrorCodeDispatcher
                .ResourceErrors
                .triggerPreconditionFailure(for: .imageNotFound,
                                            using: "Error: The custom icon named \(customName) was not found, Function: \(#function)")()
        }
        
        image.withRenderingMode(renderingMode)
        
        return image
    }
    
    static func getIconImage(named systemName: SystemIconRepository,
                             renderingMode: Image.TemplateRenderingMode = .template) -> Image {
        
        return Image(systemName: systemName.rawValue)
            .renderingMode(renderingMode)
    }
    
    static func getIconUIImage(named systemName: SystemIconRepository,
                               renderingMode: UIImage.RenderingMode = .alwaysTemplate) -> UIImage {
        guard let image = UIImage(systemName: systemName.rawValue)
        else {
            ErrorCodeDispatcher
                .ResourceErrors
                .triggerPreconditionFailure(for: .imageNotFound,
                                            using: "Error: The system icon named \(systemName) was not found, Function: \(#function)")()
        }
        
        image.withRenderingMode(renderingMode)
        
        return image
    }
}

/// Use this struct to select art assets for certain scenes
struct ArtAssets {
    static func getArtAssetImage(named customName: ArtAssetRepository,
                                 renderingMode: Image.TemplateRenderingMode = .template) -> Image {
        return Image(uiImage: getArtAssetUIImage(named: customName))
            .renderingMode(renderingMode)
    }
    
    static func getArtAssetUIImage(named customName: ArtAssetRepository,
                                   renderingMode: UIImage.RenderingMode = .alwaysTemplate) -> UIImage {
        guard let image = UIImage(named: customName.rawValue)
        else {
            ErrorCodeDispatcher
                .ResourceErrors
                .triggerPreconditionFailure(for: .imageNotFound,
                                            using: "Error: The art asset named \(customName) was not found, Function: \(#function)")()
        }
        
        image.withRenderingMode(renderingMode)
        
        return image
    }
}

// MARK: - Custom Images
enum ImageRepository: String, CaseIterable {
    // Main App Icon
    case appIcon = "AppIcon",
         // Foncii Logos | Mascot
         foncii_logo_mascot_accent_transparent,
         foncii_logo_mascot_white_transparent,
         // Foncii Logos | Text Branding
         foncii_logo_text_accent_transparent,
         foncii_logo_text_white_transparent,
         // Company Logos
         apple_logo,
         facebook_logo,
         google_logo,
         twitter_logo,
         yelp_logo
}

// MARK: - Art Assets
/// Separated because they're specific to certain scenes and would clutter up the main image repository
enum ArtAssetRepository: String, CaseIterable {
    // MARK: - Opening Screen
    case opening_screen_bottom_background,
         opening_screen_top_background,
         confirmation_screen_mascot,
         confirmation_screen_mascot_ring,
         location_screen_art
}

// MARK: - Custom Icons
enum CustomIconRepository: String, CaseIterable {
    // Close
    case close_xmark,
         // Favorite
         heart_favorite_filled,
         heart_favorite_unfilled,
         // Navigation
         back_chevron,
         forward_chevron,
         // Placeholders | User Profile
         user_profile_placeholder,
         // Restaurant Hero | For Restaurants w/o Heros
         restaurant_hero_placeholder,
         // Restaurants
         clock_watch_later,
         filled_radio_indicator,
         globe,
         open_table,
         phone,
         radio_outline,
         star_filled,
         star_unfilled,
         uber,
         // Reviews
         facebook_review_logo,
         instagram_review_logo,
         twitter_review_logo,
         // Tabbar / Other
         home_selected,
         home,
         map_marker_outline_pinhole,
         map_marker_outline,
         map_marker_selected,
         map_marker,
         user,
         // User Interaction
         calendar,
         search,
         share,
         thumbs_up,
         // Utility
         taste_profile_cutlery,
         help_safety_buoy,
         lock,
         mail,
         notification_bell,
         qr_code,
         request,
         send,
         settings_gear,
         // Validation
         checkmark,
         invalid_xmark_red,
         valid_checkmark_green
}

// MARK: - System Icons
enum SystemIconRepository: String, CaseIterable {
    case xmark
    case eye_slash = "eye.slash"
    case eye
    // List Format Toggling
    case line_3_horizontal = "line.3.horizontal"
    case square_grid_2x2_fill = "square.grid.2x2.fill"
}
