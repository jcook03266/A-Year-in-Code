"use client";
// Dependencies
// Types
import { FmUser } from "../../../../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Components
import UserAvatarImageView from "../../../../../../components/media-views/user-avatar-image-view/UserAvatarImageView";
import FonciiToolTip from "../../../../../../components/tool-tips/FonciiToolTip";
import CheckMarkToggle from "../../../../../../components/buttons/toggle-buttons/check-mark-toggle-button/CheckMarkToggle";

// Types
interface InfluencerDropDownRowProps {
  user: FmUser;
  toggled: boolean;
  valueOccurrenceFrequency: number;
  onToggleAction: () => void;
  disabled?: boolean;
}

export default function InfluencerDropDownRow({
  user,
  toggled,
  valueOccurrenceFrequency,
  onToggleAction,
  disabled = false,
}: InfluencerDropDownRowProps) {
  // Properties
  const username = user.username;

  // Formatting
  const socialMediaFormattedUsername = () => `@${username.toLowerCase()}`;

  // Subcomponents
  const UserAvatar = (): React.ReactNode => {
    return (
      <UserAvatarImageView
        user={user}
        className={'h-[20px] w-[20px] shrink-0'}
        imageResizingProps={{
          height: 60,
          width: 60,
          fit: MediaServerImageFitParams.cover,
          format: MediaServerImageFormatParams.f3,
        }}
      />
    );
  };

  const ItemFrequencyCounter = (): React.ReactNode => {
    return (
      <p className={`flex w-fit shrink-0 text-medium font-normal text-center text-[15px]`}>
        {valueOccurrenceFrequency}
      </p>
    );
  };

  const Content = () => {
    return (
      <div className="flex flex-row w-full overflow-hidden text-ellipsis shrink">
        {UserAvatar()}
        <p className={`w-fit h-fit shrink text-permanent_white font-normal text-[15px] text-start pl-2 overflow-hidden text-ellipsis`}>
          {socialMediaFormattedUsername()}
        </p>
      </div>
    );
  };

  return (
    <FonciiToolTip title={user.username}>
      <button
        className={`flex flex-row items-center justify-between overflow-hidden h-fit w-full gap-x-[8px] p-[8px] transition-opacity ease-in-out hover:opacity-75`}
        onClick={onToggleAction}
        disabled={disabled}
      >
        <CheckMarkToggle toggled={toggled} className="rounded" />
        {Content()}
        <ItemFrequencyCounter />
      </button>
    </FonciiToolTip>
  );
}
