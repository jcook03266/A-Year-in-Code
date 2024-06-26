// Dependencies
// Services
import GooglePlacesService from "./googleAPIService";

// Logging
import logger from "../../../../foncii-toolkit/debugging/debugLogger";

// Namespaces
import { Yelp } from "../../../../types/namespaces/third-party-api";

/**
 * Service layer for interfacing with the Yelp Fusion API
 */
export default class YelpService {
  /// Privatized Instance variables
  // Properties
  private businessSDK;
  private reviewSDK; // Need a separate definition for the reviews endpoint and business match

  // Business Search Endpoint
  private searchAreaRadius = 40000; // In meters [m] ~ 25 miles
  private searchTerm = "restaurants";
  private sortByKey = "best_match";

  // Business Match Endpoint Critera
  // Find close matches with the 'default' threshold, strict is too strict and won't match 
  // unless the name of the venue is extremely close to what Yelp has on record, default mitigates this issue
  private businessMatchResultLimit = 1;
  private businessMatchThreshold: 'none' | 'default' | 'strict' = "default";

  // Artificial Limits
  private resultLimit = 50;
  private MAXIMUM_ALLOWABLE_RESULTS = 200;
  private MAX_PAGE = 3; // ~ 0 -> 50 -> 150 -> 200 Results

  // Hard Endpoint Limits
  // The maximum amount of results that can be returned at once
  private MAX_RESULT_LIMIT = 50;
  // maxYelpResultOffset = 1000; Defined by the API's docs

  // Enforces a maximum of 64 (0 - 63) characters for restaurant names and addresses etc.
  private static MAX_FIELD_LENGTH = 63;

  // The current amount of elements the current result is offset by
  // ex.) 200 elements returned, limit is 50, offset is 50, the returned results range is from 50-100 now
  private offset = 0;

  // Pagination
  private currentPage = 0;
  private pageLimit = 1; // ~ 100 results total

  constructor() {
    /// Define Yelp Fusion API entry point
    this.businessSDK = require("api")("@yelp-developers/v1.0#34i64rh21lu8dwzhw");
    this.reviewSDK = require("api")("@yelp-developers/v1.0#rnh0jhlu9w2vau");

    this.setup();
  }

  /**
   * Setup the authenticators w/ the required auth token
   */
  setup() {
    this.businessSDK.auth(process.env.YELP_FUSION_API_SECRET);
    this.reviewSDK.auth(process.env.YELP_FUSION_API_SECRET);
  }

  /** Setters */
  /**
   * Sets the result limit and max offset from an external source ~ GraphQL Resolver
   * 
   * @param resultLimit 
   */
  setResultLimit(resultLimit: number) {
    if (resultLimit == undefined) return;

    this.resultLimit = resultLimit > this.MAX_RESULT_LIMIT ? this.MAX_RESULT_LIMIT : resultLimit;
  }

  /**
   * Used to specify the current page of results to start from (multiple pages) and or return from
   * 
   * @param page
   */
  setPage(page: number) {
    if (page == undefined) return;

    this.currentPage = page > this.MAX_PAGE ? this.MAX_PAGE : page;
  }

  /**
   * Use this specify how many pages to return at once, 0 to return one page, 3 to return 4 pages etc.
   * 
   * @param pageLimit 
   */
  setPageLimit(pageLimit: number) {
    if (pageLimit == undefined) return;

    this.pageLimit = pageLimit > this.MAX_PAGE ? this.MAX_PAGE : pageLimit;
  }

  /**
   * Returns an array of businesses around the specified coordinate point
   * up to the given limit in an async manner.
   *
   * @async
   * @param coordinatePoint
   * 
   * Object reference here: https://docs.developer.yelp.com/reference/v3_business_search
   * 
   * @returns -> An array of JSONs containing yelp business fields
   */
  async fetchBusinessesAround(
    coordinatePoint: CoordinatePoint
  ): Promise<Yelp.Business[] | undefined> {
    let businesses: Yelp.Business[] = [],
      promises = [];

    for (let page = this.currentPage; page <= this.pageLimit; page++) {
      // Increment the offset by the result limit
      this.offset = this.resultLimit * page;

      // Reinforce boundary condition
      if (this.offset > this.MAXIMUM_ALLOWABLE_RESULTS) {
        this.offset = this.MAXIMUM_ALLOWABLE_RESULTS;
      }

      promises.push(
        this.businessSDK
          .v3_business_search({
            latitude: coordinatePoint.lat,
            longitude: coordinatePoint.lng,
            term: this.searchTerm,
            sort_by: this.sortByKey,
            radius: this.searchAreaRadius,
            limit: this.resultLimit,
            offset: this.offset,
          })
          .then(({ data }: any) => {
            const parsedData = data as Yelp.BusinessSearchResults;
            return parsedData.businesses;
          })
          .catch((err: any) => logger.error(err))
      );
    }

    const results = await Promise.all(promises);
    businesses = results.flat();

    // Filter out any duplicate objects
    return [...new Set(businesses)];
  }

  /**
   * Queries the reviews for the given Yelp based restaurant and returns only 3 non-paginatable reviews
   * the endpoint doesn't support returning anything more than this unfortunately, and all the fields except locale and
   * business_id_or_alias don't work
   *
   * @async
   * @param yelpID - The ID of the yelp restaurant to get reviews for
   * 
   * Response data reference here: https://docs.developer.yelp.com/reference/v3_business_reviews
   * 
   * @returns -> Returns an array of JSONs containing review data
   * 
   */
  async getYelpReviewsForBusiness(
    yelpID: string
  ): Promise<Yelp.Review[] | undefined> {
    const reviews = await this.reviewSDK
      .v3_business_reviews({
        business_id_or_alias: yelpID,
      })
      .then(({ data }: any) => {
        const parsedData = data as Yelp.Reviews;

        return parsedData.reviews;
      })
      .catch((err: any) => logger.error(err));

    return reviews;
  }

