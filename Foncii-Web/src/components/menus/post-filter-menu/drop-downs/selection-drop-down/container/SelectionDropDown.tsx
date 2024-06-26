// Dependencies
// Framework
import React, { useMemo } from "react";

// Components
import SelectionDropDownRow from "../rows/SelectionDropDownRow";
import MenuHeader from "../../../utils/MenuHeader";

// Utilities
import { cn } from "../../../../../../utilities/development/DevUtils";
import { FilterBottomButtons } from "../../../menu-buttons/FilterBottomButtons";

// Types
interface SelectionDropDownProps<T> {
  headerTitle?: string;
  referenceIds: T[]; // All unique ids
  selectedIds: T[]; // Currently selected ids
  toDisplayTitle?: (id: T) => string;
  toTooltipTitle?: (id: T) => string;
  idToRestaurantsIds: Map<T, Set<string>>;
  onSelectAction: (id: T) => void;
  onClearAction: () => void;
  displayOrderByDisplayKey?: boolean;
  isMobile?: boolean;
  onCloseAction?: () => void;
}

// A container for the selectable row based content displayed within
export default function SelectionDropDown<T>({
  headerTitle,
  referenceIds,
  selectedIds,
  toDisplayTitle,
  toTooltipTitle,
  idToRestaurantsIds,
  onSelectAction,
  onClearAction,
  displayOrderByDisplayKey = false,
  isMobile = false,
  onCloseAction,
}: SelectionDropDownProps<T>): React.ReactNode {
  const filtersHaveBeenApplied = useMemo(() => {
    return selectedIds.length > 0;
  }, [selectedIds.length]);

  // Subcomponents
  const FilterList = (): React.ReactNode => {
    // Computed Values
    const getValueRestaurantCount = (id: T): number => {
      return idToRestaurantsIds.get(id)?.size || 0;
    };

    const isValueSelected = (id: T): boolean => {
      return selectedIds.find((userID) => userID == id) != undefined;
    };

    /// If no data is present the drop down is not rendered as there's no data to select
    const hasData = (): boolean => {
      return referenceIds.length > 0;
    };

    /// Descending sorted by frequency with highest frequencies at the top ~ users with the most posts on the map go on top
    const sortedReferenceDataSet = useMemo((): T[] => {
      if (displayOrderByDisplayKey && toDisplayTitle) {
        return referenceIds.sort((a, b) => {
          return toDisplayTitle(b) > toDisplayTitle(a) ? 1 : -1;
        });
      }
      return referenceIds.sort((a, b) => {
        return getValueRestaurantCount(b) - getValueRestaurantCount(a);
      });
    }, []);

    const toDisplayKey = (id: T): string => {
      return toDisplayTitle && toDisplayTitle(id)
        ? toDisplayTitle(id)
        : String(id);
    };

    // Don't render this section if no creators are available
    if (!hasData()) return;

    return (
      <div className="w-full h-fit">
        {sortedReferenceDataSet.map((id: T) => {
          return (
            <SelectionDropDownRow
              key={toDisplayKey(id)}
              value={toDisplayKey(id)}
              tooltipTitle={
                toTooltipTitle ? toTooltipTitle(id) : toDisplayKey(id)
              }
              valueOccurrenceFrequency={getValueRestaurantCount(id)}
              toggled={isValueSelected(id)}
              onToggleAction={() => onSelectAction(id)}
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
            <FilterList />
          </div>
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
