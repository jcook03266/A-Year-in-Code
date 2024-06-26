//
// TasteProfileQuestionnaireScreenViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 8:39 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import OrderedCollections
import Combine

class TasteProfileQuestionnaireScreenViewModel: CoordinatedGenericViewModel {
    typealias coordinator = ProfileTabCoordinator
    
    // MARK: - Properties
    var coordinator: coordinator
    
    // Navigation
    let totalPages: Int = 8 // To be 9
    
    // Table of all supported pages for this questionnaire
    enum Pages: Int, Hashable, CaseIterable {
        case adventureLevelPage = 0
        case drinkPreferencePage = 1
        case restaurantRatingImportancePage = 2
        // case foodAtmospherePage - Not used for now
        case preferredMealTypesPage = 3
        case preferredPriceLevelsPage = 4
        case distancePreferencePage = 5
        case cuisineSelectionPage = 6
        case foodRestrictionPage = 7
    }
    
    /// The current page being displayed, as an enum
    /// (adventure page is the default)
    var currentPageAsEnum: Pages {
        return Pages.init(rawValue: currentPageIndex) ?? .adventureLevelPage
    }
    
    var lastPageIndex: Int = 0
    
    // Limits
    let minimumPageIndex: Int = 0
    
    var maxPageIndex: Int {
        return totalPages - 1
    }
    
    // MARK: - Published
    @Published var currentPageIndex: Int = 0
    
    // MARK: - Subscriptions
    private var cancellables: Set<AnyCancellable> = []
    private let scheduler: DispatchQueue = .main
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let userManager: UserManager = inject(),
    staticAssetController: StaticAssetController = inject(),
    userTasteProfileManager: UserTasteProfileManager = inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Styling
    // Assets
    let appIcon: Image = Images.getImage(named: .foncii_logo_mascot_accent_transparent)
    
    // Colors
    let backgroundColor: Color = Colors.black_1,
        pageTitleColor: Color = Colors.permanent_white
    
    // Fonts
    let pageTitleFont: FontStyleRepository = .subtitle,
        pageTitleFontWeight: UIFont.Weight = .semibold
    
    // MARK: - Localized Text
    let nextButtonTitle: String = LocalizedStrings.getLocalizedString(for: .NEXT),
        updateButtonTitle: String = LocalizedStrings.getLocalizedString(for: .UPDATE),
        skipButtonTitle: String = LocalizedStrings.getLocalizedString(for: .SKIP)
    
    // MARK: - Convenience
    var currentPageTitle: String {
        switch currentPageAsEnum {
        case .adventureLevelPage:
            return LocalizedStrings.getLocalizedString(for: .TASTE_PROFILE_ADVENTURE_LEVEL_QUESTION_PAGE_HEADER)
        case .drinkPreferencePage:
            return LocalizedStrings.getLocalizedString(for: .TASTE_PROFILE_DRINK_PREFERENCE_QUESTION_PAGE_HEADER)
        case .restaurantRatingImportancePage:
            return LocalizedStrings.getLocalizedString(for: .TASTE_PROFILE_RESTAURANT_RATING_IMPORTANCE_LEVEL_QUESTION_PAGE_HEADER)
        case .preferredMealTypesPage:
            return LocalizedStrings.getLocalizedString(for: .TASTE_PROFILE_PREFERRED_MEAL_TYPES_QUESTION_PAGE_HEADER)
        case .preferredPriceLevelsPage:
            return LocalizedStrings.getLocalizedString(for: .TASTE_PROFILE_PREFERRED_PRICE_LEVELS_QUESTION_PAGE_HEADER)
        case .distancePreferencePage:
            return LocalizedStrings.getLocalizedString(for: .TASTE_PROFILE_DISTANCE_PREFERENCE_LEVEL_QUESTION_PAGE_HEADER)
        case .cuisineSelectionPage:
            return LocalizedStrings.getLocalizedString(for: .TASTE_PROFILE_CUISINE_PREFERENCE_QUESTION_PAGE_HEADER)
        case .foodRestrictionPage:
            return LocalizedStrings.getLocalizedString(for: .TASTE_PROFILE_FOOD_RESTRICTION_PREFERENCE_QUESTION_PAGE_HEADER)
        }
    }
    
