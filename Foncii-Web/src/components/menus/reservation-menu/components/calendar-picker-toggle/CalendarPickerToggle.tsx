/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Assets
import { ImageRepository } from "../../../../../../public/assets/images/ImageRepository";

// Hooks
import { useEffect, useState } from "react";

// Components
// Local
import FonciiToolTip from "../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Utilities
import { cn } from "../../../../../utilities/development/DevUtils";
import { UnitsOfTimeInMS } from "../../../../../utilities/common/time";

export default function CalendarPickerToggle({
  targetReservationDate,
  initialToggleState = false,
  toggleStateDidChange,
}: {
  targetReservationDate: Date;
  initialToggleState?: boolean;
  toggleStateDidChange: (newToggleState: boolean) => void;
}) {
  // State Management
  const [isToggled, setIsToggled] = useState(initialToggleState);

  // Refresh when the target reservation date is updated externally
  useEffect(() => {}, [targetReservationDate]);

  // Action Handlers
  const onClickAction = () => {
    const newToggleState = !isToggled;

    setIsToggled(newToggleState);
    toggleStateDidChange(newToggleState); // Notify parent component of the new toggle state
  };

  // Properties
  const targetReservationDateString = (): string => {
    // Possible Dates
    const normalizedTargetReservationDate = new Date(targetReservationDate);
    normalizedTargetReservationDate.setHours(0, 0, 0, 0); // Set to midnight since the full 24 hours are used for reservation selection

    // Get current local date and tomorrow's date
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Tomorrow is just the current day + another day (24 hours in MS)
    const tomorrowDate = new Date(currentDate.getTime() + UnitsOfTimeInMS.day);

    // Compare with today's and tomorrow's date
    if (normalizedTargetReservationDate.getTime() == currentDate.getTime()) {
      return `Today`;
    } else if (
      normalizedTargetReservationDate.getTime() == tomorrowDate.getTime()
    ) {
      return `Tomorrow`;
    } else {
      return normalizedTargetReservationDate.toLocaleDateString(); // Simply describe the date as 'today' and 'tomorrow' are no longer applicable
    }
  };

  // Subcomponents
  const DropDownChevron = (): React.ReactNode => {
    const upwardChevron = ImageRepository.FilterIcons.UpwardChevronIcon;

    // Note: Upward chevron means menu open, downward is closed
    return (
      <Image
        className={cn(
          "h-[10px] w-[10px] transition-all ease-in-out duration-200",
          isToggled ? "" : "rotate-180"
        )}
        src={upwardChevron}
        alt="Drop Down Icon"
        priority
      />
    );
  };

  return (
    <FonciiToolTip title="Reservation date">
      <button
        className="shadow-xl flex items-center gap-x-[4px] h-fit w-fit py-[4px] px-[16px] rounded-full bg-primary hover:opacity-75 active:scale-90 transition-all ease-in-out"
        onClick={onClickAction}
      >
        <p className="text-[14px] text-permanent_white line-clamp-1">
          {targetReservationDateString()}
        </p>
        {DropDownChevron()}
      </button>
    </FonciiToolTip>
  );
}
