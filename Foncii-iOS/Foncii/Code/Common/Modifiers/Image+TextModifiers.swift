//
//  Image+TextModifiers.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI

// MARK: - Description
/// Some general modifiers that centralize a lot of the modification patterns
/// present across the application for image and text views

// MARK: - Type Specific View Modifier Protocol
protocol ImageModifier {
    /// `Body` is derived from `View`
    associatedtype Body : View

    /// Modify an image by applying any modifications into `some View`
    func body(content: Image) -> Self.Body
}

extension Image {
    func modifier<M>(_ modifier: M) -> some View where M: ImageModifier {
        modifier.body(content: self)
    }
}

// MARK: - Fit
private struct FittedResizableTemplateImage: ImageModifier {
    func body(content: Image) -> some View {
        content
            .resizable()
            .renderingMode(.template)
            .aspectRatio(contentMode: .fit)
    }
}

private struct FittedResizableOriginalImage: ImageModifier {
    func body(content: Image) -> some View {
        content
            .resizable()
            .renderingMode(.original)
            .aspectRatio(contentMode: .fit)
    }
}

// MARK: - Fill
private struct FilledResizableTemplateImage: ImageModifier {
    func body(content: Image) -> some View {
        content
            .resizable()
            .renderingMode(.template)
            .aspectRatio(contentMode: .fill)
    }
}


private struct FilledResizableOriginalImage: ImageModifier {
    func body(content: Image) -> some View {
        content
            .resizable()
            .renderingMode(.original)
            .aspectRatio(contentMode: .fill)
    }
}

extension Image {
    /// - Modifier Properties: Resizable + .template rendering mode + .fit aspect ratio
    func fittedResizableTemplateImageModifier() -> some View {
        self
            .modifier(FittedResizableTemplateImage())
    }

    /// - Modifier Properties: Resizable + .original rendering mode + .fit aspect ratio
    func fittedResizableOriginalImageModifier() -> some View {
        self
            .modifier(FittedResizableOriginalImage())
    }
    
    /// - Modifier Properties: Resizable + .template rendering mode + .fill aspect ratio
    func filledResizableTemplateImageModifier() -> some View {
        self
            .modifier(FilledResizableTemplateImage())
    }
    
    /// - Modifier Properties: Resizable + .original rendering mode + .fill aspect ratio
    func filledResizableOriginalImageModifier() -> some View {
        self
            .modifier(FilledResizableOriginalImage())
    }
}

