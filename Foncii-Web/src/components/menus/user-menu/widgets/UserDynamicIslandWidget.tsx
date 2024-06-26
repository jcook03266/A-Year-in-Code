/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Components
// Local
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";
import { AuthForms } from "../../../../components/modals/auth-modal/AuthModal";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Navigation Properties
import {
  PostFilterURLParameters,
  SharedURLParameters,
} from "../../../../core-foncii-maps/properties/NavigationProperties";

//Hooks
import { useEffect, useRef, useState } from "react";
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";

// Redux
import {
  getFonciiUserSlice,
  getPostFiltersSlice,
} from "../../../../redux/operations/selectors";

// Managers
import UserManager from "../../../../managers/userManager";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";

// Types
// TODO: - Implement Trending sort feature and a trending attribute for restaurants Pending due to lack of analytics
type RestaurantSortCategories =
  | PostFilterURLParameters.trendingSort
  | PostFilterURLParameters.qualitySort
  | PostFilterURLParameters.newestToOldestSort;

export interface RestaurantSortCategoryTab {
  title: string;
  icon: any;
  sortFilter: RestaurantSortCategories;
  category: RestaurantSortCategoryTabs;
}

export enum RestaurantSortCategoryTabs {
  Trending,
  New,
  TopRated,
}

export default function UserDynamicIslandWidget(): React.ReactNode {
  // URL-State Persistence
  const routerSearchParams = useRouterSearchParams();

  // State Management
  // Redux
  const fonciiUser = getFonciiUserSlice()();
  const restaurantEntityFilters = getPostFiltersSlice()();

  // UI
  const [fonciiBizDropDownToggled, setFonciiBizDropDownToggled] =
    useState(false);

  // Refresh when user data / restaurant entity filters update
  useEffect(() => { }, [fonciiUser, restaurantEntityFilters]);

  useEffect(() => {
    // Event listener for clicks on the document
    document.addEventListener("click", handleClickOutside);

    // Cleanup: remove event listener when the component unmounts
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // UI Properties
  // Object reference for the main container
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Actions
  const displayAuthModal = (defaultForm: AuthForms = AuthForms.LogIn) => {
    routerSearchParams.setParams({
      [SharedURLParameters.displayAuthModal]: true,
      [SharedURLParameters.currentAuthForm]: defaultForm,
      // Dismiss, must be done in conjunction to the other set operations
      [SharedURLParameters.displaySideMenu]: undefined,
    });
  };

  // Action Handlers
  // Function to handle click outside the main container
  const handleClickOutside = (event: any) => {
    if (
      mainContainerRef.current &&
      !mainContainerRef.current.contains(event.target)
    ) {
      // Clicked outside the main container, close the dropdown
      setFonciiBizDropDownToggled(false);
    }
  };

  const SectionVerticalDivider = (): React.ReactNode => {
    return <div className="h-full w-[1px] bg-medium rounded-full shrink-0" />;
  };

  // Unauthenticated User Subcomponents
  const SignUpButton = (): React.ReactNode => {
    return (
      <FonciiToolTip title="Sign up for Foncii today">
        <button
          onClick={() => displayAuthModal(AuthForms.SignUp)}
          className="text-white text-[16px] px-[8px] font-normal shrink-0 hover:opacity-75 transition-all ease-in-out active:scale-90"
        >
          <p>Sign up</p>
        </button>
      </FonciiToolTip>
    );
  };

  const LogInButton = (): React.ReactNode => {
    return (
      <FonciiToolTip title="Log back in and find your next experience">
        <button
          onClick={() => displayAuthModal(AuthForms.LogIn)}
          className="text-white px-[8px] text-[16px] font-normal shrink-0 hover:opacity-75 transition-all ease-in-out active:scale-90"
        >
          <p>Log in</p>
        </button>
      </FonciiToolTip>
    );
  };

  // Not used for now until Biz site is up and running
  const FonciiBizButton = (): React.ReactNode => {
    return (
      <button
        className="h-fit w-fit flex items-center justify-center"
        onClick={() => setFonciiBizDropDownToggled((state) => !state)}
      >
        <div className="flex flex-row px-[8px] gap-x-[12px] items-center justify-center text-white text-[16px] font-normal shrink-0 transition-all ease-in-out hover:opacity-75 active:scale-95">
          <p>Foncii for Business</p>
          <Image
            loading="eager"
            fetchPriority="high"
            alt="Chevron Icon"
            src={ImageRepository.UtilityIcons.RightChevronLinkIcon}
            className={cn(
              "h-[16px] w-fit transition-all ease-in-out duration-300",
              fonciiBizDropDownToggled ? "rotate-[-90deg]" : "rotate-90"
            )}
            unselectable="on"
            unoptimized
          />
        </div>

        <div
          className={cn(
            "absolute top-[48px] flex flex-col rounded-[10px] font-medium text-[24px] text-permanent_white p-[24px] gap-y-[16px] min-w-[250px] shrink-0 bg-medium_dark_grey bg-opacity-90 transition-all ease-in-out duration-300",
            fonciiBizDropDownToggled
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          )}
        >
          <p>🤫</p>
          <p className="text-[20px]">Coming Soon</p>
        </div>
      </button>
    );
  };

  const UnauthenticatedUser = (): React.ReactNode => {
    return (
      <>
        <SignUpButton />
        <SectionVerticalDivider />
        <LogInButton />
        <SectionVerticalDivider />
        {FonciiBizButton()}
      </>
    );
  };

  return (
    <div ref={mainContainerRef} className="flex flex-col z-[100001] items-end">
      {!UserManager.shared.userAuthenticated() ? (
        <div
          className={cn(
            "relative w-fit px-[16px] max-w-[400px] h-[44px] p-[8px] bg-medium_dark_grey bg-opacity-90 rounded-[10px] shadow-xl justify-start items-center gap-[16px] inline-flex pointer-events-auto transition-all ease-in-out"
          )}
        >
          {UnauthenticatedUser()}
        </div>
      ) : undefined}
    </div>
  );
}
