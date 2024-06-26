/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Styling
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Components
// Local
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";
import { ExperienceSections } from "../../../../components/panels/gallery-panel/gallery-contexts/restaurant-entity-collection-context/RestaurantEntityCollectionContext";

// External
import Image from "next/image";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

// Hooks
import { usePathname, useSearchParams } from "next/navigation";
import { useRouteObserver } from "../../../../hooks/UseRouteObserver";
import { useEffect, useState } from "react";
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";

// Redux
import { FonciiUserActions } from "../../../../redux/operations/dispatchers";

// Navigation
import { SharedURLParameters } from "../../../../core-foncii-maps/properties/NavigationProperties";

// Managers
import UserManager from "../../../../managers/userManager";

// Types
interface PostCreationButtonProps {
  className?: ClassNameValue;
}

export default function PostCreationButton({
  className,
}: PostCreationButtonProps) {
  // Routing
  const pathname = usePathname();
  const routerSearchParams = useRouterSearchParams();
  const searchParams = useSearchParams();

  // Observers
  const routeObserver = useRouteObserver();

  // Convenience
  const shouldBeDisplayed = (): boolean => {
    const currentGallerySection = Number(
        searchParams.get(SharedURLParameters.gallerySection)
      ),
      // Note: Undefined == the user hasn't changed from the default section yet (default section is `my experiences` tab)
      myExperienceSectionBeingDisplayed =
        currentGallerySection == ExperienceSections.myExperiences ||
        currentGallerySection == undefined;

    return (
      UserManager.shared.userAuthenticated() &&
      routeObserver.isGalleryBeingViewedByAuthor() &&
      !routeObserver.postDetailViewActive() &&
      !routeObserver.restaurantDetailViewActive() &&
      myExperienceSectionBeingDisplayed
    );
  };

  // State Management
  const [isBeingDisplayed, setIsBeingDisplayed] = useState(shouldBeDisplayed());

  // Force this component to re-render when the pathname changes in order to display itself conditionally
  useEffect(() => {
    setIsBeingDisplayed(shouldBeDisplayed());
  }, [pathname, location.pathname, searchParams]);

  // Assets
  const icon = ImageRepository.UtilityIcons.PostCreationPlusSignIcon;

  // Actions
  const createNewPost = async () => {
    const newPost = await FonciiUserActions.createNewUserPost(),
      newPostID = newPost?.id,
      username = UserManager.shared.currentUser()?.username;

    // Present the newly created post to the user with edit access requested
    if (newPost && newPostID && username) {
      routerSearchParams.setParams({
        [SharedURLParameters.detailViewForPost]: newPostID,
        [SharedURLParameters.isEditingPost]: true,
      });
    }
  };

  return (
    <FonciiToolTip title={"Add a new experience"}>
      <button
        onClick={createNewPost}
        className={cn(
          `flex items-center justify-center h-[40px] w-[40px] bg-primary rounded-full transition-all ease-in-out duration-300 active:scale-90 hover:scale-105 hover:opacity-75 shadow-2xl`,
          className,
          isBeingDisplayed ? "" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Image
          className="h-[20px] w-[20px]"
          src={icon}
          alt="Post Creation Button Icon"
        />
      </button>
    </FonciiToolTip>
  );
}
