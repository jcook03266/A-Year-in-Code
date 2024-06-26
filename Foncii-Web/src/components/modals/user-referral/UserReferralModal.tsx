/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import {
  ShareEventType,
  ShareSheetDestination,
} from "../../../__generated__/graphql";

// Hooks
import { useEffect, useState } from "react";
import { useRouterSearchParams } from "../../../hooks/UseRouterSearchParamsHook";

// Components
// Local
import CloseUtilityButton from "../../../components/buttons/utility-buttons/close-button/CloseUtilityButton";
import FonciiModal from "../../../components/modals/foncii-base-modal/FonciiModal";
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";

// Share Buttons
import {
  RedditShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from "react-share";

// External
import Image from "next/image";

// Navigation
import {
  SharedURLParameters,
  SignUpURLParameters,
  buildDynamicLink,
} from "../../../core-foncii-maps/properties/NavigationProperties";

// Managers
import UserManager from "../../../managers/userManager";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Notifications
import { NotificationCenterActions } from "../../../redux/operations/dispatchers";
import { NotificationTemplates } from "../../../core-foncii-maps/repositories/NotificationTemplates";

// Services
import AnalyticsService, {
  AnalyticsEvents,
} from "../../../services/analytics/analyticsService";

// URL-State Persistence
import { AuthForms } from "../auth-modal/AuthModal";

// Formatting
import { uppercaseFirstLetter } from "../../../utilities/formatting/textContentFormatting";

export default function UserReferralModal() {
  // Properties
  const currentUser = UserManager.shared.currentUser(),
    username = currentUser?.username ?? "",
    userReferralCode = currentUser?.referralCode ?? "";

  // Share Sheet
  const subject = () =>
    `@${uppercaseFirstLetter(username)} Has Invited You To Join Foncii 🍜`;

  // Dynamic Text
  const userReferralLink = (): string =>
    buildDynamicLink("https://www.foncii.com/", {
      [SignUpURLParameters.referralCode]: userReferralCode,
      [SharedURLParameters.displayAuthModal]: true,
      [SharedURLParameters.currentAuthForm]: AuthForms.SignUp,
    });

  // State Management
  const [shareEventID, setShareEventID] = useState<string>();
  const [trackedURL, setTrackedURL] = useState<string>(userReferralLink());

  // URL-State Persistence
  const routerSearchParams = useRouterSearchParams();

  // Generate a new trackable URL when this component mounts
  useEffect(() => {
    generateTrackedURL();
  }, []);

  // Convenience
  const isPresented = () => {
    return (
      routerSearchParams.getParamValue(
        SharedURLParameters.displayUserReferralModal
      ) != undefined
    );
  };

  // Business Logic
  const generateTrackedURL = () => {
    const shareEventID = AnalyticsService.shared.generateShareEventID(),
      instantiatedURL = new URL(userReferralLink()),
      searchParams = instantiatedURL.searchParams;

    searchParams.append(SharedURLParameters.sharedEventID, shareEventID);
    const trackedURL = instantiatedURL.toString();

    setTrackedURL(trackedURL);
    setShareEventID(shareEventID);
  };

  const shareEventPassthrough = (destination: ShareSheetDestination) => {
    if (!shareEventID) return;

    AnalyticsService.shared.trackShareEvent({
      shareEventID,
      shareEventType: ShareEventType.Referral,
      destination,
    });

    // Generate a new trackable URL since this the last one was just used
    generateTrackedURL();
  };

  // Text Descriptions
  const title = "Invite a friend to try Foncii",
    subtitle =
      "Know a fellow foodie? Invite them to join in on the experience.";

  // Navigation Actions
  const dismissModalAction = () => {
    routerSearchParams.removeParam(
      SharedURLParameters.displayUserReferralModal
    );
  };

  // Actions
  const triggerSystemShareSheet = () => {
    if (!trackedURL) return;

    shareEventPassthrough(ShareSheetDestination.System);

    try {
      navigator
        .share({
          title: subject(),
          url: trackedURL,
        })
        .then(() => {
          closeButtonActionHandler();
          AnalyticsService.shared.trackGenericEvent(
            AnalyticsEvents.USER_REFERRAL_CODE_COPIED,
            { userReferralCode }
          );
        });
    } catch (error) {
      // Log and continue
      console.error(error);

      // Share sheet not available, default to copy action instead
      copyToClipboardAction();
    }
  };

  const copyToClipboardAction = (): void => {
    if (!trackedURL) return;

    shareEventPassthrough(ShareSheetDestination.Clipboard);

    navigator.clipboard.writeText(trackedURL);
    closeButtonActionHandler();

    // Custom copy button title is displayed in the notification just in case it's truncated
    NotificationCenterActions.triggerSystemNotification(
      NotificationTemplates.LinkCopied("Foncii Referral Link")
    );

    AnalyticsService.shared.trackGenericEvent(
      AnalyticsEvents.USER_REFERRAL_CODE_COPIED,
      { userReferralCode }
    );
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

  const GiftIcon = (): React.ReactNode => {
    return (
      <FonciiToolTip title="Share the gift of Foncii with the world">
        <Image
          className="h-[32px] w-[32px] hover:opacity-75 transition-all ease-in-out"
          alt="Gift Icon"
          src={ImageRepository.UtilityIcons.GiftIcon}
        />
      </FonciiToolTip>
    );
  };

  const CallToAction = (): React.ReactNode => {
    return (
      <div className="flex flex-col font-normal gap-y-[12px] h-fit w-full items-center justify-center text-permanent_white text-center shrink-0">
        <p className="text-[20px]">{title}</p>
        <p className="text-center text-neutral text-[14px]">{subtitle}</p>
      </div>
    );
  };

  const ORDivider = (): React.ReactNode => {
    const Divider = () => {
      return <div className="w-full h-[1px] bg-neutral rounded-full" />;
    };

    return (
      <div className="flex flex-row gap-x-[20px] items-center justify-between w-full h-fit">
        <Divider />
        <p className="shrink-0 text-neutral font-semibold text-[16px] text-center w-fit">
          or
        </p>
        <Divider />
      </div>
    );
  };

  const ButtonIcon = (source: any, alt: string = ""): React.ReactNode => {
    return (
      <Image
        className="cursor-pointer transition-all ease-in-out duration-300 hover:opacity-50 pointer-events-none"
        alt={alt}
        src={source}
        onClick={closeButtonActionHandler}
      />
    );
  };

  const ShareButton = (): React.ReactNode => {
    return (
      <button
        className="flex flex-row gap-x-[8px] items-center justify-center w-full h-fit py-[8px] hover:opacity-75 active:scale-90 transition-all ease-in-out bg-primary rounded-full"
        onClick={triggerSystemShareSheet}
      >
        <Image
          className="h-[21px] w-[21px] shrink-0"
          alt={"Share icon"}
          src={ImageRepository.UtilityIcons.PaperPlaneShareIcon}
          onClick={closeButtonActionHandler}
        />

        <FonciiToolTip title="Share via your device's share sheet">
          <p className="font-medium text-[16px] text-permanent_white shrink-0">
            Share
          </p>
        </FonciiToolTip>
      </button>
    );
  };

  // Copy and paste the URL to the user's clipboard
  const CopyButton = (): React.ReactNode => {
    const icon = ImageRepository.UtilityIcons.ChainlinkIcon;

    return (
      <button
        className={`w-full flex flex-row items-center justify-center gap-x-[5px] px-[20px] py-[8px] bg-transparent border-[1px] border-medium rounded-full hover:opacity-60 transition-all active:scale-90`}
        onClick={copyToClipboardAction}
      >
        <FonciiToolTip title="Copy the referral link to your clipboard">
          <p
            className={`text-[14px] text-permanent_white font-semibold line-clamp-1 w-full h-fit text-center`}
          >
            {userReferralCode}
          </p>
        </FonciiToolTip>

        <Image className="h-[15px] w-[15px]" src={icon} alt="Copy Link Icon" />
      </button>
    );
  };

  // Sections
  const TopSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col items-center justify-center h-fit w-full gap-y-[8px]">
        {GiftIcon()}
        {CallToAction()}
      </div>
    );
  };

  const MiddleSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col items-center justify-center h-fit w-full gap-y-[16px]">
        {ShareButton()}
        <ORDivider />
      </div>
    );
  };

  const BottomSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col items-center justify-center h-fit w-full gap-y-[16px]">
        {ReferralLinkBox()}
        {ButtonBox()}
      </div>
    );
  };

  const ReferralLinkBox = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[8px] items-center justify-center w-full h-fit">
        <p className="font-normal text-[14px] text-neutral w-full text-left">
          Referral link
        </p>
        {CopyButton()}
      </div>
    );
  };

  const ButtonBox = (): React.ReactNode => {
    return (
      <div className="flex flex-row flex-wrap gap-x-[24px] gap-y-[10px] justify-center items-center w-full">
        <FonciiToolTip title="Share via Whatsapp">
          <WhatsappShareButton
            url={trackedURL}
            onClick={() =>
              shareEventPassthrough(ShareSheetDestination.Facebook)
            }
            title={subject()}
            className="hover:opacity-75 transition-all ease-in-out"
          >
            {ButtonIcon(
              ImageRepository.SocialShareSheetIcons.Whatsapp,
              "Whatsapp Share Sheet Icon"
            )}
          </WhatsappShareButton>
        </FonciiToolTip>

        <FonciiToolTip title="Share via Facebook">
          <FacebookShareButton
            url={trackedURL}
            onClick={() =>
              shareEventPassthrough(ShareSheetDestination.Facebook)
            }
            title={subject()}
            className="hover:opacity-75 transition-all ease-in-out"
          >
            {ButtonIcon(
              ImageRepository.SocialShareSheetIcons.Facebook,
              "Facebook Share Sheet Icon"
            )}
          </FacebookShareButton>
        </FonciiToolTip>

        <FonciiToolTip title="Share via Linkedin">
          <LinkedinShareButton
            url={trackedURL}
            onClick={() =>
              shareEventPassthrough(ShareSheetDestination.Linkedin)
            }
            title={subject()}
            className="hover:opacity-75 transition-all ease-in-out"
          >
            {ButtonIcon(
              ImageRepository.SocialShareSheetIcons.Linkedin,
              "Linkedin Share Sheet Icon"
            )}
          </LinkedinShareButton>
        </FonciiToolTip>

        <FonciiToolTip title="Share via Twitter (X)">
          <TwitterShareButton
            url={trackedURL}
            onClick={() => shareEventPassthrough(ShareSheetDestination.Twitter)}
            title={subject()}
            className="hover:opacity-75 transition-all ease-in-out"
          >
            {ButtonIcon(
              ImageRepository.SocialShareSheetIcons.Twitter,
              "Twitter Share Sheet Icon"
            )}
          </TwitterShareButton>
        </FonciiToolTip>

        <FonciiToolTip title="Share via Reddit">
          <RedditShareButton
            url={trackedURL}
            onClick={() => shareEventPassthrough(ShareSheetDestination.Reddit)}
            title={subject()}
            className="hover:opacity-75 transition-all ease-in-out"
          >
            {ButtonIcon(
              ImageRepository.SocialShareSheetIcons.Reddit,
              "Reddit Share Sheet Icon"
            )}
          </RedditShareButton>
        </FonciiToolTip>
      </div>
    );
  };

  const MainContent = (): React.ReactNode => {
    return (
      <div className="relative flex flex-col overflow-hidden items-center justify-start border-[1px] border-medium_dark_grey bg-black bg-opacity-80 shadow-lg h-fit w-full max-w-[85%] xs:max-w-[350px] rounded-[8px] transition-all ease-in-out">
        <div className="relative flex flex-col overflow-y-auto overflow-x-hidden gap-y-[16px] py-[24px] px-[24px] items-center justify-start h-fit w-full rounded-[8px] transition-all ease-in-out">
          <div className="w-fit h-fit absolute top-0 left-0 p-[16px] z-[100000]">
            {CloseButton()}
          </div>
          <TopSection />
          <MiddleSection />
          <BottomSection />
        </div>
      </div>
    );
  };

  return (
    <FonciiModal
      isPresented={isPresented()}
      onDismiss={closeButtonActionHandler}
      dismissableOverlay
    >
      {MainContent()}
    </FonciiModal>
  );
}
