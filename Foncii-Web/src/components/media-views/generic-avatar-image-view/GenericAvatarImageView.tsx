"use client";
// Dependencies
// Hooks
import { useState } from "react";

// Components
// Local
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";

// External
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

// Types
interface GenericAvatarImageViewProps {
  title?: string;
  imageURL: string | undefined;
  altDescription: string | undefined;
  className?: ClassNameValue; // Optional class name to mix with existing top-level component attributes
  withToolTip?: boolean;
  imageResizingProps?: ResizableImageRequestProps;
}

/// Lazy loaded image view for hosting the profile picture of the given user
export default function GenericAvatarImageView({
  title,
  imageURL,
  altDescription = "Avatar Image View",
  className,
  withToolTip = true,
  imageResizingProps,
}: GenericAvatarImageViewProps & React.RefAttributes<HTMLDivElement>) {
  // Media load success state, refreshes this component when updated
  const [mediaLoadErrorDidOccur, setMediaLoadErrorDidOccur] = useState(false);

  // Max Fetched Image Dimensions
  const imageWidth = imageResizingProps?.width ?? 150,
    imageHeight = imageResizingProps?.height ?? 150;

  // Properties
  const avatarImageMediaURL = (): string => {
    if (mediaLoadErrorDidOccur) {
      return mediaFallbackPlaceholder();
    }

    if (imageResizingProps && imageURL) {
      return resizableImageRequestBuilder({
        baseImageURL: imageURL,
        imageResizingProps,
      });
    } else return imageURL ?? mediaFallbackPlaceholder();
  };

  // In case of error, return a placeholder image
  const mediaFallbackPlaceholder = (): any => {
    return ImageRepository.Placeholders.UserProfilePicturePlaceholder;
  };

  return (
    <FonciiToolTip title={withToolTip ? title : undefined}>
      <div
        className={cn(
          "relative h-full w-full rounded-full overflow-hidden transition ease-in-out",
          className
        )}
      >
        <Image
          className="w-full h-full object-cover object-center pointer-events-none overflow-hidden bg-black"
          loading="eager"
          fetchPriority="high"
          src={avatarImageMediaURL()}
          alt={altDescription}
          onError={() => setMediaLoadErrorDidOccur(true)}
          width={imageWidth}
          height={imageHeight}
          unoptimized
          unselectable="on"
        />
      </div>
    </FonciiToolTip>
  );
}
