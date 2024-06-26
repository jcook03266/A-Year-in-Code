/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { FonciiRestaurant } from "../../../../__generated__/graphql";

// Components
// Local
import RestaurantRatingLabel from "../../../labels/restaurant-rating-label/RestaurantRatingLabel";
import RestaurantHeroImageView from "../../../media-views/restaurant-hero-image-view/RestaurantHeroImageView";
import PercentMatchLabel from "../../../labels/percent-match-label/PercentMatchLabel";
import RestaurantPublicationRecognitionLabel from "../../../labels/restaurant-publication-recognition-label/RestaurantPublicationRecognitionLabel";
import UserAvatarImageCollection from "../../../media-views/user-avatar-image-collection/UserAvatarImageCollection";
import { RestaurantPropertiesSection } from "../../shared-card-subcomponents/SharedCardSubcomponents";
import { SaveRestaurantButton } from "../../../../components/buttons/restaurant-entity-buttons/save-restaurant-button/SaveRestaurantButton";

// External
import Link from "next/link";
import Image from "next/image";

// URL State Persistence
import {
  NavigationProperties,
  SharedURLParameters,
} from "../../../../core-foncii-maps/properties/NavigationProperties";

// Hooks
import React, { useEffect, useState } from "react";
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Redux
import { getFonciiRestaurantsSlice, getFonciiUserSlice, getPostFiltersSlice } from "../../../../redux/operations/selectors";

// Services
import AnalyticsService, { AnalyticsEvents } from "../../../../services/analytics/analyticsService";

// Managers
import UserManager from "../../../../managers/userManager";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

interface FonciiRestaurantCardProps {
  fonciiRestaurant: FonciiRestaurant;
  onClickAction?: () => void;
  virtualized?: boolean;
  className?: ClassNameValue;
  disableSaveRestaurantButton?: boolean;
  /** False by default, true if the detail can only be opened when the element is selected (clicked at least once) */
  doubleClickToOpenDetail?: boolean;
  /** 
   * Provide this if you want to attribute the view event of this restaurant to
   * another restaurant via the 'similar restaurants section'
   */
  sourceFonciiRestaurantID?: string;
  /** 
   * Provide this if you want to attribute the view event of this restaurant to
   * a post via the 'similar restaurants section'
   */
  sourcePostID?: string;
}

