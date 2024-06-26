//
// AggregationPhaseOverlay.swift
// Foncii
//
// Created by Justin Cook on 5/20/23 at 5:00 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ActivityIndicatorView
import ComposableArchitecture

struct AggregationPhaseOverlay: View {
    // MARK: - Observed
    // Local
    @StateObject var model: AggregationPhaseOverlayViewModel = .init()
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - States
    @State private var didAppear: Bool = false
    
    // MARK: - Properties
    private let generalAnimationDelay: CGFloat = 1.25
    
    // MARK: - Dimensions
    private let animationViewSize: CGSize = .init(width: 200,
                                                  height: 200),
                subtitlePromptSize: CGSize = .init(width: 271,
                                                   height: 66),
                statusIndicatorIconSize: CGSize = .init(width: 25,
                                                        height: 25)
    
    private var dynamicLoadingAnimationSize: CGSize {
        return animationViewSize.scaleBy(1)
    }
    
    // MARK: - Padding
    private let animationVerticalPadding: CGFloat = 20,
                textSectionItemSpacing: CGFloat = 14,
                titleHorizontalPadding: CGFloat = 20
    
    var body: some View {
        mainSection
            .onAppear {
                toggleOnAppearAnimations()
            }
            .animation(.spring(),
                       value: model.currentActivity)
            .animation(.spring(),
                       value: didAppear)
    }
}

// MARK: - Functions
extension AggregationPhaseOverlay {
    func toggleOnAppearAnimations() {
        didAppear = true
    }
}

// MARK: - Sections
extension AggregationPhaseOverlay {
    var mainSection: some View {
        GeometryReader { geom in
            ScrollView(.vertical) {
                VStack(spacing: 0) {
                    titleSection
                    animationSection
                    textSection
                }
                .frame(width: geom.size.width,
                       height: geom.size.height)
            }
        }
        .background(model.backgroundColor)
    }
    
    var textSection: some View {
        VStack(spacing: textSectionItemSpacing) {
            subtitleTextView
        }
    }
    
    var titleSection: some View {
        VStack(spacing: 0) {
            Group {
                if didAppear {
                    Group {
                        titleTextView
                        geocodedLocationTextView
                    }
                    .transition(
                        .scale
                            .animation(.spring())
                    )
                }
            }
        }
        .padding(.horizontal,
                 titleHorizontalPadding)
    }
    
    var animationSection: some View {
        ZStack {
            currentLoadingAnimation
            animationView
        }
        .padding(.vertical,
                 animationVerticalPadding)
    }
}

// MARK: - Subviews
extension AggregationPhaseOverlay {
    var currentLoadingAnimation: some View {
        Group {
            switch model.currentActivity {
            case .searching:
                dynamicLoadingAnimation
            case .indexing:
                dynamicLoadingAnimation
            case .done:
                dynamicLoadingAnimation
            case .failed:
                dynamicLoadingAnimation
            }
        }
        .transition(
            .scale
                .animation(.spring())
        )
        .tint(model.dynamicLoadingAnimationColor)
        .foregroundColor(model.dynamicLoadingAnimationColor)
        .frame(width: dynamicLoadingAnimationSize.width,
               height: dynamicLoadingAnimationSize.height)
    }
    
    var dynamicLoadingAnimation: some View {
        ActivityIndicatorView(isVisible: $model.loadingIndicatorActive,
                              type: model.currentActivityIndicatorType)
    }
    
    var currentStatusIndicatorIcon: some View {
        Group {
            switch model.currentActivity {
            case .searching:
                statusIndicatorIcon
            case .indexing:
                statusIndicatorIcon
            case .done:
                statusIndicatorIcon
            case .failed:
                statusIndicatorIcon
            }
        }
        .transition(
            .scale
                .animation(.spring())
        )
    }
    
    var statusIndicatorIcon: some View {
        model.currentStatusIndicatorIcon
            .fittedResizableOriginalImageModifier()
            .frame(width: statusIndicatorIconSize.width,
                   height: statusIndicatorIconSize.height)
    }
    
    var titleTextView: some View {
        VStack {
            currentStatusIndicatorIcon
            
            Text(model.titleText)
                .withFont(model.titleFont)
                .fixedSize(horizontal: false, vertical: true)
                .multilineTextAlignment(.center)
                .foregroundColor(model.titleColor)
        }
    }
    
    var geocodedLocationTextView: some View {
        Text(model.currentGeocodedLocationText)
            .withFont(model.titleFont)
            .fixedSize(horizontal: false, vertical: true)
            .multilineTextAlignment(.center)
            .foregroundColor(model.titleColor)
    }
    
    var subtitleTextView: some View {
        Group {
            if didAppear {
                Text(model.subtitleText)
                    .withFont(model.subtitleFont)
                    .fixedSize(horizontal: false, vertical: true)
                    .multilineTextAlignment(.center)
                    .foregroundColor(model.textColor)
            }
        }
        .transition(.opacity
            .animation(
                .easeInOut
                    .delay(generalAnimationDelay)
            ))
        .frame(width: subtitlePromptSize.width,
               height: subtitlePromptSize.height)
    }
    
    var animationView: some View {
        return HStack {
            Spacer()
            
            let lottieView = LottieViewUIViewRepresentable(
                animationName: model.globeAnimation,
                shouldPlay: .constant(true))
            
            lottieView
                .frame(width: animationViewSize.width,
                       height: animationViewSize.height)
                .scaledToFit()
            
            Spacer()
        }
    }
}

struct AggregationPhaseOverlay_Previews: PreviewProvider {
    static var previews: some View {
        AggregationPhaseOverlay()
    }
}

