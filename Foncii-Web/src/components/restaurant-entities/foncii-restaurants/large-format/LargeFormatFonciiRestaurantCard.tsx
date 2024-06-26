/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { FonciiRestaurant } from "../../../../__generated__/graphql";

// Styling
import { ColorEnum } from "../../../../../public/assets/ColorRepository";

// Components
// Local
import RestaurantRatingLabel from "../../../labels/restaurant-rating-label/RestaurantRatingLabel";
import RestaurantHeroImageView from "../../../media-views/restaurant-hero-image-view/RestaurantHeroImageView";
import RestaurantPublicationRecognitionLabel from "../../../labels/restaurant-publication-recognition-label/RestaurantPublicationRecognitionLabel";
import UserAvatarImageCollection from "../../../media-views/user-avatar-image-collection/UserAvatarImageCollection";
import { RestaurantPropertiesSection } from "../../shared-card-subcomponents/SharedCardSubcomponents";

// External
import Link from "next/link";

// URL State Persistence
import {
  NavigationProperties,
  SharedURLParameters,
} from "../../../../core-foncii-maps/properties/NavigationProperties";

// External
import Image from "next/image";

// Hooks
import React, { useEffect, useState } from "react";
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Redux
import { getFonciiRestaurantsSlice, getFonciiUserSlice, getPostFiltersSlice } from "../../../../redux/operations/selectors";

// Managers
import AnalyticsService, { AnalyticsEvents } from "../../../../services/analytics/analyticsService";

// Utilities
import { ClassNameValue } from "tailwind-merge";
import { cn } from "../../../../utilities/development/DevUtils";

interface FonciiRestaurantCardProps {
  fonciiRestaurant: FonciiRestaurant;
  onClickAction?: () => void;
  className?: ClassNameValue;
}

export default function LargeFormatFonciiRestaurantCard({
  fonciiRestaurant,
  onClickAction,
  className
}: FonciiRestaurantCardProps) {
  // State Management
  const routerSearchParams = useRouterSearchParams();

  // Redux
  const fonciiRestaurantState = getFonciiRestaurantsSlice()();
  const fonciiUserState = getFonciiUserSlice()();
  const filters = getPostFiltersSlice()();

  // Selection State
  const determineIfRestaurantIsSelected = (): boolean => {
    return fonciiRestaurant.restaurant.id == filters.currentlySelectedPostID;
  };

  const [isSelected, setIsSelected] = useState<boolean>(
    determineIfRestaurantIsSelected()
  );

  // Update selection state based on URL persistence
  useEffect(() => {
    setIsSelected(determineIfRestaurantIsSelected());
  }, [filters.currentlySelectedPostID]);

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
    qualityScore = fonciiRestaurant.qualityScore ?? undefined,
    influencerInsightEdges = fonciiRestaurant.influencerInsightEdges,
    // Ratings
    averageFonciiRating = fonciiRestaurant.averageFonciiRating ?? undefined,
    googleRating = restaurant?.googleProperties?.rating ?? undefined,
    yelpRating = restaurant?.yelpProperties?.rating ?? undefined;

  // Parsing
  const usersWithRatings = influencerInsightEdges.map((post) => {
    return post.creator;
  });

  // Dynamic Styling
  const borderClassNames = (): string => {
    return isSelected
      ? `border-[1px] border-${ColorEnum.primary}`
      : `border-${ColorEnum.medium_dark_grey}`;
  };

  // Actions
  // Toggles the detail view for the given foncii restaurant with its URL state parameter
  const openDetailViewNavigationAction = (): void => {
    routerSearchParams.toggleParameterWithValue(
      SharedURLParameters.detailViewForRestaurant,
      restaurant.id
    );

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
        queryID: fonciiRestaurantState.queryID,
      });

    // Trigger any external logic (this triggers the selection state)
    onClickAction?.();
  };

  // Dynamic Links for SEO
  const restaurantDetailViewPageLink = (): string => {
    return NavigationProperties.restaurantDetailViewPageLink(
      restaurant.id,
      true
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
      />
    ),
      yelpIconImage = (
        <Image
          src={ImageRepository.CompanyLogos.YelpLogo}
          height={100}
          width={100}
          alt="Yelp Logo"
          unselectable="on"
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
        className={`flex flex-row gap-[10px] items-center flex-nowrap w-full justify-left`}
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
      id={restaurantID}
      key={restaurantID}
      className={cn(
        `flex min-w-[300px] w-full bg-black h-[150px] rounded-[10px] overflow-hidden shadow-xl cursor-pointer hover:shadow-2xl transition-all ease-in-out duration-500`,
        borderClassNames(),
        className
      )}
      onClick={openDetailViewNavigationAction}
    >
      <div className={`relative w-full h-full bg-black`}>
        <RestaurantHeroImageView
          imageURL={heroImageURL}
          secondaryImageURL={restaurantMediaEdges[0]}
          restaurantName={restaurant.name}
          className="rounded-[10px]"
          imageResizingProps={{
            height: 800,
            width: 800,
          }}
        />

        {/** Content Overlay */}
        <div className="h-full w-full absolute z-1 top-0 flex flex-col p-[10px] justify-between pointer-events-none">
          {/** Top Section */}
          <div className="flex flex-row justify-between w-full h-fit">
            {/** Top Left Section */}
            <div className="flex flex-col gap-y-[14px] items-center pointer-events-none">
              {RestaurantPropertiesSection({
                restaurant,
                fonciiUserState: fonciiUserState,
                withDescription: true
              })}
            </div>
            {/** Top Left Section */}

            {/** Top Right Section */}
            <div className="flex flex-col gap-y-[14px] items-center pointer-events-auto">
              <div className="flex flex-col gap-x-[8px] items-center justify-center w-fit">
                {/** Favorite pin is fixed to the top right corner of the view with a slight offset */}
                {/* <span className='translate-x-[10px] translate-y-[-10px] absolute top-0 right-0'>
                                <FavoritePostButton post={post} />
                                </span> */}
              </div>
            </div>
            {/** Top Right Section */}
          </div>
          <Link href={restaurantDetailViewPageLink()} />
          {/** Top Section */}

          {/** Bottom Section */}
          <div className="flex flex-row gap-y-[6px] items-center justify-start divide-x-[1px] divide-permanent_white pointer-events-auto">
            <span className="pr-[16px]">{RatingsSection()}</span>

            <span className="pl-[16px]">
              {RestaurantPublicationRecognitionLabel({
                publications: [
                  ...(fonciiRestaurant?.associatedArticlePublicationEdges ??
                    []),
                  ...(fonciiRestaurant?.associatedRestaurantAwardEdges ?? []),
                ],
              })}
            </span>
          </div>
          {/** Bottom Section */}
        </div>
      </div>
    </div>
  );
}
