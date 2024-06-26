// Dependencies
// Types
import {
  FmUserPost,
  FonciiRestaurant,
  PostMediaTypes,
  Restaurant,
} from "../__generated__/graphql";

// Utilities
import { convertNumericPriceLevelToDollarSigns } from "../extensions/Restaurant+Extensions";

// Formatting
import {
  formattedCreatorUsername,
  possessiveFormattedUsernameCopy,
} from "../utilities/formatting/textContentFormatting";
import { DateFormatter } from "../utilities/formatting/miscFormatters";

// Centralized repository of structured data generators used across the website for google rich snippets
// Read more here on how to generate this structured data: https://blog.hubspot.com/marketing/how-to-use-google-rich-snippets
// Google's Structured Data Markup Helper: https://www.google.com/webmasters/markup-helper

/**
 * Converts public posts with defined restaurant and creator data into an
 * array of stringified JSONs containing structured restaurant data to display as a
 * rich snippet in search engine results.
 *
 * @param posts -> Public posts with defined restaurant and creator data, pass in one post to get a singular
 * structured data JSON
 *
 * @returns -> An array of stringified JSONs containing structured restaurant data to display
 */
export const structuredPostRestaurantDataGenerator = (
  posts: FmUserPost[]
): String => {
  const postsWithRestaurants = posts.filter(
      (post) => post.restaurant != undefined
    ),
    stringifiedStructuredRestaurantJSONs = postsWithRestaurants.map((post) => {
      const restaurant = post.restaurant,
        restaurantImage =
          (post.media?.mediaType == PostMediaTypes.Image
            ? post.media?.mediaURL
            : post.media?.videoMediaThumbnailURL) ?? restaurant?.heroImageURL,
        address = restaurant?.addressProperties,
        creator = post.creator,
        rating =
          (post.customUserProperties.rating ?? 0) > 0
            ? post.customUserProperties.rating
            : null,
        reviewNotes =
          (post.customUserProperties.notes ?? "") != ""
            ? post.customUserProperties.notes
            : null,
        stringifiedPriceRange =
          convertNumericPriceLevelToDollarSigns(restaurant?.priceLevel) ?? null,
        cuisines = restaurant?.categories ?? null;

      const structuredRestaurantJSON = {
        "@context": "http://schema.org",
        "@type": "Restaurant",
        name: restaurant?.name,
        image: restaurantImage,
        telephone: restaurant?.phoneNumber,
        servesCuisine: cuisines,
        address: {
          "@type": "PostalAddress",
          streetAddress: address?.streetAddress,
          addressLocality: address?.city,
          addressCountry: address?.countryCode,
          addressRegion: address?.stateCode,
          postalCode: address?.zipCode,
        },
        menu: restaurant?.website,
        review: {
          "@type": "Review",
          author: {
            "@type": "Person",
            name: creator.username,
            ratingValue: rating,
          },
          datePublished: post.creationDate,
        },
        priceRange: stringifiedPriceRange,
        reviewBody: reviewNotes,
      };

      return JSON.stringify(structuredRestaurantJSON);
    });

  if (posts.length <= 1)
    return stringifiedStructuredRestaurantJSONs[0] ?? ""; // Singular Post
  else return `[${stringifiedStructuredRestaurantJSONs.toString()}]`; // Collection
};

/**
 * Generates a carousel of restaurant list items populated by the structured data
 * provided by each linked detail view page.
 *
 * @param posts -> Public posts with defined restaurant and creator data
 *
 * @returns -> Structured carousel data inclusive of 2 - 10 posts maximum
 *
 * Documentation: https://developers.google.com/search/docs/appearance/structured-data/carousel
 */
export const structuredPostRestaurantCarouselDataGenerator = (
  posts: FmUserPost[]
): String => {
  const postsWithRestaurants = posts
      .filter((post) => post.restaurant != undefined)
      .slice(0, 10),
    restaurantItemListElements = postsWithRestaurants.map((post, index) => {
      return {
        "@type": "ListItem",
        position: index,
        url: `https://www.foncii.com/p/${post.id}`,
      };
    });

  const structuredRestaurantCarouselJSON = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: restaurantItemListElements,
  };

  return JSON.stringify(structuredRestaurantCarouselJSON);
};

/**
 * Placed as a script within the HTML of the home page (only)
 * Enables site link search box feature
 *
 * @returns -> Stringified WebSite JSON data
 *
 * Documentation: https://developers.google.com/search/docs/appearance/site-names
 */
