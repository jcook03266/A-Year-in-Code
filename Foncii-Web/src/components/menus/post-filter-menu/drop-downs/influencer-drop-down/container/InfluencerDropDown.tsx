// Dependencies
// Framework
import React, { useMemo } from "react";

// Types
import { FmUser } from "../../../../../../__generated__/graphql";

// Components
import InfluencerDropDownRow from "../rows/InfluencerDropDownRow";
import MenuHeader from "../../../utils/MenuHeader";

// Utilities
import { cn } from "../../../../../../utilities/development/DevUtils";
import { FilterBottomButtons } from "../../../menu-buttons/FilterBottomButtons";

// Types
interface InfluencerDropDownProps {
  headerTitle?: string;
  referenceIdsToMeta: Map<string, FmUser>; // All influencers, repeated by restaurant count
  selectedIds: string[]; // Currently selected influencers
  idToRestaurantsIds: Map<string, Set<string>>;
  onSelectAction: (id: string) => void;
  onClearAction: () => void;
  isMobile: boolean;
  onCloseAction?: () => void;
}

// A container for the selectable row based content displayed within
export default function InfluencerDropDown({
  headerTitle,
  referenceIdsToMeta,
  selectedIds,
  idToRestaurantsIds,
  onSelectAction,
  onClearAction,
  isMobile = false,
  onCloseAction,
}: InfluencerDropDownProps): React.ReactNode {
  const filtersHaveBeenApplied = useMemo(() => {
    return selectedIds.length > 0;
  }, [selectedIds.length]);

  // Subcomponents
  const InfluencerFilterList = (): React.ReactNode => {
    // Computed Values
    const getValueRestaurantCount = (id: string): number => {
      return idToRestaurantsIds.get(id)?.size || 0;
    };

    const isValueSelected = (id: string): boolean => {
      return selectedIds.find((userID) => userID == id) != undefined;
    };

    /// If no data is present the drop down is not rendered as there's no data to select
    const hasData = (): boolean => {
      return referenceIdsToMeta.size > 0;
    };

    /// Descending sorted by frequency with highest frequencies at the top ~ users with the most posts on the map go on top
    const sortedReferenceDataSet = useMemo((): string[] => {
      const sortedData = [...referenceIdsToMeta.keys()].sort((a, b) => {
        return getValueRestaurantCount(b) - getValueRestaurantCount(a);
      });

      return sortedData;
    }, []);

    // Don't render this section if no creators are available
    if (!hasData()) return;

    return (
      <div className="w-full h-fit">
        {sortedReferenceDataSet.map((creatorID: string) => {
          const user = referenceIdsToMeta.get(creatorID);

          // Precondition failure
          if (!user) return;

          return (
            <InfluencerDropDownRow
              key={creatorID}
              user={user}
              valueOccurrenceFrequency={getValueRestaurantCount(creatorID)}
              toggled={isValueSelected(creatorID)}
              onToggleAction={() => onSelectAction(creatorID)}
            />
          );
        })}
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
          <div className={` flex flex-col w-full h-fit overflow-y-auto`}>
            {InfluencerFilterList()}
          </div>
        </div>

        {/** Bottom Buttons */}
        {FilterBottomButtons({
          onShowAction: () => onCloseAction?.(),
          onClearAction,
          filtersHaveBeenApplied
        })}
      </div>
    </div>
  );
}
