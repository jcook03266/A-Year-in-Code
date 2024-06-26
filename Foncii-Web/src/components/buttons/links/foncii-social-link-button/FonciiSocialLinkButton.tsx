// Dependencies
// Components
// Local
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";
import Link from "next/link";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Utilities
import {
  ExternalLinks,
  NavigationProperties,
} from "../../../../core-foncii-maps/properties/NavigationProperties";

// Types
interface FonciiSocialLinkButtonProps {
  socialMedia: FonciiSocialMedias;
  blankTarget?: boolean; // True open the link in a new tab (_blank target), false open in the same tab
}

export enum FonciiSocialMedias {
  twitter = "twitter",
  instagram = "instagram",
  medium = "medium",
  fonciiFounderGallery = "fonciiceoGallery",
}

// Reusable Foncii Social Media Link Button Component
export default function FonciiSocialLinkButton({
  socialMedia,
  blankTarget = true,
}: FonciiSocialLinkButtonProps) {
  // Convenience
  const shouldRenderBorder = (): boolean =>
    socialMedia == FonciiSocialMedias.fonciiFounderGallery;

  // Selectors
  const getIconForSocialMedia = (): any => {
    switch (socialMedia) {
      case FonciiSocialMedias.twitter:
        return ImageRepository.SocialShareIcons.TwitterSocialShareIcon;
      case FonciiSocialMedias.instagram:
        return ImageRepository.SocialShareIcons.InstagramSocialShareIcon;
      case FonciiSocialMedias.medium:
        return ImageRepository.SocialShareIcons.MediumSocialShareIcon;
      case FonciiSocialMedias.fonciiFounderGallery:
        return ImageRepository.SocialShareIcons
          .FonciiFounderGallerySocialShareIcon;
    }
  };

  const getLinkForSocialMedia = (): string => {
    switch (socialMedia) {
      case FonciiSocialMedias.twitter:
        return ExternalLinks.fonciiTwitterSocialLink();
      case FonciiSocialMedias.instagram:
        return ExternalLinks.fonciiInstagramSocialLink();
      case FonciiSocialMedias.medium:
        return ExternalLinks.fonciiMediumSocialLink();
      case FonciiSocialMedias.fonciiFounderGallery:
        return NavigationProperties.fonciiFounderAbsoluteGalleryLink();
    }
  };

  const getAltForSocialMedia = (): string => {
    let alt: string = "";

    switch (socialMedia) {
      case FonciiSocialMedias.twitter:
        alt = "Twitter";
        break;
      case FonciiSocialMedias.instagram:
        alt = "Instagram";
        break;
      case FonciiSocialMedias.medium:
        alt = "Medium";
        break;
      case FonciiSocialMedias.fonciiFounderGallery:
        alt = "Founder's Foncii Map";
        break;
    }

    return alt;
  };

  return (
    <FonciiToolTip title={getAltForSocialMedia()}>
      <Link
        href={getLinkForSocialMedia()}
        aria-label="A link to a Foncii social media account"
        target={blankTarget ? "_blank" : "_self"}
      >
        <Image
          src={getIconForSocialMedia()}
          alt={getAltForSocialMedia()}
          height={44}
          width={44}
          className={`${
            shouldRenderBorder() ? "border-[1px] border-primary" : ""
          } h-[30px] w-[30px] md:h-[34px] md:w-[34px] rounded-[7.3px] hover:opacity-50 transition-all ease-in`}
        />
      </Link>
    </FonciiToolTip>
  );
}
