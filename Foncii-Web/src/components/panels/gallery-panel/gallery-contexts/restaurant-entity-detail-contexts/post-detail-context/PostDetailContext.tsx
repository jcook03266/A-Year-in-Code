/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Framework
import Script from "next/script";

// Types
import {
  FmUserPost,
  ReservationAvailability,
  Restaurant,
  ShareEventType,
} from "../../../../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Hooks
import React, { useEffect, useRef, useState } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useRouteObserver } from "../../../../../../hooks/UseRouteObserver";
import { useRouterSearchParams } from "../../../../../../hooks/UseRouterSearchParamsHook";
import { useListeners } from "../../../../../../hooks/UseListeners";
import useEntityFilters from "../../../../../../hooks/UseEntityFilters";

// Managers
import UserManager from "../../../../../../managers/userManager";

// Services
import AnalyticsService, {
  AnalyticsEvents,
} from "../../../../../../services/analytics/analyticsService";
import { FonciiAPIClientAdapter } from "../../../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Redux
import {
  getFonciiUserSlice,
  getPostFiltersSlice,
  getUserPostsSlice,
  getVisitedUserSlice,
} from "../../../../../../redux/operations/selectors";
import {
  UserPostsActions,
  VisitedUserActions,
} from "../../../../../../redux/operations/dispatchers";

// Components
// Local
import SharedRestaurantDetailSections from "../shared-restaurant-detail-sections/SharedRestaurantDetailSections";
import ShareSheetPopoverMenu from "../../../../../menus/share-sheets/ShareSheetPopoverMenu";
import PercentMatchLabel from "../../../../../labels/percent-match-label/PercentMatchLabel";
import ReservationWidget from "../../../../../menus/reservation-menu/widget/ReservationWidget";
import EarliestTableTimeToggle from "../../../../../menus/reservation-menu/components/earliest-table-time-toggle/EarliestTableTimeToggle";
import RoundedDetailSelectorButton from "../shared-restaurant-detail-sections/components/RoundedDetailSelectorButton";
import CloseUtilityButton from "../../../../../buttons/utility-buttons/close-button/CloseUtilityButton";
import { PostSourcePermaLink } from "../../../../../buttons/restaurant-entity-buttons/post-source-permalink/PostSourcePermaLink";
import PostEditorContent from "./PostEditorContent";
import FonciiModal from "../../../../../../components/modals/foncii-base-modal/FonciiModal";
import UserAvatarImageView from "../../../../../../components/media-views/user-avatar-image-view/UserAvatarImageView";
import FonciiToolTip from "../../../../../../components/tool-tips/FonciiToolTip";
import { SaveRestaurantButton } from "../../../../../../components/buttons/restaurant-entity-buttons/save-restaurant-button/SaveRestaurantButton";
import { FavoritePostButton } from "../../../../../../components/buttons/restaurant-entity-buttons/favorite-post-button/FavoritePostButton";
import PostMediaCarousel from "../../../../../../components/media-views/media-carousels/post-media-carousel/PostMediaCarousel";

// External
import Image from "next/image";
import Link from "next/link";

// Formatting
import {
  possessiveFormattedString,
  possessiveFormattedUsernameCopy,
  uppercaseFirstLetterOnly,
} from "../../../../../../utilities/formatting/textContentFormatting";

// Assets
import { ImageRepository } from "../../../../../../../public/assets/images/ImageRepository";

// Navigation
import {
  ExternalLinks,
  NavigationProperties,
  SharedURLParameters,
  currentPageCanonicalURL,
} from "../../../../../../core-foncii-maps/properties/NavigationProperties";

// Styling
import ColorRepository from "../../../../../../../public/assets/ColorRepository";

// Structured Data Generators
import {
  postImageStructuredDataGenerator,
  postVideoStructuredDataGenerator,
  structuredPostRestaurantDataGenerator,
} from "../../../../../../repositories/structured-data-generators";

// Utilities
import { cn } from "../../../../../../utilities/development/DevUtils";
import { UnitsOfTimeInMS } from "../../../../../../utilities/common/time";

