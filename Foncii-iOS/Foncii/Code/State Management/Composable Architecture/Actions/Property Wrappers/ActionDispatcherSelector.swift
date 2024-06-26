//
// ActionDispatcherSelector.swift
// Foncii
//
// Created by Justin Cook on 6/3/23 at 9:01 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

@propertyWrapper
struct ActionDispatcherSelector<T: AppDomainActionDispatcher> {
    private var selector: AppDomainActionDispatcherSelector
    
    private var wrappedKeyPath: KeyPath<AppDomainActionDispatcherSelector, T>?
    
    var wrappedValue: T {
        guard let keyPath = wrappedKeyPath else {
            fatalError("Key path not set")
        }
        return selector[keyPath: keyPath]
    }
    
    init() {
        selector = AppDomainActionDispatcherSelector()
    }
    
    init(_ keyPath: KeyPath<AppDomainActionDispatcherSelector, T>
    ) {
        self.init()
        self.wrappedKeyPath = keyPath
    }
}

