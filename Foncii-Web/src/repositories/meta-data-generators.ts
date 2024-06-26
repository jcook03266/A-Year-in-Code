// Dependencies
// Types
import { Metadata } from "next";

// Services
import { FonciiAPIServerAdapter } from "../services/foncii-api/adapters/fonciiAPIServerAdapter";

// Implementation
const serverAPIAdapter = new FonciiAPIServerAdapter({});

// Centralized repository of meta data tag generators used across the website
// Read more here on how to generate dynamic metadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
/**
 * Root Layout | Default Metadata Tags
 */
export const rootLayoutMetaTagGenerator = async (): Promise<Metadata> => {
  return {
    title: {
      template: "%s | Foncii",
      default: "Foncii", // a default is required when creating a template
    },
    keywords:
      "Foncii, Foncii Maps, Maps, Restaurants, Food, Cuisines, Instagram, TikTok, Google",
    openGraph: {
      type: "website",
      images: [
        "https://cdn.foncii.com/static-assets/hero-images/foncii-maps_media_static-media_foncii-maps-hero.jpg",
      ],
    },
    description:
      "The modern way for content creators to showcase the places they’ve visited.",
    manifest: "./manifest.json",
    icons: {
      apple: "/apple-icon.png",
    },
    metadataBase: new URL("https://www.foncii.com/"),
  };
};

/**
 * Explore Page / Home Page
 */
export const explorePageMetaTagGenerator = async (): Promise<Metadata> => {
  return {
    title: "Explore",
    description:
      "The modern way for content creators to showcase the places they’ve visited. Discover countless foodies like yourself & find your next experience now.",
    alternates: {
      canonical: "/",
    },
  };
};

/**
 * Post Detail View Page(s)
 *
 * Provides highly personalized dynamic data for the post detail view page, both modal / context and full
 * screen cover presentations
 */
export const postDetailViewMetaTagGenerator = async ({
  params,
}: {
  params: { postID: string };
}): Promise<Metadata> => {
  // Parsing
  const postID = params.postID;

  // Meta tags
  let title = "",
    description = "",
    ogImage = "",
    ogVideo = "",
    keywords: string[] = [];

  // Post detail view
  const postData = await serverAPIAdapter.performFindPostByID({
    postID,
    includeAssociatedArticles: false,
    includeAssociatedRestaurantAwards: false,
    includeInfluencerInsights: false,
    includeReservations: false,
  }),
    hasAssociatedRestaurantData = postData?.restaurant != undefined;

  // Fallback to the default meta tags for hidden, unfinished and or undefined posts
  if (!postData || !hasAssociatedRestaurantData) {
    return {};
  }

  // Parsing
  const fonciiRestaurant = postData.fonciiRestaurant,
    restaurant = postData?.restaurant,
    restaurantName = restaurant?.name,
    restaurantHero = restaurant?.heroImageURL,
    categories = restaurant?.categories ?? [],
    priceLevel = restaurant?.priceLevel ?? 0,
    postCreator = postData?.creator,
    creatorUsername = postCreator?.username,
    customProperties = postData?.customUserProperties,
    creatorNotes = customProperties?.notes,
    customTags = customProperties?.categories ?? [],
    postMediaIsAVideo = postData?.mediaIsVideo,
    postMediaURL =
      postData?.media?.mediaURL ??
      postData?.dataSource?.media?.mediaURL ??
      undefined,
    postVideoMediaThumbnailURL =
      postData?.media?.videoMediaThumbnailURL ??
      postData?.media?.videoMediaThumbnailURL ??
      undefined,
    postImageMediaURL = postMediaIsAVideo
      ? postVideoMediaThumbnailURL
      : postMediaURL;

  // Contact info and restaurant metadata parsing
  const categoryString = categories.filter(Boolean).join(" • "),
    priceLevelDollarSigns = "$".repeat(priceLevel),
    website = restaurant?.website ?? "",
    phoneNumber = restaurant?.phoneNumber ?? "",
    address = restaurant?.addressProperties.formattedAddress;

  // Ratings
  const yelpRating = restaurant?.yelpProperties?.rating ?? 0,
    googleRating = restaurant?.googleProperties?.rating ?? 0,
    creatorRating = customProperties?.rating ?? 0;

  // Text description sections
  const yelpRatingDescription =
    yelpRating > 0 ? `Yelp: ${yelpRating.toFixed(1)}` : "",
    googleRatingDescription =
      googleRating > 0 ? `Google: ${googleRating.toFixed(1)}` : "",
    creatorRatingDescription =
      creatorRating > 0
        ? `${creatorUsername}: ${creatorRating.toFixed(1)}`
        : "",
    ratingDescriptions = [
      creatorRatingDescription,
      yelpRatingDescription,
      googleRatingDescription,
    ]
      .filter(Boolean)
      .join(" - ");

  // Filter out any undefined or empty entries
  const restaurantContactInformation = [address, website, phoneNumber]
    .filter(Boolean)
    .join(" - "),
    restaurantMetadata = `${priceLevelDollarSigns + (priceLevel > 0 ? " |" : "")
      } ${categoryString}`;

  description += `Foncii experience by ${creatorUsername} about ${restaurantName}:`;
  description += "\n";
  description += `\n⭐️ ${ratingDescriptions}`;
  description += "\n";
  description += `\n📍 ${restaurantContactInformation}`;
  description += "\n";
  description += `${creatorNotes} • ${customTags}`;

  if (fonciiRestaurant?.isReservable) {
    description += "\n📅 Reservations Available";
  }

  if (restaurantMetadata != "") {
    description += `\n🥘 ${restaurantMetadata}`;
  }

  // Metadata association
  ogImage = postImageMediaURL ?? restaurantHero ?? ""; // Fallback to the associated restaurant hero image (if available)
  ogVideo = postMediaIsAVideo ? postMediaURL ?? "" : "";
  title = `${restaurantName} • ${creatorUsername}`;
  keywords = [...customTags, ...categories];

  return {
    title: title,
    description: description,
    keywords: keywords,
    openGraph: {
      videos: [ogVideo],
      images: [ogImage],
    },
    alternates: {
      canonical: "/p/" + postID,
    },
  };
};

