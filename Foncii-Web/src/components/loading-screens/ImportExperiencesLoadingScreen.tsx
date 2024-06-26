/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Framework
import React, { useEffect, useRef, useState } from "react";

// Components
// External
import Image from "next/image";

// Animations
import Lottie from "react-lottie-player";

// Assets
import { ImageRepository } from "../../../public/assets/images/ImageRepository";
import { AnimationRepository } from "../../../public/assets/animations/AnimationRepository";

// Utils
import { cn } from "../../utilities/development/DevUtils";
import { UnitsOfTimeInMS } from "../../utilities/common/time";

// Types
interface ImportExperiencesLoadingScreenProps {
  isLoading: boolean;
  errorDidOccur: boolean;
  className?: string;
}

export default function ImportExperiencesLoadingScreen({
  isLoading,
  errorDidOccur,
  className,
}: ImportExperiencesLoadingScreenProps): React.ReactNode {
  // State Management
  const [elapsedTimeDurationInSeconds, setElapsedTimeDurationInSeconds] =
    useState<number>(0);
  const [didFinish, setDidFinish] = useState<boolean>(false);

  // Loading duration timer
  const elapsedTimeDurationTrackerInterval = useRef<NodeJS.Timeout>();

  // Constants
  const ONE_SECOND_TIME_INTERVAL_MS = UnitsOfTimeInMS.second;

  // Update internal state based on external input
  useEffect(() => {
    if (isLoading && !errorDidOccur) {
      setDidFinish(false);
    } else if (!isLoading && !errorDidOccur) {
      setDidFinish(true);
    }

    // Reset local states on component dismount
    return () => {
      setElapsedTimeDurationInSeconds(0);
      setDidFinish(false);
    };
  }, [isLoading, errorDidOccur]);

  // Update the elapse time every 1000[ms] aka second to reflect the elapsed time via the UI
  useEffect(() => {
    // Don't start the interval timer until loading commences, if loading stops for some reason
    // then the interval also stops
    if (!isLoading || didFinish || errorDidOccur) {
      clearInterval(elapsedTimeDurationTrackerInterval.current);
    } else {
      clearInterval(elapsedTimeDurationTrackerInterval.current);

      elapsedTimeDurationTrackerInterval.current = setInterval(() => {
        // Note: Can't access latest state of global variables from inside this block, access state this way
        setElapsedTimeDurationInSeconds(
          (state) =>
            state + ONE_SECOND_TIME_INTERVAL_MS / UnitsOfTimeInMS.second
        );
      }, ONE_SECOND_TIME_INTERVAL_MS);
    }

    // Remove timer when component dismounts
    return () => {
      clearInterval(elapsedTimeDurationTrackerInterval.current);
      elapsedTimeDurationTrackerInterval.current = undefined;
    };
  }, [isLoading, errorDidOccur, didFinish]);

  // Convenience
  const elapsedTimeDurationInMinutes = () => elapsedTimeDurationInSeconds / 60;

  const currentProgressStatusPrompt = () => {
    if (errorDidOccur) {
      return "Error encountered, try again later";
    } else if (didFinish) {
      return "Finished mapping your experiences";
    } else if (isLoading) {
      return "Mapping your experiences";
    } else {
      return "Awaiting start of experience importation";
    }
  };

  const timeElapsedDescription = () => {
    let formattedTimeDescription = "";

    // Parsing
    const minutesPassed = Math.floor(elapsedTimeDurationInMinutes()),
      secondsPassed = elapsedTimeDurationInSeconds;

    if (minutesPassed >= 1) {
      // Minutes Formatted - 2:30
      const seconds = secondsPassed % 60,
        pluralUnitEnding = minutesPassed > 1;

      if (seconds == 0) {
        // When the time is a solid minute (no trailing seconds) add verbose description - 1 minute or 2 minutes
        formattedTimeDescription = `${minutesPassed} minute${
          pluralUnitEnding ? "s" : ""
        }`;
      } else {
        // When the time has a trailing seconds counter use the less verbose description for the time - 3:10
        // If needed, append 0 digit in front of second counter when below double digits ~ 10+ seconds - 2:09
        formattedTimeDescription = `${minutesPassed}:${
          seconds < 10 ? "0" : ""
        }${seconds}`;
      }
    } else {
      // Seconds Formatted - 2 seconds
      const pluralUnitEnding = secondsPassed > 1;
      formattedTimeDescription = `${secondsPassed} second${
        pluralUnitEnding ? "s" : ""
      }`;
    }

    return `Time elapsed: ${formattedTimeDescription}`;
  };

  // Subcomponents
  const InstagramIcon = () => {
    return (
      <Image
        src={ImageRepository.SocialShareIcons.InstagramSocialShareIcon}
        alt="Instagram Logo"
        className="h-[48px] w-[48px]"
        height={48}
        width={48}
        loading="eager"
        fetchPriority="high"
        unselectable="on"
        unoptimized
      />
    );
  };

  const CheckmarkLottieAnimation = () => {
    return (
      <Lottie
        play={didFinish}
        speed={1}
        loop={false}
        aria-label="Checkmark celebration animation"
        animationData={AnimationRepository.Lottie.CheckmarkCelebrationAnimation}
        style={{ width: 56, height: 56 }}
      />
    );
  };

  const TopGraphic = (): React.ReactNode => {
    return (
      <div className="w-[56px] h-[56px] flex items-center justify-center select-none transition-all ease-in-out">
        {didFinish ? CheckmarkLottieAnimation() : InstagramIcon()}
      </div>
    );
  };

  const ProgressStatusTextLabel = (): React.ReactNode => {
    return (
      <p
        className={cn(
          "flex w-fit select-none h-fit text-center font-medium text-[18px] xl:text-[20px] text-permanent_white text-ellipsis",
          errorDidOccur ? "text-invalid_red" : "text-white"
        )}
      >
        {currentProgressStatusPrompt()}
      </p>
    );
  };

  const ProgressBar = (): React.ReactNode => {
    return (
      <div className="w-full transition-transform ease-in-out shadow-lg">
        <div className="h-[4px] w-full bg-black overflow-hidden">
          <div
            className={cn(
              "w-full h-full bg-permanent_white ease-in-out transition-all shadow-lg",
              didFinish
                ? "translate-x-0 scale-100"
                : "animate-progress origin-left-right"
            )}
          />
        </div>
      </div>
    );
  };

  const ElapsedTimeLabel = (): React.ReactNode => {
    const visible = elapsedTimeDurationInSeconds > 0;

    return (
      <p
        className={cn(
          "select-none text-[12px] xl:text-[14px] text-neutral font-normal text-left w-full h-fit text-ellipsis flex shrink-0 transition-opacity ease-in-out",
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        {timeElapsedDescription()}
      </p>
    );
  };

  return (
    <div
      className={cn(
        "w-[90dvw] xl:w-full h-full flex flex-col items-center justify-center gap-y-[24px]",
        className
      )}
    >
      {TopGraphic()}
      <ProgressStatusTextLabel />

      <div className="flex flex-col items-center justify-center w-[100dvw] max-w-[80dvw] md:max-w-[60dvw] xl:max-w-[375px] h-fit transition-all ease-in-out gap-y-[14px]">
        {ProgressBar()}
        {ElapsedTimeLabel()}
      </div>
    </div>
  );
}
