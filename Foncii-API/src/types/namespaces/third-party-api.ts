// Dependencies
// Services
import { AddressGeometry } from "@googlemaps/google-maps-services-js";

/**
 * Type definitions for various third-party API interfaces and type conformities.
 */
/** Google Places API */
export declare namespace Google {
  interface ParsedAddressComponentAttributes {
    businessName: string;
    neighborhood?: string;
    city: string;
    state: string;
    country: string;
    streetAddress: string;
    postalCode: string;
    geometry: AddressGeometry;
    formattedAddress: string;
  }

  interface ParsedPlaceDetails {
    editorialSummary?: string;
    name: string;
    rating: number;
    openingHours?: string[];
    photos?: string[];
    internationalPhoneNumber?: string;
    reservable: boolean;
    priceLevel?: number;
    website?: string;
    servesWine: boolean;
    servesBeer: boolean;
    /** Used to compute 'open' status relative to some other offset */
    utc_offset: string;
  }

  /** Google | Reviews */
  interface Reviews {
    reviews: Review[];
  }

  interface Review {
    text: string; // "Food is served plastic plates, obviously doesn't affect the food's flavor, but always good to know.\nAuthentic place, good dishes."
  }
}

/** Yelp API */
export declare namespace Yelp {
  /** Yelp | Business Details */
  interface BusinessSearchResults {
    total: number;
    region: SearchResultRegion;
    businesses: Business[];
  }

  interface Business {
    id: string; // "hdiuRS9sVZSMReZm4oV5SA"
    alias: string; // "da-andrea-new-york"
    name: string; // "Da Andrea"
    image_url: string;
    is_closed: boolean;
    url: string;
    review_count: number;
    categories: Category[]; // [{"alias": "italian", "title": "Italian" }...]
    rating: number;
    coordinates: CoordinatePoint;
    transactions: Transaction[]; // ["pickup", "delivery", "restaurant_reservation"]
    price: string;
    phone: string; // "+12123671979"
    display_phone: string; // "(212) 367-1979"
    distance: number; // Distance from search area center 3526.365251890872
    location: {
      address1: string;
      address2: string;
      address3: string;
      city: string;
      zip_code: string;
      country: string;
      state: string;
      display_address: string[];
    };
  }

  type SearchResultRegion = {
    center: CoordinatePoint;
  };

  type CoordinatePoint = {
    latitude: number;
    longitude: number;
  };

  type Category = {
    alias: string;
    title: string;
  };

  type Transaction = "pickup" | "delivery" | "restaurant_reservation";

  /** Yelp | Reviews */
  interface Reviews {
    reviews: Review[];
    total: number;
    possibleLanguages: string[];
  }

  interface Review {
    id: string; // "HOCjNz3gO4Agd6apuV8inw"
    url: string; // "https://www.yelp.com/biz/lovemama-new-york?adjust_creative=X7NnDxXzpIRHF9017rQtAA&hrid=HOCjNz3gO4Agd6ap
    text: string; // "Food is served plastic plates, obviously doesn't affect the food's flavor, but always good to know.\nAuthentic place, good dishes."
    rating: number; // 5
    time_created: string; // "2023-07-23 17:59:16"
    user: {
      id: string; // "L1XlKJf0gMgyrkIsa8a7Cw"
      profile_url: string; // "https://www.yelp.com/user_details?userid=L1XlKJf0gMgyrkIsa8a7Cw"
      image_url: string;
      name: string; // "Yotam B."
    };
  }
}

/** Instagram API */
export declare namespace Instagram {
  /** Short lived access token to long-lived access token response */
  interface LongLivedAccessTokenResponse {
    access_token: string;
    token_type: "bearer";
    expires_in: number;
  }

  /**
   * The supported attributes returned by the graph API media search query,
   * A limited paginatable list of user posts (videos, photos, carousels etc)
   */
  interface InstagramMediaResponse {
    id: string;
    /** Optional, some posts don't have a caption */
    caption?: string;
    /** Optional, only available for 'VIDEO' media */
    thumbnail_url?: string;
    media_type: PostMediaType;
    media_url: string;
    username: string;
    /** ISO-8601 format */
    timestamp: string;
    /** Optional, can be null if the content is copyrighted */
    permalink?: string;

    /** Separate fields appended for simplicity */
    mediaChildren?: InstagramMediaChildResponse[];
  }

  interface InstagramMediaChildResponse {
    id: string;
    /** Optional, only available for 'VIDEO' media */
    thumbnail_url?: string;
    media_type: PostMediaType;
    media_url: string;
    /** Optional, can be null if the content is copyrighted */
    permalink?: string;
  }

  /**
   * The expected response when querying the post's children media
   */
  interface InstagramMediaChildrenResponse {
    data: InstagramMediaChildResponse[];
    paging: {
      cursors: {
        after: string;
        before: string;
      };
      previous: string;
      next: string;
    };
  }

  /** The supported attributes returned by the access token endpoint */
  interface InstagramAccessTokenResponse {
    access_token: string;
    /** App-scoped user ID, not global, for all instagram user IDs referenced by this service */
    user_id: string;
  }

  /** The supported attributes returned by the graph API user search query */
  interface InstagramUserResponse {
    id: string;
    username: string;
  }
}
