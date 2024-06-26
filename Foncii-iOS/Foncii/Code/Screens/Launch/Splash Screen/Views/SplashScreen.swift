//
//  SplashScreen.swift
//  Foncii
//
//  Created by Justin Cook on 2/12/23.
//

import SwiftUI
import ActivityIndicatorView

struct SplashScreen: View {
    // MARK: - Observed
    @StateObject var model: SplashScreenViewModel
    
    // MARK: - States
    @State private var didAppear: Bool = false
    
    // MARK: - Dimensions
    /// Advisory: If this dimension changes in the storyboard file please change it here as well
    private let appMascotImageSize: CGSize = .init(width: 100,
                                                   height: 80),
                appLogoTextImageSize: CGSize = .init(width: 150,
                                                     height: 50)
    
    // Circle Mask + Variable Dimensions
    private var circleMaskSize: CGSize {
        return model.transitionAnimation ?
        circleMaskFinalSize :
        circleMaskOriginalSize
    }
    
    private var circleMaskOffset: CGSize {
        let xOffset = appLogoTextImageSize.width/2 -
        circleMaskOriginalSize.width/0.39,
        yOffset = -(circleMaskOriginalSize.height * 2.7)
        
        return .init(width: xOffset,
                     height: yOffset)
    }
    
    private let circleMaskOriginalSize: CGSize = .init(width: 7,
                                                       height: 7),
                circleMaskFinalSize: CGSize = .init(width: 1500,
                                                    height: 1500),
                activityIndicatorSize: CGSize = .init(width: 60,
                                                      height: 60)
    
    // MARK: - Padding
    private let loadingIndicatorTopOffset: CGFloat = 30
    
    var body: some View {
        mainSection
            .animation(.spring().speed(0.5),
                       value: model.transitionAnimation)
    }
}

// MARK: - View Sections
extension SplashScreen {
    var mainSection: some View {
        GeometryReader { geom in
            ZStack {
                VStack {
                    Spacer()
                    
                    appLogoSection
                    
                    Spacer()
                }
            }
            .onAppear {
                Task { @MainActor in
                    try await Task.sleep(until: .now + .seconds(0.25),
                                         clock: .continuous)
                
                    withAnimation(.spring(response: 0.9)){ didAppear = true }
                }
                
                model.triggerTransitionAnimation()
            }
            .frame(width: geom.size.width,
                   height: geom.size.height)
            .foregroundColor(model.foregroundColor)
            .background(model.backgroundColor)
        }
        .ignoresSafeArea()
    }
    
    var appLogoSection: some View {
        VStack {
            Group {
                mascotImage
                
                ZStack {
                    if didAppear {
                        appLogoTextImage
                            .transition(.opacity)
                    }
                }
                .overlay {
                    if didAppear {
                        circleMask
                    }
                }
                .zIndex(10)
            }
            
            appSloganTextView
            loadingIndicator
        }
    }
}

// MARK: - Subviews
extension SplashScreen {
    var loadingIndicator: some View {
        Group {
            if didAppear && !model.transitionAnimation {
                ActivityIndicatorView(isVisible: .constant(!model.transitionAnimation),
                                      type: .arcs())
                    .foregroundColor(model.activityIndicatorColor)
                    .frame(width: activityIndicatorSize.width,
                           height: activityIndicatorSize.height)
                    .offset(y: loadingIndicatorTopOffset)
            }
        }
        .transition(
            .scale
            .animation(
                .easeInOut
                    .delay(LaunchScreenManager.displayloadingIndicatorAfterDelay)
            ))
    }
    
    var circleMask: some View {
            Circle()
                .fill(model.circleMaskColor)
                .frame(width: circleMaskSize.width,
                       height: circleMaskSize.height)
                .offset(circleMaskOffset)
                .transition(
                    .offset(CGSize(width: 0,
                                   height: 1000)))
    }
    
    var appSloganTextView: some View {
        Group {
            if didAppear {
                Text(model.sloganText)
                    .withFont(model.appSloganTextFont)
                    .lineLimit(1)
                    .multilineTextAlignment(.center)
                    .minimumScaleFactor(0.9)
                    .scaledToFit()
                    .transition(
                        .offset(CGSize(width: 0,
                                       height: 1500)))
                    .foregroundColor(model.textColor)
            }
        }
    }
    
    var appLogoTextImage: some View {
        model.appLogoTextImage
            .fittedResizableOriginalImageModifier()
            .frame(width: appLogoTextImageSize.width,
                   height: appLogoTextImageSize.height)
            .transition(
                .offset(CGSize(width: 0,
                               height: 1000)))
            .scaledToFit()
    }
    
    var mascotImage: some View {
        model.appMascotImage
            .fittedResizableOriginalImageModifier()
            .frame(width: appMascotImageSize.width,
                   height: appMascotImageSize.height)
            .animation(.spring(),
                       value: didAppear)
            .scaledToFit()
    }
}

struct SplashScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .rootCoordinatorSelector
            .launchScreenCoordinator
            .router
            .view(for: .main)
    }
    
    static var previews: some View {
        getView()
    }
}
