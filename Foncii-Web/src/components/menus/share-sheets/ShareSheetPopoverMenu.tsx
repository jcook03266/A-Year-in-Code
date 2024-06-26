/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Framework
import ReactDOM from "react-dom";

// Types
import {
  ShareEventType,
  ShareSheetDestination,
} from "../../../__generated__/graphql";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Components
// Local
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Share Buttons
import {
  RedditShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from "react-share";

// URL State Persistence
import { SharedURLParameters } from "../../../core-foncii-maps/properties/NavigationProperties";

// Hooks
import React, { useEffect, useRef, useState } from "react";

// Managers
import AnalyticsService from "../../../services/analytics/analyticsService";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

interface ShareSheetPopoverMenuProps {
  url: string;
  subject: string;
  customCopyButtonTitle?: string;
  popoverOrientation?: "left" | "right";
  toggleButtonClassName?: ClassNameValue;
  shareEventType?: ShareEventType;
}

export default function ShareSheetPopoverMenu({
  url,
  subject,
  customCopyButtonTitle,
  popoverOrientation = "left",
  toggleButtonClassName,
  shareEventType,
}: ShareSheetPopoverMenuProps): React.ReactNode | undefined {
  // State Management
  const [menuToggled, setMenuToggled] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [shareEventID, setShareEventID] = useState<string>();
  const [trackedURL, setTrackedURL] = useState<string>(url);

  // Release focus state when user taps outside of this component entirely +
  // Scroll event listener to dismiss this menu when the window scrolls
  useEffect(() => {
    // Event listener for clicks on the document
    document.addEventListener("click", handleClickOutside);

    // Important: Adding true allows this event listener to work properly
    // so that the capture phase occurs even for events that don't bubble.
    window.addEventListener("scroll", handleScroll, true);

    // Cleanup: remove event listener when the component unmounts
    return () => {
      window.addEventListener("scroll", handleScroll, true);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuToggled]);

  // Generate a new trackable URL when this component mounts
  useEffect(() => {
    generateTrackedURL();
  }, []);

  // UI Properties
  // Object reference for the main container
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const popoverContainerRef = useRef<HTMLDivElement>(null);

  // Business Logic
  const generateTrackedURL = () => {
    const shareEventID = AnalyticsService.shared.generateShareEventID(),
      instantiatedURL = new URL(url),
      searchParams = instantiatedURL.searchParams;

    searchParams.append(SharedURLParameters.sharedEventID, shareEventID);
    const trackedURL = instantiatedURL.toString();

    setTrackedURL(trackedURL);
    setShareEventID(shareEventID);
  };

  const shareEventPassthrough = (destination: ShareSheetDestination) => {
    if (!shareEventID || !shareEventType) return;

    AnalyticsService.shared.trackShareEvent({
      shareEventID,
      shareEventType,
      destination,
    });

    // Generate a new trackable URL since this the last one was just used
    generateTrackedURL();
  };

  // Action Handlers
  const handleScroll = () => {
    if (menuToggled) dismissMenu();
  };

  // Function to handle click outside the main container
  const handleClickOutside = (event: any) => {
    if (
      popoverContainerRef.current &&
      !popoverContainerRef.current.contains(event.target)
    ) {
      // Clicked outside the main container, close the pop-over
      dismissMenu();
    }
  };

  // Actions
  const copyToClipboardAction = (): void => {
    shareEventPassthrough(ShareSheetDestination.Clipboard);

    navigator.clipboard.writeText(trackedURL);
    setIsCopied(true);
  };

  // This is used so that copy works correctly on mobile
  const triggerSystemShareSheet = () => {
    try {
      navigator
        .share({
          title: subject,
          url: trackedURL,
        })
        .then(() => {
          shareEventPassthrough(ShareSheetDestination.System);
          dismissMenu();
        });
    } catch (error) {
      // Log and continue
      console.error(error);

      // Share sheet not available, default to copy action instead
      copyToClipboardAction();
    }
  };

  const toggleMenu = () => {
    setIsCopied(false);
    setMenuToggled((state) => !state);
  };

  const dismissMenu = () => {
    setMenuToggled(false);
    setIsCopied(false);
  };

  // Subcomponents
  const ButtonIcon = (source: any, alt: string = ""): JSX.Element => {
    return (
      <Image
        className="cursor-pointer transition-all ease-in-out duration-300 hover:opacity-50 pointer-events-none"
        alt={alt}
        src={source}
        onClick={dismissMenu}
        priority
      />
    );
  };

  const ButtonBox = (): React.ReactNode => {
    return (
      <div className="flex flex-row flex-wrap transition-all ease-in-out gap-x-[12px] sm:gap-x-[16px] gap-y-[10px] justify-center items-center w-full">
        <FonciiToolTip title="Share via Whatsapp">
          <WhatsappShareButton
            url={trackedURL}
            onClick={() =>
              shareEventPassthrough(ShareSheetDestination.Whatsapp)
            }
            title={subject}
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
            title={subject}
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
            title={subject}
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
            title={subject}
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
            title={subject}
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

  // Copy and paste the URL to the user's clipboard
  const CopyButton = (): React.ReactNode => {
    const linkIcon = ImageRepository.UtilityIcons.ChainlinkIcon;
    const checkmark = ImageRepository.UtilityIcons.WhiteCheckMarkIcon;

    return (
      <button
        className={`w-full flex flex-row items-center justify-center gap-x-[5px] px-[20px] py-[8px] bg-transparent border-[1px] border-medium rounded-full hover:opacity-60 transition-all active:scale-90`}
        onClick={triggerSystemShareSheet}
      >
        <FonciiToolTip title={"Click to copy"}>
          <p
            className={`text-[14px] text-permanent_white font-semibold line-clamp-1 text-ellipsis w-full h-fit text-center`}
          >
            {customCopyButtonTitle ?? "Copy"}
          </p>
        </FonciiToolTip>

        <Image
          className="h-[15px] w-[15px]"
          src={isCopied ? checkmark : linkIcon}
          alt="Copy Link Icon"
          priority
        />
      </button>
    );
  };

  const CopyButtonAdvisory = (): React.ReactNode => {
    return (
      <p className="text-neutral font-normal text-[12px] w-full">{`Note: This link copies over any applied filters and selections you've made.`}</p>
    );
  };

  const PopoverMenuContainer = (): React.ReactNode => {
    // Toggle button coordinate space
    const toggleButtonRect = toggleButtonRef.current?.getBoundingClientRect(),
      popoverContainerRect =
        popoverContainerRef.current?.getBoundingClientRect(),
      popOverContainerWidth = popoverContainerRect?.width ?? 0,
      toggleButtonOffsetFromLeft = toggleButtonRect?.left ?? 0,
      top = toggleButtonRect?.bottom ?? 0,
      left =
        popoverOrientation == "left"
          ? toggleButtonOffsetFromLeft - popOverContainerWidth
          : toggleButtonOffsetFromLeft;

    return ReactDOM.createPortal(
      <div
        ref={popoverContainerRef}
        className={cn(
          menuToggled
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
          "z-[1001] absolute border-[1px] backdrop-blur-xl bg-black bg-opacity-95 mt-[20px] transition-all ease-in-out overflow-y-auto overflow-x-hidden items-center justify-center flex flex-col h-fit w-fit max-w-[280px] min-w-[240px] xs:max-w-[320px] xs:min-w-[320px] p-[20px] rounded-lg gap-[20px] border-medium_dark_grey"
        )}
        style={{ top, left }}
      >
        {ButtonBox()}
        <div className="flex flex-col gap-[10px] items-center justify-center w-full">
          {CopyButton()}
          {CopyButtonAdvisory()}
        </div>
      </div>,
      document.body
    );
  };

  const ToggleButton = (): React.ReactNode => {
    const icon = ImageRepository.UtilityIcons.ShareIcon;

    return (
      <FonciiToolTip title="Share this with others">
        <button
          ref={toggleButtonRef}
          className={cn(
            "flex hover:opacity-50 w-[22px] h-[22px] transition-all items-center justify-center pointer-events-auto",
            toggleButtonClassName
          )}
          onClick={() => toggleMenu()}
          aria-label="Popover Menu"
        >
          <Image
            className="h-[22px] w-[22px]"
            height={22}
            width={22}
            alt="Share Sheet Toggle Button Icon"
            src={icon}
            priority
          />
        </button>
      </FonciiToolTip>
    );
  };

  // Note: Relative container + absolutely positioned element gives you a popover that doesn't move when scrolling the containing parent element
  return (
    <div
      ref={mainContainerRef}
      className={cn("relative transition-all ease-in-out flex flex-col")}
    >
      {ToggleButton()}
      {PopoverMenuContainer()}
    </div>
  );
}
