/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { Restaurant } from "../../../__generated__/graphql";

// Hooks
import React, { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";

// Components
// Local
import OnboardingWelcomeScreen from "./onboarding-welcome-screen/OnboardingWelcomeScreen";
import RestaurantSelectionOnboardingScreen from "./restaurant-selection-onboarding-screen/RestaurantSelectionOnboardingScreen";
import SocialMediaConnectionOnboardingScreen from "./social-media-connection-onboarding-screen/SocialMediaConnectionOnboardingScreen";
import FonciiModal from "../../../components/modals/foncii-base-modal/FonciiModal";
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Redux
import {
  FonciiUserActions,
  NotificationCenterActions,
} from "../../../redux/operations/dispatchers";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";
import { uppercaseFirstLetter } from "../../../utilities/formatting/textContentFormatting";
import { delay } from "../../../utilities/common/scheduling";

// Navigation
import {
  ExternalLinks,
  NavigationProperties,
} from "../../../core-foncii-maps/properties/NavigationProperties";

// Notifications
import { NotificationTemplates } from "../../../core-foncii-maps/repositories/NotificationTemplates";

// Redux
import { getFonciiUserSlice } from "../../../redux/operations/selectors";

// Types
enum OnboardingModalPages {
  Welcome,
  FavoriteRestaurantSelection,
  ConnectInstagram,
}

export default function OnboardingModal({ userID }: { userID: string }) {
  // State Management
  // Redux
  const fonciiUser = getFonciiUserSlice()();

  // Navigation
  const [currentPageIndex, setCurrentPageIndex] =
    useState<OnboardingModalPages>(0);

  // Restaurants
  const [selectedRestaurants, setSelectedRestaurants] = useState<Restaurant[]>(
    []
  );

  // Navigation side effects
  useEffect(() => {
    conditionallyRedirectIsolatedUser();
  }, [userID]);

  // Conditional rendering
  const conditionallyRedirectIsolatedUser = () => {
    if (!isUserAuthorizedToViewOnboarding()) {
      notFound();
    }
  };

  // Routing
  const router = useRouter();

  // Limits
  // Navigation
  const minPageIndex = OnboardingModalPages.FavoriteRestaurantSelection,
    maxPageIndex = OnboardingModalPages.ConnectInstagram;

  // Onboarding process
  const restaurantSelectionMinReq = 3;

  // Convenience
  const shouldDisplayOnboardingWelcomeScreen = (): boolean => {
    return currentPageIndex == OnboardingModalPages.Welcome;
  };

  const shouldDisplayPageIndicator = (): boolean => {
    return !shouldDisplayOnboardingWelcomeScreen();
  };

  // Highlighted when the user has made enough selections for the restaurant selection screen
  const shouldNextButtonBeHighlighted = (): boolean => {
    return (
      currentPageIndex == OnboardingModalPages.FavoriteRestaurantSelection &&
      canAutoGenerateUserTasteProfile()
    );
  };

  const displayForwardNavigationButton = (): boolean => {
    return !shouldDisplayOnboardingWelcomeScreen();
  };

  const shouldBackButtonBeDisplayed = (): boolean => {
    return currentPageIndex > minPageIndex;
  };

  const shouldSkipButtonBeDisplayed = (): boolean => {
    return currentPageIndex == OnboardingModalPages.ConnectInstagram;
  };

  const shouldNextButtonBeDisplayed = (): boolean => {
    return (
      currentPageIndex >= OnboardingModalPages.FavoriteRestaurantSelection &&
      currentPageIndex < OnboardingModalPages.ConnectInstagram
    );
  };

  const canAutoGenerateUserTasteProfile = (): boolean => {
    return selectedRestaurants.length >= restaurantSelectionMinReq;
  };

  // Only first time users / users with no existing taste profile can
  const isUserAuthorizedToViewOnboarding = (): boolean => {
    // Using redux store in case user manager isn't up to date yet, (maybe test this in the future to replace this implementation)
    return fonciiUser.isFTUE && fonciiUser.user?.id == userID;
  };

  // Action Handlers
  const handleSelectedRestaurantsUpdate = (
    selectedRestaurants: Restaurant[]
  ) => {
    setSelectedRestaurants(selectedRestaurants);
  };

  const onboardingCompletionHandler = (isConnectingSocialMedia: boolean) => {
    // Auto-generate the user's taste profile if possible
    if (canAutoGenerateUserTasteProfile()) {
      const selectedRestaurantIDs = selectedRestaurants.map(
        (restaurant) => restaurant.id
      );
      FonciiUserActions.autoGenerateTasteProfile(selectedRestaurantIDs);
    }

    // Mark FTUE as complete
    FonciiUserActions.completeFTUE();

    // Delayed redirect
    if (isConnectingSocialMedia) {
      // Navigate to Instagram's auth redirect page where the user will then come back with an access token for the integration context to parse
      // and process. Note: Opening in a separate tab creates a new session / doesn't go back to the existing / origin tab
      delay(() => {
        window.open(
          ExternalLinks.instagramOAuthRedirectLink(location.origin),
          "_self"
        );
      }, 3000);
    }

    // Personalization
    const firstName = uppercaseFirstLetter(fonciiUser.user?.firstName ?? "");
    NotificationCenterActions.triggerSystemNotification(
      NotificationTemplates.FirstLogIn(firstName)
    );

    // Automatic redirection
    // Connecting a social media will redirect the user back here anyways, both users will end up here eventually
    router.replace(NavigationProperties.explorePageLink());
  };

  // Actions
  const navigateBackward = () => {
    setCurrentPageIndex((currPageIndex) =>
      Math.max(currPageIndex - 1, minPageIndex)
    );
  };

  const navigateForward = () => {
    setCurrentPageIndex((currPageIndex) =>
      Math.min(currPageIndex + 1, maxPageIndex)
    );

    // Onboarding finished, user skipped the social media connection screen
    if (currentPageIndex == maxPageIndex) {
      onboardingCompletionHandler(false);
    }
  };

  const navigateToPage = (page: OnboardingModalPages) => {
    setCurrentPageIndex(page);
  };

  // Subcomponents
  const BackButton = (): React.ReactNode => {
    const icon = ImageRepository.UtilityIcons.LeftChevronNavigationIcon;

    return (
      <button
        className={cn(
          "flex flex-row gap-x-[16px] px-[16px] h-[32px] rounded-[15px] items-center justify-center hover:shadow-xl hover:bg-primary shrink-0 hover:opacity-75 transition-all ease-in-out transform-gpu active:scale-90",
          shouldBackButtonBeDisplayed()
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        )}
        onClick={navigateBackward}
      >
        <Image
          src={icon}
          height={18}
          className="h-[18px] w-fit"
          alt="Back Button Direction Indicator Icon"
          loading="eager"
          fetchPriority="high"
        />
        <FonciiToolTip title="Navigate Backwards">
          <p className="text-permanent_white text-[16px] xl:text-[18px] line-clamp-1 font-normal">
            Back
          </p>
        </FonciiToolTip>
      </button>
    );
  };

  const NextButton = (): React.ReactNode => {
    if (!displayForwardNavigationButton()) return;

    const title = shouldNextButtonBeDisplayed()
      ? "Next"
      : shouldSkipButtonBeDisplayed()
        ? "Skip"
        : "";

    return (
      <button
        className={cn(
          "flex flex-row px-[16px] h-[32px] items-center justify-center rounded-[15px] hover:shadow-xl hover:bg-primary shrink-0 hover:opacity-75 transition-all ease-in-out transform-gpu active:scale-90",
          shouldNextButtonBeHighlighted() ? "bg-primary" : "bg-transparent",
          displayForwardNavigationButton()
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        )}
        onClick={navigateForward}
      >
        <FonciiToolTip title="Navigate Forward">
          <p className="text-permanent_white text-[16px] xl:text-[18px] line-clamp-1 font-normal">
            {title}
          </p>
        </FonciiToolTip>
      </button>
    );
  };

  const FonciiLogoSalmonRed = (): React.ReactNode => {
    return (
      <div className={cn("flex shrink-0 h-fit w-fit")}>
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

  const Header = (): React.ReactNode => {
    return (
      <>
        <div className="fixed top-[32px] left-0 px-[16px] xs:px-[32px]">
          <BackButton />
        </div>

        <div className={cn("relative w-fit flex items-center justify-center px-[16px] xs:px-[32px]", currentPageIndex == OnboardingModalPages.ConnectInstagram ? 'hidden' : '')}>
          {FonciiLogoSalmonRed()}
        </div>

        <div className="fixed top-[32px] right-0 px-[16px] xs:px-[32px]">
          <NextButton />
        </div>
      </>
    );
  };

  const PageIndicator = (): React.ReactNode => {
    if (!shouldDisplayPageIndicator()) return;

    return (
      <div className="fixed w-full h-fit bottom-[18px] flex items-center justify-center shrink-0">
        <div className="w-fit h-fit flex flex-row gap-x-[18px] px-[18px] py-[8px] rounded-full bg-medium_dark_grey bg-opacity-75 border-[1px] border-medium">
          {[
            OnboardingModalPages.FavoriteRestaurantSelection,
            OnboardingModalPages.ConnectInstagram,
          ].map((pageIndex) => {
            return <PageIndicatorDot key={pageIndex} pageIndex={pageIndex} />;
          })}
        </div>
      </div>
    );
  };

  const PageIndicatorDot = ({
    pageIndex,
  }: {
    pageIndex: OnboardingModalPages;
  }): React.ReactNode => {
    const isActive = pageIndex == currentPageIndex;

    return (
      <button
        title={`Page ${pageIndex + 1 - 1}`} // - 1 because the first page isn't reachable by the following pages
        className={cn(
          isActive ? "bg-neutral" : "bg-black",
          "h-[8px] rounded-full w-[8px] shrink-0 hover:scale-120 hover:opacity-75 active:scale-90 transition-all transform-gpu ease-in-out"
        )}
        onClick={() => navigateToPage(pageIndex)}
      />
    );
  };

  // Sections
  const MainContent = (): React.ReactNode => {
    return (
      <div
        className={`flex flex-col items-center justify-center transition-all ease-in-out z-[10001] relative backdrop-blur-lg h-full w-full overflow-x-hidden overflow-y-auto pointer-events-auto`}
      >
        <div className="relative flex flex-col overflow-hidden items-center justify-start border-[1px] border-medium_dark_grey bg-black bg-opacity-80 shadow-lg h-full w-full sm:max-h-[775px] sm:max-w-[590px] min-w-[80dvw] md:min-w-[590px] rounded-[8px] transition-all transform-gpu ease-in-out">
          <div className="relative flex flex-col overflow-y-auto overflow-x-hidden py-[24px] gap-y-[16px] items-center justify-start h-full w-full sm:max-h-[775px] sm:max-w-[590px] min-w-[80dvw] md:min-w-[590px] rounded-[8px] transition-all transform-gpu ease-in-out">
            {Header()}
            {CurrentPage()}
          </div>
          {PageIndicator()}
        </div>
      </div>
    );
  };

  const CurrentPage = (): React.ReactNode => {
    switch (currentPageIndex) {
      // Welcome
      case OnboardingModalPages.Welcome:
        return (
          <OnboardingWelcomeScreen
            didClickContinueButton={() => navigateForward()}
          />
        );
      // Favorite Restaurant Selection
      case OnboardingModalPages.FavoriteRestaurantSelection:
        return (
          <RestaurantSelectionOnboardingScreen
            selectedRestaurants={selectedRestaurants}
            onSelectedRestaurantsUpdate={handleSelectedRestaurantsUpdate}
          />
        );
      // Connect Instagram
      case OnboardingModalPages.ConnectInstagram:
        return (
          <SocialMediaConnectionOnboardingScreen
            didClickConnectAccountButton={() =>
              onboardingCompletionHandler(true)
            }
          />
        );
      // Unknown
      default:
        return undefined;
    }
  };

  return (
    <FonciiModal isPresented dismissableOverlay={false}>
      {MainContent()}
    </FonciiModal>
  );
}
