/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { ReservationAvailability } from "../../../../../__generated__/graphql";

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

// Types
interface EarliestTableTimeToggleProps {
  fetchNewAvailabilities: (
    partySize: number
  ) => Promise<ReservationAvailability[]>;
  partySize: number;
  toggleStateDidChange: (newToggleState: boolean) => void;
  isToggled?: boolean;
}

/**
 * A simple toggle button that displays the latest reservation time slot
 * depending on the time slots presently loaded
 *
 * @param availabilities -> A list of reservation availabiltiies, if none of the timeslots are on or after the current date
 * the label defaults to `No Tables Available`
 *
 * @param toggleStateDidChange
 */
export default function EarliestTableTimeToggle({
  fetchNewAvailabilities,
  partySize,
  toggleStateDidChange,
  isToggled,
}: EarliestTableTimeToggleProps) {
  const [earliestTableText, setEarliestTableText] = useState("Searching...");
  useEffect(() => {
    if (!partySize || !fetchNewAvailabilities) return;
    setEarliestTableText("Searching...");

    fetchNewAvailabilities(partySize).then((availabilities) => {
      setEarliestTableText(getEarliestTime(availabilities));
    });
  }, [partySize]);

  // Action Handlers
  const onClickAction = () => {
    const newToggleState = !isToggled;

    toggleStateDidChange(newToggleState); // Notify parent component of the new toggle state
  };

  // Formatting
  const formatTime12Hour = (time24Hour: string) => {
    const timeParts = time24Hour.split(":");
    let hours = parseInt(timeParts[0], 10);

    const minutes = timeParts[1];
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours || 12;

    return `${hours}:${minutes} ${ampm}`;
  };

  // Convenience
  const getEarliestTime = (
    availabilities: ReservationAvailability[]
  ): string => {
    // Edge-case
    if (availabilities?.length == 0) {
      return "None found";
    }

    // Get current local date and tomorrow's date
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const tomorrowDate = new Date(currentDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    // Sort time slots by date and time
    const sortedTimeSlots = availabilities.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return (
        dateA.getTime() - dateB.getTime() ||
        a.timeSlot.localeCompare(b.timeSlot)
      );
    });

    // Find the earliest available slot that is equal to or after the current date
    const earliestAvailableSlot = sortedTimeSlots.find((slot) => {
      const slotDate = new Date(slot.date);

      // Adjust the time to local timezone
      slotDate.setMinutes(slotDate.getMinutes() + slotDate.getTimezoneOffset());
      return slotDate >= currentDate;
    });

    if (earliestAvailableSlot) {
      const slotDate = new Date(earliestAvailableSlot.date);
      // Adjust the time to local timezone
      slotDate.setMinutes(slotDate.getMinutes() + slotDate.getTimezoneOffset());
      const formattedTime = formatTime12Hour(earliestAvailableSlot.timeSlot);

      // Compare with today's and tomorrow's date
      if (slotDate.toDateString() === currentDate.toDateString()) {
        return `${formattedTime}`;
      } else if (slotDate.toDateString() === tomorrowDate.toDateString()) {
        return `Tomorrow at ${formattedTime}`;
      } else {
        return `${slotDate.toLocaleDateString()} at ${formattedTime}`;
      }
    }

    return "None found";
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
    <FonciiToolTip title={`Make a reservation`}>
      <button
        className="shadow-xl flex items-center gap-x-[4px] h-[32px] w-fit py-[4px] px-[16px] rounded-full bg-primary hover:opacity-75 active:scale-90 transition-all ease-in-out shrink-0"
        onClick={onClickAction}
      >
        <p className="text-[14px] text-permanent_white">
          <span className="font-semibold">Earliest Table: </span>
          {`${earliestTableText}`}
        </p>
        {DropDownChevron()}
      </button>
    </FonciiToolTip>
  );
}
