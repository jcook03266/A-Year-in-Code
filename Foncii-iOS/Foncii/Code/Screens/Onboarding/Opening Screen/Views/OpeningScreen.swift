//
//  OpeningScreen.swift
//  Foncii
//
//  Created by Justin Cook on 2/18/23.
//

import SwiftUI

struct OpeningScreen: View {
    // MARK: - Observed
    @StateObject var model: OpeningScreenViewModel
    
    // MARK: - Dimensions
    private let appLogoTextImageSize: CGSize = .init(width: 150,
                                                     height: 50)
    
    // MARK: - Padding + Spacing
    private let bottomPadding: CGFloat = 48.5,
                appBrandingContentItemSpacing: CGFloat = 16,
                appBrandingContentBottomPadding: CGFloat = 24,
                ctaButtonSectionItemSpacing: CGFloat = 16
    
    // MARK: - Animation
    // States
    @State private var didAppear: Bool = false
    
    // Offsets
    private let topBackgroundArtOffset: CGSize = .init(width: 0,
                                                       height: 100),
                bottomBackgroundArtOffset: CGSize = .init(width: 0,
                                                          height: 300)
    
    var body: some View {
        mainSection
            .onAppear {
                didAppear = true
            }
    }
}

// MARK: - Sections
extension OpeningScreen {
    var mainSection: some View {
        GeometryReader { geom in
            ScrollView(.vertical,
                       showsIndicators: false) {
                ZStack {
                    contentSection
                }
                .frame(minWidth: geom.size.width,
                       minHeight: geom.size.height)
            }
                       .background {
                           backgroundSection
                       }
        }
    }
    
    var backgroundSection: some View {
        GeometryReader { geom in
            VStack(spacing: 0) {
                topBackgroundArt
                bottomBackgroundArt
                Spacer()
            }
            .frame(minWidth: geom.size.width,
                   minHeight: geom.size.height)
            .background(model.backgroundGradient)
            .ignoresSafeArea()
        }
    }
    
    var contentSection: some View {
        VStack {
            Spacer()
            
            appBrandingSection
            ctaButtonSection
        }
    }
    
    var appBrandingSection: some View {
        VStack(spacing: appBrandingContentItemSpacing) {
            appLogoTextImage
            appSloganTextView
        }
        .padding(.bottom,
                 appBrandingContentBottomPadding)
    }
    
    var ctaButtonSection: some View {
        VStack(spacing: ctaButtonSectionItemSpacing) {
            loginButton
            signUpButton
        }
        .padding(.bottom, bottomPadding)
    }
}

// MARK: - Subviews
extension OpeningScreen {
    var topBackgroundArt: some View {
            Group {
                if didAppear {
                    VStack {
                        model.topBackgroundArt
                            .fittedResizableOriginalImageModifier()
                    }
                }
            }
            .transition(.offset(bottomBackgroundArtOffset))
        .animation(
            .spring()
            .speed(0.8),
            value: didAppear)
    }
    
    var bottomBackgroundArt: some View {
        Group {
            if didAppear {
                VStack {
                    model.bottomBackgroundArt
                        .fittedResizableOriginalImageModifier()
                }
            }
        }
            .transition(.offset(bottomBackgroundArtOffset))
        .animation(
            .spring()
            .speed(0.6),
            value: didAppear)
    }
    
    var appLogoTextImage: some View {
        model.appLogoTextImage
            .fittedResizableOriginalImageModifier()
            .frame(width: appLogoTextImageSize.width,
                   height: appLogoTextImageSize.height)
            .transition(
                .offset(CGSize(width: 0,
                               height: 1000)))
    }
    
    var appSloganTextView: some View {
        Text(model.sloganText)
            .withFont(model.appSloganTextFont)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .minimumScaleFactor(0.9)
            .transition(
                .offset(CGSize(width: 0,
                               height: 1500)))
            .foregroundColor(model.textColor)
    }
    
    var loginButton: some View {
        RoundedCTAButton(useBorder: true,
                         isOpaque: true,
                         title: model.loginButtonTitle,
                         action: model.loginButtonAction)
    }
    
    var signUpButton: some View {
        RoundedCTAButton(title: model.signUpButtonTitle,
                         action: model.signUpButtonAction)
    }
}

struct OpeningScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .rootCoordinatorSelector
            .onboardingCoordinator
            .router
            .view(for: .main)
    }
    
    static var previews: some View {
        getView()
    }
}
