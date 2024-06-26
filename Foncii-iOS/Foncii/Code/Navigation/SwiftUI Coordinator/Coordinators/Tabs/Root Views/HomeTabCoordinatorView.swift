//
// HomeTabCoordinatorView.swift
// Foncii
//
// Created by Justin Cook on 6/16/23 at 2:52 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct HomeTabCoordinatorView: CoordinatedView {
    typealias Router = HomeTabRouter
    typealias Coordinator = HomeTabCoordinator
    
    // MARK: - Styling
    private let backgroundColor: Color = Colors.black_1
    
    // MARK: - Observed
    @StateObject var coordinator: HomeTabCoordinator
    
    // MARK: - Navigation States
    @State var sheetItemState: HomeRoutes? = nil
    @State var fullCoverItemState: HomeRoutes? = nil
    
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
                        Group {
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
                    }
                
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
