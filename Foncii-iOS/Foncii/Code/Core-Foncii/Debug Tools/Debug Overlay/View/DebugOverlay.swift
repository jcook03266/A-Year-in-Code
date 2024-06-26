//
// DebugOverlay.swift
// Foncii
//
// Created by Justin Cook on 4/27/23 at 6:59 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture

struct DebugOverlay: View {
    // MARK: - Observed
    // Local
    @StateObject var model: DebugOverlayViewModel = .init()
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    /// Observed services to update this overlay when updates are published
    @EnvironmentObject var appService: AppService
    @ObservedObject var tasteProfileManager: UserTasteProfileManager = .shared
    
    // MARK: - Dimensions
    private let toggleButtonSize: CGSize = .init(width: 130, height: 40)
    
    // MARK: - Spacing + Padding
    private let horizontalPadding: CGFloat = 50,
                bottomSectionPadding: CGFloat = 10
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.displayMenu)
            .animation(.spring(),
                       value: model.displayAdvancedNavigationInfo)
    }
}

// MARK: - Sections
extension DebugOverlay {
    var mainSection: some View {
        ZStack {
            GeometryReader { geom in
                Group {
                    if model.displayMenu {
                        ZStack {
                            ScrollView(.vertical) {
                                VStack {
                                    Group {
                                        clientInformation
                                        
                                        deviceInformation
                                        
                                        apiMetrics
                                        
                                        navigationInformation
                                        
                                        userFulfillmentsInformation
                                        
                                        currentUserInformation
                                        
                                        copyrightFooter
                                    }
                                    .multilineTextAlignment(.leading)
                                    .minimumScaleFactor(0.5)
                                    
                                    Spacer()
                                }
                            }
                        }
                        .background(Colors.black_1.opacity(0.75))
                        .foregroundColor(Colors.permanent_white)
                    }
                }
                .transition(.opacity.animation(.easeIn))
            }
            
            overlayToggleButton
        }
    }
}

// MARK: - Subviews
extension DebugOverlay {
    var displayNavigationDumpButton: some View {
        RoundedCTAButton(title: "Toggle Advanced Info",
                         action: {
            model.displayAdvancedNavigationInfo.toggle()
        })
    }
    
    var signInOutButton: some View {
        Group {
            if model.isAuthenticated {
                RoundedCTAButton(title: "Sign Out",
                                 action: model.signOutAction)
            }
            else {
                RoundedCTAButton(title: "Sign In",
                                 action: model.signInAction)
            }
        }
        .transition(.slide.animation(.spring()))
    }
    
    var createTestUserButton: some View {
        Group {
            if !model.isAuthenticated {
                RoundedCTAButton(title: "Create Test User",
                                 action: model.createTestUserAction)
            }
        }
        .transition(.slide.animation(.spring()))
    }
    
    var activateLastActiveDeepLinkButton: some View {
        RoundedCTAButton(title: "Trigger Last Active DeepLink",
                         action: model.triggerLastActiveDeepLinkAction)
    }
    
    var overlayToggleButton: some View {
        GeometryReader { geom in
            VStack {
                Button {
                    HapticFeedbackDispatcher
                        .genericButtonPress()
                    
                    model.toggleButtonAction()
                } label: {
                    ZStack {
                        Rectangle()
                            .fill(Colors.primary_1.opacity(0.75))
                            .cornerRadius(40, corners: [.bottomLeft, .bottomRight])
                            .shadow(radius: 1, y: 3)
                        
                        Text("Debug Overlay")
                            .withFont(.body_bold)
                    }
                    .foregroundColor(Colors.permanent_white)
                }
                .frame(width: toggleButtonSize.width,
                       height: toggleButtonSize.height)
                .buttonStyle(OffsettableButtonStyle(
                    offset: .init(width: 0,
                                  height: -bottomSectionPadding))
                )
                
            }
            .rotationEffect(.degrees(-90))
            .position(x: toggleButtonSize.height/2, y: geom.size.height/2)
        }
        
    }
    
    var divider: some View {
        Divider()
            .frame(height: 0.5)
            .overlay(Colors.medium_1)
    }
    
    var copyrightFooter: some View {
        VStack {
            Text("© Foodie Inc. 2023")
                .withFont(.heading_3_bold)
                .foregroundColor(Colors.primary_1)
        }
    }
    
