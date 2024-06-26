'use client'
/* eslint-disable react-hooks/exhaustive-deps */
// Dependencies
// Framework
import React, { useMemo } from "react";

// Types
import { DefaultPostFilters } from "../../../../../types/default-type-values";
import {
  ArticlePublication,
  FmUserPost,
  FonciiRestaurant,
  RestaurantAward,
} from "../../../../../__generated__/graphql";

// URL State Persistence
import { PostFilterURLParameters } from "../../../../../core-foncii-maps/properties/NavigationProperties";

// Hooks
import { useRouterSearchParams } from "../../../../../hooks/UseRouterSearchParamsHook";
import useEntityFilters from "../../../../../hooks/UseEntityFilters";
import { useRouteObserver } from "../../../../../hooks/UseRouteObserver";

// Redux
import {
  getFonciiRestaurantsSlice,
  getPostFiltersSlice,
  getUserPostsSlice,
  getVisitedUserSlice,
} from "../../../../../redux/operations/selectors";

// Components
// Local
import MenuHeader from "../../utils/MenuHeader";
import { FilterBottomButtons } from "../../menu-buttons/FilterBottomButtons";
import SelectionDropDownRow from "../selection-drop-down/rows/SelectionDropDownRow";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../../public/assets/images/ImageRepository";

// Utilities
import { cn } from "../../../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

// Types
interface RecognizedDropDownProps {
  headerTitle?: string;
  isMobile?: boolean;
  onCloseAction?: () => void;
}

