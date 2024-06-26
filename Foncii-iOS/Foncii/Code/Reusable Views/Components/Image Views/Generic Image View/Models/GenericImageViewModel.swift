//
// GenericImageViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/29/23 at 10:07 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

class GenericImageViewModel: GenericViewModel {
    // MARK: - Published
    @Published var image: Image?
    /// Used to determine the current state of the async loading of the specified image asset
    @Published var isLoading: Bool = true
    
    // MARK: - Properties
    let imageURLString: String
    
    /// Placeholder fallback image for when an image fails to load properly
    private var placeholderImage: Image
    
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
    
    // MARK: - Styling
    // Colors
    let shimmerViewColor: Color = Colors.neutral_1
    
    init(
        imageURLString: String,
        placeholderImage: Image
    ) {
        self.imageURLString = imageURLString
        self.placeholderImage = placeholderImage
        
        fetchImage()
    }
    
    // MARK: - Image Logic
    /**
     * Asynchronously fetches and parses the image data specified by the image URL passed to this model
     * Note: This function also allows the image to be cached in the file manager for later use
     */
    private func fetchImage() {
        guard let imageURL = imageURL
        else { return }
        
        Task { @MainActor in
            let fetchedImage = await dependencies
                .imageDownloaderService
                .getImage(for: imageURL)
            
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
