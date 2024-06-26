"use client";
// Dependencies
// Types
import { DefaultPostFilters } from "../types/default-type-values";
import { ArticlePublication, FmUserPost, FonciiRestaurant, RestaurantAward } from "../__generated__/graphql";

// Hooks
import { useRouteObserver } from "./UseRouteObserver";
import { useRouterSearchParams } from "./UseRouterSearchParamsHook";

// Redux
import {
  FonciiRestaurantActions,
  PostFiltersActions,
  UserPostsActions,
  VisitedUserActions,
} from "../redux/operations/dispatchers";
import { getFonciiRestaurantsSlice, getPostFiltersSlice, getUserPostsSlice, getVisitedUserSlice } from "../redux/operations/selectors";

// Services
import AnalyticsService, {
  AnalyticsEvents,
} from "../services/analytics/analyticsService";

// URL-State Persistence
import {
  PostFilterURLParameters,
} from "../core-foncii-maps/properties/NavigationProperties";

const useEntityFilters = () => {
  // Observers
  const routeObserver = useRouteObserver();

  // State Management
  // Redux
  const entityFilters = getPostFiltersSlice()(),
    fonciiRestaurants = getFonciiRestaurantsSlice()(),
    visitedUser = getVisitedUserSlice()(),
    userPosts = getUserPostsSlice()();

  // URL-State Persistence
  const routerSearchParams = useRouterSearchParams();

  // Convenience
  const getStoredFilters = (): PostFilters => {
    return entityFilters;
  };

  const getStoredSearchQuery = (): string | undefined => {
    return entityFilters.searchQuery;
  };

  // Filter logic
  const updateFilters = (
    updatedFilters: PostFilters = getStoredFilters()
  ): void => {
    if (updatedFilters == getStoredFilters()) return;

    PostFiltersActions.setFilters(updatedFilters);

    // Reorganize the appropriate posts to let the updated filters take affect
    sortFilterAndOrganizeRestaurantEntities(updatedFilters);

    AnalyticsService.shared.trackGenericEvent(
      AnalyticsEvents.GALLERY_FILTERS_UPDATED,
      { updatedFilters }
    );
  };

  const sortFilterAndOrganizeRestaurantEntities = (
    updatedFilters: PostFilters = getStoredFilters(),
    searchQuery: string | null | undefined = getStoredSearchQuery()
  ): void => {
    if (routeObserver.explorePageActive()) {
      FonciiRestaurantActions.organizeRestaurants(undefined, updatedFilters);
    } else if (routeObserver.isCurrentUserGalleryAuthor()) {
      UserPostsActions.organizePosts(undefined, updatedFilters, searchQuery);
    } else {
      VisitedUserActions.organizePosts(undefined, updatedFilters, searchQuery);
    }
  };

  const setReservableOnlyFilter = (reservableOnly: boolean): void => {
    const updatedFilters: PostFilters = { ...getStoredFilters() };
    updatedFilters.reservableOnly = reservableOnly;

    if (reservableOnly == DefaultPostFilters.reservableOnly) {
      // Default params values are to be removed as their values are implicit within the code.
      routerSearchParams.removeParam(PostFilterURLParameters.reservableOnly);
    } else {
      routerSearchParams.setParams({
        [PostFilterURLParameters.reservableOnly]: reservableOnly,
      });
    }

    // Update URL state and local store
    updateFilters(updatedFilters);

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

  const selectAllRecognizedFilters = () => {
    const updatedFilters: PostFilters = { ...getStoredFilters() };

    // Helpers
    const filterRestaurantsFromPosts = (
      posts: FmUserPost[]
    ): FonciiRestaurant[] => {
      const filteredPosts = posts.filter((post) => post.restaurant != undefined);
      return filteredPosts.map((post) => post.fonciiRestaurant!);
    };

    // Data Providers
    const baseFonciiRestaurants = (): FonciiRestaurant[] => {
      return fonciiRestaurants.fonciiRestaurants ?? [];
    };

    const basePosts = (): FmUserPost[] => {
      if (routeObserver.explorePageActive()) {
        return baseFonciiRestaurants().flatMap(
          (restaurant) => restaurant.influencerInsightEdges
        );
      } else {
        return routeObserver.isCurrentUserGalleryAuthor()
          ? userPosts.posts
          : visitedUser.posts;
      }
    };

    const baseRestaurants = (): FonciiRestaurant[] => {
      if (routeObserver.explorePageActive()) {
        return baseFonciiRestaurants();
      } else {
        return filterRestaurantsFromPosts(basePosts());
      }
    };

    const filterRestaurantAwardsFromFonciiRestaurants = (): RestaurantAward[] => {
      const uniqueAwards = new Set();
      return baseRestaurants().flatMap((fonciiRestaurant) => {
        // We want the filter row to display restaurant counts for each creator
        return fonciiRestaurant.associatedRestaurantAwardEdges.filter(
          (edge) => {
            if (uniqueAwards.has(edge.organization)) return false;
            uniqueAwards.add(edge.organization);
            return true;
          }
        );
      });
    };

    const filterArticlePublicationsFromFonciiRestaurants = (): ArticlePublication[] => {
      const uniquePublications = new Set<string>();

      return baseRestaurants().flatMap((fonciiRestaurant) => {
        // We want the filter row to display restaurant counts for each creator
        return fonciiRestaurant.associatedArticlePublicationEdges.filter(
          (edge) => {
            if (uniquePublications.has(edge.publication)) return false;
            uniquePublications.add(edge.publication);
            return true;
          }
        );
      });
    };

    // Mapping
    const awardOrganizations = filterRestaurantAwardsFromFonciiRestaurants()
      .map((award) => award.organization),
      publications = filterArticlePublicationsFromFonciiRestaurants()
        .map((article) => article.publication);

    // Update Redux state
    updatedFilters.publications = publications;
    updatedFilters.restaurantAwards = awardOrganizations;

    // Update URL state and local store
    updateFilters(updatedFilters);

    routerSearchParams.setParams({
      [PostFilterURLParameters.publications]: publications,
      [PostFilterURLParameters.restaurantAwards]: awardOrganizations,
    });
  }

  const clearAllRecognizedFilters = () => {
    const updatedFilters: PostFilters = { ...getStoredFilters() };

    updatedFilters.publications = DefaultPostFilters.publications;
    updatedFilters.restaurantAwards = DefaultPostFilters.restaurantAwards;

    // Update URL state and local store
    updateFilters(updatedFilters);

    routerSearchParams.removeParams([
      PostFilterURLParameters.publications,
      PostFilterURLParameters.restaurantAwards,
    ]);
  };

  const recognizedFiltersApplied = () => {
    const currentFilters = getStoredFilters();

    return (
      currentFilters.publications.length > 0 ||
      currentFilters.restaurantAwards.length > 0
    );
  }

  // Search logic
  const updateSearchQuery = (searchQuery: string | undefined) => {
    // Guard against unnecessary updates
    if (searchQuery == getStoredSearchQuery() && searchQuery != undefined)
      return;

    PostFiltersActions.setSearchQuery(searchQuery);

    // When undefined pass null to mark the search query as undefined and ignore the store's current value for it.
    sortFilterAndOrganizeRestaurantEntities(undefined, searchQuery ?? null);
  };

  // Selection logic
  const setSelectedRestaurantEntity = (selectedRestaurantEntityID: string) => {
    PostFiltersActions.setCurrentlySelectedPostID(selectedRestaurantEntityID);
  };

  return {
    updateFilters,
    sortFilterAndOrganizeRestaurantEntities,
    setReservableOnlyFilter,
    selectAllRecognizedFilters,
    clearAllRecognizedFilters,
    recognizedFiltersApplied,
    updateSearchQuery,
    getStoredFilters,
    setSelectedRestaurantEntity,
  };
};

export default useEntityFilters;
