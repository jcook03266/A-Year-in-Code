//
//  CoordinatorTests.swift
//  FonciiTests
//
//  Created by Justin Cook on 2/12/23.
//

import XCTest
@testable import Foncii

/// Unit tests for ensuring the proper logical functionality of the coordinator objects that power the app's navigation infrastructure
final class CoordinatorTests: XCTestCase {
    /// Delegate reference for tests
    var rootCoordinatorDelegate: RootCoordinatorDelegate {
        return .shared
    }
    
    /** Various experiments conducted on a root tabbar coordinator to ensure that its internal logic functions as expected
     - And no breaking changes have been encountered. The tabbar coordinator is dynamic as its children are loaded at runtime
     - This leaves a lot of room for error, so running these tests ensure that the core navigational logic is intact given some arbitrary change
     */
    func testRootCoordinator() {
        let testRoot = rootCoordinatorDelegate
            .rootCoordinatorSelector
            .mainCoordinator
        
        // Test tab switching
        testRoot.currentTab = .profile
        XCTAssertEqual(testRoot.currentTab, .profile)
        
        // Test navigation stack pushing
        testRoot.pushView(with: .home)
        XCTAssertEqual(testRoot
            .navigationPath
            .count, 1)

        // Test navigation stack popping
        testRoot.popView()
        XCTAssertEqual(testRoot
            .navigationPath
            .count, 0)
    }

}
