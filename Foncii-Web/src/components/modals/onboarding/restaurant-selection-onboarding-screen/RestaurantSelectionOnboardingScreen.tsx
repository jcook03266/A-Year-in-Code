/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { CoordinatePoint, Restaurant } from "../../../../__generated__/graphql";

// Mapbox / Geocoding
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

// Components
import OnboardingRestaurantSelector, {
  RestaurantPreview,
} from "./components/onboarding-restaurant-selector/OnboardingRestaurantSelector";
import OnboardingRSSearchBar from "./components/onboarding-restaurant-selector/search-bar/OnboardingRestaurantSelectorSearchBar";
import CircularLoadingIndicator from "../../../loading-indicators/circular-loading-indicator/CircularLoadingIndicator";
import Image from "next/image";
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";

// Services
import { FonciiAPIClientAdapter } from "../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Hooks
import React, { useEffect, useState } from "react";

// Redux
import { getFonciiUserSlice } from "../../../../redux/operations/selectors";
import { FonciiUserActions } from "../../../../redux/operations/dispatchers";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";

// Types
interface RestaurantSelectionOnboardingScreenProps {
  selectedRestaurants: Restaurant[];
  onSelectedRestaurantsUpdate: (restaurants: Restaurant[]) => void;
}

export default function RestaurantSelectionOnboardingScreen({
  selectedRestaurants,
  onSelectedRestaurantsUpdate,
}: RestaurantSelectionOnboardingScreenProps) {
  // Services
  const apiService = new FonciiAPIClientAdapter();

  // Limits
  const minSearchQueryLength = 3;

  // Properties
  const title = "Choose 3 or more restaurants you like.";

  // State Management
  // Redux
  const fonciiUser = getFonciiUserSlice()();

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTextFieldInput, setSearchTextFieldInput] = useState("");
  const [searchBarPlaceholder, setSearchBarPlaceholder] = useState("");

  // Restaurants
  const [restaurantData, setRestaurantData] = useState<Restaurant[]>([]);

  // UI
  const [isLoading, setIsLoading] = useState(false);
  const [processingUserAddress, setProcessingUserAddress] = useState(true);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  // Initial data fetch / user location request, fetch restaurants around the user's current location (if available)
  useEffect(() => {
    requestUserLocation();
  }, []);

  // Set a dynamic placeholder for the search bar when the restaurant data is updated
  useEffect(() => {
    setSearchBarPlaceholder(getRandomRestaurantName());
  }, [restaurantData]);

  // Update on new search query
  useEffect(() => {
    // Only allow a clear state flag ("") below the required min char threshold
    if (searchQuery.length >= minSearchQueryLength || searchQuery == "")
      loadData();
  }, [searchQuery]);

  // Actions
  const requestUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProcessingUserAddress(true);

        const clientCoordinates: CoordinatePoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Set current user coordinates and fetch using their local coordinates
        FonciiUserActions.setClientCoordinates(clientCoordinates);

        loadData(clientCoordinates);
        reverseGeocodeLocation(clientCoordinates);
      },
      (_) => {
        setProcessingUserAddress(false);

        // Permission denied, reset coordinate state and fetch using the default coordinates
        FonciiUserActions.setClientCoordinates(undefined);

        loadData();
      }
    );
  };

  // Action Handlers
  const onSearchQueryUpdateHandler = (textInput: string) => {
    setSearchQuery(textInput);
  };

  const onSelectHandler = (id: string, currentSelectionState: boolean) => {
    let updatedSelectedRestaurantPreviews =
      mapRestaurantsToRestaurantPreviews(selectedRestaurants);

    if (currentSelectionState == false) {
      // Not yet selected
      const restaurantPreview = restaurantPreviews().find(
        (restaurantPreview) => restaurantPreview.id == id
      );

      if (restaurantPreview)
        updatedSelectedRestaurantPreviews.push(restaurantPreview);
    } else {
      // Return only the restaurant previews that are not the restaurant preview with the given id
      updatedSelectedRestaurantPreviews =
        updatedSelectedRestaurantPreviews.filter(
          (restaurantPreview) => restaurantPreview.id != id
        );
    }

    // Update external state
    const updatedSelectedRestaurants = mapRestaurantPreviewsToRestaurants(
      updatedSelectedRestaurantPreviews
    );
    onSelectedRestaurantsUpdate(updatedSelectedRestaurants);
  };

  const handleAutoCompleteRestaurantSelection = (restaurant: Restaurant) => {
    // Deduplication
    const doesRestaurantExistInLocalData =
      restaurantData.find(
        (existingRestaurant) => existingRestaurant.id == restaurant.id
      ) != undefined,
      isRestaurantAlreadySelected =
        selectedRestaurants.find(
          (selectedRestaurant) => selectedRestaurant.id == restaurant.id
        ) != undefined;

    // Only add the restaurant preview if it does not already exist in the selected restaurant previews
    if (!doesRestaurantExistInLocalData) {
      // Update local state
      setRestaurantData([...restaurantData, restaurant]);
    }

    // Update external state
    if (!isRestaurantAlreadySelected) {
      // Select
      onSelectedRestaurantsUpdate([...selectedRestaurants, restaurant]);
    } else {
      // Unselect
      onSelectedRestaurantsUpdate(
        selectedRestaurants.filter(
          (selectedRestaurant) => selectedRestaurant.id != restaurant.id
        )
      );
    }
  };

  // Business Logic
  const loadData = async (
    clientCoordinates: CoordinatePoint | undefined = currentClientCoordinates()
  ) => {
    setIsLoading(true);

    const fetchedRestaurants =
      await apiService.performOnboardingFonciiRestaurantSearch({
        searchQuery,
        clientCoordinates,
      }),
      parsedRestaurants = fetchedRestaurants.map((fonciiRestaurant) => {
        return fonciiRestaurant.restaurant;
      });

    // Combine fetched restaurants with existing selected restaurants
    const combinedRestaurants = [...selectedRestaurants];

    parsedRestaurants.forEach((restaurant) => {
      const elementIsUnique =
        combinedRestaurants.find(
          (combinedRestaurant) => combinedRestaurant.id == restaurant.id
        ) == undefined;

      if (elementIsUnique) combinedRestaurants.push(restaurant);
    });

    setRestaurantData(combinedRestaurants);
    setIsLoading(false);
  };

  // Helpers
  const reverseGeocodeLocation = (coordinates: CoordinatePoint) => {
    const geocoder = new MapboxGeocoder({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      mapboxgl: mapboxgl,
      types: "country,region,place,postcode,locality,neighborhood",
      reverseGeocode: true,
    });

    const mapElementID = "mapbox";
    geocoder.addTo(`#${mapElementID}`);

    // Pass location coordinates to the geocoder to reverse geocode
    const parsedCoordinates = `${coordinates.lat},${coordinates.lng}`;
    geocoder.query(parsedCoordinates);

    geocoder.on("result", function (e) {
      const result = e.result,
        placeName = result.place_name as string,
        parsedPlaceName = placeName.split(",").slice(0, 3).filter(Boolean),
        // Neighborhood, City, State
        shorthandAddress = parsedPlaceName.join(",");

      setCurrentAddress(shorthandAddress);
      setProcessingUserAddress(false);
    });
  };

  // Convenience
  const currentClientCoordinates = () => {
    return fonciiUser.clientCoordinates;
  };

  const hasRestaurants = (): boolean =>
    sortedAndFilteredRestaurants().length > 0;

  const getRandomRestaurantName = (): string => {
    return (
      restaurantPreviews()[
        Math.floor(Math.random() * restaurantPreviews().length)
      ]?.title ?? "What are you looking for?"
    );
  };

  const mapRestaurantPreviewsToRestaurants = (
    restaurantPreviews: RestaurantPreview[]
  ) => {
    return restaurantPreviews
      .map((restaurantPreview) => {
        return restaurantData.find(
          (restaurant) => restaurant.id == restaurantPreview.id
        );
      })
      .filter(Boolean) as Restaurant[];
  };

  const mapRestaurantsToRestaurantPreviews = (restaurants: Restaurant[]) => {
    return restaurants
      .map((restaurant) => {
        return restaurantPreviews().find(
          (restaurantPreview) => restaurantPreview.id == restaurant.id
        );
      })
      .filter(Boolean) as RestaurantPreview[];
  };

  const restaurantPreviews = (): RestaurantPreview[] => {
    return restaurantData.map((restaurant) => {
      return convertRestaurantToPreview(restaurant);
    });
  };

  const convertRestaurantToPreview = (
    restaurant: Restaurant
  ): RestaurantPreview => {
    return {
      id: restaurant.id,
      title: restaurant.name,
      imageURL: restaurant.heroImageURL,
      categories: restaurant.categories ?? [],
    } as RestaurantPreview;
  };

  const sortedAndFilteredRestaurants = () => {
    return restaurantPreviews()
      .sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { ignorePunctuation: true })
      )
      .filter((restaurantPreview) => {
        return restaurantPreview.title
          .toLowerCase()
          .includes(searchTextFieldInput.toLowerCase());
      });
  };

  const selectedRestaurantPreviews =
    mapRestaurantsToRestaurantPreviews(selectedRestaurants);

  // Subcomponents
  const TitleLabel = (): React.ReactNode => {
    return <h1 className="w-full">{title}</h1>;
  };

  const LocateMeButton = (): React.ReactNode => {
    const title = "Locate Me";

    return (
      <FonciiToolTip title="Provide your current location to get local restaurants">
        <button
          className={cn(
            "flex flex-row gap-x-[8px] items-center justify-center rounded-full px-[16px] py-[4px] h-fit w-fit bg-medium active:bg-primary transition-all hover:opacity-75 active:scale-95 transform-gpu shadow-lg",
            processingUserAddress
              ? "animate-pulse pointer-events-none"
              : "pointer-events-auto"
          )}
          onClick={requestUserLocation}
          disabled={processingUserAddress}
        >
          <Image
            alt="Locate Me Button Icon"
            height={16}
            width={16}
            className="w-[16px] h-[16px]"
            src={ImageRepository.UtilityIcons.PaperPlaneShareIcon}
          />
          <p className="text-permanent_white text-[14px] font-normal">
            {title}
          </p>
        </button>
      </FonciiToolTip>
    );
  };

  const CurrentUserAddressDescriptor = (): React.ReactNode => {
    return (
      <div className="flex flex-row gap-x-[12px] items-center justify-center">
        {/** Side Map Marker Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="16"
          viewBox="0 0 13 16"
          fill="none"
        >
          <g clip-path="url(#clip0_6918_59390)">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M6.39985 4C5.89353 4 5.39858 4.1564 4.97759 4.44941C4.5566 4.74243 4.22847 5.15891 4.03471 5.64618C3.84095 6.13345 3.79026 6.66962 3.88903 7.18691C3.98781 7.70419 4.23163 8.17934 4.58965 8.55229C4.94767 8.92523 5.40382 9.1792 5.90041 9.28209C6.39701 9.38499 6.91174 9.33218 7.37952 9.13035C7.84729 8.92851 8.24711 8.58672 8.52841 8.14819C8.8097 7.70966 8.95985 7.19408 8.95985 6.66667C8.95985 5.95942 8.69013 5.28115 8.21004 4.78105C7.72995 4.28095 7.0788 4 6.39985 4ZM5.11985 6.66667C5.11985 6.40296 5.19492 6.14517 5.33556 5.92591C5.47621 5.70664 5.67612 5.53574 5.91001 5.43483C6.1439 5.33391 6.40127 5.30751 6.64956 5.35895C6.89786 5.4104 7.12593 5.53739 7.30494 5.72386C7.48395 5.91033 7.60586 6.1479 7.65525 6.40655C7.70464 6.66519 7.67929 6.93328 7.58241 7.17691C7.48553 7.42055 7.32147 7.62878 7.11098 7.77529C6.90048 7.9218 6.65301 8 6.39985 8C6.06037 8 5.7348 7.85952 5.49475 7.60948C5.2547 7.35943 5.11985 7.02029 5.11985 6.66667Z"
              fill="#A4A8B7"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M6.4 -0.00014817C5.56793 -0.00894731 4.74235 0.153067 3.9704 0.476644C3.19844 0.800221 2.49524 1.27902 1.90093 1.88571C1.30663 2.49239 0.832869 3.21508 0.506705 4.0125C0.180541 4.80992 0.00836227 5.66645 0 6.53319C0 8.97985 1.408 11.3332 2.7968 13.0199C3.41493 13.7701 4.09368 14.4638 4.8256 15.0932C5.0835 15.3127 5.3527 15.5175 5.632 15.7065C5.74171 15.7751 5.85495 15.8375 5.9712 15.8932C6.10407 15.9635 6.25098 16.0001 6.4 16.0001C6.54902 16.0001 6.69593 15.9635 6.8288 15.8932C6.94505 15.8375 7.05829 15.7751 7.168 15.7065C7.4473 15.5175 7.7165 15.3127 7.9744 15.0932C8.70632 14.4638 9.38507 13.7701 10.0032 13.0199C11.392 11.3332 12.8 8.97985 12.8 6.53319C12.7916 5.66645 12.6195 4.80992 12.2933 4.0125C11.9671 3.21508 11.4934 2.49239 10.8991 1.88571C10.3048 1.27902 9.60156 0.800221 8.8296 0.476644C8.05765 0.153067 7.23207 -0.00894731 6.4 -0.00014817V-0.00014817ZM1.28 6.53319C1.28835 5.84154 1.42742 5.15838 1.68925 4.52273C1.95108 3.88707 2.33056 3.31137 2.80601 2.82849C3.28145 2.34562 3.84356 1.96503 4.46022 1.70846C5.07688 1.45189 5.73602 1.32437 6.4 1.33319C7.06398 1.32437 7.72312 1.45189 8.33978 1.70846C8.95644 1.96503 9.51855 2.34562 9.99399 2.82849C10.4694 3.31137 10.8489 3.88707 11.1108 4.52273C11.3726 5.15838 11.5116 5.84154 11.52 6.53319C11.52 8.48652 10.368 10.5332 9.0368 12.1465C8.46714 12.8384 7.84195 13.4785 7.168 14.0599C6.96449 14.2418 6.75078 14.411 6.528 14.5665L6.432 14.6265L6.336 14.5665C6.11322 14.411 5.89951 14.2418 5.696 14.0599C5.02205 13.4785 4.39686 12.8384 3.8272 12.1465C2.432 10.5332 1.28 8.48652 1.28 6.53319Z"
              fill="#A4A8B7"
            />
          </g>
          <defs>
            <clipPath id="clip0_6918_59390">
              <rect width="12.8" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>

        {/** Address Description */}
        <p className="text-[18px] text-permanent_white underline line-clamp-1 font-normal">
          {currentAddress}
        </p>
      </div>
    );
  };

  const UserLocationHeader = (): React.ReactNode => {
    return currentAddress ? CurrentUserAddressDescriptor() : LocateMeButton();
  };

  const StatusPrompt = (): React.ReactNode => {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        {isLoading ? (
          <CircularLoadingIndicator isLoading />
        ) : (
          <p className="text-permanent_white font-normal shrink-0 text-[18px]">
            No Restaurants Available
          </p>
        )}
      </div>
    );
  };

  // Sections
  const TopSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[8px] items-center justify-center h-fit w-fit">
        <TitleLabel />
        {UserLocationHeader()}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-y-[28px] px-[16px] xs:px-[32px] transition-all ease-in-out transform-gpu duration-300 text-center items-center justify-center text-[22px] xl:text-[24px] break-words w-full h-fit font-medium text-permanent_white pb-[50px]">
      {TopSection()}

      <div className="flex flex-col w-full gap-y-[16px] transition-all ease-in-out transform-gpu">
        <OnboardingRSSearchBar
          onRestaurantSelect={handleAutoCompleteRestaurantSelection}
          placeholder={searchBarPlaceholder}
          textInputDidChangeCallback={(textInput) =>
            setSearchTextFieldInput(textInput)
          } // Immediate text field content (real-time)
          textFieldDidDismissCallback={onSearchQueryUpdateHandler} // User presses enter to search / dismisses textfield
        />
        {hasRestaurants() ? (
          <OnboardingRestaurantSelector
            restaurants={sortedAndFilteredRestaurants()}
            selectedRestaurants={selectedRestaurantPreviews}
            onSelect={onSelectHandler}
          />
        ) : (
          <StatusPrompt />
        )}
      </div>
    </div>
  );
}
