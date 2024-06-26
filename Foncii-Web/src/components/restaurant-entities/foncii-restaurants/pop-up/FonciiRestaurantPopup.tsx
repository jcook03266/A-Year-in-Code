/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { FmUserPost, Restaurant } from "../../../../__generated__/graphql";

// Components
// Local
import RestaurantHeroImageView from "../../../media-views/restaurant-hero-image-view/RestaurantHeroImageView";
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";
import RestaurantDistanceLabel from "../../../../components/labels/restaurant-distance-label/RestaurantDistanceLabel";
import PostHeroImageView from "../../../../components/media-views/post-hero-image-view/PostHeroImageView";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";
import { uppercaseFirstLetter } from "../../../../utilities/formatting/textContentFormatting";
import { PriceLevels, convertNumericPriceLevelToDollarSigns } from "../../../../extensions/Restaurant+Extensions";
import { motion, AnimatePresence } from "framer-motion";

// Local Types
interface RestaurantEntityPopupProps {
    /** Optional post data to pass in if the restaurant entity depicted is a post */
    post?: FmUserPost
    restaurant: Restaurant;
    fonciiUserState: FonciiUserSliceState,
    className?: ClassNameValue;
    onClick?: () => void;
}

export default function RestaurantEntityPopup({
    post,
    restaurant,
    fonciiUserState,
    className,
    onClick
}: RestaurantEntityPopupProps): React.ReactNode {
    // Parse restaurant entity information
    const restaurantID = restaurant.id,
        name = restaurant.name,
        priceLevel = restaurant.priceLevel,
        categories = restaurant.categories ?? [],
        isAPost = post != undefined,
        restaurantHeroImage = restaurant.heroImageURL ??
            (restaurant.imageCollectionURLs ?? [])[0] ?? undefined;

    // Subcomponents
    const RestaurantNameLabel = (): React.ReactNode => {
        return (<p className="font-semibold text-[16px] pointer-events-auto line-clamp-1 text-black">{name}</p>);
    }

    const PrimaryCategoryLabel = (): React.ReactNode => {
        const primaryCuisine = categories[0],
            concatenatedCuisinesDescription = categories.join(" | ");

        if (!primaryCuisine) return;
        else
            return (
                <FonciiToolTip title={concatenatedCuisinesDescription}>
                    <p className="font-normal text-[12px] text-medium_dark_grey line-clamp-1 pr-[8px] pl-[8px] pointer-events-auto">
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
                <p className={`font-normal text-[12px] text-medium_dark_grey line-clamp-1 pr-[8px] shrink-0 pointer-events-auto`}>{priceLevelDescription}</p>
            </FonciiToolTip>
        );
    };

    // Sections
    const RestaurantProperties = (): React.ReactNode => {
        return (
            <div className="flex flex-row items-start justify-center divide-x-[1px] divide-black" >
                <PriceLevelLabel />
                <PrimaryCategoryLabel />

                <span className="pl-[8px] pointer-events-auto">
                    <RestaurantDistanceLabel
                        restaurant={restaurant}
                        clientCoordinates={fonciiUserState.clientCoordinates}
                        className="text-[12px] text-medium_dark_grey"
                    />
                </span>
            </div>
        );
    }

    const DescriptionSection = (): React.ReactNode => {
        return (
            <div className="flex flex-col gap-y-[4px] text-left items-start justify-center w-max h-full bg-light_grey pl-[8px] pr-[12px] py-[12px]">
                <RestaurantNameLabel />
                <RestaurantProperties />
            </div>
        );
    }

    return (
        <AnimatePresence>
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.125 }}
                id={restaurantID}
                className={cn("flex items-end justify-center pl-[48px] h-fit w-fit z-[2] pointer-events-auto")}
            >
                <button
                    className={cn("flex flex-row pointer-events-auto rounded-[8px] overflow-hidden items-center justify-center h-[75px] w-fit max-w-[260px]", className)}
                    onClick={onClick}
                    style={{
                        boxShadow: '2px 2px 10px 0px rgba(255, 255, 255, 0.15), -2px -2px 10px 0px rgba(255, 255, 255, 0.15)'
                    }}
                >
                    {/** Image View Section */}
                    {isAPost ?
                        <PostHeroImageView
                            post={post}
                            className="w-[64px] h-full shrink-0"
                            imageResizingProps={{
                                height: 150,
                                width: 150,
                            }}
                        />
                        :
                        <RestaurantHeroImageView
                            imageURL={restaurantHeroImage}
                            restaurantName={restaurant.name}
                            className="w-[64px] h-full shrink-0"
                            imageResizingProps={{
                                height: 150,
                                width: 150,
                            }}
                        />
                    }
                    {/** Image View Section */}
                    {/** Restaurant Description Section */}
                    <DescriptionSection />
                    {/** Restaurant Description Section */}
                </button>
            </motion.span>
        </ AnimatePresence>
    );
}