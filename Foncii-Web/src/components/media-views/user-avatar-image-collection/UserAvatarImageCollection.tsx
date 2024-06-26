// Dependencies
// Types
import { FmUser } from "../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Components
import UserAvatarImageView from "../user-avatar-image-view/UserAvatarImageView";

// Managers
import UserManager from "../../../managers/userManager";

/**
 * Displays a collection of user avatars
 *
 * @param users
 */
export default function UserAvatarImageCollection({
  users,
}: {
  users?: FmUser[];
}) {
  // Properties
  // Cut-off after 3 users back to back and display the numeric bubble to indicate more
  const maxUsersToShow = 3;

  // The number to display for the `additionalUsersIndicatorBubble` subcomponent's text content
  const additionalUsersCount = (): number => {
    if (!users) return 0;

    return Math.max(0, users.length - maxUsersToShow);
  };

  // Conditional Logic
  // Only display this label when defined and valid dimensional data is passed
  const shouldRender = (): boolean => {
    return users != undefined && users?.length > 0;
  };

  const shouldDisplayAdditionalUsersIndicator = (): boolean => {
    return additionalUsersCount() > 0;
  };

  // Sorting logic
  // Alphabetically sort the users by id so that appear in the same order every time they're rendered
  // this also prevents sorting by mutable properties like a username which can be exploited by users to show
  // their card in front of all of the other users. Since ID gen is random this is a fair way to display users consistently.
  function sortedUsers(): FmUser[] {
    if (!users) return [];

    return users.sort((a, b) => {
      return a.id.localeCompare(b.id, undefined, { ignorePunctuation: true });
    });
  }

  // Subcomponents
  // Displays the avatar of the target user (if any)
  const UserBubble = (user: FmUser, index: number = 0): React.ReactElement => {
    const zIndex = index + 1;

    return (
      <div
        id={user.id}
        key={user.id}
        className={`flex items-center justify-center rounded-full h-fit w-fit shrink-0 drop-shadow-lg`}
        style={{
          zIndex,
          marginLeft: index > 0 ? "-5px" : "0px",
        }}
      >
        {/** 'withLink' allows bots to crawl user galleries from this component */}
        <UserAvatarImageView
          user={user}
          withLink
          className={"h-[20px] w-[20px]"}
          isCurrentUser={UserManager.shared.currentUser()?.id == user.id}
          imageResizingProps={{
            height: 60,
            width: 60,
            fit: MediaServerImageFitParams.cover,
            format: MediaServerImageFormatParams.f3,
          }}
        />
      </div>
    );
  };

  // Numeric counter that displays the amount of users not rendered but still associated with a restaurant based on their ratings
  const AdditionalUsersIndicatorBubble = (): React.ReactElement | null => {
    if (!shouldDisplayAdditionalUsersIndicator()) return null;

    const zIndex = maxUsersToShow + 1;

    return (
      <div
        id="additional-users-indicator"
        key="additional-users-indicator"
        title={`${additionalUsersCount()} Additional Rating${additionalUsersCount() > 1 ? "s" : ""
          }`}
        className={`flex flex-shrink justify-center items-center bg-primary rounded-full w-[18px] h-[18px] text-left text-ellipsis drop-shadow-lg`}
        style={{
          zIndex,
          marginLeft: "-5px",
        }}
      >
        <p
          className={`text-permanent_white font-normal text-[9px]`}
        >{`+${additionalUsersCount()}`}</p>
      </div>
    );
  };

  // Conditional rendering logic
  if (!shouldRender()) return null;

  return (
    <div className="flex flex-row flex-nowrap gap-x-[-10px] items-center justify-center">
      {sortedUsers()
        .slice(0, maxUsersToShow)
        .map((user, index) => {
          return <span key={index}>{UserBubble(user, index)}</span>;
        })}
      {AdditionalUsersIndicatorBubble()}
    </div>
  );
}
