// Dependencies
// Components
// Local
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";

// Types
interface CheckMarkToggleButtonProps {
  title?: string;
  onClickAction?: () => void;
  toggled: boolean;
  disabled?: boolean;
  className?: string | undefined;
}

export default function CheckMarkToggleButton({
  title,
  onClickAction,
  toggled,
  disabled = false,
  className,
}: CheckMarkToggleButtonProps) {
  return (
    <FonciiToolTip title={title}>
      <div className="h-[20px] w-[20px]">
        <button
          className={cn(
            `flex h-[20px] w-[20px] rounded-sm border-[1px] border-primary justify-center items-center hover:opacity-70 transition-all transform-gpu active:scale-90 overflow-hidden`,
            className
          )}
          onClick={onClickAction}
          disabled={disabled}
        >
          {toggled ? (
            <Image
              src={ImageRepository.UtilityIcons.ToggleCheckMarkIcon}
              alt="Auto-refresh toggle check mark"
              className="h-[20px] w-[20px] object-cover"
            />
          ) : undefined}
        </button>
      </div>
    </FonciiToolTip>
  );
}
