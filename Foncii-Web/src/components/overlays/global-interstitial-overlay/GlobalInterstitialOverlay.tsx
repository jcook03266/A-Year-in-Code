"use client";
// Dependencies
// Redux
import { getFonciiUserSlice } from "../../../redux/operations/selectors";

// Hooks
import { useEffect } from "react";

// Utils
import { cn } from "../../../utilities/development/DevUtils";

// Overlay that disables user interactions while the web app
// is transitioning between UI states, used when signing out
export const GlobalInterstitialOverlay = (): React.ReactNode => {
  // State Management
  const fonciiUser = getFonciiUserSlice()();

  // Effects for Reactive UI updates
  useEffect(() => { }, [fonciiUser.signingIn, fonciiUser.signingOut]);

  // Convenience
  const isAuthOperationInProgress = (): boolean => {
    const operationInProgress = fonciiUser.signingOut;

    return operationInProgress;
  };

  const shouldDisplay = (): boolean => {
    return isAuthOperationInProgress();
  };

  // Note: This element's z-index is 1 index (9998 vs 9999) behind the top loader so that
  // the loading indicator is visible during the transition
  return (
    <div
      className={cn('z-[9998] w-[100dvw] fixed top-0 left-0 bg-system_black bg-opacity-80 flex transition-all ease-in duration-300',
        shouldDisplay() ? "h-[100dvh]" : "h-[0px]"
      )}
    />
  );
};
