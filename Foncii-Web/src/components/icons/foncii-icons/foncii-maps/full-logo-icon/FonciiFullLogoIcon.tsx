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

// Types
interface FonciiFullLogoIconProps {
  withLink?: boolean;
  customLink?: string;
}

// Scalable and Reusable Foncii attribution
// Note: Optionally links to homepage when pressed, pass false to disable
export default function FonciiFullLogoIcon({
  withLink = true,
  customLink = undefined,
}: FonciiFullLogoIconProps) {
  // Properties
  const homepageLink = NavigationProperties.homePageLink(),
    href: string = withLink ? homepageLink : "";

  return (
    <Link
      className={`hover:opacity-75 transition ease-in-out`}
      href={customLink ?? href}
    >
      <FonciiToolTip title="Foncii">
        <Image
          src={ImageRepository.CompanyLogos.FonciiBetaLogo}
          alt="Foncii Full Logo"
          width={400}
          height={400}
          fetchPriority="high"
          loading="eager"
        />
      </FonciiToolTip>
    </Link>
  );
}
