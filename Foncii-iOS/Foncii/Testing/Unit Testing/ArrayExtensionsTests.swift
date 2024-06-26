//
//  ArrayExtensionsTests.swift
//  FonciiTests
//
//  Created by Justin Cook on 2/9/23.
//

import XCTest
@testable import Foncii

final class ArrayExtensionsTests: XCTestCase {
    /// Test converting tuples to array format via Mirror API
    func testTupleToArray() {
        XCTAssertEqual(Array(mirrorChildValuesOf: (1, 2, 3, 4, 5)),
                       [1, 2, 3, 4, 5])
        
        XCTAssertNil([Int](optionallyMirrorChildValuesOf: (1, 2, "3", 4, 5)))
    }
}
