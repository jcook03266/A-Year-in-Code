/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import {
  Cuisine,
  DietaryRestriction,
  FmUser,
} from "../../../__generated__/graphql";

// Hooks
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouterSearchParams } from "../../../hooks/UseRouterSearchParamsHook";
import { useRouteObserver } from "../../../hooks/UseRouteObserver";

// Components
// Local
import TPQCTAButton from "./components/tpq-cta-button/TPQCTAButton";
import CloseUtilityButton from "../../../components/buttons/utility-buttons/close-button/CloseUtilityButton";
import TPQProgressBar from "./components/tpq-progress-bar/TPQProgressBar";
import TPQCuisineSelector from "./components/tpq-cuisine-selector/TPQCuisineSelector";
import TPQDietaryRestrictionSelector from "./components/tpq-dietary-restriction-selector/TPQDietaryRestrictionSelector";
import TPQNavigationButton, {
  TPQNavigationButtonDirection,
} from "./components/tpq-navigation-button/TPQNavigationButton";
import TPQOptionButton from "./components/tpq-option-button/TPQOptionButton";
import FonciiModal from "../../../components/modals/foncii-base-modal/FonciiModal";
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Navigation
import { NavigationProperties } from "../../../core-foncii-maps/properties/NavigationProperties";
import { notFound, useRouter } from "next/navigation";

// Managers
import UserManager from "../../../managers/userManager";

// Services
import { FonciiAPIClientAdapter } from "../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Utilities
import { isInRange } from "../../../utilities/math/commonMath";
import { cn } from "../../../utilities/development/DevUtils";
import { areCollectionsEqual } from "../../../utilities/math/collectionMath";

// Formatting
import { uppercaseFirstLetter } from "../../../utilities/formatting/textContentFormatting";

// Redux
import {
  FonciiRestaurantActions,
  FonciiUserActions,
  NotificationCenterActions,
  UserPostsActions,
  VisitedUserActions,
} from "../../../redux/operations/dispatchers";

// Notifications
import { NotificationTemplates } from "../../../core-foncii-maps/repositories/NotificationTemplates";

// Dialogs
import ConfirmationDialog from "../../../components/dialogs/confirmation-dialog/ConfirmationDialog";
import { DialogTemplates } from "../../../core-foncii-maps/repositories/DialogTemplates";

// App Properties
import { nonProductionEnvironment } from "../../../core-foncii-maps/properties/AppProperties";

// Animations
import { motion, AnimatePresence } from "framer-motion";

// Types
enum TasteProfileQuestionnairePages {
  adventureLevel,
  preferredPriceRange,
  distancePreferenceLevel,
  diningPurpose,
  ambiancePreference,
  drinkPreference,
  spicePreferenceLevel,
  cuisines,
  dietaryRestrictions,
}