    var isClientOnline: Bool {
        AppService
            .shared
            .getCurrentState(of: \.clientState)
            .isClientOnline
    }
    
    // Navigation History for animating transitions
    var didMoveForwards: Bool {
        return lastPageIndex < currentPageIndex
    }
    
    var didMoveBackwards: Bool {
        return lastPageIndex > currentPageIndex
    }
    
    var shouldDisplayUpdateButton: Bool {
        return isOnLastPage
    }
    
    var isOnLastPage: Bool {
        return currentPageIndex == maxPageIndex
    }
    
    var isOnFirstPage: Bool {
        return currentPageIndex == minimumPageIndex
    }
    
    var updateButtonEnabled: Bool {
        return isClientOnline && didChangesOccur()
    }
    
    var nextButtonEnabled: Bool {
        return currentPageIndex < maxPageIndex
    }
    
    var skipButtonEnabled: Bool {
        return !isOnLastPage
    }
    
    /// One indexed index of the current page index (zero-indexed)
    var currentPage: Int {
        return currentPageIndex + 1
    }
    
    // Supported Static Assets
    private var supportedCuisinesTypes: OrderedSet<Cuisine> {
        return dependencies
            .staticAssetController
            .cuisines
    }
    
    private var supportedFoodRestrictionTypes: OrderedSet<FoodRestriction> {
        return dependencies
            .staticAssetController
            .foodRestrictions
    }
    
    private var supportedMealTypes: OrderedSet<MealType> {
        return dependencies
            .staticAssetController
            .mealTypes
    }
    
    private var supportedPriceLevels: Dictionary<Int, Int> {
        return dependencies
            .staticAssetController
            .priceLevels
    }
    
    // Initial Taste Profile Properties
    private var userTasteProfile: UserTasteProfile? {
        return dependencies
            .userTasteProfileManager
            .tasteProfile
    }
    
    private var initialAdventureLevel: Int? {
        return userTasteProfile?.adventureLevel
    }
    
    // Default is 1 | false always, 0 means the user prefers drinks aka true
    private var initialDrinkPreference: Int {
        guard let userTasteProfile = userTasteProfile
        else { return 1 }
        
        return userTasteProfile.prefersDrinks ? 0 : 1
    }
    
    private var initialRatingImportanceLevel: Int? {
        return userTasteProfile?.restaurantRatingImportanceLevel
    }
    
    // TODO: Insert Atmosphere balance here
    
    private var initialPreferredMealTypes: [MealType] {
        guard let userTasteProfile = userTasteProfile
        else { return [] }
        
        return userTasteProfile
            .preferredMealTypes
            .compactMap { preferredMealTypeID in
                return supportedMealTypes
                    .first { $0.id == preferredMealTypeID }
            }
    }
    
    /// Maps the numerical price levels to their corresponding indices [1, 2, 3] etc
    private var initialPreferredPriceLevels: [Int] {
        return userTasteProfile?.preferredPriceLevels
            .compactMap({ numericalPriceLevel in
                return supportedPriceLevels.first { (_, value) in
                    value == numericalPriceLevel
                }?.key
            }) ?? []
    }
    
    private var initialDistancePreferenceLevel: Int? {
        return userTasteProfile?.distancePreferenceLevel
    }
    
    private var initiallySelectedFoodRestrictionTypes: [FoodRestriction] {
        guard let userTasteProfile = userTasteProfile
        else { return [] }
        
        return userTasteProfile
            .foodRestrictions
            .compactMap { foodRestrictionID in
                return supportedFoodRestrictionTypes
                    .first { $0.id == foodRestrictionID }
            }
    }
    
    private var initiallyFavoritedCuisineTypes: [Cuisine] {
        guard let userTasteProfile = userTasteProfile
        else { return [] }
        
        return userTasteProfile
            .favoriteCuisines
            .compactMap { favoriteCuisineID in
                return supportedCuisinesTypes
                    .first { $0.id == favoriteCuisineID }
            }
    }
    
