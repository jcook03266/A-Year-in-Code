"use client";
// Dependencies
// Components
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Types
interface MenuHeaderProps {
  headerTitle: string | undefined;
  onCloseAction?: () => void;
}

export default function MenuHeader({
  headerTitle,
  onCloseAction,
}: MenuHeaderProps): React.ReactNode {
  const CloseButton = (): React.ReactNode => {
    return (
      <button
        className="h-[18px] w-[18px] bg-opacity-50"
        aria-label="Close Button"
        onClick={onCloseAction}
      >
        <Image
          className={`h-[18px] w-[18px]`}
          src={ImageRepository.UtilityIcons.CloseXmarkUtilityIcon}
          alt="Close Button Icon"
          height={18}
          width={18}
          priority
        />
      </button>
    );
  };

  return (
    <div className="w-full">
      <div
        className={`flex flex-row p-[8px] h-full w-full justify-between relative`}
      >
        <div
          className={`flex flex-col px-[8px] py-[11px] pointer-events-none justify-start items-center w-full h-fit`}
        >
          <div className="flex w-full relative">
            {onCloseAction ? (
              <div className="absolute top-0 left-0 pointer-events-auto">
                {CloseButton()}
              </div>
            ) : undefined}
          </div>
          <p
            className={`text-permanent_white text-[18px] font-semibold text-start line-clamp-1`}
          >
            {headerTitle}
          </p>
        </div>
      </div>

      {/** Divider */}
      <div className="h-[1px] w-full bg-medium_light_grey" />
    </div>
  );
}
