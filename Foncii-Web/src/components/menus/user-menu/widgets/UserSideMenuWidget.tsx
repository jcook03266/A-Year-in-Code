/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Components
// Types
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Local
import UserAvatarImageView from "../../../media-views/user-avatar-image-view/UserAvatarImageView";
import UserMenu, { MenuContexts } from "../container/UserMenu";
import CloseUtilityButton from "../../../../components/buttons/utility-buttons/close-button/CloseUtilityButton";
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";
import { AuthForms } from "../../../../components/modals/auth-modal/AuthModal";

// External
import Image from "next/image";
import Link from "next/link";

// Hooks
import { useEffect, useState } from "react";
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";
import { useSearchParams } from "next/navigation";
import { useListeners } from "../../../../hooks/UseListeners";

// Navigation Properties
import {
  NavigationProperties,
  SharedURLParameters,
} from "../../../../core-foncii-maps/properties/NavigationProperties";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Managers
import UserManager from "../../../../managers/userManager";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";

/**
 * A combination of the usual user avatar view and the user menu drop down
 */
export default function UserSideMenuWidget(): React.ReactNode {
  // State Management
  // UI
  // Binding State
  const [observedUserMenuContext, setObservedUserMenuContext] = useState<
    MenuContexts | undefined
  >(undefined);
  const [fonciiBizDropDownToggled, setFonciiBizDropDownToggled] =
    useState(false);

  // URL-State Persistence
  const searchParams = useSearchParams();
  const routerSearchParams = useRouterSearchParams();

  // User
  const [currentUser, setCurrentUser] = useState(
    UserManager.shared.currentUser()
  );

  // Listeners
  const listeners = useListeners();

  // Update user when user data changes
  useEffect(() => {
    setCurrentUser(UserManager.shared.currentUser());
  }, [UserManager.shared.currentUser()]);

  useEffect(() => {}, [searchParams.get(SharedURLParameters.displaySideMenu)]);

  // Key press events
  useEffect(() => {
    // Event listener for key down events on the document
    document.addEventListener("keydown", listeners.onEscapeKeyPress(dismiss));

    // Cleanup: remove event listener when the component unmounts
    return () => {
      document.removeEventListener(
        "keydown",
        listeners.onEscapeKeyPress(dismiss)
      );
    };
  }, []); // Run this effect only once

  // Actions
  const dismiss = () => {
    setFonciiBizDropDownToggled(false);
    routerSearchParams.removeParam(SharedURLParameters.displaySideMenu);
  };

  const displayAuthModal = (defaultForm: AuthForms = AuthForms.LogIn) => {
    routerSearchParams.setParams({
      [SharedURLParameters.displayAuthModal]: true,
      [SharedURLParameters.currentAuthForm]: defaultForm,
    });
  };

  // Convenience
  const userMenuToggled = (): boolean => {
    return (
      String(
        routerSearchParams.getParamValue(SharedURLParameters.displaySideMenu)
      ) == "true"
    );
  };

  const shouldHideUserSection = () => {
    return observedUserMenuContext == MenuContexts.ProfilePictureContext;
  };

  // Subcomponents
  const CloseButton = (): React.ReactNode => {
    return (
      <div className={cn("fixed top-[24px] left-[24px]")}>
        <CloseUtilityButton
          filled={false}
          onClick={dismiss}
          className={cn(
            "h-[30px] w-[30px] transition-all ease-in-out",
            !shouldHideUserSection()
              ? ""
              : "opacity-0 pointer-events-none scale-0",
            observedUserMenuContext
              ? "opacity-0 scale-0 pointer-events-none"
              : ""
          )}
        />
      </div>
    );
  };

  const AvatarImageView = (): React.ReactNode => {
    return (
      <div>
        <Image
          fetchPriority="high"
          loading="eager"
          alt={`User Avatar Background Hue`}
          src={ImageRepository.Illustrations.UserAvatarBackgroundHue}
          className="h-fit w-full fixed top-0 left-0 pointer-events-none"
          unselectable="on"
        />
        {currentUser ? (
          <UserAvatarImageView
            user={currentUser}
            isCurrentUser
            className="h-[150px] w-[150px]"
            imageResizingProps={{
              height: 400,
              width: 400,
              fit: MediaServerImageFitParams.cover,
              format: MediaServerImageFormatParams.f3,
            }}
          />
        ) : (
          // Placeholder for lazy loading
          <UserAvatarImageView className="h-[150px] w-[150px]" />
        )}
      </div>
    );
  };

  const FonciiLogo = (): React.ReactNode => {
    return (
      <Image
        fetchPriority="high"
        loading="eager"
        alt={`Salmon Red Foncii Logo`}
        src={ImageRepository.CompanyLogos.FonciiLogoRed}
        className="h-[72px] w-fit"
        unselectable="on"
      />
    );
  };

  const Overlay = (): React.ReactNode => {
    return (
      <button
        onClick={dismiss}
        className={cn(
          "fixed cursor-default top-0 left-0 h-full w-full bg-black opacity-80 transition-all duration-500 ease-in-out",
          userMenuToggled() ? "" : "opacity-0 pointer-events-none"
        )}
      />
    );
  };

  const LogInButton = (): React.ReactNode => {
    return (
      <FonciiToolTip title="Log back in and find your next experience">
        <button
          className="flex items-center justify-start text-white px-[8px] text-[16px] font-normal shrink-0 hover:opacity-75 transition-all ease-in-out transform-gpu w-full text-start"
          onClick={() => displayAuthModal(AuthForms.LogIn)}
        >
          <p>Log in</p>
        </button>
      </FonciiToolTip>
    );
  };

  const SignUpButton = (): React.ReactNode => {
    return (
      <FonciiToolTip title="Sign up for Foncii today">
        <button
          className="flex text-white px-[8px] text-[16px] bg-primary text-center justify-center items-center rounded-[16px] h-[44px] w-full font-normal shrink-0 hover:opacity-75 transition-all ease-in-out transform-gpu active:scale-90"
          onClick={() => displayAuthModal(AuthForms.SignUp)}
        >
          <p>Sign up</p>
        </button>
      </FonciiToolTip>
    );
  };

  // Not used for now until Biz site is up and running
  const FonciiBizButton = (): React.ReactNode => {
    return (
      <button
        className="flex flex-col h-fit w-fit items-center justify-center"
        onClick={() => setFonciiBizDropDownToggled((state) => !state)}
      >
        <div className="flex flex-row px-[8px] gap-x-[12px] items-center justify-center text-white text-[16px] font-normal shrink-0 transition-all ease-in-out transform-gpu hover:opacity-75 active:scale-95">
          <p>Foncii for Business</p>
          <Image
            loading="eager"
            fetchPriority="high"
            alt="Chevron Icon"
            src={ImageRepository.UtilityIcons.RightChevronLinkIcon}
            className={cn(
              "h-[16px] w-fit transition-all ease-in-out transform-gpu duration-300",
              fonciiBizDropDownToggled ? "rotate-[-90deg]" : "rotate-90"
            )}
            unselectable="on"
            unoptimized
          />
        </div>

        <div
          className={cn(
            "flex flex-col rounded-[10px] font-medium text-[24px] text-permanent_white w-fit shrink-0 bg-medium_dark_grey bg-opacity-90 transition-all ease-in-out duration-300",
            fonciiBizDropDownToggled
              ? "h-[100px] p-[24px] gap-y-[16px] mt-[8px]"
              : "h-[0px] pointer-events-none opacity-0"
          )}
        >
          <p>🤫</p>
          <p className="text-[20px]">Coming Soon</p>
        </div>
      </button>
    );
  };

  const GetHelpButton = (): React.ReactNode => {
    const { label, icon, hrefLink } = {
      label: "Get help",
      icon: ImageRepository.UserMenuIcons.GetHelpIcon,
      hrefLink: NavigationProperties.supportLink(),
    };

    const IconImage = (): React.ReactNode => {
      return (
        <Image
          className="h-[22px] w-[22px]"
          src={icon}
          width={22}
          height={22}
          alt={`${label} Menu Icon`}
        />
      );
    };

    const TextLabel = (): React.ReactNode => {
      return (
        <div
          className={`flex overflow-hidden text-ellipsis text-[16px] font-normal text-start items-center justify-start text-permanent_white h-full w-full transition-all ease-out`}
        >
          <p>{label}</p>
        </div>
      );
    };

    const RowContent = (): React.ReactNode => {
      return (
        <div className="flex flex-row gap-x-[12px] h-full w-full items-center justify-start">
          {IconImage()}
          {TextLabel()}
        </div>
      );
    };

    return (
      <div className={`w-full transition-all ease-in-out`}>
        <Link
          aria-label={label}
          role="button"
          aria-controls="navigation-bar-row-content"
          className={`flex h-fit w-full items-center justify-start transition-all ease-in-out hover:opacity-75`}
          href={hrefLink}
          onClick={dismiss}
        >
          {RowContent()}
        </Link>
      </div>
    );
  };

  // Sections
  const UserSection = (): React.ReactNode => {
    if (!currentUser) {
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center transition-all ease-out duration-300 h-fit w-full"
          )}
        >
          {FonciiLogo()}
        </div>
      );
    } else {
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center transition-all w-full ease-out duration-300",
            !shouldHideUserSection() ? "h-[260px]" : "h-0 opacity-0"
          )}
        >
          {AvatarImageView()}
        </div>
      );
    }
  };

  const MenuSection = (): React.ReactNode => {
    if (!currentUser) {
      return (
        <div className="w-[260px] md:w-[280px] h-fit flex flex-col transition-all ease-in-out gap-y-[18px] p-[24px]">
          <LogInButton />
          {FonciiBizButton()}
          {GetHelpButton()}

          <div className="border-t-[0.3px] border-medium">
            <div className="pt-[24px]">
              <SignUpButton />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <UserMenu
          withCloseButton={false}
          dismissCurrentContextFlag={userMenuToggled()}
          onCloseActionCallback={dismiss}
          className={
            "bg-transparent mt-0 py-[0px] pb-[16px] shadow-none border-[0px]"
          }
          onMenuContextChange={setObservedUserMenuContext}
        />
      );
    }
  };

  const ContentSection = (): React.ReactNode => {
    return (
      <div
        className={cn(
          `flex items-start shadow-xl justify-center pt-[56px] fixed duration-300 transition-all ease-in-out transform-gpu right-0 top-0 rounded-tl-[5px] bg-medium_dark_grey bg-opacity-90 h-full overflow-y-auto overflow-x-hidden`,
          userMenuToggled()
            ? "pointer-events-auto"
            : "pointer-events-none translate-x-[500px]"
        )}
      >
        <div className="flex relative flex-col h-fit w-fit transition-all ease-in-out duration-500 pointer-events-auto">
          {CloseButton()}
          {UserSection()}
          {MenuSection()}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed z-[100001] pointer-events-auto transition-all ease-in-out">
      <Overlay />
      {ContentSection()}
    </div>
  );
}