    // Selections / Pending Changes
    private var selectedAdventureLevel: Int? {
        return adventureLevelQuestionScreenViewModel
            .question
            .indicesOfSelectedAnswers
            .first
    }
    
    // Default is 1 always [Drinks not preferred]
    // 0 == true the user prefers drinks, 1 == false, they're
    // not big on drinks
    private var selectedDrinkPreference: Int {
        return drinkPreferenceQuestionScreenViewModel
            .question
            .indicesOfSelectedAnswers
            .first ?? 1
    }
    
    private var selectedRatingImportanceLevel: Int? {
        return restaurantRatingImportanceLevelQuestionScreenViewModel
            .question
            .indicesOfSelectedAnswers
            .first
    }
    
    // TODO: Insert Atmosphere balance here
    
    /// Note: The indices of the meal types match up with the indices of the
    /// question's answers, so no need to compare the string description of each
    /// answer to the actual meal type's description, the identifiers and indices match
    private var preferredMealTypesSelections: [MealType] {
        return preferredMealTypesQuestionScreenViewModel
            .question
            .indicesOfSelectedAnswers
            .compactMap { selectedAnswerIndex in
                return supportedMealTypes
                    .first { $0.id == String(selectedAnswerIndex) }
            }
    }
    
    private var preferredPriceLevelSelections: [Int] {
        return preferredPriceLevelsQuestionScreenViewModel
            .question
            .indicesOfSelectedAnswers
    }
    
    private var selectedDistancePreferenceLevel: Int? {
        return distancePreferenceLevelQuestionScreenViewModel
            .question
            .indicesOfSelectedAnswers
            .first
    }
    
    var cuisineSelections: [Cuisine] {
        return Array(cuisineSelectionScreenViewModel
            .selectedCuisines)
    }
    
    var foodRestrictionSelections: [FoodRestriction] {
        return Array(foodRestrictionSelectionScreenViewModel
            .selectedFoodRestrictions)
    }
    
