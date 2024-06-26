//
// SlidingContextSwitchViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 11:46 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import OrderedCollections

class SlidingContextSwitchViewModel: GenericViewModel {
    // MARK: - Published
    @Published var tabs: OrderedSet<SlidingContextSwitchTabViewModel> = []
    @Published var currentlySelectedTab: SlidingContextSwitchTabViewModel? = nil
    
    // MARK: - Styling
    // Colors
    let selectionUnderlineColor: Color = Colors.primary_1,
        backgroundColor = Colors.black_1
    
    init(tabs: ((SlidingContextSwitchViewModel) -> [SlidingContextSwitchTabViewModel])? = nil,
         currentlySelectedTab: SlidingContextSwitchTabViewModel? = nil) {
        self.currentlySelectedTab = currentlySelectedTab
        self.tabs = OrderedSet(tabs?(self) ?? [])
    }
    
    func insertTab(tabViewModel: SlidingContextSwitchTabViewModel) {
        guard !isTabCurrentlySelected(tabViewModel: tabViewModel)
        else { return }
        
        self.tabs.append(tabViewModel)
    }
    
    // MARK: - Tab Button Child to Parent Interactions
    func selectTab(
        tabViewModel: SlidingContextSwitchTabViewModel,
        onSelectAction: (() -> Void)? = nil
    ) {
        guard isTabACurrentChild(tabViewModel: tabViewModel),
              !isTabCurrentlySelected(tabViewModel: tabViewModel)
        else { return }
        
        self.currentlySelectedTab = tabViewModel
        onSelectAction?()
    }
    
    func isTabACurrentChild(tabViewModel: SlidingContextSwitchTabViewModel) -> Bool {
        return tabs.contains(tabViewModel)
    }
    
    func isTabCurrentlySelected(tabViewModel: SlidingContextSwitchTabViewModel) -> Bool {
        guard let currentlySelectedTab = currentlySelectedTab,
              isTabACurrentChild(tabViewModel: tabViewModel)
        else { return false }
        
        return currentlySelectedTab == tabViewModel
    }
}
