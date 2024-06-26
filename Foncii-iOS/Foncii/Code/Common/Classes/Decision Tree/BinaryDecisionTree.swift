//
//  BinaryDecisionTree.swift
//  Foncii
//
//  Created by Justin Cook on 2/12/23.
//

import Foundation

class BinaryDecisionTree<T> {
    var root: Node<T>
    
    init(root: Node<T>) {
        self.root = root
    }
    
    /// Runs the binary tree to find the last leaf node based on the given decisions, and returns the last leaf node
    func execute() -> Node<T>? {
        var currentNode: Node<T>? = root
        
        while currentNode != nil {
            if let nextNode = currentNode,
               let decision = nextNode.decision {
                
                currentNode = decision() ? currentNode?.trueChild : currentNode?.falseChild
            }
            else { return currentNode }
        }
        
        return currentNode
    }
}
