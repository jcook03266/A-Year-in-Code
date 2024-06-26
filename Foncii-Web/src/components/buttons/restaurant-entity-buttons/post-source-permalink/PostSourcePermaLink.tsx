// Dependencies
// Types
import {
  FmIntegrationProviders,
  FmUserPost,
} from "../../../../__generated__/graphql";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Components
// Local
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";

// External
import Link from "next/link";
import Image from "next/image";

// Services
import AnalyticsService from "../../../../services/analytics/analyticsService";

// Navigation
import { currentPageCanonicalURL } from "../../../../core-foncii-maps/properties/NavigationProperties";

// Utilities
import { uppercaseFirstLetterOnly } from "../../../../utilities/formatting/textContentFormatting";

interface PostSourcePermaLinkProps {
  post: FmUserPost;
  onClick?: () => void;
}

// Note: Default source is instagram for now until the other integrations are implemented
export const PostSourcePermaLink = ({
  post,
  onClick,
}: PostSourcePermaLinkProps): React.ReactNode | undefined => {
  // Properties
  // Post Origin Source Properties
  const dataSourceProperties = post.dataSource,
    postDataSourceProvider = dataSourceProperties?.provider,
    sourcePermalink = dataSourceProperties?.permalink;

  // Post / Restaurant Props
  const postID = post.id,
    authorUID = post.userID,
    fonciiRestaurant = post.fonciiRestaurant;

  // Actions
  function trackSourceLinkClickEvent() {
    if (!fonciiRestaurant || !postDataSourceProvider || !sourcePermalink)
      return;

    // Parsing
    const fonciiRestaurantID = fonciiRestaurant.restaurant.id,
      percentMatchScore = fonciiRestaurant.percentMatchScore,
      qualityScore = fonciiRestaurant.qualityScore;

    AnalyticsService.shared.trackSourceLinkClick({
      authorUID,
      fonciiRestaurantID,
      postID,
      percentMatchScore,
      qualityScore,
      destinationURL: sourcePermalink,
      sourceURL: currentPageCanonicalURL(location),
      destinationPlatform: postDataSourceProvider,
    });
  }

  // Action Handlers
  const onClickPassthrough = () => {
    trackSourceLinkClickEvent();
    onClick?.();
  };

  // Assets
  const icon = () => {
    switch (postDataSourceProvider) {
      case FmIntegrationProviders.Instagram:
        return ImageRepository.CompanyLogos.InstagramLogo;
      default:
        // Log error and return undefined to prevent invalid component config from being rendered
        console.error(
          "[creatorSocialMediaProfileLink] Unsupported Integration Provider"
        );
        return undefined;
    }
  };

  const doesSourcePermalinkExist = (): boolean => {
    return sourcePermalink != undefined;
  };

  return doesSourcePermalinkExist() && icon() ? (
    <Link
      href={sourcePermalink ?? "#"}
      target="_blank"
      rel="noreferrer"
      onClick={onClickPassthrough}
      className="flex w-[22px] h-[22px] xl:w-[24px] xl:h-[24px] items-center justify-center shrink-0"
    >
      <FonciiToolTip
        title={`View this on ${uppercaseFirstLetterOnly(
          dataSourceProperties?.provider ?? ""
        )}`}
      >
        <Image
          className="flex w-[24px] h-[24px] hover:opacity-80 transition-all ease-in-out duration-300 shrink-0"
          src={icon()!}
          alt="Media source icon"
        />
      </FonciiToolTip>
    </Link>
  ) : undefined;
};
