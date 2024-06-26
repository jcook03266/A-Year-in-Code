//
// DateAndLocationEditorSheet.swift
// Foncii
//
// Created by Justin Cook on 6/16/23 at 11:46 AM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import ComposableArchitecture

struct DateAndLocationEditorSheet: View {
    // MARK: - Observed
    // Local
    @StateObject var model: DateAndLocationEditorSheetViewModel
    
    // External
    @EnvironmentObject var globalViewStore: ViewStoreOf<AppDomain>
    
    // MARK: - State
    @State var currentDetent: PresentationDetent = .height(DateAndLocationEditorSheet.maxHeight)
    
    // MARK: - Dimensions
    private static let maxHeight: CGFloat = 666,
                       minHeight: CGFloat = 666
    
    private let updateButtonSize: CGSize = .init(width: 208,
                                                 height: 48),
                sheetCornerRadius: CGFloat = 20,
                bottomSheetIndicatorSize: CGSize = .init(width: 40,
                                                         height: 4),
                bottomSheetIndicatorCornerRadius: CGFloat = 2
    
    // MARK: - Spacing + Padding
    private let horizontalPadding: CGFloat = 20,
                updateButtonTopPadding: CGFloat = 32,
                inputEntrySectionItemSpacing: CGFloat = 24,
                inputSectionItemSpacing: CGFloat = 24,
                topSectionTopPadding: CGFloat = 12,
                closeButtonTopPadding: CGFloat = 12,
                inputEntrySectionTopPadding: CGFloat = 45,
                closeButtonTrailingPadding: CGFloat = 28,
                listVerticalSpacing: CGFloat = 10,
                bottomSectionBottomPadding: CGFloat = 48.5
    
    // Detents for sheet presentation
    private var bottomSheetMaxDetent: PresentationDetent {
        return .height(DateAndLocationEditorSheet.maxHeight)
    }
    private var bottomSheetMinDetent: PresentationDetent {
        return .height(DateAndLocationEditorSheet.minHeight)
    }
    private var bottomSheetDetents: Set<PresentationDetent> {
        return [bottomSheetMinDetent,
                bottomSheetMaxDetent]
    }
    
    var body: some View {
        sheetBody
            .presentationDetents(bottomSheetDetents,
                                 selection: $currentDetent)
            .presentationDragIndicator(.hidden)
            .presentationCornerRadius(sheetCornerRadius)
            .presentationContentInteraction(.resizes)
    }
}

// MARK: - Sections
extension DateAndLocationEditorSheet {
    var sheetBody: some View {
        GeometryReader { geom in
            ZStack {
                ScrollView(.vertical) {
                    VStack(spacing: 0) {
                        inputEntrySection
                        Spacer()
                    }
                    .padding(.horizontal, horizontalPadding)
                    
                }
                .frame(width: geom.size.width,
                       height: geom.size.height)
                
                topSection
                bottomSection
                    .ignoresSafeArea(.keyboard)
            }
        }
        .background(model.backgroundColor)
        .animation(.spring(),
                   value: model.reservationInputSelectorSelected)
        .animation(.spring(),
                   value: model.locationAutoCompleteResults)
        .animation(.spring(),
                   value: model.citySearchBarFocused)
        .animation(.spring(),
                   value: model.shouldDisplayCalendar)
        .animation(.spring(),
                   value: model.shouldDisplayAutoCompleteUI)
    }
    
    var topSection: some View {
        VStack(spacing: 0) {
            bottomSheetIndicator
            
            HStack {
                Spacer()
                CloseButton(closeAction: model.closeButtonAction)
            }
            .padding(.top,
                     closeButtonTopPadding)
            .padding(.trailing,
                     closeButtonTrailingPadding)
            
            Spacer()
        }
        .padding(.top, topSectionTopPadding)
    }
    
    var inputEntrySection: some View {
        VStack(spacing: inputEntrySectionItemSpacing) {
            reservationDateInputSection
            citySearchInputSection
        }
        .padding(.top, inputEntrySectionTopPadding)
    }
    
    var bottomSection: some View {
        VStack {
            Spacer()
            
            updateButton
        }
        .padding(.bottom, bottomSectionBottomPadding)
    }
    
