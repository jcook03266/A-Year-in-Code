//
//  LocationServiceManager.swift
//  Foncii
//
//  Created by Justin Cook on 2/21/23.
//

import CoreLocation
import MapKit

/// Manages user locations services which basically gives the app information about the user's physical location when given permission
class LocationServiceManager: NSObject, PermissibleiOSService {
    typealias Service = LocationServiceManager
    
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.restaurantActionDispatcher) var restaurantActionDispatcher
    
    @ActionDispatcherSelector(\.clientActionDispatcher) var clientActionDispatcher
    
    // MARK: - Singleton
    static let shared: Service = .init()
    
    // MARK: - Properties
    let isCriticalService: Bool = true,
        // Service Implementation
        locationService: CLLocationManager = .init(),
        locationAutoCompleter: MKLocalSearchCompleter = .init()
    
    var accessHasBeenDenied: Bool = false
    
    // MARK: - Published
    // Authorization
    @Published var isAccessGranted: Bool = false
    
    // Searching
    @Published var locationSearchAutoCompleteResults: [String] = []
    
    /// Client bounded geostatic location tracking
    var currentCoordinates: CLLocationCoordinate2D? {
        return AppService.shared
            .getCurrentState(of: \.clientState)
            .currentClientLocation?
            .coordinate
    }
    
    /// Unbounded location tracking for dynamic restaurant searching
    var searchLocationCoordinates: CLLocationCoordinate2D? {
        return AppService.shared
            .getCurrentState(of: \.restaurantState)
            .searchLocationFilter?
            .coordinate
    }
    
    private override init() {
        super.init()
        setup()
        startUpdatingUserLocation()
    }
    
    func setup() {
        // Location Services
        locationService.delegate = self
        locationService.desiredAccuracy = kCLLocationAccuracyBest
        
        // Mapkit
        locationAutoCompleter.delegate = self
        /// Only include direct addresses in order to narrow down the search
        locationAutoCompleter.resultTypes = [.address]
        
        Task {
            await determineAuthStatus()
        }
    }
    
    /// Updates the user's location to get their latest positioning, based on significant location shifts due to the large
    /// operational area of the client ~ 30+ miles
    func startUpdatingUserLocation() {
        self.locationService.startMonitoringSignificantLocationChanges()
    }
    
    /// Stops updating the user's location when it's no longer needed
    func stopUpdatingUserLocation() {
        self.locationService.stopUpdatingLocation()
    }
    
    /// Discard the boolean result from this method since the request is async and the outcome is handled by the delegate
    @MainActor func askForPermission() async -> Bool {
        guard !isAccessGranted
        else { return true }
        
        locationService
            .requestWhenInUseAuthorization()
                
        /// Just assuming the expected outcome, this isn't factual so don't use it,
        /// use the published `isAccessGranted` value instead
        return accessHasBeenDenied ? false : true
    }
    
    @MainActor func determineAuthStatus() async -> Bool {
        let authStatus = locationService.authorizationStatus
        
        switch authStatus {
        case .notDetermined:
            // Permission by the user has not yet been asked
            isAccessGranted = false
            
        case .restricted:
            // The user is unable to grant permission, such as due to parental controls.
            isAccessGranted = false
            
        case .denied:
            // The user has explicitly denied permission to use this service
            accessHasBeenDenied = true
            isAccessGranted = false
            
            // Prompt the user to edit this setting manually
            navigateToSettingsMenu()
            
        case .authorized, .authorizedAlways, .authorizedWhenInUse:
            // User has granted permission
            isAccessGranted = true
            
        @unknown default:
            // Permission status is unknown
            isAccessGranted = false
        }
        
        // Reset the access has been denied flag when access is eventually granted
        if isAccessGranted == true {
            setCurrentCoordinates()
            accessHasBeenDenied = false
        }
        
        return isAccessGranted
    }
}

// MARK: - Delegate Implementation - MKLocalSearchCompleterDelegate
extension LocationServiceManager: MKLocalSearchCompleterDelegate {
    /**
     * Sets the user's virtual location from which to search for
     * restaurants from, this is completely separate from the client physical
     * location, however, the client location is the default value of this virtual
     * location.
     */
    func setVirtualLocation(location: CLLocation) {
        let clientLocation = AppService
            .shared
            .getCurrentState(of: \.clientState)
            .currentClientLocation
        
        /// If the client's location doesn't match the given then this means the user is setting up a
        /// virtual search area in order to search for restaurant content
        guard let clientLocation = clientLocation
        else { return }
        
        let isUsingVirtualLocation = clientLocation != location
        
        clientActionDispatcher
            .setUsingVirtualLocation(usingVirtualLocation: isUsingVirtualLocation)
        
        restaurantActionDispatcher
            .setSearchLocationFilter(targetSearchArea: location)
    }
    
