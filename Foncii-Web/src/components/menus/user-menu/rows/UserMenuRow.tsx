// Dependencies
// Framework
import React from "react";

// Components
import Image from "next/image";
import Link from "next/link";

// Types
export interface UserMenuRowProps {
  label: string; // The title of the row option
  selected?: boolean;
  onClickAction?: () => void; // External logic to fire when this option is selected
  hrefLink?: string;
  icon?: any | null; // The icon to display for the row
  IconImageView?: () => any | null; // Optional Icon Image Component to display instead of the icon, i.e avatar image view
}

// A container for user menu row based content.
export default function UserMenuRow({
  label,
  selected = false,
  onClickAction,
  hrefLink,
  icon = null,
  IconImageView = undefined,
}: UserMenuRowProps): React.ReactNode {
  // Reusable styles
  const rowStyling =
    "flex h-[50px] w-full items-center justify-start transition-all ease-in-out hover:opacity-75";

  // Subcomponents
  const IconImage = (): React.ReactNode => {
    if (icon) {
      return (
        <Image
          className="h-[22px] w-[22px]"
          src={icon}
          width={22}
          height={22}
          alt={`${label} Menu Icon`}
        />
      );
    } else if (IconImageView) {
      return (
        <div className="min-h-[22px] min-w-[22px] w-[22px] h-[22px] flex items-center justify-center">
          {IconImageView()}
        </div>
      );
    }
  };

  const TextLabel = (): React.ReactNode => {
    return (
      <div
        className={`flex overflow-hidden text-ellipsis text-[16px] ${
          selected ? "font-semibold" : "font-normal"
        } text-start items-center justify-start text-permanent_white h-full w-full transition-all ease-out`}
      >
        <p>{label}</p>
      </div>
    );
  };

  const RowContent = (): React.ReactNode => {
    return (
      <div className="flex flex-row gap-x-[12px] h-full w-full items-center justify-start">
        {IconImage()}
        {TextLabel()}
      </div>
    );
  };

  return (
    <div
      className={`px-[24px] transition-all ease-in-out ${
        selected ? "bg-primary" : ""
      } hover:bg-primary`}
    >
      {hrefLink == undefined ? (
        <button
          aria-label={label}
          role="button"
          aria-controls="user-menu-options-content"
          className={rowStyling}
          onClick={onClickAction}
        >
          {RowContent()}
        </button>
      ) : (
        <Link
          aria-label={label}
          role="button"
          aria-controls="navigation-bar-row-content"
          className={rowStyling}
          href={hrefLink}
          onClick={onClickAction}
        >
          {RowContent()}
        </Link>
      )}
    </div>
  );
}
