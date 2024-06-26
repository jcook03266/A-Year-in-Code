//
// MapTabCoordinatorView.swift
// Foncii
//
// Created by Justin Cook on 6/26/23 at 3:53 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct MapTabCoordinatorView: CoordinatedView {
    typealias Router = MapTabRouter
    typealias Coordinator = MapTabCoordinator
    
    // MARK: - Styling
    private let backgroundColor: Color = Colors.black_1
    
    // MARK: - Observed
    @StateObject var coordinator: MapTabCoordinator
    
    // MARK: - Navigation States
    @State var sheetItemState: MapRoutes? = nil
    @State var fullCoverItemState: MapRoutes? = nil
    
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


