//
// TasteProfileMCQSelector.swift
// Foncii
//
// Created by Justin Cook on 6/30/23 at 4:13 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import Foundation
import OrderedCollections

/// A factory that builds the expected questions to inject into the Taste Profile
/// multiple choice questionnaire
struct TasteProfileMCQSelector {
    static var adventureLevelQuestion: MultipleChoiceQuestion {
        let questionString: String = LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_ADVENTURE_LEVEL_QUESTION_TITLE)
        
        // Answers
        let answerOption_1: MCQAnswer = .init(textContent: LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_ADVENTURE_LEVEL_QUESTION_ANSWER_1)),
            answerOption_2: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_ADVENTURE_LEVEL_QUESTION_ANSWER_2)),
            answerOption_3: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_ADVENTURE_LEVEL_QUESTION_ANSWER_3)),
            answerOption_4: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_ADVENTURE_LEVEL_QUESTION_ANSWER_4))
        
        let answers = OrderedSet([
            answerOption_1,
            answerOption_2,
            answerOption_3,
            answerOption_4
        ])
        
        return .init(textContent: questionString,
                     answers: answers,
                     requiredAnswers: 1,
                     maxPossibleAnswers: 1
        )
    }
    
    static var drinkPreferenceQuestion: MultipleChoiceQuestion {
        let questionString: String = LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_DRINK_PREFERENCE_QUESTION_TITLE)
        
        // Answers
        let answerOption_1: MCQAnswer = .init(textContent: LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_DRINK_PREFERENCE_QUESTION_ANSWER_1)),
            answerOption_2: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_DRINK_PREFERENCE_QUESTION_ANSWER_2))
        
        let answers = OrderedSet([
            answerOption_1,
            answerOption_2
        ])
        
        return .init(textContent: questionString,
                     answers: answers,
                     requiredAnswers: 1,
                     maxPossibleAnswers: 1
        )
    }
    
    static var restaurantRatingImportanceLevelQuestion: MultipleChoiceQuestion {
        let questionString: String = LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_RESTAURANT_RATING_IMPORTANCE_LEVEL_QUESTION_TITLE)
        
        // Answers
        let answerOption_1: MCQAnswer = .init(textContent: LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_RESTAURANT_RATING_IMPORTANCE_LEVEL_QUESTION_ANSWER_1)),
            answerOption_2: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_RESTAURANT_RATING_IMPORTANCE_LEVEL_QUESTION_ANSWER_2)),
            answerOption_3: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_RESTAURANT_RATING_IMPORTANCE_LEVEL_QUESTION_ANSWER_3)),
            answerOption_4: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_RESTAURANT_RATING_IMPORTANCE_LEVEL_QUESTION_ANSWER_4))
        
        let answers = OrderedSet([
            answerOption_1,
            answerOption_2,
            answerOption_3,
            answerOption_4
        ])
        
        return .init(textContent: questionString,
                     answers: answers,
                     requiredAnswers: 1,
                     maxPossibleAnswers: 1
        )
    }
    
    static var foodAtmosphereServiceBalanceQuestion: MultipleChoiceQuestion {
        let questionString: String = LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_FOOD_ATMOSPHERE_SERVICE_BALANCE_QUESTION_TITLE)
        
        // Answers
        let answerOption_1: MCQAnswer = .init(textContent: LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_FOOD_ATMOSPHERE_SERVICE_BALANCE_QUESTION_ANSWER_1)),
            answerOption_2: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_FOOD_ATMOSPHERE_SERVICE_BALANCE_QUESTION_ANSWER_2)),
            answerOption_3: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_FOOD_ATMOSPHERE_SERVICE_BALANCE_QUESTION_ANSWER_3)),
            answerOption_4: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_FOOD_ATMOSPHERE_SERVICE_BALANCE_QUESTION_ANSWER_4))
        
        let answers = OrderedSet([
            answerOption_1,
            answerOption_2,
            answerOption_3,
            answerOption_4
        ])
        
        return .init(textContent: questionString,
                     answers: answers,
                     requiredAnswers: 1,
                     maxPossibleAnswers: 1
        )
    }
    
    static var preferredMealTypesQuestion: MultipleChoiceQuestion {
        let questionString: String = LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_PREFERRED_MEAL_TYPES_QUESTION_TITLE)
        
        // Answers
        let answerOption_1: MCQAnswer = .init(textContent: LocalizedStrings
            .getLocalizedString(for: .BREAKFAST)),
            answerOption_2: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .LUNCH)),
            answerOption_3: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .DINNER)),
            answerOption_4: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .DESSERT))
        
        let answers = OrderedSet([
            answerOption_1,
            answerOption_2,
            answerOption_3,
            answerOption_4
        ])
        
        return .init(textContent: questionString,
                     answers: answers,
                     requiredAnswers: 1,
                     maxPossibleAnswers: answers.count
        )
    }
    
    static var preferredPriceLevelsQuestion: MultipleChoiceQuestion {
        let questionString: String = LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_PREFERRED_PRICE_LEVELS_QUESTION_TITLE)
        
        // Answers
        let answerOption_1: MCQAnswer = .init(textContent: LocalizedStrings
            .getLocalizedString(for: .ONE_DOLLAR_SIGN)),
            answerOption_2: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TWO_DOLLAR_SIGNS)),
            answerOption_3: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .THREE_DOLLAR_SIGNS)),
            answerOption_4: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .FOUR_DOLLAR_SIGNS))
        
        let answers = OrderedSet([
            answerOption_1,
            answerOption_2,
            answerOption_3,
            answerOption_4
        ])
        
        return .init(textContent: questionString,
                     answers: answers,
                     requiredAnswers: 1,
                     maxPossibleAnswers: answers.count
        )
    }
    
    static var distancePreferenceLevelQuestion: MultipleChoiceQuestion {
        let questionString: String = LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_DISTANCE_PREFERENCE_LEVEL_QUESTION_TITLE)
        
        // Answers
        let answerOption_1: MCQAnswer = .init(textContent: LocalizedStrings
            .getLocalizedString(for: .TASTE_PROFILE_DISTANCE_PREFERENCE_LEVEL_QUESTION_ANSWER_1)),
            answerOption_2: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_DISTANCE_PREFERENCE_LEVEL_QUESTION_ANSWER_2)),
            answerOption_3: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_DISTANCE_PREFERENCE_LEVEL_QUESTION_ANSWER_3)),
            answerOption_4: MCQAnswer = .init(textContent: LocalizedStrings
                .getLocalizedString(for: .TASTE_PROFILE_DISTANCE_PREFERENCE_LEVEL_QUESTION_ANSWER_4))
        
        let answers = OrderedSet([
            answerOption_1,
            answerOption_2,
            answerOption_3,
            answerOption_4
        ])
        
        return .init(textContent: questionString,
                     answers: answers,
                     requiredAnswers: 1,
                     maxPossibleAnswers: 1
        )
    }
}
