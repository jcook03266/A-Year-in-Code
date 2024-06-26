//
//  BinaryDecisionTreeNode.swift
//  Foncii
//
//  Created by Justin Cook on 2/12/23.
//

import Foundation

/// A decision tree for simplifying branching decision paths
extension BinaryDecisionTree {
    class Node<T> {
        var value: T? = nil
        var decision: (() -> (Bool))? = nil
        private(set) var falseChild: Node? = nil
        private(set) var trueChild: Node? = nil
        
        init () {}
        
        init(value: T?) {
            self.value = value
        }
        
        init(value: T?,
             decision: (() -> (Bool))?) {
            self.value = value
            self.decision = decision
        }
        
        init(value: T?,
             decision: (() -> (Bool))?,
             falseChild: Node?,
             trueChild: Node?) {
            self.value = value
            self.decision = decision
            self.falseChild = falseChild
            self.trueChild = trueChild
        }
        
        // MARK: - Builder Methods
        func addValue(value: T) {
            self.value = value
        }
        
        func addDecision(decision: @escaping (() -> (Bool))) {
            self.decision = decision
        }
        
        func addFalseChild(child: Node) {
            falseChild = child
        }
        
        func addTrueChild(child: Node) {
            trueChild = child
        }
        
        func build(using builder: @escaping ((Node) -> Void)) {
            builder(self)
        }
    }
}
