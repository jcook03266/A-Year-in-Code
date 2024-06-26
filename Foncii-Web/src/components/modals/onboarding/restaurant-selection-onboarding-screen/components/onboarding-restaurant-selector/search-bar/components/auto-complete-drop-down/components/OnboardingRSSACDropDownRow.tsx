"use client";
// Dependencies
// Framework
import React, { useState } from "react";

// Components
// Local
import FonciiToolTip from "../../../../../../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../../../../../../../public/assets/images/ImageRepository";

// Utils
import { externalResizableImageRequestBuilder } from "../../../../../../../../../../utilities/tooling/resizableImageRequestBuilder";

// Types
export interface OnboardingRSSACDropDownRowProps {
  label: string; // The title / description of the search suggestion option
  onClickAction: () => void; // External logic to fire when this search suggestion option is selected
  previewImageURL?: string; // Optional preview image to display on the side for the search result
}

export default function OnboardingRSSACDropDownRow({
  label,
  onClickAction,
  previewImageURL = undefined,
}: OnboardingRSSACDropDownRowProps): React.ReactNode {
  // State Management
  const [mediaLoadErrorDidOccur, setMediaLoadErrorDidOccur] = useState(false);

  // Properties
  const optimizedPreviewImageURL = () => {
    if (mediaLoadErrorDidOccur || !previewImageURL) {
      return ImageRepository.Placeholders.FonciiLogoPostFallback;
    } else {
      // Restaurant images (External)
      return externalResizableImageRequestBuilder({
        imageURL: previewImageURL,
        imageResizingProps: {
          width: 160,
          height: 160,
        },
      });
    }
  };

  // Subcomponents
  const PreviewImage = (): React.ReactNode => {
    if (!previewImageURL) return;

    return (
      <div className="h-fit w-fit shrink-0 pl-[16px]">
        <Image
          className="h-[48px] w-[48px] shadow-lg rounded-[10px] object-cover"
          src={optimizedPreviewImageURL()}
          onError={() => setMediaLoadErrorDidOccur(true)}
          width={48}
          height={48}
          alt={`${label} Preview Image`}
          unoptimized
          unselectable="on"
        />
      </div>
    );
  };

  const SearchSuggestionIcon = (): React.ReactNode => {
    const icon = ImageRepository.UtilityIcons.SearchUtilityIcon,
      alt = "Search Suggestion Icon";

    return (
      <Image
        className="h-[18px] w-[18px]"
        src={icon}
        width={18}
        height={18}
        alt={alt}
        unoptimized
        unselectable="on"
      />
    );
  };

  const TextLabel = (): React.ReactNode => {
    const textColor = "text-permanent_white";

    return (
      <div
        className={`flex overflow-hidden text-[16px] text-ellipsis ${textColor} text-start items-center justify-start h-fit w-fit transition-all ease-out`}
      >
        <FonciiToolTip>
          <p className="line-clamp-1" title={label}>
            {label}
          </p>
        </FonciiToolTip>
      </div>
    );
  };

  const RowContent = (): React.ReactNode => {
    return (
      <div className="flex flex-row items-center h-full w-full justify-between">
        <div className="flex flex-row gap-x-[16px] h-fit w-fit items-center">
          {SearchSuggestionIcon()}
          {TextLabel()}
        </div>

        {PreviewImage()}
      </div>
    );
  };

  return (
    <div className="flex flex-row gap-x-[8px] px-[16px] justify-start items-center w-full h-fit shrink-0 hover:bg-medium_dark_grey hover:opacity-75">
      <button
        role="button"
        aria-controls="onboarding-search-suggestion-options-content"
        className={`flex justify-start items-center h-[60px] w-full transition-all ease-in-out`}
        onClick={onClickAction}
      >
        {RowContent()}
      </button>
    </div>
  );
}
