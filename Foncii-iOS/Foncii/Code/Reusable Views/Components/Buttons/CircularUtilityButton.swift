//
//  CircularUtilityButton.swift
//  Foncii
//
//  Created by Justin Cook on 2/18/23.
//

import SwiftUI

/// A simple circle button with an icon in the middle that shrinks and grows when pressed
struct CircularUtilityButton: View {
    // MARK: - Properties: Actions - Color - Font
    var action: (() -> Void),
        icon: Image = Icons.getIconImage(named: .xmark),
        backgroundColor: Color = Colors.black_1,
        backgroundGradient: LinearGradient? = nil,
        foregroundColor: Color = Colors.permanent_white,
        foregroundGradient: LinearGradient? = nil,
        borderEnabled: Bool = false,
        borderColor: Color = Colors.primary_1,
        borderGradient: LinearGradient? = nil,
        disabledForegroundColor: Color = Colors.neutral_1,
        explicitImageSize: CGSize? = nil
    
    // MARK: - Dimensions + Padding
    var size: CGSize = CGSize(width: 50, height: 50),
        borderWidth: CGFloat = 2,
        padding: CGFloat = 0
    
    var imageSize: CGSize {
        return explicitImageSize ?? size.scaleBy(0.4)
    }
    
    // MARK: - Appear Animation
    var shouldAnimateOnAppear: Bool = false,
        animatedCircleViewColor: Color = Colors.neutral_1,
        animatedCircleStrokeWidth: CGFloat = 5
    
    // MARK: - Binding
    @Binding var isEnabled: Bool
    @Binding var animate: Bool
    
    var body: some View {
        mainSection
    }
}

// MARK: - Sections
extension CircularUtilityButton {
    var mainSection: some View {
            Button(action: {
                HapticFeedbackDispatcher.genericButtonPress()
                action()
            }){
                Circle()
                    .frame(width: size.width, height: size.height)
                    .foregroundColor(backgroundColor)
                    .if(backgroundGradient != nil, transform: {
                        $0.applyGradient(gradient: backgroundGradient!)
                    })
                            .overlay(
                                iconView
                            )
                                .background(
                                    Group {
                                        if borderEnabled {
                                            circleBorder
                                        }
                                    }
                                )
            }
            .disabled(!isEnabled)
            .buttonStyle(.genericSpringyShrink)
            .background(
                animatedCircleView
            )
    }
    
}

// MARK: - Subviews
extension CircularUtilityButton {
    var animatedCircleView: some View {
        Circle()
            .stroke(animatedCircleViewColor,
                    lineWidth: animatedCircleStrokeWidth)
            .frame(width: size.width * 1.5, height: size.height * 1.5)
            .scaleEffect(animate ? 1 : 0.0001)
            .opacity(animate ? 0 : 1)
            .animation(animate ? .spring().speed(0.8) : nil,
                       value: animate)
            .onAppear {
                guard shouldAnimateOnAppear else { return }
                animate.toggle()
            }
    }
    
    var iconView: some View {
        icon
            .fittedResizableTemplateImageModifier()
            .frame(width: imageSize.width,
                   height: imageSize.height)
            .padding([.all], padding)
            .foregroundColor(isEnabled ? foregroundColor : disabledForegroundColor)
            .if(foregroundGradient != nil, transform: {
                $0.applyGradient(gradient: foregroundGradient!)
            })
    }
    
    var circleBorder: some View {
        Circle()
            .stroke(borderColor,
                    lineWidth: borderWidth)
            .if(borderGradient != nil, transform: {
                $0.applyGradient(gradient: borderGradient!)
            })
            .frame(width: size.width, height: size.height)
    }
}

struct CircularUtilityButton_Previews: PreviewProvider {
    static var previews: some View {
        CircularUtilityButton(action: {},
                              shouldAnimateOnAppear: true,
                              isEnabled: .constant(true),
                              animate: .constant(false))
    }
}
