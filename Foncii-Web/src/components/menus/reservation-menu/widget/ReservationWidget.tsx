/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { ReservationAvailability } from "../../../../__generated__/graphql";

// Hooks
import React, { useEffect, useState } from "react";

// Components
import CalendarPicker from "../components/calendar-picker/CalendarPicker";
import ReservationTimeTable from "../components/reservation-time-table/ReservationTimeTable";
import PartySizeSelector from "../components/party-size-selector/PartySizeSelector";
import CalendarPickerToggle from "../components/calendar-picker-toggle/CalendarPickerToggle";
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";

// Redux
import { getPostFiltersSlice } from "../../../../redux/operations/selectors";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

// Animations
import { AnimatePresence, motion } from "framer-motion";

interface ReservationTimeTableProps {
  // Optional, only used when presented in detail views tied to specific restaurants, when filtering posts as a menu this is left undefined
  reservationAvailabilities?: ReservationAvailability[];
  // Optional callbacks used to inform the parent of an update
  onReservationDateChange?: (date: Date) => void;
  onPartySizeChange?: (size: number) => void;
  onReservableOnlyToggled?: (toggle: boolean) => void;
  showReservableOnlyToggle?: boolean;
  // Allows the component to use a shared state provided by the redux store used within and synchronize across other subscribed instances
  usePersistentStoreValues?: boolean;
  // Optional custom class names for additional styling, good for specifying a maximu size for different scenes
  className?: ClassNameValue;
  loadingReservations?: boolean;
}

export default function ReservationWidget({
  reservationAvailabilities,
  onReservationDateChange,
  onPartySizeChange,
  onReservableOnlyToggled,
  showReservableOnlyToggle = true,
  usePersistentStoreValues = false,
  className,
  loadingReservations = false,
}: ReservationTimeTableProps) {
  // State Management
  // Redux
  const postFilters = getPostFiltersSlice()();

  // Filter store state / Initial component value
  const targetReservationDate = () => {
    return new Date(postFilters.targetReservationDate);
  };

  const targetPartySize = () => {
    return postFilters.targetReservationPartySize;
  };

  const reservableOnlyFilter = () => {
    return postFilters.reservableOnly;
  };

  // Reservation Properties
  const [reservationDate, setReservationDate] = useState<Date>(
    targetReservationDate
  );
  const [partySize, setPartySize] = useState<number>(targetPartySize);
  const [reservableOnlyToggled, setReservableOnlyToggled] =
    useState<boolean>(reservableOnlyFilter);

  // Toggle State
  const [dateSelectorToggled, setDateSelectorToggled] = useState(false);

  // Refresh when data updated externally
  useEffect(() => { }, [reservationAvailabilities, postFilters]);

  // Action Handlers
  const handleReservationDateChange = (targetReservationDate: Date) => {
    setReservationDate(targetReservationDate);
    onReservationDateChange?.(targetReservationDate);
  };

  const handlePartySizeChange = (size: number) => {
    setPartySize(size);
    onPartySizeChange?.(size);
  };

  const handleReservableOnlyToggle = (newReservableOnlyState: boolean) => {
    setReservableOnlyToggled(newReservableOnlyState);
    onReservableOnlyToggled?.(newReservableOnlyState);
  };

  // Subcomponents
  const ReservationsOnlyFilterToggle = (): React.ReactNode => {
    if (!showReservableOnlyToggle) return;

    return (
      <FonciiToolTip title="Only show restaurants with available reservations">
        <button
          className={cn('shadow-xl flex items-center gap-x-[4px] h-fit w-fit py-[4px] px-[16px] rounded-full',
            reservableOnlyFilter() ? "bg-primary" : "bg-medium_dark_grey",
            'hover:opacity-75 active:scale-90 transition-all ease-in-out')}
          onClick={() => handleReservableOnlyToggle(!reservableOnlyToggled)}
        >
          <p className="text-[14px] text-permanent_white line-clamp-1">
            {"Available Now"}
          </p>
        </button>
      </FonciiToolTip>
    );
  };

  const Selectors = (): React.ReactNode => {
    return (
      <div className="flex flex-row gap-x-[8px] justify-center">
        {ReservationsOnlyFilterToggle()}

        <CalendarPickerToggle
          targetReservationDate={
            usePersistentStoreValues ? targetReservationDate() : reservationDate
          }
          initialToggleState={dateSelectorToggled}
          toggleStateDidChange={(newToggleState) => {
            setDateSelectorToggled(newToggleState);
          }}
        />

        <PartySizeSelector
          targetPartySize={
            usePersistentStoreValues ? targetPartySize() : partySize
          }
          onPartySizeChange={handlePartySizeChange}
        />
      </div>
    );
  };

  const CalendarTimeTableComboBox = (): React.ReactNode => {
    return (
      <div
        className={cn('flex flex-col justify-start items-start gap-y-[16px] w-fit h-fit transition-all rounded-[8px]',
          dateSelectorToggled || reservationAvailabilities
            ? "bg-medium_light_grey bg-opacity-50 backdrop-blur-lg p-[16px] opacity-100"
            : "bg-transparent opacity-0 p-[0px]"
        )}
      >
        <AnimatePresence>
          {dateSelectorToggled ? (
            <motion.div
              key={"calendar-picker-container"}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <CalendarPicker
                targetReservationDate={
                  usePersistentStoreValues
                    ? targetReservationDate()
                    : reservationDate
                }
                dateSelectionDidChange={handleReservationDateChange}
              />
            </motion.div>
          ) : undefined}
        </AnimatePresence>

        {reservationAvailabilities ? (
          <ReservationTimeTable
            reservationAvailabilities={reservationAvailabilities}
            isLoading={loadingReservations}
          />
        ) : undefined}
      </div>
    );
  };

  return (
    <div
      className={cn(
        `overflow-x-hidden overflow-y-auto h-full w-fit`,
        className
      )}
    >
      <div className="flex flex-col justify-center items-start shrink-0 h-fit w-fit transition-all ease-in-out gap-y-[8px]">
        {Selectors()}
        {CalendarTimeTableComboBox()}
      </div>
    </div>
  );
}
