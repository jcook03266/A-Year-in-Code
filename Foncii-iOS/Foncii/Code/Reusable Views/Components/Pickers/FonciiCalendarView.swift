//
// FonciiCalendarView.swift
// Foncii
//
// Created by Justin Cook on 6/16/23 at 4:44 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

/// Preconfigured calendar date picker with app specific styling
struct FonciiCalendarView: View {
    // MARK: - Properties
    var calendarTitle: String = "",
        dateSelectionBounds: ClosedRange<Date>
    
    // MARK: - States
    @Binding var selectedDate: Date
    
    // MARK: - Dimensions
    private let cornerRadius: CGFloat = 20,
                borderWidth: CGFloat = 1
    
    // MARK: - Padding
    private let interiorPadding: CGFloat = 10
    
    // MARK: - Styling
    private let borderColor: Color = Colors.medium_dark_grey_1
    
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: cornerRadius)
                .strokeBorder(borderColor,
                              style: .init(lineWidth: borderWidth))
                .scaledToFit()
            
            DatePicker(calendarTitle,
                       selection: $selectedDate,
                       in: dateSelectionBounds,
                       displayedComponents: [.date]
            )
            .datePickerStyle(.graphical)
            .padding(.all,
                     interiorPadding)
            .preferredColorScheme(.dark)
        }
    }
}

struct FonciiCalendarView_Previews: PreviewProvider {
    static var previews: some View {
        FonciiCalendarView( dateSelectionBounds: .init(uncheckedBounds: (lower: .distantPast, upper: .distantFuture)),
                            selectedDate: .constant(.now))
    }
}
