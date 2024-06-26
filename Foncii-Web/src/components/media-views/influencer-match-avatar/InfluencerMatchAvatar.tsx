// Dependencies
// Types
import { FmUser } from "../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Components
// Local
import PercentMatchLabel from "../../../components/labels/percent-match-label/PercentMatchLabel";
import Skeleton from "../../../components/utility-components/skeleton/Skeleton";

// External
import Image from "next/image";

// Formatting
import { possessiveFormattedUsernameCopy } from "../../../utilities/formatting/textContentFormatting";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Hooks
import { useState } from "react";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";
import { resizableImageRequestBuilder } from "../../../utilities/tooling/resizableImageRequestBuilder";

interface InfluencerMatchAvatarProps {
  user?: FmUser;
  percentMatchScore?: number; // Pass in a valid user to user taste profile percent match score to display it via this avatar
  className?: ClassNameValue;
}

export default function InfluencerMatchAvatar({
  user,
  percentMatchScore,
  className,
}: InfluencerMatchAvatarProps) {
  // State Management
  const [mediaLoadErrorDidOccur, setMediaLoadErrorDidOccur] = useState(false);

  // Parsing
  const username = user?.username,
    imageURL = user?.profilePictureURL;

  // Max Fetched Image Dimensions
  const imageWidth = 150,
    imageHeight = 150;

  // Properties
  const avatarImageMediaURL = (): string => {
    // Fallback to a known image if the target media fails to load
    if (mediaLoadErrorDidOccur) {
      return mediaFallbackPlaceholder();
    }

    if (imageURL) {
      return resizableImageRequestBuilder({
        baseImageURL: imageURL,
        imageResizingProps: {
          height: imageHeight,
          width: imageWidth,
          fit: MediaServerImageFitParams.cover,
          format: MediaServerImageFormatParams.f3,
        },
      });
    } else return mediaFallbackPlaceholder();
  };

  // In case of error, return a placeholder image
  const mediaFallbackPlaceholder = (): any => {
    return ImageRepository.Placeholders.FonciiLogoPostFallback;
  };

  // Convenience
  // Image alt description generation
  const avatarImageAltDescription = () => {
    return `${possessiveFormattedUsernameCopy(username)} profile picture`;
  };

  // Subcomponents
  const AvatarImageView = (): React.ReactNode => {
    const className = cn(
      "flex h-full w-full overflow-hidden shrink-0 rounded-[10px]"
    );

    return user ? (
      <Image
        src={avatarImageMediaURL()}
        height={imageHeight}
        width={imageWidth}
        className={cn("bg-black object-cover object-top", className)}
        onError={() => setMediaLoadErrorDidOccur(true)}
        alt={avatarImageAltDescription()}
        unoptimized
      />
    ) : (
      <Skeleton className={className} />
    );
  };

  return (
    <div
      className={cn(
        "relative h-[58px] w-[58px] md:h-[72px] md:w-[72px] shrink-0",
        className
      )}
    >
      <span className="absolute z-0 w-full h-full">{AvatarImageView()}</span>

      {/** Percent match score fixed to the top right of the avatar if the percent match score is available / given */}
      <span className="absolute translate-x-[10px] translate-y-[-4px] top-0 right-0 z-[1]">
        <PercentMatchLabel percentMatchScore={percentMatchScore} />
      </span>
    </div>
  );
}
