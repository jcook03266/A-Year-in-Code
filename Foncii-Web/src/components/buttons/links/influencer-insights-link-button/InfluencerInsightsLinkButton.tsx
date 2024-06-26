// Dependencies
// Types
import {
  FmUserPost,
  FonciiRestaurant,
} from "../../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Framework
import React from "react";

// Components
// Local
import UserAvatarImageView from "../../../../components/media-views/user-avatar-image-view/UserAvatarImageView";
import PostHeroImageView from "../../../../components/media-views/post-hero-image-view/PostHeroImageView";

// External
import Image from "next/image";
import Link from "next/link";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Formatting
import { formattedCreatorUsername } from "../../../../utilities/formatting/textContentFormatting";

// Navigation
import { NavigationProperties } from "../../../../core-foncii-maps/properties/NavigationProperties";

// Utils
import { cn } from "../../../../utilities/development/DevUtils";

export default function InfluencerInsightsLinkButton({
  influencerPost,
}: {
  influencerPost: FmUserPost;
  fonciiRestaurant?: FonciiRestaurant;
}) {
  // Parsing
  const rating = influencerPost?.customUserProperties?.rating,
    influencer = influencerPost.creator,
    username = influencer.username,
    notes = influencerPost?.customUserProperties?.notes,
    postID = influencerPost.id;

  // Convenience
  // Links to the full screen detail view for this influencer's post about the given restaurant
  const userGalleryPostDetailViewLink = (): string => {
    return NavigationProperties.galleryPostDetailViewPageLink(username, postID);
  };

  const userGalleryLink = (): string => {
    return NavigationProperties.userGalleryPageLink(username);
  };

  const formattedRating = (): string => {
    if (!rating) return "N/A";

    return `${rating.toFixed(1)} / 5.0`;
  };

  const isFavorited = (): boolean => {
    return influencerPost.isFavorited ?? false;
  };

  // Subcomponents
  const HeroImageView = (): React.ReactNode => {
    return (
      <PostHeroImageView
        post={influencerPost}
        isOverlayed={false}
        className="h-[92px] w-[82px] shrink-0 rounded-[5px]"
        imageResizingProps={{
          height: 240,
          width: 240,
          fit: MediaServerImageFitParams.cover,
          format: MediaServerImageFormatParams.f3,
        }}
      />
    );
  };

  const PinnedHeader = (): React.ReactNode => {
    if (!isFavorited()) return;

    return (
      <div className="pb-[4px]">
        <div className="bg-primary flex flex-row rounded-[2px] p-[2px] gap-x-[4px] h-[14px] w-[82px] justify-center items-center">
          <Image
            src={ImageRepository.UtilityIcons.PinIcon}
            alt={`Pin Icon`}
            height={10}
            width={10}
            unselectable="on"
          />
          <p className="font-normal text-permanent_white text-[8px] leading-none">
            PINNED ON MAP
          </p>
        </div>
      </div>
    );
  };

  const CreatorHeader = (): JSX.Element => {
    return (
      <div className="flex flex-row h-fit w-full pb-[8px] items-center">
        <Link
          href={userGalleryLink()}
          target="_self"
          className="relative hover:opacity-75 transition-all ease-in-out"
        >
          <UserAvatarImageView
            user={influencer}
            className="rounded-md h-[24px] w-[24px] xl:w-[30px] xl:h-[30px]"
            imageResizingProps={{
              height: 120,
              width: 120,
              fit: MediaServerImageFitParams.cover,
              format: MediaServerImageFormatParams.f3,
            }}
          />
        </Link>
        <Link
          href={userGalleryLink()}
          target="_self"
          className="relative hover:opacity-75 transition-all ease-in-out"
        >
          <div className="divide-permanent_white justify-center items-center pl-[8px] line-clamp-1">
            {UsernameSection()}
          </div>
        </Link>
        {RatingLabel()}
      </div>
    );
  };

  const UsernameSection = (): React.ReactNode => {
    return (
      <div className="flex flex-row items-center justify-start w-fit h-fit line-clamp-1">
        <h3 className="font-normal text-permanent_white text-[15px] w-fit h-fit leading-normal line-clamp-1">
          @{formattedCreatorUsername(username)}
        </h3>
      </div>
    );
  };

  const NotesLabel = (): React.ReactNode => {
    if (!notes) return;

    return (
      <p
        className={cn(`font-normal text-permanent_white text-[12px] w-fit h-fit leading-tight`, isFavorited() ? "line-clamp-2" : "line-clamp-3")}
      >
        {notes}
      </p>
    );
  };

  const RatingLabel = (): React.ReactNode => {
    if (!rating) return;

    return (
      <div className="flex flex-row gap-x-[4px] pl-[6px] items-center justify-center w-fit h-fit shrink-0 pointer-events-none">
        <Image
          src={ImageRepository.UtilityIcons.FonciiSalmonRedStarIcon}
          alt={`Foncii Star Rating Icon`}
          height={16}
          width={16}
          className={`h-fit w-fit transition-all ease-in-out duration-200`}
          unselectable="on"
        />
        <p className="text-[15px] text-permanent_white font-semibold w-fit h-fit shrink-0">
          {formattedRating()}
        </p>
      </div>
    );
  };

  /** This + the picture link to the creator's gallery (map) */
  const TextContent = (): React.ReactNode => {
    return (
      <div className="flex flex-col w-full h-fit">
        <NotesLabel />
      </div>
    );
  };

  /** Links to the actual post itself */
  const LinkIcon = (): React.ReactNode => {
    return (
      <div className="h-fit w-fit self-center transition-all ease-in-out pr-[8px] shrink-0">
        <Image
          src={ImageRepository.UtilityIcons.RightChevronLinkIcon}
          alt={`Link Icon`}
          height={24}
          width={24}
          className={`h-fit w-fit`}
          unselectable="on"
        />
      </div>
    );
  };

  // Link here as absolute to avoid subnesting links
  return (
    <div className="relative overflow-hidden shadow-xl flex flex-row gap-x-[8px] p-[4px] w-full h-[100px] bg-light_dark_grey rounded-[10px] hover:opacity-75 transition-all ease-in-out">
      {HeroImageView()}
      <Link
        href={userGalleryPostDetailViewLink()}
        target="_self"
        className="absolute w-full h-full"
      />
      <div className="flex flex-col pl-[8px] w-full">
        {PinnedHeader()}
        {CreatorHeader()}
        {TextContent()}
      </div>
      {LinkIcon()}
    </div>
  );
}