export default function FonciiRestaurantCard({
  fonciiRestaurant,
  onClickAction,
  virtualized = false,
  className,
  disableSaveRestaurantButton = false,
  doubleClickToOpenDetail = false,
  sourceFonciiRestaurantID,
  sourcePostID
}: FonciiRestaurantCardProps) {
  // Parse restaurant entity information
  const restaurant = fonciiRestaurant.restaurant ?? undefined,
    restaurantID = restaurant.id,
    heroImageURL =
      restaurant.heroImageURL ??
      (restaurant.imageCollectionURLs ?? [])[0] ??
      undefined,
    restaurantMediaEdges = restaurant.imageCollectionURLs ?? [],
    // Foncii Restaurant Data
    percentMatchScore = fonciiRestaurant.percentMatchScore ?? undefined,
    qualityScore = fonciiRestaurant.qualityScore,
    influencerInsightEdges = fonciiRestaurant.influencerInsightEdges,
    // Ratings
    averageFonciiRating = fonciiRestaurant.averageFonciiRating ?? undefined,
    googleRating = restaurant?.googleProperties?.rating ?? undefined,
    yelpRating = restaurant?.yelpProperties?.rating ?? undefined;

  // State Management
  const routerSearchParams = useRouterSearchParams();

  // Redux
  const fonciiRestaurantState = getFonciiRestaurantsSlice()();
  const fonciiUserState = getFonciiUserSlice()();
  const filters = getPostFiltersSlice()();

  // Selection State
  const determineIfRestaurantIsSelected = (): boolean => {
    return restaurantID == filters.currentlySelectedPostID;
  };

  const [isSelected, setIsSelected] = useState<boolean>(
    determineIfRestaurantIsSelected()
  );

  // Update selection state based on URL persistence
  useEffect(() => {
    setIsSelected(determineIfRestaurantIsSelected());
  }, [filters.currentlySelectedPostID]);

  // Parsing
  const usersWithRatings = influencerInsightEdges.map((post) => {
    return post.creator;
  });

  // Actions
  // Toggles the detail view for the given foncii restaurant with its URL state parameter
  const openDetailViewNavigationAction = (): void => {
    // Only open the detail view when this entity is selected
    if (isSelected || !doubleClickToOpenDetail) {
      // Used when navigating on the same path (explore or gallery) to remove conflicting properties
      routerSearchParams.setParams({
        [SharedURLParameters.detailViewForPost]: undefined,
        [SharedURLParameters.selectedPost]: restaurantID,
        [SharedURLParameters.detailViewForRestaurant]: restaurantID,
        [SharedURLParameters.isEditingPost]: undefined,
      });
    }

    // Analytics
    AnalyticsService.shared.trackGenericEvent(
      AnalyticsEvents.RESTAURANT_DETAIL_VIEW_OPENED,
      {
        restaurantID,
        origin: location.pathname,
      }
    );

    AnalyticsService.shared
      .trackRestaurantClick({
        autoCompleteQuery: fonciiRestaurantState.searchQuery,
        fonciiRestaurantID: restaurantID,
        qualityScore,
        sourceFonciiRestaurantID,
        sourcePostID,
        queryID: fonciiRestaurantState.queryID
      });

    // Trigger any external logic (this triggers the selection state)
    onClickAction?.();
  };

  // Dynamic Links for SEO
  const restaurantDetailViewPageLink = (): string => {
    return NavigationProperties.restaurantDetailViewPageLink(
      restaurantID,
      false
    );
  };

  // Subcomponents
  const RatingsSection = (): JSX.Element => {
    // Rating Label Children
    const googleIconImage = (
      <Image
        src={ImageRepository.CompanyLogos.GoogleLogo}
        height={100}
        width={100}
        alt="Google Logo"
        unselectable="on"
        unoptimized
      />
    ),
      yelpIconImage = (
        <Image
          src={ImageRepository.CompanyLogos.YelpLogo}
          height={100}
          width={100}
          alt="Yelp Logo"
          unselectable="on"
          unoptimized
        />
      );

    const googleRatingLabel = (
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
        {AverageFonciiRatingLabel()}
        {googleRatingLabel}
        {yelpRatingLabel}
      </div>
    );
  };

  const AverageFonciiRatingLabel = (): React.ReactElement | null => {
    // Not rendered at all if no influencer edges are present (no users have made posts about this restaurant yet)
    if (usersWithRatings.length == 0) return null;

    const userAvatarImageCollection = (
      <UserAvatarImageCollection users={usersWithRatings} />
    ),
      formattedRating = averageFonciiRating
        ? averageFonciiRating.toFixed(1)
        : "N/A";

    return (
      <div className={`flex flex-row items-center gap-x-[8px]`}>
        <div className={`h-[18px] w-fit rounded-full`}>
          {userAvatarImageCollection}
        </div>

        <p className={`text-permanent_white text-[14px] font-normal`}>
          {formattedRating}
        </p>
      </div>
    );
  };

  return (
    <div
      className={cn(
        `flex min-w-[250px] w-[290px] xl:w-[270px] bg-black h-[150px] md:h-[200px] xl:h-[280px] rounded-[10px] shadow-xl cursor-pointer hover:shadow-2xl transition-all ease-in-out duration-300 border-[2px]`,
        isSelected ? "border-primary" : "border-medium_dark_grey border-[1px]",
        className
      )}
    >
      {virtualized ? undefined : (
        <div className={`relative w-full h-full bg-black rounded-[8px]`}>
          <RestaurantHeroImageView
            imageURL={heroImageURL}
            secondaryImageURL={restaurantMediaEdges[0]}
            restaurantName={restaurant.name}
            onClickAction={openDetailViewNavigationAction}
            className="rounded-[8px]"
            imageResizingProps={{
              height: 400,
              width: 400,
            }}
          />

          {/** Content Overlay */}
          <div className="h-full w-full absolute z-1 top-0 flex flex-col p-[8px] justify-between pointer-events-none">
            {/** Top Section */}
            <div className="flex flex-row justify-between w-full h-fit">
              {/** Top Left Section */}
              <div className="flex flex-col gap-y-[14px] items-center pointer-events-auto">
                <PercentMatchLabel
                  percentMatchScore={percentMatchScore}
                  qualityScore={qualityScore}
                  blurQualityScore={!UserManager.shared.userAuthenticated()}
                />
              </div>
              {/** Top Left Section */}

              {/** Top Right Section */}
              <div className="flex flex-col gap-y-[14px] items-center pointer-events-auto">
                <div className="flex flex-col gap-x-[8px] items-center justify-center w-fit">
                  {!disableSaveRestaurantButton ? (
                    <SaveRestaurantButton fonciiRestaurant={fonciiRestaurant} />
                  ) : undefined}
                </div>
              </div>
              {/** Top Right Section */}
            </div>
            {/** Top Section */}

            {/** Bottom Section */}
            <div className="absolute flex flex-col gap-y-[6px] bottom-[8px] items-start pointer-events-none">
              <Link href={restaurantDetailViewPageLink()} />
              {RestaurantPropertiesSection({ restaurant, fonciiUserState })}
              {RatingsSection()}
              {RestaurantPublicationRecognitionLabel({
                publications: [
                  ...(fonciiRestaurant?.associatedArticlePublicationEdges ??
                    []),
                  ...(fonciiRestaurant?.associatedRestaurantAwardEdges ?? []),
                ],
              })}
            </div>
            {/** Bottom Section */}
          </div>
        </div>
      )}
    </div>
  );
}
