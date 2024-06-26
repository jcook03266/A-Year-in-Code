/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Hooks
import { useEffect, useRef, useState } from "react";

// Components
import CloseUtilityButton from "../../../components/buttons/utility-buttons/close-button/CloseUtilityButton";
import FonciiModal from "../../../components/modals/foncii-base-modal/FonciiModal";
import ImportExperiencesLoadingScreen from "../../../components/loading-screens/ImportExperiencesLoadingScreen";

// Redux
import { getUserPostsSlice } from "../../../redux/operations/selectors";

// Utils
import { UnitsOfTimeInMS } from "../../../utilities/common/time";

/**
 * Simple modal for displaying an animated loading screen for the user to look at
 * when they first import their posts in order to inform them of what's going on
 * when they first import / connect their social media. This is only displayed on
 * the explore page as that's where the user will first be after they connect their
 * social media. The gallery page / My Map has its own loader.
 */
export default function ImportExperienceLoaderModal() {
  // Constants
  // Modal automatically closes after 4 seconds unless the user manually closes the modal before then
  const MODAL_DISMISS_TRANSITION_DELAY_MS = UnitsOfTimeInMS.second * 4;

  // State Management
  const [isPresented, setIsPresented] = useState(false);

  // Redux
  const userPostsState = getUserPostsSlice()();

  // Transition delay timer
  const dismissTransitionTimeout = useRef<NodeJS.Timeout | undefined>(
    undefined
  );

  // Automatic presentation lifecycle management
  useEffect(() => {
    // Display on first user import, and auto-dismiss only when the modal is being displayed
    if (isImportingPosts() && isFirstUserImport()) {
      setIsPresented(true);
    } else if (isPresented) {
      clearTimeout(dismissTransitionTimeout.current);

      // Dismiss the modal automatically after the specified delay period for
      // stylistic effect
      dismissTransitionTimeout.current = setTimeout(() => {
        setIsPresented(false);
      }, MODAL_DISMISS_TRANSITION_DELAY_MS);
    }

    return () => {
      clearTimeout(dismissTransitionTimeout.current);
      dismissTransitionTimeout.current = undefined;
    };
  }, [
    userPostsState.isImportingPosts,
    userPostsState.isFirstImport,
    userPostsState.importFailed,
  ]);

  // Navigation Actions
  const dismissModalAction = () => {
    clearTimeout(dismissTransitionTimeout.current);
    setIsPresented(false);
  };

  // Convenience
  const isImportingPosts = () => {
    return userPostsState.isImportingPosts;
  };

  const isFirstUserImport = () => {
    return userPostsState.isFirstImport;
  };

  const errorDidOccur = () => {
    return userPostsState.importFailed;
  };

  // Action Handlers
  const closeButtonActionHandler = () => {
    dismissModalAction();
  };

  // Subcomponents
  const CloseButton = (): React.ReactNode => {
    return (
      <CloseUtilityButton
        onClick={closeButtonActionHandler}
        className="h-[30px] w-[30px]"
      />
    );
  };

  const MainContent = (): React.ReactNode => {
    return (
      <div className="relative flex flex-col overflow-hidden items-center justify-start border-[1px] border-medium_dark_grey bg-black bg-opacity-80 shadow-lg h-full xs:max-h-[75%] w-full max-w-[85%] xs:max-w-[560px] rounded-[8px] transition-all ease-in-out">
        <div className="relative flex flex-col overflow-y-auto overflow-x-hidden gap-y-[16px] py-[24px] px-[24px] items-center justify-center h-full w-full rounded-[8px] transition-all ease-in-out">
          <div className="w-fit h-fit absolute top-0 left-0 p-[16px] z-[100000]">
            {CloseButton()}
          </div>
          <ImportExperiencesLoadingScreen
            isLoading={isImportingPosts()}
            errorDidOccur={errorDidOccur()}
          />
        </div>
      </div>
    );
  };

  return (
    <FonciiModal
      isPresented={isPresented}
      onDismiss={closeButtonActionHandler}
      dismissableOverlay
    >
      {MainContent()}
    </FonciiModal>
  );
}
