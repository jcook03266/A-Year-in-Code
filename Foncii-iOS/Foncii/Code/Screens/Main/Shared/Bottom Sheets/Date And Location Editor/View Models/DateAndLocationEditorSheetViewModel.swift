//
// DateAndLocationEditorSheetViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/16/23 at 11:46 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import CoreLocation
import Combine
import OrderedCollections

class DateAndLocationEditorSheetViewModel: CoordinatedGenericViewModel {
    typealias coordinator = HomeTabCoordinator
    
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.clientActionDispatcher) var clientActionDispatcher

    @ActionDispatcherSelector(\.restaurantActionDispatcher) var restaurantActionDispatcher
    
    // MARK: - Properties
    var coordinator: coordinator
    
    /// Initial values to display to the user when no cities are currently being searched for
    var majorCities: OrderedSet<MajorCity> {
        return dependencies
            .staticAssetController
            .majorCities
    }
    
    var majorCitiesFormattedStrings: [String] {
        return majorCities.map { majorCity in
            let formattedCityStateString =  majorCity.name.capitalizeAllFirstLetters
            + ", "
            + majorCity.abbreviatedState.uppercased()
            
            return formattedCityStateString
        }
    }
    
    // Input Descriptors
    var currentReservationDateDescription: String {
        return dependencies
            .reservationDateManager
            .formatDateToDatePickerFormat(date: targetReservationDate)
    }
        
    // MARK: - Published
    @Published var targetReservationDate: Date
    
    // Searching
    @Published var locationAutoCompleteSearchQuery: String = ""
    @Published var locationAutoCompleteResults: OrderedSet<String> = []
    @Published var selectedAutoCompleteResult: String? = nil
    
    // UI State Management
    @Published var currentCityInputDescription: String = ""
    
    // Selection States
    @Published var reservationInputSelectorSelected: Bool = false
    @Published var citySearchBarFocused: Bool = false

    /// True if any new changes were pushed and updated, false otherwise
    var newChangesCommitted: Bool {
        return AppService
            .shared
            .getCurrentState(of: \.restaurantState)
            .newFilterUpdatesCommitted
    }
    
    // MARK: - Subscriptions
    private let scheduler: DispatchQueue = .main
    private var cancellables: Set<AnyCancellable> = []
    
    // MARK: - Limits
    /// Target reservation dates are limited to ~ 6 months in advance from the current (real) date
    var calendarDateSelectionBoundary: ClosedRange<Date> {
        let numberOfSecondsInAYear = 31536000,
        sixMonthsInSeconds = numberOfSecondsInAYear/2,
        halfYearTimeInterval = TimeInterval(sixMonthsInSeconds),
        startDate = currentDate,
        endDate = currentDate.advanced(by: halfYearTimeInterval)
        
        return .init(uncheckedBounds: (lower: startDate,
                                       upper: endDate))
    }
    
    // MARK: - Dependencies
    struct Dependencies: InjectableServices {
        let locationManager: LocationServiceManager = inject(),
            reservationDateManager: ReservationDateManager = inject(),
            restaurantManager: RestaurantManager = inject(),
            staticAssetController: StaticAssetController = inject()
    }
    var dependencies = Dependencies()
    
    // MARK: - Styling
    // Assets
    let calendarIcon: Image = Icons.getIconImage(named: .calendar),
        mapMarkerIcon: Image = Icons.getIconImage(named: .map_marker)
    
    // Colors
    let inputPromptTextColor: Color = Colors.permanent_white,
        backgroundColor: Color = Colors.dark_grey_1,
        bottomSheetIndicatorColor: Color = Colors.medium_1
    
    // Fonts
    let inputPromptFont: FontStyleRepository = .subtitle,
        majorCitiesTitleFont: FontStyleRepository = .subtitle_bold
    
    // MARK: - Localized Text
    let updateButtonTitle: String = LocalizedStrings.getLocalizedString(for: .UPDATE),
        reservationDateInputTitle: String = LocalizedStrings
        .getLocalizedString(for: .DATE_AND_LOCATION_EDITOR_INPUT_1_TITLE),
citySearchInputTitle: String = LocalizedStrings
        .getLocalizedString(for: .DATE_AND_LOCATION_EDITOR_INPUT_2_TITLE),
citySearchInputDefaultText: String = LocalizedStrings
        .getLocalizedString(for: .DATE_AND_LOCATION_EDITOR_INPUT_2_TEXT),
