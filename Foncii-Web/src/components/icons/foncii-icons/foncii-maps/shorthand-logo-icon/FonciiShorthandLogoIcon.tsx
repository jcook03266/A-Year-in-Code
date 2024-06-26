// Dependencies
// Components
// Local
import FonciiToolTip from "../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";
import Link from "next/link";

// Utility
import { NavigationProperties } from "../../../../../core-foncii-maps/properties/NavigationProperties";

// Assets
import { ImageRepository } from "../../../../../../public/assets/images/ImageRepository";

// Utilities
import { ClassNameValue } from "tailwind-merge";
import { cn } from "../../../../../utilities/development/DevUtils";

// Types
interface FonciiFullLogoIconProps {
  withLink?: boolean;
  customLink?: string;
  className?: ClassNameValue;
}

// Scalable and Reusable Foncii attribution
// Note: Optionally links to homepage when pressed, pass false to disable
export default function FonciiShorthandLogoIcon({
  withLink = true,
  customLink = undefined,
  className,
}: FonciiFullLogoIconProps) {
  // Properties
  const homepageLink = NavigationProperties.homePageLink(),
    href: string = withLink ? homepageLink : "";

  return (
    <Link
      className={cn(`hover:opacity-75 transition ease-in-out`, className)}
      href={customLink ?? href}
    >
      <FonciiToolTip title="Foncii">
        <Image
          src={ImageRepository.CompanyLogos.FonciiLogo}
          alt="Foncii Pelican Logo"
          width={100}
          height={32}
          className="h-[32px] w-fit"
          fetchPriority="high"
          loading="eager"
        />
      </FonciiToolTip>
    </Link>
  );
}
