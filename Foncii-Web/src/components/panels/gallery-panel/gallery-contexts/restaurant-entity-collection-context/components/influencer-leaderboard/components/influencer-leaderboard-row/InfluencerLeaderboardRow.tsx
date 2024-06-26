// Dependencies
// Types
import {
  InfluencerLeaderboardCategory,
  LocalInfluencerLeaderboardEntry,
} from "../../../../../../../../../__generated__/graphql";
import { InfluencerLeaderboardVariants } from "../../../InfluencerLeaderboard";

// Components
// Local
import InfluencerMatchAvatar from "../../../../../../../../../components/media-views/influencer-match-avatar/InfluencerMatchAvatar";
import FonciiToolTip from "../../../../../../../../../components/tool-tips/FonciiToolTip";
import Skeleton from "../../../../../../../../../components/utility-components/skeleton/Skeleton";

// External
import Link from "next/link";
import Image from "next/image";

// Navigation
import { NavigationProperties } from "../../../../../../../../../core-foncii-maps/properties/NavigationProperties";

// Assets
import { ImageRepository } from "../../../../../../../../../../public/assets/images/ImageRepository";

// Utilities
import {
  formattedCreatorUsername,
  possessiveFormattedUsernameCopy,
} from "../../../../../../../../../utilities/formatting/textContentFormatting";
import { cn } from "../../../../../../../../../utilities/development/DevUtils";

// Types
interface InfluencerLeaderboardRowProps {
  entry: LocalInfluencerLeaderboardEntry;
  variant: InfluencerLeaderboardVariants;
}

