//
//  MainCoordinatorView.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI

struct MainCoordinatorView: CoordinatedView {
    typealias Router = MainRouter
    typealias Coordinator = MainCoordinator
    typealias ChildTabCoordinator = Foncii.Coordinator
    
    // MARK: - Styling
    private let backgroundColor: Color = Colors.black_1
    
    // MARK: - Observed
    @StateObject var coordinator: MainCoordinator
    
    // MARK: - Convenience
    var currentChildTabCoordinator: any ChildTabCoordinator {
        return coordinator
            .getTabCoordinator(for: currentTab)
    }
    
    var currentTab: MainRoutes {
        return coordinator.currentTab
    }
    
    var statusBarVisibilityForCurrentTab: Bool {
        return currentChildTabCoordinator.statusBarHidden
    }
    
    // MARK: - Navigation States (Part of protocol | can't be privatized)
    @State var sheetItemState: MainRoutes? = nil
    @State var fullCoverItemState: MainRoutes? = nil
    
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
                    .id(coordinator.currentTab)
                    .zIndex(1)
                    .transition(.opacity)
                    .opacity(show ? 1 : 0)
                
                tabbar
                    .zIndex(2)
                    .ignoresSafeArea(.keyboard)
            }
            .background(backgroundColor)
            .animation(.easeInOut,
                       value: coordinator.currentTab)
        }
                    .onAppear {
                        withAnimation(rootSwitchAnimation) {
                            show = true
                        }
                    }
                    .statusBarHidden(statusBarVisibilityForCurrentTab)
    }
}

// MARK: - Tabbar Implementation
extension MainCoordinatorView {
    var tabbar: some View {
        VStack(spacing: 0) {
            Spacer()
            coordinator.router.getTabbar()
        }
    }
}

struct MainCoordinatorView_Previews: PreviewProvider {
    static var previews: some View {
        MainCoordinatorView(
            coordinator: RootCoordinatorDelegate
                .shared
                .getRootCoordinatorFor(root: .mainCoordinator)
            as! MainCoordinator)
    }
}

