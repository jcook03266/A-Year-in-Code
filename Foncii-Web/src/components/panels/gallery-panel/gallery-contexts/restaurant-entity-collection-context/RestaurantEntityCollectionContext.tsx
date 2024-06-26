/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Framework
import Script from "next/script";

// Types
import {
    AnalyticsTimespan,
    FmIntegrationCredential,
    FmIntegrationProviders,
    FmUserPost,
    FonciiRestaurant,
    UserBusinessWebsiteAnalyticsDashboard,
    UserMapAnalyticsDashboard,
    UserReservationIntentsAnalyticsDashboard,
} from "../../../../../__generated__/graphql";

// Styling
import ColorRepository, {
    ColorEnum
} from "../../../../../../public/assets/ColorRepository";

// Components
// Local
import GalleryPostCard from "../../../../restaurant-entities/gallery-page/GalleryPostCard";
import FonciiRestaurantCard from "../../../../restaurant-entities/foncii-restaurants/regular-format/FonciiRestaurantCard";
import GalleryAuthorHeader from "../../../../user-posts/gallery-author-header/GalleryAuthorHeader";
import GalleryDisplayToggleButton from "../../../../../components/buttons/utility-buttons/gallery-display-toggle-button/GalleryDisplayToggleButton";
import FonciiToolTip from "../../../../../components/tool-tips/FonciiToolTip";
import InfluencerLeaderboard, {
    InfluencerLeaderboardVariants,
} from "./components/InfluencerLeaderboard";
import RefreshUtilityButton from "../../../../../components/buttons/utility-buttons/refresh-button/RefreshUtilityButton";
import UADTimeSeriesWidget from "../../../../../components/graphs/widgets/user-analytics-time-series-widget/UserAnalyticsTimeSeriesWidget";
import UADEntityDistributionWidget, {
    UADEntityDistributionWidgetColorSchemes,
    UADEntityDistributionWidgetVariants,
} from "../../../../../components/graphs/widgets/user-analytics-entity-distribution-widget/UserAnalyticsEntityDistributionWidget";
import ImportExperiencesLoadingScreen from "../../../../../components/loading-screens/ImportExperiencesLoadingScreen";
import CircularLoadingIndicator from "../../../../../components/loading-indicators/circular-loading-indicator/CircularLoadingIndicator";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../../public/assets/images/ImageRepository";

// Hooks
import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouterSearchParams } from "../../../../../hooks/UseRouterSearchParamsHook";
import { useRouteObserver } from "../../../../../hooks/UseRouteObserver";
import useEntityFilters from "../../../../../hooks/UseEntityFilters";

// Redux
import {
    getFonciiRestaurantsSlice,
    getFonciiUserSlice,
    getMapboxSlice,
    getPostFiltersSlice,
    getUserPostsSlice,
    getVisitedUserSlice,
} from "../../../../../redux/operations/selectors";
import {
    FonciiRestaurantActions,
    FonciiUserActions,
    MapboxActions,
    PostFiltersActions,
    UserPostsActions,
    VisitedUserActions,
} from "../../../../../redux/operations/dispatchers";

// URL State Persistence
import {
    ExternalLinks,
    SharedURLParameters,
} from "../../../../../core-foncii-maps/properties/NavigationProperties";

// Services
import AnalyticsService, {
    AnalyticsEvents,
} from "../../../../../services/analytics/analyticsService";

// Managers
import UserManager from "../../../../../managers/userManager";

// Structured Data Generators
import {
    postImageStructuredDataGenerator,
    postVideoStructuredDataGenerator,
    structuredPostRestaurantCarouselDataGenerator,
    structuredPostRestaurantDataGenerator,
    structuredFonciiRestaurantDataGenerator,
    structuredFonciiRestaurantCarouselDataGenerator,
} from "../../../../../repositories/structured-data-generators";

// Utilities
import { cn } from "../../../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";
import { UnitsOfTimeInMS } from "../../../../../utilities/common/time";

// Types
export enum ExperienceSections {
    myExperiences,
    savedExperiences,
    experienceAnalytics
}

enum ExperienceTabs {
    mapped,
    hidden,
    all,
    deleted
}

enum ExperienceAnalyticsDashboards {
    Map = "My Map",
    Website = "Website",
    Reservations = "Reservations"
}

