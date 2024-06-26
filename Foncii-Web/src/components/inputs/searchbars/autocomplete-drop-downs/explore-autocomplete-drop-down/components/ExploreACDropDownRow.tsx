"use client";
// Dependencies
// Types
import { ExploreSearchAutoCompleteSuggestion } from "../../../../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Framework
import React, { useState } from "react";

// Components
// Local
import FonciiToolTip from "../../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../../../public/assets/images/ImageRepository";

// Utils
import {
  externalResizableImageRequestBuilder,
  resizableImageRequestBuilder,
} from "../../../../../../utilities/tooling/resizableImageRequestBuilder";

// Types
export interface ExploreACDropDownRowProps {
  label: string; // The title / description of the search suggestion option
  suggestion?: ExploreSearchAutoCompleteSuggestion; // Whether or not this is a user's account being suggested
  isSuggestionCached?: boolean; // Whether or not this is a cached suggestion (the styling and primary icon changes to emphasize this)
  clearCachedSuggestionButtonAction?: () => void; // External logic to fire when this cached search suggestion option is removed from the cache (e.g. when the user clicks the X)
  onClickAction: () => void; // External logic to fire when this search suggestion option is selected
  previewImageURL?: string; // Optional preview image to display on the side for the search result
}

export default function ExploreACDropDownRow({
  label,
  suggestion,
  isSuggestionCached = false,
  clearCachedSuggestionButtonAction,
  onClickAction,
  previewImageURL = undefined,
}: ExploreACDropDownRowProps): React.ReactNode {
  // State Management
  const [mediaLoadErrorDidOccur, setMediaLoadErrorDidOccur] = useState(false);

  // Properties
  const optimizedPreviewImageURL = () => {
    if (mediaLoadErrorDidOccur || !previewImageURL) {
      return ImageRepository.Placeholders.FonciiLogoPostFallback;
    } else {
      if (
        suggestion?.__typename != "RestaurantAutoCompleteSuggestion" &&
        suggestion?.__typename != "PopularSearchQuerySuggestion"
      ) {
        // User post or user avatar images (Internal)
        return resizableImageRequestBuilder({
          baseImageURL: previewImageURL,
          imageResizingProps: {
            width: 160,
            height: 160,
            fit: MediaServerImageFitParams.cover,
            format: MediaServerImageFormatParams.f3,
          },
        });
      } else {
        // Restaurant images (External)
        return externalResizableImageRequestBuilder({
          imageURL: previewImageURL,
          imageResizingProps: {
            width: 160,
            height: 160,
            fit: MediaServerImageFitParams.cover,
            format: MediaServerImageFormatParams.f3,
          },
        });
      }
    }
  };

  // Convenience
  const isUserSuggestion =
    suggestion?.__typename == "UserAutoCompleteSuggestion";

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
    const icon = isUserSuggestion
        ? ImageRepository.Placeholders.UserProfilePicturePlaceholder
        : isSuggestionCached
        ? ImageRepository.UtilityIcons.ClockIcon
        : ImageRepository.UtilityIcons.SearchUtilityIcon,
      alt = isSuggestionCached
        ? "Cached Search Suggestion Icon"
        : "Search Suggestion Icon";

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
    const textColor = isSuggestionCached
      ? "text-primary"
      : "text-permanent_white";

    return (
      <div
        className={`flex overflow-hidden text-[16px] text-ellipsis ${textColor} text-start items-center justify-start h-fit w-fit transition-all ease-out`}
      >
        <FonciiToolTip title={label}>
          <p className="line-clamp-1">{label}</p>
        </FonciiToolTip>
      </div>
    );
  };

  const ClearCachedSuggestionButton = (): React.ReactNode => {
    if (!isSuggestionCached) return;

    return (
      <FonciiToolTip title="Clear this suggestion">
        <button
          className="pointer-events-auto h-[48px] w-[48px] hover:opacity-75 active:scale-75 transition-all ease-in-out items-center justify-center shrink-0 pl-[16px]"
          onClick={clearCachedSuggestionButtonAction}
        >
          <Image
            className="h-[14px] w-[14px]"
            height={14}
            width={14}
            src={ImageRepository.UtilityIcons.CloseXmarkUtilityIcon}
            alt="Clear Cached Suggestion Button Icon"
            unoptimized
            unselectable="on"
          />
        </button>
      </FonciiToolTip>
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
        aria-controls="explore-search-suggestion-options-content"
        className={`flex justify-start items-center h-[60px] w-full transition-all ease-in-out`}
        onClick={onClickAction}
      >
        {RowContent()}
      </button>

      {ClearCachedSuggestionButton()}
    </div>
  );
}
