/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
import React from "react";

// Types
import { FmUserPostMedia } from "../../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Components
// Local
import PostSecondaryImageView from "../../post-secondary-image-view/PostSecondaryImageView";
import BaseVideoPlayer from "../base-video-player/BaseVideoPlayer";

// Managers
import AnalyticsService, {
  AnalyticsEvents,
} from "../../../../services/analytics/analyticsService";

interface PostSecondaryVideoPlayerProps {
  carouselIndex: number;
  postID: string;
  media: FmUserPostMedia;
  isOverlayed?: boolean;
  stopPlaybackSignal?: any;
}

/// Lazy loaded resizable video player for hosting secondary / media child post video media
export default function PostSecondaryVideoPlayer({
  carouselIndex,
  postID,
  media,
  isOverlayed = true,
  stopPlaybackSignal = false,
}: PostSecondaryVideoPlayerProps) {
  // Properties
  const id = `${carouselIndex}-${postID}`,
    videoMediaURL = media?.mediaURL,
    videoMediaThumbnailURL = media?.videoMediaThumbnailURL;

  // Convenience
  const videoMediaAvailable = (): boolean => {
    return videoMediaURL != undefined && videoMediaThumbnailURL != undefined;
  };

  const shouldFallbackToImageView = (): boolean => {
    return !videoMediaAvailable();
  };

  // About Description Generator
  const videoAboutDescription = () => {
    return "Video media child edge";
  };

  // Action Handlers
  const onStartPlaybackHandler = (videoProps: {
    isMuted: boolean;
    isLooping: boolean;
    mediaLoadErrorDidOccur: boolean;
  }) => {
    // Parsing
    const { isMuted, isLooping, mediaLoadErrorDidOccur } = videoProps;

    AnalyticsService.shared.trackGenericEvent(
      AnalyticsEvents.POST_VIDEO_VIEWED,
      {
        carouselIndex,
        postID,
        isMuted,
        isLooping,
        mediaLoadErrorDidOccur,
        videoMediaURL,
        videoMediaThumbnailURL,
      }
    );
  };

  // If the passed post is not classified as a video for some reason,
  // then the simple fallback is the secondary image view.
  return shouldFallbackToImageView() ? (
    <PostSecondaryImageView
      isOverlayed={isOverlayed}
      media={media}
      imageResizingProps={{
        height: 600,
        width: 750,
        fit: MediaServerImageFitParams.cover,
        format: MediaServerImageFormatParams.f3,
      }}
    />
  ) : (
    <BaseVideoPlayer
      id={id}
      media={media!}
      videoAboutDescription={videoAboutDescription()}
      onStartPlayback={onStartPlaybackHandler}
      stopPlaybackSignal={stopPlaybackSignal}
    />
  );
}
