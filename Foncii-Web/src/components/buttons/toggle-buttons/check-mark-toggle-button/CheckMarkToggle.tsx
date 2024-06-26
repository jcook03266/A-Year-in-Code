// Dependencies
// Components
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

// Variant for embedding within another button
export default function CheckMarkToggle({
  onClickAction,
  toggled,
  className,
}: CheckMarkToggleButtonProps) {
  return (
    <div className="h-[20px] w-[20px]">
      <div
        className={cn(
          `flex h-[20px] w-[20px] rounded-full border-[1px] border-primary justify-center items-center hover:opacity-70 transition-all active:scale-90 transform-gpu overflow-hidden`,
          className
        )}
        onClick={onClickAction}
      >
        {toggled ? (
          <Image
            src={ImageRepository.UtilityIcons.ToggleCheckMarkIcon}
            alt="Toggle check mark"
            className="h-[20px] w-[20px] object-cover"
            priority
          />
        ) : undefined}
      </div>
    </div>
  );
}
