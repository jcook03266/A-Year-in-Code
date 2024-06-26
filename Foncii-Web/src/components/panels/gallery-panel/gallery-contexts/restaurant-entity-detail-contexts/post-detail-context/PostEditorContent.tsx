/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import {
  FmUserPost,
  ShareEventType,
} from "../../../../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Hooks
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRouterSearchParams } from "../../../../../../hooks/UseRouterSearchParamsHook";

// Services
import { FonciiAPIClientAdapter } from "../../../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Redux
import {
  getFonciiUserSlice,
  getUserPostsSlice,
} from "../../../../../../redux/operations/selectors";
import {
  NotificationCenterActions,
  PostFiltersActions,
  UserPostsActions,
} from "../../../../../../redux/operations/dispatchers";

// Components
// Local
import ShareSheetPopoverMenu from "../../../../../menus/share-sheets/ShareSheetPopoverMenu";
import PercentMatchLabel from "../../../../../labels/percent-match-label/PercentMatchLabel";
import { PostSourcePermaLink } from "../../../../../buttons/restaurant-entity-buttons/post-source-permalink/PostSourcePermaLink";
import DynamicRoundedCTAButton from "../../../../../buttons/call-to-action/dynamic-rounded-cta-button/DynamicRoundedCTAButton";
import UserAvatarImageView from "../../../../../media-views/user-avatar-image-view/UserAvatarImageView";
import PlacesAutocompleteWidget from "../../../../../place-autocomplete-widget/container/PlacesAutocompleteWidget";
import PostEditorTagBox from "../../../../../inputs/post-editor-tag-box/container/PostEditorTagBox";
import PostEditorTextBox from "../../../../../inputs/post-editor-textbox/PostEditorTextBox";
import PostMediaUploadView, {
  MediaSelectionUpdate,
} from "../../../../../../components/media-views/post-media-upload-view/PostMediaUploadView";
import FonciiToolTip from "../../../../../../components/tool-tips/FonciiToolTip";
import { FavoritePostButton } from "../../../../../buttons/restaurant-entity-buttons/favorite-post-button/FavoritePostButton";
import PostMediaCarousel from "../../../../../../components/media-views/media-carousels/post-media-carousel/PostMediaCarousel";

// External
import Image from "next/image";
import { Slider } from "@mui/base/Slider";

// Formatting
import { possessiveFormattedUsernameCopy } from "../../../../../../utilities/formatting/textContentFormatting";

// Assets
import { ImageRepository } from "../../../../../../../public/assets/images/ImageRepository";
import ColorRepository, {
  ColorEnum,
} from "../../../../../../../public/assets/ColorRepository";

// Navigation
import {
  NavigationProperties,
  SharedURLParameters,
} from "../../../../../../core-foncii-maps/properties/NavigationProperties";

// Notifications
import { NotificationTemplates } from "../../../../../../core-foncii-maps/repositories/NotificationTemplates";

// Dialogs
import ConfirmationDialog from "../../../../../dialogs/confirmation-dialog/ConfirmationDialog";
import { DialogTemplates } from "../../../../../../core-foncii-maps/repositories/DialogTemplates";

// Managers
import UserManager from "../../../../../../managers/userManager";

// Utilities
import { cn } from "../../../../../../utilities/development/DevUtils";
import { areCollectionsEqual } from "../../../../../../utilities/math/collectionMath";
import {
  clampNumber,
  isInRange,
} from "../../../../../../utilities/math/commonMath";
import { DateFormatter } from "../../../../../../utilities/formatting/miscFormatters";
import {
  RegexPatterns,
  isInputValidAgainstPattern,
} from "../../../../../../utilities/common/regex";
import { UnitsOfTimeInMS } from "../../../../../../utilities/common/time";

