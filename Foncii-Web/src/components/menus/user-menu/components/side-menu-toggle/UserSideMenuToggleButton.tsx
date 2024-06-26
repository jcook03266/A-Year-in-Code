// Dependencies
// Types
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Components
// Local
import FonciiToolTip from "../../../../tool-tips/FonciiToolTip";
import UserAvatarImageView from "../../../../media-views/user-avatar-image-view/UserAvatarImageView";

// Routing
import { useRouterSearchParams } from "../../../../../hooks/UseRouterSearchParamsHook";

// URL-State Persistence
import { SharedURLParameters } from "../../../../../core-foncii-maps/properties/NavigationProperties";

// Managers
import UserManager from "../../../../../managers/userManager";

/**
 * A combination of the usual user avatar view and the user menu drop down
 */
export default function UserSideMenuToggleButton(): React.ReactNode {
  // Routing
  const routerSearchParams = useRouterSearchParams();

  // Actions
  const toggleSideMenu = () =>
    routerSearchParams.toggleParam(SharedURLParameters.displaySideMenu, true);

  const AvatarView = (): React.ReactNode => {
    return (
      <UserAvatarImageView
        user={UserManager.shared.currentUser()}
        className={"h-[32px] w-[32px] shrink-0 shadow-xl"}
        isCurrentUser
        withToolTip={false}
        imageResizingProps={{
          height: 120,
          width: 120,
          fit: MediaServerImageFitParams.cover,
          format: MediaServerImageFormatParams.f3,
        }}
      />
    );
  };

  return (
    <FonciiToolTip title="Toggle side menu">
      <button
        onClick={toggleSideMenu}
        className="h-[30px] w-[30px] hover:opacity-75 transition-all ease-in-out active:scale-90"
      >
        {AvatarView()}
      </button>
    </FonciiToolTip>
  );
}