  /**
   * Queries Yelp's database using the given business metadata (most likely from Google)
   * and returns the business data for the closest Yelp match
   *
   * @async
   * @param name -> Name of the restaurant eg.) Pete's Taco Bar
   * @param address -> Street address eg.) 123 Main St or 123 Main St, Gumdrop City, NY, 19012, US
   * @param city -> City name eg.) New York
   * @param stateCode -> 1-3 Character state code eg.) NJ or NY
   * @param countryCode -> 1-2 Character country code eg.) US
   * Response data reference here: https://docs.developer.yelp.com/reference/v3_business_match
   * 
   * @returns -> Returns a JSON containing the limited (yelpID etc.) matched business data for the closest match
   *
   */
  async findYelpMatchForBusiness({
    name,
    address,
    city,
    stateCode,
    countryCode
  }: {
    name: string,
    address: string,
    city: string,
    stateCode: string,
    countryCode: string
  }): Promise<Yelp.Business | undefined> {
    const matchedBusiness: Yelp.Business | undefined =
      await this.businessSDK
        .v3_business_match({
          name: name.substring(0, YelpService.MAX_FIELD_LENGTH),
          address1: address.substring(0, YelpService.MAX_FIELD_LENGTH),
          city: city,
          state: stateCode,
          country: countryCode,
          limit: this.businessMatchResultLimit,
          match_threshold: this.businessMatchThreshold,
        })
        .then(({ data }: any) => {
          const parsedData = data as Yelp.BusinessSearchResults;
          return parsedData.businesses[0];
        })
        .catch((err: any) => logger.error(err));

    return matchedBusiness;
  }

  /**
   * Queries Yelp's database using the corresponding Google business metadata associated with the
   * given google place ID, and returns the business data for the closest Yelp business match.
   *
   * @async
   * @param googlePlaceID
   * Response data reference here: https://docs.developer.yelp.com/reference/v3_business_match
   * 
   * @returns -> Returns a JSON containing the matched business data for the closest match
   *
   */
  async findYelpMatchWithGooglePlaceID(
    googlePlaceID: string
  ): Promise<Yelp.Business | undefined> {
    const googleService = new GooglePlacesService(),
      response = await googleService.getAddressComponents(googlePlaceID);

    // Precondition failure
    if (!response) return undefined;

    // Parse the response object's relevant data points
    const { country, state, city, streetAddress, businessName } = response;

    // Attempt to find the corresponding business in Yelp's database using the given data points
    const foundBusiness = await this.findYelpMatchForBusiness({
      name: businessName,
      address: streetAddress,
      city,
      stateCode: state,
      countryCode: country
    });

    return foundBusiness;
  }

  /**
   * Finds a yelp business' data based on Yelp's own identifier for its resource
   *
   * @async
   * @param yelpID -> The yelp identifier to use to find the data for the business in question
   * Response data reference here: https://docs.developer.yelp.com/reference/v3_business_info
   * 
   * @returns -> Returns a JSON containing the matched business data for the business referenced by the given YelpID
   */
  async findYelpBusinessByID(
    yelpID: string
  ): Promise<Yelp.Business | undefined> {
    const yelpBusiness: Yelp.Business | undefined =
      await this.businessSDK
        .v3_business_info({
          business_id_or_alias: yelpID,
        })
        .then(({ data }: any) => {
          return data as Yelp.Business;
        })
        .catch((err: any) => logger.error(err));

    return yelpBusiness;
  }

  /**
   * Gets the yelp rating for the business with the given Yelp ID
   *
   * @async
   * @param yelpID
   * 
   * @returns -> Returns the numeric double rating for the given Yelp business (if any)
   */
  async getYelpRatingForBusinessWithYelpID(
    yelpID: string
  ): Promise<number | undefined> {
    const business = await this.findYelpBusinessByID(yelpID);
    return business?.rating;
  }

  // Sample Restaurant Data Response
  /**
    "businesses": [
    {
      "id": "hdiuRS9sVZSMReZm4oV5SA",
      "alias": "da-andrea-new-york",
      "name": "Da Andrea",
      "image_url": "https://s3-media1.fl.yelpcdn.com/bphoto/OciLddTWxvBLKMH5DkMAOw/o.jpg",
      "is_closed": false,
      "url": "https://www.yelp.com/biz/da-andrea-new-york?adjust_creative=X7NnDxXzpIRHF9017rQtAA&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=X7NnDxXzpIRHF9017rQtAA",
      "review_count": 1834,
      "categories": [
        {
          "alias": "italian",
          "title": "Italian"
        },
        {
          "alias": "mediterranean",
          "title": "Mediterranean"
        },
        {
          "alias": "breakfast_brunch",
          "title": "Breakfast & Brunch"
        }
      ],
      "rating": 4.5,
      "coordinates": {
        "latitude": 40.736218,
        "longitude": -73.99597
      },
      "transactions": [
        "pickup",
        "delivery",
        "restaurant_reservation"
      ],
      "price": "$$",
      "location": {
        "address1": "35 W 13th St",
        "address2": "",
        "address3": "",
        "city": "New York",
        "zip_code": "10011",
        "country": "US",
        "state": "NY",
        "display_address": [
          "35 W 13th St",
          "New York, NY 10011"
        ]
      },
      "phone": "+12123671979",
      "display_phone": "(212) 367-1979",
      "distance": 3526.365251890872
    }
    ]
    */
}
