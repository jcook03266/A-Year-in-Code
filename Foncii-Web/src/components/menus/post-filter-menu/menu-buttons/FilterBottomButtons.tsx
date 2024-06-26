'use client'
// Dependencies
// Hooks
import { useRouteObserver } from "../../../../hooks/UseRouteObserver";

// Redux
import { getFonciiRestaurantsSlice, getPostFiltersSlice, getUserPostsSlice, getVisitedUserSlice } from "../../../../redux/operations/selectors";

// Utils
import { cn } from "../../../../utilities/development/DevUtils";

// Local Types
interface FilterBottomButtonsProps {
  onShowAction: () => void;
  onClearAction: () => void;
  filtersHaveBeenApplied: boolean;
}

export const FilterBottomButtons = ({
  onShowAction,
  onClearAction,
  filtersHaveBeenApplied
}: FilterBottomButtonsProps): React.ReactNode => {
  // Routing
  const routeObserver = useRouteObserver();

  // State Management
  const fonciiRestaurantsState = getFonciiRestaurantsSlice()();
  const userPosts = getUserPostsSlice()();
  const visitedUser = getVisitedUserSlice()();
  const filters = getPostFiltersSlice()();

  // Convenience
  const visiblePosts = () => {
    return routeObserver.isCurrentUserGalleryAuthor()
      ? userPosts?.visiblePosts
      : visitedUser?.visiblePosts ?? [];
  }

  const visibleFonciiRestaurants = () => {
    return fonciiRestaurantsState.visibleFonciiRestaurants;
  }

  const visibleRestaurantEntities = () => {
    if (routeObserver.explorePageActive()) {
      // Foncii restaurants
      return visibleFonciiRestaurants();
    }
    else {
      // User Posts
      return visiblePosts();
    }
  }

  const visibleRestaurantEntityCount = () => {
    return visibleRestaurantEntities().length;
  }

  // Subcomponents
  const Divider = (): React.ReactNode => {
    return (<div className="h-[1px] w-full bg-medium_light_grey" />);
  }

  const ClearButton = (): React.ReactNode => {
    return (
      <button
        className={cn(
          `flex items-center justify-center w-full self-center h-[40px] bg-black transition-all text-neutral rounded-[20px] border-[1px] border-medium pointer-events-auto`,
          filtersHaveBeenApplied
            ? "active:scale-90 hover:bg-primary hover:border-transparent hover:text-permanent_white"
            : "opacity-50"
        )}
        onClick={onClearAction}
        disabled={!filtersHaveBeenApplied}
      >
        <p className={`text-[14px] font-normal line-clamp-1 py-[8px] px-[8px]`}>Clear all</p>
      </button>
    );
  }

  const ShowButton = (): React.ReactNode => {
    const showButtonTitle = `Show ${visibleRestaurantEntityCount()}`;

    return (
      <button
        className={cn(`flex items-center justify-center w-full self-center h-[40px] bg-black transition-all text-neutral rounded-[20px] border-[1px] border-medium pointer-events-auto`, "active:scale-90 hover:bg-primary hover:border-transparent hover:text-permanent_white")}
        onClick={onShowAction}
      >
        <p className={`text-[14px] font-normal line-clamp-1 py-[8px] px-[8px]`}>{showButtonTitle}</p>
      </button>
    );
  }

  return (
    <div className="w-full">
      {/** Divider */}
      <Divider />

      <div className="flex flex-row gap-x-[8px] flex-nowrap items-center justify-center shrink-0 w-full h-fit px-[12px] py-[16px]">
        <ClearButton />
        <ShowButton />
      </div>
    </div>
  );
};
