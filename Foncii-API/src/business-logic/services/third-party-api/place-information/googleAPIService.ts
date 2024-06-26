// Dependencies
// SDK
import {
  Client,
  PlaceInputType,
  Language,
  AddressType,
  PlaceAutocompleteType,
  PlaceAutocompleteResult,
} from "@googlemaps/google-maps-services-js";

// Logging
import logger from "../../../../foncii-toolkit/debugging/debugLogger";

// Namespaces
import { Google } from "../../../../types/namespaces/third-party-api";

export default class GooglePlacesService {
  // Properties
  private client;

  // Constants
  // Request Parameters
  private TIMEOUT_DURATION = 6000; // Max request timeout, in milliseconds [ms] 6 seconds
  private PLACE_PHOTOS_MAX_WIDTH = 1200; // ~ Target size for high quality images, If smaller then the original image dimension is returned

  // Find Place Endpoint
  // The shape of the search area
  private SEARCH_AREA_SHAPES = {
    circle: "circle",
    rectangle: "rectangle",
  };

  private SEARCH_AREA_RADIUS = 400; // In meters [m] ~0.248548 miles

  FindPlaceFromTextFields = {
    formattedAddress: "formatted_address",
    name: "name",
    rating: "rating",
    openingHours: "opening_hours",
    geometry: "geometry",
    placeID: "place_id",
  };

  // Places Details Endpoint
  GoogleFindPlacesEndpointFields = {
    address_components: "address_components",
    formattedPhoneNumber: "formatted_phone_number",
    internationalPhoneNumber: "international_phone_number",
    formattedAddress: "formatted_address",
    name: "name",
    rating: "rating",
    geometry: "geometry",
    editorialSummary: "editorial_summary",
    editorialSummary_Overiew: "overview",
    reservable: "reservable",
    priceLevel: "price_level",
    website: "website",
    servesWine: "serves_wine",
    servesBeer: "serves_beer",
    businessStatus: "business_status",
    openingHours: "opening_hours",
    currentOpeningHours: "current_opening_hours",
    currentOpeningHours_Weekday_Text: "weekday_text",
    photos: "photos",
    photos_photo_reference: "photo_reference",
    reviews: "reviews",
    utc_offset: "utc_offset",
  };

  /// Various types supported by the address components type
  static AddressComponentAttributes = {
    postalCode: "postal_code",
    locality: "locality",
    sublocality: "sublocality",
    administrativeAreaLevel1: "administrative_area_level_1",
    country: "country",
    route: "route", // Name of street or road, ex.) 'Main Street'
    streetNumber: "street_number",
  };

  // Review Properties
  private reviewSortKey = "newest";
  // Translates the review into the specified language if it originated from a different language, necessary for the NLP model since
  // it only knows a fixed set of languages and reviews can encompass any language
  private doNottranslateReviews = false;

  // Search properties
  private searchAreaShape;

  constructor() {
    this.client = new Client({});
    this.searchAreaShape = this.SEARCH_AREA_SHAPES.rectangle;
  }

  /**
   * Searches for the target business within the search area designated by the specified coordinate point
   * with a location bias ~ 400 meters to ensure the correct establishment is found within a reasonable search area
   *
   * @async
   * @param businessName
   * @param address
   * @param coordinatePoint -> Optional coordinate point to bias the search around, not necessary, but helpful if narrowing down the
   * search is required / beneficial. If a coordinate point is available then it's sometimes beneficial to pass it here, but it doesn't make
   * a huge difference.
   *
   * @returns -> The optional placeID String corresponding to the Google Business
   */
  async getPlaceIDFromTextAndLocation(
    businessName: string,
    address: string = "",
    coordinatePoint?: CoordinatePoint
  ): Promise<string | undefined> {
    // To get more accurate results, passing in an address is permissible
    const combinedQuery = [businessName, address].join(" ");

    return this.client
      .findPlaceFromText({
        params: {
          fields: [this.FindPlaceFromTextFields.placeID],
          input: combinedQuery,
          inputtype: PlaceInputType.textQuery,
          locationbias: coordinatePoint
            ? `${this.searchAreaShape}@${this.SEARCH_AREA_RADIUS},${coordinatePoint.lat},${coordinatePoint.lng}`
            : undefined,
          key: process.env.GOOGLE_MAPS_API_SECRET,
        },
        timeout: this.TIMEOUT_DURATION,
      })
      .then((result) => {
        return result.data.candidates[0]?.place_id;
      })
      .catch((error) => {
        logger.error(error);
        return undefined;
      });
  }

