//
// MealTypeSelector.swift
// Foncii
//
// Created by Justin Cook on 6/4/23 at 5:24 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture
import Shimmer

struct MealTypeSelector: View {
    // MARK: - Observed
    // Local
    @StateObject var model: MealTypeSelectorViewModel = .shared
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - Spacing + Padding
    private let horizontalPadding: CGFloat = 20,
                itemSpacing: CGFloat = 12
    
    var body: some View {
        mainSection
            .animation(.spring(),
                       value: model.shouldDisplayLoadingIndicator)
    }
}

// MARK: - Sections
extension MealTypeSelector {
    var mainSection: some View {
        ScrollView(.horizontal,
                   showsIndicators: false) {
            Group {
                if model.shouldDisplayLoadingIndicator {
                    placeholderButtons
                }
                else {
                    filterButtons
                }
            }
            .transition(.scale)
        }
                   .disabled(model.shouldDisplayLoadingIndicator)
    }
}

// MARK: - Subviews
extension MealTypeSelector {
    var filterButtons: some View {
        HStack(spacing: itemSpacing) {
            ForEach(model.mealTypes,
                    id: \.id) { mealType in
               let viewModel = model.createMealTypeFilterButtonViewModel(mealType: mealType)
                
                FillableSelectionButton(model: viewModel)
            }
        }
        .padding(.horizontal,
                 horizontalPadding)
    }
     
    var placeholderButtons: some View {
        HStack(spacing: itemSpacing) {
            ForEach(model.mockMealTypes,
                    id: \.id) { mealType in
               let viewModel = model.createMealTypeFilterButtonViewModel(mealType: mealType)
                
                FillableSelectionButton(model: viewModel)
                    .shimmering()
                    .redacted(reason: .placeholder)
                    .disabled(true)
            }
        }
        .padding(.horizontal,
                 horizontalPadding)
    }
}

struct MealTypeSelector_Previews: PreviewProvider {
    static var previews: some View {
        MealTypeSelector()
    }
}