/**
 * Restaurant Detail View Page(s)
 *
 * Provides highly personalized dynamic data for the restaurant detail view page, both modal / context and full
 * screen cover presentations
 */
export const restaurantDetailViewMetaTagGenerator = async ({
  params,
}: {
  params: { restaurantID: string };
}): Promise<Metadata> => {
  // Parsing
  const fonciiRestaurantID = params.restaurantID;

  // Meta tags
  let title = "",
    description = "",
    ogImage = "",
    keywords: string[] = [];

  // Post detail view
  const fonciiRestaurantData =
    await serverAPIAdapter.performGetFonciiRestaurantByID({
      fonciiRestaurantID,
      includeAssociatedArticles: false,
      includeAssociatedRestaurantAwards: false,
      includeInfluencerInsights: false,
      includeReservations: false,
    });

  // Fallback to the default meta tags for hidden, unfinished and or undefined restaurants
  if (!fonciiRestaurantData) {
    return {};
  }

  // Parsing
  const restaurant = fonciiRestaurantData?.restaurant,
    restaurantName = restaurant?.name,
    categories = restaurant?.categories ?? [],
    priceLevel = restaurant?.priceLevel ?? 0,
    heroImageMediaURL =
      restaurant.heroImageURL ?? restaurant.imageCollectionURLs?.[0];

  // Contact info and restaurant metadata parsing
  const categoryString = categories.filter(Boolean).join(" • "),
    priceLevelDollarSigns = "$".repeat(priceLevel),
    website = restaurant?.website ?? "",
    phoneNumber = restaurant?.phoneNumber ?? "",
    address = restaurant?.addressProperties.formattedAddress;

  // Ratings
  const yelpRating = restaurant?.yelpProperties?.rating ?? 0,
    googleRating = restaurant?.googleProperties?.rating ?? 0,
    fonciiRating = fonciiRestaurantData.averageFonciiRating ?? 0;

  // Text description sections
  const yelpRatingDescription =
    yelpRating > 0 ? `Yelp: ${yelpRating.toFixed(1)}` : "",
    googleRatingDescription =
      googleRating > 0 ? `Google: ${googleRating.toFixed(1)}` : "",
    fonciiRatingDescription =
      fonciiRating > 0 ? `Foncii: ${fonciiRating.toFixed(1)}` : "",
    ratingDescriptions = [
      fonciiRatingDescription,
      yelpRatingDescription,
      googleRatingDescription,
    ]
      .filter(Boolean)
      .join(" - ");

  // Filter out any undefined or empty entries
  const restaurantContactInformation = [address, website, phoneNumber]
    .filter(Boolean)
    .join(" - "),
    restaurantMetadata = `${priceLevelDollarSigns + (priceLevel > 0 ? " |" : "")
      } ${categoryString}`;

  description += `${restaurantName} • Foncii:`;
  description += "\n";
  description += `\n⭐️ ${ratingDescriptions}`;
  description += "\n";
  description += `\n📍 ${restaurantContactInformation}`;

  if (fonciiRestaurantData.isReservable) {
    description += "\n📅 Reservations Available";
  }

  if (restaurantMetadata != "") {
    description += `\n🥘 ${restaurantMetadata}`;
  }

  // Metadata association
  ogImage = heroImageMediaURL ?? "";
  title = `${restaurantName}`;
  keywords = categories;

  return {
    title: title,
    description: description,
    keywords: keywords,
    openGraph: {
      images: [ogImage],
    },
    alternates: {
      canonical: "/r/" + fonciiRestaurantID,
    },
  };
};

// Gallery Page
export const galleryPageMetaTagGenerator = async ({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> => {
  // Meta tags
  let title = "",
    description = "",
    ogImage = "",
    keywords: string[] = [];

  // Fallback
  let dynamicResourceNotFound = false;

  // Populate using prestructured metadata from dedicated endpoint
  const galleryAuthorUsername = params.username,
    galleryMetadata = await serverAPIAdapter.performGetUserGalleryHTMLMetadata(
      galleryAuthorUsername
    );

  if (!galleryMetadata) {
    dynamicResourceNotFound = true;
  } else {
    ogImage = galleryMetadata.previewImageURL ?? "";
    title = galleryMetadata.title;
    description = galleryMetadata.description;
    keywords = galleryMetadata.keywords;
  }

  // Fallback to the generic metadata at the root layout
  if (dynamicResourceNotFound) {
    return {};
  }

  return {
    title: title,
    description: description,
    keywords: keywords,
    openGraph: {
      images: [ogImage],
    },
    alternates: {
      canonical: "/" + galleryAuthorUsername,
    },
  };
};
