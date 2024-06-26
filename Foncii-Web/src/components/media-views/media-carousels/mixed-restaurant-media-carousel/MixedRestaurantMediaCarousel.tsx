/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { FmUserPost, Restaurant } from "../../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Hooks
import { useState } from "react";

// Components
import RestaurantHeroImageView from "../../restaurant-hero-image-view/RestaurantHeroImageView";
import PostHeroVideoPlayer from "../../video-players/post-hero-video-player/PostHeroVideoPlayer";
import PostHeroImageView from "../../post-hero-image-view/PostHeroImageView";
import BaseMediaCarousel from "../base-media-carousel/BaseMediaCarousel";

// Utilities
import { ClassNameValue } from "tailwind-merge";

export default function MixedRestaurantMediaCarousel({
  restaurant,
  influencerInsightEdges = [],
  excludeMainRestaurantMedia = false,
  className,
}: {
  restaurant: Restaurant;
  influencerInsightEdges?: FmUserPost[];
  excludeMainRestaurantMedia?: boolean;
  className: ClassNameValue;
}) {
  // State Management
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Properties
  const totalPages = () => {
    // +1 for the main hero image URL
    return (
      (excludeMainRestaurantMedia ? 0 : restaurantMediaEdges.length + 1) +
      influencerInsightEdges.length
    );
  };

  // Action Handlers
  function onPageIndexChange(newPageIndex: number) {
    setCurrentPageIndex(newPageIndex);
  }

  // Parsing
  // Non-hero images for the restaurant
  const restaurantHeroImageURL = restaurant.heroImageURL ?? undefined,
    // Don't show the hero image twice, hero image may be in the collection since google is a fallback in case Yelp doesn't have a hero
    restaurantMediaEdges = (restaurant.imageCollectionURLs ?? []).filter(
      (imageURL) => imageURL != restaurantHeroImageURL
    ),
    restaurantID = restaurant.id,
    restaurantName = restaurant.name;

  const CarouselContent = (): React.ReactNode => {
    return (
      <>
        {/** Restaurant Hero Goes First */}
        {excludeMainRestaurantMedia ? undefined : (
          <RestaurantHeroImageView
            imageURL={restaurantHeroImageURL}
            secondaryImageURL={restaurantMediaEdges[0]}
            restaurantName={restaurantName}
            key={restaurantID}
            isOverlayed={false}
            imageResizingProps={{
              height: 600,
              width: 750,
            }}
          />
        )}
        {/** Influencer Insights Follow After */}
        {influencerInsightEdges.map((post, index) => {
          return post.mediaIsVideo ? (
            <PostHeroVideoPlayer
              post={post}
              isOverlayed={false}
              key={index}
              stopPlaybackSignal={currentPageIndex}
            />
          ) : (
            <PostHeroImageView
              post={post}
              isOverlayed={false}
              key={index}
              imageResizingProps={{
                height: 600,
                width: 750,
                fit: MediaServerImageFitParams.cover,
                format: MediaServerImageFormatParams.f3,
              }}
            />
          );
        })}

        {/** Any other restaurant image media from external sources presented after the rest of the important content */}
        {excludeMainRestaurantMedia
          ? undefined
          : restaurantMediaEdges.map((imageURL, index) => {
            return (
              <RestaurantHeroImageView
                imageURL={imageURL}
                secondaryImageURL={restaurantMediaEdges[0]}
                restaurantName={restaurantName}
                key={index}
                isOverlayed={false}
                imageResizingProps={{
                  height: 600,
                  width: 750,
                }}
              />
            );
          })}
      </>
    );
  };

  return (
    <BaseMediaCarousel
      contentProviderID={restaurant.id}
      totalPages={totalPages()}
      className={className}
      onPageIndexChangeCallback={onPageIndexChange}
    >
      {CarouselContent()}
    </BaseMediaCarousel>
  );
}
