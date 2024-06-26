//
//  URL+String+Extensions.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import UIKit

extension URL {
    /// - Returns: the absolute string version of the URL
    var asString: String {
        return self.absoluteString
    }
    
    /// Used to check if the url contains a fragment before trying to parse it for a fragment, the fragment() function
    ///  unwraps nil for some reason when no fragment is found in the url, and this causes a fatal crash which shouldn't be, but for the time being, use this to overcome that force unwrap from the system level API
    var containsFragment: Bool {
        return self.asString.contains { $0 == "#" }
    }
    
    /// The last path component function ignores paths with trailing forward slashes, this removes the forward slash and allows the ignored path to be parsed, if the trimmed url string isn't convertable then the base is url is used
    func normalizeFromTrailingSlash() -> URL {
        // Ensure that the last path component is a slash, this
        guard self.lastPathComponent == "/"
        else { return self }
        
        var urlString = self.asString
        var trimmedURLString = urlString.trimTrailingSlash()
        
        // Pre-check the new URL to make sure it doesn't contain an edge case
        // Edge-case example: Foncii://home/#events/ a valid URL which can only be caught by this pre-check
        if let url = URL(string: trimmedURLString),
           url.lastPathComponent == "/"
        {
            urlString = url.asString
            trimmedURLString = urlString.trimTrailingSlash()
            
            return trimmedURLString.asURL.unwrap(defaultValue: self)
        }
        
        return trimmedURLString.asURL.unwrap(defaultValue: self)
    }
}

private extension String {
   mutating func trimTrailingSlash() -> String {
        if let lastSlashIndex = self.lastIndex(of: "/") {
            self.remove(at: lastSlashIndex)
        }
        
        return self
    }
}
