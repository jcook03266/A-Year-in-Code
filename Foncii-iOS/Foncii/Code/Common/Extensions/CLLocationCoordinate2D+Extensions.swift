//
// CLLocationCoordinate2D+Extensions.swift
// Foncii
//
// Created by Justin Cook on 5/22/23 at 11:42 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import CoreLocation

/// Conforms CLLocationCoordinate2D objects to the Codable protocol
/// allowing its contents to be encoded and decoded for tasks such as persistent
/// storage and or transportation via some API
extension CLLocationCoordinate2D: Codable {
    public func encode(to encoder: Encoder) throws {
        var container = encoder.unkeyedContainer()
        try container.encode(latitude)
        try container.encode(longitude)
    }
    
    public init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        let latitude = try container.decode(CLLocationDegrees.self)
        let longitude = try container.decode(CLLocationDegrees.self)
        self.init(latitude: latitude, longitude: longitude)
    }
}
