//
//  FonciiApp.swift
//
// Created by Justin Cook on 2/18/23
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture
import FirebaseAuth
import FirebaseCore

//import GoogleSignIn
//import FacebookCore
//import FBSDKCoreKit

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        // Initialize Firebase SDK
        FirebaseApp.configure()
        
//
//        // Initialize Facebook SDK
//        FBSDKCoreKit.ApplicationDelegate.shared.application(
//            application,
//            didFinishLaunchingWithOptions: launchOptions
//        )
//        analytics.evStartSession()

        return true
    }

    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey : Any] = [:]
    ) -> Bool {
//        ApplicationDelegate.shared.application(
//            app,
//            open: url,
//            sourceApplication: options[UIApplication.OpenURLOptionsKey.sourceApplication] as? String,
//            annotation: options[UIApplication.OpenURLOptionsKey.annotation]
//        )
        
        return true
    }

    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data)
    {
//      Auth.auth().setAPNSToken(deviceToken, type: .sandbox)
    }

    func application(_ application: UIApplication,
                     didReceiveRemoteNotification notification: [AnyHashable : Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void)
    {
//      if Auth.auth().canHandleNotification(notification) {
//        completionHandler(.noData)
//        return
//      }
        
        return
    }
}

@main
struct FonciiApp: App {
    /// App Delegate Utilized for third-party services (i.e Firebase)
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    
    // MARK: - Observed Properties
    @StateObject var rootCoordinatorDelegate: RootCoordinatorDelegate = .shared
    @StateObject var appService: AppService = .shared
    
    // MARK: - Convenience variables
    var activeRootCoordinator: any RootCoordinator {
        return rootCoordinatorDelegate
            .activeRootCoordinator!
    }
    
    // MARK: - Styling
    /// Important Note: Get only, making this { get set } disables the app's tint color for some reason
    var backgroundColor: Color {
        return Colors.black_1
    }
    
    var body: some Scene {
        WindowGroup {
            CurrentAppScene
        }
    }
    
    var CurrentAppScene: some View {
        ZStack {
            Group {
                if AppService.isDebug {
//                    activeRootCoordinator
//                        .rootCoordinatorDelegate
//                        .rootCoordinatorSelector
//                        .onboardingCoordinator
//                        .view(for: .selectFavorites)
                    
                    activeRootCoordinator
                        .coordinatorView()
                }
                else {
                    activeRootCoordinator
                        .coordinatorView()
                }
            }
            
            /// Debug Console to display when the app is in a debug environment
            if AppService.isDebug {
                DebugOverlay()
            }
        }
        .onOpenURL { url in
            appService
                .deepLinkManager
                .manage(url)
        }
        .onAppear {}
        .background(backgroundColor)
        .environmentObject(appService)
        .environmentObject(appService.globalViewStore)
        .useAlertManager()
    }
}
