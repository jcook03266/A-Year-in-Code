/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { FmUserPost } from "../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Components
// Local
import PostHeroImageView from "../../media-views/post-hero-image-view/PostHeroImageView";
import UserAvatarImageView from "../../media-views/user-avatar-image-view/UserAvatarImageView";
import RestaurantRatingLabel from "../../labels/restaurant-rating-label/RestaurantRatingLabel";
import PercentMatchLabel from "../../labels/percent-match-label/PercentMatchLabel";
import RestaurantPublicationRecognitionLabel from "../../labels/restaurant-publication-recognition-label/RestaurantPublicationRecognitionLabel";
import { PostSourcePermaLink } from "../../buttons/restaurant-entity-buttons/post-source-permalink/PostSourcePermaLink";
import {
  RestaurantNameLabel,
  RestaurantPropertiesSection,
} from "../shared-card-subcomponents/SharedCardSubcomponents";
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";
import { SaveRestaurantButton } from "../../../components/buttons/restaurant-entity-buttons/save-restaurant-button/SaveRestaurantButton";

// External
import Link from "next/link";
import Image from "next/image";

// URL State Persistence
import {
  NavigationProperties,
  SharedURLParameters,
} from "../../../core-foncii-maps/properties/NavigationProperties";

// Hooks
import React, { useEffect, useState } from "react";
import { useRouterSearchParams } from "../../../hooks/UseRouterSearchParamsHook";
import { useRouteObserver } from "../../../hooks/UseRouteObserver";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Redux
import { getFonciiRestaurantsSlice, getFonciiUserSlice, getPostFiltersSlice } from "../../../redux/operations/selectors";

// Services
import AnalyticsService, { AnalyticsEvents } from "../../../services/analytics/analyticsService";

// Managers
import UserManager from "../../../managers/userManager";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";
import { getSnapedStringTimeFromNow } from "../../../utilities/common/time";

interface GalleryPostCardProps {
  post: FmUserPost;
  onClickAction?: () => void;
  virtualized?: boolean;
  className?: ClassNameValue;
  disableSaveRestaurantButton?: boolean;
  doubleClickToOpenDetail?: boolean;
  includeHeader?: boolean;
  /** If this view event was from a restaurant */
  sourceFonciiRestaurantID?: string;
  /** If this view event was from another user post */
  sourcePostID?: string;
}

