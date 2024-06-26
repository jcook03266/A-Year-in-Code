// Dependencies
// Framework
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Types
import { DefaultPostFilters } from "../../../../../types/default-type-values";
import {
  FmUser,
  FmUserPost,
  FonciiRestaurant,
  Restaurant,
} from "../../../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Components
// Local
import RadioToggleButton from "../../../../../components/buttons/toggle-buttons/radio-toggle-button/RadioToggleButton";
import FillableToggleButton from "../../../../../components/buttons/toggle-buttons/fillable-toggle-button/FillableToggleButton";
import RatingDropDownRow from "../rating-drop-down/rows/RatingDropDownRow";
import SwitchToggleButton from "../../../../../components/buttons/toggle-buttons/switch-toggle-button/SwitchToggleButton";
import ReservationWidget from "../../../../../components/menus/reservation-menu/widget/ReservationWidget";
import MenuHeader from "../../utils/MenuHeader";
import ShowMoreButton from "../../../../../components/buttons/toggle-buttons/expand-button/ShowMoreButton";

// Assets
import { ImageRepository } from "../../../../../../public/assets/images/ImageRepository";

// URL State Persistence
import { PostFilterURLParameters } from "../../../../../core-foncii-maps/properties/NavigationProperties";

// Hooks
import { useRouterSearchParams } from "../../../../../hooks/UseRouterSearchParamsHook";
import { useRouteObserver } from "../../../../../hooks/UseRouteObserver";
import useEntityFilters from "../../../../../hooks/UseEntityFilters";

// Redux
import {
  getFonciiRestaurantsSlice,
  getPostFiltersSlice,
  getUserPostsSlice,
  getVisitedUserSlice,
} from "../../../../../redux/operations/selectors";
import {
  FonciiRestaurantActions,
  UserPostsActions,
  VisitedUserActions,
} from "../../../../../redux/operations/dispatchers";

// Managers
import UserManager from "../../../../../managers/userManager";

// Utilities
import { formattedCreatorUsername } from "../../../../../utilities/formatting/textContentFormatting";
import { Set, List } from "immutable";
import { cn } from "../../../../../utilities/development/DevUtils";
import { resizableImageRequestBuilder } from "../../../../../utilities/tooling/resizableImageRequestBuilder";
import { FilterBottomButtons } from "../../menu-buttons/FilterBottomButtons";
import {
  DisplayableCuisine,
  CUSINE_ICONS,
  CUSINE_EQUIVALENCE,
} from "../../../../../types/cuisines";

// Types
interface MoreDropDownProps {
  headerTitle?: string; // An optional title of the header to display above the dropdown, a description of what the drop down is for
  displayCreatorRating: boolean;
  isMobile?: boolean;
  onCloseAction?: () => void;
}

type SortKeys =
  | PostFilterURLParameters.percentMatchSort
  | PostFilterURLParameters.trendingSort
  | PostFilterURLParameters.qualitySort
  | PostFilterURLParameters.closestToFarthestSort
  | PostFilterURLParameters.newestToOldestSort;

