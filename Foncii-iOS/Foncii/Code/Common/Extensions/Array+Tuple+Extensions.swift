//
//  Array+Tuple+Extensions.swift
//  Foncii
//
//  Created by Justin Cook on 2/9/23.
//

import Foundation

/// Convert tuples or any sequence of elements into an array through the Mirror API
extension Array {
    /// Optional Initializer
    init?<Subject>(optionallyMirrorChildValuesOf subject: Subject) {
        guard let array = Mirror(reflecting: subject)
            .children
            .map(\.value)
                as? Self
        else { return nil }
        
        self = array
    }
    
    /// Non-optional, if mirror fails then an empty array is initialized
    init<Subject>(mirrorChildValuesOf subject: Subject) {
        let array = Mirror(reflecting: subject)
            .children
            .map(\.value)
                as? Self
        
        self = array ?? Self()
    }
}

/// General extensions to minimize repetitions and simplify operations
extension Array {
    /// The zero indexed count of all elements in this collection, used for zero indexed (index starts at 0) for loops
    var zeroIndexedCount: Int {
        return self.count - 1
    }
}
