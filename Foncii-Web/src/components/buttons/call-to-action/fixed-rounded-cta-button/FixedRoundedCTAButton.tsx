"use client";
// Dependencies
// Types
import { ComponentSize } from "../../../../types/component-types";

// Styling
import { ColorEnum } from "../../../../../public/assets/ColorRepository";

interface ButtonProps {
  title: string;
  size: ComponentSize;
  onClickAction?: () => void;
}

/// Fixed size configurable rounded CTA button
function FixedRoundedCTAButton({
  title,
  size = ComponentSize.small,
  onClickAction,
}: ButtonProps) {
  // Configurable Sizing
  const textSize = (): string => {
    switch (size) {
      case ComponentSize.small:
        return "text-[10px]";
      case ComponentSize.medium:
        return "text-[12px]";
      case ComponentSize.large:
        return "text-[14px]";
      case ComponentSize.xl:
        return "text-[16px]";
      default:
        return "text-[10px]"; // Default size is small
    }
  };

  const verticalPadding = (): string => {
    switch (size) {
      case ComponentSize.small:
        return "py-[1px]";
      case ComponentSize.medium:
        return "py-[1px]";
      case ComponentSize.large:
        return "py-[4px]";
      case ComponentSize.xl:
        return "py-[8px]";
      default:
        return "py-[2.5px]"; // Default size is small
    }
  };

  return (
    <button
      onClick={onClickAction}
      className={`flex flex-col items-center justify-center
            bg-${ColorEnum.primary} rounded-[45px] px-[5px] ${verticalPadding()}
            hover:opacity-50 w-[inherit]
            transition ease-in-out`}
    >
      <h1 className={`text-white ${textSize()} font-normal truncate`}>{title}</h1>
    </button>
  );
}

export default FixedRoundedCTAButton;
