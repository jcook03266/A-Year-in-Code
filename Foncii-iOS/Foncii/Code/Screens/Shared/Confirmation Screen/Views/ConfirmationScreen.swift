//
//  ConfirmationScreen.swift
//  Foncii
//
//  Created by Justin Cook on 2/19/23.
//

import SwiftUI

struct ConfirmationScreen<coordinatorType: Coordinator>: View {
    // MARK: - Observed
    @StateObject var model: ConfirmationScreenViewModel<coordinatorType>
    
    // MARK: - Dimensions
    private let mascotRingBorderImageSize: CGSize = .init(width: 69.7,
                                                     height: 72.39),
                mascotImageSize: CGSize = .init(width: 98.48,
                                                height: 65.5),
        /// How much the mascot has to be offset by to fit within the ring border
                mascotImageOffset: CGSize = .init(width: 20,
                                                  height: 22)
    
    // MARK: - Padding
    private let confirmationMessageTopPadding: CGFloat = 21.45
    
    var body: some View {
        mainSection
            .onAppear {
                model.triggerDidAppearAnimation()
            }
            .animation(.spring(),
                       value: model.didAppear)
            .ignoresSafeArea(.keyboard)
    }
}

// MARK: - Sections
extension ConfirmationScreen {
    var mainSection: some View {
        GeometryReader { geom in
            VStack(spacing: 0) {
                mascotAnimationSection
                confirmationMessage
            }
            .frame(width: geom.size.width,
                   height: geom.size.height)
        }
        .background(model.backgroundColor)
        .opacity(model.didAppear ? 1 : 0)
    }
    
    var mascotAnimationSection: some View {
        ZStack {
            Group {
                mascotRingBorderImage
                mascotImage
            }
            .foregroundColor(model.imageTintColor)
        }
    }
}

// MARK: - Subviews
extension ConfirmationScreen {
    var confirmationMessage: some View {
        Text(model.confirmationMessage)
            .withFont(model.messageFont,
                      weight: model.messageFontWeight)
            .lineLimit(1)
            .foregroundColor(model.textColor)
            .padding(.top,
                     confirmationMessageTopPadding)
            .offset(y: model.didAppear ? .zero : 100)
    }
    
    var mascotImage: some View {
        model
            .mascotImage
            .fittedResizableTemplateImageModifier()
            .frame(width: mascotImageSize.width,
                   height: mascotImageSize.height)
            .padding(.top, mascotImageOffset.height)
            .padding(.trailing, mascotImageOffset.width)
            .offset(x: model.didAppear ? 0 : -1000)
            .animation(.spring(dampingFraction: 0.9),
                       value: model.didAppear)
    }
    
    var mascotRingBorderImage: some View {
        model
            .mascotRingBorderImage
            .fittedResizableTemplateImageModifier()
            .frame(width: mascotRingBorderImageSize.width,
                   height: mascotRingBorderImageSize.height)
            .rotationEffect(model.didAppear ? .degrees(0) : .degrees(-135))
            .animation(.spring(),
                       value: model.didAppear)
    }
}

struct ConfirmationScreen_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .rootCoordinatorSelector
            .onboardingCoordinator
            .router
            .confirmationScreen(destinationRoute: .main,
                                confirmationMessage: LocalizedStrings
             .getLocalizedString(for: .CONFIRMATION_MESSAGE_1))
    }
    
    static var previews: some View {
        getView()
    }
}
