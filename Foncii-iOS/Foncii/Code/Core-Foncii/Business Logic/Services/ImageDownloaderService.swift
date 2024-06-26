//
// ImageDownloaderService.swift
// Foncii
//
// Created by Justin Cook on 4/29/23 at 10:26 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Combine

/// Service for downloading and caching images in a simple and reusable manner
class ImageDownloaderService {
    // MARK: - Properties
    /// A fallback static image just in case a restaurant image's URL String is nil
    static let fallbackRestaurantPlaceholder = "https://firebasestorage.googleapis.com/v0/b/foncii-app.appspot.com/o/images%2Fplaceholders%2FrestaurantPlaceholder.png?alt=media&token=8522234d-55f0-46c0-9951-5d6a9c998bc2"
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let networkingService: NetworkingService = inject()
        let imageCacher: ImageCacher = inject()
    }
    let dependencies = Dependencies()
    
    func getImage(for imageResourceURL: URL,
                  canCacheImage: Bool = true) async -> UIImage? {
        let networkingService = dependencies.networkingService
        let imageCacher = dependencies.imageCacher
        let possibleError = ErrorCodeDispatcher
            .NetworkingErrors
            .throwError(for: .imageCouldNotBeDownloaded(endpoint: imageResourceURL))
        
        var image: UIImage? = nil
        
        /// Hit the cache first to see if an image exists for a certain key
        if let cachedImage = imageCacher
            .get(key: imageResourceURL.absoluteString) {
            image = cachedImage
            
            return image
        }
        
        /// Download the image since it hasn't been cached yet
        do {
            let imageData = try await networkingService
                .fetchData(from: imageResourceURL)
            
            guard let parsedImage = UIImage(data: imageData)
            else {
                throw possibleError
            }
            
            image = parsedImage
        } catch {
            ErrorCodeDispatcher
                .NetworkingErrors
                .printErrorCode(for: .badURLResponse(endpoint: imageResourceURL))
        }
        
        /// Save the image to the cache if it exists
        if canCacheImage,
           let image = image {
            imageCacher
                .add(key: imageResourceURL.absoluteString,
                     value: image)
        }
        
        return image
    }
}

