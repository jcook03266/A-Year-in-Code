// Dependencies
// Components
// Local
import OnboardingRSCard from "./onboarding-restaurant-selector-card/OnboardingRestaurantSelectorCard";
import FonciiToolTip from "../../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../../../public/assets/images/ImageRepository";

// Utilities
import { cn } from "../../../../../../utilities/development/DevUtils";
import { externalResizableImageRequestBuilder } from "../../../../../../utilities/tooling/resizableImageRequestBuilder";

// Conformable interface for all the incoming restaurant previews to conform to
export interface RestaurantPreview {
  id: string;
  title: string;
  categories: string[];
  imageURL?: string;
}

interface OnboardingRestaurantSelectorProps {
  restaurants: RestaurantPreview[];
  selectedRestaurants: RestaurantPreview[];
  /**
   * Callback to the parent to inform it that this entity was selected or unselected by the user.
   * The current selection state is passed to the caller as well as the id to make the
   * decision of whether or not to remove the entity from its external selection state.
   *
   * Note: This is a pass-through for the onSelect of `OnboardingRSCard`
   */
  onSelect: (id: string, currentSelectionState: boolean) => void;
}

export default function OnboardingRestaurantSelector({
  restaurants,
  selectedRestaurants,
  onSelect,
}: OnboardingRestaurantSelectorProps) {
  // Convenience
  const isSelected = (id: string): boolean => {
    return (
      selectedRestaurants.find(
        (restaurantPreview) => restaurantPreview.id == id
      ) != undefined
    );
  };

  // Subcomponents
  const SelectedRestaurantPreviewChip = ({
    restaurantPreview,
  }: {
    restaurantPreview: RestaurantPreview;
  }): React.ReactNode => {
    const title = restaurantPreview.title,
      optimizedImageURL = (): string => {
        const imageURL = restaurantPreview.imageURL;

        if (!imageURL) {
          return ImageRepository.Placeholders.FonciiLogoPostFallback;
        } else {
          return externalResizableImageRequestBuilder({
            imageURL,
            imageResizingProps: {
              width: 60,
              height: 60,
            },
          });
        }
      };

    return (
      <button
        className={cn(
          "flex flex-row items-center justify-center gap-x-[4px] px-[8px] py-[4px] backdrop-blur-lg border-[1px] border-medium rounded-full shadow-lg transition-all ease-in-out transform-gpu hover:bg-primary hover:border-transparent hover:opacity-75 active:scale-90 w-fit h-[30px] max-w-[200px] shrink-0"
        )}
        onClick={() =>
          onSelect(restaurantPreview.id, isSelected(restaurantPreview.id))
        }
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
          loading="lazy"
          fetchPriority="high"
          unoptimized
        />
      </button>
    );
  };

  const SelectedRestaurantCounter = (): React.ReactNode => {
    if (selectedRestaurants.length < 2) return;

    return (
      <FonciiToolTip
        title={`You have ${selectedRestaurants.length} selections.`}
      >
        <div className="flex rounded-full h-[30px] w-[30px] bg-primary items-center justify-center shrink-0">
          <p className="font-normal text-[14px] text-permanent_white line-clamp-1">
            {selectedRestaurants.length}
          </p>
        </div>
      </FonciiToolTip>
    );
  };

  // A quick way for the user to view and edit their selections without scrolling down
  const SelectedRestaurantPreviewsCollection = (): React.ReactNode => {
    return (
      <div className="overflow-x-auto overflow-y-hidden w-full h-fit max-h-[110px] transition-all ease-in-out transform-gpu no-scrollbar">
        <div className="flex flex-row gap-[8px] w-fit h-fit justify-start items-center transition-all ease-in-out transform-gpu">
          {SelectedRestaurantCounter()}
          {selectedRestaurants.map((restaurantPreview) => {
            return (
              <SelectedRestaurantPreviewChip
                restaurantPreview={restaurantPreview}
                key={restaurantPreview.id}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-y-[16px] h-full w-full overflow-y-auto overflow-x-hidden transition-all ease-in-out transform-gpu duration-300">
      {SelectedRestaurantPreviewsCollection()}
      <div className="flex flex-wrap gap-[16px] w-fit h-fit justify-center items-start">
        {restaurants.map((restaurantPreview) => {
          return (
            <OnboardingRSCard
              id={restaurantPreview.id}
              title={restaurantPreview.title}
              categories={restaurantPreview.categories}
              imageURL={
                restaurantPreview.imageURL ??
                ImageRepository.Placeholders.FonciiLogoPostFallback
              }
              onSelect={onSelect}
              selected={isSelected(restaurantPreview.id)}
              key={restaurantPreview.id}
            />
          );
        })}
      </div>
    </div>
  );
}
