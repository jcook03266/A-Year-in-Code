//
//  EnableLocationScreen.swift
//  Foncii
//
//  Created by Justin Cook on 3/30/23.
//

import SwiftUI

struct EnableLocationScreen: View {
    // MARK: - Observed
    @StateObject var model: EnableLocationScreenViewModel
    
    // MARK: - States
    @State private var didAppear: Bool = false
    
    // MARK: - Properties
    private let onAppearTextAnimationDelay: CGFloat = 0.3,
                generalAnimationDelay: CGFloat = 1.25
    
    // MARK: - Dimensions
    private let enableLocationButtonSize: CGSize = .init(width: 208,
                                                         height: 48),
                backgroundArtImageSize: CGSize = .init(width: 290,
                                                       height: 340),
                subtitlePromptSize: CGSize = .init(width: 271,
                                                   height: 66)
    
    // MARK: - Padding + Spacing
    private let backButtonLeadingPadding: CGFloat = 34,
                bottomSectionBottomPadding: CGFloat = 48.5,
                topSectionTopPadding: CGFloat = 60,
                textSectionTopPadding: CGFloat = 46,
                textSectionItemSpacing: CGFloat = 14
    
    var body: some View {
        mainSection
            .onAppear {
                toggleOnAppearAnimations()
            }
            .animation(.spring(),
                       value: model.displayingAggregationOverlay)
    }
}

// MARK: - Functions
extension EnableLocationScreen {
    func toggleOnAppearAnimations() {
        didAppear = true
    }
}

// MARK: - Sections
extension EnableLocationScreen {
    var mainSection: some View {
        GeometryReader { geom in
            ZStack {
                ScrollView(.vertical) {
                    VStack(spacing: 0) {
                        topSection
                        bottomSection
                    }
                    .frame(width: geom.size.width,
                           height: geom.size.height)
                }
                
                restaurantAggregationOverlay
            }
        }
        .background(model.backgroundColor)
    }
    
    var topSection: some View {
        VStack(spacing: 0) {
            backgroundArt
            textSection
        }
        .padding(.top, topSectionTopPadding)
    }
    
    var textSection: some View {
        VStack(spacing: textSectionItemSpacing) {
            titleTextView
            subtitlePrompt
        }
        .padding(.top, textSectionTopPadding)
    }
    
    var bottomSection: some View {
        VStack {
            Spacer()
            enableLocationButton
                .disabled(!model.locationPermissionButtonEnabled)
        }
        .padding(.bottom,
                 bottomSectionBottomPadding)
    }
    
    var restaurantAggregationOverlay: some View {
        Group {
            if (model.displayingAggregationOverlay) {
                ZStack {
                    OpaqueBackgroundOverlay()
                        .transition(.opacity
                            .animation(.easeIn)
                        )
                    
                    AggregationPhaseOverlay()
                        .transition(
                            .scale
                                .animation(.spring())
                        )
                }
            }
        }
        .zIndex(10)
    }
}

// MARK: - Subviews
extension EnableLocationScreen {
    var titleTextView: some View {
        HStack(spacing: 0) {
            Group {
                ForEach(model
                    .titleFragments
                    .indices,
                        id: \.self) { index in
                    let titleFragment = model.titleFragments[index],
                        delay = Double(0 + Double(index)/20)
                    
                    Group {
                        if didAppear {
                            Text(titleFragment)
                        }
                    }
                    .animation(
                        .spring(dampingFraction: 0.4)
                        .speed(0.75)
                        .delay(onAppearTextAnimationDelay + delay),
                        value: didAppear)
                }
            }
            .transition(
                .move(edge: .bottom)
                .combined(with: .opacity
                    .animation(
                        .spring()
                        .delay(onAppearTextAnimationDelay + 0.1)
                    ))
            )
        }
        .withFont(model.titleFont)
        .fixedSize(horizontal: false, vertical: true)
        .multilineTextAlignment(.center)
        .foregroundColor(model.titleColor)
    }
    
    var subtitlePrompt: some View {
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
    
    var backgroundArt: some View {
        Group {
            if didAppear {
                model.locationScreenArt
                    .fittedResizableOriginalImageModifier()
                    .scaledToFit()
            }
        }
        .transition(.scale
            .animation(
                .spring()
            ))
        .frame(width: backgroundArtImageSize.width,
               height: backgroundArtImageSize.height)
    }
    
    var enableLocationButton: some View {
        Group {
            if didAppear {
                RoundedCTAButton(title: model.enableLocationButtonTitle,
                                 action: model.triggerEnableLocationPromptAction,
                                 size: enableLocationButtonSize)
            }
        }
        .transition(.opacity
            .animation(
                .easeInOut
                    .delay(generalAnimationDelay)
            ))
    }
}

struct EnableLocationScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .rootCoordinatorSelector
            .onboardingCoordinator
            .router
            .view(for: .enableLocation)
    }
    
    static var previews: some View {
        getView()
    }
}
