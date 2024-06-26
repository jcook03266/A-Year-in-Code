"use client";
// Dependencies
// Types
import { ShareEventType } from "../../../__generated__/graphql";

// Hooks
import { useRouteObserver } from "../../../hooks/UseRouteObserver";
import { useRouterSearchParams } from "../../../hooks/UseRouterSearchParamsHook";

// URL State Persistence
import {
  SharedURLParameters,
  currentPageCanonicalURL,
} from "../../../core-foncii-maps/properties/NavigationProperties";

// Components
import InfluencerMatchAvatar from "../../../components/media-views/influencer-match-avatar/InfluencerMatchAvatar";
import ShareSheetPopoverMenu from "../../menus/share-sheets/ShareSheetPopoverMenu";
import Skeleton from "../../../components/utility-components/skeleton/Skeleton";
import { CreatorSocialMediaLinkButton } from "../../../components/buttons/links/creator-social-media-link-button/CreatorSocialMediaLinkButton";

// Formatting
import { possessiveFormattedUsernameCopy } from "../../../utilities/formatting/textContentFormatting";

// Redux
import {
  getFonciiUserSlice,
  getVisitedUserSlice,
} from "../../../redux/operations/selectors";

// Animation
import { motion, AnimatePresence } from "framer-motion";

interface GalleryAuthorHeaderProps {
  /** Use this to hide this component when the gallery list view is enabled */
  hideWhenListViewEnabled?: boolean;
}

export default function GalleryAuthorHeader({
  hideWhenListViewEnabled = false,
}: GalleryAuthorHeaderProps): React.ReactNode {
  // Observers
  const routeObserver = useRouteObserver();

  // State Management
  const fonciiUser = getFonciiUserSlice()(),
    visitedUser = getVisitedUserSlice()();

  // URL State Persistence
  const routerSearchParams = useRouterSearchParams();

  const shouldDisplayGalleryAsList = (): boolean => {
    return (
      String(
        routerSearchParams.getParamValue(
          SharedURLParameters.galleryListFormatToggled
        )
      ) == "true"
    );
  };

  // Convenience
  const shouldDisplay = (): boolean => {
    const beingBlocked =
      routeObserver.postDetailViewActive() ||
      routeObserver.restaurantDetailViewActive(),
      hidingBecauseOfListView =
        hideWhenListViewEnabled && shouldDisplayGalleryAsList();

    return !beingBlocked && !hidingBecauseOfListView;
  };

  // Properties
  const user = routeObserver.isGalleryBeingViewedByAuthor()
    ? fonciiUser.user
    : visitedUser.user,
    integrationCredentials = routeObserver.isGalleryBeingViewedByAuthor()
      ? fonciiUser.integrationCredentials
      : visitedUser.integrationCredentials,
    percentMatchScore = routeObserver.isGalleryBeingViewedByAuthor()
      ? undefined
      : visitedUser.user?.tasteProfileSimilarityScore ?? undefined; // Calculated when visiting another user, undefined for now until implemented

  // Share Sheet
  const shareSheetSubject = (): string =>
    `Explore ${possessiveFormattedUsernameCopy(username)} map on Foncii`,
    userGalleryShareSheetLink = (): string =>
      typeof location == "undefined" ? "" : currentPageCanonicalURL(location);

  // Simple stylistic copy button title indicative of the gallery author's identity
  const shareSheetCopyButtonTitle = (): string => {
    return `foncii.com/${username}`;
  };

  // Parsing
  const username = user?.username,
    computedUserMapName = `${possessiveFormattedUsernameCopy(username)} Map`,
    socialMediaFormattedUsername = `${username}`;

  // Subcomponents
  const InfluencerMetadataSection = (): React.ReactNode => {
    return (
      <div className="flex flex-row gap-y-[4px]">
        <div className="flex flex-col text-permanent_white opacity-90 font-normal justify-center">
          {/** Map Name */}
          {user ? (
            <p className="font-semibold text-[18px] text-ellipsis">
              {computedUserMapName}
            </p>
          ) : (
            <Skeleton className="h-[30px] w-[200px]" />
          )}

          <div className="flex h-[4px] w-full" />
          <div className="flex flex-row gap-x-[8px] h-[20px] items-center justify-start">
            {/** Share Sheet */}
            {user ? (
              <ShareSheetPopoverMenu
                url={userGalleryShareSheetLink()}
                subject={shareSheetSubject()}
                customCopyButtonTitle={shareSheetCopyButtonTitle()}
                toggleButtonClassName={"h-[20px] w-[20px]"}
                shareEventType={ShareEventType.UserGallery}
                popoverOrientation="right"
              />
            ) : (
              <Skeleton className="h-[20px] w-[20px]" />
            )}

            {/** Social Media Links */}
            {integrationCredentials.map((integrationCredential, index) => {
              return user ? (
                <CreatorSocialMediaLinkButton
                  key={index}
                  userIntegrationCredential={integrationCredential}
                  className={"h-[20px] w-[20px]"}
                />
              ) : (
                <Skeleton key={index} className="h-[20px] w-[20px]" />
              );
            })}

            {/** Username */}
            {user ? (
              <p className="text-[16px] text-ellipsis">
                @{socialMediaFormattedUsername}
              </p>
            ) : (
              <Skeleton className="h-[20px] w-[100px]" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return shouldDisplay() ? (
    <AnimatePresence>
      <motion.div
        className="flex flex-row gap-x-[16px] justify-start w-full h-fit pointer-events-auto p-[8px] pr-[16px] bg-black xl:bg-inherit rounded-[10px] shadow-md xl:shadow-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <InfluencerMatchAvatar
          user={user}
          percentMatchScore={percentMatchScore}
          className={"h-[50px] w-[50px]"}
        />
        {InfluencerMetadataSection()}
      </motion.div>
    </AnimatePresence>
  ) : undefined;
}
