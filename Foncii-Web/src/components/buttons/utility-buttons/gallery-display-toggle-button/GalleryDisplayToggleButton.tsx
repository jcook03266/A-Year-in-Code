/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Hooks
import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";
import { useRouteObserver } from "../../../../hooks/UseRouteObserver";

// URL State Persistence
import { SharedURLParameters } from "../../../../core-foncii-maps/properties/NavigationProperties";

// Components
// Local
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";
import { ExperienceSections } from "../../../../components/panels/gallery-panel/gallery-contexts/restaurant-entity-collection-context/RestaurantEntityCollectionContext";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

// Animation
import { AnimatePresence, motion } from "framer-motion";

// Types
interface GalleryDisplayToggleButtonProps {
  className?: ClassNameValue;
}

export default function GalleryDisplayToggleButton({
  className,
}: GalleryDisplayToggleButtonProps) {
  // URL-State Persistence
  const searchParams = useSearchParams();
  const routerSearchParams = useRouterSearchParams();

  // Observers
  const routeObserver = useRouteObserver();

  // State Management
  // Refresh when search params change
  useEffect(() => {}, [
    searchParams.get(SharedURLParameters.galleryListFormatToggled),
  ]);

  // Properties
  const isListViewGalleryActive = (): boolean => {
    return (
      String(
        routerSearchParams.getParamValue(
          SharedURLParameters.galleryListFormatToggled
        )
      ) == "true"
    );
  };

  // Dynamic Text
  const switchToPrompt = isListViewGalleryActive() ? "Map" : "List";

  // Actions
  const toggleGalleryListFormat = () => {
    routerSearchParams.toggleParam(
      SharedURLParameters.galleryListFormatToggled,
      true
    );
  };

  // Convenience
  const shouldBeDisplayed = (): boolean => {
    const currentGallerySection = Number(
        searchParams.get(SharedURLParameters.gallerySection)
      ),
      analyticsSectionBeingDisplayed =
        currentGallerySection == ExperienceSections.experienceAnalytics;

    return (
      routeObserver.explorePageActive() ||
      (routeObserver.galleryPageActive() && !analyticsSectionBeingDisplayed)
    );
  };

  // Subcomponents
  const IconImageView = (): React.ReactNode => {
    const icon = isListViewGalleryActive()
      ? ImageRepository.UtilityIcons.MapIcon
      : ImageRepository.UtilityIcons.ListIcon;

    return (
      <Image
        className="h-[24px] w-[24px]"
        src={icon}
        alt="Gallery display toggle button icon"
      />
    );
  };

  return (
    <AnimatePresence>
      <FonciiToolTip title={`Switch to ${switchToPrompt} View`}>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "hover:opacity-50 active:scale-90 shadow-xl h-fit w-fit p-[6px] rounded-full xl:rounded-[16px] xl:py-[4px] xl:px-[24px] flex flex-row items-center justify-center gap-x-[8px] pointer-events-auto bg-primary transition-all ease-in-out duration-300",
            isListViewGalleryActive()
              ? "rounded-[16px] py-[4px] px-[24px]"
              : "",
            shouldBeDisplayed() ? "" : "scale-0 opacity-0 pointer-events-none",
            className
          )}
          onClick={toggleGalleryListFormat}
        >
          {IconImageView()}
          <p
            className={cn(
              "text-permanent_white font-normal text-[16px] shrink-0 h-fit w-fit hidden xl:block",
              isListViewGalleryActive() ? "block" : ""
            )}
          >
            {switchToPrompt}
          </p>
        </motion.button>
      </FonciiToolTip>
    </AnimatePresence>
  );
}
