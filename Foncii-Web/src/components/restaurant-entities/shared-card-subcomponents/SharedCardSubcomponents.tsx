// Dependencies
// Types
import {
  PriceLevels,
  convertNumericPriceLevelToDollarSigns,
} from "../../../extensions/Restaurant+Extensions";
import { Restaurant } from "../../../__generated__/graphql";

// Components
// Local
import RestaurantDistanceLabel from "../../labels/restaurant-distance-label/RestaurantDistanceLabel";
import FonciiToolTip from "../../tool-tips/FonciiToolTip";

// External
import Link from "next/link";

// Animation
import { AnimatePresence, motion } from "framer-motion";

// Navigation
import { NavigationProperties } from "../../../core-foncii-maps/properties/NavigationProperties";

// Utils
import { cn } from "../../../utilities/development/DevUtils";
import { uppercaseFirstLetter } from "../../../utilities/formatting/textContentFormatting";

export const RestaurantPropertiesSection = ({
  restaurant,
  fonciiUserState,
  withDescription = false
}: {
  restaurant: Restaurant;
  fonciiUserState: FonciiUserSliceState,
  withDescription?: boolean;
}): React.ReactNode => {
  // Parsing restaurant metadata
  const restaurantID = restaurant.id,
    categories = restaurant?.categories ?? [],
    priceLevel = restaurant?.priceLevel ?? PriceLevels.none;

  // Subcomponents
  const PrimaryCategoryLabel = (): React.ReactNode => {
    const primaryCuisine = categories[0],
      concatenatedCuisinesDescription = categories.join(" | ");

    if (!primaryCuisine) return;
    else
      return (
        <FonciiToolTip title={concatenatedCuisinesDescription}>
          <p className="font-normal text-[14px] text-permanent_white line-clamp-1 pr-[8px] pl-[8px] pointer-events-auto">
            {uppercaseFirstLetter(primaryCuisine)}
          </p>
        </FonciiToolTip>
      );
  };

  const PriceLevelLabel = (): React.ReactNode => {
    const dollarSignConversion =
      convertNumericPriceLevelToDollarSigns(priceLevel),
      priceLevelDescription =
        priceLevel != PriceLevels.none ? dollarSignConversion : "N/A";

    const priceLevelHumanDescription = () => {
      switch (priceLevel) {
        case PriceLevels.none:
          return "Unknown";
        case PriceLevels.$:
          return "Cheap";
        case PriceLevels.$$:
          return "Affordable";
        case PriceLevels.$$$:
          return "Pricey";
        case PriceLevels.$$$$:
          return "Expensive";
      }
    };

    const toolTipDescription = `The cost of meals here is ${priceLevelHumanDescription()?.toLowerCase()}`;

    return (
      <FonciiToolTip title={toolTipDescription}>
        <p
          className={`font-normal text-[14px] text-permanent_white line-clamp-1 pr-[8px] shrink-0 pointer-events-auto`}
        >
          {priceLevelDescription}
        </p>
      </FonciiToolTip>
    );
  };

  const DescriptionSection = (): React.ReactNode => {
    const restaurantDescription = restaurant.description;

    // Not rendered when no description available / component level feature flag not set to true
    if (!restaurantDescription || !withDescription) return;

    return (<p className={`font-normal text-[14px] text-permanent_white line-clamp-2 shrink-0 pr-[32px] max-w-[500px]`}>{restaurantDescription}</p>);
  };

  return (
    <AnimatePresence>
      <motion.div
        key={restaurantID}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="flex flex-col gap-y-[4px] w-full text-ellipsis text-left items-start justify-center pointer-events-auto"
      >
        {/** Restaurant Name */}
        <RestaurantNameLabel restaurant={restaurant} />
        {/** Restaurant Name */}

        {/** Cuisine / Price / Distance Information */}
        <div className="flex flex-row items-start justify-center divide-x-[1px] divide-permanent_white">
          <PriceLevelLabel />
          <PrimaryCategoryLabel />

          <span className="pl-[8px] pointer-events-auto">
            <RestaurantDistanceLabel
              restaurant={restaurant}
              clientCoordinates={fonciiUserState.clientCoordinates}
            />
          </span>
        </div>
        {/** Cuisine / Price / Distance Information */}

        {/** Restaurant Description */}
        <DescriptionSection />
        {/** Restaurant Description */}
      </motion.div>
    </AnimatePresence>
  );
};

export const RestaurantNameLabel = ({
  restaurant,
}: {
  restaurant?: Restaurant;
}): React.ReactElement => {
  // Parsing restaurant metadata
  const restaurantID = restaurant?.id,
    restaurantName = restaurant?.name ?? "Missing Experience";

  // Convenience
  const isRestaurantMissing = (): boolean => restaurant == undefined;

  // Subcomponents
  const RestaurantLinkDecorator = ({
    restaurantID,
    children
  }: {
    restaurantID: string,
    children: React.ReactNode
  }) => {
    return (
      <Link
        className="select-none hover:opacity-80 transition-opacity ease-in-out"
        href={NavigationProperties.restaurantDetailViewPageLink(restaurantID)}
      >
        {children}
      </Link>
    );
  }

  const MainContent = (): React.ReactNode => {
    return (
      <FonciiToolTip title={restaurantName}>
        <h3 className={cn(`font-semibold text-[16px] xl:text-[18px] pointer-events-auto line-clamp-1`, isRestaurantMissing() ? "text-primary underline" : "text-permanent_white")}>
          {restaurantName}
        </h3>
      </FonciiToolTip>
    );
  }

  return (
    restaurantID ?
      <RestaurantLinkDecorator restaurantID={restaurantID}>
        <MainContent />
      </RestaurantLinkDecorator>
      :
      <MainContent />
  );
};
