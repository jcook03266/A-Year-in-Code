//
//  PreferenceKeys.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import UIKit

/// A collection of reusable preference keys used when listening for specific changes inside of a view
struct ViewSizeKey: PreferenceKey {
    static var defaultValue: CGSize = .zero
    
    static func reduce(value: inout CGSize, nextValue: () -> CGSize) {
        value = nextValue()
    }
}

struct PositionPreferenceKey: PreferenceKey {
    typealias Value = CGPoint
    static var defaultValue: Value = .zero
    
    static func reduce(value: inout Value, nextValue: () -> Value) {
        value = nextValue()
    }
}

struct SizeObservingView<Content: View>: View {
    var coordinateSpace: CoordinateSpace
    @Binding var size: CGSize
    @ViewBuilder var content: () -> Content
    
    var body: some View {
        content()
            .background(GeometryReader { geometry in
                Color.clear.preference(
                    key: PreferenceKey.self,
                    value: geometry.frame(in: coordinateSpace).size
                )
            })
            .onPreferenceChange(PreferenceKey.self) { size in
                self.size = size
            }
    }
}

private extension SizeObservingView {
    struct PreferenceKey: SwiftUI.PreferenceKey {
        static var defaultValue: CGSize { .zero }
        
        static func reduce(value: inout CGSize, nextValue: () -> CGSize) {
            // Unused
        }
    }
}


struct PositionObservingView<Content: View>: View {
    var coordinateSpace: CoordinateSpace
    @Binding var position: CGPoint
    @ViewBuilder var content: () -> Content
    
    var body: some View {
        content()
            .background(GeometryReader { geometry in
                Color.clear.preference(
                    key: PreferenceKey.self,
                    value: geometry.frame(in: coordinateSpace).origin
                )
            })
            .onPreferenceChange(PreferenceKey.self) { position in
                self.position = position
            }
    }
}

private extension PositionObservingView {
    struct PreferenceKey: SwiftUI.PreferenceKey {
        static var defaultValue: CGPoint { .zero }
        
        static func reduce(value: inout CGPoint, nextValue: () -> CGPoint) {
            // Unused
        }
    }
}

/// Size and position observing view
struct SPObservingView<Content: View>: View {
    var coordinateSpace: CoordinateSpace
    @Binding var size: CGSize
    @Binding var position: CGPoint
    @ViewBuilder var content: () -> Content
    
    var body: some View {
        content()
            .background(GeometryReader { geometry in
                Color.clear
                    .preference(
                    key: SizePreferenceKey.self,
                    value: geometry.frame(in: coordinateSpace).size
                )
                    .preference(
                        key: PositionPreferenceKey.self,
                        value: geometry.frame(in: coordinateSpace).origin
                    )
            })
            .onPreferenceChange(SizePreferenceKey.self) { size in
                self.size = size
            }
            .onPreferenceChange(PositionPreferenceKey.self) { position in
                self.position = position
            }
    }
}

private extension SPObservingView {
    struct SizePreferenceKey: SwiftUI.PreferenceKey {
        static var defaultValue: CGSize { .zero }
        
        static func reduce(value: inout CGSize, nextValue: () -> CGSize) {
            // Unused
        }
    }
    
    struct PositionPreferenceKey: SwiftUI.PreferenceKey {
        static var defaultValue: CGPoint { .zero }
        
        static func reduce(value: inout CGPoint, nextValue: () -> CGPoint) {
            // Unused
        }
    }
}