  /**
   * Fetches and parses the address components for the business
   * specified by the given placeID
   *
   * @async
   * @param googlePlaceID
   *
   * @returns -> An object containing various response data points
   * keyed to `GooglePlacesService.ParsedAddressComponentsAttributes` keys
   */
  async getAddressComponents(
    googlePlaceID: string
  ): Promise<undefined | Google.ParsedAddressComponentAttributes> {
    return this.client
      .placeDetails({
        params: {
          fields: [
            this.GoogleFindPlacesEndpointFields.address_components,
            this.GoogleFindPlacesEndpointFields.formattedAddress,
            this.GoogleFindPlacesEndpointFields.geometry,
            this.GoogleFindPlacesEndpointFields.name,
          ],
          place_id: googlePlaceID,
          language: Language.en,
          key: process.env.GOOGLE_MAPS_API_SECRET,
        },
        timeout: this.TIMEOUT_DURATION,
      })
      .then(async (result) => {
        const business = result.data.result;

        // Extract the city, state, and country from the address components
        const addressComponents = business.address_components ?? [],
          parsedAddressComponents: Partial<Google.ParsedAddressComponentAttributes> = {};

        // Parsed Street number and name (route)
        let streetNumber = "",
          streetName = "",
          combinedStreetAddress = "";

        addressComponents.forEach((addressComponent) => {
          if (addressComponent.types.includes(AddressType.neighborhood)) {
            // Neighborhood (Not present for a lot of places) reverse-geocoding necessary
            parsedAddressComponents.neighborhood = addressComponent.short_name;
          }
          else if (
            addressComponent.types.includes(AddressType.sublocality)
          ) {
            // Specific City / Borough (i.e New York ~ Brooklyn || Manhattan)
            parsedAddressComponents.city = addressComponent.short_name;
          }
          else if (
            addressComponent.types.includes(AddressType.locality)
          ) {
            // General City / New York - Sublocality is more specific, but not neighborhood level
            // Putting sublocality and locality together will result in the less specific locality
            // overwriting the sublocality, New York Vs Manhattan, Manhattan is more informative obviously
            parsedAddressComponents.city = addressComponent.short_name;
          }
          else if (
            addressComponent.types.includes(AddressType.street_number)
          ) {
            // Street Number
            streetNumber = addressComponent.short_name;
          } else if (addressComponent.types.includes(AddressType.route)) {
            // Street Name / Route
            streetName = addressComponent.short_name;
          } else if (addressComponent.types.includes(AddressType.postal_code)) {
            // Postal code
            parsedAddressComponents.postalCode = addressComponent.short_name;
          } else if (
            addressComponent.types.includes(
              AddressType.administrative_area_level_1
            )
          ) {
            // State code
            parsedAddressComponents.state = addressComponent.short_name;
          } else if (addressComponent.types.includes(AddressType.country)) {
            // Country code
            parsedAddressComponents.country = addressComponent.short_name;
          }
        });

        // Create the street address from the parsed address components
        combinedStreetAddress = [streetNumber, streetName].join(" ");
        parsedAddressComponents.streetAddress = combinedStreetAddress;

        const parsedResponseData = {
          ...parsedAddressComponents,
          businessName: business.name,
          formattedAddress: business.formatted_address,
          geometry: business.geometry,
        } as Google.ParsedAddressComponentAttributes;

        return parsedResponseData;
      })
      .catch((error) => {
        logger.error(error);
        return undefined;
      });
  }

