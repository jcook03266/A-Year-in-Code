/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
import React from "react";

// Types
import { FmUserPost } from "../../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Components
// Local
import PostHeroImageView from "../../post-hero-image-view/PostHeroImageView";
import BaseVideoPlayer from "../base-video-player/BaseVideoPlayer";

// Managers
import AnalyticsService, {
  AnalyticsEvents,
} from "../../../../services/analytics/analyticsService";

interface PostHeroVideoPlayerProps {
  post: FmUserPost;
  isOverlayed?: boolean;
  /**
   * Optional signal to send from parent component to force playback to stop.
   * This can be any value, the only thing that matters is when the value changes
   * the playback of this component is halted via a use effect dependency cycle.
   */
  stopPlaybackSignal?: any;
}

/// Lazy loaded resizable video player for hosting primary / hero post video media
export default function PostHeroVideoPlayer({
  post,
  isOverlayed = true,
  stopPlaybackSignal = false,
}: PostHeroVideoPlayerProps) {
  // Properties
  const postID = post.id,
    media = post.media ?? post.dataSource?.media ?? undefined,
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
    let aboutDescription = "";

    // Parse post and creator details
    const restaurant = post.restaurant,
      creator = post.creator,
      restaurantName = restaurant?.name,
      creatorUsername = creator.username;

    aboutDescription += `Video of ${creatorUsername}'s experience`;

    // Include restaurant metadata if it exists
    if (restaurant) {
      aboutDescription += " ";
      aboutDescription += `about ${restaurantName}`;
    }

    return aboutDescription;
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
  // then the simple fallback is the hero image view.
  return shouldFallbackToImageView() ? (
    <PostHeroImageView
      isOverlayed={isOverlayed}
      post={post}
      imageResizingProps={{
        height: 600,
        width: 750,
        fit: MediaServerImageFitParams.cover,
        format: MediaServerImageFormatParams.f3,
      }}
    />
  ) : (
    <BaseVideoPlayer
      id={postID}
      media={media!}
      videoAboutDescription={videoAboutDescription()}
      onStartPlayback={onStartPlaybackHandler}
      stopPlaybackSignal={stopPlaybackSignal}
    />
  );
}
