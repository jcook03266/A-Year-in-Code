//
// MainTabbar.swift
// Foncii
//
// Created by Justin Cook on 5/25/23 at 3:55 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct MainTabbar: View {
    // MARK: - Observed
    @StateObject var model: MainTabbarViewModel
    
    // MARK: - Dimensions
    private let tabbarHeight: CGFloat = 56,
                shadowRadius: CGFloat = 4
    
    // MARK: - Spacing + Padding
    private let tabButtonVerticalPadding: CGFloat = 16,
                shadowOffset: CGSize = .init(width: 0,
                                             height: -1)
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.currentTab)
    }
}

// MARK: - Functions
extension MainTabbar {
    /// Factory method for generating the modular buttons for each tabbar button
    func createTabbarButton(for tab: MainRoutes) -> some View {
        GeometryReader { geom in
            HStack {
                Spacer()
                Button(action: { model.tabSelectionAction(tab)}
                ){
                    VStack {
                        model.getIcon(for: tab)
                            .fittedResizableTemplateImageModifier()
                            .foregroundColor(model.getIconColor(for: tab))
                            .padding(.vertical,
                                     tabButtonVerticalPadding)
                    }
                }
                .id(model.isTabSelected(tab: tab))
                .buttonStyle(.genericSpringyShrink)
                .transition(.opacity.animation(.easeInOut))
                .frame(width: geom.size.width/3,
                       height: tabbarHeight)
                Spacer()
            }
        }
    }
}

// MARK: - Sections
extension MainTabbar {
    var mainSection: some View {
        ZStack {
            tabbarBody
            contentSection
        }
        .frame(height: tabbarHeight)
    }
    
    var contentSection: some View {
        HStack(spacing: 0) {
            homeTabButton
            mapTabButton
            profileTabButton
        }
    }
}

// MARK: - Subviews
extension MainTabbar {
    var tabbarBody: some View {
        Rectangle()
            .fill(model.tabbarBackgroundColor)
            .shadow(color: model.shadowColor,
                    radius: shadowRadius,
                    x: shadowOffset.width,
                    y: shadowOffset.height)
            .ignoresSafeArea()
    }
    
    var homeTabButton: some View {
        createTabbarButton(for: .home)
    }
    
    var mapTabButton: some View {
        createTabbarButton(for: .map)
    }
    
    var profileTabButton: some View {
        createTabbarButton(for: .profile)
    }
}

struct MainTabbar_Previews: PreviewProvider {
    static func buildViewModel() -> MainTabbarViewModel {
        let coordinator: MainCoordinator = RootCoordinatorDelegate
            .shared
            .getRootCoordinatorFor(root: .mainCoordinator) as! MainCoordinator
        
        return .init(coordinator: coordinator,
                     router: coordinator.router)
    }
    
    static var previews: some View {
        VStack {
            Spacer()
            MainTabbar(model: buildViewModel())
        }
        .background(Colors.black_1)
    }
}