  /**
   * Fetches a specific business from Google's database using the given google place ID
   * and returns data for the specified fields
   *
   * @async
   * @param googlePlaceID
   *
   * @returns -> An array of JSONs containing the required properties for this Google Business
   */
  async getPlaceDetails(
    googlePlaceID: string
  ): Promise<Partial<Google.ParsedPlaceDetails> | undefined> {
    return this.client
      .placeDetails({
        params: {
          fields: [
            this.GoogleFindPlacesEndpointFields.editorialSummary,
            this.GoogleFindPlacesEndpointFields.name,
            this.GoogleFindPlacesEndpointFields.rating,
            this.GoogleFindPlacesEndpointFields.openingHours,
            this.GoogleFindPlacesEndpointFields.photos,
            this.GoogleFindPlacesEndpointFields.internationalPhoneNumber,
            this.GoogleFindPlacesEndpointFields.reservable,
            this.GoogleFindPlacesEndpointFields.priceLevel,
            this.GoogleFindPlacesEndpointFields.website,
            this.GoogleFindPlacesEndpointFields.servesWine,
            this.GoogleFindPlacesEndpointFields.servesBeer,
            this.GoogleFindPlacesEndpointFields.utc_offset,
          ],
          place_id: googlePlaceID,
          language: Language.en,
          key: process.env.GOOGLE_MAPS_API_SECRET,
        },
        timeout: this.TIMEOUT_DURATION,
      })
      .then(async (result) => {
        const business = result.data.result;

        /// If the object is undefined for some reason return undefined
        if (business == undefined) {
          return undefined;
        }

        const editorialSummary = business.editorial_summary?.overview,
          photoRefs =
            business.photos?.map((val) => {
              // Only select the photo reference part of the object
              return val.photo_reference;
            }) ?? [],
          operatingHours = business.opening_hours?.weekday_text ?? [];

        /// Fetch all photo urls using the photo references and store them in an array (if photoRefs exist)
        // Processes place photo requests concurrently (at the same time)
        let photoURLs: string[] = [];
        const photoPromises = photoRefs.map(async (photoRef: string) => {
          return this.getPlacePhoto(photoRef);
        });

        // Filter out any undefined values from the photo promises (i.e. if the photo can't be resolved)
        photoURLs = (await Promise.all(photoPromises)).filter(
          Boolean
        ) as string[];

        // Reassign transformed key value pairs
        return {
          editorialSummary: editorialSummary,
          name: business.name,
          rating: business.rating,
          openingHours: operatingHours,
          photos: photoURLs,
          internationalPhoneNumber: business.international_phone_number,
          reservable: (business as any)[
            this.GoogleFindPlacesEndpointFields.reservable
          ], // Select atmosphere and other fields aren't documented by the JS SDK type defs for some reason
          priceLevel: business.price_level,
          website: business.website,
          servesWine: (business as any)[
            this.GoogleFindPlacesEndpointFields.servesWine
          ],
          servesBeer: (business as any)[
            this.GoogleFindPlacesEndpointFields.servesBeer
          ],
          utc_offset: business.utc_offset,
        } as Partial<Google.ParsedPlaceDetails>;
      })
      .catch((error) => {
        logger.error(error);
        return undefined;
      });
  }

  /**
   * Fetches the required place photo URL attributed to the place photo reference,with the
   * fetched photo being resized to the required dimensions, or the original dimensions if the
   * photo is smaller than what's preferred
   *
   * @async
   * @param placePhotoRef -> The photo reference to pass to the place photo endpoint
   *
   * @returns -> The URL returned from the place photo request
   */
  async getPlacePhoto(placePhotoRef: string): Promise<string | undefined> {
    return await this.client
      .placePhoto({
        params: {
          photoreference: placePhotoRef,
          maxwidth: this.PLACE_PHOTOS_MAX_WIDTH,
          key: process.env.GOOGLE_MAPS_API_SECRET,
        },
        responseType: "arraybuffer",
      })
      .then((result) => {
        /// Parse the response URL for the image resource
        const placePhotoResponse = result.request.res.responseUrl;

        return placePhotoResponse;
      })
      .catch((error) => {
        logger.error(error);
        return undefined;
      });
  }

