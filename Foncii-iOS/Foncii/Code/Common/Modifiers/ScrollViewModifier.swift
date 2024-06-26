//
//  ScrollViewModifier.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import UIKit

// MARK: - Scroll View Pagination
struct ScrollViewPagingEnabledModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .onAppear {
                UIScrollView.appearance().isPagingEnabled = true
            }
            .onDisappear {
                UIScrollView.appearance().isPagingEnabled = false
            }
    }
}

struct ScrollViewPagingDisabledModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .onAppear {
                UIScrollView.appearance().isPagingEnabled = false
            }
            .onDisappear {
                UIScrollView.appearance().isPagingEnabled = false
            }
    }
}

extension ScrollView {
    func enablePaging() -> some View {
        modifier(ScrollViewPagingEnabledModifier())
    }
    
    func disablePaging() -> some View {
        modifier(ScrollViewPagingDisabledModifier())
    }
}


struct ScrollViewTrackingModifier: ViewModifier {
    var coordinateSpaceName: Namespace.ID
    @Binding var boundOffset: CGPoint
    
    func body(content: Content) -> some View {
        content
            .background(GeometryReader {
                Color.clear
                    .preference(key: ViewContentOffsetKey.self,
                                value: $0.frame(in: .named(coordinateSpaceName)).origin)
            })
            .onPreferenceChange(ViewContentOffsetKey.self) {
                boundOffset = $0
            }
    }
}

struct ViewContentOffsetKey: PreferenceKey {
    typealias Value = CGPoint
    static var defaultValue = CGPoint.zero
    static func reduce(value: inout Value, nextValue: () -> Value) {
        value += nextValue()
    }
}

extension View {
    func trackScrollViewOffset(coordinateSpaceName: Namespace.ID,
                               bindingOffset: Binding<CGPoint>) -> some View {
        modifier(ScrollViewTrackingModifier(coordinateSpaceName: coordinateSpaceName,
                                            boundOffset: bindingOffset))
    }
}