    var clientInformation: some View {
            VStack(spacing: 5) {
                Group {
                    Text("Debug Overlay")
                        .withFont(.heading_3_bold)
                        .padding(.bottom, 5)
                        .foregroundColor(Colors.primary_1)
                }
                .padding(.horizontal, horizontalPadding)
                
                divider
                    .padding(.bottom, bottomSectionPadding)
                
                Group {
                    Group {
                        Text("Client State:")
                            .withFont(.heading_3_bold)
                        
                        Text("\nLast Update: \(Date.now.toString())")
                        
                        Text("🎬 Onload Tasks Complete: \(model.dependencies.appService.hasCompletedOnloadTasks.description)")
                        
                        Text("🔑 User Authenticated: \(model.isAuthenticated.description)")
                        
                        Text("📶 Client Online: \(model.isClientOnline.description)")
                        
                        Text("📍 Current Location:")
                        Text(model.currentClientLocationDescription)
                    }
                    
                    signInOutButton
                        .padding(.top, 20)
                    
                    createTestUserButton
                }
                .padding(.horizontal, horizontalPadding)
                
                Spacer()
            }
            .withFont(.body)
    }
    
    var deviceInformation: some View {
        VStack {
            Group {
                divider
                Group {
                    Text("Device Properties:")
                        .withFont(.heading_3_bold)
                    
                    Text(model.deviceProperties)
                }
                .padding(.horizontal, horizontalPadding)
            }
            .padding(.bottom, bottomSectionPadding)
        }
        .withFont(.body)
    }
    
    var apiMetrics: some View {
        VStack {
            Group {
                divider
                
                Group {
                    Text("Foncii GQL API Metrics:")
                        .withFont(.heading_3_bold)
                    
                    Text(model.apiMetrics)
                }
                .transition(.slide.animation(.easeIn))
                .padding(.horizontal, horizontalPadding)
            }
            .padding(.bottom, bottomSectionPadding)
        }
        .withFont(.body)
    }
    
    var navigationInformation: some View {
        VStack {
            Group {
                divider
                
                Group {
                    Text("Navigation State:")
                        .withFont(.heading_3_bold)
                    
                    Text(model.navigationInformation)
                    
                    displayNavigationDumpButton
                    
                    if model.displayAdvancedNavigationInfo {
                        Text(model.advancedNavigationInfo)
                    }
                    
                    activateLastActiveDeepLinkButton
                }
                .transition(.slide.animation(.easeIn))
                .padding(.horizontal, horizontalPadding)
            }
            .padding(.bottom, bottomSectionPadding)
        }
        .withFont(.body)
    }
    
    var userFulfillmentsInformation: some View {
        VStack {
            Group {
                divider
                
                Text("User Permissions:")
                    .withFont(.heading_3_bold)
                    .padding(.horizontal, horizontalPadding)
                
                Text(model.userPermissionsInfo)
                
                divider
                
                Text("User Requirements:")
                    .withFont(.heading_3_bold)
                    .padding(.horizontal, horizontalPadding)
                
                Text(model.userRequirementsInfo)
            }
            .padding(.bottom, bottomSectionPadding)
        }
        .withFont(.body)
    }
    
    var currentUserInformation: some View {
        VStack {
            Group {
                divider
                
                Group {
                    Text("Current Foncii User:")
                        .withFont(.heading_3_bold)
                    
                    Text(model.currentFonciiUserInfo)
                }
                .padding(.horizontal, horizontalPadding)
                
                divider
                
                Group {
                    Text("Taste Profile:")
                        .withFont(.heading_3_bold)
                    
                    Text(model.tasteProfileInfo)
                }
                .padding(.horizontal, horizontalPadding)
                
                divider
                
                Group {
                    Text("Current Firebase User:")
                        .withFont(.heading_3_bold)
                    
                    Text(model.currentFirebaseUserInfo)
                }
                .padding(.horizontal, horizontalPadding)
            }
            .padding(.bottom, bottomSectionPadding)
        }
        .withFont(.body)
    }
}

struct DebugOverlay_Previews: PreviewProvider {
    static var previews: some View {
        DebugOverlay()
    }
}