  /**
   * Fetches and returns reviews for a specific business in Google's database
   * only up to 5 non-paginatable reviews are returned, this is the hard limit of this endpoint
   *
   * @async
   * @param googlePlaceID
   *
   * @returns -> An array containing up to 5 Google Place reviews.
   */
  async getGoogleReviewsForBusiness(
    googlePlaceID: string
  ): Promise<Google.Reviews | undefined> {
    return this.client
      .placeDetails({
        params: {
          fields: [this.GoogleFindPlacesEndpointFields.reviews],
          reviews_sort: this.reviewSortKey,
          reviews_no_translations: this.doNottranslateReviews,
          place_id: googlePlaceID,
          language: Language.en,
          key: process.env.GOOGLE_MAPS_API_SECRET,
        } as any,
        timeout: this.TIMEOUT_DURATION,
      })
      .then(async (result) => {
        return result.data.result as Google.Reviews;
      })
      .catch((error) => {
        logger.error(error);
        return undefined;
      });
  }

  /**
   * Gets the Google rating for the business with the given Google ID
   *
   * @async
   * @param googlePlaceID
   *
   * @returns -> The numeric double Google rating for the given business ID in Google's database
   */
  async getGoogleRatingForBusinessWithGoogleID(
    googlePlaceID: string
  ): Promise<number | undefined> {
    return this.client
      .placeDetails({
        params: {
          fields: [this.GoogleFindPlacesEndpointFields.rating],
          place_id: googlePlaceID,
          language: Language.en,
          key: process.env.GOOGLE_MAPS_API_SECRET,
        },
        timeout: this.TIMEOUT_DURATION,
      })
      .then(async (result) => {
        let business = result.data.result;

        // Parse the rating from the returned business data JSON
        return business.rating;
      })
      .catch((error) => {
        logger.error(error);
        return undefined;
      });
  }

  /**
   * Determines whether a business with the given Google Place ID
   * exists in Google's database
   *
   * @async
   * @param googlePlaceID
   *
   * @returns -> True a business with the given Google Place ID does
   * exist in Google's database, false otherwise
   */
  async doesBusinessWithGPIDExist(googlePlaceID: string): Promise<Boolean> {
    return this.client
      .placeDetails({
        params: {
          fields: [],
          place_id: googlePlaceID,
          language: Language.en,
          key: process.env.GOOGLE_MAPS_API_SECRET,
        },
        timeout: this.TIMEOUT_DURATION
      })
      .then(async (result) => {
        return result != undefined;
      })
      .catch((error) => {
        logger.error(error);
        return false;
      });
  }

  /**
   * Performs a place auto-complete search using the given search query.
   * The returned suggestion candidates are for establishment types (i.e
   * restaurants and other businesses as configured within this method)
   *
   * @async
   * @param searchQuery
   *
   * @returns -> A list of 'PlaceAutocompleteResult' predictions that best match the given
   * search query [Up to 5 results at a time]
   */
  async performPlaceAutoCompleteSearch(
    searchQuery: string
  ): Promise<PlaceAutocompleteResult[]> {
    return this.client
      .placeAutocomplete({
        params: {
          input: searchQuery,
          language: Language.en,
          types: PlaceAutocompleteType.establishment,
          key: process.env.GOOGLE_MAPS_API_SECRET,
        },
        timeout: this.TIMEOUT_DURATION,
      })
      .then(async (result) => {
        return result.data.predictions;
      })
      .catch((error) => {
        logger.error(error);
        return [];
      });
  }
}
