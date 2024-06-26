// Dependencies
// Types
import { StaticImport } from "next/dist/shared/lib/get-img-props";

// Components
import FonciiToolTip from "../../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../../../public/assets/images/ImageRepository";

// Types
interface SliderIconProps {
  title: string;
  currentValue: number;
  icon?: StaticImport;
}

// Note: Supply class names other than dimensions (height, width), this button is set to fill its parent container
export default function SliderIcon({
  title,
  currentValue,
  icon,
}: SliderIconProps) {
  // Assets
  const iconAltDescription = () => `${title} Rating Filter Icon`;

  const valueHumanReadableDescription = (): string => {
    if (currentValue <= 1) {
      return "All"; // All indicates the filter isn't being applied
    } else {
      return `${Number(currentValue).toFixed(1)}`;
    }
  };

  return (
    <FonciiToolTip title={title}>
      <div className="flex flex-col pointer-events-none">
        {/* Overlay on top of icon */}
        <div className="absolute w-full">
          <div className="flex flex-row justify-center">
            <p
              className={`line-clamp-1 font-normal text-center text-[12px] text-primary`}
            >
              {valueHumanReadableDescription()}
            </p>
          </div>
        </div>
        <Image
          className="
                    w-[28px] h-[28px] object-cover object-center pointer-events-none pb-[3px]"
          src={ImageRepository.FilterIcons.SpeakerBoxIcon}
          alt={"Speakerbox Icon"}
          priority
        />
        <div className="flex flex-row justify-center">
          <Image
            className="
                        w-[24px] h-[24px] object-cover object-center pointer-events-none 
                        rounded-full"
            src={icon ?? ImageRepository.Placeholders.FonciiLogoPlaceholder}
            alt={iconAltDescription()}
            width={24}
            height={24}
            priority
          />
        </div>
      </div>
    </FonciiToolTip>
  );
}
