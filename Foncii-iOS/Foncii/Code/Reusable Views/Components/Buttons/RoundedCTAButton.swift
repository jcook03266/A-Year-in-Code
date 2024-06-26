//
//  RoundedCTAButton.swift
//  Foncii
//
//  Created by Justin Cook on 2/17/23.
//

import SwiftUI
import ActivityIndicatorView

/// Rounded call to action button with a default round and non-opaque background,
/// accepts single line titles and void actions
struct RoundedCTAButton: View {
    // MARK: - Properties
    var useBorder: Bool = false,
        isOpaque: Bool = false,
        title: String,
        action: (() -> Void),
        disabled: Bool = false
    
    // Optional Activity Indicator
    var displayActivityIndicator: Bool = false,
        activityIndicatorType: ActivityIndicatorView.IndicatorType = .scalingDots()
    
    private var opacity: CGFloat {
        return isOpaque ? 0.22 : 1
    }
    
    // MARK: - Dimensions
    var size: CGSize = .init(width: 290, height: 48),
        cornerRadius: CGFloat = 45,
        borderWidth: CGFloat = 1
    
    private var activityIndicatorSize: CGSize {
        return .init(width: size.height/1.5,
                     height: size.height/1.5)
    }
    
    // MARK: - Padding
    /// Don't let the title touch the edges of the container
    var horizontalPadding: CGFloat = 10,
        verticalPadding: CGFloat = 2.5
    
    // MARK: - Styling
    // Colors
    var backgroundColor: Color = Colors.primary_1
    
    /// Dependent on opacity settings
    private var appliedBackgroundColor: Color {
        return backgroundColor.opacity(opacity)
    }
    
    private var borderColor: Color {
        return backgroundColor
    }
    
    var foregroundColor: Color = Colors.permanent_white,
        // Font
        font: FontStyleRepository = .subtitle,
        fontWeight: UIFont.Weight = .medium
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: displayActivityIndicator)
    }
}

// MARK: - Sections
extension RoundedCTAButton {
    var mainSection: some View {
        Button {
            action()
            
            HapticFeedbackDispatcher
                .interstitialCTAButtonPress()
        } label: {
            buttonContentSection
        }
        .buttonStyle(.genericSpringyShrink)
        .disabled(disabled || displayActivityIndicator)
    }
    
    var buttonContentSection: some View {
        ZStack {
            pillView
            
            Group {
                if displayActivityIndicator {
                    activityIndicatorView
                }
                else {
                    titleView
                }
            }
            .transition(.scale)
        }
        .frame(width: size.width,
               height: size.height)
        .padding(.horizontal, horizontalPadding)
        .padding(.vertical, verticalPadding)
    }
}

// MARK: - Subviews
extension RoundedCTAButton {
    var activityIndicatorView: some View {
        ActivityIndicatorView(isVisible: .constant(displayActivityIndicator),
                              type: activityIndicatorType)
        .frame(width: activityIndicatorSize.width,
               height: activityIndicatorSize.height)
        .foregroundColor(foregroundColor)
    }
    
    var pillView: some View {
        ZStack {
            if useBorder {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .strokeBorder(
                        borderColor,
                        lineWidth: borderWidth
                    )
            }
            
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(appliedBackgroundColor)
        }
    }
    
    var titleView: some View {
        Text(title)
            .withFont(font,
                      weight: fontWeight)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .minimumScaleFactor(0.5)
            .foregroundColor(foregroundColor)
    }
}

struct RoundedCTAButton_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            RoundedCTAButton(useBorder: true,
                             isOpaque: true,
                             title: "Log In",
                             action: {})
            
            RoundedCTAButton(title: "Sign Up",
                             action: {})
        }
    }
}
