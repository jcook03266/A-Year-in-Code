"use client";
// Dependencies
// Types
import { HTMLAttributes } from "react";

// Components
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";
import CircularLoadingIndicator from "../../../../components/loading-indicators/circular-loading-indicator/CircularLoadingIndicator";

// Styling
import { ColorEnum } from "../../../../../public/assets/ColorRepository";

// Types
interface RoundedRectangularActionButtonProps {
  title: string;
  backgroundColor?: ColorEnum;
  foregroundColor?: ColorEnum;
  onClickAction: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * Simple on-click action button that supports a circular loading indicator
 * given some input loading state, as well as customizing of the button's
 * background and foreground(text) colors.
 *
 * @param title
 * @param backgroundColor -> Default is `medium_dark_grey
 * @param foregroundColor -> Default is `permanent_white`
 * @param onClickAction
 * @param className
 * @param disabled -> Default is false
 * @param isLoading -> Default is false
 */
export default function RoundedRectangularActionButton({
  title,
  backgroundColor = ColorEnum.medium_dark_grey,
  foregroundColor = ColorEnum.permanent_white,
  onClickAction,
  className,
  disabled = false,
  isLoading = false,
}: RoundedRectangularActionButtonProps & HTMLAttributes<HTMLButtonElement>) {
  // Subcomponents
  const Content = (): React.ReactNode => {
    return isLoading ? (
      <CircularLoadingIndicator
        isLoading={isLoading}
        className="min-h-[30px] min-w-[30px] p-[6px]"
      />
    ) : (
      <p
        className={`text-${foregroundColor} text-[14px] font-normal line-clamp-1`}
      >
        {title}
      </p>
    );
  };

  return (
    <span
      className={`${disabled ? "opacity-50" : ""} ${
        disabled || isLoading ? "pointer-events-none" : ""
      } h-fit w-fit`}
    >
      <FonciiToolTip title={title}>
        <button
          className={`flex items-center justify-center ${className} px-[20px] min-h-[40px] min-w-[120px] bg-${backgroundColor} rounded-[8px] border-[1px] border-medium_dark_grey items-center justify-center hover:opacity-70 transition-all transform-gpu active:scale-90`}
          disabled={disabled || isLoading}
          onClick={onClickAction}
        >
          {Content()}
        </button>
      </FonciiToolTip>
    </span>
  );
}
