// Dependencies
// Types
import {
  FmIntegrationCredential,
  FmIntegrationProviders,
} from "../../../../__generated__/graphql";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Components
// Local
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";

// External
import Link from "next/link";
import Image from "next/image";

// Utilities
import { uppercaseFirstLetterOnly } from "../../../../utilities/formatting/textContentFormatting";
import { cn } from "../../../../utilities/development/DevUtils";

// Types
interface CreatorSocialMediaLinkButtonProps {
  userIntegrationCredential: FmIntegrationCredential;
  onClick?: () => void;
  className?: string;
}

// Note: Default source is instagram for now until the other integrations are implemented
export const CreatorSocialMediaLinkButton = ({
  userIntegrationCredential,
  onClick,
  className,
}: CreatorSocialMediaLinkButtonProps): React.ReactNode | undefined => {
  // Properties
  const integrationAppUsername = userIntegrationCredential.appUsername,
    integrationProvider = userIntegrationCredential.provider,
    creatorSocialMediaProfileLink = () => {
      switch (integrationProvider) {
        case FmIntegrationProviders.Instagram:
          return `https://www.instagram.com/${integrationAppUsername}`;
        default:
          // Log error and return undefined to prevent invalid component config from being rendered
          console.error(
            "[creatorSocialMediaProfileLink] Unsupported Integration Provider"
          );
          return undefined;
      }
    };

  // Assets
  const icon = () => {
    switch (integrationProvider) {
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

  // Convenience
  const doesSourcePermalinkExist = (): boolean => {
    return creatorSocialMediaProfileLink() != undefined;
  };

  return doesSourcePermalinkExist() && icon() ? (
    <Link
      href={creatorSocialMediaProfileLink() ?? "#"}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className="flex items-center justify-center shrink-0"
    >
      <FonciiToolTip
        title={`View creator's profile on ${uppercaseFirstLetterOnly(
          integrationProvider
        )}`}
      >
        <Image
          className={cn(
            "h-[18px] w-[18px] xl:h-[20px] xl:w-[20px] hover:opacity-80 transition-all ease-in-out duration-300 shrink-0",
            className
          )}
          src={icon()}
          alt="Creator Social Media Link Icon"
        />
      </FonciiToolTip>
    </Link>
  ) : undefined;
};
