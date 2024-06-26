/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
import React, { useEffect, useRef, useState } from "react";

// Types
import { FmUserPostMedia } from "../../../../__generated__/graphql";

// Components
// Local
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Utilities
import { delay } from "../../../../utilities/common/scheduling";

interface BaseVideoPlayerProps {
  id: string;
  media?: FmUserPostMedia;
  videoAboutDescription?: string;
  onStartPlayback?: (videoProps: {
    isMuted: boolean;
    isLooping: boolean;
    mediaLoadErrorDidOccur: boolean;
  }) => void;
  /**
   * Optional signal to send from parent component to force playback to stop.
   * This can be any value, the only thing that matters is when the value changes
   * the playback of this component is halted via a use effect dependency cycle.
   */
  stopPlaybackSignal?: any;
}

export default function BaseVideoPlayer({
  id,
  media,
  videoAboutDescription = "",
  onStartPlayback,
  stopPlaybackSignal = false,
}: BaseVideoPlayerProps) {
  // State Management
  // Loading
  const [mediaLoadErrorDidOccur, setMediaLoadErrorDidOccur] = useState(false),
    [videoPlaybackInProgress, setVideoPlaybackInProgress] = useState(false), // A video is currently playing and hasn't ended yet, loops skip over this don't worry
    [focused, setFocused] = useState(false), // Transient state toggled when the user plays the video, toggles back to its original state after some timeout
    // Playback State
    [isPlaying, setIsPlaying] = useState(false),
    // Playback Props
    [isMuted, setIsMuted] = useState(false),
    [isLooping, setIsLooping] = useState(true);

  // Pause any in-progress playback when the signal is received
  useEffect(() => {
    pauseVideo();
  }, [stopPlaybackSignal]);

  // UI State
  const autoTimeOutDuration = 2000; // ~ 2 Seconds

  // Element Reference
  const videoElementRef = useRef<HTMLVideoElement>(null);

  // Properties
  const videoID = `video-${id}`,
    videoMediaURL = media?.mediaURL,
    videoMediaThumbnailURL = media?.videoMediaThumbnailURL;

  // Video Dimensions
  const videoWidth = 1920,
    videoHeight = 1080;

  // Convenience
  const videoMediaAvailable = (): boolean => {
    return videoMediaURL != undefined && videoMediaThumbnailURL != undefined;
  };

  const shouldShowControlsUI = (): boolean => {
    return !isPlaying && !focused;
  };

  // Action Handlers
  const onFocusHandler = (): void => {
    setFocused(true);

    delay(() => {
      setFocused(false);
    }, autoTimeOutDuration);
  };

  const onVideoEndHandler = (): void => {
    setIsPlaying(false);
    setFocused(false);
    setVideoPlaybackInProgress(false);

    // Resign any full screen state
    document.exitFullscreen();
  };

  // Playback Logic
  const pauseVideo = () => {
    const videoElement = videoElementRef.current;

    // Pause any in progress video
    if (videoElement) videoElement.pause();
    setIsPlaying(false);
  };

  const startVideo = () => {
    const videoElement = videoElementRef.current;

    if (videoElement)
      // Try to initiate playback, and catch any errors that may come up
      videoElement
        .play()
        .then(() => {
          // Track playback iterations
          // Note: Playbacks must be started and completed first before more playbacks can be tracked
          if (!videoPlaybackInProgress) {
            onStartPlayback?.({
              isMuted,
              isLooping,
              mediaLoadErrorDidOccur,
            });
          }

          // Playback successfully started
          setIsPlaying(true);
          setVideoPlaybackInProgress(true);
          onFocusHandler();
        })
        .catch((error) => {
          // Playback failed
          console.error(
            "Error encountered while trying to initiate video playback",
            error
          );

          // Stop any playback state
          setIsPlaying(false);
        });
  };

  const togglePlayback = async (): Promise<void> => {
    const videoElement = videoElementRef.current;

    if (videoElement) isPlaying ? pauseVideo() : startVideo();
  };

  // Video Properties Control
  const requestFullScreenModeAction = (): void => {
    if (!videoElementRef.current) return;

    // Request fullscreen if available
    if (videoElementRef.current.requestFullscreen) {
      videoElementRef.current.requestFullscreen();
    }
  };

  const toggleVideoAudio = (): void => {
    setIsMuted((state) => !state);
  };

  const toggleVideoLoop = (): void => {
    setIsLooping((state) => !state);
  };

  // Subcomponents
  const FullScreenButton = (): React.ReactNode => {
    const icon = ImageRepository.UtilityIcons.FullScreenIcon;

    return SecondaryControlButton(
      icon,
      requestFullScreenModeAction,
      "Full-screen mode"
    );
  };

  const MuteButton = (): React.ReactNode => {
    const volumeOnIcon = ImageRepository.UtilityIcons.VolumeMax,
      volumeOffIcon = ImageRepository.UtilityIcons.Mute,
      currentIcon = isMuted ? volumeOffIcon : volumeOnIcon;

    return SecondaryControlButton(
      currentIcon,
      toggleVideoAudio,
      isMuted ? "Unmute" : "Mute"
    );
  };

  const LoopToggleButton = (): React.ReactNode => {
    const singlePlaythroughIcon = ImageRepository.UtilityIcons.PlaybackIcon,
      loopPlaythroughIcon = ImageRepository.UtilityIcons.LoopArrowIcon,
      currentIcon = isLooping ? loopPlaythroughIcon : singlePlaythroughIcon;

    return SecondaryControlButton(
      currentIcon,
      toggleVideoLoop,
      isLooping ? "Play once" : "Loop video"
    );
  };

  const PlaybackToggleButton = (): React.ReactNode => {
    const playIcon = ImageRepository.UtilityIcons.PlayIcon,
      pauseIcon = ImageRepository.UtilityIcons.PauseIcon,
      currentIcon = isPlaying ? pauseIcon : playIcon;

    return SecondaryControlButton(
      currentIcon,
      togglePlayback,
      `${isPlaying ? "Pause" : "Play"}`
    );
  };

  const SecondaryControlButton = (
    icon: any,
    onClick: () => void,
    title: string
  ): React.ReactNode => {
    return (
      <FonciiToolTip title={title}>
        <button
          className="pointer-events-auto items-center justify-center flex w-fit h-fit hover:opacity-50 transition-all ease-in-out active:animate-pulse"
          onClick={onClick}
          aria-label={`${title} button`}
        >
          <Image
            className="w-fit h-[16px]"
            src={icon}
            loading="eager"
            alt={`${title} button`}
          />
        </button>
      </FonciiToolTip>
    );
  };

  const FixedPlaybackToggleButton = (): React.ReactNode => {
    const playIcon = ImageRepository.UtilityIcons.PlayIcon,
      pauseIcon = ImageRepository.UtilityIcons.PauseIcon,
      currentIcon = isPlaying ? pauseIcon : playIcon;

    const toolTip = `${isPlaying ? "Pause" : "Play"}`;

    /** Playback button circumscribed in an opaque circular container */
    return (
      <button
        className="top-[50%] relative active:animate-pulse transition-all ease-in-out duration-300 pointer-events-auto flex w-[40px] h-[40px] p-[10px] bg-opacity-50 hover:opacity-50 rounded-full bg-medium_dark_grey border-[1px] border-neutral m-auto"
        onClick={togglePlayback}
        aria-label="Video playback button"
      >
        <Image
          className="w-full h-full"
          src={currentIcon}
          loading="eager"
          alt={`${toolTip} button icon`}
        />
      </button>
    );
  };

  const VideoControlsOverlay = (): React.ReactNode => {
    return (
      <div
        className={`absolute w-full h-full z-1 top-0 transition-all ease-in-out ${
          shouldShowControlsUI() ? "opacity-100" : "opacity-0 hover:opacity-50"
        }`}
      >
        {/** Fixed Playback Control*/}
        <div className="absolute w-full h-full pointer-events-none">
          {FixedPlaybackToggleButton()}
        </div>
        {/** Fixed Playback Control*/}

        {/** Bottom Section */}
        <div className="flex flex-col w-full h-full absolute pointer-events-none">
          <div className="flex flex-row w-full mt-auto gap-x-[20px] h-fit items-center justify-start bottom-0 p-[20px]">
            {PlaybackToggleButton()}
            {MuteButton()}
            {LoopToggleButton()}
            {FullScreenButton()}
          </div>
        </div>
        {/** Bottom Section */}
      </div>
    );
  };

  return videoMediaAvailable() ? (
    <div className="relative w-full h-full overflow-hidden bg-permanent_black hover:bg-opacity-50 transition-all ease-in-out shrink-0">
      <video
        id={videoID}
        preload="metadata" // Don't load the entire video
        src={videoMediaURL!}
        onError={() => {
          setMediaLoadErrorDidOccur(true);
          setIsPlaying(false);
        }}
        about={videoAboutDescription}
        aria-label={videoAboutDescription}
        width={videoWidth}
        height={videoHeight}
        poster={videoMediaThumbnailURL!}
        ref={videoElementRef}
        playsInline // Don't auto expand on mobile & disable webkit UI controls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onVideoEndHandler}
        onClick={togglePlayback}
        muted={isMuted}
        loop={isLooping}
        controls={false}
        className={`justify-center items-center font-normal text-[14px] text-invalid_red text-center cursor-pointer h-full w-full transition-all ease-in-out ${
          videoPlaybackInProgress ? "object-contain" : "object-cover"
        }`}
      >
        Your Browser Does Not Support Video.
      </video>

      {/* Overlay gradient */}
      {VideoControlsOverlay()}
    </div>
  ) : undefined;
}
