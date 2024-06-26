//
// TasteProfileMCQScreenViewModel.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 3:10 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import OrderedCollections

class TasteProfileMCQScreenViewModel: GenericViewModel {
    // MARK: - Published
    @Published var question: MultipleChoiceQuestion
    
    // MARK: - Styling
    // Colors
    let listDividerColor: Color = Colors.medium_dark_grey_1,
        questionDescriptionColor: Color = Colors.permanent_white
    
    // Fonts
    let questionDescriptionFont: FontStyleRepository = .heading_3
    
    // MARK: - Convenience
    var isQuestionComplete: Bool {
        return question.isQuestionComplete
    }
    
    var questionDescription: String {
        return question.textContent
    }
    
    // Answer Content
    var answers: OrderedSet<MCQAnswer> {
        return question.answers
    }
    
    var selectedAnswers: Set<MCQAnswer> {
        return question.selectedAnswers
    }
    
    init(question: MultipleChoiceQuestion) {
        self.question = question
    }
    
    // MARK: - Logic
    func isAnswerSelected(answer: MCQAnswer) -> Bool {
        return self.question.isAnswerSelected(answer: answer)
    }
    
    func selectAnswerWithIndex(index: Int?) {
        // Find the answer (if it exists)
        guard let index = index,
              let targetAnswer: MCQAnswer = answers
            .enumerated().first(where: { element in
                element.offset == index
            })?.element
        else { return }
        
        /// Select the target answer within the question's answer set
        self.question
            .selectAnswer(answer: targetAnswer)
    }
}
