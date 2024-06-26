"use client";
// Dependencies
// Types
import {
  FmUserPost,
  FonciiRestaurant,
} from "../../../../__generated__/graphql";

// Redux
import { FonciiRestaurantActions } from "../../../../redux/operations/dispatchers";

// Hooks
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";

// Components
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";
import { AuthForms } from "../../../../components/modals/auth-modal/AuthModal";

// Styling
import ColorRepository, {
  ColorEnum,
} from "../../../../../public/assets/ColorRepository";

// Navigation
import { SharedURLParameters } from "../../../../core-foncii-maps/properties/NavigationProperties";

// Managers
import UserManager from "../../../../managers/userManager";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";

interface SaveRestaurantButtonProps {
  fonciiRestaurant: FonciiRestaurant;
  /** Optional post included in the save handle operation if the restaurant was saved from a user post */
  post?: FmUserPost;
  /** Some function to execute when the async save operation is handled */
  onComplete?: (didSucceed: Boolean) => void;
}

export const SaveRestaurantButton = ({
  fonciiRestaurant,
  post,
  onComplete,
}: SaveRestaurantButtonProps): React.ReactNode => {
  // Navigation
  const routerSearchParams = useRouterSearchParams();

  // Actions
  // Prompts the user to login to continue with the attempted action
  const triggerAuthModal = () => {
    routerSearchParams.setParams({
      [SharedURLParameters.displayAuthModal]: true,
      [SharedURLParameters.currentAuthForm]: AuthForms.LogIn,
    });
  };

  const saveRestaurantAction = async () => {
    if (shouldTriggerAuthModal()) {
      triggerAuthModal();
      return;
    }

    const didSucceed = await FonciiRestaurantActions.handleRestaurantSave({
      fonciiRestaurant,
      post,
    });
    onComplete?.(didSucceed);
  };

  // Convenience
  const isSaved = (): boolean => {
    return fonciiRestaurant.isSaved;
  };

  const shouldTriggerAuthModal = (): boolean => {
    return !UserManager.shared.userAuthenticated();
  };

  // Button is filled white when the restaurant is saved, and transparent when not saved, border color stays the same
  return (
    <FonciiToolTip
      title={isSaved() ? "Unsave this experience" : "Save this experience"}
    >
      <button
        className={cn(
          "flex items-center justify-center shrink-0 bg-permanent_white rounded-full w-[32px] h-[32px] ease-in-out transition-all active:scale-90 pointer-events-auto"
        )}
        onClick={saveRestaurantAction}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="19"
          viewBox="0 0 14 19"
          fill="none"
          stroke={ColorEnum.permanent_black}
        >
          <path
            d="M7.26497 14.71L6.99998 14.5445L6.735 14.7101L1.1325 18.2116C1.09466 18.2353 1.05119 18.2484 1.00659 18.2495C0.961994 18.2507 0.917891 18.2399 0.878862 18.2183C0.839833 18.1967 0.807302 18.165 0.784643 18.1266C0.761984 18.0882 0.750022 18.0444 0.75 17.9998L0.75 1.5C0.75 1.23478 0.855357 0.980429 1.04289 0.792893C1.23043 0.605357 1.48478 0.5 1.75 0.5H12.25C12.5152 0.5 12.7696 0.605357 12.9571 0.792893C13.1446 0.98043 13.25 1.23478 13.25 1.5V17.9994C13.2499 18.0439 13.238 18.0877 13.2153 18.1261C13.1927 18.1644 13.1602 18.1961 13.1212 18.2177C13.0822 18.2393 13.0382 18.2501 12.9936 18.249C12.9493 18.2478 12.906 18.2349 12.8683 18.2116C12.8682 18.2115 12.868 18.2113 12.8678 18.2112L7.26497 14.71Z"
            stroke={
              ColorRepository.colors[
                isSaved() ? ColorEnum.transparent : ColorEnum.permanent_black
              ]
            }
            fill={
              ColorRepository.colors[
                isSaved() ? ColorEnum.primary : ColorEnum.transparent
              ]
            }
          />
        </svg>
      </button>
    </FonciiToolTip>
  );
};
