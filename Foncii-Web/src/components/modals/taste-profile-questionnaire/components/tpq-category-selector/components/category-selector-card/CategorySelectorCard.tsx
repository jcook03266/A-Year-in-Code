"use client";
// Dependencies
// Types
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Components
import Image from "next/image";

// Styling
import ColorRepository from "../../../../../../../../public/assets/ColorRepository";

// Assets
import { ImageRepository } from "../../../../../../../../public/assets/images/ImageRepository";

// Hooks
import { useState } from "react";

// Utilities
import { ClassNameValue } from "tailwind-merge";
import { cn } from "../../../../../../../utilities/development/DevUtils";
import { resizableImageRequestBuilder } from "../../../../../../../utilities/tooling/resizableImageRequestBuilder";

// Types
interface CategorySelectorCardProps {
  /**
   * This is what will be passed back when the card is selected,
   * this should be the id of the entity, not its index.
   */
  id: string;
  title: string;
  imageURL: string;
  /**
   * True if the entity is selected as reported by some data
   * source present in the parent component, false otherwise
   */
  selected: boolean;
  /**
   * Callback to the parent to inform it that this entity was selected or unselected by the user.
   * The current selection state is passed to the caller as well as the id to make the
   * decision of whether or not to remove the entity from its external selection state.
   */
  onSelect: (id: string, currentSelectionState: boolean) => void;
}

export default function CategorySelectorCard({
  id,
  title,
  imageURL,
  selected,
  onSelect,
}: CategorySelectorCardProps) {
  // State Management
  const [mediaLoadErrorDidOccur, setMediaLoadErrorDidOccur] = useState(false);

  // Styling
  const mainContainerStyling: ClassNameValue =
    "shrink-0 relative shadow-lg rounded-[10px] w-[157px] h-[132px] overflow-hidden active:scale-95 transition-transform ease-in-out transition-all";

  // Properties
  // Keep in parity w/ dimensions in `mainContainerStyling`
  const imageWidth = 157,
    imageHeight = 132;

  const backgroundImage = (): string => {
    if (mediaLoadErrorDidOccur) {
      return ImageRepository.Placeholders.FonciiLogoPostFallback;
    } else {
      return resizableImageRequestBuilder({
        baseImageURL: imageURL,
        imageResizingProps: {
          width: imageWidth,
          height: imageHeight,
          fit: MediaServerImageFitParams.cover,
          format: MediaServerImageFormatParams.f3,
        },
      });
    }
  };

  // Action handlers
  function handCardClick() {
    onSelect(id, selected);
  }

  // Subcomponents
  const BackgroundImageView = (): React.ReactNode => {
    return (
      <div className="relative w-full h-full overflow-hidden shrink-0">
        <Image
          src={backgroundImage()}
          width={imageWidth}
          height={imageHeight}
          unselectable="on"
          className="w-full h-full object-cover object-center pointer-events-none"
          onError={() => setMediaLoadErrorDidOccur(true)}
          alt={title}
          loading="eager"
          fetchPriority="high"
          unoptimized
        />

        {/* Overlay gradient */}
        <div
          className="h-full w-full absolute z-1 top-0 hover:opacity-50 transition-all ease-in-out pointer-events-auto"
          style={{
            background: ColorRepository.gradients.post_hero_overlay_gradient,
          }}
        />
      </div>
    );
  };

  const Overlay = (): React.ReactNode => {
    return (
      <div className="h-full w-full absolute z-1 top-0 flex flex-col justify-end pointer-events-none">
        <div className="flex flex-col px-[8px] pb-[8px] items-start justify-center text-left">
          <TitleLabel />
        </div>
      </div>
    );
  };

  const TitleLabel = (): React.ReactNode => {
    return (
      <p
        title={title}
        className="font-normal text-[16px] text-permanent_white h-fit w-fit line-clamp-2"
      >
        {title}
      </p>
    );
  };

  return (
    <button
      className={cn(
        mainContainerStyling,
        "bg-medium_dark_grey",
        selected ? "border-primary border-[2px]" : ""
      )}
      onClick={handCardClick}
      title={title}
    >
      {BackgroundImageView()}
      {Overlay()}
    </button>
  );
}