    var reservationDateInputSection: some View {
        VStack(spacing: inputSectionItemSpacing) {
            reservationDateInputTitleView
            reservationDateInputSelector
            
            Group {
                if model.shouldDisplayCalendar {
                    calendarView
                }
            }
            .id(model.shouldDisplayCalendar)
            .transition(.offset(x: 1000))
        }
    }
    
    var citySearchInputSection: some View {
        VStack(spacing: inputSectionItemSpacing) {
            citySearchInputTitleView
            citySearchBar
            
            Group {
                if model.shouldDisplayAutoCompleteSearchResults {
                    autoCompleteSearchResultList
                }
                else if model.shouldDisplayMajorCitiesList {
                    majorCitiesList
                }
            }
            .transition(.offset(x: 1000))
        }
    }
}

extension DateAndLocationEditorSheet {
    var majorCitiesList: some View {
        VStack(spacing: listVerticalSpacing) {
            ForEach(model.majorCitiesFormattedStrings,
                    id: \.self) { formattedMajorCityString in
                let isSelected = model.selectedAutoCompleteResult == formattedMajorCityString
                
                SelectableListCellView(model: .init(textContent: formattedMajorCityString,
                                                    isEnabled: true,
                                                    isSelected: isSelected,
                                                    onSelectAction: model.createOnSelectAction(autoCompleteResult: formattedMajorCityString)))
            }
        }
    }
    
    var autoCompleteSearchResultList: some View {
        VStack(spacing: listVerticalSpacing) {
            ForEach(model.locationAutoCompleteResults,
                    id: \.hashValue) { autoCompleteResult in
                let isSelected = model.selectedAutoCompleteResult == autoCompleteResult
                
                SelectableListCellView(model: .init(textContent: autoCompleteResult,
                                                    isEnabled: true,
                                                    isSelected: isSelected,
                                                    onSelectAction: model.createOnSelectAction(autoCompleteResult: autoCompleteResult)))
            }
        }
    }
    
    var citySearchBar: some View {
        HStack {
            SearchBarTextFieldView(model: model.citySearchBarTextFieldViewModel)
            
            Spacer()
        }
    }
    
    var calendarView: some View {
        FonciiCalendarView(dateSelectionBounds: model.calendarDateSelectionBoundary,
                           selectedDate: $model.targetReservationDate)
    }
    
    var bottomSheetIndicator: some View {
        Button {
            HapticFeedbackDispatcher
                .gentleButtonPress()
        } label: {
            RoundedRectangle(cornerRadius: bottomSheetIndicatorCornerRadius)
                .fill(model.bottomSheetIndicatorColor)
                .frame(width: bottomSheetIndicatorSize.width,
                       height: bottomSheetIndicatorSize.height)
        }
        .buttonStyle(.genericSpringyShrink)
    }
    
    var reservationDateInputTitleView: some View {
        HStack {
            Text(model.reservationDateInputTitle)
                .withFont(model.inputPromptFont)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundColor(model.inputPromptTextColor)
                .lineLimit(1)
                .multilineTextAlignment(.leading)
            
            Spacer()
        }
    }
    
    var reservationDateInputSelector: some View {
        HStack {
            InputSelector(model: model.reservationDateInputSelectorViewModel)
            
            Spacer()
        }
    }
    
    var citySearchInputTitleView: some View {
        HStack {
            Text(model.citySearchInputTitle)
                .withFont(model.inputPromptFont)
                .fixedSize(horizontal: false, vertical: true)
                .foregroundColor(model.inputPromptTextColor)
                .lineLimit(1)
                .multilineTextAlignment(.leading)
            
            Spacer()
        }
    }
    
    var updateButton: some View {
        RoundedCTAButton(title: model.updateButtonTitle,
                         action: model.updateButtonAction,
                         disabled: !model.changesCurrentlyPending,
                         size: updateButtonSize)
    }
}

struct DateAndLocationEditorSheet_Previews: PreviewProvider {
    static func getView() -> AnyView {
        return RootCoordinatorDelegate
            .shared
            .tabbarCoordinatorSelector
            .homeTabCoordinator
            .router
            .view(for: .dateAndLocationEditor)
    }
    
    static var previews: some View {
        getView()
    }
}