export const structuredWebSiteDataGenerator = (): String => {
  const webSiteStructuredDataJSON = {
    "@context": "http://schema.org",
    "@type": "WebSite",
    name: "Foncii",
    alternateName: "Foncii Maps",
    url: `https://www.foncii.com/`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://www.foncii.com/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return JSON.stringify(webSiteStructuredDataJSON);
};

/**
 * Specifies the logo to use for the Google knowledge panel
 *
 * @returns -> Stringified organization JSON data
 */
export const organizationStructuredDataGenerator = (): String => {
  const organizationStructuredDataJSON = {
    "@context": "http://schema.org",
    "@type": "Organization",
    name: "Foncii",
    url: `https://www.foncii.com`,
    logo: "https://cdn.foncii.com/static-assets/logos/foncii-logo-salmon.png",
  };

  return JSON.stringify(organizationStructuredDataJSON);
};

export const postVideoStructuredDataGenerator = (
  posts: FmUserPost[]
): String => {
  const postsWithRestaurants = posts.filter(
      (post) => post.restaurant != undefined
    ),
    postsWithValidVideoMedia = postsWithRestaurants.filter(
      (post) =>
        post.media?.mediaURL &&
        post.media?.videoMediaThumbnailURL &&
        post.mediaIsVideo
    ),
    structuredVideoDataJSONs = postsWithValidVideoMedia.map((post) => {
      const postCreationDate = post.creationDate,
        formattedCreationDate = DateFormatter.formatDateToMDY(
          new Date(postCreationDate)
        ),
        postLastUpdateDate = post.lastUpdated,
        formattedLastUpdateDate = DateFormatter.formatDateToMDY(
          new Date(postLastUpdateDate)
        );

      const creatorUsername = post.creator.username,
        restaurantName = post.restaurant?.name,
        videoMediaURL = post.media?.mediaURL,
        videoMediaThumbnailURL = post.media?.videoMediaThumbnailURL,
        videoTitle = `${formattedCreatorUsername(
          creatorUsername
        )} • ${restaurantName}`;

      let videoDescription =
        post.customUserProperties.notes != ""
          ? post.customUserProperties.notes != ""
          : `${possessiveFormattedUsernameCopy(
              creatorUsername
            )} video post on ${restaurantName}.`;
      videoDescription += `\n\nUploaded to Foncii on ${formattedCreationDate}, last updated ${formattedLastUpdateDate}.`;

      const JSONData = {
        "@context": "http://schema.org",
        "@type": "VideoObject",
        name: videoTitle,
        description: videoDescription,
        contentUrl: videoMediaURL,
        thumbnailUrl: videoMediaThumbnailURL,
        uploadDate: postCreationDate,
        creator: {
          "@type": "Person",
          name: creatorUsername,
        },
      };

      return JSON.stringify(JSONData);
    });

  if (posts.length <= 1)
    return structuredVideoDataJSONs[0] ?? ""; // Singular Post
  else return `[${structuredVideoDataJSONs.toString()}]`; // Collection
};

export const postImageStructuredDataGenerator = (
  posts: FmUserPost[]
): String => {
  const postsWithRestaurants = posts.filter(
      (post) => post.restaurant != undefined
    ),
    postsWithValidImageMedia = postsWithRestaurants.filter(
      (post) => post.media?.mediaURL && !post.mediaIsVideo
    ),
    structuredVideoDataJSONs = postsWithValidImageMedia.map((post) => {
      const postCreationDate = post.creationDate,
        formattedCreationDate = DateFormatter.formatDateToMDY(
          new Date(postCreationDate)
        ),
        postLastUpdateDate = post.lastUpdated,
        formattedLastUpdateDate = DateFormatter.formatDateToMDY(
          new Date(postLastUpdateDate)
        );

      const creatorUsername = post.creator.username,
        restaurantName = post.restaurant?.name,
        imageMediaURL = post.media?.mediaURL,
        imageTitle = `${formattedCreatorUsername(
          creatorUsername
        )} • ${restaurantName}`;

      let imageDescription =
        post.customUserProperties.notes != ""
          ? post.customUserProperties.notes != ""
          : `${possessiveFormattedUsernameCopy(
              creatorUsername
            )} image post on ${restaurantName}.`;
      imageDescription += `\n\nUploaded to Foncii on ${formattedCreationDate}, last updated ${formattedLastUpdateDate}.`;

      const JSONData = {
        "@context": "http://schema.org",
        "@type": "ImageObject",
        name: imageTitle,
        description: imageDescription,
        contentUrl: imageMediaURL,
        creditText: "Foncii",
        creator: {
          "@type": "Person",
          name: creatorUsername,
        },
      };

      return JSON.stringify(JSONData);
    });

  if (posts.length <= 1)
    return structuredVideoDataJSONs[0] ?? ""; // Singular Post
  else return `[${structuredVideoDataJSONs.toString()}]`; // Collection
};

// ~ User Post Variant
export const structuredFonciiRestaurantDataGenerator = (
  fonciiRestaurants: FonciiRestaurant[]
): String => {
  const stringifiedStructuredRestaurantJSONs = fonciiRestaurants.map(
    (fonciiRestaurant) => {
      const restaurant = fonciiRestaurant.restaurant,
        restaurantImage = restaurant.heroImageURL,
        address = restaurant?.addressProperties,
        stringifiedPriceRange =
          convertNumericPriceLevelToDollarSigns(restaurant?.priceLevel) ?? null,
        cuisines = restaurant?.categories ?? null;

      const structuredRestaurantJSON = {
        "@context": "http://schema.org",
        "@type": "Restaurant",
        name: restaurant?.name,
        image: restaurantImage,
        telephone: restaurant?.phoneNumber,
        servesCuisine: cuisines,
        address: {
          "@type": "PostalAddress",
          streetAddress: address?.streetAddress,
          addressLocality: address?.city,
          addressCountry: address?.countryCode,
          addressRegion: address?.stateCode,
          postalCode: address?.zipCode,
        },
        menu: restaurant?.website,
        priceRange: stringifiedPriceRange,
      };

      return JSON.stringify(structuredRestaurantJSON);
    }
  );

  if (fonciiRestaurants.length <= 1)
    return stringifiedStructuredRestaurantJSONs[0] ?? ""; // Singular restaurant
  else return `[${stringifiedStructuredRestaurantJSONs.toString()}]`; // Collection
};

// ~
export const structuredFonciiRestaurantCarouselDataGenerator = (
  fonciiRestaurants: FonciiRestaurant[]
): String => {
  const restaurantItemListElements = fonciiRestaurants.map(
    (fonciiRestaurant, index) => {
      const restaurantID = fonciiRestaurant.restaurant.id;

      return {
        "@type": "ListItem",
        position: index,
        url: `https://www.foncii.com/r/${restaurantID}`,
      };
    }
  );

  const structuredRestaurantCarouselJSON = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: restaurantItemListElements,
  };

  return JSON.stringify(structuredRestaurantCarouselJSON);
};
