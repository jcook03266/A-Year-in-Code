/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { UserRoles } from "../../../../__generated__/graphql";

// Components
// Local
import CloseUtilityButton from "../../../../components/buttons/utility-buttons/close-button/CloseUtilityButton";
import UserMenuRow, { UserMenuRowProps } from "../rows/UserMenuRow";
import ProfilePictureUpdateContext from "../contexts/profile-picture-update-context/ProfilePictureUpdateContext";
import PostImportIntegrationContext from "../contexts/post-import-integration-context/PostImportIntegrationContext";
import { AuthForms } from "../../../../components/modals/auth-modal/AuthModal";
import ImpersonateContext from "../contexts/impersonate-context/ImpersonateContext";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Navigation
import { useRouter } from "next/navigation";

// Navigation Routing
import {
  NavigationProperties,
  SharedURLParameters,
} from "../../../../core-foncii-maps/properties/NavigationProperties";

// Hooks
import React, { useEffect, useState } from "react";
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";

// Formatting
import { uppercaseFirstLetter } from "../../../../utilities/formatting/textContentFormatting";

// Managers
import UserManager from "../../../../managers/userManager";
import AuthenticationManager from "../../../../managers/authenticationManager";

// Redux
import { getFonciiUserSlice } from "../../../../redux/operations/selectors";
import ProfileTaskTracker from "../components/profile-task-tracker/ProfileTaskTracker";

// Utilities
import { ClassNameValue } from "tailwind-merge";
import { cn } from "../../../../utilities/development/DevUtils";

// Menu option selection
enum UserMenuOptions {
  Explore = "Explore",
  MainUserGallery = "MainUserGallery",
  VisitedUserGallery = "VisitedUserGallery",
  UpdateProfilePicture = "UpdateProfilePicture",
  UpdateTasteProfile = "UpdateTasteProfile",
  ImportPosts = "ImportPosts",
  InviteAFriend = "InviteAFriend",
  GetHelp = "GetHelp",
  ImpersonateUser = "ImpersonateUser",
}

// Different possible contexts for the user menu
export enum MenuContexts {
  ProfilePictureContext,
  ImportIntegrationContext,
  ImpersonateUserContext,
}

// Types
export interface UserMenuProps {
  onCloseActionCallback: () => void;
  dismissCurrentContextFlag?: any;
  withCloseButton?: boolean;
  className?: ClassNameValue;
  onMenuContextChange?: (newMenuContext: MenuContexts | undefined) => void;
}

