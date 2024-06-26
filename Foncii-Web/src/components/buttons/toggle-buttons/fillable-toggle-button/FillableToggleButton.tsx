"use client";
// Dependencies
// Types
import { StaticImport } from "next/dist/shared/lib/get-img-props";

// External
import Image from "next/image";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";

// Types
interface FillableToggleButtonProps {
  title: string; // Title to display inside the button as a label
  toggled: boolean;
  icon?: StaticImport;
  onToggleAction: () => void;
  disabled?: boolean;
}

export default function FillableToggleButton({
  title,
  toggled,
  icon,
  onToggleAction,
  disabled = false,
}: FillableToggleButtonProps) {
  // Note: Maximum size of this button is 150px, the text title is truncated
  return (
    <div>
      <button
        className={cn(
          toggled ? "bg-primary" : "bg-transparent",
          disabled ? "opacity-50" : "opacity-100",
          toggled ? "border-primary" : "border-neutral",
          "flex h-fit w-fit px-[12px] py-[3px] rounded-full max-w-[150px] flex-shrink-0 transition-all ease-in-out duration-200 hover:bg-primary hover:border-transparent hover:bg-opacity-75 border-[1px]"
        )}
        onClick={onToggleAction}
        disabled={disabled}
      >
        {icon ? (
          <Image
            className="h-[20px] w-[20px] pr-[8px]"
            src={icon}
            alt={`${title} button icon`}
            width={20}
            height={20}
            unoptimized
          />
        ) : undefined}
        <p
          className={`line-clamp-1 text-permanent_white font-normal text-[12px] text-start`}
        >
          {title}
        </p>
      </button>
    </div>
  );
}
