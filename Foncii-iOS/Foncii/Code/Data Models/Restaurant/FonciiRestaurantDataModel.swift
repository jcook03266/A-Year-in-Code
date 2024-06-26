//
// FonciiRestaurantDataModel.swift
// Foncii
//
// Created by Justin Cook on 6/5/23 at 11:14 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import FonciiApollo
import ApolloTestSupport

/// Extension of the Foncii Restaurant data model, allowing for more control and functionality beyond storing data
extension FonciiRestaurant {
    /// Converts the numerical integer price level to the traditional
    /// repeating dollar sign appearance seen on other platforms
    var priceLevelAsDollarSigns: String {
        let numericalPriceLevel = Int(self.priceLevel ?? "")
        
        guard let numericalPriceLevel = numericalPriceLevel,
              numericalPriceLevel > 0
        else { return "N/A" }
        
        return String.init(repeating: "$",
                           count: numericalPriceLevel)
    }
    
    /// Returns a string of concatenated categories separated by the passed in by the
    /// custom separator character
    var categoriesString: ((String) -> String?) {
        return { separator in
            
            let separatedCatergoriesString = self.categories?.joined(separator: separator)
            
            return separatedCatergoriesString
        }
    }
}

/// Extending personalized search result types to enable
/// easier conversion of percentage match percent from a double
/// to a formatted string percentage
extension PersonalizedRestaurantSearchResult {
    var percentageMatchAsPercent: String {
        return self.percentMatch?.formatted(.percent) ?? "N/A"
    }
    
    /// Provisions a mocked object with an random ID for use as a placeholder or testable entity elsewhere
    static var mock: PersonalizedRestaurantSearchResult {
        let mockRestaurantSearchResult = Mock<FonciiApollo.PersonalizedRestaurant>()
        
        /// Settings required properties
        mockRestaurantSearchResult.restaurant = Mock(addressProperties: .init(formattedAddress: "501 Geary St, San Francisco, CA 94102"),
                                                     categories: ["Desserts", "Desserts", "Desserts", "Desserts", "Desserts",
                                                                  "Desserts",
                                                                  "Desserts",
                                                                  "Desserts","Pizza"],
                                                     googleProperties: .init(rating: 4.1), heroImageURL: "https://images.happycow.net/venues/1024/22/06/hcmp220697_1067080.jpeg",
                                                     id: UUID().uuidString,
                                                     name: "U:Dessert Story",
                                                     priceLevel: "2",
                                                     yelpProperties: .init(Mock(rating: 4.3))
        )
        
        mockRestaurantSearchResult.restaurant?.description = "U Dessert Story is the next level of Asian desserts-influenced by Korean, Japanese, and Thai passion. Our desserts are homemade in our kitchen with love using the highest quality ingredients."
        
        mockRestaurantSearchResult.percentMatch = 0.98
        mockRestaurantSearchResult.isFavorited = false
        
        return .from(mockRestaurantSearchResult)
    }
}

// Favorited Restaurant Search Result Type
extension FavoritedRestaurant {
    static var mock: Foncii.FavoritedRestaurant {
        let mockFavoritedRestaurant = Mock<FonciiApollo.FavoritedRestaurant>()
        
        mockFavoritedRestaurant.id = UUID().uuidString
        mockFavoritedRestaurant.creationDate = Date.now.ISO8601Format()
        mockFavoritedRestaurant.userID = UUID().uuidString
        mockFavoritedRestaurant.favoritedRestaurant = .init(
            Mock(isFavorited: true,
                 percentMatch: 0,
                 restaurant: Mock(addressProperties: .init(formattedAddress: "501 Geary St, San Francisco, CA 94102"),
                                  categories: ["Italian", "Pizza"],
                                  googleProperties: .init(rating: 4.1), heroImageURL: "https://images.happycow.net/venues/1024/22/06/hcmp220697_1067080.jpeg",
                                  id: UUID().uuidString,
                                  name: "Perbacco",
                                  priceLevel: "2",
                                  yelpProperties: .init(Mock(rating: 4.3))
                                 )))
        
        return .from(mockFavoritedRestaurant)
    }
}
