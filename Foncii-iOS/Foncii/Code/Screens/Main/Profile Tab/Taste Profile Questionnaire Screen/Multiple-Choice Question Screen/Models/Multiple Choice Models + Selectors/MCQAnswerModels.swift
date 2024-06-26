//
// MCQ+MCQAnswerModels.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 3:54 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import OrderedCollections

/// An answer to some multiple choice question
struct MCQAnswer: Identifiable, Hashable {
    // MARK: - Properties
    let id: String = UUID().uuidString,
        textContent: String /// A string describing what the answer is in human-readable language
}

struct MultipleChoiceQuestion: Identifiable, Hashable {
    // MARK: - Properties
    let id: String = UUID().uuidString,
    textContent: String, /// A string describing what the question is in human-readable language
    isQuestionOptional: Bool
    
    // States
    var answers: OrderedSet<MCQAnswer>,
        selectedAnswers: Set<MCQAnswer> = []
    
    // Limits and Requirements
    let requiredAnswers: Int,
        maxPossibleAnswers: Int,
        minimumPossibleAnswers: Int = 1
    
    // MARK: - Convenience
    /// Returns an array indicating the index of each selected answer to be interpreted separately from this selector
    var indicesOfSelectedAnswers: [Int] {
        return selectedAnswers.map { answer in
            return self.answers
                .firstIndex(of: answer) ?? 0
        }
    }
    
    var canSelectMoreAnswers: Bool {
        return selectedAnswerCount < maxPossibleAnswers
    }
    
    var selectedAnswerCount: Int {
        return selectedAnswers.count
    }
    
    /// True if all criteria is fulfilled if the question is non-optional, false otherwise,
    /// true always if the question is optional meaning that the user can skip it at any time
    /// and that their answer isn't required
    var isQuestionComplete: Bool {
        return isQuestionOptional ?
        selectedAnswerCount == requiredAnswers : true
    }
    
    init(
        textContent: String,
        answers: OrderedSet<MCQAnswer> = [],
        requiredAnswers: Int = 1,
        maxPossibleAnswers: Int = 1,
        isQuestionOptional: Bool = false
    ) {
        self.textContent = textContent
        self.answers = answers
        self.isQuestionOptional = isQuestionOptional
        
        // Limiting input to prevent out of bound exceptions
        self.maxPossibleAnswers = maxPossibleAnswers.clamp(min: minimumPossibleAnswers,
                                                           max: answers.count)
        self.requiredAnswers = requiredAnswers.clamp(min: minimumPossibleAnswers,
                                                     max: maxPossibleAnswers)
    }
    
    // MARK: - Logic
    /// Selects an answer from this question's list of answers
    mutating func selectAnswer(answer: MCQAnswer) {
        guard self.answers.contains(answer),
              canSelectMoreAnswers
        else { return }
        
        self.selectedAnswers.insert(answer)
    }
    
    /// Removes the target answer from the selected answers unconditionally
    mutating func deselectAnswer(answer: MCQAnswer) {
        self.selectedAnswers.remove(answer)
    }
    
    func isAnswerSelected(answer: MCQAnswer) -> Bool {
        return self.selectedAnswers.contains(answer)
    }
}