export default function GalleryPostCard({
  post,
  onClickAction,
  virtualized = false,
  className,
  disableSaveRestaurantButton = false,
  doubleClickToOpenDetail = false,
  includeHeader = false,
  sourceFonciiRestaurantID,
  sourcePostID
}: GalleryPostCardProps) {
  // Parse Post Information
  const restaurant = post.restaurant ?? undefined,
    postID = post.id,
    // Foncii Restaurant Data
    fonciiRestaurant = post.fonciiRestaurant,
    restaurantID = restaurant?.id,
    percentMatchScore = fonciiRestaurant?.percentMatchScore ?? undefined,
    qualityScore = fonciiRestaurant?.qualityScore,
    // Post Metadata
    creator = post.creator ?? undefined,
    creatorID = creator.id,
    creatorUsername = creator?.username,
    favorited = post.isFavorited,
    // Custom User Properties
    customUserProps = post.customUserProperties,
    // Ratings
    creatorRating = customUserProps.rating ?? undefined,
    googleRating = restaurant?.googleProperties?.rating ?? undefined,
    yelpRating = restaurant?.yelpProperties?.rating ?? undefined;

  // State Management
  const routerSearchParams = useRouterSearchParams();

  // Routing
  const routeObserver = useRouteObserver();

  // Redux
  const fonciiRestaurantState = getFonciiRestaurantsSlice()();
  const fonciiUserState = getFonciiUserSlice()();
  const filters = getPostFiltersSlice()();

  // Selection State
  const determineIfPostIsSelected = (): boolean => {
    return postID == filters.currentlySelectedPostID;
  };

  const [isSelected, setIsSelected] = useState<boolean>(
    determineIfPostIsSelected()
  );

  // Update selection state based on URL persistence
  useEffect(() => {
    setIsSelected(determineIfPostIsSelected());
  }, [filters.currentlySelectedPostID]);

  // Convenience
  const isUserAuthorizedToEditPost = (): boolean => {
    return creator.id == UserManager.shared.currentUser()?.id;
  };

  const authorGalleryActive = (): boolean => {
    return routeObserver.isGalleryBeingViewedByAuthor();
  };

  // Actions
  /// Toggles the detail view for the given post with its URL state parameter
  const openViewerDetailViewNavigationAction = (): void => {
    // Only open the detail view when this entity is selected
    if (isSelected || !doubleClickToOpenDetail) {
      // Can't open up the detail view as a viewer if there's no restaurant associated with it, default to the editor navigation action
      if (!restaurant) {
        openEditorDetailViewNavigationAction();
      } else {
        // Used when navigating on the same path (explore or gallery) to remove conflicting properties
        routerSearchParams.setParams({
          [SharedURLParameters.detailViewForRestaurant]: undefined,
          [SharedURLParameters.selectedPost]: postID,
          [SharedURLParameters.detailViewForPost]: postID,
          [SharedURLParameters.isEditingPost]: undefined,
        });
      }
    }

    // Analytics
    AnalyticsService.shared.trackGenericEvent(
      AnalyticsEvents.POST_DETAIL_VIEW_OPENED,
      {
        postID,
        origin: location.pathname,
      }
    );

    // Only visitors clicks can be tracked, authors can't contribute
    // to their own metrics.
    if (
      !isUserAuthorizedToEditPost()
      && restaurantID
      && qualityScore
    ) {
      AnalyticsService.shared
        .trackPostClick({
          autoCompleteQuery: fonciiRestaurantState.searchQuery,
          fonciiRestaurantID: restaurantID,
          qualityScore,
          sourceFonciiRestaurantID,
          sourcePostID,
          authorUID: creatorID,
          postID: postID
        });
    }

    // Trigger any external logic (this triggers the selection state)
    onClickAction?.();
  };

  const openEditorDetailViewNavigationAction = (): void => {
    if (!isUserAuthorizedToEditPost()) return;

    routerSearchParams.setParams({
      [SharedURLParameters.detailViewForRestaurant]: undefined,
      [SharedURLParameters.selectedPost]: postID,
      [SharedURLParameters.detailViewForPost]: postID,
      [SharedURLParameters.isEditingPost]: true,
    });
  };

  // Dynamic Links for SEO
  const postDetailViewPageLink = (): string => {
    return NavigationProperties.galleryPostDetailViewPageLink(
      creatorUsername,
      postID,
      false
    );
  };

  // Subcomponents
  const EditPostButton = (): React.ReactNode => {
    if (!isUserAuthorizedToEditPost() && !authorGalleryActive()) return;

    const icon = ImageRepository.UtilityIcons.EditPostIcon;

    return (
      <FonciiToolTip title="Edit this experience">
        <button
          className="flex items-center justify-center w-fit h-fit ease-in-out transition-transform active:scale-90 hover:opacity-75 mb-1"
          onClick={openEditorDetailViewNavigationAction}
        >
          <Image
            className="w-[24px] h-[24px]"
            src={icon}
            loading="eager"
            alt={`Edit experience icon`}
            unselectable="on"
          />
        </button>
      </FonciiToolTip>
    );
  };

  const RatingsSection = (): JSX.Element => {
    // Rating Label Children
    const creatorAvatarImageView = (
      <UserAvatarImageView
        user={creator}
        imageResizingProps={{
          height: 60,
          width: 60,
          fit: MediaServerImageFitParams.cover,
          format: MediaServerImageFormatParams.f3
        }}
      />
    ),
      googleIconImage = (
        <Image
          src={ImageRepository.CompanyLogos.GoogleLogo}
          height={20}
          width={20}
          alt="Google Logo"
          unselectable="on"
          unoptimized
        />
      ),
      yelpIconImage = (
        <Image
          src={ImageRepository.CompanyLogos.YelpLogo}
          height={20}
          width={20}
          alt="Yelp Logo"
          unselectable="on"
          unoptimized
        />
      );

    // Creator Rating Conditional Logic
    const isCreatorRatingDefined =
      creatorRating != undefined && creatorRating != 0;

    const creatorRatingLabel = isCreatorRatingDefined ? (
      <RestaurantRatingLabel title={creator.username} rating={creatorRating}>
        {creatorAvatarImageView}
      </RestaurantRatingLabel>
    ) : undefined,
      googleRatingLabel = (
        <RestaurantRatingLabel title="Google" rating={googleRating}>
          {googleIconImage}
        </RestaurantRatingLabel>
      ),
      yelpRatingLabel = (
        <RestaurantRatingLabel title="Yelp" rating={yelpRating}>
          {yelpIconImage}
        </RestaurantRatingLabel>
      );

    return (
      <div
        className={`flex flex-row gap-[10px] items-center flex-nowrap w-full justify-left pointer-events-auto`}
      >
        {creatorRatingLabel}
        {googleRatingLabel}
        {yelpRatingLabel}
      </div>
    );
  };

  const userGalleryLink = (): string => {
    return NavigationProperties.userGalleryPageLink(post.creator.username);
  };

  const LastUpdated = (): JSX.Element => {
    const dateString = getSnapedStringTimeFromNow(new Date(post.creationDate));
    return (
      <p className="font-normal leading-[1.15] text-[10px] xl:text-[12px] text-permanent_white line-clamp-1">
        {dateString}
      </p>
    );
  };

  const UserName = (): JSX.Element => {
    return (
      <p className="font-normal leading-[1.15] text-[10px] xl:text-[12px] text-permanent_white line-clamp-1">
        @{post.creator.username}
      </p>
    );
  };

  const CreatorHeader = (): JSX.Element => {
    return (
      <div className="flex flex-row h-[24px] xl:h-[30px]">
        <Link
          href={userGalleryLink()}
          target="_self"
          className="hover:opacity-75 transition-all ease-in-out"
        >
          <UserAvatarImageView
            user={creator}
            className="rounded-md h-[24px] w-[24px] xl:w-[30px] xl:h-[30px]"
            imageResizingProps={{
              height: 60,
              width: 60,
              fit: MediaServerImageFitParams.cover,
              format: MediaServerImageFormatParams.f3,
            }}
          />
        </Link>
        <div className="divide-permanent_white justify-center items-center pl-[4px]">
          <Link
            href={userGalleryLink()}
            target="_self"
            className="hover:opacity-75 transition-all ease-in-out"
          >
            <UserName />
          </Link>
          <LastUpdated />
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        includeHeader ? "h-[180px]" : "h-[150px]",
        "w-[290px] xl:w-[270px] md:h-[200px] xl:h-[280px] rounded-[10px] cursor-pointer transition-all ease-in-out duration-300 border-[2px]",
        includeHeader
          ? "border-[0px]"
          : favorited
            ? "border-gold"
            : isSelected
              ? "border-primary"
              : "border-medium_dark_grey border-[1px]",
        className
      )}
    >
      {virtualized ? undefined : (
        <div className="w-full h-full space-y-1">
          {includeHeader ? <CreatorHeader /> : undefined}
          <div
            className={cn(
              `flex w-full h-full bg-black rounded-[8px] shadow-xl cursor-pointer hover:shadow-2xl transition-all ease-in-out duration-300`,
              includeHeader ? "h-[150px] md:h-[170px] xl:h-[250px]" : ""
            )}
          >
            <div className={`relative w-full h-full bg-black rounded-[10px]`}>
              <PostHeroImageView
                post={post}
                onClickAction={openViewerDetailViewNavigationAction}
                className="rounded-[8px]"
                priorityLoad={!virtualized}
                imageResizingProps={{
                  height: 400,
                  width: 400,
                  fit: MediaServerImageFitParams.cover,
                  format: MediaServerImageFormatParams.f3,
                }}
              />

              {/** Content Overlay */}
              <div className="h-full w-full absolute z-1 top-0 flex flex-col p-[8px] justify-between pointer-events-none">
                {/** Top Section */}
                <div className="flex flex-row justify-between w-full h-fit pointer-events-none">
                  {/** Top Left Section */}
                  <div className="flex flex-col gap-y-[14px] pointer-events-auto">
                    <PercentMatchLabel
                      percentMatchScore={percentMatchScore}
                      qualityScore={qualityScore}
                      blurQualityScore={!UserManager.shared.userAuthenticated()}
                    />
                    <PostSourcePermaLink post={post} />
                  </div>
                  {/** Top Left Section */}

                  {/** Top Right Section */}
                  <div className="flex flex-col gap-y-[14px] gap-x-[8px] pointer-events-auto">
                    {EditPostButton()}
                    {fonciiRestaurant && !disableSaveRestaurantButton ? (
                      <SaveRestaurantButton
                        fonciiRestaurant={fonciiRestaurant}
                        post={post}
                      />
                    ) : undefined}
                  </div>
                  {/** Top Right Section */}
                </div>
                {/** Top Section */}

                {/** Bottom Section */}
                <div className="absolute flex flex-col gap-y-[4px] bottom-[8px] pointer-events-none">
                  {restaurant ? (
                    <>
                      <Link href={postDetailViewPageLink()} />
                      {RestaurantPropertiesSection({ restaurant, fonciiUserState })}
                      {RatingsSection()}
                      {RestaurantPublicationRecognitionLabel({
                        publications: [
                          ...(fonciiRestaurant?.associatedArticlePublicationEdges ??
                            []),
                          ...(fonciiRestaurant?.associatedRestaurantAwardEdges ??
                            []),
                        ],
                      })}
                    </>
                  ) : (
                    <span className="pb-[10px]">
                      <RestaurantNameLabel restaurant={restaurant} />
                    </span>
                  )}
                </div>
                {/** Bottom Section */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
