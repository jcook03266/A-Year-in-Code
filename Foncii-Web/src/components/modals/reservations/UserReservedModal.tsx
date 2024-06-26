/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Hooks
import { useRouterSearchParams } from "../../../hooks/UseRouterSearchParamsHook";

// Components
// Local
import CloseUtilityButton from "../../../components/buttons/utility-buttons/close-button/CloseUtilityButton";
import FonciiModal from "../../../components/modals/foncii-base-modal/FonciiModal";

// Navigation
import { SharedURLParameters } from "../../../core-foncii-maps/properties/NavigationProperties";

// Managers
import UserManager from "../../../managers/userManager";

export default function UserReferredModal() {
  // Properties
  const currentUser = UserManager.shared.currentUser(),
    username = currentUser?.username ?? "",
    userReferralCode = currentUser?.referralCode ?? "";

  // URL-State Persistence
  const routerSearchParams = useRouterSearchParams();

  // Convenience
  const isPresented = () => {
    return (
      routerSearchParams.getParamValue(
        SharedURLParameters.displayReservationConfirmationModal
      ) != undefined
    );
  };

  // Text Descriptions
  const title = "Were you able to successfully make a reservation?";

  // Navigation Actions
  const dismissModalAction = () => {
    routerSearchParams.removeParam(
      SharedURLParameters.displayReservationConfirmationModal
    );
  };

  // Action Handlers
  const ReservedOnClickAction =  () => {
    // TODO(FD-418): send action to backend
    dismissModalAction();
  };

  // Subcomponents
  const ActionButtonFactory = (
    title: string,
    action: () => void,
    primaryAction: boolean = false
  ): React.ReactNode => {
    return (
      <button
        className={`${
          primaryAction ? "bg-primary" : "bg-medium_dark_grey"
        } hover:opacity-70 transition-all ease-in-out rounded-[15px] w-full h-fit px-[10px] py-[5px] text-[14px] font-normal text-center border-[1px] border-medium_dark_grey`}
        onClick={action}
        aria-label={`${title} button`}
      >
        <p>{title}</p>
      </button>
    );
  };

  // Subcomponents
  const CallToAction = (): React.ReactNode => {
    return (
      <div className="flex flex-col font-normal gap-y-[12px] h-fit w-full items-center justify-center text-permanent_white text-center shrink-0">
        <p className="text-[20px]">{title}</p>
      </div>
    );
  };

  // Sections
  const TopSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col items-center justify-center h-fit w-full gap-y-[8px]">
        {CallToAction()}
      </div>
    );
  };

  const BottomSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col items-center justify-center h-fit w-full gap-y-[8px]">
        <div className="flex flex-row items-center justify-center h-fit w-full gap-x-[24px]">
            {ActionButtonFactory("Just looking", dismissModalAction, true)}
            {ActionButtonFactory("Yes", ReservedOnClickAction, true)}
        </div>
        {ActionButtonFactory("No", dismissModalAction, false)}
      </div>
    );
  };

  const MainContent = (): React.ReactNode => {
    return (
      <div className="relative flex flex-col overflow-hidden items-center justify-start border-[1px] border-medium_dark_grey bg-black bg-opacity-80 shadow-lg h-fit w-full max-w-[85%] xs:max-w-[350px] rounded-[8px] transition-all ease-in-out">
        <div className="relative flex flex-col overflow-y-auto overflow-x-hidden gap-y-[16px] p-[24px] items-center justify-start h-fit w-full rounded-[8px] transition-all ease-in-out">
          <TopSection />
          <BottomSection />
        </div>
      </div>
    );
  };

  return (
    <FonciiModal
      isPresented={isPresented()}
      onDismiss={dismissModalAction}
      dismissableOverlay
    >
      {MainContent()}
    </FonciiModal>
  );
}
