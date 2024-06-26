// Dependencies
// Types
import { FmUser } from "../../../__generated__/graphql";

// Local
import GenericAvatarImageView from "../generic-avatar-image-view/GenericAvatarImageView";

// External
import Link from "next/link";

// Formatting
import {
  formattedCreatorUsername,
  possessiveFormattedUsernameCopy,
} from "../../../utilities/formatting/textContentFormatting";

// Navigation
import { NavigationProperties } from "../../../core-foncii-maps/properties/NavigationProperties";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Utilities
import { ClassNameValue } from "tailwind-merge";
import { ResizableImageRequestProps } from "../../../utilities/tooling/resizableImageRequestBuilder";

// Types
interface UserAvatarImageViewProps {
  user?: FmUser;
  withLink?: boolean; // True the component should include a link to the creator's profile, false otherwise
  className?: ClassNameValue;
  isCurrentUser?: boolean; // True if the user is the currently logged in user, false otherwise. Used for custom title
  withToolTip?: boolean;
  imageResizingProps?: ResizableImageRequestProps;
}

/**
 * Lazy loaded image view for hosting the profile picture of the given user
 */
export default function UserAvatarImageView({
  user,
  withLink = false,
  className,
  isCurrentUser = false,
  withToolTip = true,
  imageResizingProps,
}: UserAvatarImageViewProps) {
  // Parsing
  const username = user?.username;

  // Properties
  const title = isCurrentUser
    ? "You"
    : `@${formattedCreatorUsername(username ?? "")}`;

  // Convenience
  /// A crawlable link to the associated creator's gallery page
  const userGalleryPageLink = (): string => {
    if (!username) return "#";

    return NavigationProperties.userGalleryPageLink(username);
  };

  // Image alt description generation
  const avatarImageAltDescription = () => {
    let altDescription = "";

    // Precondition failure
    if (!username) return altDescription;

    altDescription += `${possessiveFormattedUsernameCopy(
      username
    )} profile picture`;

    return altDescription;
  };

  const avatarImageMediaURL = (): string | undefined => {
    return (
      user?.profilePictureURL ??
      ImageRepository.Placeholders.UserProfilePicturePlaceholder.src
    );
  };

  // Subcomponents
  const AvatarImageView = (): React.ReactNode => {
    return (
      <GenericAvatarImageView
        imageURL={
          user
            ? avatarImageMediaURL()
            : ImageRepository.Placeholders.UserProfilePicturePlaceholder.src
        }
        altDescription={avatarImageAltDescription()}
        className={className}
        title={title}
        withToolTip={withToolTip}
        imageResizingProps={imageResizingProps}
      />
    );
  };

  return withLink ? (
    <Link
      className="flex items-center justify-center"
      href={userGalleryPageLink()}
      target="_self"
    >
      {AvatarImageView()}
    </Link>
  ) : (
    AvatarImageView()
  );
}
