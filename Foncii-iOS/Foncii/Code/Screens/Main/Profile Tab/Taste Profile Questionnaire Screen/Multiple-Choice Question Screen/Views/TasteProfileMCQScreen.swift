//
// TasteProfileMCQScreen.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 3:10 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI

struct TasteProfileMCQScreen: View {
    // MARK: - Observed
    @StateObject var model: TasteProfileMCQScreenViewModel
    
    // MARK: - Dimensions
    private let listDividerHeight: CGFloat = 1
    
    // MARK: - Padding + Spacing
    private let listDividerVerticalPadding: CGFloat = 16,
                questionTextViewBottomPadding: CGFloat = 32
    
    var body: some View {
        mainSection
    }
}

// MARK: - Sections
extension TasteProfileMCQScreen {
    var mainSection: some View {
        VStack(spacing: 0) {
            questionDescriptionTextView
            questionSection
        }
    }
    
    var questionSection: some View {
        VStack(spacing: 0) {
            ForEach(model.answers,
                    id: \.id) { answer in
                let answerIsSelected: Bool = model
                    .isAnswerSelected(answer: answer),
            canSelectMore: Bool = model.question.canSelectMoreAnswers,
            isSelectionEnabled: Bool = canSelectMore || answerIsSelected
                
                VStack {
                    SelectableListCellView(model: .init(textContent: answer.textContent,
                                                        isEnabled: isSelectionEnabled,
                                                        isSelected: answerIsSelected,
                                                        onSelectAction: {
                        if answerIsSelected {
                            model.question
                                .deselectAnswer(answer: answer)
                        }
                        else {
                            model.question
                                .selectAnswer(answer: answer)
                        }
                    }))
                    
                    listDivider
                        .padding(.vertical,
                                 listDividerVerticalPadding)
                }
            }
        }
    }
}

// MARK: - Subviews
extension TasteProfileMCQScreen {
    var questionDescriptionTextView: some View {
        Text(model.questionDescription)
            .withFont(model.questionDescriptionFont)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundColor(model.questionDescriptionColor)
            .multilineTextAlignment(.center)
            .padding(.bottom,
                     questionTextViewBottomPadding)
    }
    
    var listDivider: some View {
        Divider()
            .frame(height: listDividerHeight)
            .overlay(model.listDividerColor)
    }
}

struct TasteProfileMCQScreen_Previews: PreviewProvider {
    static var previews: some View {
        GeometryReader { geom in
            TasteProfileMCQScreen(model: .init(question: TasteProfileMCQSelector.adventureLevelQuestion))
                .frame(width: geom.size.width,
                       height: geom.size.height)
        }
        .background(Colors.black_1)
    }
}
