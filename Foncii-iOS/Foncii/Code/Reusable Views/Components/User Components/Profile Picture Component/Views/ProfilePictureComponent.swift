//
// ProfilePictureComponent.swift
// Foncii
//
// Created by Justin Cook on 6/25/23 at 8:54 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture
import Shimmer

struct ProfilePictureComponent: View {
    // MARK: - Observed
    // Local
    @StateObject var model: ProfilePictureComponentViewModel
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - Image Loading Shimmer Placeholder Properties
    private let shimmerDuration: CGFloat = 2,
                /// Start immediately
                shimmerDelay: CGFloat = 0,
                shimmerBounce: Bool = false
    
    // MARK: - Dimensions
    private let size: CGSize = .init(width: 95,
                                     height: 95),
                progressBarWidth: CGFloat = 3.34,
                shadowRadius: CGFloat = 4
    
    // MARK: - Spacing + Padding
    private let shadowOffset: CGSize = .init(width: 3,
                                             height: 4)
    
    
    var body: some View {
        mainSection
            .animation(.easeInOut,
                       value: model.isLoading)
            .animation(.spring(),
                       value: model.profilePictureImage)
            .onAppear {
                onloadTasks()
                
                /// Customizing pull to refresh appearance
                UIRefreshControl.appearance().tintColor = Colors.getUIColor(named: .primary_1)
            }
    }
}

// MARK: - Functions
extension ProfilePictureComponent {
    func onloadTasks() {
        Task { @MainActor in
            if model.didAppear {
                model.reload()
            }
            else {
                model.load()
            }
            
            model.didAppear = true
        }
    }
}

// MARK: - Sections
extension ProfilePictureComponent {
    var mainSection: some View {
        Button {
            model.selectionAction()
        } label: {
            profilePictureSection
        }
        .shadow(color: model.shadowColor,
                radius: shadowRadius,
                x: shadowOffset.width,
                y: shadowOffset.height)
    }
    
    var profilePictureSection: some View {
        ZStack {
            profilePictureImageView
                .overlay {
                    /// Overlay the completion  percentage prompt if the user
                    /// hasn't completed their profile tasks yet
                    Group {
                        progressBarView
                        
                        if !model.userCompletedAllProfileTasks {
                            percentageCompletionTextView
                        }
                    }
                }
        }
        .frame(width: size.width,
               height: size.height)
    }
}

// MARK: - Subviews
extension ProfilePictureComponent {
    var percentageCompletionTextView: some View {
        HStack {
            VStack(spacing: 0) {
                Text(model.userProfileTaskProgressPercentageString)
                    .withFont(model.percentageFont)
                    .minimumScaleFactor(0.75)
                
                Text(model.completeTextString)
                    .withFont(model.textFont)
                    .minimumScaleFactor(0.5)
            }
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.textColor)
            .lineLimit(1)
            .multilineTextAlignment(.center)
            .scaledToFit()
        }
    }
    
    var progressBarView: some View {
        ZStack {
            if !model.userCompletedAllProfileTasks {
                Circle()
                    .fill(model.imageOverlayColor)
            }
            
            Circle()
                .trim(from: 0, to: model.userProfileTaskProgressPercentage)
                .stroke(model.progressBarGradient,
                        style: .init(lineWidth: progressBarWidth,
                                     lineCap: .round))
                .rotationEffect(.degrees(90))
                .padding(.all,
                         progressBarWidth/2)
        }
    }
    
    var profilePictureImageView: some View {
        ZStack {
            Circle().fill(Color.clear)
            
            Group {
                if let image = model.profilePictureImage {
                    image
                        .filledResizableOriginalImageModifier()
                }
                else {
                    placeholderShimmerView
                }
            }
            .zIndex(1)
            .transition(.opacity)
            .clipShape(Circle())
        }
    }
    
    var placeholderShimmerView: some View {
        Circle()
            .foregroundColor(model.shimmerViewColor)
            .shimmering(active: model.isLoading,
                        duration: shimmerDuration,
                        bounce: shimmerBounce,
                        delay: shimmerDelay)
    }
}

struct ProfilePictureComponent_Previews: PreviewProvider {
    static var previews: some View {
        GeometryReader { geom in
            ProfilePictureComponent(
                model: .init(onSelectAction: {})
            )
            .frame(width: geom.size.width,
                   height: geom.size.height)
        }
        .background(Colors.dark_grey_1)
    }
}