export default function TasteProfileQuestionnaireModal({
  userID,
}: {
  userID: string;
}) {
  // Services
  const apiService = new FonciiAPIClientAdapter();

  // Routing
  const routeObserver = useRouteObserver();
  const router = useRouter();

  // Properties
  const currentUser = UserManager.shared.currentUser(),
    currentUserTasteProfile =
      UserManager.shared.primaryTasteProfile() ?? undefined;

  // Limits
  const MultipleChoiceQuestionAnswerRanges = {
    adventureLevelRange: { max: 2, min: 0 },
    ambiancePreferenceRange: { max: 3, min: 0 },
    diningPurposeRange: { max: 3, min: 0 },
    distancePreferenceLevelRange: { max: 2, min: 0 },
    drinkPreferenceRange: { max: 3, min: 0 },
    preferredPriceRangeRange: { max: 3, min: 0 },
    spicePreferenceLevelRange: { max: 2, min: 0 },
  };

  // URL-State Persistence
  const routerSearchParams = useRouterSearchParams();

  // State Management
  // Categorical Data
  const [cuisineData, setCuisineData] = useState<Cuisine[]>([]);
  const [dietaryRestrictionData, setDietaryRestrictionData] = useState<
    DietaryRestriction[]
  >([]);

  // Multiple Choice Questions
  /** 0 - 2 | ~ */
  const [adventureLevel, setAdventureLevel] = useState<number | undefined>(
    currentUserTasteProfile?.adventureLevel ?? undefined
  );
  /** 0 - 3 | Optional integer from 0 - 3 - default value is undefined if no value is given | 0.) 4 ($$$$) and below ($$$$), ($$$), ($$), ($) 1.) 3 ($$$) and below ($$$), ($$), ($) 2.) ($$) and below ($$), ($), 1.) ($) and below ($) */
  const [preferredPriceRange, setPreferredPriceRange] = useState<
    number | undefined
  >(currentUserTasteProfile?.preferredPriceRange ?? undefined);
  /** 0 - 2 | ~ */
  const [distancePreferenceLevel, setDistancePreferenceLevel] = useState<
    number | undefined
  >(currentUserTasteProfile?.distancePreferenceLevel ?? undefined);
  /** 0 - 3 | Optional integer from 0 - 3 - default value is undefined if no value is given */
  const [diningPurpose, setDiningPurpose] = useState<number | undefined>(
    currentUserTasteProfile?.diningPurpose ?? undefined
  );
  /** 0 - 3 | ~ */
  const [ambiancePreference, setAmbiancePreference] = useState<
    number | undefined
  >(currentUserTasteProfile?.ambiancePreference ?? undefined);
  /** 0 - 3 | Optional integer from 0 - 3 - default value if undefined if no value is given, Option 4 aka 'Non-alcoholic beverages only' indicates a non-alcoholic beverage preference i.e no alcohol, the others ~ yes alcohol */
  const [drinkPreference, setDrinkPreference] = useState<number | undefined>(
    currentUserTasteProfile?.drinkPreference ?? undefined
  );
  /** 0 - 2 | Optional integer from 0 - 3 - default value if undefined if no value is given */
  const [spicePreferenceLevel, setSpicePreferenceLevel] = useState<
    number | undefined
  >(currentUserTasteProfile?.spicePreferenceLevel ?? undefined);

  // Selections
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    currentUserTasteProfile?.dietaryRestrictions ?? []
  );
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>(
    currentUserTasteProfile?.preferredCuisines ?? []
  );

  // UI State
  const [
    displaySaveAndExitConfirmationDialog,
    setDisplaySaveAndExitConfirmationDialog,
  ] = useState(false);
  const [getStartedButtonClicked, setGetStartedButtonClicked] = useState(false);
  const [currentQuestionnairePageIndex, setQuestionnairePageIndex] =
    useState(0);

  // Load the required data to display for the categorical data selection screens when this component mounts
  useEffect(() => {
    loadCategoricalData();
  }, []);

  // Navigation side effects
  useEffect(() => {
    conditionallyRedirectIsolatedUser();
  }, [userID]);

  // Conditional rendering
  const conditionallyRedirectIsolatedUser = () => {
    if (!isUserAuthorizedToViewThisScreen()) {
      notFound();
    }
  };

  // Business Logic
  const loadCategoricalData = async () => {
    const [cuisines, dietaryRestrictions] = await Promise.all([
      apiService.performFetchAllCuisines(),
      apiService.performFetchAllDietaryRestrictions(),
    ]);

    setCuisineData(cuisines);
    setDietaryRestrictionData(dietaryRestrictions);
  };

  // Navigation Actions
  const dismissModalAction = () => {
    router.push(NavigationProperties.explorePageLink());
  };

  // Actions
  const setTasteProfileAction = async () => {
    let didSucceed = false;

    if (!isFTUE() && currentUserTasteProfile) {
      // Update the existing primary taste profile
      didSucceed = await FonciiUserActions.updateTasteProfile(
        currentUserTasteProfile?.id,
        {
          adventureLevel,
          ambiancePreference,
          diningPurpose,
          dietaryRestrictions,
          distancePreferenceLevel,
          drinkPreference,
          preferredCuisines,
          preferredPriceRange,
          spicePreferenceLevel,
        }
      );

      didSucceed
        ? NotificationCenterActions.triggerSystemNotification(
            NotificationTemplates.TasteProfileUpdated
          )
        : NotificationCenterActions.triggerSystemNotification(
            NotificationTemplates.TasteProfileError
          );
    } else if (isFTUE() && !currentUserTasteProfile) {
      // Create a new taste profile based on the given inputs
      didSucceed = await FonciiUserActions.createTasteProfile({
        adventureLevel,
        ambiancePreference,
        diningPurpose,
        dietaryRestrictions,
        distancePreferenceLevel,
        drinkPreference,
        preferredCuisines,
        preferredPriceRange,
        spicePreferenceLevel,
      });

      didSucceed
        ? NotificationCenterActions.triggerSystemNotification(
            NotificationTemplates.TasteProfileCreated
          )
        : NotificationCenterActions.triggerSystemNotification(
            NotificationTemplates.TasteProfileError
          );
    } else {
      // Should never happen, but just in case... If this does happen then there's an issue with loading main user data
      // as their primary taste profile should be loaded using the same core fields enumerated in the query operation schema
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.TasteProfileError
      );

      // For dev use, this is an important bug to catch if it ever occurs
      if (nonProductionEnvironment) console.trace("[setTasteProfileAction]");
    }

    // Update the gallery content of the currently active gallery based route to reflect the
    // new taste profile based results
    if (didSucceed) {
      // The user can press the 'x' button if the operation fails for some reason and they can't continue,
      // automatically dismissing this modal when the operation fails will force the user to restart which is bad UX.
      dismissModalAction();

      if (routeObserver.explorePageActive()) {
        FonciiRestaurantActions.search({});
      } else if (routeObserver.isGalleryBeingViewedByAuthor()) {
        UserPostsActions.fetchMainUserPosts();
      } else {
        VisitedUserActions.getVisitedUserPosts();
      }
    }
  };

  // Action Handlers
  const closeButtonActionHandler = () => {
    // Prompt users first creating a taste profile with a confirmation dialog before they exit
    const existingUserHasPendingChanges =
        hasUserMadeChangesToTasteProfile() && !isFTUE(),
      newTasteProfileCreationInProgres =
        isFTUE() &&
        !canUserSubmitTasteProfileChanges() &&
        !shouldDisplayGetStartedScreen(),
      shouldInformUserOfPendingChanges =
        existingUserHasPendingChanges || newTasteProfileCreationInProgres;

    if (shouldInformUserOfPendingChanges) {
      setDisplaySaveAndExitConfirmationDialog(true);
    } else dismissModalAction();
  };

  const handleGetStartedButtonClick = () => {
    setGetStartedButtonClicked(true);
  };

  const handleMultipleChoiceSelection = (
    actionDispatcher: Dispatch<SetStateAction<number | undefined>>,
    answer: number | undefined,
    answerRange: { max: number; min: number }
  ) => {
    // Precondition failure, reject answers outside of the enumerated range
    if (answer && !isInRange(answer, answerRange.max, answerRange.min))
      actionDispatcher(undefined);

    // Dispatch action to the local react state resolver
    actionDispatcher(answer);
  };

  const handleSelectedCuisinesUpdate = (selectedCuisines: Cuisine[]) => {
    setPreferredCuisines(parseCategoryIDsFromEntities(selectedCuisines));
  };

  const handleSelectedDietaryRestrictionsUpdate = (
    selectedDietaryRestrictions: DietaryRestriction[]
  ) => {
    setDietaryRestrictions(
      parseCategoryIDsFromEntities(selectedDietaryRestrictions)
    );
  };

  // Convenience
  // First time user experience, meaning the user hasn't created a Taste Profile before, so display FTUE UI
  const isFTUE = (): boolean => {
    return !userHasExistingTasteProfile();
  };

  const isUserAuthorizedToViewThisScreen = (): boolean => {
    if (!currentUser) return false;
    return currentUser.id == userID;
  };

  const userHasExistingTasteProfile = (): boolean =>
    currentUserTasteProfile !== undefined;

  const parseCategoryIDsFromEntities = (
    entities: Cuisine[] | DietaryRestriction[]
  ): string[] => {
    return entities.map((entity) => entity.id);
  };

  const parseCuisinesFromIDs = (cuisineIDs: string[]) => {
    return cuisineIDs
      .map((cuisineID) => {
        return cuisineData.find((cuisine) => cuisine.id == cuisineID);
      })
      .filter(Boolean) as Cuisine[];
  };

  const parseDietaryRestrictionsFromIDs = (dietaryRestrictionIDs: string[]) => {
    return dietaryRestrictionIDs
      .map((dietaryRestrictionID) => {
        return dietaryRestrictionData.find(
          (dietaryRestriction) => dietaryRestriction.id == dietaryRestrictionID
        );
      })
      .filter(Boolean) as DietaryRestriction[];
  };

  const canNavigateForward = (): boolean => {
    return !isOnLastPageOfQuestionnaire();
  };

  const canNavigateBackward = (): boolean => {
    return !isOnFirstPageOfQuestionnaire();
  };

  const isOnFirstPageOfQuestionnaire = (): boolean => {
    return currentQuestionnairePageIndex == minQuestionnairePageIndex;
  };

  const isOnLastPageOfQuestionnaire = (): boolean => {
    return currentQuestionnairePageIndex == maxQuestionnairePageIndex;
  };

  const isTasteProfileComplete = (): boolean => {
    let isComplete = true;

    Object.values(TasteProfileQuestionnairePages).forEach((page) => {
      switch (page) {
        case TasteProfileQuestionnairePages.adventureLevel:
          isComplete = isComplete && adventureLevel != undefined;
          break;
        case TasteProfileQuestionnairePages.preferredPriceRange:
          isComplete = isComplete && preferredPriceRange != undefined;
          break;
        case TasteProfileQuestionnairePages.distancePreferenceLevel:
          isComplete = isComplete && distancePreferenceLevel != undefined;
          break;
        case TasteProfileQuestionnairePages.diningPurpose:
          isComplete = isComplete && diningPurpose != undefined;
          break;
        case TasteProfileQuestionnairePages.ambiancePreference:
          isComplete = isComplete && ambiancePreference != undefined;
          break;
        case TasteProfileQuestionnairePages.drinkPreference:
          isComplete = isComplete && drinkPreference != undefined;
          break;
        case TasteProfileQuestionnairePages.spicePreferenceLevel:
          isComplete = isComplete && spicePreferenceLevel != undefined;
          break;
        case TasteProfileQuestionnairePages.cuisines:
          isComplete = isComplete && preferredCuisines.length >= 0;
          break;
        case TasteProfileQuestionnairePages.dietaryRestrictions:
          isComplete = isComplete && dietaryRestrictions.length >= 0;
      }
    });

    return isComplete;
  };

  const hasUserMadeChangesToTasteProfile = (): boolean => {
    return (
      currentUserTasteProfile?.adventureLevel != adventureLevel ||
      currentUserTasteProfile?.preferredPriceRange != preferredPriceRange ||
      currentUserTasteProfile?.distancePreferenceLevel !=
        distancePreferenceLevel ||
      currentUserTasteProfile?.diningPurpose != diningPurpose ||
      currentUserTasteProfile?.ambiancePreference != ambiancePreference ||
      currentUserTasteProfile?.drinkPreference != drinkPreference ||
      currentUserTasteProfile?.spicePreferenceLevel != spicePreferenceLevel ||
      !areCollectionsEqual(
        currentUserTasteProfile?.preferredCuisines ?? [],
        preferredCuisines
      ) ||
      !areCollectionsEqual(
        currentUserTasteProfile?.dietaryRestrictions ?? [],
        dietaryRestrictions
      )
    );
  };

  const canUserSubmitTasteProfileChanges = (): boolean => {
    if (isFTUE()) {
      // User creating a new taste profile, must navigate to the last page to confirm they want to create the taste profile
      return currentQuestionnairePageIndex == maxQuestionnairePageIndex;
    } else {
      // User has already created their taste profile and is now updating it, an update can be triggered from any screen when a change has been made
      return hasUserMadeChangesToTasteProfile();
    }
  };

  // UI Properties
  const questionnairePageCount = 9,
    maxQuestionnairePageIndex = questionnairePageCount - 1,
    minQuestionnairePageIndex = 0,
    completedPagesIndices = (): number[] => {
      const indices: number[] = [];

      Object.values(TasteProfileQuestionnairePages).forEach((page) => {
        switch (page) {
          case TasteProfileQuestionnairePages.adventureLevel:
            if (adventureLevel != undefined)
              indices.push(TasteProfileQuestionnairePages.adventureLevel);
            break;
          case TasteProfileQuestionnairePages.preferredPriceRange:
            if (preferredPriceRange != undefined)
              indices.push(TasteProfileQuestionnairePages.preferredPriceRange);
            break;
          case TasteProfileQuestionnairePages.distancePreferenceLevel:
            if (distancePreferenceLevel != undefined)
              indices.push(
                TasteProfileQuestionnairePages.distancePreferenceLevel
              );
            break;
          case TasteProfileQuestionnairePages.diningPurpose:
            if (diningPurpose != undefined)
              indices.push(TasteProfileQuestionnairePages.diningPurpose);
            break;
          case TasteProfileQuestionnairePages.ambiancePreference:
            if (ambiancePreference != undefined)
              indices.push(TasteProfileQuestionnairePages.ambiancePreference);
            break;
          case TasteProfileQuestionnairePages.drinkPreference:
            if (drinkPreference != undefined)
              indices.push(TasteProfileQuestionnairePages.drinkPreference);
            break;
          case TasteProfileQuestionnairePages.spicePreferenceLevel:
            if (spicePreferenceLevel != undefined)
              indices.push(TasteProfileQuestionnairePages.spicePreferenceLevel);
            break;
          case TasteProfileQuestionnairePages.cuisines:
            if (
              (preferredCuisines != undefined &&
                currentQuestionnairePageIndex >
                  TasteProfileQuestionnairePages.cuisines) ||
              preferredCuisines.length > 0
            )
              indices.push(TasteProfileQuestionnairePages.cuisines);
            break;
          case TasteProfileQuestionnairePages.dietaryRestrictions:
            if (
              (dietaryRestrictions != undefined &&
                currentQuestionnairePageIndex >
                  TasteProfileQuestionnairePages.dietaryRestrictions) ||
              dietaryRestrictions.length > 0
            )
              indices.push(TasteProfileQuestionnairePages.dietaryRestrictions);
            break;
        }
      });

      return indices;
    };

  function getPromptsFor(page: TasteProfileQuestionnairePages): {
    topPrompt: string;
    secondaryPrompt: string;
  } {
    switch (page) {
      case TasteProfileQuestionnairePages.adventureLevel:
        return {
          topPrompt: "How adventurous are you?",
          secondaryPrompt: "Select one that sounds most like you.",
        };
      case TasteProfileQuestionnairePages.preferredPriceRange:
        return {
          topPrompt: "What your typical budget range when dinning out?",
          secondaryPrompt: "Solo dining or with a group?",
        };
      case TasteProfileQuestionnairePages.distancePreferenceLevel:
        return {
          topPrompt: "How far would you travel for an amazing restaurant find?",
          secondaryPrompt: "Select one that sounds most like you.",
        };
      case TasteProfileQuestionnairePages.diningPurpose:
        return {
          topPrompt: "When do you usually dine out?",
          secondaryPrompt: "Select one that sounds most like you.",
        };
      case TasteProfileQuestionnairePages.ambiancePreference:
        return {
          topPrompt: "What kind of restaurant vibe suits your style?",
          secondaryPrompt: "Select one that sounds most like you.",
        };
      case TasteProfileQuestionnairePages.drinkPreference:
        return {
          topPrompt:
            "What type of beverages do you enjoy pairing with your meal?",
          secondaryPrompt: "Select one that sounds most like you.",
        };
      case TasteProfileQuestionnairePages.spicePreferenceLevel:
        return {
          topPrompt: "What's your spicy level?",
          secondaryPrompt:
            "We'll connect you with influencers who share similar spicy levels as you.",
        };
      case TasteProfileQuestionnairePages.cuisines:
        return {
          topPrompt: "Select your favorite cuisines.",
          secondaryPrompt:
            "Foncii will tailor the most fitting recommendations for you. Select all that apply.",
        };
      case TasteProfileQuestionnairePages.dietaryRestrictions:
        return {
          topPrompt: "Choose your dietary preferences & restrictions.",
          secondaryPrompt: "Select all that apply.",
        };
    }
  }

  // Conditional UI Logic
  const shouldDisplayGetStartedScreen = (): boolean => {
    return isFTUE() && !getStartedButtonClicked;
  };

  // Precondition failure, don't render anything unless a valid user is active
  if (!currentUser) return;

  // Pages
  // Template
  function TasteProfilePageTemplate({
    page,
    topPrompt,
    secondaryPrompt,
    children,
  }: {
    page: TasteProfileQuestionnairePages;
    topPrompt: string;
    secondaryPrompt: string;
    children?: React.ReactNode;
  }): React.ReactNode {
    return (
      <div
        id={`page-${page}`}
        key={page}
        className="flex flex-col gap-y-[8px] text-start items-center justify-center text-[22px] xl:text-[24px] break-words w-full h-fit font-medium text-permanent_white"
      >
        <p className="w-full h-fit leading-[1]">{topPrompt}</p>
        <p className="w-full h-fit text-[16px] xl:text-[18px] text-neutral font-normal">
          {secondaryPrompt}
        </p>

        <div className="pt-[8px] h-fit w-full">{children}</div>
      </div>
    );
  }

  function MultipleChoiceQuestionTemplate({
    children,
  }: {
    children?: React.ReactNode;
  }) {
    return (
      <div className="flex flex-col gap-y-[16px] shrink-0 flex-nowrap h-fit w-full items-center justify-center pt-[16px]">
        {children}
      </div>
    );
  }

  function getTextForQuestionOptionOn({
    page,
    optionIndex,
  }: {
    page: TasteProfileQuestionnairePages;
    optionIndex: number;
  }): string {
    switch (page) {
      case TasteProfileQuestionnairePages.adventureLevel:
        return (
          {
            0: "I'm the pickiest eater in my social circle",
            1: "I usually stay in my comfort zone",
            2: "I'll eat anything in front of me",
          }[optionIndex] ?? ""
        );
      case TasteProfileQuestionnairePages.preferredPriceRange:
        return (
          {
            0: "$$$$ & Below",
            1: "$$$ & Below",
            2: "$$ & Below",
            3: "$ & Below",
          }[optionIndex] ?? ""
        );
      case TasteProfileQuestionnairePages.distancePreferenceLevel:
        return (
          {
            0: "Walking (0 - 5 miles)",
            1: "Driving (6 - 10 miles)",
            2: "Mini-roadtrip (10+ miles)",
          }[optionIndex] ?? ""
        );
      case TasteProfileQuestionnairePages.diningPurpose:
        return (
          {
            0: "Casually",
            1: "Date nights",
            2: "For business ",
            3: "Family gatherings",
          }[optionIndex] ?? ""
        );
      case TasteProfileQuestionnairePages.ambiancePreference:
        return (
          {
            0: "Fine Dining",
            1: "Relaxed Casual",
            2: "Cozy Intimate",
            3: "Trendy Modern",
          }[optionIndex] ?? ""
        );
      case TasteProfileQuestionnairePages.drinkPreference:
        return (
          {
            0: "Non-Alcoholic",
            1: "Cocktails",
            2: "Wine",
            3: "Beer",
          }[optionIndex] ?? ""
        );
      case TasteProfileQuestionnairePages.spicePreferenceLevel:
        return (
          {
            0: "Mild",
            1: "Balanced",
            2: "Spicy",
          }[optionIndex] ?? ""
        );
      default:
        return "";
    }
  }

  function getIconForQuestionOptionOn({
    page,
    optionIndex,
  }: {
    page: TasteProfileQuestionnairePages;
    optionIndex: number;
  }): any | undefined {
    switch (page) {
      case TasteProfileQuestionnairePages.distancePreferenceLevel:
        return (
          {
            0: ImageRepository.TasteProfileIcons.TasteProfileDistanceOption1,
            1: ImageRepository.TasteProfileIcons.TasteProfileDistanceOption2,
            2: ImageRepository.TasteProfileIcons.TasteProfileDistanceOption3,
          }[optionIndex] ?? ""
        );
      case TasteProfileQuestionnairePages.diningPurpose:
        return (
          {
            0: ImageRepository.TasteProfileIcons.TasteProfileDiningOption1,
            1: ImageRepository.TasteProfileIcons.TasteProfileDiningOption2,
            2: ImageRepository.TasteProfileIcons.TasteProfileDiningOption3,
            3: ImageRepository.TasteProfileIcons.TasteProfileDiningOption4,
          }[optionIndex] ?? ""
        );
      case TasteProfileQuestionnairePages.ambiancePreference:
        return (
          {
            0: ImageRepository.TasteProfileIcons.TasteProfileAmbianceOption1,
            1: ImageRepository.TasteProfileIcons.TasteProfileAmbianceOption2,
            2: ImageRepository.TasteProfileIcons.TasteProfileAmbianceOption3,
            3: ImageRepository.TasteProfileIcons.TasteProfileAmbianceOption4,
          }[optionIndex] ?? ""
        );
      case TasteProfileQuestionnairePages.drinkPreference:
        return (
          {
            0: ImageRepository.TasteProfileIcons.TasteProfileDrinkOption1,
            1: ImageRepository.TasteProfileIcons.TasteProfileDrinkOption2,
            2: ImageRepository.TasteProfileIcons.TasteProfileDrinkOption3,
            3: ImageRepository.TasteProfileIcons.TasteProfileDrinkOption4,
          }[optionIndex] ?? ""
        );
      case TasteProfileQuestionnairePages.spicePreferenceLevel:
        return (
          {
            0: ImageRepository.TasteProfileIcons.TasteProfileSpiceSlash,
            1: ImageRepository.TasteProfileIcons.TasteProfileSpice,
          }[optionIndex] ?? ""
        );
      default:
        return undefined;
    }
  }

  function CurrentPage() {
    const page = currentQuestionnairePageIndex;

    switch (page) {
      case TasteProfileQuestionnairePages.adventureLevel:
        return TasteProfilePageTemplate({
          page,
          ...getPromptsFor(page),
          children: MultipleChoiceQuestionTemplate({
            children: [
              ...Array(
                MultipleChoiceQuestionAnswerRanges.adventureLevelRange.max + 1
              ),
            ].map((_, optionIndex) => {
              return (
                <TPQOptionButton
                  title={getTextForQuestionOptionOn({ page, optionIndex })}
                  onClick={() =>
                    handleMultipleChoiceSelection(
                      setAdventureLevel,
                      adventureLevel == optionIndex ? undefined : optionIndex,
                      MultipleChoiceQuestionAnswerRanges.adventureLevelRange
                    )
                  }
                  isSelected={adventureLevel == optionIndex}
                  key={optionIndex}
                >
                  <p>{getTextForQuestionOptionOn({ page, optionIndex })}</p>
                </TPQOptionButton>
              );
            }),
          }),
        });
      case TasteProfileQuestionnairePages.preferredPriceRange:
        return TasteProfilePageTemplate({
          page,
          ...getPromptsFor(page),
          children: MultipleChoiceQuestionTemplate({
            children: [
              ...Array(
                MultipleChoiceQuestionAnswerRanges.preferredPriceRangeRange
                  .max + 1
              ),
            ].map((_, optionIndex) => {
              return (
                <TPQOptionButton
                  title={getTextForQuestionOptionOn({ page, optionIndex })}
                  onClick={() =>
                    handleMultipleChoiceSelection(
                      setPreferredPriceRange,
                      preferredPriceRange == optionIndex
                        ? undefined
                        : optionIndex,
                      MultipleChoiceQuestionAnswerRanges.preferredPriceRangeRange
                    )
                  }
                  isSelected={preferredPriceRange == optionIndex}
                  key={optionIndex}
                >
                  <p>{getTextForQuestionOptionOn({ page, optionIndex })}</p>
                </TPQOptionButton>
              );
            }),
          }),
        });
      case TasteProfileQuestionnairePages.distancePreferenceLevel:
        return TasteProfilePageTemplate({
          page,
          ...getPromptsFor(page),
          children: MultipleChoiceQuestionTemplate({
            children: [
              ...Array(
                MultipleChoiceQuestionAnswerRanges.distancePreferenceLevelRange
                  .max + 1
              ),
            ].map((_, optionIndex) => {
              return (
                <TPQOptionButton
                  title={getTextForQuestionOptionOn({ page, optionIndex })}
                  onClick={() =>
                    handleMultipleChoiceSelection(
                      setDistancePreferenceLevel,
                      distancePreferenceLevel == optionIndex
                        ? undefined
                        : optionIndex,
                      MultipleChoiceQuestionAnswerRanges.distancePreferenceLevelRange
                    )
                  }
                  isSelected={distancePreferenceLevel == optionIndex}
                  key={optionIndex}
                >
                  <div className="flex flex-row gap-x-[16px] shrink-0 items-center justify-center">
                    <Image
                      src={getIconForQuestionOptionOn({ page, optionIndex })}
                      alt="Taste Profile Question Option Icon"
                      className="h-[32px] w-[32px]"
                      height={32}
                      width={32}
                      loading="eager"
                      fetchPriority="high"
                      unselectable="on"
                      unoptimized
                    />
                    <p>{getTextForQuestionOptionOn({ page, optionIndex })}</p>
                  </div>
                </TPQOptionButton>
              );
            }),
          }),
        });
      case TasteProfileQuestionnairePages.diningPurpose:
        return TasteProfilePageTemplate({
          page,
          ...getPromptsFor(page),
          children: MultipleChoiceQuestionTemplate({
            children: [
              ...Array(
                MultipleChoiceQuestionAnswerRanges.diningPurposeRange.max + 1
              ),
            ].map((_, optionIndex) => {
              return (
                <TPQOptionButton
                  title={getTextForQuestionOptionOn({ page, optionIndex })}
                  onClick={() =>
                    handleMultipleChoiceSelection(
                      setDiningPurpose,
                      diningPurpose == optionIndex ? undefined : optionIndex,
                      MultipleChoiceQuestionAnswerRanges.diningPurposeRange
                    )
                  }
                  isSelected={diningPurpose == optionIndex}
                  key={optionIndex}
                >
                  <div className="flex flex-row gap-x-[16px] shrink-0 items-center justify-center">
                    <Image
                      src={getIconForQuestionOptionOn({ page, optionIndex })}
                      alt="Taste Profile Question Option Icon"
                      className="h-[32px] w-[32px]"
                      height={32}
                      width={32}
                      loading="eager"
                      fetchPriority="high"
                      unselectable="on"
                      unoptimized
                    />
                    <p>{getTextForQuestionOptionOn({ page, optionIndex })}</p>
                  </div>
                </TPQOptionButton>
              );
            }),
          }),
        });
      case TasteProfileQuestionnairePages.ambiancePreference:
        return TasteProfilePageTemplate({
          page,
          ...getPromptsFor(page),
          children: MultipleChoiceQuestionTemplate({
            children: [
              ...Array(
                MultipleChoiceQuestionAnswerRanges.ambiancePreferenceRange.max +
                  1
              ),
            ].map((_, optionIndex) => {
              return (
                <TPQOptionButton
                  title={getTextForQuestionOptionOn({ page, optionIndex })}
                  onClick={() =>
                    handleMultipleChoiceSelection(
                      setAmbiancePreference,
                      ambiancePreference == optionIndex
                        ? undefined
                        : optionIndex,
                      MultipleChoiceQuestionAnswerRanges.ambiancePreferenceRange
                    )
                  }
                  isSelected={ambiancePreference == optionIndex}
                  key={optionIndex}
                >
                  <div className="flex flex-row gap-x-[16px] shrink-0 items-center justify-center">
                    <Image
                      src={getIconForQuestionOptionOn({ page, optionIndex })}
                      alt="Taste Profile Question Option Icon"
                      className="h-[32px] w-[32px]"
                      height={32}
                      width={32}
                      loading="eager"
                      fetchPriority="high"
                      unselectable="on"
                      unoptimized
                    />
                    <p>{getTextForQuestionOptionOn({ page, optionIndex })}</p>
                  </div>
                </TPQOptionButton>
              );
            }),
          }),
        });
      case TasteProfileQuestionnairePages.drinkPreference:
        return TasteProfilePageTemplate({
          page,
          ...getPromptsFor(page),
          children: MultipleChoiceQuestionTemplate({
            children: [
              ...Array(
                MultipleChoiceQuestionAnswerRanges.drinkPreferenceRange.max + 1
              ),
            ].map((_, optionIndex) => {
              return (
                <TPQOptionButton
                  title={getTextForQuestionOptionOn({ page, optionIndex })}
                  onClick={() =>
                    handleMultipleChoiceSelection(
                      setDrinkPreference,
                      drinkPreference == optionIndex ? undefined : optionIndex,
                      MultipleChoiceQuestionAnswerRanges.drinkPreferenceRange
                    )
                  }
                  isSelected={drinkPreference == optionIndex}
                  key={optionIndex}
                >
                  <div className="flex flex-row gap-x-[16px] shrink-0 items-center justify-center">
                    <Image
                      src={getIconForQuestionOptionOn({ page, optionIndex })}
                      alt="Taste Profile Question Option Icon"
                      className="h-[32px] w-[32px]"
                      height={32}
                      width={32}
                      loading="eager"
                      fetchPriority="high"
                      unselectable="on"
                      unoptimized
                    />
                    <p>{getTextForQuestionOptionOn({ page, optionIndex })}</p>
                  </div>
                </TPQOptionButton>
              );
            }),
          }),
        });
      case TasteProfileQuestionnairePages.spicePreferenceLevel:
        return TasteProfilePageTemplate({
          page,
          ...getPromptsFor(page),
          children: MultipleChoiceQuestionTemplate({
            children: [
              ...Array(
                MultipleChoiceQuestionAnswerRanges.spicePreferenceLevelRange
                  .max + 1
              ),
            ].map((_, optionIndex) => {
              return (
                <TPQOptionButton
                  title={getTextForQuestionOptionOn({ page, optionIndex })}
                  onClick={() =>
                    handleMultipleChoiceSelection(
                      setSpicePreferenceLevel,
                      spicePreferenceLevel == optionIndex
                        ? undefined
                        : optionIndex,
                      MultipleChoiceQuestionAnswerRanges.spicePreferenceLevelRange
                    )
                  }
                  isSelected={spicePreferenceLevel == optionIndex}
                  key={optionIndex}
                >
                  <div className="flex flex-row gap-x-[16px] shrink-0 items-center justify-center">
                    {/** Repeated pepper icons for the different spice preference options */}
                    {optionIndex == 0 ? (
                      /** Non-spicy icon (with the slash) */
                      <Image
                        src={getIconForQuestionOptionOn({
                          page,
                          optionIndex: 0,
                        })}
                        alt="Taste Profile Question Option Icon"
                        className="h-[32px] w-[32px]"
                        height={32}
                        width={32}
                        loading="eager"
                        fetchPriority="high"
                        unselectable="on"
                        unoptimized
                      />
                    ) : (
                      [...Array(optionIndex + 1)].map((_, count) => {
                        /** Spicy icon (without the slash) */
                        return (
                          <Image
                            src={getIconForQuestionOptionOn({
                              page,
                              optionIndex: 1,
                            })}
                            alt="Taste Profile Question Option Icon"
                            className="h-[32px] w-[32px]"
                            height={32}
                            width={32}
                            loading="eager"
                            fetchPriority="high"
                            unselectable="on"
                            key={count}
                            unoptimized
                          />
                        );
                      })
                    )}

                    <p>{getTextForQuestionOptionOn({ page, optionIndex })}</p>
                  </div>
                </TPQOptionButton>
              );
            }),
          }),
        });
      case TasteProfileQuestionnairePages.cuisines:
        // Note: React is weird, it has to be rendered like this. If not constant reloads will occur
        return TasteProfilePageTemplate({
          page,
          ...getPromptsFor(page),
          children: (
            <TPQCuisineSelector
              cuisineData={cuisineData}
              selectedCuisines={parseCuisinesFromIDs(preferredCuisines)}
              onSelectedCuisinesUpdate={handleSelectedCuisinesUpdate}
            />
          ),
        });
      case TasteProfileQuestionnairePages.dietaryRestrictions:
        return TasteProfilePageTemplate({
          page,
          ...getPromptsFor(page),
          children: (
            <TPQDietaryRestrictionSelector
              dietaryRestrictionData={dietaryRestrictionData}
              selectedDietaryRestrictions={parseDietaryRestrictionsFromIDs(
                dietaryRestrictions
              )}
              onSelectedDietaryRestrictionsUpdate={
                handleSelectedDietaryRestrictionsUpdate
              }
            />
          ),
        });
    }
  }

  // Subcomponents
  const CloseButton = (): React.ReactNode => {
    return (
      <CloseUtilityButton
        onClick={closeButtonActionHandler}
        title="Save & exit"
        className="h-[30px] w-[30px]"
      />
    );
  };

  const FonciiLogoSalmonRed = (): React.ReactNode => {
    return (
      <div className={cn("flex shrink-0 h-fit w-fit pb-[16px] cursor-default")}>
        <FonciiToolTip title="Foncii">
          <Image
            src={ImageRepository.CompanyLogos.FonciiLogoRed}
            width={89}
            height={72}
            alt="Salmon Red Foncii Logo"
            className="w-[89px] h-[72px] shrink-0"
            loading="eager"
            fetchPriority="high"
          />
        </FonciiToolTip>
      </div>
    );
  };

  // Sections
  const MainContent = (): React.ReactNode => {
    return (
      <div className="relative flex flex-col overflow-hidden items-center justify-start border-[1px] border-medium_dark_grey bg-black bg-opacity-80 shadow-lg h-full w-full sm:max-h-[775px] sm:max-w-[590px] min-w-[80dvw] md:min-w-[590px] rounded-[8px] transition-all transform-gpu ease-in-out">
        <div className="relative flex flex-col overflow-y-auto overflow-x-hidden py-[24px] px-[16px] xs:px-[32px] items-center justify-start h-full w-full sm:max-h-[775px] sm:max-w-[590px] min-w-[80dvw] md:min-w-[590px] rounded-[8px] transition-all transform-gpu ease-in-out">
          <div className="w-fit h-fit absolute top-0 left-0 p-[16px] z-[100000]">
            {CloseButton()}
          </div>

          {FonciiLogoSalmonRed()}
          {shouldDisplayGetStartedScreen() ? (
            <GetStartedScreen
              user={currentUser}
              getStartedButtonClicked={handleGetStartedButtonClick}
            />
          ) : (
            TasteProfileContent()
          )}
        </div>
        {NavigationButtons()}
      </div>
    );
  };

  const TasteProfileContent = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[24px] items-center justify-center w-full pb-[100px]">
        <TPQProgressBar
          currentPageIndex={currentQuestionnairePageIndex}
          pageCount={questionnairePageCount}
          onPageIndicatorClick={(pageIndex: number) =>
            setQuestionnairePageIndex(pageIndex)
          }
          completedPagesIndices={completedPagesIndices()}
        />
        {CurrentPage()}
      </div>
    );
  };

  // For navigating forwards and backwards within the questionnaire
  const NavigationButtons = (): React.ReactNode => {
    const completePrompt = isFTUE() ? "Create Taste Profile" : "Save Changes";

    // Don't render when displaying the initial prompt screen
    if (shouldDisplayGetStartedScreen()) return;

    return (
      <div
        className={cn(
          "fixed left-0 bottom-0 h-fit w-full flex flex-col items-center gap-y-[16px]"
        )}
      >
        {canUserSubmitTasteProfileChanges() ? (
          <div className="flex items-center justify-center w-full h-fit px-[32px]">
            <TPQCTAButton
              title={completePrompt}
              onClick={setTasteProfileAction}
              className="w-full"
            />
          </div>
        ) : undefined}

        <div
          className={cn(
            "h-fit w-full bg-opacity-90 bg-black flex flex-row items-center px-[32px] pt-[8px] pb-[16px] gap-x-[16px]",
            !canNavigateBackward()
              ? "justify-end"
              : !canNavigateForward()
              ? "justify-start"
              : "justify-between"
          )}
        >
          {canNavigateBackward() ? (
            <TPQNavigationButton
              direction={TPQNavigationButtonDirection.backward}
              onClick={() =>
                setQuestionnairePageIndex((currPageIndex) =>
                  Math.max(minQuestionnairePageIndex, currPageIndex - 1)
                )
              }
            />
          ) : undefined}

          {canNavigateForward() ? (
            <TPQNavigationButton
              direction={TPQNavigationButtonDirection.forward}
              onClick={() =>
                setQuestionnairePageIndex((currPageIndex) =>
                  Math.min(maxQuestionnairePageIndex, currPageIndex + 1)
                )
              }
            />
          ) : undefined}
        </div>
      </div>
    );
  };

  return (
    <FonciiModal isPresented onDismiss={closeButtonActionHandler}>
      {MainContent()}

      {/** Dialogs */}
      <ConfirmationDialog
        confirmationDialogTemplate={DialogTemplates.ExitFTUETasteProfileQuiz({
          onCancel: () => setDisplaySaveAndExitConfirmationDialog(false),
          onConfirm: setTasteProfileAction,
        })}
        isDisplayed={displaySaveAndExitConfirmationDialog}
      />
    </FonciiModal>
  );
}