// A container for the selectable row based content displayed within
export default function MoreDropDown({
  headerTitle,
  displayCreatorRating,
  isMobile = false,
  onCloseAction,
}: MoreDropDownProps): React.ReactNode {
  // Observers
  const routeObserver = useRouteObserver();

  // State Management
  // Redux
  const userPosts = getUserPostsSlice()(),
    fonciiRestaurants = getFonciiRestaurantsSlice()(),
    visitedUser = getVisitedUserSlice()(),
    postFilters = getPostFiltersSlice()();

  // Filters
  const entityFilters = useEntityFilters();

  // URL State Persistence
  const routerSearchParams = useRouterSearchParams();

  // Selection States
  const baseFonciiRestaurants = useMemo(() => {
    return fonciiRestaurants.fonciiRestaurants;
  }, [fonciiRestaurants.fonciiRestaurants]);

  const filterRestaurantsFromPosts = (posts: FmUserPost[]): Restaurant[] => {
    const filteredPosts = posts.filter((post) => post.restaurant != undefined);

    return filteredPosts.map((post) => post.restaurant!);
  };

  const filterRestaurantsFromFonciiRestaurants = (
    fonciiRestaurants: FonciiRestaurant[]
  ): Restaurant[] => {
    return fonciiRestaurants.map(
      (fonciiRestaurant) => fonciiRestaurant.restaurant
    );
  };

  const basePosts = useMemo(() => {
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

  const baseRestaurants = useMemo(() => {
    if (routeObserver.explorePageActive()) {
      return filterRestaurantsFromFonciiRestaurants(baseFonciiRestaurants);
    } else {
      return filterRestaurantsFromPosts(basePosts);
    }
  }, [baseFonciiRestaurants, routeObserver, basePosts]);

  const filtersHaveBeenApplied = useMemo(() => {
    return postFilters.newestToOldestSort != routeObserver.galleryPageActive()
      ? true
      : DefaultPostFilters.newestToOldestSort || // Default sort parameter for gallery authors viewing their own gallery
      postFilters.closestToFarthestSort !=
      DefaultPostFilters.closestToFarthestSort ||
      postFilters.reservableOnly != DefaultPostFilters.reservableOnly ||
      postFilters.targetReservationDate !=
      DefaultPostFilters.targetReservationDate ||
      postFilters.targetReservationPartySize !=
      DefaultPostFilters.targetReservationPartySize ||
      postFilters.cuisineTypes.length > 0 ||
      postFilters.creatorRating != DefaultPostFilters.creatorRating ||
      postFilters.yelpRating != DefaultPostFilters.yelpRating ||
      postFilters.googleRating != DefaultPostFilters.googleRating ||
      postFilters.customCategories.length > 0;
  }, [
    postFilters.closestToFarthestSort,
    postFilters.creatorRating,
    postFilters.cuisineTypes.length,
    postFilters.customCategories.length,
    postFilters.googleRating,
    postFilters.newestToOldestSort,
    postFilters.reservableOnly,
    postFilters.targetReservationDate,
    postFilters.targetReservationPartySize,
    postFilters.yelpRating,
    routeObserver,
  ]);

  // Factory Methods
  const SubSectionTitleFactory = (title: string): React.ReactNode => {
    return (
      <div
        className={`px-[20px] pointer-events-none justify-start items-center w-full h-fit`}
      >
        <p
          className={`text-permanent_white text-[18px] font-normal text-start line-clamp-1`}
        >
          {title}
        </p>
      </div>
    );
  };

  const SortOrderToggleSection = (): React.ReactNode => {
    const qualitySortToggled = (): boolean => {
      return postFilters.qualitySort;
    };

    const bestMatchSortToggled = (): boolean => {
      return postFilters.percentMatchSort;
    };

    const newestToOldestSortToggled = (): boolean => {
      return postFilters.newestToOldestSort;
    };

    const closestToFarthestSortToggled = (): boolean => {
      return postFilters.closestToFarthestSort;
    };

    const sortToggleHandler = ({ sortKey }: { sortKey: SortKeys }): void => {
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      };

      // Toggle off all sort keys, since this is exclusive sorting only
      updatedFilters.qualitySort = false;
      updatedFilters.percentMatchSort = false;
      updatedFilters.closestToFarthestSort = false;
      updatedFilters.newestToOldestSort = false;

      // Update local state
      switch (sortKey) {
        case PostFilterURLParameters.qualitySort:
          updatedFilters.qualitySort = !updatedFilters.qualitySort;
          break;
        case PostFilterURLParameters.percentMatchSort:
          updatedFilters.percentMatchSort = !updatedFilters.percentMatchSort;
          break;
        case PostFilterURLParameters.newestToOldestSort:
          updatedFilters.newestToOldestSort =
            !updatedFilters.newestToOldestSort;
          break;
        case PostFilterURLParameters.closestToFarthestSort:
          updatedFilters.closestToFarthestSort =
            !updatedFilters.closestToFarthestSort;
          break;
        default:
          break;
      }

      // Update URL state
      // Remove any 'false' states by setting them as undefined since this is implicit when the state isn't in the URL
      routerSearchParams.setParams({
        [PostFilterURLParameters.percentMatchSort]:
          updatedFilters.percentMatchSort != false
            ? updatedFilters.percentMatchSort
            : undefined,
        [PostFilterURLParameters.closestToFarthestSort]:
          updatedFilters.closestToFarthestSort != false
            ? updatedFilters.closestToFarthestSort
            : undefined,
        [PostFilterURLParameters.newestToOldestSort]:
          updatedFilters.newestToOldestSort != false
            ? updatedFilters.newestToOldestSort
            : undefined,
      });

      entityFilters.updateFilters(updatedFilters);
    };

    return (
      <div className={`flex flex-col h-fit w-full gap-y-[16px]`}>
        {SubSectionTitleFactory("Sort")}

        <div className="flex flex-wrap h-fit w-full gap-[16px] px-[20px]">
          {/** Percent Match Score Sort Toggle */}
          {
            UserManager.shared.hasTasteProfile() ? (
              <RadioToggleButton
                title="Best Match"
                toggled={bestMatchSortToggled()}
                onToggleAction={() =>
                  sortToggleHandler({
                    sortKey: PostFilterURLParameters.percentMatchSort,
                  })
                }
              />
            ) : undefined // Only users with taste profiles can generate % match scores so this sort toggle is not applicable in the contrasting case
          }
          {/** Percent Match Score Sort Toggle */}

          {/** Quality Score Sort Toggle */}
          {
            <RadioToggleButton
              title="Top Rated"
              toggled={qualitySortToggled()}
              onToggleAction={() =>
                sortToggleHandler({
                  sortKey: PostFilterURLParameters.qualitySort,
                })
              }
            />
          }
          {/** Quality Score Sort Toggle */}

          {/** Creation Date Sort Toggle */}
          {
            <RadioToggleButton
              title="Newly Added"
              toggled={newestToOldestSortToggled()}
              onToggleAction={() =>
                sortToggleHandler({
                  sortKey: PostFilterURLParameters.newestToOldestSort,
                })
              }
            />
          }
          {/** Creation Date Sort Toggle */}

          {/** Distance Sort Toggle */}
          <RadioToggleButton
            title="Closest"
            toggled={closestToFarthestSortToggled()}
            onToggleAction={() =>
              sortToggleHandler({
                sortKey: PostFilterURLParameters.closestToFarthestSort,
              })
            }
          />
          {/** Distance Sort Toggle */}
        </div>
      </div>
    );
  };

  const Reservations = (): React.ReactNode => {
    const updateSearchResults = () => {
      // Update the search results using the new parameters
      if (routeObserver.isGalleryBeingViewedByAuthor()) {
        // Main user gallery
        UserPostsActions.fetchMainUserPosts();
      } else if (routeObserver.isGalleryBeingViewedByVisitor()) {
        // Visited user gallery
        VisitedUserActions.getVisitedUserPosts();
      } else if (routeObserver.explorePageActive()) {
        // Explore page
        FonciiRestaurantActions.search({});
      }
    };

    const ReservableOnlyFilterToggle = (): React.ReactNode => {
      const onReservableOnlyToggled = (reservableOnly: boolean) => {
        const updatedFilters: PostFilters = { ...postFilters };
        updatedFilters.reservableOnly = reservableOnly;

        // Update URL state and local store
        routerSearchParams.setParams({
          [PostFilterURLParameters.reservableOnly]: reservableOnly,
        });

        entityFilters.updateFilters(updatedFilters);
        updateSearchResults();
      };
      return (
        <div className="px-[20px] flex flex-row h-fit w-full justify-between gap-x-[40px]">
          <div className="flex flex-col w-fit justify-start">
            <p
              className={`text-permanent_white text-[16px] font-semibold text-start line-clamp-1`}
            >
              Current reservations
            </p>
            <i
              className={`text-permanent_white opacity-60 text-[12px] font-semibold text-start line-clamp-1`}
            >
              View restaurants with currently available reservations
            </i>
          </div>
          {/** Reservable filter toggle */}
          <SwitchToggleButton
            onToggle={onReservableOnlyToggled}
            isToggled={postFilters.reservableOnly}
          />
        </div>
      );
    };

    const SelectReservationDetails = (): React.ReactNode => {
      return (
        <div className="px-[20px] flex flex-col h-fit w-full justify-start gap-y-[16px]">
          <div className="flex flex-col w-fit justify-start">
            <p
              className={`text-permanent_white text-[16px] font-semibold text-start line-clamp-1`}
            >
              Select the perfect table for any occasion
            </p>
          </div>
          <ReservationWidget
            // reservableOnly automatically turned on for change in party or date
            onReservationDateChange={(date) => {
              const updatedFilters: PostFilters = { ...postFilters },
                normalizedDate = date.getTime();

              updatedFilters.targetReservationDate = normalizedDate;
              updatedFilters.reservableOnly = true;

              // Update URL state and local store
              routerSearchParams.setParams({
                [PostFilterURLParameters.targetReservationDate]: normalizedDate,
              });
              routerSearchParams.setParams({
                [PostFilterURLParameters.reservableOnly]: true,
              });

              entityFilters.updateFilters(updatedFilters);
              updateSearchResults();
            }}
            onPartySizeChange={(size) => {
              const updatedFilters: PostFilters = { ...postFilters };
              updatedFilters.targetReservationPartySize = size;
              updatedFilters.reservableOnly = true;

              // Update URL state and local store
              routerSearchParams.setParams({
                [PostFilterURLParameters.targetReservationPartySize]: size,
              });
              routerSearchParams.setParams({
                [PostFilterURLParameters.reservableOnly]: true,
              });

              entityFilters.updateFilters(updatedFilters);
              updateSearchResults();
            }}
            usePersistentStoreValues
            showReservableOnlyToggle={false}
          />
        </div>
      );
    };

    return (
      <div className="flex flex-col h-fit w-full justify-start gap-y-[16px]">
        {SubSectionTitleFactory("Reservations")}
        <ReservableOnlyFilterToggle />
        <SelectReservationDetails />
      </div>
    );
  };

  const CuisineFilters = (): React.ReactNode => {
    const [overflowActive, setOverflowActive] = useState<boolean>(false);
    const [showMore, setShowMore] = useState<boolean>(true);

    const containerRef = useRef(null);

    const onShowMoreAction = () => {
      setShowMore(!showMore);
    };

    useEffect(() => {
      const usedRef = containerRef.current;
      window.addEventListener("resize", () =>
        setOverflowActive(checkOverflow(usedRef))
      );

      return () => {
        window.removeEventListener("resize", () =>
          setOverflowActive(checkOverflow(usedRef))
        );
      };
    }, [overflowActive]);

    useLayoutEffect(() => {
      setOverflowActive(checkOverflow(containerRef.current));
    }, []);

    const checkOverflow = (textContainer: HTMLSpanElement | null): boolean => {
      if (textContainer) {
        return textContainer.offsetHeight < textContainer.scrollHeight;
      }
      return false;
    };

    const cuisinesToFilterBy = useMemo((): List<DisplayableCuisine> => {
      return baseRestaurants
        .map((restaurant) => restaurant.categories ?? [])
        .reduce(
          (accumulator, currentValue) => accumulator.concat(...currentValue),
          []
        )
        .map(
          (cuisine) =>
            CUSINE_EQUIVALENCE.get(cuisine.toLowerCase()) ??
            Set<DisplayableCuisine>()
        )
        .reduce((accum, data) => accum.union(data), Set())
        .toList();
    }, []);

    const areCuisinesAvailable = (): boolean => {
      return cuisinesToFilterBy.size > 0;
    };

    const isCuisineFilterSelected = (cuisine: DisplayableCuisine): boolean => {
      return (
        postFilters.cuisineTypes.find((element) => element == cuisine) !=
        undefined
      );
    };

    const updateCuisineFilters = (cuisineTypes: string[]): void => {
      // Update and set the new filters to the local store
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      };

      routerSearchParams.setParams({
        [PostFilterURLParameters.cuisineTypes]: cuisineTypes,
      });
      updatedFilters.cuisineTypes = cuisineTypes;

      entityFilters.updateFilters(updatedFilters);
    };

    // Action Handlers
    const onToggleAction = (selectedValue: DisplayableCuisine): void => {
      const storedSelectedCuisines = Set(postFilters.cuisineTypes);
      let updatedCuisines;

      if (storedSelectedCuisines.has(selectedValue)) {
        updatedCuisines = storedSelectedCuisines.delete(selectedValue);
      } else {
        updatedCuisines = storedSelectedCuisines.add(selectedValue);
      }

      updateCuisineFilters([...updatedCuisines]);
    };

    // Don't render this section if no cuisines available for selection
    if (!areCuisinesAvailable()) return;

    return (
      <div className="flex flex-col h-fit w-full justify-start items-center gap-y-[10px]">
        {SubSectionTitleFactory("Cuisines")}

        <div
          ref={containerRef}
          className={cn(`px-[20px] w-full overflow-y-hidden`, showMore ? "max-h-[64px]" : "h-full")}
        >
          {/** Cuisine List */}
          <div className="flex flex-row gap-[8px] flex-wrap justify-start">
            {cuisinesToFilterBy.map((cuisine: DisplayableCuisine) => {
              return (
                <FillableToggleButton
                  key={cuisine}
                  title={cuisine}
                  // CuisinesToFilterBy already filtered
                  icon={CUSINE_ICONS.get(cuisine)}
                  toggled={isCuisineFilterSelected(cuisine)}
                  onToggleAction={() => onToggleAction(cuisine)}
                />
              );
            })}
          </div>
        </div>

        <div
          className={cn(`flex w-full px-[20px]`, overflowActive || !showMore ? "" : "hidden")}
        >
          <ShowMoreButton
            showMore={showMore}
            onClickAction={onShowMoreAction}
          />
        </div>
      </div>
    );
  };

  const creatorRatingCurrentValue = (): number =>
    entityFilters.getStoredFilters().creatorRating,
    yelpRatingCurrentValue = (): number =>
      entityFilters.getStoredFilters().yelpRating,
    googleRatingCurrentValue = (): number =>
      entityFilters.getStoredFilters().googleRating;

  const RatingFilters = (): React.ReactNode => {
    // Filter States
    const creatorRatingInitialValue = (): number =>
      entityFilters.getStoredFilters().creatorRating,
      yelpRatingInitialValue = (): number =>
        entityFilters.getStoredFilters().yelpRating,
      googleRatingInitialValue = (): number =>
        entityFilters.getStoredFilters().googleRating;

    const currentGalleryAuthor = (): FmUser | undefined => {
      if (routeObserver.isGalleryBeingViewedByAuthor()) {
        return UserManager.shared.currentUser();
      } else if (routeObserver.isGalleryBeingViewedByVisitor()) {
        return visitedUser.user;
      }
    };

    const creatorRatingUpdateHandler = (rating: number): void => {
      // Update and set the new filters to the local store
      // Note: The new rating is already clamped to the expected range
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      };

      updatedFilters.creatorRating = rating == 1 ? 0 : rating;

      // Update URL state and local store
      if (rating == 1) {
        routerSearchParams.removeParam(PostFilterURLParameters.creatorRating);
      } else {
        routerSearchParams.setParams({
          [PostFilterURLParameters.creatorRating]: rating,
        });
      }
      entityFilters.updateFilters(updatedFilters);
    };

    const yelpRatingUpdateHandler = (rating: number): void => {
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      };

      updatedFilters.yelpRating = rating == 1 ? 0 : rating;

      // Update URL state and local store
      if (rating == 1) {
        routerSearchParams.removeParam(PostFilterURLParameters.yelpRating);
      } else {
        routerSearchParams.setParams({
          [PostFilterURLParameters.yelpRating]: rating,
        });
      }
      entityFilters.updateFilters(updatedFilters);
    };

    const googleRatingUpdateHandler = (rating: number): void => {
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      };

      updatedFilters.googleRating = rating == 1 ? 0 : rating;

      // Update URL state and local store
      if (rating == 1) {
        routerSearchParams.removeParam(PostFilterURLParameters.googleRating);
      } else {
        routerSearchParams.setParams({
          [PostFilterURLParameters.googleRating]: rating,
        });
      }
      entityFilters.updateFilters(updatedFilters);
    };

    const creator = currentGalleryAuthor(),
      profilePictureURL = creator?.profilePictureURL,
      creatorAvatarImageURL = () => {
        if (profilePictureURL) {
          return resizableImageRequestBuilder({
            baseImageURL: profilePictureURL,
            imageResizingProps: {
              height: 60,
              width: 60,
              fit: MediaServerImageFitParams.cover,
              format: MediaServerImageFormatParams.f3,
            },
          });
        } else return;
      };

    const RatingRows = {
      // Creator rating / Foncii Avg rating
      CreatorRatingRow: {
        initialValue: () => creatorRatingInitialValue(),
        currentValue: () => creatorRatingCurrentValue(),
        id: "creatorRatingRow",
        title: creator?.username
          ? formattedCreatorUsername(creator.username)
          : "Foncii",
        icon:
          creatorAvatarImageURL() ??
          ImageRepository.FilterIcons.InfluencerFiltersIconRed,
        updateHandler: creatorRatingUpdateHandler,
      },
      YelpRatingRow: {
        initialValue: () => yelpRatingInitialValue(),
        currentValue: () => yelpRatingCurrentValue(),
        id: "yelpRatingRow",
        title: "Yelp",
        icon: ImageRepository.CompanyLogos.YelpLogo,
        updateHandler: yelpRatingUpdateHandler,
      },
      GoogleRatingRow: {
        initialValue: () => googleRatingInitialValue(),
        currentValue: () => googleRatingCurrentValue(),
        id: "googleRatingRow",
        title: "Google",
        icon: ImageRepository.CompanyLogos.GoogleLogo,
        updateHandler: googleRatingUpdateHandler,
      },
    };

    return (
      <div className="flex flex-col h-fit w-full justify-start items-start">
        {SubSectionTitleFactory("Ratings")}

        <div className="transition-all ease-in-out flex flex-col gap-y-[24px] px-[24px] pt-[24px] w-full h-fit">
          {Object.values(RatingRows).map((value) => {
            // Don't show the creator rating row if the user has no personal ratings
            if (value == RatingRows.CreatorRatingRow && !displayCreatorRating)
              return undefined;

            return (
              <RatingDropDownRow
                key={value.id}
                initialValue={value.currentValue()}
                title={value.title ?? ""}
                icon={value.icon}
                onValueCommitCallback={value.updateHandler}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const TagFilters = (): React.ReactNode => {
    const [overflowActive, setOverflowActive] = useState<boolean>(false);
    const [showMore, setShowMore] = useState<boolean>(true);

    const containerRef = useRef(null);

    const onShowMoreAction = () => {
      setShowMore(!showMore);
    };

    useEffect(() => {
      const usedRef = containerRef.current;
      window.addEventListener("resize", () =>
        setOverflowActive(checkOverflow(usedRef))
      );

      return () => {
        window.removeEventListener("resize", () =>
          setOverflowActive(checkOverflow(usedRef))
        );
      };
    }, [overflowActive]);

    useLayoutEffect(() => {
      setOverflowActive(checkOverflow(containerRef.current));
    }, []);

    const checkOverflow = (textContainer: HTMLSpanElement | null): boolean => {
      if (textContainer) {
        return textContainer.offsetHeight < textContainer.scrollHeight;
      }
      return false;
    };

    const tagsToFilterBy = (): string[] => {
      return Set(
        basePosts.flatMap(
          (fmPost) => fmPost?.customUserProperties?.categories ?? []
        )
      ).toArray();
    };

    const areTagsAvailable = (): boolean => {
      return tagsToFilterBy().length > 0;
    };

    const isCustomTagFilterSelected = (tag: string): boolean => {
      return (
        postFilters.customCategories.find((element) => element == tag) !=
        undefined
      );
    };

    const handlePostTag = (tag: string): void => {
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      },
        customCategoriesSet = Set(updatedFilters.customCategories);
      let updatedCategories;

      if (customCategoriesSet.has(tag)) {
        updatedCategories = customCategoriesSet.delete(tag);
      } else {
        updatedCategories = customCategoriesSet.add(tag);
      }

      let categoryArray = [...updatedCategories];
      updatedFilters.customCategories = categoryArray;

      // Update URL state and local store
      routerSearchParams.setParams({
        [PostFilterURLParameters.customUserTags]: categoryArray,
      });
      entityFilters.updateFilters(updatedFilters);
    };

    // Don't render this section if no tags are available by the creator
    if (!areTagsAvailable()) return;

    return (
      <div className="flex flex-col h-fit w-full justify-start items-center gap-y-[10px]">
        {SubSectionTitleFactory("Tags")}

        <div
          ref={containerRef}
          className={cn(`px-[20px] w-full overflow-y-hidden`, showMore ? "max-h-[64px]" : "h-full")}
        >
          {/** Tag List */}
          <div className="flex flex-row gap-[8px] flex-wrap justify-start">
            {tagsToFilterBy().map((cuisine: string) => {
              cuisine;
              return (
                <FillableToggleButton
                  key={cuisine}
                  title={cuisine}
                  toggled={isCustomTagFilterSelected(cuisine)}
                  onToggleAction={() => handlePostTag(cuisine)}
                />
              );
            })}
          </div>
        </div>

        <div
          className={cn(`flex w-full px-[20px]`, overflowActive || !showMore ? "" : "hidden")}
        >
          <ShowMoreButton
            showMore={showMore}
            onClickAction={onShowMoreAction}
          />
        </div>
      </div>
    );
  };

  const onClearAction = (): void => {
    const updatedFilters: PostFilters = { ...entityFilters.getStoredFilters() };

    //Sort
    updatedFilters.percentMatchSort =
      UserManager.shared.hasTasteProfile() && !routeObserver.galleryPageActive()
        ? DefaultPostFilters.percentMatchSort
        : false; // Unregistered users / ones without a taste profile can't generate percent match scores
    updatedFilters.qualitySort =
      !UserManager.shared.hasTasteProfile() &&
        !routeObserver.galleryPageActive()
        ? true
        : DefaultPostFilters.qualitySort; // Default sort parameter when no taste profile available and user not viewing their own gallery
    updatedFilters.newestToOldestSort = routeObserver.galleryPageActive()
      ? true
      : DefaultPostFilters.newestToOldestSort; // Default sort parameter for gallery authors viewing their own gallery
    updatedFilters.closestToFarthestSort =
      DefaultPostFilters.closestToFarthestSort;

    // Reservation
    updatedFilters.reservableOnly = DefaultPostFilters.reservableOnly;
    updatedFilters.targetReservationDate =
      DefaultPostFilters.targetReservationDate;
    updatedFilters.targetReservationPartySize =
      DefaultPostFilters.targetReservationPartySize;

    // Cusine
    updatedFilters.cuisineTypes = DefaultPostFilters.cuisineTypes;

    // Ratings
    updatedFilters.creatorRating = DefaultPostFilters.creatorRating;
    updatedFilters.yelpRating = DefaultPostFilters.yelpRating;
    updatedFilters.googleRating = DefaultPostFilters.googleRating;

    // Tags
    updatedFilters.customCategories = DefaultPostFilters.customCategories;

    // All 'more' parameters, don't touch the others
    routerSearchParams.removeParams([
      //Sort
      PostFilterURLParameters.percentMatchSort,
      PostFilterURLParameters.qualitySort,
      PostFilterURLParameters.newestToOldestSort,
      PostFilterURLParameters.closestToFarthestSort,

      // Reservation
      PostFilterURLParameters.reservableOnly,
      PostFilterURLParameters.targetReservationDate,
      PostFilterURLParameters.targetReservationPartySize,

      // Cusine
      PostFilterURLParameters.cuisineTypes,

      // Ratings
      PostFilterURLParameters.creatorRating,
      PostFilterURLParameters.yelpRating,
      PostFilterURLParameters.googleRating,

      // Tags
      PostFilterURLParameters.customUserTags,
    ]);

    entityFilters.updateFilters(updatedFilters);

    // Trigger a search update if the reservable only filter is in use since it's an active filter and not client side only like the others
    if (updatedFilters.reservableOnly != DefaultPostFilters.reservableOnly) {
      entityFilters.setReservableOnlyFilter(false);
    }
  };

  return (
    <div
      className={cn(
        "transition-all ease-in-out flex flex-col pointer-events-auto border-[1px] bg-black bg-opacity-100 border-medium_dark_grey",
        isMobile ? "w-screen rounded-t-[20px]" : "w-full rounded-[10px]"
      )}
    >
      {/** Medium screen container */}
      <div className={`transition-all w-screen md:w-[500px] self-center`}>
        {/** Header */}
        <MenuHeader
          headerTitle={headerTitle}
          onCloseAction={isMobile ? onCloseAction : undefined}
        />

        <div
          className={cn(
            `ease-in-out flex flex-col w-full h-fit gap-y-[15px] p-[24px] overflow-y-auto`,
            isMobile
              ? "max-h-[min(330px,calc(100vh-168px-58px-72px-15px))]"
              : "max-h-[min(600px,calc(100vh-168px-58px-72px-15px))]"
          )}
        >
          {SortOrderToggleSection()}
          {/* TODO(FD-222): Enable when resy rate limit is handled */}
          {/* {Reservations()} */}
          {CuisineFilters()}
          {RatingFilters()}
          {TagFilters()}
        </div>

        {/** Bottom Buttons */}
        <FilterBottomButtons
          onShowAction={() => onCloseAction?.()}
          onClearAction={onClearAction}
          filtersHaveBeenApplied={filtersHaveBeenApplied}
        />
      </div>
    </div>
  );
}
