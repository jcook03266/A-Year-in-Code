//
// ProfilePictureComponentViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/25/23 at 8:08 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import SwiftUI

/// A component that displays the current
/// user's profile picture and their profile task
/// completion percentage. The component's
/// internal data is pulled from the app's state and
/// only the button press action is determined by an
/// external closure, such as on the profile screen
/// when the user presses the profile picture to view
/// their profile tasks
class ProfilePictureComponentViewModel: GenericViewModel {
    // MARK: - Properties
    var profilePictureURL: URL? {
        return dependencies
            .userManager
            .currentUser?
            .profilePictureURL?
            .asURL
    }
    
    /// Rounded percentage casted to an integer as a string
    var userProfileTaskProgressPercentageString: String {
        let roundedPercentageString = Int(userProfileTaskProgressPercentage).description
        
        return "\(roundedPercentageString)%"
    }
    
    var userProfileTaskProgressPercentage: CGFloat {
        let roundedPercentage = dependencies
            .userManager
            .currentUser?
            .profileTaskCompletionPercentage
            .rounded() ?? 0
        
        return roundedPercentage
    }
    
    var userCompletedAllProfileTasks: Bool {
        return dependencies
            .userManager
            .currentUser?
            .didCompleteAllProfileTasks ?? false
    }
    
    // MARK: - Published
    @Published var profilePictureImage: Image?
    /// Used to determine the current state of the async loading of the specified image asset
    @Published var isLoading: Bool = false
    /// Used to animate the progress view around the profile picture
    @Published var didAppear: Bool = false
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let userManager: UserManager = inject(),
            imageDownloaderService: ImageDownloaderService = inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Styling
    // Assets
    static let defaultProfilePicture: Image = Icons.getIconImage(named: .user_profile_placeholder)
    
    // Colors
    let progressBarGradient: LinearGradient = Colors.profileProgressBarGradient,
textColor: Color = Colors.permanent_white,
shadowColor: Color = Colors.shadow,
        shimmerViewColor: Color = Colors.neutral_1,
        imageOverlayColor: Color = Colors.black_1.opacity(0.4)
    
    // Font
    let percentageFont: FontStyleRepository = .heading_3_bold,
        textFont: FontStyleRepository = .caption_2
    
    // MARK: - Localized Text
    let completeTextString: String = LocalizedStrings.getLocalizedString(for: .COMPLETE).uppercased()
    
    // MARK: - Actions
    /// Passed closure to trigger some external logic tied to this component
    private var onSelectAction: (() -> Void)
    
    var selectionAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.onSelectAction()
            
            HapticFeedbackDispatcher
                .genericButtonPress()
        }
    }
    
    init(onSelectAction: @escaping(() -> Void)) {
        self.onSelectAction = onSelectAction
    }
    
    func load() {
        Task { @MainActor in
            await fetchProfilePicture()
        }
    }
    
    func reload() {
        Task { @MainActor in
            await fetchProfilePicture()
        }
    }
    
    /**
     * Asynchronously fetches and parses the image data specified by
     * the current user's profile picture image URL
     * Note: This function also allows the image to be cached in the file
     * manager for later use
     */
    @MainActor private func fetchProfilePicture() async {
            if let profilePictureURL = profilePictureURL {
                self.isLoading = true
                
                let fetchedImage = await dependencies
                    .imageDownloaderService
                    .getImage(for: profilePictureURL,
                              canCacheImage: true)
                
                /// Fall back to placeholder if the fetched image can't be downloaded
                guard let fetchedImage = fetchedImage
                else {
                    self.profilePictureImage = ProfilePictureComponentViewModel.defaultProfilePicture
                    self.isLoading = false
                    
                    return
                }
                
                self.profilePictureImage = Image(uiImage: fetchedImage)
                self.isLoading = false
            }
        else {
            self.profilePictureImage = ProfilePictureComponentViewModel.defaultProfilePicture
        }
    }
}
