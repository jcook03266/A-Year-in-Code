/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Framework
import dynamic from "next/dynamic";

// Types
import {
  FmUserPost,
  FmUser,
  FonciiRestaurant,
} from "../../../../__generated__/graphql";
import { DefaultPostFilters } from "../../../../types/default-type-values";
import { ExperienceSections } from "../../../../components/panels/gallery-panel/gallery-contexts/restaurant-entity-collection-context/RestaurantEntityCollectionContext";

// Components
import { PostFilterMenuButton } from "../menu-buttons/PostFilterMenuButton";
import SelectionDropDown from "../drop-downs/selection-drop-down/container/SelectionDropDown";

// Dynamic
const MoreDropDown = dynamic(
  () => import("../drop-downs/more-drop-down/MoreDropDown"),
  { ssr: false }
);
const InfluencerDropDown = dynamic(
  () =>
    import("../drop-downs/influencer-drop-down/container/InfluencerDropDown"),
  { ssr: false }
);
const RecognizedDropDown = dynamic(
  () => import("../drop-downs/recognized-drop-down/RecognizedDropDown"),
  { ssr: false }
);

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Hooks
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useRouteObserver } from "../../../../hooks/UseRouteObserver";
import useEntityFilters from "../../../../hooks/UseEntityFilters";

// URL Persistence
import {
  PostFilterURLParameters,
  SharedURLParameters,
  currentPageCanonicalURL
} from "../../../../core-foncii-maps/properties/NavigationProperties";

// Redux
import {
  getFonciiUserSlice,
  getUserPostsSlice,
  getVisitedUserSlice,
  getPostFiltersSlice,
  getFonciiRestaurantsSlice,
  getMapboxSlice,
} from "../../../../redux/operations/selectors";
import { PostFiltersActions } from "../../../../redux/operations/dispatchers";

// Services
import AnalyticsService from "../../../../services/analytics/analyticsService";

// Managers
import UserManager from "../../../../managers/userManager";

// Flags
import { nonProductionEnvironment } from "../../../../core-foncii-maps/properties/AppProperties";

// Utilities
import { isInRange } from "../../../../utilities/math/commonMath";
import { convertNumericPriceLevelToDollarSigns } from "../../../../extensions/Restaurant+Extensions";
import { convertMSTimeToISODate } from "../../../../utilities/common/convenienceUtilities";
import { delay } from "../../../../utilities/common/scheduling";
import { UnitsOfTimeInMS } from "../../../../utilities/common/time";

// Types
export enum PostFilterSubmenus {
  Influencer = "Influencer",
  Recognized = "Recognized",
  PriceLevel = "PriceLevel",
  OpenNow = "OpenNow",
  More = "More",
}

interface PostFilterMenuButtonProps {
  parent: string; // Needed for the annoying reason of React finding components by similarity on useRef - something on child elements must be different
  isMobile?: boolean;
}

