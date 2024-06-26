//
// ReservationDateManager.swift
// Foncii
//
// Created by Justin Cook on 6/5/23 at 8:14 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation

class ReservationDateManager {
    // MARK: - Redux Actions
    @ActionDispatcherSelector(\.restaurantActionDispatcher) var restaurantActionDispatcher
    
    // MARK: - Properties
    var currentDate: Date {
        return .now
    }
    
    var targetReservationDate: Date {
        return currentState
            .reservationDateFilter
    }
    
    // MARK: - Singleton
    static let shared: ReservationDateManager = .init()
    
    // MARK: - Convenience
    var currentState: RestaurantDomain.State {
        return AppService
            .shared
            .getCurrentState(of: \.restaurantState)
    }
    
    private init() {}
    
    // MARK: - Convenience
    /// Formats the given date to the format 'MMM d' ex.) Sept 23
    /// Usually displayed on the home screen
    func formatDateToHomeScreenFormat(date: Date = .now) -> String {
        let desiredDateFormat = "MMM d"

        return formatDateToDesiredStringFormat(date: date,
                                               format: desiredDateFormat)
    }
    
    /// Formats the given date to the format 'dd MMM yyyy d' ex.) 23 Sept 2023
    /// Usually displayed on the home screen
    func formatDateToDatePickerFormat(date: Date = .now) -> String {
        let desiredDateFormat = "dd MMM yyyy"

        return formatDateToDesiredStringFormat(date: date,
                                               format: desiredDateFormat)
    }
    
    private func formatDateToDesiredStringFormat(date: Date,
                                         format: String) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = format

        return dateFormatter.string(from: date)
    }
}

// MARK: - Business Logic
extension ReservationDateManager {
    /// Specifies the target reservation date for the user
    func selectNewTargetReservationDate(_ date: Date) {
        restaurantActionDispatcher
            .setReservationDateFilter(targetReservationDate: date)
    }
    
    /// Resets the target reservation date back to the current date
    func resetReservationDate() {
        restaurantActionDispatcher
            .resetReservationDateFilter()
    }
}
