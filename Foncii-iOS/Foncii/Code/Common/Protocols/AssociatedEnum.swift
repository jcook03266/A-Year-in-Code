//
//  AssociatedEnum.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import Foundation

/** Protocol for retrieving generic associated values from an enum*/
protocol AssociatedEnum: CaseIterable {
    associatedtype associatedValue: Any
    
    func getAssociatedValue() -> associatedValue
}