export default function RestaurantEntityCollection() {
    // Dynamic Routing
    const pathname = usePathname();

    // URL State Persistence
    const routerSearchParams = useRouterSearchParams();
    const searchParams = useSearchParams(); // For parsing initial component state from URL

    // Observers
    const routeObserver = useRouteObserver();

    // State Management
    const fonciiUser = getFonciiUserSlice()(),
        visitedUser = getVisitedUserSlice()(),
        userPosts = getUserPostsSlice()(),
        fonciiRestaurants = getFonciiRestaurantsSlice()(),
        filters = getPostFiltersSlice()(),
        mapboxState = getMapboxSlice()();

    // Entity Filter
    const entityFilters = useEntityFilters();

    // URL-State Hydration
    const parseSelectedSection = () => {
        const section = Number(
            searchParams.get(SharedURLParameters.gallerySection)
        ) as ExperienceSections | undefined;

        // If the user is not the author of the gallery, they should only see experiences
        if (!routeObserver.isCurrentUserGalleryAuthor()) return ExperienceSections.myExperiences;

        return section != undefined ? section : ExperienceSections.myExperiences;
    };

    const parseSelectedTab = () => {
        const tab = Number(searchParams.get(SharedURLParameters.galleryTab)) as
            | ExperienceTabs
            | undefined;

        return tab != undefined ? tab : ExperienceTabs.hidden;
    };

    // Default is the `my experience` section
    const [currentSection, setCurrentSection] = useState<ExperienceSections>(
        parseSelectedSection()
    );
    // The hidden tab is selected by default when the user first views their map as mapped posts will be empty
    const [currentTab, setCurrentTab] = useState<ExperienceTabs>(
        parseSelectedTab()
    );

    // Analytics
    const [currentAnalyticsDashboard, setCurrentAnalyticsDashboard] =
        useState<ExperienceAnalyticsDashboards>(ExperienceAnalyticsDashboards.Map);

    const [selectedAnalyticsTimespan, setSelectedAnalyticsTimespan] =
        useState<AnalyticsTimespan>(AnalyticsTimespan.OneWeek);

    const [isLoadingAnalyticsDashboards, setIsLoadingAnalyticsDashboards] = useState(false);

    const [analyticsDashboards, setAnalyticsDashboards] = useState<{
        userMapAnalyticsDashboard: UserMapAnalyticsDashboard | undefined,
        businessWebsiteAnalyticsDashboard: UserBusinessWebsiteAnalyticsDashboard | undefined,
        reservationIntentsAnalyticsDashboard: UserReservationIntentsAnalyticsDashboard | undefined
    }>({
        userMapAnalyticsDashboard: undefined,
        businessWebsiteAnalyticsDashboard: undefined,
        reservationIntentsAnalyticsDashboard: undefined
    });

    // Scrolling
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Scroll Tracking
    const [relativeScrollOffset, setRelativeScrollOffset] = useState<number>(0);

    const shouldDisplayGalleryAsList = (): boolean => {
        return (
            String(
                routerSearchParams.getParamValue(
                    SharedURLParameters.galleryListFormatToggled
                )
            ) == "true"
        );
    };

    // Browser Detection for backwards compatibility reasons
    const scrollEndTimeout = useRef<NodeJS.Timeout>();
    const [isBrowserSafari, setIsBrowserSafari] = useState(false);

    // Delayed dismissal of import posts loader
    const importPostsTimeout = useRef<NodeJS.Timeout>();
    const IMPORT_POSTS_DISMISS_TRANSITION_DELAY_MS = UnitsOfTimeInMS.second * 4;
    const [importPostsLoaderPresented, setImportPostsLoaderPresented] =
        useState(false);

    useEffect(() => {
        const userAgent = navigator.userAgent,
            isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent);

        // Used for backwards compatibility w/ the 'scrollend' listener, but the 
        // 'scrollend' listener is buggy, not using it for now until full support and stability is achieved.
        setIsBrowserSafari(isSafariBrowser);

        return () => {
            clearTimeout(scrollEndTimeout.current);
            scrollEndTimeout.current = undefined;
        };
    }, []);

    // General updates across post related app states
    useEffect(() => { }, [
        fonciiUser,
        visitedUser,
        userPosts,
        fonciiRestaurants,
        filters
    ]);

    // Force user back to experiences section if they log out
    useEffect(() => {
        if (!fonciiUser.isLoggedIn) {
            switchGalleryToSection(ExperienceSections.myExperiences);
        }
    }, [fonciiUser.isLoggedIn])

    // Post Filter Based UI updates
    useEffect(() => {
        // Force the user back to the top on filter / display format update in order to prevent scrollview artifacts
        scrollToTop();
    }, [shouldDisplayGalleryAsList()]);

    useEffect(() => {
        if (mapboxState.galleryState != "idle") return;

        // Scroll to the currently selected entity
        const restaurantEntityID = filters.currentlySelectedPostID;

        if (restaurantEntityID) MapboxActions.updateGalleryState("scrolling-to-element");
    }, [filters.currentlySelectedPostID]);

    useEffect(() => {
        if (mapboxState.galleryState != "scrolling-to-element") return;

        // Scroll to the currently selected entity
        const restaurantEntityID = filters.currentlySelectedPostID;

        if (restaurantEntityID) {
            scrollToRestaurant({ restaurantID: restaurantEntityID });
            scrollToPost({ postID: restaurantEntityID });
        }
    }, [mapboxState.galleryState, filters.currentlySelectedPostID]);

    // Navigation driven updates
    useEffect(() => {
        fetchData();
        fetchAnalyticsDashboards();

        hydrateComponentFromURLState();
    }, [pathname]);

    // Analytics dashboard updates
    useEffect(() => {
        fetchAnalyticsDashboards();
    }, [selectedAnalyticsTimespan]);

    // Import posts loader delayed dismissal state handler
    useEffect(() => {
        if (userPosts.isImportingPosts) {
            // Importing posts, present the loader
            setImportPostsLoaderPresented(true);
        } else if (importPostsLoaderPresented) {
            // Delay the dismiss when the loader presentation ends
            clearTimeout(importPostsTimeout.current);

            importPostsTimeout.current = setTimeout(() => {
                setImportPostsLoaderPresented(false);
            }, IMPORT_POSTS_DISMISS_TRANSITION_DELAY_MS);
        }

        return () => {
            clearTimeout(importPostsTimeout.current);
            importPostsTimeout.current = undefined;
        };
    }, [userPosts.isImportingPosts]);

    // Initial State Setup
    const hydrateComponentFromURLState = () => {
        setSelectedRestaurantEntityID();
    };

    // Set the initially selected post ID (if any) on-load
    const setSelectedRestaurantEntityID = () => {
        const selectedRestaurantEntityID = searchParams.get(
            SharedURLParameters.selectedPost
        ) as string;
        selectedRestaurantEntityID != null
            ? PostFiltersActions.setCurrentlySelectedPostID(
                selectedRestaurantEntityID
            )
            : PostFiltersActions.clearCurrentlySelectedPostID();
    };

    // State Convenience
    const isLoading = (): boolean => {
        if (routeObserver.explorePageActive()) {
            // Explore page
            return fonciiRestaurants.isLoading;
        } else {
            // Gallery page
            return routeObserver.isCurrentUserGalleryAuthor()
                ? userPosts.isLoading || userPosts.isImportingPosts
                : visitedUser.isLoading;
        }
    };

    const isImportingPosts = (): boolean => {
        return userPosts.isImportingPosts;
    };

    const importPostsFailed = (): boolean => {
        return userPosts.importFailed;
    };

    // Author Data Fetching Logic
    const fetchData = () => {
        // Clear any stale visited user state
        VisitedUserActions.clear();

        // Remove any stale loading state, a new loading sequence will commence below
        FonciiUserActions.setLoadingState(false);
        FonciiUserActions.setIntegrationConnectionInProgressState(false);
        FonciiRestaurantActions.setLoadingState(false);

        // Always refresh the current user's data when they reload
        // Don't do it for this route as it's already done below, no need to refresh 2x
        if (!routeObserver.isGalleryBeingViewedByAuthor())
            FonciiUserActions.refreshUserProfile();

        // Note: Explore Page Data initial fetching handled by the map component, this is for user posts, but if the loaded restaurant
        // count is zero for some reason then this is used as the fallback method to search using the immediate search parameters available

        // User galler / profile data fetching / refreshing
        if (routeObserver.isGalleryBeingViewedByAuthor()) {
            // Import the logged in user's data from the remote,
            // clear any stale filters, and refresh their account data
            FonciiUserActions.refreshAllUserData();
        } else if (routeObserver.isGalleryBeingViewedByVisitor()) {
            // Determine if the user gallery referenced actually exists
            // and if it does then fetch the visited user and their respective posts to use
            VisitedUserActions.getVisitedUser(
                routeObserver.currentUserGalleryAuthorUsername()
            );
        } else if (routeObserver.explorePageActive()) {
            // Fetch new data if no restaurants are being shown (in case the map component is lagging behind)
            if (fonciiRestaurants.fonciiRestaurants.length == 0)
                FonciiRestaurantActions.search({});
        }
    };

    // Analytics Data Fetching
    const fetchAnalyticsDashboards = async () => {
        setIsLoadingAnalyticsDashboards(true);
        const dashboards = await FonciiUserActions.fetchAnalyticsDashboards({ timespan: selectedAnalyticsTimespan });

        setAnalyticsDashboards(dashboards);
        setIsLoadingAnalyticsDashboards(false);
    }

    // Data Providers
    const focusablePosts = (): FmUserPost[] => {
        if (routeObserver.isCurrentUserGalleryAuthor()) {
            // Current User Authored Gallery
            switch (currentTab) {
                case ExperienceTabs.mapped:
                    return getAllVisiblePosts();
                default:
                    return [];
            }
        } else {
            // Visited User gallery
            return getAllVisiblePosts();
        }
    }

    const currentPosts = (): FmUserPost[] => {
        if (routeObserver.isCurrentUserGalleryAuthor()) {
            // Current User Authored Gallery
            switch (currentTab) {
                case ExperienceTabs.mapped:
                    return getAllVisiblePosts();
                case ExperienceTabs.hidden:
                    return getAllHiddenPosts();
                case ExperienceTabs.all:
                    return allPosts();
                case ExperienceTabs.deleted:
                    return getAllDeletedPosts();
                default:
                    return [];
            }
        } else {
            // Visited User gallery
            return getAllVisiblePosts();
        }
    };

    const currentFonciiRestaurants = (): FonciiRestaurant[] => {
        if (gallerySavedSectionActive()) {
            return getAllSavedFonciiRestaurants();
        } else {
            return getAllVisibleFonciiRestaurants();
        }
    };

    const totalPostCount = (): number => {
        return allPosts().length;
    };

    const currentRestaurantEntityCount = (): number => {
        if (routeObserver.explorePageActive() || gallerySavedSectionActive()) {
            return currentFonciiRestaurants().length;
        } else {
            return currentPosts().length;
        }
    };

    // Foncii Restaurants
    const allFonciiRestaurants = (): FonciiRestaurant[] => {
        return [
            ...new Set([
                ...fonciiRestaurants.fonciiRestaurants,
                ...fonciiRestaurants.savedFonciiRestaurants,
            ]),
        ];
    };

    const currentSavedRestaurantsCount = (): number => {
        return getAllSavedFonciiRestaurants().length;
    };

    const getAllSavedFonciiRestaurants = (): FonciiRestaurant[] => {
        return fonciiRestaurants.savedFonciiRestaurants;
    };

    const getAllVisibleFonciiRestaurants = (): FonciiRestaurant[] => {
        return fonciiRestaurants.visibleFonciiRestaurants;
    };

    // User Posts
    const allPosts = (): FmUserPost[] => {
        // User Gallery Page [Hidden + Visible], deleted in its own tab
        if (routeObserver.isCurrentUserGalleryAuthor()) {
            return [...getAllVisiblePosts(), ...getAllHiddenPosts()];
        } else {
            return visitedUser.posts;
        }
    };

    const getAllVisiblePosts = (): FmUserPost[] => {
        // User Gallery Page
        if (routeObserver.isCurrentUserGalleryAuthor()) {
            return userPosts.visiblePosts;
        } else {
            return visitedUser.visiblePosts;
        }
    };

    const getAllHiddenPosts = (): FmUserPost[] => {
        // User Galleries Only
        if (routeObserver.isCurrentUserGalleryAuthor()) {
            // Filter out deleted posts, these belong in their own gallery
            return userPosts.hiddenPosts.filter((post) => !post.deletionPending);
        } else {
            return []; // Visitors can't see hidden posts
        }
    };

    const getAllDeletedPosts = (): FmUserPost[] => {
        // User Galleries Only
        if (routeObserver.isCurrentUserGalleryAuthor()) {
            return userPosts.hiddenPosts.filter(
                (post) => post.deletionPending == true
            );
        } else {
            return []; // Visitors can't see deleted posts
        }
    };

    // Actions
    const toggleGalleryListFormat = () => {
        routerSearchParams.toggleParam(
            SharedURLParameters.galleryListFormatToggled,
            true
        );
    };

    const switchGalleryToSection = (section: ExperienceSections) => {
        routerSearchParams.setParams({
            [SharedURLParameters.gallerySection]: section,
        });

        setCurrentSection(section);
        scrollToTop();
    };

    const switchGalleryToTab = (tab: ExperienceTabs) => {
        routerSearchParams.setParams({ [SharedURLParameters.galleryTab]: tab });

        setCurrentTab(tab);
        scrollToTop();
    };

    // Convenience
    const isUserAccountOldEnoughToSelectTimespan = (
        timespan: AnalyticsTimespan
    ): boolean => {
        const userAccountAge = UserManager.shared.getUserAccountCreationDateInMS();
        let timeElapsedOverTimespan = Date.now();

        switch (timespan) {
            case AnalyticsTimespan.OneWeek:
                timeElapsedOverTimespan -= UnitsOfTimeInMS.week;
                break;
            case AnalyticsTimespan.TwoWeeks:
                timeElapsedOverTimespan -= UnitsOfTimeInMS.week * 2;
                break;
            case AnalyticsTimespan.OneMonth:
                timeElapsedOverTimespan -= UnitsOfTimeInMS.month;
                break;
            case AnalyticsTimespan.SixMonths:
                timeElapsedOverTimespan -= UnitsOfTimeInMS.month * 6;
                break;
            case AnalyticsTimespan.OneYear:
                timeElapsedOverTimespan -= UnitsOfTimeInMS.year;
                break;
            case AnalyticsTimespan.TwoYears:
                timeElapsedOverTimespan -= UnitsOfTimeInMS.year * 2;
                break;
        }

        return userAccountAge <= timeElapsedOverTimespan;
    };

    const isARestaurantEntityCurrentlySelected = (): boolean => {
        return filters.currentlySelectedPostID != null;
    };

    const galleryMyExperiencesSectionActive = (): boolean => {
        return currentSection == ExperienceSections.myExperiences;
    };

    const gallerySavedSectionActive = (): boolean => {
        return currentSection == ExperienceSections.savedExperiences;
    };

    const canDisplayExperienceTabToggleSection = (): boolean => {
        return (
            routeObserver.isCurrentUserGalleryAuthor() &&
            currentSection == ExperienceSections.myExperiences
        );
    };

    // Display the preview cover for the analytics section for new user accounts that haven't yet met the
    // minimum timespan required to display the analytics section ~ 1 week
    const displayAnalyticsSectionPrompt = (): boolean => {
        const timeSinceAccountCreation =
            UserManager.shared.getTimeSinceAccountCreationInMS(),
            oneWeekInMS = UnitsOfTimeInMS.week,
            // The minimum analytics timespan is one week, so don't show the analytics panel until that minimum timespan has passed
            minAnalyticsTimespanRequirement = oneWeekInMS,
            isUserAccountOldEnoughToDisplayAnalytics = timeSinceAccountCreation >= minAnalyticsTimespanRequirement;

        return isUserAccountOldEnoughToDisplayAnalytics;
    };

    const allPostsCount = () => {
        return allPosts().length;
    };

    const mappedPostCount = () => {
        return getAllVisiblePosts().length;
    };

    /**
     * Excludes deleted user posts, those are only accounted for in the `deletedPostCount`
     */
    const hiddenPostCount = () => {
        return getAllHiddenPosts().length;
    };

    const deletedPostCount = () => {
        return getAllDeletedPosts().length;
    };

    const isMappedPostTabDisabled = () => {
        return mappedPostCount() == 0;
    };

    const isDeletedPostTabDisabled = () => {
        return deletedPostCount() == 0;
    };

    const isEntitySelected = (id: string): boolean => {
        return filters.currentlySelectedPostID == id;
    };

    /**
     * Display when the gallery is empty (something is loading) or when posts are being imported / the loader UI is active
     * and waiting to be dismissed
     *
     * @returns -> True if the
     */
    const shouldDisplayGalleryStatusUI = (): boolean => {
        const galleryEmpty = currentRestaurantEntityCount() == 0,
            postsBeingImported = isImportingPosts(),
            postLoaderBeingPresented = importPostsLoaderPresented;

        return galleryEmpty || postsBeingImported || postLoaderBeingPresented;
    };

    // Action Handlers
    const onAnalyticsTimespanChange = (timespan: AnalyticsTimespan) => {
        // Update the timespan
        setSelectedAnalyticsTimespan(timespan);
    };

    // Selects the post and transitions to its associated marker
    const onPostClickAction = (post: FmUserPost) => {
        // Parsing
        const postID = post.id;

        if (filters.currentlySelectedPostID != postID) {
            AnalyticsService.shared.trackGenericEvent(AnalyticsEvents.POST_SELECTED, {
                postID,
                fonciiRestaurantID: post.restaurant?.id,
                isPublic: !post.isHidden,
                isChildPost: post.isChildPost,
                selectionSource: "post-card",
                origin: location.pathname,
            });

            routerSearchParams.setParams({ [SharedURLParameters.selectedPost]: postID });
            PostFiltersActions.setCurrentlySelectedPostID(postID);
        }
    };

    const onFonciiRestaurantClickAction = (
        fonciiRestaurant: FonciiRestaurant
    ) => {
        // Parsing
        const restaurantID = fonciiRestaurant.restaurant.id;

        if (filters.currentlySelectedPostID != restaurantID) {
            AnalyticsService.shared.trackGenericEvent(
                AnalyticsEvents.FONCII_RESTAURANT_SELECTED,
                {
                    fonciiRestaurantID: restaurantID,
                    selectionSource: "foncii-restaurant-card",
                    origin: location.pathname,
                }
            );

            routerSearchParams.setParams({ [SharedURLParameters.selectedPost]: restaurantID });
            PostFiltersActions.setCurrentlySelectedPostID(restaurantID);
        }
    };

    // Automatic Scrollview updating
    const scrollToTop = () => {
        scrollToPosition({ offset: 0 });
    };

    const scrollToPosition = ({
        offset,
        animated = true
    }: {
        offset: number,
        animated?: boolean
    }) => {
        const container = scrollContainerRef.current;

        if (!container) return;

        const scrollHeight = container.scrollHeight,
            clientHeight = container.clientHeight,
            scrollWidth = container.scrollWidth,
            clientWidth = container.clientWidth;

        const isScrollViewVertical =
            scrollHeight > clientHeight && scrollWidth <= clientWidth;

        if (isScrollViewVertical) {
            // Vertical ScrollView
            container.scrollTo({ top: offset, behavior: animated ? "smooth" : "instant" });
        } else {
            // Horizontal ScrollView
            container.scrollTo({ left: offset, behavior: animated ? "smooth" : "instant" });
        }
    }

    // Scrolling logic for restaurant cards and post cards
    const scrollToRestaurant = ({
        restaurantID,
        animated = true,
    }: {
        restaurantID: string;
        animated?: boolean;
    }) => {
        const restaurantCardElement = document.getElementById(restaurantID);

        scrollToElement({
            element: restaurantCardElement,
            animated,
        });
    };

    const scrollToPost = ({
        postID,
        animated = true,
    }: {
        postID: string;
        animated?: boolean;
    }) => {
        const postCardElement = document.getElementById(postID);

        scrollToElement({
            element: postCardElement,
            animated,
        });
    };

    const scrollToElement = ({
        element,
        animated = true,
    }: {
        element: HTMLElement | null;
        animated?: boolean;
    }) => {
        const container = scrollContainerRef.current;

        if (element && container) {
            // Dimensions
            const scrollHeight = container.scrollHeight,
                clientHeight = container.clientHeight,
                scrollWidth = container.scrollWidth,
                clientWidth = container.clientWidth;

            // Determine scroll view orientation
            const isScrollViewVertical =
                scrollHeight > clientHeight && scrollWidth <= clientWidth;

            container.scrollTo({
                top: isScrollViewVertical ? element.offsetTop - container.offsetTop : 0,
                left: isScrollViewVertical
                    ? 0
                    : element.offsetLeft - container.offsetLeft,
                behavior: animated ? "smooth" : "instant",
            });
        }
    };

    // List Virtualization Logic
    /// Used to determine if the post associated with the post card view is in the visible view port for the wall
    const isEntityInViewPort = useCallback(
        () =>
            (id: string): boolean => {
                const targetPostCard = document.getElementById(id);

                // Current container ref
                const container = scrollContainerRef.current;

                // Precondition failure
                // Initial posts aren't added yet / container not initialized yet, show them automatically
                if (!container || !targetPostCard) return true;

                const elementClientRect = targetPostCard?.getClientRects(),
                    rect = elementClientRect[0],
                    rectRightEdge = rect.right,
                    rectBottomEdge = rect.bottom,
                    rectLeftEdge = rect.left,
                    rectTopEdge = rect.top;

                const scrollHeight = container.scrollHeight,
                    clientHeight = container.clientHeight,
                    scrollWidth = container.scrollWidth,
                    clientWidth = container.clientWidth,
                    viewPortRangeBuffer = 1000; // A slight buffer to prevent large gaps in the wall's content from virtualized views

                const isScrollViewVertical =
                    scrollHeight > clientHeight && scrollWidth <= clientWidth;

                if (isScrollViewVertical) {
                    // Vertical ScrollView
                    const viewPortRangeY = [
                        0 - viewPortRangeBuffer,
                        clientHeight + viewPortRangeBuffer,
                    ],
                        isWithinRange =
                            (viewPortRangeY[0] <= rectTopEdge &&
                                rectTopEdge <= viewPortRangeY[1]) ||
                            (viewPortRangeY[0] - viewPortRangeBuffer <= rectBottomEdge &&
                                rectBottomEdge <= viewPortRangeY[1] + viewPortRangeBuffer);

                    return isWithinRange;
                } else {
                    // Horizontal ScrollView
                    const viewPortRangeX = [
                        0 - viewPortRangeBuffer,
                        clientWidth + viewPortRangeBuffer,
                    ],
                        isWithinRange =
                            (viewPortRangeX[0] <= rectLeftEdge &&
                                rectLeftEdge <= viewPortRangeX[1]) ||
                            (viewPortRangeX[0] - viewPortRangeBuffer <= rectRightEdge &&
                                rectRightEdge <= viewPortRangeX[1] + viewPortRangeBuffer);

                    return isWithinRange;
                }

                // Callback updates when scroll offset from top or left changes
            },
        [
            scrollContainerRef.current?.scrollTop,
            scrollContainerRef.current?.scrollLeft,
        ]
    );

    /**
     * An entity view is virtualized if it's not selected and not in the current view port. A secondary failsafe
     * for non-scrollable scroll views is also enabled in the form of a 10 entity threshold where there must
     * be 10 or more entities in order for entities to be virtualizable at all; this is to prevent entities from being
     * hidden when a scroll view is not scrollable due to a small amount of content within the container that's also invisible.
     *
     * @param entityID
     * @returns -> True if the view tied to the entity with the given ID is supposed to be virtualized, false otherwise.
     */
    const isEntityViewWithIDVirtualized = useCallback(
        () =>
            (entityID: string): boolean => {
                return (
                    !isEntityInViewPort()(entityID) &&
                    !isEntitySelected(entityID) &&
                    currentRestaurantEntityCount() >= 10
                );
            },
        [currentRestaurantEntityCount, isEntityInViewPort, isEntitySelected]
    );

    // Scroll Handlers
    const onScrollHandler = () => {
        // For tracking scroll movement and keeping this component updated in case the scroll
        // state goes stale for some reason.
        scrollOffsetTracker();

        if (mapboxState.galleryState != "scrolling-to-element") {
            MapboxActions.updateGalleryState("scrolling");

            // Custom functionality handlers
            autoSelectCardOnScroll();
            paginationOnScrollHandler();
        }

        // Cancel any pending timeouts
        clearTimeout(scrollEndTimeout.current);

        // Reasonable timeout, adjust as needed.
        scrollEndTimeout.current = setTimeout(() => {
            handleScrollTransitionEnd();
        }, 100);
    };

    const handleScrollTransitionEnd = () => {
        MapboxActions.updateGalleryState('idle');
    };

    const scrollOffsetTracker = () => {
        // Current container ref
        const container = scrollContainerRef.current;

        // Precondition failure
        if (!container) return;

        const scrollOffsetFromTop = container.scrollTop,
            scrollOffsetFromLeft = container.scrollLeft,
            scrollHeight = container.scrollHeight,
            clientHeight = container.clientHeight,
            scrollWidth = container.scrollWidth,
            clientWidth = container.clientWidth,
            scrollOffsetY = scrollHeight - clientHeight,
            scrollOffsetX = scrollWidth - clientWidth;

        let relativeScrollOffset = 0;
        const isScrollViewVertical =
            scrollHeight > clientHeight && scrollWidth <= clientWidth;

        if (isScrollViewVertical) {
            relativeScrollOffset =
                scrollOffsetY > 0 ? scrollOffsetFromTop / scrollOffsetY : 0;
        } else {
            relativeScrollOffset =
                scrollOffsetX > 0 ? scrollOffsetFromLeft / scrollOffsetX : 0;
        }

        setRelativeScrollOffset(relativeScrollOffset);
    };

    const paginationOnScrollHandler = async () => {
        if (fonciiRestaurants.loadingSavedRestaurants || mapboxState.galleryState != "scrolling")
            return;

        // Current container ref
        const container = scrollContainerRef.current;

        // Precondition failure
        if (!container) return;

        const scrollOffsetFromTop = container.scrollTop,
            scrollOffsetFromLeft = container.scrollLeft,
            scrollHeight = container.scrollHeight,
            clientHeight = container.clientHeight,
            scrollWidth = container.scrollWidth,
            clientWidth = container.clientWidth,
            scrollOffsetY = scrollHeight - clientHeight,
            scrollOffsetX = scrollWidth - clientWidth;

        let relativeScrollOffset = 0;
        const isScrollViewVertical =
            scrollHeight > clientHeight && scrollWidth <= clientWidth;

        if (isScrollViewVertical) {
            relativeScrollOffset =
                scrollOffsetY > 0 ? scrollOffsetFromTop / scrollOffsetY : 0;
        } else {
            relativeScrollOffset =
                scrollOffsetX > 0 ? scrollOffsetFromLeft / scrollOffsetX : 0;
        }

        const paginationBuffer = 0.2,
            shouldPaginate = relativeScrollOffset >= 1 - paginationBuffer;

        // Handle required pagination
        if (shouldPaginate) {
            // Paginate saved restaurants list when section is active
            if (gallerySavedSectionActive()) {
                await FonciiRestaurantActions.paginateSavedRestaurants();
            }
        }
    };

    const autoSelectCardOnScroll = () => {
        if (shouldDisplayGalleryStatusUI() || mapboxState.galleryState != "scrolling") return;

        // Current container ref
        const container = scrollContainerRef.current;

        // Precondition failure
        if (!container) return;

        const scrollOffsetFromTop = container.scrollTop,
            scrollOffsetFromLeft = container.scrollLeft,
            scrollHeight = container.scrollHeight,
            clientHeight = container.clientHeight,
            scrollWidth = container.scrollWidth,
            clientWidth = container.clientWidth,
            scrollOffsetY = scrollHeight - clientHeight,
            scrollOffsetX = scrollWidth - clientWidth;

        let relativeScrollOffset = 0;

        const isScrollViewVertical =
            scrollHeight > clientHeight && scrollWidth <= clientWidth;

        if (isScrollViewVertical) {
            relativeScrollOffset =
                scrollOffsetY > 0 ? scrollOffsetFromTop / scrollOffsetY : 0;
        } else {
            relativeScrollOffset =
                scrollOffsetX > 0 ? scrollOffsetFromLeft / scrollOffsetX : 0;
        }

        const selectionBoundaryBuffer = 0,
            rawSelectionIndexComputation = currentRestaurantEntityCount() *
                (relativeScrollOffset + selectionBoundaryBuffer),
            selectedCardIndex = Math.ceil(rawSelectionIndexComputation);

        const normalizedIndex = selectedCardIndex - 1;
        let selectedRestaurantEntityID: string | undefined = undefined;

        if (routeObserver.explorePageActive() || gallerySavedSectionActive()) {
            // Explore restaurants / Saved restaurants
            const fonciiRestaurant: FonciiRestaurant | undefined =
                currentFonciiRestaurants()[normalizedIndex],
                selectedRestaurantID = fonciiRestaurant?.restaurant?.id;

            selectedRestaurantEntityID = selectedRestaurantID;
        } else if (routeObserver.galleryPageActive() && galleryMyExperiencesSectionActive()) {
            // User Posts
            const post: FmUserPost | undefined = focusablePosts()[normalizedIndex],
                selectedPostID = post?.id;

            selectedRestaurantEntityID = selectedPostID;
        }

        if (selectedRestaurantEntityID) {
            // Entity selected, persist to URL and update local state
            routerSearchParams.setParams({
                [SharedURLParameters.selectedPost]: selectedRestaurantEntityID,
            });
            entityFilters.setSelectedRestaurantEntity(selectedRestaurantEntityID);
        } else {
            // No entity selected, remove the last selection state
            routerSearchParams.removeParam(SharedURLParameters.selectedPost);
            PostFiltersActions.clearCurrentlySelectedPostID();
        }
    };

    // Subcomponents
    const AnalyticsDashboardTimespanSelector = ({
        timespan,
        isSelected,
        onChange,
        isDisabled,
    }: {
        timespan: AnalyticsTimespan;
        isSelected: boolean;
        onChange: (timespan: AnalyticsTimespan) => void;
        isDisabled: boolean;
    }) => {
        function getTitleForTimespan(timespan: AnalyticsTimespan): string {
            let title = "";

            switch (timespan) {
                case AnalyticsTimespan.OneWeek:
                    title = "1 week";
                    break;
                case AnalyticsTimespan.TwoWeeks:
                    title = "2 weeks";
                    break;
                case AnalyticsTimespan.OneMonth:
                    title = "1 month";
                    break;
                case AnalyticsTimespan.SixMonths:
                    title = "6 months";
                    break;
                case AnalyticsTimespan.OneYear:
                    title = "1 year";
                    break;
                case AnalyticsTimespan.TwoYears:
                    title = "2 years";
                    break;
            }

            return title.toLowerCase();
        }

        const title = getTitleForTimespan(timespan),
            toolTip = isDisabled
                ? `Metrics unavailable for the last ${title}.`
                : `View your metrics for the last ${title}.`;

        return (
            <FonciiToolTip title={toolTip}>
                <button
                    className={cn(
                        isSelected ? "bg-primary" : "border-[1px] border-medium",
                        "flex items-center backdrop-blur-xl shadow-lg justify-center h-fit w-fit px-[16px] py-[2px] rounded-[16px] hover:opacity-75 transition-all active:scale-95 transform-gpu",
                        isDisabled ? "opacity-50 cursor-not-allowed" : ""
                    )}
                    onClick={() => onChange(timespan)}
                    disabled={isDisabled}
                >
                    <p
                        className={cn(
                            isSelected ? "text-permanent_white" : "text-neutral",
                            "text-[14px] shrink-0 font-normal"
                        )}
                    >
                        {title}
                    </p>
                </button>
            </FonciiToolTip>
        );
    };

    const AnalyticsDashboardViewByDropDown = (): React.ReactNode => {
        // Action handler
        const handleDashboardChange = (event: any) => {
            const newDashboard = event.target.value;

            setCurrentAnalyticsDashboard(newDashboard);
        };

        return (
            <div className="border-[1px] border-medium_dark_grey rounded-[8px] flex items-center justify-center py-[4px] px-[8px] bg-black bg-opacity-50">
                <select
                    id="analytics-view-by-drop-down"
                    className={`text-permanent_white font-normal bg-transparent h-fit w-fit text-[14px] cursor-pointer flex items-center justify-center pr-[16px]`}
                    value={currentAnalyticsDashboard}
                    onChange={handleDashboardChange}
                >
                    {Object.values(ExperienceAnalyticsDashboards).map((dashboard) => {
                        return (
                            <option
                                className="text-[14px] text-permanent_white line-clamp-1 w-fit h-fit font-normal"
                                key={dashboard}
                                value={dashboard}
                            >
                                {dashboard}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    };

    const GalleryStatusUI = (): React.ReactNode => {
        // Fallback in case something goes wrong
        let prompt = "Something Went Wrong";

        if (isLoading()) {
            // Regular Loading
            prompt = routeObserver.explorePageActive()
                ? "Mapping Restaurants"
                : "Mapping Experiences";
        } else if (currentRestaurantEntityCount() == 0 && !isLoading()) {
            // No visible posts / restaurants
            prompt = routeObserver.explorePageActive()
                ? "No Restaurants Available"
                : `No Experiences Available`;
        }

        const AddExperiencesCTA = (): React.ReactNode => {
            const ImportPostsButton = (): React.ReactNode => {
                // Convenience
                const userHasConnectedIntegrationCredentials =
                    UserManager.shared.instagramIntegrationCredential() != undefined,
                    instagramIntegrationCredential =
                        UserManager.shared.instagramIntegrationCredential();

                // Actions
                const importPostButtonAction = () => {
                    if (instagramIntegrationCredential) {
                        const connectedIntegrationCredential =
                            instagramIntegrationCredential;

                        UserPostsActions.importUserPosts({
                            integrationCredential: connectedIntegrationCredential,
                        });
                    } else {
                        // Connect account
                        window.open(
                            ExternalLinks.instagramOAuthRedirectLink(location.origin),
                            "_self"
                        );
                    }
                };

                // Dynamic text
                const buttonTitle = userHasConnectedIntegrationCredentials
                    ? "Import Posts"
                    : "Connect Account",
                    toolTipTitle = userHasConnectedIntegrationCredentials
                        ? "Import your existing posts from your connected social media"
                        : "Connect your social media to Foncii";

                const InstagramIcon = (): React.ReactNode => {
                    return (
                        <Image
                            src={ImageRepository.CompanyLogos.InstagramLogo}
                            height={20}
                            width={20}
                            alt="Instagram Logo"
                        />
                    );
                };

                return (
                    <button
                        className="flex flex-row gap-x-[16px] w-full sm:w-[70%] px-[48px] h-[50px] justify-center items-center rounded-[10px] text-permanent_white text-[16px] xl:text-[18px] line-clamp-1 font-normal hover:opacity-75 active:scale-90 transition-all ease-in-out"
                        style={{
                            background:
                                ColorRepository.gradients.instagram_connect_account_button_gradient,
                            boxShadow: "0px 10px 20px 0px rgba(24, 119, 242, 0.25)",
                        }}
                        onClick={importPostButtonAction}
                    >
                        {InstagramIcon()}
                        <FonciiToolTip title={toolTipTitle}>
                            <p>{buttonTitle}</p>
                        </FonciiToolTip>
                    </button>
                );
            };

            const AddExperienceButton = (): React.ReactNode => {
                // Actions
                const createNewPost = async () => {
                    const newPost = await FonciiUserActions.createNewUserPost(),
                        newPostID = newPost?.id,
                        username = UserManager.shared.currentUser()?.username;

                    // Present the newly created post to the user with edit access requested
                    if (newPost && newPostID && username) {
                        routerSearchParams.setParams({
                            [SharedURLParameters.detailViewForPost]: newPostID,
                            [SharedURLParameters.isEditingPost]: true,
                        });
                    }
                };

                const FonciiIcon = (): React.ReactNode => {
                    return (
                        <Image
                            src={ImageRepository.CompanyLogos.FonciiLogo}
                            height={44}
                            width={44}
                            className="h-[36px] w-[36px] xl:h-[40px] xl:w-[40px]"
                            alt="Foncii Logo"
                        />
                    );
                };

                return (
                    <FonciiToolTip title="Manually add a new experience">
                        <button
                            className="flex flex-row gap-x-[16px] h-fit w-fit shrink-0 xl:text-[18px] justify-center items-center rounded-[10px] text-permanent_white text-[16px] line-clamp-1 font-normal hover:opacity-75 active:scale-90 transition-all ease-in-out"
                            onClick={createNewPost}
                        >
                            {FonciiIcon()}
                            <p className="font-semibold text-[16px] xl:text-[18px] text-permanent_white">
                                Add experience
                            </p>
                        </button>
                    </FonciiToolTip>
                );
            };

            return (
                <div
                    className={cn(
                        "pointer-events-auto flex h-[150px] md:h-[200px] xl:h-[50dvh] items-center justify-center w-[92.5dvw] pl-[20px] xl:pl-[0px] xl:pr-[0px] xl:w-full",
                        shouldDisplayGalleryAsList()
                            ? "h-[60dvh] w-full pl-[0px] pr-[0px]"
                            : "xl:max-w-[590px]"
                    )}
                >
                    <div className="flex flex-col gap-y-[8px] xl:gap-y-[38px] w-full h-full items-center justify-start xl:justify-center overflow-hidden overflow-y-auto">
                        <div className="flex flex-col gap-y-[8px] xl:gap-y-[16px] w-full h-fit items-center justify-center text-center">
                            <p className="text-[18px] xl:text-[24px] font-medium text-permanent_white xl:leading-[1.1] xl:max-w-[400px] leading-[1.1]">
                                Let’s start showing off your favorite spots!
                            </p>
                            <p className="text-[14px] xl:text-[16px] font-normal text-neutral xl:max-w-[400px]">
                                Start adding experiences by connecting your Instagram or
                                manually adding your favorite spots.
                            </p>
                        </div>
                        <div className="flex flex-col gap-y-[8px] xl:gap-y-[16px] w-full h-fit items-center justify-center">
                            {ImportPostsButton()}
                            <p className="text-[14px] xl:text-[16px] font-normal text-permanent_white">
                                or
                            </p>
                            {AddExperienceButton()}
                        </div>
                    </div>
                </div>
            );
        };

        // Only display for authors importing their posts + when the gallery is loading ~ importing posts
        const shouldDisplayImportPostsLoader =
            (isImportingPosts() || importPostsLoaderPresented) &&
            routeObserver.isGalleryBeingViewedByAuthor();

        // Only display when the current tab is hidden / mapped / all in the author's gallery
        // + no posts available + not currently loading
        const shouldDisplayAddPostsCTA =
            (currentTab == ExperienceTabs.hidden ||
                currentTab == ExperienceTabs.mapped ||
                currentTab == ExperienceTabs.all) &&
            totalPostCount() == 0 &&
            routeObserver.isGalleryBeingViewedByAuthor() &&
            !isLoading();

        if (shouldDisplayImportPostsLoader) {
            // Post import loading screen
            return (
                <ImportExperiencesLoadingScreen
                    isLoading={isImportingPosts()}
                    errorDidOccur={importPostsFailed()}
                    className={cn(
                        "xl:pt-[60px]",
                        shouldDisplayGalleryAsList() ? "pt-[60px]" : ""
                    )}
                />
            );
        } else if (shouldDisplayAddPostsCTA) {
            // Add experience call to action
            return AddExperiencesCTA();
        } else {
            // Generic prompt + circular loader
            return (
                <div
                    className={cn(
                        "pointer-events-none flex h-[150px] md:h-[200px] xl:h-[60dvh] items-center justify-center w-[92.5dvw] pl-[20px] xl:pl-[0px] xl:pr-[0px] xl:w-full",
                        shouldDisplayGalleryAsList()
                            ? "h-[60dvh] w-full pl-[0px] pr-[0px]"
                            : ""
                    )}
                >
                    <div
                        className={`bg-black h-fit w-fit items-center justify-center flex flex-row gap-x-[10px] px-[20px] py-[10px] rounded-lg border border-medium_dark_grey`}
                    >
                        <CircularLoadingIndicator
                            isLoading={isLoading()}
                            className="inline w-4 h-4 text-white animate-spin"
                        />
                        <h2
                            className={`line-clamp-2 text-[16px] font-medium text-permanent_white`}
                        >
                            {prompt}
                        </h2>
                    </div>
                </div>
            );
        }
    };

    // Sections
    const ExperienceSectionToggleSection = (): React.ReactNode => {
        if (!routeObserver.isCurrentUserGalleryAuthor()) return undefined;

        return (
            <div className="z-[-1] w-full justify-start flex flex-row gap-x-[16px] items-end font-medium text-[16px] shrink-0 pointer-events-auto pt-[8px]">
                {/** My experiences section */}
                <ExperienceSectionToggleButton
                    onClick={() => {
                        switchGalleryToSection(ExperienceSections.myExperiences);
                    }}
                    title={"My Experiences"}
                    isDisabled={false}
                    isSelected={currentSection == ExperienceSections.myExperiences}
                    withUnderline
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path
                            d="M4.03271 8.52002C4.41258 9.48913 5.05145 10.321 5.85436 10.9471L6.50186 9.34333C6.31193 9.15466 6.13063 8.94883 5.98386 8.72585C5.89752 8.5972 5.74212 8.52002 5.58672 8.52002H4.03271Z"
                            fill={
                                currentSection == ExperienceSections.myExperiences
                                    ? ColorRepository.colors[ColorEnum.permanent_white]
                                    : ColorRepository.colors[ColorEnum.medium]
                            }
                        />
                        <path
                            d="M6.92485 2.97122C7.65005 2.43092 8.55656 2.10502 9.53213 2.12218C10.6372 2.13933 11.6387 2.57671 12.3898 3.27996H14.4704C14.4704 3.27996 14.4791 3.27996 14.4877 3.27996C13.5466 1.76198 11.9236 0.707105 10.0501 0.527005C7.77092 0.3126 5.73344 1.3932 4.58521 3.11701H6.47591C6.63995 3.12559 6.80398 3.07413 6.92485 2.97122Z"
                            fill={
                                currentSection == ExperienceSections.myExperiences
                                    ? ColorRepository.colors[ColorEnum.permanent_white]
                                    : ColorRepository.colors[ColorEnum.medium]
                            }
                        />
                        <path
                            d="M15.3337 5.81868C15.2992 5.39845 15.2128 4.98679 15.092 4.59229C15.0833 4.60086 15.0833 4.60086 15.0747 4.60944C13.8229 5.49278 13.6675 5.55282 13.6502 5.55282C13.6934 5.7758 13.7193 6.00736 13.7279 6.24749C13.7797 8.2972 12.3466 10.021 10.43 10.4584L8.11621 12.0278C8.55651 12.1307 9.01408 12.1822 9.48028 12.1822C12.8991 12.1736 15.6359 9.27488 15.3337 5.81868Z"
                            fill={
                                currentSection == ExperienceSections.myExperiences
                                    ? ColorRepository.colors[ColorEnum.permanent_white]
                                    : ColorRepository.colors[ColorEnum.medium]
                            }
                        />
                        <path
                            d="M7.00239 8.17685C6.94196 8.06536 6.82972 7.99675 6.70885 7.99675H4.59368C4.33468 7.99675 4.08431 7.90241 3.90301 7.72231L3.73897 7.56794C3.64401 7.4736 3.71308 7.31923 3.85121 7.31923H6.25129C6.40669 7.31923 6.41532 7.06194 6.39805 6.90757L6.37215 6.83039C6.35489 6.7875 6.31172 6.76178 6.26855 6.76178H3.34184C3.0742 6.76178 2.82384 6.65886 2.64254 6.47876L2.49577 6.33297C2.4008 6.23863 2.46987 6.08426 2.608 6.08426L6.15632 6.09283C6.24265 6.09283 6.25992 5.96419 6.26855 5.86128C6.27719 5.80982 6.27719 5.74979 6.28582 5.68975C6.29445 5.62972 6.24265 5.56969 6.18222 5.56969H2.15907C1.90007 5.56969 1.6497 5.47535 1.4684 5.29525L1.30436 5.14088C1.2094 5.04654 1.27846 4.89217 1.4166 4.89217H6.47575C6.52755 4.89217 6.57072 4.86644 6.59662 4.82356C6.63115 4.7721 6.66569 4.71207 6.66569 4.71207L6.77792 4.53197C6.84699 4.46336 6.79519 4.36045 6.70022 4.36045H0.898593C0.639592 4.36045 0.389224 4.26611 0.207923 4.08601L0.0438898 3.93164C-0.0510774 3.8373 0.0179886 3.68293 0.156123 3.68293H8.35783C8.64273 3.68293 8.77223 4.00882 8.57366 4.18892C7.83119 4.85786 6.77792 6.01565 7.57219 6.62456C7.65853 6.69317 7.77076 6.7189 7.88299 6.7189C8.2715 6.7189 9.29887 6.7189 9.6701 6.7189C9.8255 6.7189 9.9809 6.68459 10.119 6.61598C10.3262 6.51307 10.5507 6.30724 10.4126 5.92131C10.378 5.8184 10.3176 5.72406 10.2485 5.62972C10.1449 5.4925 9.92047 5.32955 9.65284 5.12373C9.22117 4.78925 9.26433 4.11174 9.8255 3.57144C9.8255 3.57144 9.23843 3.5114 9.47153 2.92822C9.47153 2.92822 9.6701 3.18551 9.98091 3.16836C10.2917 3.1512 11.0514 3.16836 11.0514 3.16836C11.0514 3.16836 11.7248 3.16836 11.8198 3.61432H15.9897C15.9897 3.61432 16.0761 3.79442 15.748 3.84588C15.6271 3.86303 15.5063 3.90591 15.4113 3.97452L13.771 5.08942C13.5724 5.22664 13.3566 5.32955 13.1235 5.40674C12.6055 5.56969 11.8198 5.62114 11.6212 4.56627C11.6126 4.50624 11.5608 4.46336 11.5004 4.45478C11.4054 4.43763 11.1982 4.36902 11.0946 4.60058C11.0601 4.68634 11.0514 4.78068 11.0773 4.86644C11.1119 5.00366 11.1982 5.23522 11.4227 5.42389C11.768 5.73263 12.4846 6.40158 12.4846 6.40158C12.4846 6.40158 13.9264 7.30208 12.4846 8.65711L5.36205 13.4855C5.29298 13.5284 5.20665 13.4683 5.23255 13.3912C5.83689 11.9075 6.43259 10.4152 7.03692 8.93155C7.05419 8.88009 7.08009 8.81148 7.08873 8.72572C7.09736 8.68284 7.11462 8.56277 7.08873 8.42556C7.07146 8.33122 7.03692 8.24546 7.00239 8.17685Z"
                            fill={
                                currentSection == ExperienceSections.myExperiences
                                    ? ColorRepository.colors[ColorEnum.permanent_white]
                                    : ColorRepository.colors[ColorEnum.medium]
                            }
                        />
                    </svg>
                    <p className={cn("shadow-xl")}>My Experiences</p>
                </ExperienceSectionToggleButton>

                {/** Saved experiences section */}
                <ExperienceSectionToggleButton
                    onClick={() => {
                        switchGalleryToSection(ExperienceSections.savedExperiences);
                    }}
                    title={"Saved Experiences"}
                    isDisabled={currentSavedRestaurantsCount() == 0}
                    isSelected={currentSection == ExperienceSections.savedExperiences}
                    withUnderline
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path
                            d="M11.5 2H4.5C4.23478 2 3.98043 2.10536 3.79289 2.29289C3.60536 2.48043 3.5 2.73478 3.5 3V14C3.50004 14.0892 3.52397 14.1768 3.56929 14.2537C3.6146 14.3306 3.67967 14.3939 3.75772 14.4371C3.83578 14.4804 3.92399 14.5019 4.01319 14.4996C4.10239 14.4972 4.18933 14.471 4.265 14.4237L8 12.0894L11.7356 14.4237C11.8113 14.4709 11.8982 14.4969 11.9873 14.4992C12.0764 14.5015 12.1645 14.4799 12.2424 14.4367C12.3204 14.3934 12.3854 14.3302 12.4307 14.2534C12.4759 14.1766 12.4999 14.0891 12.5 14V3C12.5 2.73478 12.3946 2.48043 12.2071 2.29289C12.0196 2.10536 11.7652 2 11.5 2ZM11.5 13.0981L8.26437 11.0763C8.18491 11.0266 8.09308 11.0002 7.99937 11.0002C7.90566 11.0002 7.81384 11.0266 7.73438 11.0763L4.5 13.0981V3H11.5V13.0981Z"
                            fill={
                                currentSection == ExperienceSections.savedExperiences
                                    ? ColorRepository.colors[ColorEnum.permanent_white]
                                    : ColorRepository.colors[ColorEnum.medium]
                            }
                        />
                    </svg>
                    <p className={cn("shadow-xl")}>Saved</p>
                </ExperienceSectionToggleButton>

                {/** Experience analytics section */}
                <ExperienceSectionToggleButton
                    onClick={() => {
                        switchGalleryToSection(ExperienceSections.experienceAnalytics);
                    }}
                    title={"Experience Analytics"}
                    isSelected={currentSection == ExperienceSections.experienceAnalytics}
                    withUnderline
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path
                            d="M14.5 13C14.5 13.1326 14.4473 13.2598 14.3536 13.3536C14.2598 13.4473 14.1326 13.5 14 13.5H2C1.86739 13.5 1.74021 13.4473 1.64645 13.3536C1.55268 13.2598 1.5 13.1326 1.5 13V3C1.5 2.86739 1.55268 2.74021 1.64645 2.64645C1.74021 2.55268 1.86739 2.5 2 2.5C2.13261 2.5 2.25979 2.55268 2.35355 2.64645C2.44732 2.74021 2.5 2.86739 2.5 3V8.89812L5.67063 6.125C5.7569 6.04947 5.86652 6.0059 5.9811 6.00157C6.09569 5.99725 6.20828 6.03244 6.3 6.10125L9.97563 8.85812L13.6706 5.625C13.7191 5.57704 13.7768 5.5395 13.8403 5.51467C13.9038 5.48985 13.9717 5.47827 14.0398 5.48065C14.1079 5.48303 14.1749 5.49931 14.2365 5.5285C14.2981 5.55769 14.3531 5.59917 14.398 5.65038C14.443 5.7016 14.4771 5.76148 14.4981 5.82633C14.5191 5.89119 14.5266 5.95965 14.5202 6.02752C14.5137 6.09538 14.4935 6.16122 14.4607 6.22097C14.4279 6.28073 14.3832 6.33314 14.3294 6.375L10.3294 9.875C10.2431 9.95053 10.1335 9.9941 10.0189 9.99843C9.90431 10.0028 9.79173 9.96756 9.7 9.89875L6.02438 7.14313L2.5 10.2269V12.5H14C14.1326 12.5 14.2598 12.5527 14.3536 12.6464C14.4473 12.7402 14.5 12.8674 14.5 13Z"
                            fill={
                                currentSection == ExperienceSections.experienceAnalytics
                                    ? ColorRepository.colors[ColorEnum.permanent_white]
                                    : ColorRepository.colors[ColorEnum.medium]
                            }
                        />
                    </svg>
                    <p className={cn("shadow-xl")}>Analytics</p>
                </ExperienceSectionToggleButton>
            </div>
        );
    };

    const storedIntegrationCredential = ():
        | FmIntegrationCredential
        | undefined => {
        return fonciiUser.integrationCredentials?.find(
            (storedCred) => storedCred?.provider == FmIntegrationProviders.Instagram
        );
    };

    const getLastUpdatedString = (): string | undefined => {
        const lastUpdated = storedIntegrationCredential()?.lastUpdated;

        // Precondition failure
        if (!lastUpdated) {
            return undefined;
        }

        const dateObj = new Date(lastUpdated);
        return "Last updated " + dateObj.toLocaleString();
    };

    const manualInstagramRefreshAction = (): void => {
        const integrationCredential = storedIntegrationCredential();
        if (integrationCredential) {
            UserPostsActions.importUserPosts({ integrationCredential });
        }
    };

    const ExperienceTabToggleSection = (): React.ReactNode => {
        if (!canDisplayExperienceTabToggleSection()) return undefined;

        return (
            <div className="z-[-1] w-full justify-start flex flex-row gap-x-[16px] items-end font-medium text-[16px] shrink-0 pointer-events-auto py-[16px] overflow-x-auto overflow-y-hidden no-scrollbar">
                {/** Mapped posts tab */}
                <ExperienceTabToggleButton
                    onClick={() => {
                        switchGalleryToTab(ExperienceTabs.mapped);
                    }}
                    title={
                        mappedPostCount() == 0
                            ? "You have no mapped experiences. Add restaurants to your hidden experiences"
                            : `${mappedPostCount()} Mapped experience${mappedPostCount() > 1 ? "s" : ""
                            }`
                    }
                    isDisabled={isMappedPostTabDisabled()}
                    isSelected={currentTab == ExperienceTabs.mapped}
                    className={"px-[16px]"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path
                            d="M8 1C6.54182 1.00165 5.14383 1.58165 4.11274 2.61274C3.08165 3.64383 2.50165 5.04182 2.5 6.5C2.5 11.2063 7.5 14.7606 7.71313 14.9094C7.7972 14.9683 7.89735 14.9999 8 14.9999C8.10265 14.9999 8.2028 14.9683 8.28687 14.9094C8.5 14.7606 13.5 11.2063 13.5 6.5C13.4983 5.04182 12.9184 3.64383 11.8873 2.61274C10.8562 1.58165 9.45818 1.00165 8 1ZM8 4.5C8.39556 4.5 8.78224 4.6173 9.11114 4.83706C9.44004 5.05682 9.69638 5.36918 9.84776 5.73463C9.99913 6.10009 10.0387 6.50222 9.96157 6.89018C9.8844 7.27814 9.69392 7.63451 9.41421 7.91421C9.13451 8.19392 8.77814 8.3844 8.39018 8.46157C8.00222 8.53874 7.60009 8.49913 7.23463 8.34776C6.86918 8.19638 6.55682 7.94004 6.33706 7.61114C6.1173 7.28224 6 6.89556 6 6.5C6 5.96957 6.21071 5.46086 6.58579 5.08579C6.96086 4.71071 7.46957 4.5 8 4.5Z"
                            fill={
                                currentTab == ExperienceTabs.mapped
                                    ? ColorRepository.colors[ColorEnum.permanent_white]
                                    : ColorRepository.colors[ColorEnum.neutral]
                            }
                        />
                    </svg>
                    <p>Mapped</p>
                </ExperienceTabToggleButton>

                {/** Hidden posts tab */}
                <ExperienceTabToggleButton
                    onClick={() => {
                        switchGalleryToTab(ExperienceTabs.hidden);
                    }}
                    title={
                        hiddenPostCount() == 0
                            ? "You have no hidden experiences. Import some posts or create a new one from scratch"
                            : `${hiddenPostCount()} Hidden experience${hiddenPostCount() > 1 ? "s" : ""
                            }`
                    }
                    isDisabled={false}
                    isSelected={currentTab == ExperienceTabs.hidden}
                    className={"px-[16px]"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path
                            d="M3.36999 2.1633C3.32608 2.11381 3.27279 2.07352 3.21319 2.04477C3.1536 2.01603 3.08889 1.99939 3.02282 1.99584C2.95675 1.99228 2.89063 2.00188 2.8283 2.02407C2.76596 2.04625 2.70865 2.08059 2.65969 2.12509C2.61072 2.16959 2.57108 2.22337 2.54305 2.2833C2.51502 2.34324 2.49916 2.40814 2.4964 2.47425C2.49364 2.54035 2.50402 2.60635 2.52695 2.66842C2.54989 2.73048 2.58491 2.78737 2.62999 2.8358L3.83249 4.15893C1.56249 5.55205 0.586244 7.69955 0.543119 7.79705C0.51469 7.861 0.5 7.9302 0.5 8.00018C0.5 8.07016 0.51469 8.13936 0.543119 8.2033C0.564994 8.25268 1.09437 9.42643 2.27124 10.6033C3.83937 12.1708 5.81999 12.9996 7.99999 12.9996C9.12038 13.0059 10.2294 12.7753 11.2544 12.3227L12.6294 13.8358C12.6733 13.8853 12.7266 13.9256 12.7862 13.9543C12.8458 13.9831 12.9105 13.9997 12.9765 14.0033C13.0426 14.0068 13.1087 13.9972 13.1711 13.975C13.2334 13.9529 13.2907 13.9185 13.3397 13.874C13.3886 13.8295 13.4283 13.7757 13.4563 13.7158C13.4843 13.6559 13.5002 13.591 13.503 13.5249C13.5057 13.4588 13.4953 13.3928 13.4724 13.3307C13.4495 13.2686 13.4145 13.2117 13.3694 13.1633L3.36999 2.1633ZM6.32812 6.9033L8.93249 9.76893C8.5403 9.97525 8.09069 10.0455 7.65426 9.96858C7.21783 9.89168 6.81931 9.67201 6.52126 9.34406C6.22321 9.01611 6.04252 8.59846 6.00756 8.15669C5.9726 7.71492 6.08536 7.27405 6.32812 6.9033ZM7.99999 11.9996C6.07624 11.9996 4.39562 11.3002 3.00437 9.92143C2.43332 9.35392 1.94763 8.70655 1.56249 7.99955C1.85562 7.45018 2.79124 5.91268 4.52187 4.9133L5.64687 6.14768C5.21133 6.70549 4.98702 7.39933 5.01358 8.10654C5.04014 8.81375 5.31586 9.4888 5.79202 10.0124C6.26817 10.5359 6.91409 10.8743 7.61561 10.9677C8.31713 11.0611 9.02908 10.9035 9.62562 10.5227L10.5462 11.5352C9.73374 11.8469 8.87023 12.0044 7.99999 11.9996ZM8.37499 6.03518C8.24471 6.01031 8.12963 5.93471 8.05509 5.825C7.98054 5.71529 7.95263 5.58047 7.97749 5.45018C8.00236 5.31989 8.07796 5.20482 8.18767 5.13027C8.29738 5.05573 8.43221 5.02781 8.56249 5.05268C9.19975 5.17622 9.77999 5.50246 10.2167 5.98273C10.6534 6.46301 10.9231 7.07158 10.9856 7.71768C10.998 7.84971 10.9574 7.98123 10.8727 8.08332C10.7881 8.18541 10.6664 8.2497 10.5344 8.26205C10.5188 8.26297 10.5031 8.26297 10.4875 8.26205C10.3625 8.26259 10.2419 8.21631 10.1493 8.13232C10.0568 8.04834 9.99905 7.93274 9.98749 7.8083C9.94541 7.37855 9.76575 6.97386 9.47522 6.65439C9.1847 6.33493 8.79883 6.11776 8.37499 6.03518ZM15.455 8.2033C15.4287 8.26205 14.7956 9.66393 13.37 10.9408C13.3213 10.9858 13.2641 11.0207 13.2018 11.0434C13.1395 11.0661 13.0732 11.0762 13.007 11.073C12.9407 11.0699 12.8758 11.0536 12.8159 11.0251C12.756 10.9966 12.7023 10.9565 12.6581 10.9071C12.6138 10.8577 12.5799 10.7999 12.5582 10.7373C12.5365 10.6746 12.5274 10.6082 12.5316 10.542C12.5358 10.4758 12.5531 10.4111 12.5826 10.3517C12.612 10.2922 12.653 10.2393 12.7031 10.1958C13.4025 9.56744 13.9901 8.82478 14.4406 7.99955C14.0546 7.29191 13.5679 6.64411 12.9956 6.07643C11.6044 4.69893 9.92374 3.99955 7.99999 3.99955C7.59465 3.99906 7.18996 4.03188 6.78999 4.09768C6.72495 4.10918 6.65828 4.10768 6.59382 4.09327C6.52936 4.07886 6.46839 4.05181 6.41444 4.01371C6.3605 3.9756 6.31463 3.92718 6.2795 3.87124C6.24437 3.81531 6.22067 3.75297 6.20978 3.68782C6.19888 3.62268 6.20099 3.55602 6.216 3.49169C6.23101 3.42737 6.25862 3.36666 6.29723 3.31307C6.33583 3.25947 6.38468 3.21406 6.44093 3.17945C6.49719 3.14484 6.55975 3.12172 6.62499 3.11143C7.07947 3.03639 7.53936 2.99897 7.99999 2.99955C10.18 2.99955 12.1606 3.8283 13.7287 5.39643C14.9056 6.5733 15.435 7.74768 15.4569 7.79705C15.4853 7.861 15.5 7.9302 15.5 8.00018C15.5 8.07016 15.4853 8.13936 15.4569 8.2033H15.455Z"
                            fill={
                                currentTab == ExperienceTabs.hidden
                                    ? ColorRepository.colors[ColorEnum.permanent_white]
                                    : ColorRepository.colors[ColorEnum.neutral]
                            }
                        />
                    </svg>
                    <p>Hidden</p>
                </ExperienceTabToggleButton>

                {/** All posts tab */}
                <ExperienceTabToggleButton
                    onClick={() => {
                        switchGalleryToTab(ExperienceTabs.all);
                    }}
                    title={
                        allPostsCount() == 0
                            ? "You have no experiences. Import some posts or create a new one from scratch"
                            : `${allPostsCount()} Experience${allPostsCount() > 1 ? "s" : ""}`
                    }
                    isDisabled={false}
                    isSelected={currentTab == ExperienceTabs.all}
                    className={"px-[16px]"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path
                            d="M4.5 3.75C4.5 3.89834 4.45601 4.04334 4.3736 4.16668C4.29119 4.29001 4.17406 4.38614 4.03701 4.44291C3.89997 4.49968 3.74917 4.51453 3.60368 4.48559C3.4582 4.45665 3.32456 4.38522 3.21967 4.28033C3.11478 4.17544 3.04335 4.0418 3.01441 3.89632C2.98547 3.75083 3.00032 3.60003 3.05709 3.46299C3.11386 3.32594 3.20999 3.20881 3.33332 3.1264C3.45666 3.04399 3.60166 3 3.75 3C3.94891 3 4.13968 3.07902 4.28033 3.21967C4.42098 3.36032 4.5 3.55109 4.5 3.75ZM8 3C7.85167 3 7.70666 3.04399 7.58332 3.1264C7.45999 3.20881 7.36386 3.32594 7.30709 3.46299C7.25033 3.60003 7.23547 3.75083 7.26441 3.89632C7.29335 4.0418 7.36478 4.17544 7.46967 4.28033C7.57456 4.38522 7.7082 4.45665 7.85368 4.48559C7.99917 4.51453 8.14997 4.49968 8.28701 4.44291C8.42406 4.38614 8.54119 4.29001 8.6236 4.16668C8.70601 4.04334 8.75 3.89834 8.75 3.75C8.75 3.55109 8.67098 3.36032 8.53033 3.21967C8.38968 3.07902 8.19891 3 8 3ZM12.25 4.5C12.3983 4.5 12.5433 4.45601 12.6667 4.3736C12.79 4.29119 12.8861 4.17406 12.9429 4.03701C12.9997 3.89997 13.0145 3.74917 12.9856 3.60368C12.9567 3.4582 12.8852 3.32456 12.7803 3.21967C12.6754 3.11478 12.5418 3.04335 12.3963 3.01441C12.2508 2.98547 12.1 3.00032 11.963 3.05709C11.8259 3.11386 11.7088 3.20999 11.6264 3.33332C11.544 3.45666 11.5 3.60166 11.5 3.75C11.5 3.94891 11.579 4.13968 11.7197 4.28033C11.8603 4.42098 12.0511 4.5 12.25 4.5ZM3.75 7.25C3.60166 7.25 3.45666 7.29399 3.33332 7.3764C3.20999 7.45881 3.11386 7.57594 3.05709 7.71299C3.00032 7.85003 2.98547 8.00083 3.01441 8.14632C3.04335 8.2918 3.11478 8.42544 3.21967 8.53033C3.32456 8.63522 3.4582 8.70665 3.60368 8.73559C3.74917 8.76453 3.89997 8.74968 4.03701 8.69291C4.17406 8.63614 4.29119 8.54002 4.3736 8.41668C4.45601 8.29334 4.5 8.14834 4.5 8C4.5 7.80109 4.42098 7.61032 4.28033 7.46967C4.13968 7.32902 3.94891 7.25 3.75 7.25ZM8 7.25C7.85167 7.25 7.70666 7.29399 7.58332 7.3764C7.45999 7.45881 7.36386 7.57594 7.30709 7.71299C7.25033 7.85003 7.23547 8.00083 7.26441 8.14632C7.29335 8.2918 7.36478 8.42544 7.46967 8.53033C7.57456 8.63522 7.7082 8.70665 7.85368 8.73559C7.99917 8.76453 8.14997 8.74968 8.28701 8.69291C8.42406 8.63614 8.54119 8.54002 8.6236 8.41668C8.70601 8.29334 8.75 8.14834 8.75 8C8.75 7.80109 8.67098 7.61032 8.53033 7.46967C8.38968 7.32902 8.19891 7.25 8 7.25ZM12.25 7.25C12.1017 7.25 11.9567 7.29399 11.8333 7.3764C11.71 7.45881 11.6139 7.57594 11.5571 7.71299C11.5003 7.85003 11.4855 8.00083 11.5144 8.14632C11.5434 8.2918 11.6148 8.42544 11.7197 8.53033C11.8246 8.63522 11.9582 8.70665 12.1037 8.73559C12.2492 8.76453 12.4 8.74968 12.537 8.69291C12.6741 8.63614 12.7912 8.54002 12.8736 8.41668C12.956 8.29334 13 8.14834 13 8C13 7.80109 12.921 7.61032 12.7803 7.46967C12.6397 7.32902 12.4489 7.25 12.25 7.25ZM3.75 11.5C3.60166 11.5 3.45666 11.544 3.33332 11.6264C3.20999 11.7088 3.11386 11.8259 3.05709 11.963C3.00032 12.1 2.98547 12.2508 3.01441 12.3963C3.04335 12.5418 3.11478 12.6754 3.21967 12.7803C3.32456 12.8852 3.4582 12.9567 3.60368 12.9856C3.74917 13.0145 3.89997 12.9997 4.03701 12.9429C4.17406 12.8861 4.29119 12.79 4.3736 12.6667C4.45601 12.5433 4.5 12.3983 4.5 12.25C4.5 12.0511 4.42098 11.8603 4.28033 11.7197C4.13968 11.579 3.94891 11.5 3.75 11.5ZM8 11.5C7.85167 11.5 7.70666 11.544 7.58332 11.6264C7.45999 11.7088 7.36386 11.8259 7.30709 11.963C7.25033 12.1 7.23547 12.2508 7.26441 12.3963C7.29335 12.5418 7.36478 12.6754 7.46967 12.7803C7.57456 12.8852 7.7082 12.9567 7.85368 12.9856C7.99917 13.0145 8.14997 12.9997 8.28701 12.9429C8.42406 12.8861 8.54119 12.79 8.6236 12.6667C8.70601 12.5433 8.75 12.3983 8.75 12.25C8.75 12.0511 8.67098 11.8603 8.53033 11.7197C8.38968 11.579 8.19891 11.5 8 11.5ZM12.25 11.5C12.1017 11.5 11.9567 11.544 11.8333 11.6264C11.71 11.7088 11.6139 11.8259 11.5571 11.963C11.5003 12.1 11.4855 12.2508 11.5144 12.3963C11.5434 12.5418 11.6148 12.6754 11.7197 12.7803C11.8246 12.8852 11.9582 12.9567 12.1037 12.9856C12.2492 13.0145 12.4 12.9997 12.537 12.9429C12.6741 12.8861 12.7912 12.79 12.8736 12.6667C12.956 12.5433 13 12.3983 13 12.25C13 12.0511 12.921 11.8603 12.7803 11.7197C12.6397 11.579 12.4489 11.5 12.25 11.5Z"
                            fill={
                                currentTab == ExperienceTabs.all
                                    ? ColorRepository.colors[ColorEnum.permanent_white]
                                    : ColorRepository.colors[ColorEnum.neutral]
                            }
                        />
                    </svg>
                    <p>All</p>
                </ExperienceTabToggleButton>

                {/** Align rest of components on right */}
                <div className="flex w-full" />

                {/** Resfresh posts tab */}
                <RefreshUtilityButton
                    onClick={manualInstagramRefreshAction}
                    className={cn(
                        `h-[30px] w-[30px] shrink-0 rounded-[15px] border-[1px] border-medium`,
                        storedIntegrationCredential() ? "" : "cursor-not-allowed"
                    )}
                    filled={false}
                    title="Refresh Instagram"
                    subtitle={getLastUpdatedString()}
                    /** Don't allow the user to spam the button if posts are currently being imported */
                    disabled={isImportingPosts()}
                />

                {/** Deleted posts tab */}
                <ExperienceTabToggleButton
                    onClick={() => {
                        switchGalleryToTab(ExperienceTabs.deleted);
                    }}
                    title={
                        deletedPostCount() == 0
                            ? "You have no deleted experiences"
                            : `${deletedPostCount()} Deleted experience${deletedPostCount() > 1 ? "s" : ""
                            }`
                    }
                    isDisabled={isDeletedPostTabDisabled()}
                    isSelected={currentTab == ExperienceTabs.deleted}
                    className={"rounded-full h-[30px] w-[30px] px-[14px]"}
                >
                    <div className="flex items-center justify-center w-fit h-[20px]">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="20"
                            viewBox="0 0 18 20"
                            fill="none"
                            className="p-[2px]"
                        >
                            <path
                                d="M17.25 3.5H13.5V2.75C13.5 2.15326 13.2629 1.58097 12.841 1.15901C12.419 0.737053 11.8467 0.5 11.25 0.5H6.75C6.15326 0.5 5.58097 0.737053 5.15901 1.15901C4.73705 1.58097 4.5 2.15326 4.5 2.75V3.5H0.75C0.551088 3.5 0.360322 3.57902 0.21967 3.71967C0.0790178 3.86032 0 4.05109 0 4.25C0 4.44891 0.0790178 4.63968 0.21967 4.78033C0.360322 4.92098 0.551088 5 0.75 5H1.5V18.5C1.5 18.8978 1.65804 19.2794 1.93934 19.5607C2.22064 19.842 2.60218 20 3 20H15C15.3978 20 15.7794 19.842 16.0607 19.5607C16.342 19.2794 16.5 18.8978 16.5 18.5V5H17.25C17.4489 5 17.6397 4.92098 17.7803 4.78033C17.921 4.63968 18 4.44891 18 4.25C18 4.05109 17.921 3.86032 17.7803 3.71967C17.6397 3.57902 17.4489 3.5 17.25 3.5ZM6 2.75C6 2.55109 6.07902 2.36032 6.21967 2.21967C6.36032 2.07902 6.55109 2 6.75 2H11.25C11.4489 2 11.6397 2.07902 11.7803 2.21967C11.921 2.36032 12 2.55109 12 2.75V3.5H6V2.75ZM15 18.5H3V5H15V18.5ZM7.5 8.75V14.75C7.5 14.9489 7.42098 15.1397 7.28033 15.2803C7.13968 15.421 6.94891 15.5 6.75 15.5C6.55109 15.5 6.36032 15.421 6.21967 15.2803C6.07902 15.1397 6 14.9489 6 14.75V8.75C6 8.55109 6.07902 8.36032 6.21967 8.21967C6.36032 8.07902 6.55109 8 6.75 8C6.94891 8 7.13968 8.07902 7.28033 8.21967C7.42098 8.36032 7.5 8.55109 7.5 8.75ZM12 8.75V14.75C12 14.9489 11.921 15.1397 11.7803 15.2803C11.6397 15.421 11.4489 15.5 11.25 15.5C11.0511 15.5 10.8603 15.421 10.7197 15.2803C10.579 15.1397 10.5 14.9489 10.5 14.75V8.75C10.5 8.55109 10.579 8.36032 10.7197 8.21967C10.8603 8.07902 11.0511 8 11.25 8C11.4489 8 11.6397 8.07902 11.7803 8.21967C11.921 8.36032 12 8.55109 12 8.75Z"
                                fill={
                                    currentTab == ExperienceTabs.deleted
                                        ? ColorRepository.colors[ColorEnum.permanent_white]
                                        : ColorRepository.colors[ColorEnum.neutral]
                                }
                            />
                        </svg>
                    </div>
                </ExperienceTabToggleButton>
            </div>
        );
    };

    const ExperienceSectionToggleButton = ({
        children,
        title,
        onClick,
        isSelected,
        isDisabled = false,
        withUnderline = false,
        className,
    }: {
        children: React.ReactNode;
        title: string;
        onClick: () => void;
        isSelected: boolean;
        isDisabled?: boolean;
        withUnderline?: boolean;
        className?: ClassNameValue;
    }): React.ReactNode => {
        return (
            <FonciiToolTip title={title}>
                <button
                    onClick={onClick}
                    className={cn(
                        "flex flex-col gap-y-[4px] drop-shadow-2xl backdrop-blur-sm hover:opacity-60 items-center justify-center h-fit w-fit shadow-2xl",
                        isSelected ? "text-permanent_white" : "text-neutral",
                        isDisabled ? "text-medium opacity-50 cursor-not-allowed" : "",
                        className
                    )}
                    disabled={isDisabled}
                >
                    <div
                        className={cn(
                            "flex flex-row gap-x-[8px] hover:opacity-60 items-center justify-center h-fit w-fit"
                        )}
                    >
                        {children}
                    </div>

                    {withUnderline ? (
                        <div
                            className={cn(
                                "bg-permanent_white h-[1px] w-full transition-all duration-300 ease-in-out",
                                isSelected ? "" : "opacity-0"
                            )}
                        />
                    ) : undefined}
                </button>
            </FonciiToolTip>
        );
    };

    const ExperienceTabToggleButton = ({
        children,
        title,
        onClick,
        isSelected,
        isDisabled = false,
        className,
    }: {
        children: React.ReactNode;
        title: string;
        onClick: () => void;
        isSelected: boolean;
        isDisabled?: boolean;
        className?: ClassNameValue;
    }): React.ReactNode => {
        return (
            <FonciiToolTip title={title}>
                <button
                    onClick={onClick}
                    className={cn(
                        "flex flex-col hover:opacity-60 active:scale-95 ease-in-out transition-all items-center justify-center h-[30px] w-fit bg-transparent rounded-[15px] border-[1px] border-medium pointer-events-auto text-permanent_white",
                        isSelected ? "bg-primary border-primary" : "",
                        isDisabled ? "opacity-50 cursor-not-allowed" : "",
                        className
                    )}
                    disabled={isDisabled}
                >
                    <div
                        className={cn(
                            "flex flex-row gap-x-[4px] text-[14px] hover:opacity-60 items-center justify-center h-fit w-fit"
                        )}
                    >
                        {children}
                    </div>
                </button>
            </FonciiToolTip>
        );
    };

    const GalleryPropertiesSection = (): React.ReactNode => {
        return (
            <div className="flex flex-col gap-y-[10px] items-center justify-start h-fit">
                <div className="flex w-full h-fit justify-center items-center">
                    <ExperienceSectionToggleSection />
                </div>
            </div>
        );
    };

    const UserPostCollection = (): React.ReactElement => {
        return (
            <>
                {currentPosts().map((post) => {
                    // Visibility policy enforcement
                    // If hidden posts are somehow (outdated data predating policy enforcement, or restaurant deleted from database etc)
                    // loaded into a public user gallery don't render them, best fallback for this unexpected behavior
                    if (post.isHidden && !routeObserver.isGalleryBeingViewedByAuthor())
                        return;

                    // Parsing
                    const entityID = post.id;

                    // A 'virtualized' view is not rendered, but its dimensions are preserved.
                    const entityVirtualized = isEntityViewWithIDVirtualized()(entityID);

                    // Scale entities down to transition between virtualization states
                    return (
                        <span
                            className={cn(
                                "transition-opacity ease-in-out duration-[3000]",
                                entityVirtualized ? "opacity-25" : "opacity-100"
                            )}
                            id={entityID}
                            key={entityID}
                        >
                            <GalleryPostCard
                                post={post}
                                onClickAction={() => onPostClickAction(post)}
                                virtualized={entityVirtualized}
                                disableSaveRestaurantButton={routeObserver.isGalleryBeingViewedByAuthor()}
                                /** Double click to open for non-author map views */
                                doubleClickToOpenDetail={false}
                                className={cn(
                                    "hover:scale-[1.01] transform-gpu",
                                    shouldDisplayGalleryAsList()
                                        ? "min-w-[92dvw] sm:min-w-[45dvw] md:min-w-[250px]"
                                        : ""
                                )}
                            />
                        </span>
                    );
                })}
            </>
        );
    };

    const FonciiRestaurantsCollection = (): React.ReactElement => {
        return (
            <>
                {InfluencerLeaderboardCard()}
                {currentFonciiRestaurants().map((fonciiRestaurant, _) => {
                    // Parsing
                    const entityID = fonciiRestaurant.restaurant.id;

                    // A 'virtualized' view is not rendered, but its dimensions are preserved.
                    const entityVirtualized = isEntityViewWithIDVirtualized()(entityID);

                    // Scale entities down to transition between virtualization states
                    return (
                        <span
                            className={cn(
                                "transition-opacity ease-in-out duration-[3000]",
                                entityVirtualized ? "opacity-25" : "opacity-100"
                            )}
                            id={entityID}
                            key={entityID}
                        >
                            <FonciiRestaurantCard
                                fonciiRestaurant={fonciiRestaurant}
                                onClickAction={() =>
                                    onFonciiRestaurantClickAction(fonciiRestaurant)
                                }
                                virtualized={entityVirtualized}
                                /** Double click to open for all map views */
                                doubleClickToOpenDetail={false}
                                className={cn(
                                    "hover:scale-[1.01] transform-gpu",
                                    shouldDisplayGalleryAsList()
                                        ? "min-w-[92dvw] sm:min-w-[45dvw] md:min-w-[250px]"
                                        : ""
                                )}
                            />
                        </span>
                    );
                })}
            </>
        );
    };

    const CurrentCollection = (): React.ReactNode => {
        if (routeObserver.explorePageActive()) {
            // Explore page foncii restaurants
            return FonciiRestaurantsCollection();
        } else if (routeObserver.galleryPageActive()) {
            if (
                gallerySavedSectionActive() &&
                routeObserver.isGalleryBeingViewedByAuthor()
            ) {
                // Saved foncii restaurants
                return FonciiRestaurantsCollection();
            } else {
                // User posts (current user or visited user)
                return UserPostCollection();
            }
        } else {
            return undefined;
        }
    };

    const GalleryTopSection = (): React.ReactNode => {
        return (
            <div
                className={cn(
                    "hidden h-fit pointer-events-none duration-300 ease-in-out transition-all transform-gpu flex-col px-[20px] top-0 left-0 sticky z-[1]",
                    routeObserver.galleryPageActive() ? "flex" : "xs:flex",
                    shouldDisplayGalleryAsList()
                        ? "backdrop-blur-lg xl:backdrop-blur-none flex"
                        : "",
                    mapboxState.mapState === "moving" &&
                        !isARestaurantEntityCurrentlySelected() &&
                        !shouldDisplayGalleryAsList()
                        ? "opacity-0 md:opacity-100 translate-y-[1000px] md:translate-y-[0px]"
                        : ""
                )}
            >
                <div
                    className={cn(
                        "flex flex-col pointer-events-none justify-between origin-center pt-[12px] h-fit"
                    )}
                >
                    <div className="flex-row flex items-end justify-center w-full">
                        {/** Hidden on non-gallery pages (i.e explore) + when the screen size is not XL */}
                        <span
                            className={cn(
                                "hidden xl:hidden w-full transition-all ease-in-out pb-[12px]",
                                routeObserver.galleryPageActive() &&
                                    !shouldDisplayGalleryAsList()
                                    ? "xl:flex"
                                    : "",
                                routeObserver.galleryPageActive() &&
                                    shouldDisplayGalleryAsList()
                                    ? "flex xl:flex"
                                    : ""
                            )}
                        >
                            <GalleryAuthorHeader />
                        </span>
                    </div>

                    <GalleryPropertiesSection />
                </div>

                {/** Divider */}
                <div
                    className={cn(
                        "h-[1px] w-full bg-medium_light_grey",
                        routeObserver.isGalleryBeingViewedByAuthor()
                            ? ""
                            : cn(
                                routeObserver.galleryPageActive()
                                    ? "hidden xl:flex"
                                    : "hidden"
                            )
                    )}
                />

                <ExperienceTabToggleSection />
            </div>
        );
    };

    const InfluencerLeaderboardSection = (): React.ReactNode => {
        // Don't display when gallery is loading
        if (shouldDisplayGalleryStatusUI()) return;

        return routeObserver.explorePageActive() &&
            !shouldDisplayGalleryAsList() ? (
            <div
                className={cn(
                    "flex w-full h-fit items-center justify-center transition-all ease-in-out pointer-events-auto pt-[16px] xl:flex",
                    shouldDisplayGalleryAsList() ? "flex" : "hidden"
                )}
            >
                <InfluencerLeaderboard
                    // Shimmer loader disabled to prevent unnecessary reloading
                    // isLoading={shouldDisplayInfluencerLeaderboardLoadingIndicator()}
                    className="max-w-[600px]"
                />
            </div>
        ) : undefined;
    };

    const InfluencerLeaderboardCard = (): React.ReactNode => {
        // Don't display when gallery is loading
        if (shouldDisplayGalleryStatusUI()) return;

        return routeObserver.explorePageActive() ? (
            <div
                className={cn(
                    "flex w-full h-fit items-center justify-center transition-all ease-in-out pointer-events-auto xl:hidden",
                    shouldDisplayGalleryAsList() ? "hidden" : "flex"
                )}
            >
                <InfluencerLeaderboard variant={InfluencerLeaderboardVariants.card} />
            </div>
        ) : undefined;
    };

    const CurrentGalleryContent = (): React.ReactNode => {
        switch (currentSection) {
            case ExperienceSections.myExperiences:
            case ExperienceSections.savedExperiences:
                return (
                    <div
                        className={cn(
                            "pointer-events-auto px-[20px]",
                            shouldDisplayGalleryAsList()
                                ? currentRestaurantEntityCount() <= 5
                                    ? "justify-start"
                                    : "justify-center"
                                : "",
                            shouldDisplayGalleryAsList()
                                ? "relative w-full duration-200 items-center gap-[16px] backdrop-blur-lg xl:backdrop-blur-none pt-[24px] pb-[200px] xl:pb-[50px] flex flex-nowrap flex-col sm:flex-row sm:flex-wrap"
                                : `xl:pb-[80px] transition-all duration-200 ease-in-out flex gap-[10px] md:gap-[20px] pb-[20px] xl:grid xl:gap-[16px] ${shouldDisplayGalleryStatusUI() ? "flex" : "xl:grid-cols-2"
                                } w-fit xl:w-full h-fit items-end justify-center`,
                            gallerySavedSectionActive() ||
                                routeObserver.isGalleryBeingViewedByVisitor()
                                ? "pt-[16px]"
                                : ""
                        )}
                    >
                        {shouldDisplayGalleryStatusUI()
                            ? GalleryStatusUI()
                            : CurrentCollection()}
                    </div>
                );
            case ExperienceSections.experienceAnalytics:
                return (
                    <div
                        className={cn(
                            "pointer-events-auto px-[20px] w-full h-fit flex flex-col items-center gap-y-[24px] justify-start pt-[16px] pb-[100px]",
                            shouldDisplayGalleryAsList()
                                ? "max-h-none"
                                : "max-h-[250px] xl:max-w-[590px] overflow-y-auto overflow-x-hidden xl:overflow-hidden xl:max-h-none"
                        )}
                    >
                        {/** Dashboard View By Drop Down + Timespan Selectors */}
                        {AnalyticsDashboardTopSection()}

                        {/** Dynamic Dashboard */}
                        <div
                            className={cn(
                                "flex flex-col gap-x-[16px] gap-y-[24px] h-fit w-full items-center justify-center"
                            )}
                        >
                            {ExperienceAnalyticsSection()}
                        </div>
                    </div>
                );
        }
    };

    const AnalyticsDashboardTopSection = (): React.ReactNode => {
        return (
            <div className="flex flex-col gap-y-[16px] h-fit w-full shrink-0">
                <div className="flex flex-row justify-between items-center w-full h-fit">
                    <AnalyticsDashboardViewBySection />
                    {AnalyticsDashboardSizeToggleButton()}
                </div>

                <AnalyticsDashboardTimespanSelectors />
            </div>
        );
    };

    const AnalyticsDashboardViewBySection = (): React.ReactNode => {
        return (
            <div className="flex flex-row gap-x-[16px] shrink-0 w-fit h-fit items-center justify-start">
                <p className="text-[14px] text-permanent_white font-semibold">
                    View by:
                </p>
                <AnalyticsDashboardViewByDropDown />
            </div>
        );
    };

    const AnalyticsDashboardSizeToggleButton = (): React.ReactNode => {
        // Properties
        const isMinimized = !shouldDisplayGalleryAsList(),
            toolTipTitle = `${isMinimized ? "Maximize" : "Minimize"} Dashboard`;

        // Assets
        const currentIcon = isMinimized
            ? ImageRepository.UtilityIcons.FullScreenIcon
            : ImageRepository.UtilityIcons.ExitFullScreenIcon;

        return (
            <FonciiToolTip title={toolTipTitle}>
                <button
                    className="flex items-center justify-center h-[18px] w-[18px] hover:opacity-75 transition-all active:scale-90 transform-gpu"
                    onClick={toggleGalleryListFormat}
                >
                    <Image
                        src={currentIcon}
                        height={18}
                        width={18}
                        alt={`${toolTipTitle} icon`}
                        className="h-[18px] w-[18px]"
                    />
                </button>
            </FonciiToolTip>
        );
    };

    const AnalyticsDashboardTimespanSelectors = (): React.ReactNode => {
        return (
            <div className="w-full overflow-x-auto overflow-y-hidden h-fit py-[4px] no-scrollbar">
                <div className="flex flex-row gap-x-[16px] w-fit h-fit shrink-0">
                    {[
                        AnalyticsTimespan.OneWeek,
                        AnalyticsTimespan.TwoWeeks,
                        AnalyticsTimespan.OneMonth,
                        AnalyticsTimespan.SixMonths,
                        AnalyticsTimespan.OneYear,
                        AnalyticsTimespan.TwoYears,
                    ].map((timespan) => {
                        const isSelected = selectedAnalyticsTimespan == timespan,
                            isDisabled = !isUserAccountOldEnoughToSelectTimespan(timespan);

                        return (
                            <AnalyticsDashboardTimespanSelector
                                key={timespan}
                                timespan={timespan}
                                isSelected={isSelected}
                                onChange={onAnalyticsTimespanChange}
                                isDisabled={isDisabled}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    const ExperienceAnalyticsSection = (): React.ReactNode => {
        switch (currentAnalyticsDashboard) {
            case ExperienceAnalyticsDashboards.Map:
                return (
                    <>
                        {/** Map Views */}
                        <UADTimeSeriesWidget
                            title="Map views"
                            dataset={analyticsDashboards.userMapAnalyticsDashboard?.mapViewsTimeSeries}
                            totalEventCount={analyticsDashboards.userMapAnalyticsDashboard?.totalMapViews}
                            relativeEventCountChange={analyticsDashboards.userMapAnalyticsDashboard?.relativeMapViewChange}
                            totalEventCounterTitle="Views"
                            informationToolTipDescription="The number of times people have interacted with your Foncii Map"
                            isLoading={isLoadingAnalyticsDashboards}
                            className={cn('max-w-[700px]')}
                        />

                        <div
                            className={cn(
                                "flex flex-col gap-[16px] w-full h-fit justify-center",
                                shouldDisplayGalleryAsList()
                                    ? "items-center sm:flex-row sm:items-start"
                                    : "items-start sm:flex-row xl:items-center "
                            )}
                        >
                            {/** Top Tags */}
                            <UADEntityDistributionWidget
                                title="Top Tags"
                                datasetCounterTitle="Total Tags"
                                dataset={analyticsDashboards.userMapAnalyticsDashboard?.topTagsDistribution}
                                entireDatasetTotalCount={analyticsDashboards.userMapAnalyticsDashboard?.totalTags}
                                colorScheme={UADEntityDistributionWidgetColorSchemes.Green}
                                variant={UADEntityDistributionWidgetVariants.Responsive}
                                className={cn(
                                    shouldDisplayGalleryAsList() ? "w-full" : "w-full xl:w-fit"
                                )}
                                isLoading={isLoadingAnalyticsDashboards}
                            />

                            {/** Top Locations */}
                            <UADEntityDistributionWidget
                                title="Top Locations"
                                datasetCounterTitle="Total Locations"
                                dataset={analyticsDashboards.userMapAnalyticsDashboard?.topLocationsDistribution}
                                entireDatasetTotalCount={analyticsDashboards.userMapAnalyticsDashboard?.totalLocations}
                                colorScheme={UADEntityDistributionWidgetColorSchemes.Blue}
                                variant={UADEntityDistributionWidgetVariants.Responsive}
                                className={cn(
                                    shouldDisplayGalleryAsList() ? "w-full" : "w-full xl:w-fit"
                                )}
                                isLoading={isLoadingAnalyticsDashboards}
                            />
                        </div>

                        {/** Most Viewed Experiences */}
                        <UADEntityDistributionWidget
                            title="Most Viewed Experiences"
                            datasetCounterTitle="Total Views"
                            dataset={analyticsDashboards.userMapAnalyticsDashboard?.mostViewedExperienceDistribution}
                            entireDatasetTotalCount={analyticsDashboards.userMapAnalyticsDashboard?.totalExperienceViews}
                            colorScheme={UADEntityDistributionWidgetColorSchemes.Red}
                            variant={UADEntityDistributionWidgetVariants.Large}
                            isLoading={isLoadingAnalyticsDashboards}
                        />
                    </>
                );
            case ExperienceAnalyticsDashboards.Website:
                return (
                    <>
                        {/** Restaurant Website Clicks */}
                        <UADTimeSeriesWidget
                            title="Restaurant website clicks"
                            dataset={analyticsDashboards.businessWebsiteAnalyticsDashboard?.businessWebsiteClicksTimeSeries}
                            totalEventCount={analyticsDashboards.businessWebsiteAnalyticsDashboard?.totalBusinessWebsiteClicks}
                            relativeEventCountChange={analyticsDashboards.businessWebsiteAnalyticsDashboard?.relativeBusinessWebsiteClicksChange}
                            totalEventCounterTitle="Clicks"
                            informationToolTipDescription="The number of times a person has visited a restaurant’s website through your Foncii Map"
                            isLoading={isLoadingAnalyticsDashboards}
                            className={cn('max-w-[700px]')}
                        />

                        {/** Most Clicked Websites */}
                        <UADEntityDistributionWidget
                            title="Most Clicked Websites"
                            datasetCounterTitle="Total Clicks"
                            dataset={analyticsDashboards.businessWebsiteAnalyticsDashboard?.mostClickedBusinessWebsitesDistribution}
                            entireDatasetTotalCount={analyticsDashboards.businessWebsiteAnalyticsDashboard?.totalBusinessWebsiteClicks}
                            colorScheme={UADEntityDistributionWidgetColorSchemes.Green}
                            variant={UADEntityDistributionWidgetVariants.Large}
                            isLoading={isLoadingAnalyticsDashboards}
                        />
                    </>
                );
            case ExperienceAnalyticsDashboards.Reservations:
                return (
                    <>
                        {/** Reservation Intents */}
                        <UADTimeSeriesWidget
                            title="Reservations attempted"
                            dataset={analyticsDashboards.reservationIntentsAnalyticsDashboard?.reservationIntentsTimeSeries}
                            totalEventCount={analyticsDashboards.reservationIntentsAnalyticsDashboard?.totalReservationIntents}
                            relativeEventCountChange={analyticsDashboards.reservationIntentsAnalyticsDashboard?.relativeReservationIntentsChange}
                            totalEventCounterTitle="Reservations"
                            informationToolTipDescription="The number of times a person has attempted to make a restaurant reservation through your Foncii Map."
                            isLoading={isLoadingAnalyticsDashboards}
                            className={cn('max-w-[700px]')}
                        />

                        {/** Top Reserved Restaurants */}
                        <UADEntityDistributionWidget
                            title="Top Reserved Restaurants"
                            datasetCounterTitle="Total Reserved"
                            dataset={analyticsDashboards.reservationIntentsAnalyticsDashboard?.topReservedRestaurantsDistribution}
                            entireDatasetTotalCount={analyticsDashboards.reservationIntentsAnalyticsDashboard?.totalReservationIntents}
                            colorScheme={UADEntityDistributionWidgetColorSchemes.Blue}
                            variant={UADEntityDistributionWidgetVariants.Large}
                            isLoading={isLoadingAnalyticsDashboards}
                        />
                    </>
                );
        }
    };

    const GallerySection = (): React.ReactNode => {
        return (
            /** Auto hides below md screen size when user is moving map + no entity selected + in map view [Gallery + Map Box Controls + Gallery Display Toggle] */
            <div
                className={cn(
                    "flex flex-col items-start justify-center w-full h-fit transition-all ease-in-out duration-300",
                    {
                        "opacity-0 md:opacity-100 translate-y-[1000px] md:translate-y-[0px]":
                            mapboxState.mapState === "moving" &&
                            !isARestaurantEntityCurrentlySelected() &&
                            !shouldDisplayGalleryAsList(),
                    }
                )}
            >
                {CurrentGalleryContent()}
            </div>
        );
    };

    // Structured restaurant data
    const StructuredDataScripts = () => {
        return (
            <>
                {/** Foncii Restaurants */}
                <Script
                    id="structured-foncii-restaurant-data-markup"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: structuredFonciiRestaurantDataGenerator(
                            getAllVisibleFonciiRestaurants()
                        ),
                    }}
                />

                <Script
                    id="structured-post-restaurant-data-markup"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: structuredFonciiRestaurantCarouselDataGenerator(
                            getAllVisibleFonciiRestaurants()
                        ),
                    }}
                />

                {/** User Posts */}
                <Script
                    id="structured-post-restaurant-carousel-data-markup"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: structuredPostRestaurantDataGenerator(getAllVisiblePosts()),
                    }}
                />

                <Script
                    id="structured-post-restaurant-data-markup"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: structuredPostRestaurantCarouselDataGenerator(
                            getAllVisiblePosts()
                        ),
                    }}
                />

                <Script
                    id="structured-post-video-data-markup"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: postVideoStructuredDataGenerator(getAllVisiblePosts()),
                    }}
                />

                <Script
                    id="structured-post-image-data-markup"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: postImageStructuredDataGenerator(getAllVisiblePosts()),
                    }}
                />
            </>
        );
    };

    const listViewBottomAlign = () => {
        if (shouldDisplayGalleryAsList()) {
            return `right-auto w-full m-auto`;
        } else if (routeObserver.explorePageActive()) {
            return `bottom-[220px] md:bottom-[260px] xl:bottom-[40px]`;
        } else if (routeObserver.isGalleryBeingViewedByVisitor()) {
            return `bottom-[200px] md:bottom-[250px] xl:bottom-[40px]`;
        } else if (routeObserver.isGalleryBeingViewedByAuthor()) {
            const gallerySavedSectionActive =
                Number(searchParams.get(SharedURLParameters.gallerySection)) ==
                ExperienceSections.savedExperiences;
            return `${gallerySavedSectionActive
                ? "bottom-[240px] md:bottom-[280px]"
                : "bottom-[280px] md:bottom-[330px]"
                } xl:bottom-[40px]`;
        } else {
            return `bottom-[220px] md:bottom-[260px] xl:bottom-[40px]`;
        }
    };

    return (
        <>
            {StructuredDataScripts()}
            {GalleryTopSection()}

            <div
                className={cn(
                    `h-full z-[-1] xl:min-w-[590px] transition-all duration-300 ease-in items-end overflow-x-auto overflow-y-hidden xl:overflow-x-hidden xl:overflow-y-auto xl:h-[90dvh]`,
                    routeObserver.explorePageActive()
                        ? "xl:h-[calc(100dvh-100px)]"
                        : "xl:h-[calc(100dvh-180px)]",
                    shouldDisplayGalleryAsList()
                        ? "pb-[140px] backdrop-blur-lg xl:backdrop-blur-none pt-[0px] overflow-x-hidden overflow-y-auto h-[85dvh]"
                        : "xl:pb-[140px]"
                )}
                onScroll={onScrollHandler}
                ref={scrollContainerRef}
            >
                <div className="flex flex-col gap-y-[16px] h-fit w-full items-start justify-center pointer-events-none">
                    {InfluencerLeaderboardSection()}
                    {GallerySection()}
                </div>
            </div>

            {/** Auto hides below md screen size when user is moving map + no entity selected + in map view [Gallery + Map Box Controls + Gallery Display Toggle] */}
            <div
                className={cn(
                    "transition-all ease-in-out duration-300 fixed right-[16px] w-fit xl:right-auto xl:w-full xl:m-auto xl:absolute bottom-[24px] pointer-events-none flex items-center justify-center",
                    listViewBottomAlign(),
                    mapboxState.mapState === "moving" &&
                        !isARestaurantEntityCurrentlySelected() &&
                        !shouldDisplayGalleryAsList()
                        ? "opacity-0 md:opacity-100"
                        : ""
                )}
            >
                <GalleryDisplayToggleButton />
            </div>
        </>
    );
}
