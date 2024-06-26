"use client";
// Dependencies
// Components
// Local
import FonciiToolTip from "../../../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Hooks
import React from "react";

// Reusable restaurant entity detail view subcomponent
export default function RoundedDetailSelectorButton({
  title,
  description,
  onClickAction,
  rotatedIcon = false,
  icon,
}: {
  title: string;
  /** Optional description to display as a popover below the button */
  description?: string;
  onClickAction: () => void;
  rotatedIcon?: boolean;
  icon?: any;
}) {
  // Subcomponents
  const SideIcon = (): React.ReactNode => {
    if (!icon) return;

    return (
      <Image
        src={icon}
        alt={`${title} Icon`}
        height={18}
        width={18}
        className={`h-fit w-fit ease-in-out duration-200 transition-transform ${
          !rotatedIcon ? "" : "rotate-180"
        }`}
        unselectable="on"
      />
    );
  };

  return (
    <FonciiToolTip title={description}>
      <button
        className="shadow-lg flex flex-row gap-x-[8px] h-[32px] px-[16px] rounded-full items-center justify-center bg-primary hover:opacity-75 transition-all active:scale-90"
        onClick={onClickAction}
      >
        <p className="text-permanent_white text-center line-clamp-1 text-[14px] font-normal">
          {title}
        </p>
        {SideIcon()}
      </button>
    </FonciiToolTip>
  );
}
