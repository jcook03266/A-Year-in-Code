//
//  PopoverModifier.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI

struct PopoverModifier<Item: Identifiable, Destination: View>: ViewModifier {

    // MARK: Stored Properties
    private let item: Binding<Item?>
    private let destination: (Item) -> Destination

    // MARK: Initialization
    init(item: Binding<Item?>,
         @ViewBuilder content: @escaping (Item) -> Destination) {

        self.item = item
        self.destination = content
    }

    // MARK: Methods
    func body(content: Content) -> some View {
        content.popover(item: item, content: destination)
    }
}
