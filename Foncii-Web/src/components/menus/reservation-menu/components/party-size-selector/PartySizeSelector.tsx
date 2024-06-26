/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Assets
import { ImageRepository } from "../../../../../../public/assets/images/ImageRepository";

// Hooks
import React, { useEffect, useState } from "react";

// Components
// Local
import FonciiToolTip from "../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Utilities
import { isInRange } from "../../../../../utilities/math/commonMath";

// Types
interface PartySizeSelectorProps {
  targetPartySize?: number;
  onPartySizeChange: (size: number) => void;
}

export default function PartySizeSelector({
  targetPartySize,
  onPartySizeChange,
}: PartySizeSelectorProps) {
  // State Management
  const [isToggled, setIsToggled] = useState(false);

  // Update when the target party size is updated externally
  useEffect(() => {
    setPartySize(targetPartySize ?? partySize);
  }, [targetPartySize]);

  // Limits
  const partySizeLimits = { max: 20, min: 1 };

  // Properties
  const defaultPartySize = 2;
  const [partySize, setPartySize] = useState<number>(
    isInRange(
      targetPartySize ?? defaultPartySize,
      partySizeLimits.max,
      partySizeLimits.min
    )
      ? targetPartySize ?? defaultPartySize
      : defaultPartySize
  );

  // Action Handlers
  const handlePartySizeChange = (event: any) => {
    const newSize = parseInt(event.target.value, 10);

    setPartySize(newSize);
    onPartySizeChange(newSize);
  };

  const onClickAction = () => {
    const newToggleState = !isToggled;

    setIsToggled(newToggleState);
  };

  // Subcomponents
  const SelectorMenu = (): React.ReactNode => {
    return (
      <select
        id="party-size-drop-down"
        className={`text-permanent_white bg-transparent h-fit w-fit pr-[16px] ${
          (partySize ?? 0) >= 10 ? "pr-[16px]" : "pr-[8px]"
        } cursor-pointer`}
        value={partySize}
        onClick={onClickAction}
        onChange={handlePartySizeChange}
      >
        {[...Array(20).keys()].map((partySize) => (
          <option
            className="text-[14px] text-permanent_white line-clamp-1 w-fit"
            key={partySize + 1}
            value={partySize + 1}
          >
            {partySize + 1} {partySize === 0 ? "Guest" : "Guests"}
          </option>
        ))}
      </select>
    );
  };

  const PartySizeSelectorIcon = (): React.ReactNode => {
    return (
      <Image
        className="h-[15px] w-[20px]"
        src={ImageRepository.FilterIcons.ReservationPartySizeSelectorIcon}
        alt="Party Size Selector Icon"
        priority
      />
    );
  };

  return (
    <FonciiToolTip title="Reservation party size">
      <div className="shadow-xl flex items-center gap-x-[4px] h-fit w-fit py-[4px] px-[16px] rounded-full bg-primary hover:opacity-75 active:scale-90 transition-all ease-in-out">
        {PartySizeSelectorIcon()}
        {SelectorMenu()}
      </div>
    </FonciiToolTip>
  );
}
