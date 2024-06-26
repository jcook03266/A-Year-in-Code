"use client";
// Dependencies
import { useState } from "react";

// Types
import {
  FmUserPostMedia,
  PostMediaTypes,
} from "../../../__generated__/graphql";

// Styling
import ColorRepository from "../../../../public/assets/ColorRepository";

// Components
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";
import {
  ResizableImageRequestProps,
  resizableImageRequestBuilder,
} from "../../../utilities/tooling/resizableImageRequestBuilder";

interface PostSecondaryImageViewProps {
  media: FmUserPostMedia;
  /** True to present overlay gradient over the media, false otherwise */
  isOverlayed?: boolean;
  onClickAction?: () => void;
  className?: ClassNameValue;
  imageResizingProps: ResizableImageRequestProps;
  priorityLoad?: boolean;
}

/// Lazy loaded image view for hosting secondary carousel image content of a target post
export default function PostSecondaryImageView({
  media,
  isOverlayed = true,
  onClickAction = () => {},
  className,
  imageResizingProps,
  priorityLoad = true,
}: PostSecondaryImageViewProps) {
  // State Management
  const [mediaLoadErrorDidOccur, setMediaLoadErrorDidOccur] = useState(false);

  // Properties
  const imageWidth = imageResizingProps.width,
    imageHeight = imageResizingProps.height;

  // Fallback to a known placeholder in case no media is available / loaded
  const postMediaFallbackPlaceholder = (): any => {
    return ImageRepository.Placeholders.FonciiLogoPostFallback;
  };

  // Parsing
  const mediaURL = media?.mediaURL ?? undefined,
    videoMediaThumbnail = media?.videoMediaThumbnailURL ?? undefined,
    postMediaIsAVideo = media?.mediaType == PostMediaTypes.Video,
    imageMediaURL = () => {
      // Fallback / default is the data source's original media URL
      let targetImageURL: string | undefined = undefined;

      if (postMediaIsAVideo) {
        targetImageURL = videoMediaThumbnail;
      } else {
        targetImageURL = mediaURL;
      }

      // Fallback to a known image if the target media fails to load or be parsed
      if (mediaLoadErrorDidOccur || !targetImageURL) {
        return postMediaFallbackPlaceholder() ?? "";
      }

      return resizableImageRequestBuilder({
        baseImageURL: targetImageURL,
        imageResizingProps,
      });
    };

  return (
    <div
      onClick={onClickAction}
      className={cn(
        "relative w-full h-full overflow-hidden shrink-0",
        className
      )}
    >
      <Image
        className="w-full h-full object-cover object-center pointer-events-none"
        src={imageMediaURL()}
        fetchPriority="high"
        priority={priorityLoad}
        loading={priorityLoad ? "eager" : "lazy"}
        alt={"Photo media edge"}
        aria-label={"Photo media edge"}
        onError={() => setMediaLoadErrorDidOccur(true)}
        width={imageWidth}
        height={imageHeight}
        unoptimized
        unselectable="on"
      />

      {/* Overlay gradient */}
      {isOverlayed ? (
        <div
          className="h-full w-full absolute z-1 top-0 hover:opacity-50 transition-all ease-in-out pointer-events-auto"
          style={{
            background: ColorRepository.gradients.post_hero_overlay_gradient,
          }}
        />
      ) : undefined}
    </div>
  );
}
