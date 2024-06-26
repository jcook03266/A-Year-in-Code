//
// Date+Extensions.swift
// Foncii
//
// Created by Justin Cook on 6/16/23 at 5:30 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation

extension Date {
    /// - Returns: The `year` calendar component for this date
    var year: Int {
        let currentCalendar = Calendar.current
        
        return currentCalendar.component(.year,
                                  from: self)
    }
    
    /// - Returns: The `month` calendar component for this date
    var month: Int {
        let currentCalendar = Calendar.current
        
        return currentCalendar.component(.month,
                                  from: self)
    }
    
    var day: Int {
        let currentCalendar = Calendar.current
        
        return currentCalendar.component(.day,
                                  from: self)
    }
    
    /// - Returns: True if the two dates share the same day
    /// month and year, false otherwise. Used to determine the
    /// calendar similarity of two dates, exclusive of time.
    func compareDayMonthYear(to otherDate: Date) -> Bool {
        let didDayChange = otherDate.day != self.day,
        didMonthChange = otherDate.month != self.month,
        didYearChange = otherDate.year != self.year
        
        return didDayChange ||
        didMonthChange ||
        didYearChange
    }
}
