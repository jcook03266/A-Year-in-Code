// Dependencies
// Utilities
import { cn } from "../../../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

// Components
import FonciiToolTip from "../../../../../components/tool-tips/FonciiToolTip";

// Types
interface TPQCTAButtonProps {
  title: string;
  onClick: () => void;
  className?: ClassNameValue;
}

/**
 * Reusable Taste Profile Questionnaire call to action button
 * used for the 'get started' prompt and the 'complete' prompt
 * at the end of the questionnaire.
 */
export default function TPQCTAButton({
  title,
  onClick,
  className,
}: TPQCTAButtonProps) {
  return (
    <FonciiToolTip title={title}>
      <button
        onClick={onClick}
        className={cn(
          `flex flex-row gap-x-[16px] px-[24px] py-[8px] font-normal text-[16px] text-permanent_white justify-center items-center w-fit min-w-[168px] h-[40px] bg-primary rounded-[15px] shadow-lg hover:opacity-75 ease-in-out transition-all active:scale-90`,
          className
        )}
      >
        <p className={`shrink-0`}>{title}</p>
      </button>
    </FonciiToolTip>
  );
}
