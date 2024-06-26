// Dependencies
// Types
import { FmUser } from "../../../__generated__/graphql";

// Styling
import { ColorEnum } from "../../../../public/assets/ColorRepository";

// Components
import Link from "next/link";

// Utilities
import { NavigationProperties } from "../../../core-foncii-maps/properties/NavigationProperties";

interface CreatorUsernameLabelProps {
  creator: FmUser;
}

/// Clickable name label for displaying creator usernames
function CreatorUsernameLabel({ creator }: CreatorUsernameLabelProps) {
  // Parsing
  const username = (): string => {
    return creator.username;
  };

  // Convenience
  /// A crawlable link to the associated creator's gallery
  const userGalleryPageLink = (): string => {
    return NavigationProperties.userGalleryPageLink();
  };

  return (
    <>
      <Link href={userGalleryPageLink()} target="_self">
        <div className="flex items-left items-center">
          <h2 className={`text-${ColorEnum.primary}`}>@</h2>
          <h2
            className={`text-${ColorEnum.permanent_white} 
        text-[14px] font-normal hover:opacity-50 
        truncate transition ease-in-out`}
          >
            {username()}
          </h2>
        </div>
      </Link>
    </>
  );
}

export default CreatorUsernameLabel;
