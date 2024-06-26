"use client";
// Dependencies
import { useState } from "react";

// Types
import { FmUserPost } from "../../../__generated__/graphql";

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
  externalResizableImageRequestBuilder,
  resizableImageRequestBuilder,
} from "../../../utilities/tooling/resizableImageRequestBuilder";

interface PostHeroImageViewProps {
  post: FmUserPost;
  isOverlayed?: boolean;
  onClickAction?: () => void;
  className?: ClassNameValue;
  imageResizingProps: ResizableImageRequestProps;
  priorityLoad?: boolean;
}

/// Lazy loaded image view for hosting the hero image of a target post
export default function PostHeroImageView({
  post,
  isOverlayed = true,
  onClickAction = () => {},
  className,
  imageResizingProps,
  priorityLoad = true,
}: PostHeroImageViewProps) {
  // State Management
  const [mediaLoadErrorDidOccur, setMediaLoadErrorDidOccur] = useState(false);

  // Properties
  const imageWidth = imageResizingProps.width,
    imageHeight = imageResizingProps.height;

  // Post hero media alt text generation
  const postHeroMediaAltDescription = () => {
    let altDescription = "";

    // Parse post and creator details
    const restaurant = post.restaurant,
      creator = post.creator,
      restaurantName = restaurant?.name,
      isPostAVideo = post.mediaIsVideo ?? false,
      creatorUsername = creator.username;

    altDescription += `A ${
      isPostAVideo ? "video" : "photo"
    } of ${creatorUsername}'s experience`;

    // Include restaurant metadata if it exists
    if (restaurant) {
      altDescription += " ";
      altDescription += `about ${restaurantName}`;
    }

    return altDescription;
  };

  /**
   * In case the target media doesn't load, fall back to the
   * restaurant's own hero image (if restaurant is defined),
   * if none then the placeholder is the final fallback and it's available here.
   *
   * Please note that excessive errors will cause the site to be killed on mobile
   * handle the image media for this component carefully to prevent this consequence,
   * this fallback is not a solution, it's a last resort.
   */
  const postMediaFallbackPlaceholder = (): any => {
    return ImageRepository.Placeholders.FonciiLogoPostFallback;
  };

  // Parse the best possible image candidate to use as this post's hero
  const heroImageMediaURL = (): string => {
    const postMediaIsAVideo = post.mediaIsVideo,
      postMediaHasBeenUploaded = post.media != undefined,
      restaurantHeroImage = post.restaurant?.heroImageURL,
      restaurantSecondaryHeroImage = post.restaurant?.imageCollectionURLs?.[0],
      restaurantFallbacks = restaurantHeroImage ?? restaurantSecondaryHeroImage,
      fallbacks =
        restaurantFallbacks ??
        ImageRepository.Placeholders.FonciiLogoPostFallback,
      fonciiMediaURL = post.media?.mediaURL,
      fonciiVideoMediaThumbnailURL = post.media?.videoMediaThumbnailURL,
      postDataSourceMediaURL = post.dataSource?.media?.mediaURL,
      postDataSourceVideoMediaThumbnailURL =
        post.dataSource?.media?.videoMediaThumbnailURL,
      videoMediaThumbnail = postMediaHasBeenUploaded
        ? fonciiVideoMediaThumbnailURL ?? fallbacks
        : postDataSourceVideoMediaThumbnailURL ?? fallbacks, // Fall-back if no images available | Post media -> restaurant hero -> restaurant secondary hero -> fallback place holder
      imageMedia = postMediaHasBeenUploaded
        ? fonciiMediaURL ?? fallbacks
        : postDataSourceMediaURL ?? fallbacks;

    // Fallback / default is the data source's original media URL
    let targetHeroImageURL: string = "";

    if (postMediaIsAVideo) {
      targetHeroImageURL = videoMediaThumbnail;
    } else {
      targetHeroImageURL = imageMedia;
    }

    // Fallback to a known image if the target media fails to load
    if (mediaLoadErrorDidOccur) {
      return postMediaFallbackPlaceholder() ?? "";
    }

    if (
      targetHeroImageURL != ImageRepository.Placeholders.FonciiLogoPostFallback
    ) {
      if (postMediaHasBeenUploaded) {
        // Uploaded post media
        return resizableImageRequestBuilder({
          baseImageURL: targetHeroImageURL,
          imageResizingProps,
        });
      } else if (!postDataSourceMediaURL) {
        // Yelp or Google restaurant hero image as content rich fallback placeholder when media is
        // not available (from data source aka nothing was uploaded and nothing is pending)
        return externalResizableImageRequestBuilder({
          imageURL: targetHeroImageURL,
          imageResizingProps,
        });
      }
    }

    // Pending uploaded media from data source, or generic fallback placeholder if all else fails
    return targetHeroImageURL;
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
        src={heroImageMediaURL()}
        fetchPriority="high"
        priority={priorityLoad}
        loading={priorityLoad ? "eager" : "lazy"}
        alt={postHeroMediaAltDescription()}
        aria-label={postHeroMediaAltDescription()}
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
