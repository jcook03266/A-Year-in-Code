//
// LocationFilterSelector.swift
// Foncii
//
// Created by Justin Cook on 6/26/23 at 5:34 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Shimmer
import ComposableArchitecture

struct LocationFilterSelector: View {
    // MARK: - Observed
    // Local
    @StateObject var model: LocationFilterSelectorViewModel
    
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

extension LocationFilterSelector {
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

extension LocationFilterSelector {
    var filterButtons: some View {
        HStack(spacing: itemSpacing) {
            ForEach(model.majorCitiesFormattedStrings,
                    id: \.self) { majorCityFormattedString in
               let viewModel = model
                    .createMajorCityFilterButtonViewModel(formattedMajorCityString: majorCityFormattedString)
                
                FillableSelectionButton(model: viewModel)
            }
        }
        .padding(.horizontal,
                 horizontalPadding)
    }
     
    var placeholderButtons: some View {
        HStack(spacing: itemSpacing) {
            ForEach(model.mockMajorCitiesFormattedStrings,
                    id: \.self) { mockMajorCityFormattedString in
               let viewModel = model
                    .createMajorCityFilterButtonViewModel(formattedMajorCityString: mockMajorCityFormattedString)
                
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

struct LocationFilterSelector_Previews: PreviewProvider {
    static var previews: some View {
        LocationFilterSelector(model: .init(targetStoreToFilter: .favoritedRestaurants))
    }
}
