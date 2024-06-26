//
// ImageCacher.swift
// Foncii
//
// Created by Justin Cook on 4/30/23 at 4:28 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import UIKit

/// A class that allows for downloaded images to be cached in memory for added performance and UX optimization purposes
/// The cache is set to a specific memory limit, and after this limit is reached, the oldest tenants will be evicted from the cache
class ImageCacher {
    // MARK: - Properties
    /// 400MB Cache Size
    var cacheSize: Int = {
        let kilobyte: Int = 1024 // Bytes
        let megabyte: Int = kilobyte * kilobyte // 1024 kB ~ 1 MB
        let desiredSizeInMegabytes: Int = 400
        
        return megabyte * desiredSizeInMegabytes
    }()
    
    let cacheName = "Images"
    let maxCacheSize = 400 // Total Amount of Items regardless of size
    
    // NSCache to store the images in
    var imageCache: NSCache<NSString, UIImage>!
    
    // MARK: - Singleton
    static let shared: ImageCacher = .init()
    
    private init() {
        self.imageCache = createCache()
    }
    
    // MARK: - Cache Logic
    private func createCache() -> NSCache<NSString, UIImage> {
        let cache = NSCache<NSString, UIImage>()
        
        /// Set cache properties
        cache.name = self.cacheName
        cache.countLimit = self.maxCacheSize
        cache.totalCostLimit = self.cacheSize
        
        return cache
    }
    
    func add(key: String, value: UIImage) {
        imageCache.setObject(value, forKey: key as NSString)
    }
    
    func get(key: String) -> UIImage? {
        return imageCache.object(forKey: key as NSString)
    }
    
    func remove(key: String) {
        imageCache.removeObject(forKey: key as NSString)
    }
    
    func invalidateCache() {
        imageCache.removeAllObjects()
    }
}