majorCitiesTitleText: String = LocalizedStrings
        .getLocalizedString(for: .MAJOR_CITIES)
    
    // Current date string
    var reservationDateInputText: String {
        return currentReservationDateDescription
    }
    
    var citySearchInputText: String {
        return isCitySearchInputEmpty ? citySearchInputDefaultText : currentCityInputDescription
    }
    
    // MARK: - Convenience
    var shouldDisplayCalendar: Bool {
        return reservationInputSelectorSelected
    }
    
    var shouldDisplayAutoCompleteUI: Bool {
        return shouldDisplayAutoCompleteSearchResults || shouldDisplayMajorCitiesList
    }
    
    var shouldDisplayAutoCompleteSearchResults: Bool {
        return citySearchBarFocused &&
        !locationAutoCompleteResults.isEmpty
    }
    
    /// Major cities are displayed when there are no autocomplete results
    var shouldDisplayMajorCitiesList: Bool {
        return citySearchBarFocused &&
        locationAutoCompleteResults.isEmpty
    }
    
    var canSelectALocationAutoCompleteResult: Bool {
        return selectedAutoCompleteResult == nil
    }
    
    var isCitySearchInputEmpty: Bool {
        return self.currentCityInputDescription.isEmpty
    }
    
    var currentDate: Date {
        return dependencies
            .reservationDateManager
            .currentDate
    }
    
    var currentReservationDate: Date {
        return dependencies
            .reservationDateManager
            .targetReservationDate
    }
    
    var didReservationDateChange: Bool {
        return targetReservationDate.compareDayMonthYear(to: currentReservationDate)
    }
    
    var changesCurrentlyPending: Bool {
        return self.didReservationDateChange || self.selectedAutoCompleteResult != nil
    }
    
    // MARK: - Actions
    var closeButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            self.coordinator
                .dismissSheet()
        }
    }
    
    var updateButtonAction: (() -> Void) {
        return { [weak self] in
            guard let self = self,
                  changesCurrentlyPending
            else { return }
            
            Task { @MainActor in
                /// Update the relevant store to store the updates
                if self.didReservationDateChange {
                    self.dependencies
                        .reservationDateManager
                        .selectNewTargetReservationDate(self.targetReservationDate)
                }
                
                if let selectedAddressString = self.selectedAutoCompleteResult {
                    await self.dependencies
                        .locationManager
                        .setVirtualLocationUsingAddress(addressString: selectedAddressString)
                }
                
                /// Reload the view to publish the pending updates, and
                /// remove any pending changes
                self.reload()
                
                self.restaurantActionDispatcher.setNewFilterUpdatesCommitted(newUpdatesCommitted: true)
                
                self.closeButtonAction()
            }
        }
    }
    
    // MARK: - Models
    var reservationDateInputSelectorViewModel: InputSelectorViewModel!
    
    var citySearchBarTextFieldViewModel: SearchBarTextFieldViewModel!
    
    init(coordinator: coordinator) {
        self.coordinator = coordinator
        self.targetReservationDate = dependencies
            .reservationDateManager
            .targetReservationDate
        
        load()
        initModels()
        addSubscribers()
    }
    
    // MARK: - Subscriptions
    func addSubscribers() {
        // Search query input listener
        citySearchBarTextFieldViewModel
            .$textEntry
            .receive(on: scheduler)
            .assign(to: &$locationAutoCompleteSearchQuery)
        
        // Search bar focus state listener
        citySearchBarTextFieldViewModel
            .$focused
            .assign(to: &$citySearchBarFocused)
        
        // Generate new auto-completions when the search query changes
        self.$locationAutoCompleteSearchQuery
            .receive(on: scheduler)
            .sink { [weak self] queryFragment in
                guard let self = self
                else { return }
                
                /**
                 * Reset the selected auto complete result when the
                 * search query is blank, indicating the user didn't search
                 * for anything yet or they erased their prior search
                 */
                if queryFragment.isEmpty {
                    self.selectedAutoCompleteResult = nil
                    
                    /// Reset results when no query is present
                    self.locationAutoCompleteResults.removeAll()
                }
                
                autoCompleteSearchQuery(queryFragment: queryFragment)
            }
            .store(in: &cancellables)
        
        // Listen for autocompletion result updates and map them locally
        self.dependencies
            .locationManager
            .$locationSearchAutoCompleteResults
            .receive(on: scheduler)
            .sink { [weak self] results in
                guard let self = self
                else { return }
                
                self.locationAutoCompleteResults = OrderedSet(results)
            }
            .store(in: &cancellables)
        
        // Update current city place holder when updates occur
        self.$currentCityInputDescription
            .receive(on: scheduler)
            .sink { [weak self] currentCity in
                guard let self = self,
                      !isCitySearchInputEmpty
                else { return }
                
                /// Only set the search bar's text entry when the text entry isn't empty
                /// to avoid setting its contents immediately at load
                if !self.citySearchBarTextFieldViewModel
                    .textEntry.isEmpty {
                    self.citySearchBarTextFieldViewModel
                        .textEntry = currentCity
                }
                
                self.citySearchBarTextFieldViewModel
                    .placeholderText = currentCity
            }
            .store(in: &cancellables)
        
        // Pair local publisher with selector publisher
        self.reservationDateInputSelectorViewModel
            .$isSelected
            .receive(on: scheduler)
            .assign(to: &$reservationInputSelectorSelected)
        
        self.$reservationInputSelectorSelected
            .receive(on: scheduler)
            .sink { [weak self] reservationInputSelected in
                guard let self = self
                else { return }
                
                if reservationInputSelected {
                    self.closeCitySearchBar()
                }
            }
            .store(in: &cancellables)
        
        self.$citySearchBarFocused
            .receive(on: scheduler)
            .sink { [weak self] citySearchBarSelected in
                guard let self = self
                else { return }
                
                if citySearchBarSelected {
                    self.closeReservationInputSelector()
                }
            }
            .store(in: &cancellables)
        
        // Update the target reservation date description
        self.$targetReservationDate
            .receive(on: scheduler)
            .sink { [weak self] _ in
                guard let self = self
                else { return }
                
                self.reservationDateInputSelectorViewModel
                    .fieldTextContents = reservationDateInputText
            }
            .store(in: &cancellables)
    }
    
    func initModels() {
        reservationDateInputSelectorViewModel = .init(
            fieldTextContents: reservationDateInputText,
            inFieldIcon: calendarIcon,
            isSelected: reservationInputSelectorSelected)
        
        citySearchBarTextFieldViewModel = .init()
        citySearchBarTextFieldViewModel.configurator { [weak self] model in
            guard let self = self
            else { return }
            
            // Main Properties
            model.keyboardType = .asciiCapable
            model.placeholderText = citySearchInputText
            model.submitLabel = .done
            
            // In-field icon
            model.inFieldIcon = Icons.getIconImage(named: .map_marker)
        }
    }
    
    // MARK: - Searching Logic
    func autoCompleteSearchQuery(queryFragment: String) {
        dependencies
            .locationManager
            .locationAutoCompleter
            .queryFragment = queryFragment
    }
    
    func createOnSelectAction(autoCompleteResult: String) -> (() -> Void) {
        return { [weak self] in
            guard let self = self
            else { return }
            
            let isSelected = autoCompleteResult == self.selectedAutoCompleteResult
            
            if isSelected {
                // Deselect
                self.selectedAutoCompleteResult = nil
            }
            else {
                // Select
                self.selectedAutoCompleteResult = autoCompleteResult
                
                // Update text field
                self.citySearchBarTextFieldViewModel
                    .textEntry = autoCompleteResult
            }
        }
    }
    
    // MARK: - State Management
    func load() {
        Task { @MainActor in
            /// New load so no new filter updates have been committed yet
            restaurantActionDispatcher
                .setNewFilterUpdatesCommitted(newUpdatesCommitted: false)
            
            let currentTargetSearchArea = dependencies
                .restaurantManager
                .currentRestaurantSearchArea
            
            self.currentCityInputDescription = await dependencies
                .locationManager
                .getCityAndStateFromLocation(coordinates: currentTargetSearchArea) ?? ""
            
            // Load the major cities placeholders (if none available)
            await dependencies
                .staticAssetController
                .dependencies
                .majorCityManager
                .fetch()
        }
    }
    
    func reload() {
        Task { @MainActor in
            let currentTargetSearchArea = dependencies
                .restaurantManager
                .currentRestaurantSearchArea
            
            self.currentCityInputDescription = await dependencies
                .locationManager
                .getCityAndStateFromLocation(coordinates: currentTargetSearchArea) ?? ""
            
            await dependencies
                .staticAssetController
                .dependencies
                .majorCityManager
                .reload()
            
            untoggleComponents()
            removePendingChanges()
        }
    }
    
    // MARK: - Selector UI Management
    func closeReservationInputSelector() {
        reservationDateInputSelectorViewModel.deselect()
    }
    
    func closeCitySearchBar() {
        citySearchBarTextFieldViewModel.dismiss()
    }
    
    func wipeAutoCompleteResults() {
        locationAutoCompleteResults.removeAll()
    }
    
    func untoggleComponents() {
        closeReservationInputSelector()
        closeCitySearchBar()
    }
    
    /// Any changes that haven't been committed will be removed here
    func removePendingChanges() {
        targetReservationDate = dependencies
            .reservationDateManager
            .targetReservationDate
        
        selectedAutoCompleteResult = nil
    }
}
