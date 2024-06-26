// Dependencies
// Framework
import { HTMLAttributes } from "react";

// Styling
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Components
// Local
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

// Types
interface CloseUtilityButtonProps {
  onClick: () => void;
  filled?: boolean; // -> True if the desired style is the filled variant, false otherwise, default is true
  title?: string;
  className?: ClassNameValue;
}

// Note: Supply class names other than dimensions (height, width), this button is set to fill its parent container
export default function CloseUtilityButton({
  onClick,
  filled = true,
  className,
  title = "Close",
  ...props
}: CloseUtilityButtonProps & HTMLAttributes<HTMLButtonElement>) {
  // Assets
  const icon = ImageRepository.UtilityIcons.CloseXmarkUtilityIcon;

  return (
    <FonciiToolTip title={title}>
      <button
        {...props}
        onClick={onClick}
        className={cn(
          `flex w-full h-full ${
            filled ? "bg-permanent_black bg-opacity-25" : ""
          } bg-opacity-30 rounded-full transition-all ease-in-out active:scale-90 hover:opacity-75`,
          className
        )}
      >
        <Image
          className="p-[25%] h-full w-full"
          src={icon}
          alt="Close Button Icon"
        />
      </button>
    </FonciiToolTip>
  );
}
