//
//  CommonMath.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import Foundation

extension CGSize {
    // MARK: - Static
    static func * (lhs: CGSize, rhs: CGSize) -> CGSize {
        return CGSize(width: lhs.width * rhs.width,
                      height: lhs.height + rhs.height)
    }
    
    // Identitiy (1) CGSize for performing identity transformations
    static var identity: CGSize {
        return CGSize(width: 1, height: 1)
    }
    
    // MARK: - Dynamic
    func scaleBy(_ factor: CGFloat) -> CGSize {
        return CGSize(width: self.width * factor, height: self.height * factor)
    }
    
    func negated() -> CGSize {
        return CGSize(width: -self.width,
                      height: -self.height)
    }
}

extension CGPoint {
    static func += (lhs: inout CGPoint, rhs: CGPoint) {
        lhs = CGPoint(x: lhs.x + rhs.x, y: lhs.y + rhs.y)
    }
    
    func shiftedBy(amount: CGFloat) -> CGPoint {
        return .init(x: self.x + amount, y: self.y + amount)
    }
}

struct UnitCircle {
    static var degrees_45: CGFloat {
        return .pi/2
    }
}