export default function PostFilterMenu({
  parent,
  isMobile = false,
}: PostFilterMenuButtonProps): React.ReactNode {
  // Observers
  const routeObserver = useRouteObserver();

  // State Management
  // Redux
  const fonciiUser = getFonciiUserSlice()(),
    userPosts = getUserPostsSlice()(),
    fonciiRestaurantsState = getFonciiRestaurantsSlice()(),
    visitedUser = getVisitedUserSlice()(),
    entityFiltersState = getPostFiltersSlice()(),
    mapBoxState = getMapboxSlice()();

  // URL-State Persistence
  const searchParams = useSearchParams(),
    routerSearchParams = useRouterSearchParams(),
    pathname = usePathname();

  // Search Query
  const latestSearchQuery: string | undefined =
    routerSearchParams.getParamValue(SharedURLParameters.search) as string;

  // Filters
  const entityFilters = useEntityFilters();

  // Side Effects
  // Set component state from URL when the pathname updates and or the user's auth state changes
  //(because some options are for auth users only and can't be untoggled automatically when signing out)
  useEffect(() => {
    setInitialComponentStateFromURL();
  }, [pathname, fonciiUser.isLoggedIn]);

  // Restaurant entity sorting and filtering based on client dynamic values (i.e user location)
  useEffect(() => {
    entityFilters.sortFilterAndOrganizeRestaurantEntities();
  }, [fonciiUser.clientCoordinates]);

  // Update the current search with the latest query (if any)
  useEffect(() => {
    // Gallery page must be active
    if (!routeObserver.galleryPageActive()) return;

    entityFilters.updateSearchQuery(latestSearchQuery);

    // Delay the event tracker since the local store has to update first
    // Not using timeout b/c every search must be tracked, this is not cancellable
    delay(async () => {
      trackGallerySearch(latestSearchQuery);
    }, UnitsOfTimeInMS.second);
  }, [latestSearchQuery]);

  // Properties
  const PostFilterPropertiesSelector = {
    [PostFilterSubmenus.Influencer]: {
      filterIsApplied: () => isInfluencerFilterApplied(),
      title: "Influencers",
      headerTitle: "Any Influencer",
      icon: ImageRepository.FilterIcons.InfluencerFiltersIcon,
      dropDownMenu: (onCloseAction: () => void): React.ReactNode => {
        return InfluencerFilterDropDownMenu(onCloseAction);
      },
    },
    [PostFilterSubmenus.Recognized]: {
      filterIsApplied: () => isRecognizedFilterApplied(),
      selectAllOption: {
        isAllSelected: entityFilters.recognizedFiltersApplied(),
        toggleAllSelected: (isAllSelected: boolean) => {
          if (isAllSelected) {
            entityFilters.clearAllRecognizedFilters();
          }
          else {
            entityFilters.selectAllRecognizedFilters();
          }
        },
      },
      title: "Recognized",
      headerTitle: "Any Recognized Restaurant",
      icon: ImageRepository.FilterIcons.RecognizedFiltersIcon,
      dropDownMenu: (onCloseAction: () => void): React.ReactNode => {
        return RecognizedFilterDropDownMenu(
          onCloseAction
        );
      },
    },
    [PostFilterSubmenus.PriceLevel]: {
      filterIsApplied: () => isPriceLevelFilterApplied(),
      title: "Price",
      headerTitle: "Any Price",
      icon: ImageRepository.FilterIcons.PriceFiltersIcon,
      dropDownMenu: (onCloseAction: () => void): React.ReactNode => {
        return PriceLevelFilterDropDownMenu(onCloseAction);
      },
    },
    [PostFilterSubmenus.OpenNow]: {
      filterIsApplied: () => isOpenNowFilterApplied(),
      title: "Open Now",
      icon: ImageRepository.FilterIcons.OpenNowFilterIcon,
      onClickAction: () => openNowFilterToggleAction(),
    },
    [PostFilterSubmenus.More]: {
      filterIsApplied: () => areMoreFiltersApplied(),
      headerTitle: "More Filters",
      icon: ImageRepository.FilterIcons.MoreFiltersIcon,
      dropDownMenu: (onCloseAction: () => void): React.ReactNode => {
        return MoreFilterDropDownMenu(onCloseAction);
      },
    },
  };

  // Actions
  const openNowFilterToggleAction = (): void => {
    let updatedFilters: PostFilters = { ...entityFilters.getStoredFilters() };

    const openNowOnlyFilterApplied = !updatedFilters.openNowOnly;
    updatedFilters.openNowOnly = openNowOnlyFilterApplied;

    // Update URL state and local store
    if (openNowOnlyFilterApplied == DefaultPostFilters.openNowOnly) {
      // Default params values are to be removed as their values are implicit within the code.
      routerSearchParams.removeParam(PostFilterURLParameters.openNow);
    } else {
      routerSearchParams.setParams({
        [PostFilterURLParameters.openNow]: openNowOnlyFilterApplied,
      });
    }

    entityFilters.updateFilters(updatedFilters);
  };

  // State Syncing
  // Parse the URL state and load it into the component's local state on load
  const setInitialComponentStateFromURL = (): void => {
    routerSearchParams.hydrateStateFromURL(location.toString());

    // Filters
    // Cuisine Filters
    const cuisineTypes: string[] =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.cuisineTypes
      ) as string[]) ?? DefaultPostFilters.cuisineTypes;

    // Reservation Filters
    const targetReservationDate: number | undefined =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.targetReservationDate
      ) as number) ?? DefaultPostFilters.targetReservationDate,
      targetReservationPartySize: number | undefined =
        (routerSearchParams.getParamValue(
          PostFilterURLParameters.targetReservationPartySize
        ) as number) ?? DefaultPostFilters.targetReservationPartySize;

    // Rating Filters
    const creatorRating: number =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.creatorRating
      ) as number) ?? DefaultPostFilters.creatorRating,
      yelpRating: number =
        (routerSearchParams.getParamValue(
          PostFilterURLParameters.yelpRating
        ) as number) ?? DefaultPostFilters.yelpRating,
      googleRating: number =
        (routerSearchParams.getParamValue(
          PostFilterURLParameters.googleRating
        ) as number) ?? DefaultPostFilters.googleRating;

    // Creator Filters
    const creatorUIDs: string[] =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.creatorUIDs
      ) as string[]) ?? DefaultPostFilters.creatorUIDs;

    // Article Filters
    const publications: string[] =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.publications
      ) as string[]) ?? DefaultPostFilters.publications;

    // Restaurant Awards
    const restaurantAwards: string[] =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.restaurantAwards
      ) as string[]) ?? DefaultPostFilters.restaurantAwards;

    // Open Now Filter
    const openNowOnlyParameterString = routerSearchParams.getParamValue(
      PostFilterURLParameters.openNow
    ) as string,
      openNowOnly: boolean =
        openNowOnlyParameterString != undefined
          ? openNowOnlyParameterString == "true"
          : DefaultPostFilters.openNowOnly;

    // More Filters
    // Price Level Filters
    const priceLevels: number[] =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.priceLevels
      ) as number[]) ?? DefaultPostFilters.priceLevels;

    // Custom User Tag Filters
    const customUserTags: string[] =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.customUserTags
      ) as string[]) ?? DefaultPostFilters.customCategories;

    // Creation Date Sort
    const newestToOldestSort: boolean =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.newestToOldestSort
      ) as boolean) ??
      (routeObserver.galleryPageActive()
        ? true
        : DefaultPostFilters.newestToOldestSort);

    // Closest To Farthest Sort
    const closestToFarthestSort: boolean =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.closestToFarthestSort
      ) as boolean) ?? DefaultPostFilters.closestToFarthestSort;

    // Trending Sort
    const trendingSort: boolean =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.trendingSort
      ) as boolean) ?? DefaultPostFilters.trendingSort;

    // Quality Sort
    const qualitySort: boolean =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.qualitySort
      ) as boolean) ??
      (!UserManager.shared.hasTasteProfile() &&
        !routeObserver.galleryPageActive()
        ? true
        : DefaultPostFilters.qualitySort);

    // Percent Match Sort
    const percentMatchSort: boolean =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.percentMatchSort
      ) as boolean) ??
      (UserManager.shared.hasTasteProfile() &&
        !routeObserver.galleryPageActive()
        ? DefaultPostFilters.percentMatchSort
        : false);

    // Favorites Only Filter
    const showFavoritesOnly: boolean =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.favoritePostsOnly
      ) as boolean) ?? DefaultPostFilters.showFavoritesOnly;

    // Reservable Only Filter
    const reservableOnly: boolean =
      (routerSearchParams.getParamValue(
        PostFilterURLParameters.reservableOnly
      ) as boolean) ?? DefaultPostFilters.reservableOnly;

    // Search Query
    const searchQuery: string | undefined = routerSearchParams.getParamValue(
      SharedURLParameters.search
    ) as string;

    // Set the initial filters to the local store
    let updatedFilters: PostFilters = { ...entityFilters.getStoredFilters() };

    // Cuisine Types
    updatedFilters.cuisineTypes = Array.isArray(cuisineTypes)
      ? cuisineTypes
      : [cuisineTypes];

    // Reservation Criteria
    updatedFilters.targetReservationDate = Number(targetReservationDate);
    updatedFilters.targetReservationPartySize = Number(
      isInRange(targetReservationPartySize, 20, 1)
        ? targetReservationPartySize
        : DefaultPostFilters.targetReservationPartySize
    );

    // Ratings
    updatedFilters.creatorRating = Number(creatorRating);
    updatedFilters.yelpRating = Number(yelpRating);
    updatedFilters.googleRating = Number(googleRating);

    // Creator UIDs
    updatedFilters.creatorUIDs = Array.isArray(creatorUIDs)
      ? creatorUIDs
      : [creatorUIDs];

    // Article Publications
    updatedFilters.publications = Array.isArray(publications)
      ? publications
      : [publications];

    // Restaurant Awards
    updatedFilters.restaurantAwards = Array.isArray(restaurantAwards)
      ? restaurantAwards
      : [restaurantAwards];

    // Open Now Filter
    updatedFilters.openNowOnly = openNowOnly;

    // More Filters and Sort Ordering
    updatedFilters.priceLevels = Array.isArray(priceLevels)
      ? priceLevels.map(Number)
      : [Number(priceLevels)];
    updatedFilters.customCategories = Array.isArray(customUserTags)
      ? customUserTags
      : [customUserTags];
    updatedFilters.newestToOldestSort = String(newestToOldestSort) == "true";
    updatedFilters.closestToFarthestSort =
      String(closestToFarthestSort) == "true";
    updatedFilters.trendingSort = String(trendingSort) == "true";
    updatedFilters.qualitySort = String(qualitySort) == "true";
    updatedFilters.percentMatchSort = String(percentMatchSort) == "true";
    updatedFilters.showFavoritesOnly = String(showFavoritesOnly) == "true";
    updatedFilters.reservableOnly = String(reservableOnly) == "true";

    // Set search query state in store
    PostFiltersActions.setSearchQuery(searchQuery);

    entityFilters.updateFilters(updatedFilters);
  };

  // Post Provider Selection Logic
  const baseFonciiRestaurants = useMemo((): FonciiRestaurant[] => {
    return fonciiRestaurantsState.fonciiRestaurants;
  }, [fonciiRestaurantsState.fonciiRestaurants]);

  const basePosts = useMemo((): FmUserPost[] => {
    if (routeObserver.explorePageActive()) {
      return baseFonciiRestaurants.flatMap(
        (restaurant) => restaurant.influencerInsightEdges
      );
    } else {
      return routeObserver.isCurrentUserGalleryAuthor()
        ? userPosts.posts
        : visitedUser.posts;
    }
  }, [
    baseFonciiRestaurants,
    routeObserver,
    userPosts.posts,
    visitedUser.posts,
  ]);

  // True if at least one user post has a creator rating (creator rating slider can be used), false otherwise
  const individualCreatorRatingsAvailable = useMemo((): boolean => {
    return (
      basePosts.find((post) => (post.customUserProperties.rating ?? 0) != 0) !=
      undefined
    );
  }, [basePosts]);

  const filterRestaurantsFromPosts = (
    posts: FmUserPost[]
  ): FonciiRestaurant[] => {
    const filteredPosts = posts.filter((post) => post.restaurant != undefined);
    return filteredPosts.map((post) => post.fonciiRestaurant!);
  };

  const baseRestaurants = useMemo((): FonciiRestaurant[] => {
    if (routeObserver.explorePageActive()) {
      return baseFonciiRestaurants;
    } else {
      return filterRestaurantsFromPosts(basePosts);
    }
  }, [baseFonciiRestaurants, basePosts, routeObserver]);

  // Analytics
  // Gallery searches
  const trackGallerySearch = (searchQuery: string | undefined) => {
    // Precondition failure, search query required + current route must be a gallery page
    if (searchQuery == undefined || !routeObserver.galleryPageActive()) return;

    // Data Providers
    const currentUserIsGalleryAuthor =
      routeObserver.isCurrentUserGalleryAuthor();

    // Current state of the Redux foncii restaurants posts slice
    const visitedUserState = visitedUser.user,
      currentUserState = fonciiUser.user,
      currentVirtualCoordinates = mapBoxState.virtualCoordinates,
      currentVirtualZoomLevel = mapBoxState.virtualZoomLevel,
      currentClientCoordinates = fonciiUser.clientCoordinates,
      currentVisiblePosts = currentUserIsGalleryAuthor
        ? userPosts.visiblePosts
        : visitedUser.visiblePosts,
      fonciiRestaurants = currentVisiblePosts
        .map((post) => post.fonciiRestaurant)
        .filter(Boolean) as FonciiRestaurant[];

    // Note: We also track when authors search their own galleries when they're logged in, it's good data to keep track of more
    // deeper analytic purposes.
    const authorUID = currentUserIsGalleryAuthor
      ? currentUserState?.id
      : visitedUserState?.id,
      reservationDate = convertMSTimeToISODate(
        entityFiltersState.targetReservationDate
      ),
      percentMatchScores = fonciiRestaurants.map(
        (fonciiRestaurant) => fonciiRestaurant.percentMatchScore ?? 0
      ),
      averagePercentMatchScore =
        percentMatchScores.length > 0
          ? percentMatchScores.reduce((a, b) => a + b, 0) /
          percentMatchScores.length
          : 0,
      qualityScores = fonciiRestaurants.map(
        (fonciiRestaurant) => fonciiRestaurant.qualityScore ?? 0
      ),
      averageQualityScore =
        qualityScores.length > 0
          ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
          : 0,
      candidateIDs = currentVisiblePosts.map((post) => post.id),
      autoCompleteSuggestions =
        fonciiRestaurantsState.autocompleteSuggestions.map(
          (suggestion) => suggestion.description
        ),
      sourceURL = currentPageCanonicalURL(location);

    // Author UID required, this shouldn't trigger, but a good issue to prevent and log if it does occur.
    if (!authorUID) {
      if (nonProductionEnvironment)
        console.error(
          "Cannot track [UserGallerySearch] event for author with non-existent UID"
        );

      return;
    }

    AnalyticsService.shared.trackUserGallerySearch({
      authorUID,
      query: searchQuery,
      clientLocation: currentClientCoordinates,
      searchLocation: currentVirtualCoordinates,
      zoomLevel: currentVirtualZoomLevel,
      reservationDate,
      partySize: entityFiltersState.targetReservationPartySize,
      prices: entityFiltersState.priceLevels,
      cuisines: entityFiltersState.cuisineTypes,
      tags: entityFiltersState.customCategories,
      autoCompleteSuggestions,
      averagePercentMatchScore,
      averageQualityScore,
      candidateIDs,
      sourceURL,
    });
  };

  // Convenience
  /**
   * Disable filters when the gallery author is viewing their own gallery and is in a different section
   * that's not their 'my experiences' section containing their posts which the filters are tied to
   */
  const filtersShouldBeDisabled = (): boolean => {
    const currentSection = Number(searchParams.get(SharedURLParameters.gallerySection)) ??
      ExperienceSections.myExperiences,
      authorGalleryActive = routeObserver.isGalleryBeingViewedByAuthor(),
      authorViewingPosts = currentSection == ExperienceSections.myExperiences;

    // Precondition failure, doesn't apply
    if (!authorGalleryActive) return false;

    return (authorGalleryActive && !authorViewingPosts);
  }

  const filterUniqueCreatorsFromFonciiRestaurants = useMemo((): FmUser[] => {
    return baseRestaurants.flatMap((fonciiRestaurant) => {
      // We want the filter row to display restaurant counts for each creator
      const uniqueCreatorIds = new Set();
      return fonciiRestaurant.influencerInsightEdges
        .filter((edge) => {
          if (uniqueCreatorIds.has(edge.creator.id)) return false;
          uniqueCreatorIds.add(edge.creator.id);
          return true;
        })
        .flatMap((influencerInsightEdge) => influencerInsightEdge.creator);
    });
  }, [baseRestaurants]);

  // Shared Data Providers
  const isInfluencerFilterApplied = (): boolean => {
    return entityFiltersState.creatorUIDs.length > 0;
  };

  const isRecognizedFilterApplied = (): boolean => {
    return entityFiltersState.publications.length > 0
      || entityFiltersState.restaurantAwards.length > 0;
  };

  const isPriceLevelFilterApplied = (): boolean => {
    return entityFiltersState.priceLevels.length > 0;
  };

  const isOpenNowFilterApplied = (): boolean => {
    return entityFiltersState.openNowOnly;
  };

  const areMoreFiltersApplied = (): boolean => {
    const isRatingFilterApplied = (): boolean => {
      return (
        entityFiltersState.creatorRating != DefaultPostFilters.creatorRating ||
        entityFiltersState.yelpRating != DefaultPostFilters.yelpRating ||
        entityFiltersState.googleRating != DefaultPostFilters.googleRating
      );
    };

    return (
      entityFiltersState.percentMatchSort !=
      (UserManager.shared.hasTasteProfile() &&
        !routeObserver.galleryPageActive()
        ? DefaultPostFilters.percentMatchSort
        : false) ||
      entityFiltersState.qualitySort !=
      (!UserManager.shared.hasTasteProfile() &&
        !routeObserver.galleryPageActive()
        ? true
        : DefaultPostFilters.qualitySort) || // Default sort parameter when no taste profile available and user not viewing their own gallery
      entityFiltersState.newestToOldestSort !=
      (routeObserver.galleryPageActive()
        ? true
        : DefaultPostFilters.newestToOldestSort) || // Default sort parameter for gallery authors viewing their own gallery
      entityFiltersState.closestToFarthestSort !=
      DefaultPostFilters.closestToFarthestSort ||
      entityFiltersState.reservableOnly != DefaultPostFilters.reservableOnly ||
      entityFiltersState.targetReservationDate !=
      DefaultPostFilters.targetReservationDate ||
      entityFiltersState.targetReservationPartySize !=
      DefaultPostFilters.targetReservationPartySize ||
      entityFiltersState.cuisineTypes.length > 0 ||
      isRatingFilterApplied() ||
      entityFiltersState.customCategories.length > 0
    );
  };

  // Subcomponents
  const InfluencerFilterDropDownMenu = (
    onCloseAction: () => void
  ): React.ReactNode => {
    const uniqueCreators = new Map<string, FmUser>();

    filterUniqueCreatorsFromFonciiRestaurants.forEach((creator) =>
      uniqueCreators.set(creator.id, creator)
    );

    const idToRestaurantIds = (): Map<string, Set<string>> => {
      const resultMap = new Map<string, Set<string>>();
      baseRestaurants.forEach((fonciiRestaurant) => {
        const restaurantId = fonciiRestaurant.restaurant.id;
        fonciiRestaurant.influencerInsightEdges.forEach((edge) => {
          const creatorId = edge.creator.id;
          const restaurants = resultMap.get(creatorId) || new Set<string>();
          restaurants.add(restaurantId);
          resultMap.set(creatorId, restaurants);
        });
      });
      return resultMap;
    };

    const onClearAction = () => {
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      };
      updatedFilters.creatorUIDs = [];
      entityFilters.updateFilters(updatedFilters);
      routerSearchParams.removeParam(PostFilterURLParameters.creatorUIDs);
    };

    const selectionAction = (selectedValue: string): void => {
      const storedSelectedCreatorUIDs = new Set(entityFiltersState.creatorUIDs);

      if (storedSelectedCreatorUIDs.has(selectedValue)) {
        storedSelectedCreatorUIDs.delete(selectedValue);
      } else {
        storedSelectedCreatorUIDs.add(selectedValue);
      }

      // Update and set the new filters to the local store
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      },
        creatorUIDs = [...storedSelectedCreatorUIDs];

      updatedFilters.creatorUIDs = creatorUIDs;
      routerSearchParams.setParams({
        [PostFilterURLParameters.creatorUIDs]: creatorUIDs,
      });

      entityFilters.updateFilters(updatedFilters);
    };

    return (
      <InfluencerDropDown
        headerTitle={
          PostFilterPropertiesSelector[PostFilterSubmenus.Influencer].title
        }
        referenceIdsToMeta={uniqueCreators}
        selectedIds={entityFiltersState.creatorUIDs}
        idToRestaurantsIds={idToRestaurantIds()}
        onSelectAction={selectionAction}
        onClearAction={onClearAction}
        isMobile={isMobile}
        onCloseAction={onCloseAction}
      />
    );
  };

  const RecognizedFilterDropDownMenu = (
    onCloseAction: () => void,
  ): React.ReactNode => {
    return (
      <RecognizedDropDown
        headerTitle={
          PostFilterPropertiesSelector[PostFilterSubmenus.Recognized].title
        }
        isMobile={isMobile}
        onCloseAction={onCloseAction}
      />
    );
  };

  const PriceLevelFilterDropDownMenu = (
    onCloseAction: () => void
  ): React.ReactNode => {
    const idToRestaurantIds = (): Map<number, Set<string>> => {
      const resultMap = new Map<number, Set<string>>();

      baseRestaurants.forEach((fonciiRestaurant) => {
        const restaurantId = fonciiRestaurant.restaurant.id,
          priceId = fonciiRestaurant.restaurant.priceLevel,
          restaurants = resultMap.get(priceId) || new Set<string>();

        restaurants.add(restaurantId);
        resultMap.set(priceId, restaurants);
      });

      return resultMap;
    };

    const onClearAction = () => {
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      };
      updatedFilters.priceLevels = [];
      entityFilters.updateFilters(updatedFilters);
      routerSearchParams.removeParam(PostFilterURLParameters.priceLevels);
    };

    const selectionAction = (selectedValue: number): void => {
      const storedSelectedIds = new Set(entityFiltersState.priceLevels);

      if (storedSelectedIds.has(selectedValue)) {
        storedSelectedIds.delete(selectedValue);
      } else {
        storedSelectedIds.add(selectedValue);
      }

      // Update and set the new filters to the local store
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      },
        priceIds = [...storedSelectedIds];

      updatedFilters.priceLevels = priceIds;
      routerSearchParams.setParams({
        [PostFilterURLParameters.priceLevels]: priceIds,
      });

      entityFilters.updateFilters(updatedFilters);
    };

    const toDisplayTitle = (id: number): string => {
      const dollarSigns = convertNumericPriceLevelToDollarSigns(id);
      return dollarSigns ?? "?";
    };

    const toTooltipTitle = (id: number) => {
      switch (id) {
        case 1:
          return "Cheap";
        case 2:
          return "Affordable";
        case 3:
          return "Pricey";
        case 4:
          return "Expensive";
        default:
          return "Unknown";
      }
    };

    return (
      <SelectionDropDown
        headerTitle={
          PostFilterPropertiesSelector[PostFilterSubmenus.PriceLevel].title
        }
        referenceIds={[...entityFiltersState.priceLevelsToFilterBy]}
        toDisplayTitle={toDisplayTitle}
        toTooltipTitle={toTooltipTitle}
        selectedIds={entityFiltersState.priceLevels}
        idToRestaurantsIds={idToRestaurantIds()}
        onSelectAction={selectionAction}
        onClearAction={onClearAction}
        displayOrderByDisplayKey
        isMobile={isMobile}
        onCloseAction={onCloseAction}
      />
    );
  };

  const MoreFilterDropDownMenu = (
    onCloseAction: () => void
  ): React.ReactNode => {
    return (
      <MoreDropDown
        headerTitle={PostFilterPropertiesSelector.More.headerTitle}
        displayCreatorRating={
          routeObserver.galleryPageActive()
            ? individualCreatorRatingsAvailable
            : true
        }
        isMobile={isMobile}
        onCloseAction={onCloseAction}
      />
    );
  };

  return (
    // We have to add a bunch of padding due to CSS limitations
    // https://stackoverflow.com/questions/6421966/css-overflow-x-visible-and-overflow-y-hidden-causing-scrollbar-issue/6433475#6433475
    <div className="h-fit w-full">
      <div className="z-[888] flex flex-row justify-start flex-nowrap gap-[4px] w-full h-fit pointer-events-none pb-[10000px] mb-[-10000px]">
        {/* Center after element has grown to encompass all elements */}
        <div className="flex w-full" />

        {/** Influencer Filter */}
        {routeObserver.explorePageActive() ? (
          <PostFilterMenuButton
            id={parent + PostFilterSubmenus.Influencer}
            title={
              PostFilterPropertiesSelector[PostFilterSubmenus.Influencer].title
            }
            icon={
              PostFilterPropertiesSelector[PostFilterSubmenus.Influencer].icon
            }
            dropDownMenu={
              PostFilterPropertiesSelector[PostFilterSubmenus.Influencer]
                .dropDownMenu
            }
            withChevron
            filterIsApplied={PostFilterPropertiesSelector[
              PostFilterSubmenus.Influencer
            ].filterIsApplied()}
            dismissOnClickOutside
            isMobile={isMobile}
            disabled={filtersShouldBeDisabled()}
          />
        ) : undefined}
        {/** Influencer Filter */}

        {/** Recognized Filter */}
        <PostFilterMenuButton
          id={parent + PostFilterSubmenus.Recognized}
          title={
            PostFilterPropertiesSelector[PostFilterSubmenus.Recognized].title
          }
          icon={
            PostFilterPropertiesSelector[PostFilterSubmenus.Recognized].icon
          }
          selectAllOption={
            PostFilterPropertiesSelector[PostFilterSubmenus.Recognized]
              .selectAllOption
          }
          dropDownMenu={
            PostFilterPropertiesSelector[PostFilterSubmenus.Recognized]
              .dropDownMenu
          }
          withChevron
          filterIsApplied={PostFilterPropertiesSelector[
            PostFilterSubmenus.Recognized
          ].filterIsApplied()}
          dismissOnClickOutside
          isMobile={isMobile}
          disabled={filtersShouldBeDisabled()}
        />
        {/** Recognized Filter */}

        {/** Price Level Filter */}
        <PostFilterMenuButton
          id={parent + PostFilterSubmenus.PriceLevel}
          title={
            PostFilterPropertiesSelector[PostFilterSubmenus.PriceLevel].title
          }
          icon={
            PostFilterPropertiesSelector[PostFilterSubmenus.PriceLevel].icon
          }
          dropDownMenu={
            PostFilterPropertiesSelector[PostFilterSubmenus.PriceLevel]
              .dropDownMenu
          }
          filterIsApplied={PostFilterPropertiesSelector[
            PostFilterSubmenus.PriceLevel
          ].filterIsApplied()}
          withChevron
          dismissOnClickOutside
          isMobile={isMobile}
          disabled={filtersShouldBeDisabled()}
        />
        {/** Price Level Filter */}

        {/** Open Now Filter */}
        <PostFilterMenuButton
          id={parent + PostFilterSubmenus.OpenNow}
          title={PostFilterPropertiesSelector[PostFilterSubmenus.OpenNow].title}
          icon={PostFilterPropertiesSelector[PostFilterSubmenus.OpenNow].icon}
          onClickAction={
            PostFilterPropertiesSelector[PostFilterSubmenus.OpenNow]
              .onClickAction
          }
          filterIsApplied={PostFilterPropertiesSelector[
            PostFilterSubmenus.OpenNow
          ].filterIsApplied()}
          isMobile={isMobile}
          disabled={filtersShouldBeDisabled()}
        />
        {/** Open Now Filter */}

        {/** More Filter */}
        <PostFilterMenuButton
          id={parent + PostFilterSubmenus.More}
          icon={PostFilterPropertiesSelector[PostFilterSubmenus.More].icon}
          dropDownMenu={
            PostFilterPropertiesSelector[PostFilterSubmenus.More].dropDownMenu
          }
          filterIsApplied={PostFilterPropertiesSelector[
            PostFilterSubmenus.More
          ].filterIsApplied()}
          iconImageClassName="h-[20px] w-[20px]"
          dismissOnClickOutside
          isMobile={isMobile}
          disabled={filtersShouldBeDisabled()}
        />
        {/** More Filter */}

        <div className="flex w-full" />
      </div>
    </div>
  );
}