export default function InfluencerLeaderboardRow({
  entry,
  variant,
}: InfluencerLeaderboardRowProps) {
  // Parsing
  const user = entry.user,
    totalRestaurantsVisitedInArea = entry.totalLocalRestaurantsVisited,
    username = user.username,
    userMatchScore = user.tasteProfileSimilarityScore ?? undefined,
    category = entry.category;

  // Convenience
  const userGalleryLink = (): string => {
    return NavigationProperties.userGalleryPageLink(username);
  };

  const getTextDescriptionForCategory = () => {
    switch (category) {
      case InfluencerLeaderboardCategory.TopRated:
        return "Top Rated";
      case InfluencerLeaderboardCategory.Trending:
        return "Trending";
      case InfluencerLeaderboardCategory.New:
        return "New";
    }
  };

  const getIconForCategory = () => {
    switch (category) {
      case InfluencerLeaderboardCategory.TopRated:
        return ImageRepository.UserMenuIcons.TopRatedTab;
      case InfluencerLeaderboardCategory.Trending:
        return ImageRepository.UserMenuIcons.TrendingTab;
      case InfluencerLeaderboardCategory.New:
        return ImageRepository.UserMenuIcons.NewTab;
    }
  };

  // Subcomponents
  const InfluencerAvatarView = (): React.ReactNode => {
    return (
      <Link
        href={userGalleryLink()}
        target="_self"
        className="hover:opacity-75 transition-all ease-in-out h-[60px] w-[107px] md:h-[54px] md:w-[54px]"
      >
        <InfluencerMatchAvatar
          user={user}
          percentMatchScore={userMatchScore}
          className="w-[107px] h-[60px] md:h-[54px] md:w-[54px] xl:w-[54px] xl:h-[54px]"
        />
      </Link>
    );
  };

  const CategoryImageView = (): React.ReactNode => {
    return (
      <Image
        src={getIconForCategory()}
        height={23}
        width={23}
        className="h-[23px] w-[23px]"
        alt={`${getTextDescriptionForCategory()} influencer maps icon`}
        unselectable="on"
        loading="eager"
        fetchPriority="high"
        unoptimized
      />
    );
  };

  const UsernameLabel = (): React.ReactNode => {
    return (
      <h4
        className={cn(
          "font-semibold text-permanent_white w-full max-w-[60px] md:max-w-[150px] h-fit leading-normal overflow-hidden text-ellipsis hover:opacity-75 transition-all ease-in-out",
          variant == InfluencerLeaderboardVariants.section
            ? "text-[12px]"
            : "text-[10px]"
        )}
      >
        @{formattedCreatorUsername(username)}
      </h4>
    );
  };

  /** Links to the actual post itself */
  const LinkIcon = (): React.ReactNode => {
    return (
      <div className="h-fit w-fit hover:opacity-75 transition-all ease-in-out pr-[4px] md:pr-[8px] shrink-0">
        <Link href={userGalleryLink()} target="_self">
          <Image
            src={ImageRepository.UtilityIcons.RightChevronLinkIcon}
            alt={`Link Icon`}
            height={16}
            width={16}
            className={`h-[16px] w-[16px]`}
            unselectable="on"
            loading="eager"
            fetchPriority="high"
            unoptimized
          />
        </Link>
      </div>
    );
  };

  const CategoryLabel = (): React.ReactNode => {
    return (
      <h3 className="text-primary text-[15px] font-normal h-fit w-full line-clamp-1 shrink-0">
        {getTextDescriptionForCategory()}
      </h3>
    );
  };

  const VisitedRestaurantsDescription = (): React.ReactNode => {
    const description = `${totalRestaurantsVisitedInArea} near you`;

    return (
      <FonciiToolTip title={description}>
        <p
          className={cn(
            "text-permanent_white font-normal h-fit w-fit break-words",
            variant == InfluencerLeaderboardVariants.section
              ? "text-[12px]"
              : "text-[10px]"
          )}
        >
          {description}
        </p>
      </FonciiToolTip>
    );
  };

  // Sections
  const UsernameSection = (): React.ReactNode => {
    return (
      <div
        className={cn(
          "flex flex-col gap-y-[4px] md:items-center md:justify-center w-fit h-fit",
          variant == InfluencerLeaderboardVariants.section ? "" : "md:w-[80px]"
        )}
      >
        <CategoryLabel />
        <UsernameLabel />
      </div>
    );
  };

  const ContentSection = (): React.ReactNode => {
    const description = `Visited ${totalRestaurantsVisitedInArea} restaurants near you`;

    return (
      <Link className="w-full h-full" href={userGalleryLink()} target="_self">
        <div className="flex flex-row md:items-center justify-between h-full w-full md:px-[6px]">
          {UsernameSection()}

          <div className="md:hidden ml-[4px]">{CategoryImageView()}</div>
          <div
            className={cn(
              "md:flex hidden flex-row h-full w-fit items-center justify-center",
              variant == InfluencerLeaderboardVariants.section
                ? "gap-x-[64px]"
                : "gap-x-[16px] shrink-0 w-[140px]"
            )}
          >
            {CategoryImageView()}
            <div className="flex-1 px-[20px] py-[6px]">
              <FonciiToolTip title={description}>
                <p
                  style={{ lineHeight: 1.5 }}
                  className={cn(
                    "text-permanent_white font-normal h-fit w-fit break-words",
                    variant == InfluencerLeaderboardVariants.section
                      ? "text-[12px]"
                      : "text-[10px]"
                  )}
                >
                  {description}
                </p>
              </FonciiToolTip>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <FonciiToolTip
      title={`Explore @${possessiveFormattedUsernameCopy(username)} map`}
    >
      <div
        className={cn(
          "shadow-xl flex flex-col md:flex-row items-center gap-y-[6px] md:gap-y-[8px] p-[4px] md:p-[8px] pt-0 md:pl-[0px] w-[107px] h-[150px] md:w-full md:h-[56px] bg-light_dark_grey rounded-[10px] justify-items-stretch transition-all ease-in-out hover:opacity-75 active:scale-[0.99] hover:scale-[1.01]",
          variant == InfluencerLeaderboardVariants.section
            ? "min-w-[500px]"
            : "md:min-w-[350px]"
        )}
      >
        {InfluencerAvatarView()}
        {ContentSection()}
        <div className="md:hidden w-full flex justify-between items-center">
          <Image
            src={ImageRepository.UtilityIcons.ForkKnifeIcon}
            alt={`Link Icon`}
            height={12}
            width={12}
            className={`h-[12px] w-[12px]`}
            unselectable="on"
            loading="eager"
            fetchPriority="high"
            unoptimized
          />
          <VisitedRestaurantsDescription />
          {LinkIcon()}
        </div>
        <div className="hidden md:block">{LinkIcon()}</div>
      </div>
    </FonciiToolTip>
  );
}

export function InfluencerLeaderboardRowSkeleton({
  variant,
}: {
  variant: InfluencerLeaderboardVariants;
}) {
  return (
    <Skeleton
      className={cn(
        "shadow-xl flex flex-row items-center gap-x-[8px] p-[8px] pl-[0px] w-full h-[56px] bg-light_dark_grey rounded-[10px] justify-items-stretch transition-all ease-in-out hover:opacity-75 active:scale-90 hover:scale-[1.01]",
        variant == InfluencerLeaderboardVariants.section
          ? "min-w-[500px]"
          : "md:min-w-[350px]"
      )}
    />
  );
}