    /// Autocompleter result listener
    func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
        // Transform the completion results to an array of strings
        locationSearchAutoCompleteResults = completer
            .results
            .map({ searchCompletion in
                return searchCompletion.title
            })
    }
    
    /// Sets the user's virtual location using the given address string (if possible)
    @MainActor func setVirtualLocationUsingAddress(addressString: String) async {
        let placemark = await getGeocodedPlace(addressString: addressString),
        location = placemark?.location
        
        guard let location = location
        else { return }
        
        setVirtualLocation(location: location)
    }
    
    /// Returns the coordinates of the geocoded address string (if possible)
    func getCoordinatesOfAddress(addressString: String) async -> CLLocationCoordinate2D? {
        let placemark = await getGeocodedPlace(addressString: addressString)
        
        return placemark?.location?.coordinate
    }
    
    /// Geocodes the input address into a coordinate point
    func getGeocodedPlace(addressString: String) async -> CLPlacemark? {
        let geocoder = CLGeocoder()
        
        do {
            let placemarks = try await geocoder
                .geocodeAddressString(addressString)
            
            // Return the top result
            return placemarks.first
        }
        catch {
            ErrorCodeDispatcher
                .SwiftErrors
                .triggerPreconditionFailure(
                    for: .genericConversionError,
                    using: "\(addressString) at \(#function)"
                )()
        }
    }
}

// MARK: - Delegate Implementation - CLLocationManagerDelegate
extension LocationServiceManager: CLLocationManagerDelegate {
    /**
     * Returns an interpolated string containing the city and state of
     * the given or current coordinate point
     */
    func getCityAndStateFromLocation(coordinates: CLLocationCoordinate2D? = nil) async -> String? {
        let coordinatePointToUse = coordinates ?? self.currentCoordinates
        
        let city = await getCityFromLocation(coordinates: coordinatePointToUse),
            state = await getStateFromLocation(coordinates: coordinatePointToUse)
        
        guard let city = city,
              let state = state
        else { return nil }
        
        return "\(city), \(state)"
    }
    
    /**
     * Returns the locality / city / township
     * associated with the given coordinate point or with the current
     * coordinate point reported by the manager if none is provided
     */
    func getCityFromLocation(coordinates: CLLocationCoordinate2D? = nil) async -> String? {
        let coordinatePointToUse = coordinates ?? self.currentCoordinates
        
        guard let coordinatePointToUse = coordinatePointToUse,
              let currentPlaceMark = await getReverseGeocodedPlace(from: coordinatePointToUse)
        else { return nil }
        
        return currentPlaceMark.locality
    }
    
    /**
     * Returns the state / province
     * associated with the given coordinate point or with the current
     * coordinate point reported by the manager if none is provided
     */
    func getStateFromLocation(coordinates: CLLocationCoordinate2D? = nil) async -> String? {
        let coordinatePointToUse = coordinates ?? self.currentCoordinates
        
        guard let coordinatePointToUse = coordinatePointToUse,
              let currentPlaceMark = await getReverseGeocodedPlace(from: coordinatePointToUse)
        else { return nil }
        
        return currentPlaceMark.administrativeArea
    }
    
    /**
     * Reverse-geocodes the physical location of the given
     * coordinate point and returns a placemark for the top result of
     * the reverse-gecode search
     *
     * If no coordinate point is given then the current coordinate point the
     * location manager for this client is reporting is used instead
     */
    func getReverseGeocodedPlace(
    from coordinates: CLLocationCoordinate2D? = nil
    ) async -> CLPlacemark? {
        let coordinatePointToUse = coordinates ?? self.currentCoordinates
        
        guard let coordinatePointToUse = coordinatePointToUse
        else { return nil }
        
        let geocoder = CLGeocoder()
        
        do {
            let placemarks = try await geocoder.reverseGeocodeLocation(
                .init(latitude: coordinatePointToUse.latitude,
                      longitude: coordinatePointToUse.longitude)
            )
            
            // Return the top result
            return placemarks.first
        }
        catch {
            /// Fail gracefully, sometimes conversion errors will occur
            /// due to service disruption
            ErrorCodeDispatcher
                .SwiftErrors
                .printErrorCode(for: .genericConversionError, with: "\(coordinatePointToUse) at \(#function)")
        }
        
        return nil
    }
    
    /**
     * Retrieves the most recent coordinates and assigns it to the published coordinate
     * variable so that the manager is immediately updated when it's determined the user
     * has enable location permissions
     */
    func setCurrentCoordinates() {
        guard let location = locationService.location
        else { return }
        
        clientActionDispatcher
            .setCurrentClientLocation(location: location)
        
        /// Update the user's target search area if they're not using a virtual location currently
        if !AppService
            .shared
            .getCurrentState(of: \.clientState)
            .usingVirtualLocation
        {
            restaurantActionDispatcher
                .setSearchLocationFilter(targetSearchArea: location)
        }
    }
    
    /**
     * Determines the permission status of this service and
     * responds accordingly
     */
    func locationManagerDidChangeAuthorization(
        _ manager: CLLocationManager
    ) {
        Task {
            await determineAuthStatus()
        }
    }
    
    /// Handle updates to the user's core location
    func locationManager(
        _ manager: CLLocationManager,
        didUpdateLocations locations: [CLLocation]
    ) {
        /// Parse the latest location reported in the update batch
        if (locations.first != nil) {
            setCurrentCoordinates()
        }
    }
}
