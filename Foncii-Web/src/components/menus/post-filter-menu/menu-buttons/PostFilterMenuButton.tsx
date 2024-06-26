/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Components
// Local
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Hooks
import { useEffect, useRef, useState } from "react";
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";
import { useListeners } from "../../../../hooks/UseListeners";

// URL State Persistence
import {
  PostFilterURLParameters
} from "../../../../core-foncii-maps/properties/NavigationProperties";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Utilities
import { delay } from "../../../../utilities/common/scheduling";
import { cn } from "../../../../utilities/development/DevUtils";
import { UnitsOfTimeInMS } from "../../../../utilities/common/time";

interface PostFilterMenuButtonProps {
  id: string;
  title?: string; // Optional, when no provided the component minimizes around the icon
  icon: any;
  dropDownMenu?: (onCloseAction: () => void) => React.ReactNode;
  onClickAction?: () => void; // For toggle menu buttons, i.e 'open now'
  selectAllOption?: {
    // Will split a drop down button into two buttons, the first of which will trigger this callback. Chevron automatically used
    toggleAllSelected: (isAllSelected: boolean) => void;
    isAllSelected: boolean;
  };
  withChevron?: boolean; // True if the chevron should be displayed, false otherwise
  forceFocus?: boolean; // True if the button toggles some menu but the associated drop down isn't a child of this component
  menuButtonClassName?: string; // Custom class names to apply to the menu button (only), doesn't apply to the drop down or the parent container
  filterIsApplied: boolean; // True if any of the filters supported by the menu associated with the button are applied
  iconImageClassName?: string; // Custom class name to apply to the icon image (in case you need to change its dimensions dynamically etc)
  dismissOnClickOutside?: boolean;
  isMobile?: boolean;
  disabled?: boolean;
}