// Types
interface PostDetailContextProps {
  postID?: string;
  /** True if the detail context isn't presented as a page (interstitial screen), and is presented as a modal, true by default */
  isPresentedModally?: boolean;
  /** True if the user requested to edit this post from an external context, false otherwise (default) */
  isUserEditing?: boolean;
}

export default function PostDetailContext({
  postID,
  isPresentedModally = true,
  isUserEditing = false,
}: PostDetailContextProps): React.ReactNode {
  // Routing
  const router = useRouter();
  const routeObserver = useRouteObserver();

  // URL-State Persistence
  const routerSearchParams = useRouterSearchParams();
  const searchParams = useSearchParams();

  // State Management
  const fonciiUser = getFonciiUserSlice()(),
    entityFilterState = getPostFiltersSlice()(),
    userPosts = getUserPostsSlice()(),
    visitedUser = getVisitedUserSlice()();

  const entityFilters = useEntityFilters();

  // Initial Data Provisioning
  // A repository of all loaded local data, used to search for the data to display,
  // if available locally, before searching remotely for it.
  const allLocalData = (): FmUserPost[] => {
    const visitedUserPosts = visitedUser?.posts ?? [],
      currentUserPosts = userPosts?.posts,
      allPosts = [...currentUserPosts, ...visitedUserPosts];

    return allPosts;
  };

  const searchForDataLocally = (): FmUserPost | undefined => {
    return allLocalData().find((cachedPost) => {
      return cachedPost.id == postID;
    });
  };

  // State Management
  // Event Analytics
  const viewEventTimeout = useRef<NodeJS.Timeout>();

  // Reservation Availability Polling
  const reservationAvailabilitiesInterval = useRef<NodeJS.Timeout>();

  // Primary Data
  // The data to display, undefined originally but located either locally or remotely and then populated
  const [userPost, setUserPost] = useState<FmUserPost | undefined>(
    searchForDataLocally()
  ),
    // Triggered when the data is being loaded, on load by default
    [loading, setLoading] = useState(true),
    [loadingReservationAvailabilities, setLoadingReservationAvailabilities] =
      useState(false),
    // Triggered when the data can't be found
    [errorDidOccur, setErrorDidOccur] = useState(false);

  // Secondary Data
  const [performedSecondaryDataFetch, setPerformedSecondaryDataFetch] =
    useState<Boolean>(false);
  const [reservationAvailabilities, SetReservationAvailabilities] = useState<
    ReservationAvailability[]
  >([]);

  // Filter Data
  const [targetReservationDate, setTargetReservationDate] = useState<Date>(
    new Date(entityFilterState.targetReservationDate)
  );
  const [targetPartySize, setTargetPartySize] = useState<number>(
    entityFilterState.targetReservationPartySize
  );

  // UI States
  const [reservationMenuToggled, setReservationMenuToggled] = useState(false);

  // UI References
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Listeners
  const listeners = useListeners();

  // Parsing
  // Restaurant
  const fonciiRestaurant = userPost?.fonciiRestaurant ?? undefined,
    restaurant = fonciiRestaurant?.restaurant,
    restaurantName = restaurant?.name,
    restaurantID = restaurant?.id,
    percentMatchScore = fonciiRestaurant?.percentMatchScore ?? undefined,
    qualityScore = fonciiRestaurant?.qualityScore ?? 0,
    // Creator
    creator = userPost?.creator,
    username = creator?.username;

  // Constants
  // Auto-refresh the reservation availabilities every 10 seconds the user has the reservation menu open
  // since the time table isn't visible when the menu is closed, loading indicator is hidden to prevent annoying UI shifts
  const RESERVATION_AUTO_REFRESH_INTERVAL_IN_MS = 10 * UnitsOfTimeInMS.second;

  // Post View Tracking
  useEffect(() => {
    // Views by the post's author are not valid and thus cannot be recorded
    if (isUserPostAuthor()) return;

    // Guard statement to unwrap optionals
    if (!userPost || !creator || !fonciiRestaurant) return;

    // Parsing
    const postID = userPost.id,
      authorUID = creator.id,
      fonciiRestaurantID = fonciiRestaurant?.restaurant.id,
      sharedEventID = searchParams.get(SharedURLParameters.sharedEventID) ?? undefined as string | undefined;

    // Cancel any pending timeout
    clearTimeout(viewEventTimeout.current);

    viewEventTimeout.current = setTimeout(() => {
      AnalyticsService.shared.trackPostView({
        postID,
        percentMatchScore,
        qualityScore,
        authorUID,
        fonciiRestaurantID,
        sharedEventID,
      });
    }, AnalyticsService.shared.MIN_VIEW_DURATION_FOR_DETAIL_VIEW_CONTENT);

    // Clean up the timeout when the component is unmounted
    return () => {
      clearTimeout(viewEventTimeout.current);
      viewEventTimeout.current = undefined;
    };
  }, [userPost]);

  // Reactive UI Updates
  // Performs the initial fetch for the required data when the restaurant id is provided by the caller
  useEffect(() => {
    if (postID) performInitialDataFetch();
  }, [postID]);

  // Key press events
  useEffect(() => {
    // Event listener for key down events on the document
    document.addEventListener(
      "keydown",
      listeners.onEscapeKeyPress(closeAction)
    );

    // Cleanup: remove event listener when the component unmounts
    return () => {
      document.removeEventListener(
        "keydown",
        listeners.onEscapeKeyPress(closeAction)
      );
    };
  }, []); // Run this effect only once

  // Navigation side effects
  useEffect(() => {
    conditionallyRedirectIsolatedUser();
  }, [userPost, errorDidOccur]);

  // When the post is set and loaded perform the next set of data fetches using the available post state data
  // Select the post on the map if not already selected as well
  useEffect(() => {
    if (!userPost) return;

    performSecondaryDataFetch();
    selectMapPin();
  }, [userPost]);

  useEffect(() => {
    resetToDefaultState();
  }, [userPost?.id]);

  useEffect(() => {
    if (userPost) refreshData();
  }, [userPosts.posts, visitedUser.posts]);

  useEffect(() => {
    // Properties
    let currDepth = 0;

    // Cancel any pending timeouts
    clearInterval(reservationAvailabilitiesInterval.current);

    reservationAvailabilitiesInterval.current = setInterval(() => {
      if (
        !reservationMenuToggled ||
        !hasAvailableReservations() ||
        currDepth >= 5
      ) {
        clearInterval(reservationAvailabilitiesInterval.current);
        return;
      }

      fetchReservationAvailabilities({
        reservationDate: targetReservationDate,
        partySize: targetPartySize,
        showLoader: false,
      });

      if (hasAvailableReservations()) {
        currDepth = 0;
      }

      currDepth++;
    }, RESERVATION_AUTO_REFRESH_INTERVAL_IN_MS);

    return () => {
      clearInterval(reservationAvailabilitiesInterval.current);
      reservationAvailabilitiesInterval.current = undefined;
    };
  }, [reservationMenuToggled, targetPartySize, targetReservationDate]);

  // Actions
  const selectMapPin = () => {
    if (!postID) return;

    routerSearchParams.setParams({
      [SharedURLParameters.selectedPost]: postID,
    });
    entityFilters.setSelectedRestaurantEntity(postID);
  };

  // Defaults
  // When the restaurant changes reset the context to its default state
  const resetToDefaultState = () => {
    setReservationMenuToggled(false);
    scrollToTop();
  };

  // Scrolling
  const scrollToTop = () => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) return;

    // Scroll to top of the scroll container
    scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Data Providers //
  const refreshData = async () => {
    const foundUserPost = searchForDataLocally(),
      // Refresh when detailed article info is available, or if the author is refreshing (always)
      shouldRefresh =
        (foundUserPost &&
          foundUserPost?.fonciiRestaurant?.associatedArticlePublicationEdges.find(
            (articlePublication) => articlePublication.description != undefined
          ) != undefined) ||
        isEditingInProgress();

    if (shouldRefresh) setUserPost(foundUserPost ?? userPost);
  };

  const downloadData = async (): Promise<FmUserPost | undefined> => {
    // Precondition failure, target entity ID must be defined
    if (!postID) return;

    const apiService = new FonciiAPIClientAdapter();

    return await apiService.performFindPostByID({
      postID,
      currentUserID: UserManager.shared.currentUser()?.id,
      clientCoordinates: fonciiUser.clientCoordinates,
      reservationSearchInput: {
        targetDate: targetReservationDate.toISOString(),
        partySize: targetPartySize,
      },
    });
  };

  // Fetches data locally or remotely for the target restaurant data entity (if any)
  const fetchData = async () => {
    let targetUserPost = searchForDataLocally();

    // Not found locally, so fetch remotely, this case is usual when opening a shared link to the detail view
    if (!targetUserPost) {
      targetUserPost = await downloadData();

      // Store the downloaded data in the local store if currently isolated from the existing dataset
      if (targetUserPost) {
        const actionDelegator = isUserPostAuthor()
          ? UserPostsActions
          : VisitedUserActions;
        actionDelegator.appendPost(targetUserPost);
      }
    }

    setPerformedSecondaryDataFetch(false);

    if (targetUserPost) {
      // Found locally or remotely, finalize state
      setUserPost(targetUserPost);
      setErrorDidOccur(false);
    } else {
      // Not found, server down or data deleted, display error UI
      setUserPost(undefined);
      setErrorDidOccur(true);
    }

    setLoading(false);
  };

  // Fulfills the data requirements of this context when the context first loads
  const performInitialDataFetch = async () => {
    await fetchData();
  };

  const performSecondaryDataFetch = async () => {
    // Note: This data is never used when editing posts, don't load it
    if (
      !fonciiRestaurant ||
      performedSecondaryDataFetch ||
      isEditingInProgress()
    )
      return;

    setPerformedSecondaryDataFetch(true);

    // Always re-fetch reservations so that they're fresh
    await fetchReservationAvailabilities({});

    // Existing articles, fetch the articles' description meta tags (takes long to resolve that field)
    if ((fonciiRestaurant.associatedArticlePublicationEdges ?? []).length != 0)
      await fetchAssociatedArticleData(fonciiRestaurant.restaurant);
  };

  /**
   * Fetches the associated articles for the target restaurant, if any, and updates the existing data in the store with the fetched articles
   *
   * @async
   * @param restaurant
   */
  const fetchAssociatedArticleData = async (restaurant?: Restaurant) => {
    // Precondition failure, can't load denormalized data if the primary data isn't resolved
    if (!restaurant) return;

    const actionDelegator = isUserPostAuthor()
      ? UserPostsActions
      : VisitedUserActions,
      clientAPIService = new FonciiAPIClientAdapter();

    // Fetch the required associated articles and update the existing data in the store with the fetched articles
    const restaurantID = restaurant.id;
    const { associatedArticlePublicationEdges } = await clientAPIService.performFindAssociatedArticlesFor(restaurantID);

    actionDelegator.updateRestaurantWithAssociatedArticles({
      restaurantID,
      associatedArticlePublicationEdges,
    });
  };

  /**
   * Like fetchReservationAvailabilities, but attempts to get latest availability within a time period
   */
  const fetchEarliestReservationAvailability = async (
    partySize: number
  ): Promise<ReservationAvailability[]> => {
    // Precondition failure, can't load denormalized data if the primary data isn't resolved / when the restaurant doesn't support reservations
    let reservationAvailabilities: ReservationAvailability[] = [];

    if (!restaurantID || fonciiRestaurant?.isReservable == false)
      return reservationAvailabilities;

    const clientAPIService = new FonciiAPIClientAdapter();

    let reservationDate = new Date();
    return await clientAPIService.performFindReservationAvailabilitiesFor({
      fonciiRestaurantID: restaurantID,
      reservationSearchInput: {
        targetDate: reservationDate.toISOString(),
        partySize: partySize,
      },
    });
  };

  /**
   * Fetches the latest reservation availabilities given the selected reservation criteria local to this context
   * any reservation availabilities fetched in this context are not used to update the local store / cache
   * and any updates to the target reservation reservation criteria are also local and don't affect the global filter state
   *
   * @async
   * @param reservationDate
   * @param partySize
   * @param showLoader
   */
  const fetchReservationAvailabilities = async ({
    reservationDate,
    partySize,
    showLoader = true,
  }: {
    reservationDate?: Date;
    partySize?: number;
    showLoader?: boolean;
  }) => {
    // Precondition failure, can't load denormalized data if the primary data isn't resolved / when the restaurant doesn't support reservations
    if (!restaurantID || fonciiRestaurant?.isReservable == false) return;

    const clientAPIService = new FonciiAPIClientAdapter();

    if (showLoader) setLoadingReservationAvailabilities(true);

    const reservationAvailabilities =
      await clientAPIService.performFindReservationAvailabilitiesFor({
        fonciiRestaurantID: restaurantID,
        reservationSearchInput: {
          targetDate: (reservationDate ?? targetReservationDate).toISOString(),
          partySize: partySize ?? targetPartySize,
        },
      });

    SetReservationAvailabilities(reservationAvailabilities);
    setLoadingReservationAvailabilities(false);
  };

  // Data Providers //

  // Share Sheet
  // The fallback string is just in case something fails, used to indicate missing data somewhere
  const shareSheetSubject = (): string =>
    `Check out ${possessiveFormattedUsernameCopy(username)} post about ${restaurantName} on Foncii 🍜📍`,
    postDetailViewShareSheetLink = (): string =>
      typeof location == "undefined" ? "" : location.href;

  const shareSheetCopyButtonTitle = (): string => {
    return `${restaurantName} • ${username}`;
  };

  // Navigation
  // If the data fails to load, throw a 404 error
  const conditionallyRedirectIsolatedUser = () => {
    if (userPost == undefined && errorDidOccur) {
      notFound();
    }
  };

  const fullCoverPresentationDismissCallback = (): void => {
    // Navigate to the user's gallery if presented in that context, or the explore / homepage if not presented in a gallery
    const userGalleryLink = NavigationProperties.userGalleryPageLink(username),
      homePageLink = NavigationProperties.homePageLink(),
      availableRoute = routeObserver.galleryPageActive()
        ? userGalleryLink
        : homePageLink;

    // Push instead of replace to allow the user to go back to this page if they want to
    router.push(availableRoute);
  };

  // Action Handlers
  const handleReservationMenuToggle = (newToggleState: boolean) => {
    setReservationMenuToggled(newToggleState);
  };

  // Convenience
  const isUserPostAuthor = (): boolean => {
    if (!userPost) return false;

    return fonciiUser.user?.id === userPost?.creator.id;
  };

  const isUserAuthorizedToEditPost = (): boolean => {
    return userPost?.creator.id == UserManager.shared.currentUser()?.id;
  };

  const authorGalleryActive = (): boolean => {
    return routeObserver.isGalleryBeingViewedByAuthor();
  };

  const isEditingInProgress = (): boolean => {
    return isUserPostAuthor() && isUserEditing;
  };

  const hasAssociatedRestaurantData = (): boolean => {
    return userPost?.fonciiRestaurant != undefined;
  };

  const hasAvailableReservations = (): boolean => {
    return reservationAvailabilities.length > 0;
  };

  // Subcomponents
  const PostHeroHeader = (): React.ReactNode => {
    if (!userPost) return;

    return (
      <div className="relative w-full h-fit">
        <PostMediaCarousel
          post={userPost}
          imageResizingProps={{
            height: 600,
            width: 750,
            fit: MediaServerImageFitParams.cover,
            format: MediaServerImageFormatParams.f3,
          }}
          className={cn(
            "w-full h-[400px] rounded-[10px] shadow-lg overflow-hidden transition-all duration-300 ease-in-out"
          )}
        />

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

  const RestaurantName = (): React.ReactNode => {
    if (!restaurantID) return;

    return (
      <FonciiToolTip title={restaurantName}>
        <Link
          href={NavigationProperties.explorePageModalRestaurantDetailViewLink({
            restaurantID,
            returnURL: location.href,
          })}
          className="hover:opacity-75 transition-all hover:text-primary ease-in-out"
        >
          <p className="text-[28px] xl:text-[36px] font-semibold text-left w-fit h-fit leading-[1.15] line-clamp-2">
            {restaurantName}
          </p>
        </Link>
      </FonciiToolTip>
    );
  };

  const ActionButtons = (): React.ReactNode => {
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

        {SaveRestaurantButtonDecorator()}
      </div>
    );
  };

  const WebsiteButton = (): React.ReactNode => {
    const website = restaurant?.website;

    // No data, can't render
    if (!website) return;

    function trackBusinessWebsiteClickEvent() {
      if (!fonciiRestaurant || !website) return;

      // Parsing
      const postID = userPost?.id,
        authorUID = creator?.id;

      const fonciiRestaurantID = fonciiRestaurant.restaurant.id,
        percentMatchScore = fonciiRestaurant.percentMatchScore,
        qualityScore = fonciiRestaurant.qualityScore;

      AnalyticsService.shared.trackBusinessWebsiteClick({
        authorUID,
        fonciiRestaurantID,
        postID,
        percentMatchScore,
        qualityScore,
        destinationURL: website,
        sourceURL: currentPageCanonicalURL(location),
      });
    }

    const websiteOnClickAction = () => {
      trackBusinessWebsiteClickEvent();
      window.open(website, "_blank");
    };

    return (
      <RoundedDetailSelectorButton
        title="Website"
        description={`Visit ${possessiveFormattedString(
          restaurantName
        )} website`}
        icon={ImageRepository.UtilityIcons.ExternalLinkIcon}
        onClickAction={websiteOnClickAction}
      />
    );
  };

  const GetDirectionsButton = (): React.ReactNode => {
    const getDirectionsOnClickAction = () => {
      AnalyticsService.shared.trackGenericEvent(
        AnalyticsEvents.GET_DIRECTIONS_BUTTON_CLICKED,
        { postID, source: "Restaurant-detail" }
      );

      window.open(
        ExternalLinks.createGoogleMapsLinkForRestaurant(restaurant),
        "_blank"
      );
    };

    return (
      <RoundedDetailSelectorButton
        title="Get Directions"
        description={`Get navigation directions to ${restaurantName}`}
        icon={ImageRepository.UtilityIcons.DirectionsIcon}
        onClickAction={getDirectionsOnClickAction}
      />
    );
  };

  const ReservationFilterDropDownMenu = (): React.ReactNode => {
    return (
      <ReservationWidget
        onReservationDateChange={(date) => {
          setTargetReservationDate(date);
          fetchReservationAvailabilities({ reservationDate: date });
        }}
        onPartySizeChange={(size) => {
          setTargetPartySize(size);
          fetchReservationAvailabilities({ partySize: size });
        }}
        reservationAvailabilities={reservationAvailabilities}
        showReservableOnlyToggle={false}
        loadingReservations={loadingReservationAvailabilities}
      />
    );
  };

  const ReservationMenuToggle = (): React.ReactNode => {
    // Don't render the menu when the restaurant doesn't support reservations
    if (fonciiRestaurant?.isReservable == false) return;

    return (
      <div className="transition-all ease-in-out flex-shrink-0 flex flex-col items-end">
        <EarliestTableTimeToggle
          fetchNewAvailabilities={fetchEarliestReservationAvailability}
          partySize={targetPartySize}
          isToggled={reservationMenuToggled}
          toggleStateDidChange={handleReservationMenuToggle}
        />
      </div>
    );
  };

  const LoadingPrompt = (): React.ReactNode => {
    return (
      /** Loading Indicator */
      <div className="flex h-full items-center justify-center">
        <svg
          aria-hidden="true"
          role="status"
          className="inline w-[40px] h-[40px] text-white animate-spin"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill={ColorRepository.colors["medium_dark_grey"]}
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill={ColorRepository.colors.primary}
          />
        </svg>
      </div>
    );
  };

  const CloseButton = (): React.ReactNode => {
    return (
      <CloseUtilityButton onClick={closeAction} className="h-[30px] w-[30px]" />
    );
  };

  const ViewAuthorMapCTA = (): React.ReactNode => {
    // Shouldn't be shown to post authors
    if (isUserPostAuthor()) return;

    return (
      <div className="flex flex-wrap font-normal text-[14px] text-permanent_white items-center w-full h-fit py-[8px] gap-[8px]">
        {/** Creator Attribution */}
        <UserAvatarImageView
          user={creator}
          className="h-[32px] w-[32px] shrink-0 rounded-[10px]"
          imageResizingProps={{
            height: 60,
            width: 60,
            fit: MediaServerImageFitParams.cover,
            format: MediaServerImageFormatParams.f3,
          }}
        />

        <p className="line-clamp-1">
          @{`${uppercaseFirstLetterOnly(username ?? "")}`}
        </p>
        <p>•</p>

        {/** CTA Button */}
        <FonciiToolTip
          title={`View @${possessiveFormattedUsernameCopy(username)} map`}
        >
          <Link
            className="flex items-center justify-center bg-primary text-[14px] text-permanent_white font-normal px-[8px] py-[4px] h-full rounded-full hover:opacity-75 active:scale-90 ease-in-out transition-all shrink-0"
            href={
              restaurantID
                ? NavigationProperties.userGalleryPageLink(username)
                : "#"
            }
            onClick={navigateToAuthorGalleryPage}
          >
            View their map
          </Link>
        </FonciiToolTip>

        {/** Prompt */}
        <p className="text-neutral break-words">{`Currently viewing @${possessiveFormattedUsernameCopy(
          username
        )} experience at ${restaurantName}`}</p>
      </div>
    );
  };

  const SaveRestaurantButtonDecorator = (): React.ReactNode => {
    if (!fonciiRestaurant) return;
    else
      return (
        <SaveRestaurantButton
          fonciiRestaurant={fonciiRestaurant}
          post={userPost}
          onComplete={(didSucceed) => {
            const updatedSaveState = didSucceed
              ? !fonciiRestaurant.isSaved
              : fonciiRestaurant.isSaved;

            if (fonciiRestaurant && userPost) {
              const updatedUserPost: FmUserPost = {
                ...userPost,
                fonciiRestaurant: {
                  ...fonciiRestaurant,
                  isSaved: updatedSaveState,
                },
              };

              // Update component state
              setUserPost(updatedUserPost);
            }
          }}
        />
      );
  };

  const FavoritePostButtonDecorator = (): React.ReactNode => {
    if (!isUserAuthorizedToEditPost()) return;

    if (!userPost) return;
    else return <FavoritePostButton post={userPost} />;
  };

  const EditPostButton = (): React.ReactNode => {
    if (!isUserAuthorizedToEditPost() && !authorGalleryActive()) return;

    const icon = ImageRepository.UtilityIcons.EditPostIcon;

    return (
      <FonciiToolTip title="Edit this experience">
        <button
          className="flex items-center justify-center w-fit h-fit transition-all ease-in-out active:scale-90 hover:opacity-75"
          onClick={openEditorDetailViewNavigationAction}
        >
          <Image
            className="w-[20px] h-[20px]"
            src={icon}
            loading="eager"
            alt={`Edit experience icon`}
            unselectable="on"
          />
        </button>
      </FonciiToolTip>
    );
  };

  const PostActionButtons = (): React.ReactNode => {
    if (!isUserAuthorizedToEditPost()) return;

    return (
      <div className="flex flex-row gap-x-[18px] w-full items-center justify-end">
        {FavoritePostButtonDecorator()}
        {EditPostButton()}
      </div>
    );
  };

  // Component Sections
  const HeaderSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[16px] w-full h-fit items-start justify-center">
        <ViewAuthorMapCTA />
        {PostActionButtons()}
        {PostHeroHeader()}

        <div className="flex flex-row justify-between items-start w-full h-fit">
          {RestaurantName()}
          {ActionButtons()}
        </div>
      </div>
    );
  };

  const SelectorButtonSection = (): React.ReactNode => {
    // Don't render when no restaurant data is available at all
    if (!restaurant) return;

    return (
      <div className="flex flex-col gap-y-[8px] pb-[16px] w-full h-fit transition-all ease-in-out items-start justify-center border-b-[1px] border-medium">
        <div className="flex flex-row flex-wrap items-center justify-start gap-x-[4px] gap-y-[8px] w-full h-fit">
          {ReservationMenuToggle()}
          {WebsiteButton()}
          {GetDirectionsButton()}
        </div>

        {reservationMenuToggled ? ReservationFilterDropDownMenu() : undefined}
      </div>
    );
  };

  const PostViewerContent = (): React.ReactNode => {
    return (
      <div
        ref={scrollContainerRef}
        className="bg-black xl:bg-transparent transition-all ease-in-out p-[16px] overflow-x-hidden overflow-y-auto h-full w-full max-w-[590px]"
      >
        <div className=" flex flex-col gap-y-[16px] h-fit w-full pb-[12px]">
          {HeaderSection()}
          {SelectorButtonSection()}
          <SharedRestaurantDetailSections
            fonciiRestaurant={fonciiRestaurant}
            post={userPost}
          />
        </div>
      </div>
    );
  };

  const ContentSection = (): React.ReactNode => {
    return (
      <>
        {userPost ? (
          <>
            {isEditingInProgress() ? (
              <PostEditorContent
                userPost={userPost}
                scrollContainerRef={scrollContainerRef}
                isPresentedModally={isPresentedModally}
              />
            ) : (
              PostViewerContent()
            )}
          </>
        ) : (
          LoadingPrompt()
        )}
      </>
    );
  };

  // Actions
  const navigateToAuthorGalleryPage = () => {
    routerSearchParams.hydrateStateFromURL(
      NavigationProperties.userGalleryPageLink(username)
    );
  };

  const openEditorDetailViewNavigationAction = (): void => {
    if (!isUserAuthorizedToEditPost()) return;

    AnalyticsService.shared.trackGenericEvent(
      AnalyticsEvents.POST_EDITOR_DETAIL_VIEW_OPENED,
      {
        postID: userPost?.id,
        origin: location.pathname,
      }
    );

    routerSearchParams.setParams({
      [SharedURLParameters.detailViewForRestaurant]: undefined,
      [SharedURLParameters.detailViewForPost]: userPost?.id,
      [SharedURLParameters.isEditingPost]: true,
    });
  };

  // Shared Actions
  // Toggled by pressing close button, escape key, or pressing on the overlay outside of the modal's content area
  const closeAction = (): void => {
    if (!isPresentedModally) {
      // Page
      fullCoverPresentationDismissCallback();
    }
  };

  // Structured post detail view related data
  const StructuredDataScripts = () => {
    if (!userPost) return null;

    return (
      <>
        <Script
          id="post-detail-view-structured-restaurant-data-markup"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: structuredPostRestaurantDataGenerator([userPost]),
          }}
        />

        <Script
          id="structured-post-video-data-markup"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: postVideoStructuredDataGenerator([userPost]),
          }}
        />

        <Script
          id="structured-post-image-data-markup"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: postImageStructuredDataGenerator([userPost]),
          }}
        />
      </>
    );
  };

  if (isPresentedModally) {
    return (
      <div
        className={cn(
          "xl:min-w-[590px] relative backdrop-blur-lg xl:backdrop-blur-none flex flex-col w-full h-[calc(100dvh-100px)] transition-all duration-200 ease-in-out justify-center items-center"
        )}
      >
        {ContentSection()}
      </div>
    );
  } else {
    // Note: This overlay is rendered at the highest z-index, 10,000. Any other elements must be
    // set below this standard
    return (
      <>
        {StructuredDataScripts()}
        <FonciiModal isPresented onDismiss={closeAction}>
          <div
            className={`flex flex-col items-center justify-center transition-all ease-in-out z-[10001] relative backdrop-blur-lg h-full w-full xs:min-h-[500px] md:w-full md:min-w-[450px] overflow-hidden pointer-events-auto`}
            autoFocus
          >
            <div className="w-fit h-fit fixed top-0 right-0 p-[16px] z-[100000]">
              {CloseButton()}
            </div>

            <div className="shadow-lg h-full w-full max-w-[590px] rounded-[8px] bg-black">
              {ContentSection()}
            </div>
          </div>
        </FonciiModal>
      </>
    );
  }
}
