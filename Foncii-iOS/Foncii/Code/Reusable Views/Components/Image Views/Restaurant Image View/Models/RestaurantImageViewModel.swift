//
// RestaurantImageViewModel.swift
// Foncii
//
// Created by Justin Cook on 4/29/23 at 11:13 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

class RestaurantImageViewModel: GenericViewModel {
    // MARK: - Published
    @Published var image: Image?
    /// Used to determine the current state of the async loading of the specified image asset
    @Published var isLoading: Bool = true
    
    // MARK: - Properties
    let imageURLString: String
    
    /// Placeholder fallback image for when an image fails to load properly
    private var placeholderImage: Image {
        return Icons.getIconImage(named: .restaurant_hero_placeholder)
    }
    
    /// Safely unwrap the image URL
    /// If the URL is invalid then a placeholder is displayed instead
    var imageURL: URL? {
        return imageURLString.asURL
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let imageDownloaderService: ImageDownloaderService = inject()
    }
    let dependencies = Dependencies()
    
    // MARK: - Dimensions
    let imageSize: ImageSizes
    
    // MARK: - Styling
    // Colors
    let shimmerViewColor: Color = Colors.neutral_1
    
    init(
        imageURLString: String,
        imageSize: ImageSizes,
        preloadedImage: Image? = nil
    ) {
        self.imageURLString = imageURLString
        self.imageSize = imageSize
        
        if let preloadedImage = preloadedImage {
            self.image = preloadedImage
            self.isLoading = false
        }
        else {
            fetchImage()
        }
    }
    
    // MARK: - Image Logic
    /// Various supported image sizes used for restaurant specific images around the application
    /// Note: The width isn't used, only the height, this allows for dynamic sizing of the images to fit parent containers
    enum ImageSizes: String, CaseIterable {
        case small, // WxH: 100x100 - Select Favorites, Send Recommendations
             medium, // WxH: 100x118 - Trending
             mediumChip,// WxH 160x140 - Detail View / Photos
             large, // WxH: 160x160 - FYP
             broad, // WxH: 204 x 88 - Map
            largeChip, // WxH 335 x 185 - Detail View / Photos
            hero, // WxH: 375x284 - Detail View
            none // Unbounded size, control from the view in which this view is embedded within
        
        func getSize() -> CGSize {
            var size: CGSize
            
            switch self {
            case .small:
                size = .init(width: 100, height: 100)
            case .medium:
                size = .init(width: 100, height: 118)
            case .mediumChip:
                size = .init(width: 160, height: 140)
            case .large:
                size = .init(width: 160, height: 160)
            case .broad:
                size = .init(width: 204, height: 88)
            case .largeChip:
                size = .init(width: 335, height: 185)
            case .hero:
                size = .init(width: 375, height: 284)
            case .none:
                size = .zero
            }
            
            return size
        }
    }

    /**
     * Asynchronously fetches and parses the image data specified by the image URL passed to this model
     * Note: This function also allows the image to be cached in the file manager for later use
     */
    private func fetchImage() {
        guard let imageURL = imageURL
        else { return }
        
        Task { @MainActor in
            let fetchedImage = await dependencies
                .imageDownloaderService.getImage(for: imageURL)
            
            /// Fall back to placeholder if the fetched image can't be downloaded
            guard let fetchedImage = fetchedImage
            else {
                self.image = self.placeholderImage
                self.isLoading = false
                
                return
            }
            
            self.image = Image(uiImage: fetchedImage)
            self.isLoading = false
        }
    }
}