// Interactive menu for users to use to sign out and alter their account's properties
export default function UserMenu({
  onCloseActionCallback,
  dismissCurrentContextFlag,
  withCloseButton = true,
  className,
  onMenuContextChange,
}: UserMenuProps): React.ReactNode {
  // Managers
  const authenticationManager = new AuthenticationManager();

  // Properties
  const currentUser = UserManager.shared.currentUser();

  // State Management
  // Redux
  const fonciiUser = getFonciiUserSlice()();

  // Menu Context States
  const [currentContext, setCurrentContext] = useState<
    MenuContexts | undefined
  >(undefined),
    contextBeingPresented = (): boolean => currentContext != undefined;

  // Refresh when user data updates
  useEffect(() => { }, [fonciiUser]);

  // When the value of the dep changes, the current context is dismissed (ex. a menu toggle state can be passed as a dep)
  useEffect(() => {
    dismissCurrentContext();
  }, [dismissCurrentContextFlag]);

  // Routing
  const router = useRouter();

  // URL State Persistence
  const routerSearchParams = useRouterSearchParams();

  // Text Descriptions
  const currentTitle = (): string => {
    const defaultTitle = "Settings";
    let currentTitle: string = defaultTitle;

    switch (currentContext) {
      case MenuContexts.ProfilePictureContext:
        currentTitle = menuContexts()[currentContext].title;
        break;
      case MenuContexts.ImportIntegrationContext:
        currentTitle = menuContexts()[currentContext].title;
        break;
      case MenuContexts.ImpersonateUserContext:
        currentTitle = menuContexts()[currentContext].title;
        break;
    }

    return uppercaseFirstLetter(currentTitle);
  };

  const currentDescription = () => {
    switch (currentContext) {
      case MenuContexts.ProfilePictureContext:
        return "";
      case MenuContexts.ImportIntegrationContext:
        return (
          <div className="px-[24px] leading-4 text-[12px] text-neutral text-wrap">
            <p className="">Enable auto-refresh to have your posts</p>
            <p className="">automatically added to your Foncii Map.</p>
          </div>
        );
      case MenuContexts.ImpersonateUserContext:
        return (
          <div className="px-[24px] leading-4 text-[12px] text-neutral text-wrap">
            <p>Enter the username to impersonate</p>
            <p>or leave blank to stop impersonating.</p>
            <p>Then click the button to apply change</p>
          </div>
        );
    }
  };

  // Convenience
  const shouldProfileTasksBeDisplayed = (): boolean => {
    return (
      currentContext == undefined && !UserManager.shared.profileTasksComplete()
    );
  };

  // Actions
  const displayAuthModal = (defaultForm: AuthForms = AuthForms.LogIn) => {
    routerSearchParams.setParams({
      [SharedURLParameters.displayAuthModal]: true,
      [SharedURLParameters.currentAuthForm]: defaultForm,
    });
  };

  /// Orders the parent to close the menu's context in which this component is embedded within
  const closeMenuAction = (): void => {
    dismissCurrentContext();
    onCloseActionCallback();
  };

  const updateMenuContext = (menuContext: MenuContexts | undefined): void => {
    setCurrentContext(menuContext);
    onMenuContextChange?.(menuContext);
  };

  const dismissCurrentContext = () => {
    updateMenuContext(undefined);
  };

  // Back tracks from the currently presented context in this menu
  const backButtonAction = (): void => {
    dismissCurrentContext();
  };

  // Start the sign out process
  const signOutAction = (): void => {
    // Close menu automatically
    onCloseActionCallback();

    authenticationManager.signOut();
  };

  // Navigate to the login page
  const loginAction = (): void => {
    // Close menu automatically
    onCloseActionCallback();
    displayAuthModal(AuthForms.LogIn);
  };

  // Properties
  // Context Selectors
  const menuContexts = () => {
    return {
      [MenuContexts.ProfilePictureContext]: {
        title: "Profile Picture",
        label: "Update profile picture",
        icon: ImageRepository.UserMenuIcons.UpdatePFPIcon,
        onClickAction: () =>
          updateMenuContext(MenuContexts.ProfilePictureContext),
      },
      [MenuContexts.ImportIntegrationContext]: {
        title: "Import",
        label: "Import posts",
        icon: ImageRepository.UserMenuIcons.ImportPostsIcon,
        onClickAction: () =>
          updateMenuContext(MenuContexts.ImportIntegrationContext),
      },
      [MenuContexts.ImpersonateUserContext]: {
        title: "Impersonate",
        label: "Impersonate user",
        icon: ImageRepository.UserMenuIcons.UpdatePFPIcon,
        onClickAction: () =>
          updateMenuContext(MenuContexts.ImpersonateUserContext),
      },
    };
  };

  const MenuOptionRows = {
    [UserMenuOptions.Explore]: {
      label: "Explore",
      icon: ImageRepository.UserMenuIcons.ExplorePageIcon,
      hrefLink: NavigationProperties.explorePageLink(),
    } as UserMenuRowProps,
    [UserMenuOptions.MainUserGallery]: {
      label: "My map",
      icon: ImageRepository.UserMenuIcons.UserGalleryMapIcon,
      hrefLink: NavigationProperties.userGalleryPageLink(),
    } as UserMenuRowProps,
    [UserMenuOptions.VisitedUserGallery]: (
      username: string,
      imageView: () => any
    ) => {
      return {
        label: username,
        IconImageView: imageView,
        hrefLink: NavigationProperties.visitedGalleryPageLink(),
      } as UserMenuRowProps;
    },
    [UserMenuOptions.UpdateProfilePicture]: {
      ...menuContexts()[MenuContexts.ProfilePictureContext],
    } as UserMenuRowProps,
    [UserMenuOptions.UpdateTasteProfile]: {
      label: UserManager.shared.hasTasteProfile()
        ? "Update taste profile"
        : "Create your taste profile",
      onClickAction: () =>
        router.push(NavigationProperties.tasteProfilePageLink(currentUser?.id)),
      icon: ImageRepository.UserMenuIcons.UpdateTasteProfileIcon,
    } as UserMenuRowProps,
    [UserMenuOptions.ImportPosts]: {
      ...menuContexts()[MenuContexts.ImportIntegrationContext],
    } as UserMenuRowProps,
    [UserMenuOptions.InviteAFriend]: {
      label: "Invite a friend",
      icon: ImageRepository.UtilityIcons.GiftIcon,
      onClickAction: () =>
        routerSearchParams.setParams({
          [SharedURLParameters.displayUserReferralModal]: true,
        }),
    } as UserMenuRowProps,
    [UserMenuOptions.GetHelp]: {
      label: "Get help",
      icon: ImageRepository.UserMenuIcons.GetHelpIcon,
      hrefLink: NavigationProperties.supportLink(),
    } as UserMenuRowProps,
    [UserMenuOptions.ImpersonateUser]: {
      ...menuContexts()[MenuContexts.ImpersonateUserContext],
    } as UserMenuRowProps,
  };

  // Menu Contexts
  const PresentedContext = (): React.ReactNode => {
    let context = undefined;

    switch (currentContext) {
      case MenuContexts.ProfilePictureContext:
        context = <ProfilePictureUpdateContext />;
        break;
      case MenuContexts.ImportIntegrationContext:
        context = <PostImportIntegrationContext />;
        break;
      case MenuContexts.ImpersonateUserContext:
        context = <ImpersonateContext />;
        break;
    }

    return (
      <div
        className={cn(contextBeingPresented() ? "flex" : "hidden",
          'items-center justify-center max-w-[300px] xs:max-w-[350px] max-h-[400px] md:max-h-[500px] w-fit h-fit transition-all ease-in-out duration-500')}
      >
        {context}
      </div>
    );
  };

  // Subcomponents
  const getMenuOptionRowFor = (
    option: UserMenuOptions
  ): React.ReactNode | undefined => {
    switch (option) {
      case UserMenuOptions.UpdateProfilePicture:
        return UserManager.shared.userAuthenticated() ? (
          <UserMenuRow key={option} {...MenuOptionRows.UpdateProfilePicture} />
        ) : undefined;

      case UserMenuOptions.UpdateTasteProfile:
        return UserManager.shared.userAuthenticated() ? (
          <UserMenuRow key={option} {...MenuOptionRows.UpdateTasteProfile} />
        ) : undefined;

      case UserMenuOptions.ImportPosts:
        return UserManager.shared.userAuthenticated() ? (
          <UserMenuRow key={option} {...MenuOptionRows.ImportPosts} />
        ) : undefined;

      case UserMenuOptions.InviteAFriend:
        return UserManager.shared.userAuthenticated() ? (
          <UserMenuRow key={option} {...MenuOptionRows.InviteAFriend} />
        ) : undefined;

      case UserMenuOptions.GetHelp:
        return <UserMenuRow key={option} {...MenuOptionRows.GetHelp} />;
      case UserMenuOptions.ImpersonateUser:
        return UserManager.shared.userAuthenticated() &&
          UserManager.shared.impersonatingUser()?.role === UserRoles.Admin ? (
          <UserMenuRow key={option} {...MenuOptionRows.ImpersonateUser} />
        ) : undefined;
    }
  };

  // Auth button template for login and log out buttons
  const AuthButton = (
    title: string,
    action: () => void,
    icon?: any
  ): React.ReactNode => {
    return (
      <button
        className="flex flex-row gap-x-[24px] hover:opacity-75 transform-gpu active:scale-90 transition-all ease-in-out text-white text-[16px] hover:text-primary font-normal h-fit w-fit pt-[16px]"
        onClick={action}
      >
        {icon ? (
          <Image
            className="h-[22px] w-[22px]"
            src={icon}
            height={22}
            width={22}
            alt={`${title} button icon`}
          />
        ) : undefined}
        <p>{title}</p>
      </button>
    );
  };

  const LogoutButton = (): React.ReactNode => {
    return AuthButton(
      "Log out",
      signOutAction,
      ImageRepository.UserMenuIcons.SignOutIcon
    );
  };

  const LogInButton = (): React.ReactNode => {
    return AuthButton("Log in", loginAction);
  };

  const AuthControlOption = (): React.ReactNode => {
    return UserManager.shared.userAuthenticated()
      ? LogoutButton()
      : LogInButton();
  };

  const MenuOptions = (): React.ReactNode => {
    return (
      <div className="flex flex-col h-fit w-full">
        {Object.values(UserMenuOptions).map((option) =>
          getMenuOptionRowFor(option)
        )}
      </div>
    );
  };

  const HeaderSection = (): React.ReactNode => {
    return (
      <div className="px-[24px] flex flex-row w-full h-fit justify-between items-center leading-relaxed text-[20px] font-normal text-permanent_white">
        {/** Menu Title */}
        <p className="font-semibold">{currentTitle()}</p>
        {/** Menu Title */}

        {/** Close Button */}
        <div className="h-[30px] w-[30px]" />
        {/** Close Button */}
      </div>
    );
  };

  const ContentSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col h-fit w-fit transition-all ease-in-out duration-500 pointer-events-auto">
        <div
          className={cn(
            "flex h-fit w-full items-center justify-end pr-[12px]",
            shouldProfileTasksBeDisplayed() ? "" : "fixed"
          )}
        >
          {withCloseButton ? (
            <CloseUtilityButton
              filled={false}
              onClick={closeMenuAction}
              className="w-[30px] h-[30px]"
            />
          ) : undefined}
        </div>

        {shouldProfileTasksBeDisplayed() ? (
          <ProfileTaskTracker
            profileTasks={UserManager.shared.profileTasks()}
          />
        ) : undefined}

        {HeaderSection()}

        {currentDescription()}

        <div className="w-full h-fit transition-all ease-in-out">
          <div
            className={cn(contextBeingPresented() ? "hidden" : "flex flex-col",
              'w-[260px] md:w-[280px] h-fit transition-all ease-in-out')}
          >
            {MenuOptions()}

            <div className="px-[24px] border-t-[0.3px] border-medium">
              {AuthControlOption()}
            </div>
          </div>
          <div className="px-[24px]">{PresentedContext()}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('border-[1px] bg-medium_dark_grey bg-opacity-90 mt-[40px] transition-all duration-700 ease-in-out overflow-y-auto overflow-x-hidden flex flex-col h-fit w-fit py-[16px] rounded-[10px] border-medium_dark_grey pointer-events-none', className)}>
      <div className="absolute -top-[30px] left-[24px] pointer-events-auto">
        <button
          className={cn(contextBeingPresented() ? "" : "hidden",
            'w-[30px] h-[30px] transition-all ease-in-out hover:opacity-75 transform-gpu active:scale-90')}
          onClick={backButtonAction}
          disabled={!contextBeingPresented}
        >
          <Image
            src={ImageRepository.UtilityIcons.BackButtonIcon}
            alt="Back Button Icon"
          />
        </button>
      </div>
      {ContentSection()}
    </div>
  );
}
