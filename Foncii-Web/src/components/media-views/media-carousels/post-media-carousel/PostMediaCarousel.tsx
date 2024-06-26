/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { FmUserPost, PostMediaTypes } from "../../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../services/media/service-adapters/cloudStorageServiceAdapter";
import { ResizableImageRequestProps } from "../../../../utilities/tooling/resizableImageRequestBuilder";

// Hooks
import { useState } from "react";

// Components
import PostHeroVideoPlayer from "../../video-players/post-hero-video-player/PostHeroVideoPlayer";
import PostHeroImageView from "../../post-hero-image-view/PostHeroImageView";
import BaseMediaCarousel from "../base-media-carousel/BaseMediaCarousel";
import PostSecondaryImageView from "../../post-secondary-image-view/PostSecondaryImageView";
import PostSecondaryVideoPlayer from "../../video-players/post-secondary-video-player/PostSecondaryVideoPlayer";

// Utilities
import { ClassNameValue } from "tailwind-merge";

export default function PostMediaCarousel({
  post,
  className,
  isOverlayed = false,
  imageResizingProps,
}: {
  post: FmUserPost;
  className?: ClassNameValue;
  /** True to present overlay gradient over the media, false otherwise */
  isOverlayed?: boolean;
  imageResizingProps: ResizableImageRequestProps;
}) {
  // State Management
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Properties
  const postID = post.id,
    totalPages = () => {
      return 1 + secondaryMedia.length;
    };

  // Action Handlers
  function onPageIndexChange(newPageIndex: number) {
    setCurrentPageIndex(newPageIndex);
  }

  // Parsing
  const mainMedia = post.media ?? post.dataSource?.media,
    mainMediaIsVideo = mainMedia?.mediaType == PostMediaTypes.Video,
    // Only fully uploaded secondary media can be displayed, which makes sense because this media is
    // hidden until you click on the detail view + it takes very long to upload everything
    secondaryMedia = post.secondaryMedia ?? [];

  const CarouselContent = (): React.ReactNode => {
    return (
      <>
        {/** Post Hero Goes First */}
        {mainMediaIsVideo ? (
          <PostHeroVideoPlayer
            post={post}
            isOverlayed={false}
            stopPlaybackSignal={currentPageIndex}
          />
        ) : (
          <PostHeroImageView
            post={post}
            isOverlayed={false}
            imageResizingProps={{
              height: 600,
              width: 750,
              fit: MediaServerImageFitParams.cover,
              format: MediaServerImageFormatParams.f3,
            }}
          />
        )}

        {/** Secondary media children follow */}
        {secondaryMedia.map((media, index) => {
          const mediaIsVideo = media.mediaType == PostMediaTypes.Video;

          return mediaIsVideo ? (
            <PostSecondaryVideoPlayer
              carouselIndex={index}
              postID={postID}
              media={media}
              isOverlayed={isOverlayed}
              key={index}
              stopPlaybackSignal={currentPageIndex}
            />
          ) : (
            <PostSecondaryImageView
              media={media}
              isOverlayed={isOverlayed}
              key={index}
              imageResizingProps={imageResizingProps}
            />
          );
        })}
      </>
    );
  };

  return (
    <BaseMediaCarousel
      contentProviderID={post.id}
      totalPages={totalPages()}
      className={className}
      onPageIndexChangeCallback={onPageIndexChange}
    >
      {CarouselContent()}
    </BaseMediaCarousel>
  );
}
