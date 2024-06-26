//
//  SwiftUIAnimationTransitions.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI

extension AnyTransition {
    static var slideBackwards: AnyTransition {
        AnyTransition.asymmetric(insertion: .move(edge: .trailing),
                                 removal: .move(edge: .leading))
    }
    static var slideForwards: AnyTransition {
        AnyTransition.slide
    }
}