// Post Editor UI for authors editing / creating their posts
export default function PostEditorContent({
  userPost,
  scrollContainerRef,
  isPresentedModally = true,
}: {
  userPost?: FmUserPost;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  /** True if the detail context isn't presented as a page (interstitial screen), and is presented as a modal, true by default */
  isPresentedModally?: Boolean;
}) {
  // Services
  const apiService = new FonciiAPIClientAdapter();

  // Parsing
  // Restaurant
  const fonciiRestaurant = userPost?.fonciiRestaurant ?? undefined,
    restaurant = fonciiRestaurant?.restaurant,
    restaurantName = restaurant?.name,
    percentMatchScore = fonciiRestaurant?.percentMatchScore ?? undefined,
    qualityScore = fonciiRestaurant?.qualityScore,
    // Creator
    creator = userPost?.creator,
    username = creator?.username,
    userID = creator?.id,
    // Post
    postID = userPost?.id,
    postIsAVideo = userPost?.mediaIsVideo ?? false,
    // Post Metadata
    dataSourceProperties = userPost?.dataSource,
    // Custom User Properties
    customUserProps = userPost?.customUserProperties,
    creatorTags = customUserProps?.categories ?? [],
    creatorNotes = customUserProps?.notes,
    sourcePostCaptionText = dataSourceProperties?.caption, // Initial value of the creator notes
    // Ratings
    creatorRating = customUserProps?.rating ?? undefined,
    // Deletion
    postMarkedForDeletion = userPost?.deletionPending ?? false,
    // Locally formatted date string (not UTC, converts using the client's system time)
    deletionDateString = userPost?.scheduledDeletionTimestamp
      ? DateFormatter.formatDateToMDY(
        new Date(userPost.scheduledDeletionTimestamp)
      )
      : undefined;

  // Share Sheet
  // The fallback string is just in case something fails, used to indicate missing data somewhere
  const shareSheetSubject = (): string =>
    `Check out my post about ${restaurantName} on Foncii 🍜📍`,
    postDetailViewShareSheetLink = (): string =>
      typeof location == "undefined" ? "" : location.href;

  const shareSheetCopyButtonTitle = (): string => {
    return `${restaurantName} • ${username}`;
  };

  // Routing
  const router = useRouter();

  // URL State Persistence
  const routerSearchParams = useRouterSearchParams();

  // State Management
  // Redux
  const userPosts = getUserPostsSlice()();
  const fonciiUser = getFonciiUserSlice()();

  // UI Visibility Modifiers
  const [confirmationDialogVisible, setConfirmationDialogVisible] =
    useState(false);

  // Input Limits
  // Slider
  const maxRatingValue = 5,
    minRatingValue = 0,
    ratingStepSize = 0.1;

  // Creator Notes Text Box
  const maxCreatorNotesLength = 3000; // Max as per the backend ~ Keep this up to date to prevent unintended truncations and data loss

  // Inputs
  // Post media uploads for new experiences
  const [selectedMediaFileData, setSelectedMediaFileData] = useState<
    Uint8Array | undefined
  >(undefined),
    [
      selectedVideoMediaThumbnailFileData,
      setSelectedVideoMediaThumbnailFileData,
    ] = useState<Uint8Array | undefined>(undefined);

  // Associated Restaurant Selection
  let associatedRestaurant = restaurant,
    associatedRestaurantPlaceID = associatedRestaurant?.googleID,
    associatedRestaurantNameAndAddress: string | undefined =
      associatedRestaurant
        ? `${associatedRestaurant?.name}, ${associatedRestaurant?.addressProperties.formattedAddress}`
        : undefined;

  const [
    selectedAssociatedRestaurantPlaceID,
    setSelectedAssociatedRestaurantPlaceID,
  ] = useState<string | undefined>(undefined);

  // Creator Rating
  const offset = 0.5;
  const ratingInitialValue = creatorRating ?? 0,
    [ratingValue, setRatingValue] = useState<number>(ratingInitialValue);
  const ratingSliderInitialValue = creatorRating ? creatorRating - offset : 0,
    [ratingSliderValue, setRatingSliderValue] = useState<number>(
      ratingSliderInitialValue
    );

  // Creator Tags
  const creatorTagsInitialValue = creatorTags ?? [],
    [editableCreatorTags, setEditableCreatorTags] = useState<string[]>(
      creatorTagsInitialValue
    );

  // Creator Notes
  const creatorNotesInitialValue = creatorNotes ?? "",
    creatorNotesOriginalValue = sourcePostCaptionText ?? "",
    [creatorNotesCurrentValue, setCreatorNotesCurrentValue] = useState<string>(
      creatorNotesInitialValue
    );

  // Ratings
  const [ratingPlaceholder, setRatingPlaceholder] = useState<string>("🤔");

  // Post auto-save functionality
  const postAutoSaveTimeout = useRef<NodeJS.Timeout>();

  // Constants
  const POST_AUTO_SAVE_INTERVAL_IN_MS = UnitsOfTimeInMS.second; // Performance Note: If the user is typing we want to limit save requests - JP

  useEffect(() => {
    // Cancel any pending timeout event
    clearTimeout(postAutoSaveTimeout.current);

    postAutoSaveTimeout.current = setTimeout(async () => {
      if (didChangesOccur()) {
        await updatePostAction();
      }
    }, POST_AUTO_SAVE_INTERVAL_IN_MS);

    return () => {
      clearTimeout(postAutoSaveTimeout.current);
      postAutoSaveTimeout.current = undefined;
    };
  }, [
    creatorNotesCurrentValue,
    ratingValue,
    editableCreatorTags,
    selectedMediaFileData,
  ]);

  // Text Descriptions
  const userRatingEditorSectionText = () =>
    `${possessiveFormattedUsernameCopy(creator?.firstName)} Rating - ${ratingValue > 0 ? `${ratingValue.toFixed(1)}/5.0` : "No Rating"
    }`,
    notesTextBoxPlaceholder =
      "Leave some comments on your post about the food, service and ambiance";

  // Convenience
  // Only posts with uploaded media can become visible, false ~ the post is new and doesn't have any uploaded media associated with it
  const hasUploadedMedia = (): boolean => {
    return (
      userPost?.media != undefined || userPost?.dataSource?.media != undefined
    );
  };

  const isPostMediaUploadPending = (): boolean => {
    return selectedMediaFileData != undefined;
  };

  const hasAssociatedRestaurantData = (): boolean => {
    return userPost?.fonciiRestaurant != undefined;
  };

  const isArticleLinkValid = (link: string): boolean => {
    return isInputValidAgainstPattern(link, RegexPatterns.URLRegexPattern);
  };

  // Only allow posts with uploaded media to be replicated as the duplicate
  // posts will only be able to use the parent post's media
  const canDuplicatePost = (): boolean => {
    return hasUploadedMedia();
  };

  const didChangesOccur = () => {
    const notesDidChange =
      creatorNotesCurrentValue.trim() != (creatorNotes ?? "").trim(),
      ratingDidChange =
        ratingValue != (creatorRating ?? 0) && creatorRating != undefined,
      tagsDidChange = !areCollectionsEqual(editableCreatorTags, creatorTags),
      // Only for new experiences
      mediaUploadPending = isPostMediaUploadPending();

    return (
      notesDidChange || ratingDidChange || tagsDidChange || mediaUploadPending
    );
  };

  // Action Handlers
  const handlePostMediaSelection = (media: MediaSelectionUpdate) => {
    setSelectedMediaFileData(media.selectedMediaData);
    setSelectedVideoMediaThumbnailFileData(
      media.selectedVideoMediaThumbnailData
    );
  };

  const onAutocompletePlaceIDSelection = async (selectedPlaceID: string) => {
    // Precondition failure, post ID required
    if (!postID) return;

    // Store the selected place ID
    setSelectedAssociatedRestaurantPlaceID(selectedPlaceID);

    // Don't trigger an update if the selection hasn't changed
    if (selectedPlaceID == selectedAssociatedRestaurantPlaceID) return;

    // Update the local store and the backend with this new associated restaurant selection
    const didSucceed = await UserPostsActions.setRestaurantForPost(
      selectedPlaceID,
      postID
    ),
      notPriorRestaurantData = associatedRestaurant == undefined;

    // Post now visible, inform user
    if (didSucceed && notPriorRestaurantData && hasUploadedMedia()) {
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostVisible
      );
    }
  };

  const onRatingValueChangeHandler = (
    _: Event | undefined,
    newValue: number | number[],
    __: number | undefined
  ) => {
    let rating = newValue as number;
    let ratingSlider = rating - offset;

    // Don't reflect of out of bound values, shunt any < 1 values to 0 and any > 5 values to 5
    if (rating < 1 || rating == undefined) {
      rating = 0;
      ratingSlider = 0;
    }
    if (rating >= maxRatingValue) {
      ratingSlider = maxRatingValue;
    }

    rating = clampNumber(rating, minRatingValue, maxRatingValue);
    setRatingValue(rating);
    setRatingSliderValue(ratingSlider);
    setRatingText(rating);
  };

  const onRatingSliderValueChangeHandler = (
    _: Event | undefined,
    newValue: number | number[],
    __: number | undefined
  ) => {
    let ratingSlider = newValue as number;
    let rating = ratingSlider + offset;

    // Don't reflect of out of bound values, shunt any < 1 values to 0 and any > 5 values to 5
    if (rating < 1 || rating == undefined) {
      rating = 0;
      ratingSlider = 0;
    }
    if (rating >= maxRatingValue) {
      ratingSlider = maxRatingValue;
    }

    rating = clampNumber(rating, minRatingValue, maxRatingValue);
    setRatingValue(rating);
    setRatingSliderValue(ratingSlider);
    setRatingText(rating);
  };

  const setRatingText = (rating: number) => {
    if (rating < 1) setRatingPlaceholder("🤔");
    else if (rating < 2) setRatingPlaceholder("😡");
    else if (rating < 3) setRatingPlaceholder("😞");
    else if (rating < 4) setRatingPlaceholder("😕");
    else if (rating < 5) setRatingPlaceholder("🙂");
    else setRatingPlaceholder("🤩");
  };

  const onCreatorTagsTagCollectionChangeHandler = (tags: string[]) => {
    setEditableCreatorTags(tags);
  };

  const onCreatorNotesTextInputChangeHandler = (newInput: string) => {
    setCreatorNotesCurrentValue(newInput);
  };

  // Actions
  // Perform this after starting the upload to clear the 'didchangesoccur' state
  const clearSelectedPostMedia = () => {
    setSelectedMediaFileData(undefined);
    setSelectedVideoMediaThumbnailFileData(undefined);
  };

  const deletePostConfirmationRequest = () => {
    setConfirmationDialogVisible(true);
  };

  const dismissConfirmationDialog = () => {
    setConfirmationDialogVisible(false);
  };

  const permanentlyDeletePostAction = async () => {
    if (!postID) return;

    const userID = fonciiUser.user?.id ?? "",
      didSucceed = await apiService.performForceDeletePost(userID, postID);

    if (didSucceed) {
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostPermanentlyDeleted
      );

      selfDismiss();
    } else {
      // Trigger error notif
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostDeletionError
      );
    }

    dismissConfirmationDialog();
  };

  const restorePostAction = async () => {
    if (!postID) return;

    const userID = fonciiUser.user?.id ?? "",
      didSucceed = await apiService.performUndeletePost(userID, postID);

    if (didSucceed) {
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostRestored
      );
    } else {
      // Trigger error notif
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostUpdateError
      );
    }
  };

  const markPostForDeletionAction = async () => {
    if (!postID) return;

    const userID = fonciiUser.user?.id ?? "",
      didSucceed = await apiService.performMarkPostForDeletion(userID, postID);

    if (didSucceed) {
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostMarkedForDeletion
      );

      selfDismiss();
    } else {
      // Trigger error notif
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostDeletionError
      );
    }

    dismissConfirmationDialog();
  };

  const duplicatePostAction = async () => {
    if (!postID) return;

    const newChildPost = await apiService.performDuplicatePost(postID), // Note: Post ID is the source post's id in this case, which is the current post being duplicated
      childPostID = newChildPost?.id ?? "",
      username = fonciiUser.user?.username ?? "";

    if (newChildPost) {
      // Trigger success notif and switch to the new duplicate post
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.SuccessfulPostDuplication
      );

      // Push the user to an isolated page instead of keeping them in the modal so that
      // the editor state can be reset by the new detail view component and not cause any stale
      // data conflicts.
      router.push(
        NavigationProperties.galleryPostDetailViewPageLink(
          username,
          childPostID
        )
      );
    } else {
      // Trigger error notif
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostDuplicationError
      );
    }
  };

  const clearAssociatedRestaurantAction = async () => {
    // Precondition failure, post ID required
    if (!postID) return;

    // Reset component state
    setSelectedAssociatedRestaurantPlaceID(undefined);

    (associatedRestaurant = undefined),
      (associatedRestaurantPlaceID = undefined),
      (associatedRestaurantNameAndAddress = undefined);

    // If there's no restaurant data available then there's nothing to clear
    if (!hasAssociatedRestaurantData()) return;

    // Pass undefined to clear the associated restaurant
    const didSucceed = await UserPostsActions.setRestaurantForPost(
      undefined,
      postID
    );

    // Post now hidden, inform user
    if (didSucceed) {
      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.PostHidden
      );
    }
  };

  // Update the custom user attributes associated with this post
  const updatePostAction = async () => {
    // Precondition failure / Nothing to update, return early
    if (!userPost || !postID || !didChangesOccur()) return;

    // Update the post's custom user props first
    await UserPostsActions.updatePostCustomUserProperties({
      postID,
      rating: ratingValue,
      notes: creatorNotesCurrentValue,
      categories: editableCreatorTags,
    });

    // Upload selected user post media (if any and if this is a new experience (post))
    if (isPostMediaUploadPending() && userID) {
      UserPostsActions.updatePostMedia({
        userID,
        postID,
        mediaFileDataBuffer: selectedMediaFileData,
        videoThumbnailFileDataBuffer: selectedVideoMediaThumbnailFileData,
      });

      clearSelectedPostMedia();
    }
  };

  const selfDismiss = () => {
    // Required pre-process to ensure the URL-state's local store is updated so the state isn't persisted when the URL updates
    routerSearchParams.removeParams([
      SharedURLParameters.selectedPost,
      SharedURLParameters.detailViewForPost,
      SharedURLParameters.isEditingPost,
    ]);

    PostFiltersActions.clearCurrentlySelectedPostID();

    router.replace(NavigationProperties.userGalleryPageLink());
  };

  // Subcomponents
  const PostHeroHeader = (): React.ReactNode => {
    if (!userPost) return;

    return (
      <div className="relative w-full h-fit">
        <div className={`w-full h-[210px] sm:h-[320px] xl:h-[400px] rounded-[10px] shadow-lg overflow-hidden transition-all duration-300 ease-in-out`}>
          {hasUploadedMedia() ? (
            <PostMediaCarousel
              post={userPost}
              imageResizingProps={{
                height: 600,
                width: 750,
                fit: MediaServerImageFitParams.cover,
                format: MediaServerImageFormatParams.f3,
              }}
            />
          ) : (
            <PostMediaUploadView
              onMediaSelectionUpdate={handlePostMediaSelection}
            />
          )}
        </div>

        <div className="absolute top-0 left-0 p-[8px]">
          <PercentMatchLabel
            percentMatchScore={percentMatchScore}
            qualityScore={qualityScore}
            blurQualityScore={!UserManager.shared.userAuthenticated()}
          />
        </div>
      </div>
    );
  };

  const TopPrompt = (): React.ReactNode => {
    const prompt = !hasUploadedMedia() ? "New Experience" : "Edit Experience";
    return (
      <p className="text-[18px] xl:text-[20px] text-permanent_white font-medium shrink-0 line-clamp-1 w-fit h-fit">
        {prompt}
      </p>
    );
  };

  const SocialButtons = (): React.ReactNode => {
    return (
      <div className="flex flex-row gap-x-[12px] pl-[8px] items-center justify-center">
        {userPost ? <PostSourcePermaLink post={userPost} /> : undefined}

        {hasAssociatedRestaurantData() ? (
          <ShareSheetPopoverMenu
            url={postDetailViewShareSheetLink()}
            subject={shareSheetSubject()}
            customCopyButtonTitle={shareSheetCopyButtonTitle()}
            shareEventType={ShareEventType.UserPost}
          />
        ) : undefined}
      </div>
    );
  };

  const DeletePostButton = (): React.ReactNode => {
    const icon = ImageRepository.UtilityIcons.DeleteTrashIcon;

    return (
      <button
        className={cn(
          `h-[24px] w-fit items-center justify-center opacity-100 hover:opacity-70 transition-all active:scale-90`
        )}
        aria-label="Delete experience button"
        onClick={deletePostConfirmationRequest}
      >
        <FonciiToolTip
          title={
            postMarkedForDeletion
              ? "Permanently delete this experience"
              : "Delete this experience"
          }
        >
          <Image
            className="h-[24px] w-fit"
            src={icon}
            width={24}
            height={24}
            alt="Delete Post Button Icon"
          />
        </FonciiToolTip>
      </button>
    );
  };

  const DuplicatePostButton = (): React.ReactNode => {
    if (!canDuplicatePost()) return;

    const icon = ImageRepository.UtilityIcons.DuplicateIcon;

    return (
      <button
        className="items-center justify-center hover:opacity-70 transition-all active:scale-90 h-[24px] w-fit"
        aria-label="Duplicate Experience Button"
        onClick={duplicatePostAction}
      >
        <FonciiToolTip title="Duplicate this experience">
          <Image
            className="h-[24px] w-fit"
            src={icon}
            width={24}
            height={24}
            alt="Duplicate Post Button Icon"
          />
        </FonciiToolTip>
      </button>
    );
  };

  const FavoritePostActionButton = (): React.ReactNode => {
    if (!userPost) return;

    return <FavoritePostButton post={userPost} />;
  };

  const ActionButtons = (): React.ReactNode => {
    return (
      // Note: Moves slightly to the left when the view is presented as a page (non-modally) to make room for the close button
      <div
        className={cn(
          "flex flex-row gap-x-[16px] items-center justify-center w-fit h-fit",
          isPresentedModally ? "" : "pr-[40px] sm:pr-[0px]"
        )}
      >
        {SocialButtons()}
        {DuplicatePostButton()}
        {FavoritePostActionButton()}
        {DeletePostButton()}
      </div>
    );
  };

  // Section Factory
  const LabeledSectionFactory = (
    { children }: any,
    title: string,
    withBorder: boolean = true
  ): React.ReactNode => {
    const interior = (
      <>
        <p
          className={`text-permanent_white text-[16px] md:text-[18px] font-normal line-clamp-1 leading-normal shrink-0`}
        >
          {title}
        </p>
        {children}
      </>
    );

    return withBorder ? (
      <div
        className={`flex flex-col gap-y-[5px] border-l-[1px] border-l-primary py-[10px] pl-[20px]`}
      >
        {interior}
      </div>
    ) : (
      interior
    );
  };

  /**
   * A quick selector for selecting explicit creator ratings without using the slider.
   *
   * @param value - Slider rating value to be selected, also acts as the label for the selector as well.
   */
  const UserRatingQuickSelector = ({
    value,
    sliderValue,
  }: {
    value: number;
    sliderValue: number;
  }): React.ReactNode => {
    if (!isInRange(value, maxRatingValue, minRatingValue)) return;

    // Properties
    const lowerBound = value - 1,
      normalizedSliderValue = sliderValue - lowerBound,
      normalizedUpperBound = value - lowerBound,
      fillPercentage = Math.max(
        normalizedSliderValue / normalizedUpperBound,
        0
      ),
      // If the width is absolute 0 the whole shape is filled with the gradient, keep it above abs 0
      fillWidth = Math.max(20 * fillPercentage, 0.0001);

    return (
      <button
        className={`hover:opacity-75 transition-all active:scale-90 flex items-center justify-center w-full h-[30px] overflow-hidden ease-in-out`}
        onClick={() => onRatingValueChangeHandler(undefined, value, undefined)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M12.8339 7.02963L10.9794 0.970757L12.8339 7.02963ZM12.8339 7.02963V7.25482H13.0839H18.7314C19.7219 7.25482 20.1245 8.50564 19.3224 9.08052C19.3223 9.08064 19.3221 9.08075 19.322 9.08087L14.7034 12.3543L14.5551 12.4594L14.6094 12.6329L16.4242 18.4382L16.4243 18.4386C16.7168 19.3693 15.6241 20.1378 14.8343 19.5373L14.8337 19.5368L10.1507 15.9982L10.0003 15.8845L9.84962 15.9979L5.16664 19.524L5.16571 19.5247C4.3759 20.1252 3.28324 19.3567 3.57572 18.426L3.57584 18.4257L5.39065 12.6203L5.44488 12.4468L5.2966 12.3418L0.677075 9.06759L0.676341 9.06707C-0.121412 8.50594 0.275392 7.24223 1.26859 7.24223H6.91609H7.10065L7.155 7.06586L9.03327 0.970872L9.03328 0.970876L9.03401 0.968431C9.31727 0.0147905 10.6821 0.00559427 10.9793 0.970417L12.8339 7.02963Z"
            fill={`url(#${fillWidth}-${value})`}
            stroke="#2F3447"
            strokeWidth="0.5"
          />
          <defs>
            <linearGradient
              id={`${fillWidth}-${value}`}
              x1={fillWidth}
              y1="2.9495e-07"
              x2="0"
              y2="1.41771e-07"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={ColorRepository.colors[ColorEnum.neutral]} />
              <stop stopColor={ColorRepository.colors["primary"]} />
            </linearGradient>
          </defs>
        </svg>
      </button>
    );
  };

  const UserRatingEditor = (): React.ReactNode => {
    if (!userPost || !creator) return undefined;

    // Properties
    const ratingQuickSelectorValues = [1, 2, 3, 4, 5];

    return (
      <div
        className={`flex flex-col gap-y-[16px] items-center h-fit w-full pb-[10px]`}
      >
        {/** User Rating Description | Avatar + Rating */}
        <div
          className={`flex flex-row gap-x-[8px] w-full h-fit items-center justify-start`}
        >
          <div className="w-[30px] h-[30px]">
            <UserAvatarImageView
              user={creator!}
              isCurrentUser
              imageResizingProps={{
                height: 60,
                width: 60,
                fit: MediaServerImageFitParams.cover,
                format: MediaServerImageFormatParams.f3,
              }}
            />
          </div>
          <p
            className={`text-permanent_white font-normal text-[15px] leading-normal line-clamp-1`}
          >
            {userRatingEditorSectionText()}
          </p>
        </div>

        <div className="flex flex-row gap-x-[8px] w-full h-fit items-center justify-start">
          <div className="flex flex-col gap-y-[16px] items-center justify-start gap-x-[20px] w-full h-fit">
            <div className="flex flex-row gap-x-[8px] w-full h-fit items-center justify-start">
              {ratingQuickSelectorValues.map((value, index) => (
                <UserRatingQuickSelector
                  key={index}
                  sliderValue={ratingValue}
                  value={value}
                />
              ))}
            </div>
            {/** User Rating Slider Input */}
            <Slider
              value={ratingSliderValue}
              defaultValue={ratingSliderInitialValue}
              onChange={onRatingSliderValueChangeHandler}
              step={ratingStepSize}
              min={minRatingValue}
              max={maxRatingValue}
              slotProps={{
                thumb: {
                  className: `w-4 h-4 -mt-[6px] -ml-1 flex items-center justify-center bg-${ColorEnum.permanent_white} rounded-full shadow absolute`,
                },
                root: {
                  className: "w-full relative inline-block h-2 cursor-pointer",
                },
                rail: {
                  className: `bg-${ColorEnum.neutral} h-1 w-full rounded-full block absolute`,
                },
                track: {
                  className: `bg-${ColorEnum.primary} h-1 absolute rounded-full`,
                },
              }}
            />
          </div>
          {/** Call To Action */}
          <div className="flex shrink-0 w-[40px] justify-center items-center">
            <p className="text-neutral text-[30px] font-normal w-fit self-center">
              {ratingPlaceholder}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ClearAssociatedRestaurantButton = (): React.ReactNode => {
    const title = "Clear Restaurant";

    return hasAssociatedRestaurantData() ? (
      <div className="flex flex-col gap-y-[10px] justify-center items-center w-full h-fit">
        <DynamicRoundedCTAButton
          title={title}
          onClickAction={clearAssociatedRestaurantAction}
          className="w-full"
        />
        <p className="text-[12px] text-medium font-normal text-center">
          {
            "Note: Removing an associated restaurant from your post will hide it automatically."
          }
        </p>
      </div>
    ) : undefined;
  };

  const PendingPostDeletionBanner = (): React.ReactNode => {
    if (!postMarkedForDeletion) return;

    return (
      <div className="flex flex-row items-center w-full h-fit py-[8px] px-[16px] justify-between rounded-[8px] shadow-xl border-[1px] border-primary bg-black">
        <p className="text-primary font-semibold text-[14px]">{`This experience will be deleted on ${deletionDateString}`}</p>

        <FonciiToolTip title="Undo this deletion">
          <button
            className="flex items-center justify-center bg-primary text-[14px] text-permanent_white font-normal px-[8px] py-[4px] h-full rounded-full hover:opacity-75 active:scale-90 ease-in-out transition-all shrink-0"
            onClick={restorePostAction}
          >
            Restore
          </button>
        </FonciiToolTip>
      </div>
    );
  };

  // Component Sections
  const HeaderSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[16px] w-full h-fit items-start justify-center">
        <PendingPostDeletionBanner />

        <div className="flex flex-row justify-between items-center w-full h-fit">
          {TopPrompt()}
          {ActionButtons()}
        </div>
        <div className="flex flex-col w-full h-fit items-end">
          {PostHeroHeader()}
          {TemporalMetadataSection()}
        </div>

        {!hasUploadedMedia() ? (
          <p className="w-full h-fit text-medium font-normal text-[14px]">
            {
              "Supported Files: JPEG, PNG, MP4, MOV. Max File Size: 200MB Videos | 30MB Images"
            }
          </p>
        ) : undefined}
      </div>
    );
  };

  const RestaurantEditorSection = (): React.ReactNode => {
    const title = restaurantName ?? "Restaurant Name";

    return LabeledSectionFactory(
      {
        children: (
          <div
            className={`flex flex-col gap-y-[16px] transition-all ease-in-out`}
          >
            <PlacesAutocompleteWidget
              initialSelectedSearchResultPlaceID={associatedRestaurantPlaceID}
              searchBarPlaceholder={associatedRestaurantNameAndAddress}
              onSelect={onAutocompletePlaceIDSelection}
            />
            {ClearAssociatedRestaurantButton()}
          </div>
        ),
      },
      title,
      false
    );
  };

  const UserRatingEditorSection = (): React.ReactNode => {
    const title = "Your rating";

    return LabeledSectionFactory(
      {
        children: UserRatingEditor(),
      },
      title,
      false
    );
  };

  const UserTagEditorSection = (): React.ReactNode => {
    const title = "Experience tags";

    return LabeledSectionFactory(
      {
        children: (
          <PostEditorTagBox
            initialTags={editableCreatorTags}
            tagsDidChangeCallback={onCreatorTagsTagCollectionChangeHandler}
          />
        ),
      },
      title,
      false
    );
  };

  const NoteEditorSection = (): React.ReactNode => {
    const title = "Notes for viewers";

    return LabeledSectionFactory(
      {
        children: (
          <PostEditorTextBox
            initialTextInput={creatorNotesInitialValue}
            revertableTextInput={creatorNotesOriginalValue}
            maxTextInputLength={maxCreatorNotesLength}
            textInputDidChangeCallback={onCreatorNotesTextInputChangeHandler}
            placeholder={notesTextBoxPlaceholder}
            showButtons={false}
          />
        ),
      },
      title,
      false
    );
  };

  // Metadata related to post creation / update event logging timestamps
  const TemporalMetadataSection = (): React.ReactNode => {
    const lastUpdatedDate = userPost!.lastUpdated,
      formattedLastUpdatedDate = lastUpdatedDate
        ? DateFormatter.formatDateToMDYHMS(new Date(lastUpdatedDate))
        : "";

    const loading = userPosts.isLoading;

    return (
      <div className="flex flex-row gap-x-[4px] text-neutral text-[12px] font-normal h-fit">
        {loading ? (
          <div className="flex flex-row">
            <p>{` Saving...`}</p>
            <Image
              className="pl-[6px] h-[14px] w-[14px] opacity-70 self-center"
              src={ImageRepository.UtilityIcons.RefreshIcon}
              alt={`Refresh Icon`}
              unselectable="on"
            />
          </div>
        ) : (
          <p>{`Saved On ${formattedLastUpdatedDate}`}</p>
        )}
      </div>
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      className="border-[1px] border-medium_dark_grey bg-black xl:bg-transparent p-[16px] overflow-x-hidden overflow-y-auto h-full w-full max-w-[590px]"
    >
      <div className=" flex flex-col gap-y-[16px] h-fit w-full pb-[20px]">
        {HeaderSection()}
        {RestaurantEditorSection()}
        {UserRatingEditorSection()}
        {UserTagEditorSection()}
        {NoteEditorSection()}
      </div>

      {/** Dialogs */}
      <ConfirmationDialog
        confirmationDialogTemplate={
          postMarkedForDeletion
            ? DialogTemplates.PermanentlyDeletePostConfirmation({
              onCancel: dismissConfirmationDialog,
              onConfirm: permanentlyDeletePostAction,
            })
            : DialogTemplates.MarkPostForDeletionConfirmation({
              onCancel: dismissConfirmationDialog,
              onConfirm: markPostForDeletionAction,
            })
        }
        isDisplayed={confirmationDialogVisible}
      />
    </div>
  );
}
