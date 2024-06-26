//
//  OnboardingCoordinatorView.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI

struct OnboardingCoordinatorView: CoordinatedView {
    typealias Router = OnboardingRouter
    typealias Coordinator = OnboardingCoordinator
    
    // MARK: - Styling
    private let backgroundColor: Color = Colors.black_1
    
    // MARK: - Observed
    @StateObject var coordinator: OnboardingCoordinator
    
    // MARK: - Navigation States
    @State var sheetItemState: OnboardingRoutes? = nil
    @State var fullCoverItemState: OnboardingRoutes? = nil
    
    // MARK: - Animation States for blending root switches
    @State var show: Bool = false
    
    var rootSwitchAnimationBlendDuration: CGFloat = RootCoordinatorDelegate.rootSwitchAnimationBlendDuration
    var rootSwitchAnimation: Animation {
        return .linear(duration: rootSwitchAnimationBlendDuration)
    }
    
    var body: some View {
        synchronize(publishedValues: [$coordinator.fullCoverItem, $coordinator.sheetItem],
                    with: [$fullCoverItemState, $sheetItemState]) {
            ZStack {
                NavigationStack(path: $coordinator.navigationPath) {
                    coordinator.rootView
                        .fullScreenCover(item: $fullCoverItemState,
                                         onDismiss: {
                            DispatchQueue.main.async {
                                coordinator.dismissFullScreenCover()
                            }
                        },
                                         content: { route in coordinator.router.view(for: route) })
                        .sheet(item: $sheetItemState,
                               onDismiss: {
                            DispatchQueue.main.async {
                                coordinator.dismissSheet()
                            }
                        },
                               content: { route in coordinator.router.view(for: route) })
                        .navigationDestination(for: Router.Route.self,
                                               destination: { route in coordinator.router.view(for: route) })
                }
                .background(backgroundColor)
                
                coordinator
                    .topLevelTransientView
            }
            .opacity(show ? 1 : 0)
            .onAppear {
                withAnimation(rootSwitchAnimation) {
                    show = true
                }
            }
            .statusBarHidden(coordinator.statusBarHidden)
        }
    }
}