export default function RecognizedDropDown<T>({
  headerTitle,
  isMobile = false,
  onCloseAction,
}: RecognizedDropDownProps): React.ReactNode {
  // Observers
  const routeObserver = useRouteObserver();

  // Filters
  const entityFilters = useEntityFilters();

  // URL State Persistence
  const routerSearchParams = useRouterSearchParams();

  // State Management
  // Redux
  const fonciiRestaurants = getFonciiRestaurantsSlice()(),
    postFilters = getPostFiltersSlice()(),
    visitedUser = getVisitedUserSlice()(),
    userPosts = getUserPostsSlice()();

  // Helpers
  const filterRestaurantsFromPosts = (
    posts: FmUserPost[]
  ): FonciiRestaurant[] => {
    const filteredPosts = posts.filter((post) => post.restaurant != undefined);
    return filteredPosts.map((post) => post.fonciiRestaurant!);
  };

  // Data Providers
  const baseFonciiRestaurants = useMemo((): FonciiRestaurant[] => {
    return fonciiRestaurants.fonciiRestaurants ?? [];
  }, [fonciiRestaurants.fonciiRestaurants]);

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

  const baseRestaurants = useMemo((): FonciiRestaurant[] => {
    if (routeObserver.explorePageActive()) {
      return baseFonciiRestaurants;
    } else {
      return filterRestaurantsFromPosts(basePosts);
    }
  }, [baseFonciiRestaurants, basePosts, routeObserver]);

  const awardToRestaurantIds = useMemo((): Map<string, Set<string>> => {
    const resultMap = new Map<string, Set<string>>();

    baseRestaurants?.forEach((fonciiRestaurant) => {
      const restaurantId = fonciiRestaurant.restaurant.id;

      fonciiRestaurant.associatedRestaurantAwardEdges?.forEach((edge) => {
        const organization = edge.organization,
          restaurants = resultMap.get(organization) || new Set<string>();

        restaurants.add(restaurantId);
        resultMap.set(organization, restaurants);
      });
    });

    return resultMap;
  }, [baseRestaurants]);

  const publicationToRestaurantIds = useMemo((): Map<string, Set<string>> => {
    const resultMap = new Map<string, Set<string>>();

    baseRestaurants?.forEach((fonciiRestaurant) => {
      const restaurantId = fonciiRestaurant.restaurant.id;

      fonciiRestaurant.associatedArticlePublicationEdges?.forEach((edge) => {
        const publication = edge.publication,
          restaurants = resultMap.get(publication) || new Set<string>();

        restaurants.add(restaurantId);
        resultMap.set(publication, restaurants);
      });
    });

    return resultMap;
  }, [baseRestaurants]);

  const filterRestaurantAwardsFromFonciiRestaurants =
    useMemo((): RestaurantAward[] => {
      const uniqueAwards = new Set();
      return baseRestaurants.flatMap((fonciiRestaurant) => {
        // We want the filter row to display restaurant counts for each creator
        return fonciiRestaurant.associatedRestaurantAwardEdges.filter(
          (edge) => {
            if (uniqueAwards.has(edge.organization)) return false;
            uniqueAwards.add(edge.organization);
            return true;
          }
        );
      });
    }, [baseRestaurants]);

  const filterArticlePublicationsFromFonciiRestaurants =
    useMemo((): ArticlePublication[] => {
      const uniquePublications = new Set<string>();

      return baseRestaurants.flatMap((fonciiRestaurant) => {
        // We want the filter row to display restaurant counts for each creator
        return fonciiRestaurant.associatedArticlePublicationEdges.filter(
          (edge) => {
            if (uniquePublications.has(edge.publication)) return false;
            uniquePublications.add(edge.publication);
            return true;
          }
        );
      });
    }, [baseRestaurants]);

  // Convenience
  const allPublicationsSelected = useMemo(() => {
    return publicationToRestaurantIds.size != 0 &&
      postFilters.publications.length == publicationToRestaurantIds.size;
  }, [postFilters.publications, publicationToRestaurantIds])

  const allAwardsSelected = useMemo(() => {
    return awardToRestaurantIds.size != 0 &&
      postFilters.restaurantAwards.length == awardToRestaurantIds.size;
  }, [postFilters.restaurantAwards, awardToRestaurantIds])

  // Sections
  const HeaderSection = (icon: string, title: string): React.ReactNode => {
    return (
      <div
        className={`flex flex-row pointer-events-none justify-start items-center w-full h-fit p-[8px]`}
      >
        <Image
          className="h-[24px] w-[24px] pr-[8px]"
          src={icon}
          alt={title + " icon"}
          width={24}
          height={24}
          priority
        />
        <p className={`text-permanent_white text-[16px] font-semibold text-start line-clamp-1`}>
          {title}
        </p>
      </div>
    );
  };

  const AwardFilterList = ({
    className
  }: {
    className?: ClassNameValue
  }): React.ReactNode => {
    const totalRestaurantCount = (): number => {
      return baseRestaurants.filter(
        (restaurant) => restaurant.associatedRestaurantAwardEdges.length > 0
      ).length;
    };

    const sortedOrganizations = (): RestaurantAward[] => {
      const counts = awardToRestaurantIds;

      return filterRestaurantAwardsFromFonciiRestaurants.sort((a, b) => {
        return (
          (counts.get(b.organization)?.size || 0) -
          (counts.get(a.organization)?.size || 0)
        );
      });
    };

    const areOrganizationsAvailable = (): boolean => {
      return awardToRestaurantIds.size > 0;
    };

    const isOrganizationFilterSelected = (organization: string): boolean => {
      return (
        postFilters.restaurantAwards.find(
          (element) => element == organization
        ) != undefined
      );
    };

    const updateOrganizationFilters = (organizationTypes: string[]): void => {
      // Update and set the new filters to the local store
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      };

      routerSearchParams.setParams({
        [PostFilterURLParameters.restaurantAwards]: organizationTypes,
      });
      updatedFilters.restaurantAwards = organizationTypes;

      entityFilters.updateFilters(updatedFilters);
    };

    // Action Handlers
    const onToggleAction = (selectedValue: string): void => {
      const storedSelectedOrganizaitons = new Set(postFilters.restaurantAwards);

      if (storedSelectedOrganizaitons.has(selectedValue)) {
        storedSelectedOrganizaitons.delete(selectedValue);
      } else {
        storedSelectedOrganizaitons.add(selectedValue);
      }

      updateOrganizationFilters([...storedSelectedOrganizaitons]);
    };

    const clearRestaurantAwards = () => {
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      };
      updatedFilters.restaurantAwards = DefaultPostFilters.restaurantAwards;
      entityFilters.updateFilters(updatedFilters);
      routerSearchParams.removeParam(PostFilterURLParameters.restaurantAwards);
    };

    const onSelectAll = (): void => {
      if (allAwardsSelected) {
        clearRestaurantAwards();
      } else {
        updateOrganizationFilters(
          filterRestaurantAwardsFromFonciiRestaurants.map(
            (award) => award.organization
          )
        );
      }
    };

    // Don't render this section if no creators are available
    if (!areOrganizationsAvailable()) return;

    return (
      <div className={cn("gap-y-[4px]", className)}>
        {HeaderSection(
          ImageRepository.FilterIcons.AwardWinningFiltersIcon,
          "Award Winning"
        )}
        <SelectionDropDownRow
          value={"Select all"}
          tooltipTitle={"Select all"}
          valueOccurrenceFrequency={totalRestaurantCount()}
          toggled={allAwardsSelected}
          onToggleAction={() => onSelectAll()}
        />
        <div className="w-full h-fit pl-[24px]">
          {sortedOrganizations().map((award: RestaurantAward) => {
            return (
              <SelectionDropDownRow
                key={award.organization}
                value={award.organization}
                tooltipTitle={award.organization}
                valueOccurrenceFrequency={
                  awardToRestaurantIds.get(award.organization)?.size || 0
                }
                toggled={isOrganizationFilterSelected(award.organization)}
                onToggleAction={() => onToggleAction(award.organization)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const PublicationFilterList = ({
    className
  }: {
    className?: ClassNameValue
  }): React.ReactNode => {
    const totalRestaurantCount = (): number => {
      return baseRestaurants.filter(
        (restaurant) => restaurant.associatedArticlePublicationEdges.length > 0
      ).length;
    };

    const sortedPublications = (): ArticlePublication[] => {
      const counts = publicationToRestaurantIds;

      return filterArticlePublicationsFromFonciiRestaurants.sort((a, b) => {
        return (
          (counts.get(b.publication)?.size || 0) -
          (counts.get(a.publication)?.size || 0)
        );
      });
    };

    const arePublicationsAvailable = (): boolean => {
      return publicationToRestaurantIds.size > 0;
    };

    const isPublicationFilterSelected = (publication: string): boolean => {
      return (
        postFilters.publications
          .find((element) => element == publication) != undefined);
    };

    const updatePublicationFilters = (publicationTypes: string[]): void => {
      // Update and set the new filters to the local store
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      };

      // Update URL State
      routerSearchParams.setParams({
        [PostFilterURLParameters.publications]: publicationTypes,
      });

      // Update Redux
      updatedFilters.publications = publicationTypes;
      entityFilters.updateFilters(updatedFilters);
    };

    // Action Handlers
    const onToggleAction = (selectedValue: string): void => {
      const storedSelectedArticles = new Set(postFilters.publications);

      if (storedSelectedArticles.has(selectedValue)) {
        storedSelectedArticles.delete(selectedValue);
      } else {
        storedSelectedArticles.add(selectedValue);
      }

      updatePublicationFilters([...storedSelectedArticles]);
    };

    const clearPublications = () => {
      const updatedFilters: PostFilters = {
        ...entityFilters.getStoredFilters(),
      };

      // Update URL State
      routerSearchParams.removeParam(PostFilterURLParameters.publications);

      // Update Redux
      updatedFilters.publications = DefaultPostFilters.publications;
      entityFilters.updateFilters(updatedFilters);
    };

    const onSelectAll = (): void => {
      if (allPublicationsSelected) {
        clearPublications();
      } else {
        updatePublicationFilters(
          filterArticlePublicationsFromFonciiRestaurants
            .map((publication) => publication.publication)
        );
      }
    };

    // Don't render this section if no creators are available
    if (!arePublicationsAvailable()) return;

    return (
      <div className={cn("gap-y-[4px]", className)}>
        {HeaderSection(
          ImageRepository.FilterIcons.PublicationsFiltersIcon,
          "Publications"
        )}
        <SelectionDropDownRow
          value={"Select all"}
          tooltipTitle={"Select all"}
          valueOccurrenceFrequency={totalRestaurantCount()}
          toggled={allPublicationsSelected}
          onToggleAction={() => onSelectAll()}
        />
        <div className="w-full h-fit pl-[24px]">
          {sortedPublications().map((publication: ArticlePublication) => {
            return (
              <SelectionDropDownRow
                key={publication.publication}
                value={publication.publication}
                tooltipTitle={publication.publication}
                valueOccurrenceFrequency={
                  publicationToRestaurantIds.get(publication.publication)
                    ?.size || 0
                }
                toggled={isPublicationFilterSelected(publication.publication)}
                onToggleAction={() => onToggleAction(publication.publication)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "transition-all ease-in-out flex flex-col pointer-events-auto border-[1px] bg-black bg-opacity-100 border-medium_dark_grey",
        isMobile ? "w-screen rounded-t-[20px]" : "w-full rounded-[10px]"
      )}
    >
      {/** Medium screen container */}
      <div className={`transition-all w-screen md:w-[300px] self-center`}>
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
          {/** Filter Sections */}
          <AwardFilterList className={"flex flex-col w-full h-fit"} />
          <PublicationFilterList className={"flex flex-col w-full h-fit"} />
        </div>

        {/** Bottom Buttons */}
        <FilterBottomButtons
          onShowAction={() => onCloseAction?.()}
          onClearAction={entityFilters.clearAllRecognizedFilters}
          filtersHaveBeenApplied={entityFilters.recognizedFiltersApplied()}
        />
      </div>
    </div>
  );
}