    // MARK: - Actions
    var nextPageNavigationAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.navigateForward()
        }
    }
    
    var updateButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self,
                  isClientOnline
            else { return }
            
            self.updateTasteProfile()
        }
    }
    
    var backButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            /// Dismiss the view when the user is on the first page, else go backwards
            if isOnFirstPage {
                self.dismiss()
            }
            else {
                self.navigateBackward()
            }
        }
    }
    
    var skipButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.skipToLastPage()
        }
    }
    
    // MARK: - Models
    // Multiple Choice Questions
    var adventureLevelQuestionScreenViewModel: TasteProfileMCQScreenViewModel!,
        drinkPreferenceQuestionScreenViewModel: TasteProfileMCQScreenViewModel!,
        restaurantRatingImportanceLevelQuestionScreenViewModel: TasteProfileMCQScreenViewModel!,
        foodAtmosphereServiceBalanceQuestionScreenViewModel: TasteProfileMCQScreenViewModel!, // Not used
        preferredMealTypesQuestionScreenViewModel: TasteProfileMCQScreenViewModel!,
        preferredPriceLevelsQuestionScreenViewModel: TasteProfileMCQScreenViewModel!,
        distancePreferenceLevelQuestionScreenViewModel: TasteProfileMCQScreenViewModel!
    
    // Cuisine and Dietary Preference Selectors
    var cuisineSelectionScreenViewModel: CuisineSelectionScreenViewModel!,
        foodRestrictionSelectionScreenViewModel: FoodRestrictionSelectionScreenViewModel!
    
    // Pagination Indicator
    var pageIndicatorViewModel: DotPageIndicatorViewModel!
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
        
        initModels()
        addSubscribers()
    }
    
    // MARK: - Subscriptions
    private func addSubscribers() {
        /// Listen for selections from the enumerated questions
        /// Only listening for updates to these two since the update button needs to respond if a selection
        /// is made on the last screen, no need for any other listeners since updates are published
        /// when the user navigates
        self.cuisineSelectionScreenViewModel
            .$selectedCuisines
            .receive(on: scheduler)
            .sink { [weak self] _ in
                guard let self = self
                else { return }
                
                self.objectWillChange.send()
            }
            .store(in: &cancellables)
        
        self.foodRestrictionSelectionScreenViewModel
            .$selectedFoodRestrictions
            .receive(on: scheduler)
            .sink { [weak self] _ in
                guard let self = self
                else { return }
                
                self.objectWillChange.send()
            }
            .store(in: &cancellables)
    }
    
    private func initModels() {
        // Multiple Choice Questions
        adventureLevelQuestionScreenViewModel = .init(question: TasteProfileMCQSelector.adventureLevelQuestion)
        /// Fill in initial selections using user's existing taste profile
        adventureLevelQuestionScreenViewModel
            .selectAnswerWithIndex(index: initialAdventureLevel)
        
        drinkPreferenceQuestionScreenViewModel = .init(question: TasteProfileMCQSelector.drinkPreferenceQuestion)
        /// Fill in initial selections using user's existing taste profile
        drinkPreferenceQuestionScreenViewModel
            .selectAnswerWithIndex(index: initialDrinkPreference)
        
        restaurantRatingImportanceLevelQuestionScreenViewModel = .init(question: TasteProfileMCQSelector.restaurantRatingImportanceLevelQuestion)
        /// Fill in initial selections using user's existing taste profile
        restaurantRatingImportanceLevelQuestionScreenViewModel
            .selectAnswerWithIndex(index: initialRatingImportanceLevel)
        
        foodAtmosphereServiceBalanceQuestionScreenViewModel = .init(question: TasteProfileMCQSelector.foodAtmosphereServiceBalanceQuestion)
        /// Fill in initial selections using user's existing taste profile
        
//        foodAtmosphereServiceBalanceQuestionScreenViewModel
//            .selectAnswerWithIndex(index: initialRatingImportanceLevel)
        
        preferredMealTypesQuestionScreenViewModel = .init(question: TasteProfileMCQSelector.preferredMealTypesQuestion)
        /// Fill in initial selections using user's existing taste profile
        initialPreferredMealTypes
            .forEach {
                guard let answerIndex = Int($0.id)
                else { return }
                
                preferredMealTypesQuestionScreenViewModel
                    .selectAnswerWithIndex(index: answerIndex)
            }
        
        preferredPriceLevelsQuestionScreenViewModel = .init(question: TasteProfileMCQSelector.preferredPriceLevelsQuestion)
        /// Fill in initial selections using user's existing taste profile
        initialPreferredPriceLevels
            .forEach {
                preferredPriceLevelsQuestionScreenViewModel
                    .selectAnswerWithIndex(index: $0)
            }
        
        distancePreferenceLevelQuestionScreenViewModel = .init(question: TasteProfileMCQSelector.distancePreferenceLevelQuestion)
        /// Fill in initial selections using user's existing taste profile
        distancePreferenceLevelQuestionScreenViewModel
            .selectAnswerWithIndex(index: initialDistancePreferenceLevel)
        
        // Cuisine and Dietary Preference Selectors
        cuisineSelectionScreenViewModel = .init()
        
        foodRestrictionSelectionScreenViewModel = .init()
        
        // Pagination Indicator
        pageIndicatorViewModel = .init(
            totalPages: self.totalPages,
            interactionsEnabled: false)
    }
    
    // MARK: - Selector Logic
    func getMCQViewModelFor(page: Pages) -> TasteProfileMCQScreenViewModel? {
        switch page {
        case .adventureLevelPage:
            return adventureLevelQuestionScreenViewModel
        case .drinkPreferencePage:
            return drinkPreferenceQuestionScreenViewModel
        case .restaurantRatingImportancePage:
            return restaurantRatingImportanceLevelQuestionScreenViewModel
        case .preferredMealTypesPage:
            return preferredMealTypesQuestionScreenViewModel
        case .preferredPriceLevelsPage:
            return preferredPriceLevelsQuestionScreenViewModel
        case .distancePreferencePage:
            return distancePreferenceLevelQuestionScreenViewModel
        case .cuisineSelectionPage,
                .foodRestrictionPage:
            return nil
        }
    }
    
    // MARK: - Navigation Logic
    /// Removes this view from the view hierarchy
    func dismiss() {
        self.coordinator
            .dismissFullScreenCover()
    }
    
    func navigateForward() {
        goToPage(at: currentPageIndex + 1)
    }
    
    func navigateBackward() {
        goToPage(at: currentPageIndex - 1)
    }
    
    func skipToLastPage() {
        goToPage(at: maxPageIndex)
    }
    
    func goToPage(at pageIndex: Int) {
        guard isPageIndexWithinBounds(pageIndex: pageIndex)
        else { return }
        
        self.lastPageIndex = currentPageIndex
        self.currentPageIndex = pageIndex
        self.pageIndicatorViewModel
            .selectPageIndex(pageIndex: pageIndex)
    }
    
    func isPageIndexWithinBounds(pageIndex: Int) -> Bool {
        return pageIndex <= maxPageIndex && pageIndex >= minimumPageIndex
    }
    
    // MARK: - Business Logic
    /// Pushes the changes to the user's taste profile to the DB and updates the local taste profile within the manager
    func updateTasteProfile() {
        guard isClientOnline,
              didChangesOccur()
        else { return }
        
        Task { @MainActor in
            /// Maps the indices of the selected price levels to their numerical values
            let numericalPriceLevels = preferredPriceLevelSelections
                .compactMap { index in
                    if supportedPriceLevels.keys.contains(index) {
                        return supportedPriceLevels[index]
                    }
                    else { return nil }
                },
            prefersDrinks = selectedDrinkPreference == 0
            
            // Update the user's taste profile and then dismiss this view
           let updatedTasteProfile = await dependencies
                .userTasteProfileManager
                .setUserTasteProfile(
                    adventureLevel: selectedAdventureLevel,
                    restaurantRatingImportanceLevel: selectedRatingImportanceLevel,
                    distancePreferenceLevel: selectedDistancePreferenceLevel,
                    prefersDrinks: prefersDrinks,
                    favoriteCuisines: cuisineSelections,
                    foodRestrictions: foodRestrictionSelections,
                    preferredPriceLevels: numericalPriceLevels,
                    preferredMealTypes: preferredMealTypesSelections
                )
            
            // If an error occurs, then inform the user to try again
            if (updatedTasteProfile == nil) {
                
            }
            else {
                // Dismiss this full cover sheet
                self.dismiss()
            }
        }
    }
    
    /// Determines if the user updated their taste profile in any way
    func didChangesOccur() -> Bool {
        let adventureLevelChanged = initialAdventureLevel != selectedAdventureLevel,
            drinkPreferenceChanged = initialDrinkPreference != selectedDrinkPreference,
            ratingImportanceLevelChanged = initialRatingImportanceLevel != selectedRatingImportanceLevel,
            preferredMealTypesChanged = !Set(initialPreferredMealTypes.compactMap({ $0.id }))
            .symmetricDifference(preferredMealTypesSelections.compactMap({ $0.id })).isEmpty,
            preferredPriceLevelsChanged = !Set(initialPreferredPriceLevels)
            .symmetricDifference(preferredPriceLevelSelections).isEmpty,
            distancePreferenceLevelChanged = initialDistancePreferenceLevel != selectedDistancePreferenceLevel,
            favoriteCuisinesChanged = !Set(initiallyFavoritedCuisineTypes.compactMap({ $0.id }))
            .symmetricDifference(cuisineSelections.compactMap({ $0.id })).isEmpty,
        foodRestrictionsChanged = !Set(initiallySelectedFoodRestrictionTypes.compactMap({ $0.id }))
            .symmetricDifference(foodRestrictionSelections.compactMap({ $0.id })).isEmpty
        
        return adventureLevelChanged
        || drinkPreferenceChanged
        || ratingImportanceLevelChanged
        || preferredMealTypesChanged
        || preferredPriceLevelsChanged
        || distancePreferenceLevelChanged
        || favoriteCuisinesChanged
        || foodRestrictionsChanged
    }
}

