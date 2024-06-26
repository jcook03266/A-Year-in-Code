"use client";
// Dependencies
// Hooks
import { useState } from "react";

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
  ResizableGoogleImageRequestProps,
  externalResizableImageRequestBuilder,
} from "../../../utilities/tooling/resizableImageRequestBuilder";

/// Lazy loaded image view for hosting a hero image for a target restaurant
export default function RestaurantHeroImageView({
  imageURL,
  secondaryImageURL,
  restaurantName,
  onClickAction = () => {},
  className,
  isOverlayed = true,
  imageResizingProps,
}: {
  imageURL: string | undefined;
  secondaryImageURL?: string | undefined;
  restaurantName: string;
  onClickAction?: () => void;
  className?: ClassNameValue;
  isOverlayed?: boolean;
  imageResizingProps: ResizableGoogleImageRequestProps;
}) {
  // State Management
  const [mediaLoadErrorDidOccur, setMediaLoadErrorDidOccur] = useState(false),
    [secondaryMediaLoadErrorDidOccur, setSecondaryMediaLoadErrorDidOccur] =
      useState(false);

  // Image Dimensions
  const imageWidth = imageResizingProps.width,
    imageHeight = imageResizingProps.height;

  // Restaurant Hero Media alt generation
  const restaurantHeroMediaAltDescription = () => {
    const altDescription = `Hero image of ${restaurantName}`;

    return altDescription;
  };

  /**
   * In case the target media doesn't load, fall back to
   * the placeholder image available here.
   *
   * Please note that excessive errors will cause the site to be killed on mobile
   * handle the image media for this component carefully to prevent this consequence,
   * this fallback is not a solution, it's a last resort.
   */
  const restaurantMediaFallbackPlaceholder = (): string => {
    return ImageRepository.Placeholders.FonciiLogoPostFallback;
  };

  // Parse the best possible image candidate to use as this restaurant's hero
  const heroImageMediaURL = (): string => {
    const restaurantHeroImage = imageURL,
      secondaryRestaurantHeroImage = secondaryImageURL,
      targetHeroImageURL =
        restaurantHeroImage ??
        ImageRepository.Placeholders.FonciiLogoPostFallback;

    // Try to use the original hero image if no error has occurred yet
    if (!mediaLoadErrorDidOccur) {
      if (
        targetHeroImageURL !=
        ImageRepository.Placeholders.FonciiLogoPostFallback
      ) {
        return externalResizableImageRequestBuilder({
          imageURL: targetHeroImageURL,
          imageResizingProps,
        });
      } else {
        return targetHeroImageURL;
      }
    } else if (
      mediaLoadErrorDidOccur &&
      !secondaryMediaLoadErrorDidOccur &&
      secondaryRestaurantHeroImage
    ) {
      // First media failed to load for some reason, use the second media if available
      return externalResizableImageRequestBuilder({
        imageURL: secondaryRestaurantHeroImage,
        imageResizingProps,
      });
    } else {
      // All else failed, use the default placeholder instead
      return restaurantMediaFallbackPlaceholder();
    }
  };

  // Action handlers
  const mediaLoadErrorHandler = () => {
    if (!mediaLoadErrorDidOccur) {
      setMediaLoadErrorDidOccur(true);
    } else {
      // 2 Media load errors occurred (unlikely) fallback to placeholder
      setSecondaryMediaLoadErrorDidOccur(true);
    }
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
        loading="lazy"
        alt={restaurantHeroMediaAltDescription()}
        aria-label={restaurantHeroMediaAltDescription()}
        onError={mediaLoadErrorHandler}
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
