"use client";
// Dependencies
// Utilities
import { cn } from "../../../../utilities/development/DevUtils";
import { ColorEnum } from "../../../../../public/assets/ColorRepository";

// Types
interface ShowMoreButtonProps {
  showMore: boolean;
  onClickAction: () => void;
  disabled?: boolean;
  className?: string;
}

export default function ShowMoreButton({
  showMore,
  onClickAction,
  disabled = false,
  className,
}: ShowMoreButtonProps) {
  return (
    <button
      className={cn(
        disabled ? "opacity-50" : "opacity-100",
        "border-neutral flex h-fit w-fit transition-all ease-in-out duration-200 hover:bg-opacity-75"
      )}
      onClick={onClickAction}
      disabled={disabled}
    >
      <p
        className={cn(
          `text-${ColorEnum.permanent_white} text-[14px] font-normal text-start line-clamp-1`,
          className
        )}
      >
        {showMore ? "Show more" : "Show less"}
      </p>
    </button>
  );
}
