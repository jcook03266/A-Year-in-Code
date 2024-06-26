// Dependencies
// Assets
import { ImageRepository } from "../../../../../../public/assets/images/ImageRepository";

// Components
// Local
import FonciiToolTip from "../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Types
export enum TPQNavigationButtonDirection {
  forward,
  backward,
}

/**
 * Reusable Taste Profile Questionnaire navigation button
 * used to navigate forward or backward through the questionnaire
 * depending on the designation given
 */
export default function TPQNavigationButton({
  direction,
  hideDirection = false,
  onClick,
}: {
  direction: TPQNavigationButtonDirection;
  hideDirection?: boolean;
  onClick: () => void;
}) {
  // Properties
  const title =
      direction == TPQNavigationButtonDirection.forward ? "Next" : "Back",
    icon = ImageRepository.UtilityIcons.LeftChevronNavigationIcon,
    iconClassName =
      direction == TPQNavigationButtonDirection.forward ? "rotate-180" : ""; // Rotated for forward direction button

  // Subcomponents
  const DirectionIcon = (): React.ReactNode => {
    if (hideDirection) return;

    return (
      <Image
        alt={`${title} Navigation Icon`}
        src={icon}
        className={`h-[16px] w-fit shrink-0 ${iconClassName} ${
          direction == TPQNavigationButtonDirection.backward
            ? "order-1"
            : "order-2"
        }`}
      />
    );
  };

  return (
    <FonciiToolTip title={`Navigate ${title == "Next" ? "Forward" : title}`}>
      <button
        onClick={onClick}
        className={`flex flex-row gap-x-[16px] px-[24px] py-[8px] font-normal border-[1px] active:border-[0px] hover:bg-primary active:bg-primary active:border-transparent hover:border-transparent border-medium text-[18px] active:text-permanent_white hover:text-permanent_white text-neutral justify-center items-center w-full max-w-[168px] h-[40px] bg-transparent rounded-[15px] shadow-lg hover:opacity-75 ease-in-out transition-all active:scale-90`}
      >
        {DirectionIcon()}
        <p
          className={`shrink-0 ${
            direction == TPQNavigationButtonDirection.backward
              ? "order-2"
              : "order-1"
          }`}
        >
          {title}
        </p>
      </button>
    </FonciiToolTip>
  );
}