// Initial screen for users first creating their taste
function GetStartedScreen({
  user,
  getStartedButtonClicked,
}: {
  user: FmUser;
  getStartedButtonClicked: () => void;
}) {
  // Parsing
  const formattedFirstName = uppercaseFirstLetter(
    (user.firstName ?? "").toLowerCase()
  );

  // Text Prompts
  const introductionStatement = `Hi ${formattedFirstName}! 👋`,
    intentStatement = "Lets get started on your taste profile.",
    actionStatement =
      "Share a few insights about your taste and restaurant preferences, and we'll hook you up with personalized restaurant recs.",
    buttonPrompt = "Get Started";

  // Assets
  const illustrationImage =
    ImageRepository.Illustrations.TasteProfileGetStartedIllustration;

  // Subcomponents
  const IntroductionPrompt = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[8px] text-start items-start justify-center text-[22px] leading-[1] xl:text-[24px] break-words w-fit h-fit font-medium text-permanent_white">
        <p className="w-fit h-fit line-clamp-1">{introductionStatement}</p>
        <p className="w-fit h-fit">{intentStatement}</p>
      </div>
    );
  };

  const ExperimentalFeatureTag = (): React.ReactNode => {
    const IconImage = (): React.ReactNode => {
      return (
        <Image
          src={ImageRepository.UtilityIcons.BlueInfoIcon}
          height={32}
          width={32}
          alt="Blue Info Icon"
          className="h-[28px] w-[28px] md:h-[32px] md:w-[32px]"
        />
      );
    };

    return (
      <div className="h-[56px] w-full bg-medium_dark_grey rounded-[16px] p-[8px] flex flex-row gap-x-[8px] pointer-events-none items-center justify-between">
        {IconImage()}
        <p className="text-permanent_white font-normal text-[14px]">{`Experimental: We’re hard at work refining this feature to elevate your experience`}</p>
      </div>
    );
  };

  const ArtImageView = (): React.ReactNode => {
    const alt = "Foodie Noodle Soup";

    return (
      <div className="flex flex-col items-center justify-center gap-y-[8px] h-fit w-full">
        {ExperimentalFeatureTag()}
        <AnimatePresence>
          <motion.div
            className="flex flex-row gap-x-[16px] items-center justify-start w-full h-fit pointer-events-auto"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              ease: "anticipate",
              duration: 1,
            }}
          >
            <Image
              src={illustrationImage}
              height={157}
              width={228}
              alt={alt}
              className="h-fit min-h-[35dvh] w-fit object-contain"
              fetchPriority="high"
              priority={true}
              unoptimized
            />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const BottomPrompt = (): React.ReactNode => {
    return (
      <div className="flex text-start text-[16px] break-words w-fit h-fit font-normal text-permanent_white">
        <p className="w-fit h-fit">{actionStatement}</p>
      </div>
    );
  };

  const GetStartedButton = (): React.ReactNode => {
    return (
      <TPQCTAButton
        title={buttonPrompt}
        onClick={getStartedButtonClicked}
        className="w-full"
      />
    );
  };

  return (
    <div className="flex flex-col w-full max-w-[90%] sm:max-w-[80%] h-fit items-center justify-center gap-y-[24px] transition-all transform-gpu duration-200 ease-in-out">
      <IntroductionPrompt />
      {ArtImageView()}
      <BottomPrompt />
      <GetStartedButton />
    </div>
  );
}
