"use client";
// Dependencies
// Types
import {
  FonciiUserProfileTasks,
  ProfileTask,
} from "../../../../../__generated__/graphql";

// Hooks
import { useRouterSearchParams } from "../../../../../hooks/UseRouterSearchParamsHook";
import { useRouter } from "next/navigation";

// Navigation
import {
  ExternalLinks,
  NavigationProperties,
  SharedURLParameters,
} from "../../../../../core-foncii-maps/properties/NavigationProperties";

// Managers
import UserManager from "../../../../../managers/userManager";

// Components
// Local
import CheckMarkToggleButton from "../../../../../components/buttons/toggle-buttons/check-mark-toggle-button/CheckMarkToggleButton";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../../public/assets/images/ImageRepository";

// Utilities
import { cn } from "../../../../../utilities/development/DevUtils";

// Types
interface ProfileTaskTrackerProps {
  profileTasks: ProfileTask[];
}

export default function ProfileTaskTracker({
  profileTasks,
}: ProfileTaskTrackerProps) {
  // Properties
  const currentUser = UserManager.shared.currentUser();

  // URL-State Persistence
  const routerSearchParams = useRouterSearchParams();

  // Routing
  const router = useRouter();

  // Convenience
  const totalProfileTasks = profileTasks.length;
  const totalCompletedProfileTasks = profileTasks.filter(
    (profileTask) => profileTask.isComplete
  ).length;
  const profileTaskCompletedPercentage =
    (totalCompletedProfileTasks / totalProfileTasks) * 100;

  // Dynamic Text
  const taskCompletionProgressText = `${totalCompletedProfileTasks} of ${totalProfileTasks} completed`;

  const profileTaskRowTitle = (profileTask: ProfileTask): string => {
    switch (profileTask.id) {
      case FonciiUserProfileTasks.CreateAccount:
        return "Create an account";
      case FonciiUserProfileTasks.ConnectSocialMedia:
        return "Connect your Instagram";
      case FonciiUserProfileTasks.CreateTastProfile:
        return "Fill out your taste profile";
      case FonciiUserProfileTasks.InviteFriend:
        return "Invite a friend";
    }
  };

  // Actions
  const profileTaskRowAction = (profileTask: ProfileTask): (() => void) => {
    switch (profileTask.id) {
      case FonciiUserProfileTasks.CreateAccount:
        // Void b/c this is just a symbolic profile task, no action is needed as the user already has an account
        return () => {};

      case FonciiUserProfileTasks.ConnectSocialMedia:
        // Prompt the user to connect their Instagram by redirecting them to the IG auth modal
        return () =>
          window.open(
            ExternalLinks.instagramOAuthRedirectLink(location.origin),
            "_self"
          );

      case FonciiUserProfileTasks.CreateTastProfile:
        // Trigger taste profile questionnaire
        return () =>
          router.push(
            NavigationProperties.tasteProfilePageLink(currentUser?.id)
          );

      case FonciiUserProfileTasks.InviteFriend:
        // Triggers referral link share sheet modal
        return () =>
          routerSearchParams.setParams({
            [SharedURLParameters.displayUserReferralModal]: true,
          });
    }
  };

  // Subcomponents
  const SectionHeader = (): React.ReactNode => {
    return (
      <h3 className="text-[16px] font-semibold text-permanent_white line-clamp-1 w-full text-left h-fit">
        Complete your profile
      </h3>
    );
  };

  const TaskCompletionProgressLabel = (): React.ReactNode => {
    return (
      <p className="text-[12px] font-normal text-permanent_white line-clamp-1 w-full text-left h-fit">
        {taskCompletionProgressText}
      </p>
    );
  };

  const ProgressBar = (): React.ReactNode => {
    return (
      <div
        title={`${profileTaskCompletedPercentage}% complete`}
        className="flex flex-row gap-x-[8px] shrink-0 h-fit w-full"
      >
        {profileTasks.map((_, index) => {
          // Ex.) 2 tasks complete = 2 bars filled from left to right
          const isCompleteUpToThisIndex =
            totalCompletedProfileTasks >= index + 1;

          return (
            <ProgressBarSegment
              key={index}
              isComplete={isCompleteUpToThisIndex}
            />
          );
        })}
      </div>
    );
  };

  const ProgressBarSegment = ({
    isComplete,
  }: {
    isComplete: boolean;
  }): React.ReactNode => {
    return (
      <div
        title={`${profileTaskCompletedPercentage}% complete`}
        className={cn(
          "h-[6px] w-full rounded-full shadow-xl",
          isComplete ? "bg-primary" : "bg-medium"
        )}
      />
    );
  };

  const ProfileTaskRow = ({
    profileTask,
  }: {
    profileTask: ProfileTask;
  }): React.ReactNode => {
    const ChevronLinkIndicator = (): React.ReactNode => {
      if (profileTask.isComplete) return;

      return (
        <Image
          src={ImageRepository.UtilityIcons.RightChevronLinkIcon}
          alt={`Link Icon`}
          height={12}
          width={12}
          className={`h-fit w-fit transition-all ease-in-out duration-200 shrink-0`}
          unselectable="on"
        />
      );
    };

    const RowContent = (): React.ReactNode => {
      return (
        <button
          title={
            profileTask.isComplete
              ? "Task complete"
              : `${profileTaskRowTitle(profileTask)} to complete this task.`
          }
          className="flex flex-row gap-x-[10px] justify-between items-center h-fit w-fit shrink-0 hover:opacity-75 transition-opacity ease-in-out"
          onClick={profileTaskRowAction(profileTask)}
          disabled={profileTask.isComplete}
        >
          <p className="text-[14px] font-normal text-permanent_white line-clamp-1 text-left shrink-0">
            {profileTaskRowTitle(profileTask)}
          </p>
          <ChevronLinkIndicator />
        </button>
      );
    };

    return (
      <div className="flex flex-row gap-x-[10px] items-center justify-start w-full h-fit">
        <CheckMarkToggleButton
          className="rounded-full"
          toggled={profileTask.isComplete}
          disabled={true}
        />
        <RowContent />
      </div>
    );
  };

  const ProfileTaskList = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[8px] w-full h-fit items-center justify-start pt-[4px]">
        {profileTasks.map((profileTask, index) => {
          return (
            <span className="w-full h-fit" key={index}>
              {ProfileTaskRow({ profileTask })}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-y-[12px] items-center justify-center px-[24px] pb-[12px]">
      <SectionHeader />
      <ProgressBar />
      <TaskCompletionProgressLabel />
      {ProfileTaskList()}
    </div>
  );
}