export const PostFilterMenuButton = ({
  id,
  title,
  icon,
  dropDownMenu,
  onClickAction,
  selectAllOption,
  withChevron = false,
  forceFocus = false,
  menuButtonClassName,
  filterIsApplied,
  iconImageClassName,
  dismissOnClickOutside = false,
  isMobile = false,
  disabled = false
}: PostFilterMenuButtonProps): React.ReactNode => {
  // URL State Persistence
  const routerSearchParams = useRouterSearchParams();

  // State Management
  const isFocused = (): boolean => {
    const focusedSubmenu = routerSearchParams.getParamValue(
      PostFilterURLParameters.focusedSubmenu
    ) as string,
      focused = focusedSubmenu === id.toString();

    return focused;
  };

  // Delayed drop down menu presentation transition
  const DROP_DOWN_MENU_CLOSE_TRANSITION_DELAY = UnitsOfTimeInMS.second;
  const dropDownMenuCloseTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const [dropDownMenuPresented, setDropDownMenuPresented] = useState(isFocused());

  // Listeners
  const listeners = useListeners();

  // Refs
  const dropDownContainerRef = useRef<HTMLDivElement>(null);

  // Key listeners
  useEffect(() => {
    // Dismiss menu hotkey listener
    document.addEventListener(
      "keydown",
      listeners.onEscapeKeyPress(dismissMenu)
    );

    // Cleanup: remove event listener when the component unmounts
    return () => {
      document.removeEventListener(
        "keydown",
        listeners.onEscapeKeyPress(dismissMenu)
      );
    };
  }, []); // Run this effect only once

  // Release focus state when user taps outside of this component entirely
  useEffect(() => {
    // Only add this listener when the menu is currently focused,
    // Menus shouldn't be listening when they're in their closed state
    if (!isFocused() || !dismissOnClickOutside) return;

    // Event listener for clicks on the document
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isFocused]);

  useEffect(() => {
    clearTimeout(dropDownMenuCloseTimeout.current);

    if (!isFocused()) {
      // Only trigger for the close / dismiss transition
      dropDownMenuCloseTimeout.current = setTimeout(() => {
        setDropDownMenuPresented(false);
      }, DROP_DOWN_MENU_CLOSE_TRANSITION_DELAY);
    }
    else {
      setDropDownMenuPresented(true);
    }
  }, [isFocused])

  // Reset timeout and menu presentation state when entire component dismounts
  useEffect(() => {
    return () => {
      clearTimeout(dropDownMenuCloseTimeout.current);
      dropDownMenuCloseTimeout.current = undefined;
      setDropDownMenuPresented(false);
    }
  }, [])

  // Action Handlers
  const handleClickOutside = (event: any) => {
    if (
      dropDownContainerRef.current &&
      !dropDownContainerRef.current.contains(event.target)
    ) {
      // TODO(FM-276): Change or fix calendar - This is a hack to get around the date picker elements not resolving to children of menu
      const classListValue = event.target.classList.value;
      if (
        !(
          classListValue.includes("p-datepicker") ||
          classListValue.includes("p-monthpicker") ||
          classListValue.includes("p-yearpicker")
        )
      ) {
        // Clicked outside the drop down container, dismiss the dropdown
        dismissMenu();
      }
    }
  };

  // Actions
  const dismissMenu = (): void => {
    // Update URL State
    routerSearchParams.removeParams([PostFilterURLParameters.focusedSubmenu]);
  };

  const focusMenu = (): void => {
    // You can't focus a submenu without a drop down, this is just a toggle button, relinquish control and return
    if (dropDownMenu == undefined && !forceFocus) return;

    // Update URL State
    // Creates a promise that resolves after some arbitrary duration to set the parameter so that a race condition doesn't occur when
    // dismissing the menu with a click outside and tapping a new button to toggle it. Note: The promise itself is sufficient, the duration can be 0 if anything, but
    // using this delay method because it's reusable and understandable in most contexts
    delay(() => {
      routerSearchParams.setParams({
        [PostFilterURLParameters.focusedSubmenu]: id.toString(),
      });
    }, 10);
  };

  const toggleMenuAction = (): void => {
    isFocused() ? dismissMenu() : focusMenu();

    // Execute any custom extraneous logic (if defined)
    onClickAction?.();
  };

  // Properties
  const hasTitle = title !== undefined,
    minimize = !hasTitle,
    iconAlt = `${title} filter icon`;

  // Subcomponent
  const IconImage = (): React.ReactNode => {
    return (
      <Image
        className={cn(
          "h-[16px] w-[16px]",
          iconImageClassName,
          isFocused() ? "opacity-100" : "opacity-70"
        )}
        src={icon}
        alt={iconAlt}
        priority
      />
    );
  };

  const DropDownChevron = (): React.ReactNode => {
    const upwardChevron = ImageRepository.FilterIcons.UpwardChevronIcon;

    // Don't render the chevron if not specified
    if (!withChevron) return;

    // Note: Upward chevron means menu open, downward is closed
    return (
      <Image
        className={cn(
          "h-[10px] w-[10px] transition-all ease-in-out duration-200 transform-gpu",
          isFocused() ? "" : "rotate-180"
        )}
        src={upwardChevron}
        alt="Drop Down Icon"
        priority
      />
    );
  };

  const TitleLabel = (): React.ReactNode => {
    return title ? (
      <p
        className={cn(
          "text-[14px] font-normal shrink-0 text-center line-clamp-1",
          isFocused() || filterIsApplied
            ? `text-permanent_white`
            : `text-neutral`
        )}
      >
        {title}
      </p>
    ) : undefined;
  };

  return (
    <div
      id={id}
      className="transition-all ease-in-out shrink-0 flex flex-col items-end pointer-events-auto"
    >
      <FonciiToolTip title={title ? `Filter by ${title}` : "More Filters"}>
        {selectAllOption ? (
          <div className="flex flex-row">
            <button
              aria-label={`${title} filter menu button`}
              disabled={disabled}
              className={cn(
                menuButtonClassName,
                "shrink-0 rounded-tl-full rounded-bl-full backdrop-blur-lg gap-x-[7px] flex flex-row justify-center items-center hover:opacity-70 ease-in-out transition-all transform-gpu active:scale-90 w-fit h-fit",
                minimize
                  ? "min-h-[30px] min-w-[30px] max-h-[30px] max-w-[30px]"
                  : "pr-[6px] pl-[14px] py-[4px]",
                selectAllOption.isAllSelected
                  ? `bg-primary`
                  : `bg-transparent border-medium border-[1px]`,
                disabled ? "opacity-50 select-none cursor-not-allowed" : ""
              )}
              onClick={() => selectAllOption.toggleAllSelected(selectAllOption.isAllSelected)}
            >
              {IconImage()}
              {TitleLabel()}
            </button>
            <button
              aria-label={`${title} filter menu button`}
              disabled={disabled}
              className={cn(
                menuButtonClassName,
                "shrink-0 rounded-tr-full rounded-br-full backdrop-blur-lg gap-x-[7px] flex flex-row justify-center items-center hover:opacity-70 ease-in-out transition-all transform-gpu active:scale-90 w-fit h-full",
                minimize
                  ? "min-h-[30px] min-w-[30px] max-h-[30px] max-w-[30px]"
                  : "pr-[14px] pl-[6px] py-[4px]",
                isFocused() || filterIsApplied
                  ? `bg-primary`
                  : `bg-transparent border-medium border-[1px]`,
                disabled ? "opacity-50 select-none cursor-not-allowed" : ""
              )}
              onClick={toggleMenuAction}
            >
              {DropDownChevron()}
            </button>
          </div>
        ) : (
          <button
            aria-label={`${title} filter menu button`}
            disabled={disabled}
            className={cn(
              menuButtonClassName,
              "shrink-0 rounded-full backdrop-blur-lg gap-x-[7px] flex flex-row justify-center items-center hover:opacity-70 ease-in-out transition-all transform-gpu active:scale-90 w-fit h-fit",
              minimize
                ? "min-h-[30px] min-w-[30px] max-h-[30px] max-w-[30px]"
                : "px-[14px] py-[4px]",
              isFocused() || filterIsApplied
                ? `bg-primary`
                : `bg-transparent border-medium border-[1px]`,
              disabled ? "opacity-50 select-none cursor-not-allowed" : ""
            )}
            onClick={toggleMenuAction}
          >
            {IconImage()}
            {TitleLabel()}
            {withChevron ? DropDownChevron() : undefined}
          </button>
        )}
      </FonciiToolTip>

      {/* Drop Down Menu Container (if drop down is used) */}
      {dropDownMenu ? (
        <div
          ref={dropDownContainerRef}
          className={cn(
            "pointer-events-none z-[1000] duration-300 transition-all ease-in-out transform-gpu",
            isFocused()
              ? "opacity-100"
              : cn(
                isMobile
                  ? "opacity-0 origin-bottom translate-y-[1000px]"
                  : "opacity-0 origin-top-right scale-0"
              ),
            isMobile
              ? "fixed w-fit bottom-0 left-0"
              : "mt-[40px] fixed xs:w-fit sm:right-[initial] xs:pr-[0px] right-0 w-full justify-end flex pr-[10px]"
          )}
        >
          {dropDownMenuPresented ? dropDownMenu(() => dismissMenu()) : undefined}
        </div>
      ) : undefined}
      {/* Drop Down Menu Container (if drop down is used) */}
    </div>
  );
};
