/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Hooks
import React, { useEffect, useState } from "react";

// Components
import { Calendar } from "primereact/calendar";

// Styling
import { classNames } from "primereact/utils";

// Types
interface CalendarPickerProps {
  targetReservationDate?: Date;
  dateSelectionDidChange?: (date: Date) => void;
}

export default function CalendarPicker({
  targetReservationDate,
  dateSelectionDidChange,
}: CalendarPickerProps) {
  // Properties
  // State Management
  // Refresh when the target reservation date is updated externally
  useEffect(() => {
    setSelectedDate(targetReservationDate ?? selectedDate);
  }, [targetReservationDate]);

  const [selectedDate, setSelectedDate] = useState<Date>(
    targetReservationDate ?? new Date()
  );

  // Action handlers
  const handleDateChange = (event: any) => {
    const newDate = event.value as Date;
    newDate.setHours(0, 0, 0, 0); // Set to midnight since the full 24 hours are used for reservation selection

    if (newDate) {
      setSelectedDate(newDate);
      dateSelectionDidChange?.(newDate); // Notify parent component of the new date selection
    }
  };

  return (
    <div className="bg-medium_dark_grey px-[8px] rounded-[16px] w-fit h-fit shadow-lg">
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        inline
        minDate={new Date()}
        pt={{
          header: {
            className: classNames(
              "flex items-center justify-between",
              "p-2 text-permanent_white font-semibold m-0 border-b border-medium rounded-t-lg"
            ),
          },
          previousButton: {
            root: {
              className: classNames(
                "flex items-center justify-center cursor-pointer overflow-hidden relative",
                "w-8 h-8 text-permanent_white border-0 bg-transparent rounded-full transition-colors duration-200 ease-in-out",
                "hover:text-gray-700 hover:border-transparent hover:bg-gray-200"
              ),
            },
          },
          title: { className: "leading-8 mx-auto" },
          monthTitle: {
            className: classNames(
              "text-permanent_white text-[16px] transition duration-200 font-semibold",
              "mr-2",
              "hover:text-primary"
            ),
          },
          yearTitle: {
            className: classNames(
              "text-permanent_white text-[16px] transition duration-200 font-semibold",
              "hover:text-primary"
            ),
          },
          nextButton: {
            root: {
              className: classNames(
                "flex items-center justify-center cursor-pointer overflow-hidden relative",
                "w-8 h-8 text-permanent_white border-0 bg-transparent rounded-full transition-colors duration-200 ease-in-out",
                "hover:text-gray-700 hover:border-transparent hover:bg-gray-200"
              ),
            },
          },
          table: {
            className: classNames("border-collapse w-full", "my-2"),
          },
          incrementButton: {
            className: classNames(
              "flex items-center justify-center cursor-pointer overflow-hidden relative",
              "w-8 h-8 text-permanent_white border-0 bg-transparent rounded-full transition-colors duration-200 ease-in-out",
              "hover:text-gray-700 hover:border-transparent hover:bg-gray-200"
            ),
          },
          decrementButton: {
            className: classNames(
              "flex items-center justify-center cursor-pointer overflow-hidden relative",
              "w-8 h-8 text-neutral border-0 bg-transparent rounded-full transition-colors duration-200 ease-in-out",
              "text-permanent_white hover:border-transparent hover:bg-gray-200"
            ),
          },
          weekLabel: { className: "text-neutral" },
          weekDay: { className: "text-permanent_white" },
          dayLabel: (options) => ({
            className: classNames(
              "w-10 h-10 rounded-full transition-shadow duration-200 border-transparent border",
              "flex items-center justify-center mx-auto overflow-hidden relative",
              "focus:outline-none focus:border-[3px] focus:border-primary focus:rounded-full",
              {
                "opacity-60 cursor-default": options?.context.disabled,
                "cursor-pointer": !options?.context.disabled,
              },
              {
                "text-permanent_white bg-transparent hover:bg-medium hover:text-permanent_white":
                  !options?.context.selected && !options?.context.disabled,
                "text-permanent_white bg-primary hover:opacity-75":
                  options?.context.selected && !options?.context.disabled,
              }
            ),
          }),
          monthPicker: { className: "my-2" },
          month: (options) => ({
            className: classNames(
              "w-1/3 inline-flex items-center justify-center cursor-pointer overflow-hidden relative",
              "p-1 transition-shadow duration-200 rounded-lg",
              {
                "text-permanent_white bg-transparent hover:bg-gray-200":
                  !options?.context.selected && !options?.context.disabled,
                "text-primary bg-primary hover:bg-primary":
                  options?.context.selected && !options.context.disabled,
              }
            ),
          }),
          yearPicker: {
            className: classNames("my-2"),
          },
          year: (options) => ({
            className: classNames(
              "w-1/2 inline-flex items-center justify-center cursor-pointer overflow-hidden relative",
              "p-1 transition-shadow duration-200 rounded-lg",
              {
                "text-permanent_white bg-transparent hover:bg-gray-200":
                  !options?.context.selected && !options?.context.disabled,
                "text-primary bg-primary hover:bg-primary":
                  options?.context.selected && !options.context.disabled,
              }
            ),
          }),
          groupContainer: { className: "flex" },
          group: {
            className: classNames(
              "flex-1",
              "border-l border-gray-300 pr-0.5 pl-0.5 pt-0 pb-0",
              "first:pl-0 first:border-l-0"
            ),
          },
        }}
      />
    </div>
  );
}
