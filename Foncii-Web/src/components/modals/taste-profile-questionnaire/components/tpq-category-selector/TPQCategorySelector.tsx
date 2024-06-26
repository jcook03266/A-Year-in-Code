// Dependencies
// Types
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Components
// Local
import CategorySelectorCard from "./components/category-selector-card/CategorySelectorCard";
import FonciiToolTip from "../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Utilities
import { cn } from "../../../../../utilities/development/DevUtils";
import { resizableImageRequestBuilder } from "../../../../../utilities/tooling/resizableImageRequestBuilder";

// Types
// Conformable interface for all the incoming categories to conform to
export interface Category {
  id: string;
  title: string;
  imageURL: string;
}

interface TPQCategorySelectorProps {
  categories: Category[];
  selectedCategories: Category[];
  /**
   * Callback to the parent to inform it that this entity was selected or unselected by the user.
   * The current selection state is passed to the caller as well as the id to make the
   * decision of whether or not to remove the entity from its external selection state.
   *
   * Note: This is a pass-through for the onSelect of `CategorySelectorCard`
   */
  onSelect: (id: string, currentSelectionState: boolean) => void;
}

export default function TPQCategorySelector({
  categories,
  selectedCategories,
  onSelect,
}: TPQCategorySelectorProps) {
  // Convenience
  const isSelected = (id: string): boolean => {
    return (
      selectedCategories.find((category) => category.id == id) != undefined
    );
  };

  // Subcomponents
  const SelectedCategoryChip = ({
    category,
  }: {
    category: Category;
  }): React.ReactNode => {
    const title = category.title,
      optimizedImageURL = (): string => {
        const imageURL = category.imageURL;

        return resizableImageRequestBuilder({
          baseImageURL: imageURL,
          imageResizingProps: {
            width: 60,
            height: 60,
            fit: MediaServerImageFitParams.cover,
            format: MediaServerImageFormatParams.f3,
          },
        });
      };

    return (
      <button
        className={cn(
          "flex flex-row items-center justify-center gap-x-[4px] px-[8px] py-[4px] backdrop-blur-lg border-[1px] border-medium rounded-full shadow-lg transition-all ease-in-out hover:bg-primary hover:border-transparent hover:opacity-75 active:scale-90 w-fit h-[30px] max-w-[200px] shrink-0"
        )}
        onClick={() => onSelect(category.id, isSelected(category.id))}
        title={`Unselect ${title}`}
      >
        <p className="font-normal text-[14px] text-permanent_white line-clamp-1">
          {title}
        </p>
        <Image
          src={optimizedImageURL()}
          width={20}
          height={20}
          unselectable="on"
          className="object-cover object-center pointer-events-none shrink-0 rounded-full overflow-hidden h-[20px] w-[20px]"
          alt={title}
          loading="eager"
          fetchPriority="high"
        />
      </button>
    );
  };

  const SelectedCategoryCounter = (): React.ReactNode => {
    if (selectedCategories.length < 2) return;

    return (
      <FonciiToolTip
        title={`You have ${selectedCategories.length} selections.`}
      >
        <div className="flex rounded-full h-[30px] w-[30px] bg-primary items-center justify-center shrink-0">
          <p className="font-normal text-[14px] text-permanent_white line-clamp-1">
            {selectedCategories.length}
          </p>
        </div>
      </FonciiToolTip>
    );
  };

  // A quick way for the user to view and edit their selections without scrolling down
  const SelectedCategoriesCollection = (): React.ReactNode => {
    return (
      <div className="overflow-x-auto overflow-y-hidden w-full h-fit max-h-[110px] transition-all ease-in-out no-scrollbar">
        <div className="flex flex-row gap-[8px] w-fit h-fit justify-start items-center transition-all ease-in-out">
          {SelectedCategoryCounter()}
          {selectedCategories.map((category) => {
            return (
              <SelectedCategoryChip category={category} key={category.id} />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-y-[16px] h-full w-full overflow-y-auto overflow-x-hidden transition-all ease-in-out duration-300">
      {SelectedCategoriesCollection()}
      <div className="flex flex-wrap gap-[16px] w-fit h-fit justify-center items-start">
        {categories.map((category) => {
          return (
            <CategorySelectorCard
              id={category.id}
              title={category.title}
              imageURL={category.imageURL}
              onSelect={onSelect}
              selected={isSelected(category.id)}
              key={category.id}
            />
          );
        })}
      </div>
    </div>
  );
}
