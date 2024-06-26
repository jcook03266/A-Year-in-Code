"use client";
// Dependencies
// Hooks
import { useEffect, useRef, useState } from "react";

// Animation
import { Transition, TransitionStatus } from "react-transition-group";

// Components
import { Snackbar } from "@mui/base/Snackbar";
import Image from "next/image";
import Link from "next/link";

// Assets
import { ImageRepository } from "../../../public/assets/images/ImageRepository";

// Redux
import { getNotificationCenterSlice } from "../../redux/operations/selectors";
import { NotificationCenterActions } from "../../redux/operations/dispatchers";

// Utils
import { cn } from "../../utilities/development/DevUtils";

// Centralized Source of notifications for the application to use at the top-level
export default function NotificationCenter(): React.ReactNode {
  // Global App State
  const notificationCenter = getNotificationCenterSlice()(),
    systemNotification = notificationCenter.systemNotification,
    systemNotificationTriggered =
      notificationCenter.systemNotificationTriggered;

  // State Management
  const [exited, setExited] = useState(true);
  const nodeRef = useRef(null);

  // Side Effects
  // Respond to changes made to the notification store
  useEffect(() => { }, [notificationCenter]);

  // Limits
  const timeoutHalfLife = 1500, // 1.5 Seconds in, 1.5 Seconds out
    autohideTimeout = 4000; // Hide automatically after 4 seconds

  // Convenience
  const hasLink = (): boolean => systemNotification?.link != undefined;

  // Action Handlers
  const handleClose = () => {
    NotificationCenterActions.dismissSystemNotification();
  };

  const handleOnEnter = () => {
    setExited(false);
  };

  const handleOnExited = () => {
    setExited(true);
    NotificationCenterActions.dismissSystemNotification();
  };

  // Subcomponents
  const CloseButton = (): React.ReactNode => {
    let icon = ImageRepository.UtilityIcons.CloseXmarkDarkUtilityIcon;

    return (
      <div className="items-center justify-center right-0 p-[8px] transition-all">
        <button
          className="h-[20px] w-[20px] bg-opacity-50 rounded-full"
          aria-label="Close Button"
          onClick={handleClose}
        >
          <Image
            className={`h-[30px] w-[30px]`}
            src={icon}
            alt="Close Button Icon"
          />
        </button>
      </div>
    );
  };

  // Factory Methods
  // Note: Notifications have the highest Z-index, keep it this way for simplicity
  const SystemNotificationFactory = (): React.ReactNode => {
    if (!systemNotification) return undefined;

    let notification = systemNotification,
      triggered = systemNotificationTriggered,
      title = notification.title,
      message = notification.message,
      link = notification.link,
      isError = notification.isError;

    return (
      <Snackbar
        autoHideDuration={autohideTimeout}
        open={triggered}
        onClose={handleClose}
        exited={exited}
        className="fixed z-[9999999999] w-screen max-w-[90%] sm:max-w-[500px] left-1/2 -translate-x-1/2 bottom-4"
      >
        <Transition
          timeout={{ enter: timeoutHalfLife, exit: timeoutHalfLife }}
          in={triggered}
          appear
          unmountOnExit
          onEnter={handleOnEnter}
          onExited={handleOnExited}
          nodeRef={nodeRef}
        >
          {(status: TransitionStatus) => (
            <Link href={link ?? "#"}>
              <div
                className={cn('flex w-full items-center opacity-90',
                  hasLink()
                    ? "cursor-pointer hover:opacity-75"
                    : "cursor-default",
                  'transition-all ease-out flex overflow-hidden bg-permanent_white rounded-lg',
                  isError
                    ? "border border-solid border-primary"
                    : "",
                  'shadow-md text-permanent_black px-[8px] text-start')}
                style={{
                  transform: positioningStyles[status],
                  transition: "transform 600ms ease",
                }}
                ref={nodeRef}
              >
                <div className="flex flex-row w-full py-[16px] px-[8px]">
                  <div className="flex flex-col">
                    <p className={cn('m-0 leading-normal mr-2 font-medium text-[16px]', isError ? "text-primary" : "")}>{title}</p>
                    <p className={`m-0 leading-normal font-normal text-medium text-[14px]`}>{message}</p>
                  </div>
                </div>
                {CloseButton()}
              </div>
            </Link>
          )}
        </Transition>
      </Snackbar >
    );
  };

  return SystemNotificationFactory();
}

// Types
// Mapped to `TransitionStatus` ("entering" | "entered" | "exiting" | "exited" | "unmounted")
enum PositioningStyleKeys {
  entering = "entering",
  entered = "entered",
  exiting = "exiting",
  exited = "exited",
  unmounted = "unmounted",
}

const positioningStyles = {
  [PositioningStyleKeys.entering]: "translateY(0)",
  [PositioningStyleKeys.entered]: "translateY(0)",
  [PositioningStyleKeys.exiting]: "translateY(120px)",
  [PositioningStyleKeys.exited]: "translateY(120px)",
  [PositioningStyleKeys.unmounted]: "translateY(120px)",
};
