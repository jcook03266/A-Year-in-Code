// Dependencies
// Framework
import { MetadataRoute } from "next";

// Services
import { FonciiAPIServerAdapter } from "../services/foncii-api/adapters/fonciiAPIServerAdapter";

// Docs: https://nextjs.org/learn-pages-router/seo/crawling-and-indexing/xml-sitemaps
function generateSiteMap({
  postIDs,
  restaurantIDs,
  userNames
}: {
  postIDs: string[],
  restaurantIDs: string[],
  userNames: string[]
}): MetadataRoute.Sitemap {
  // Non-dynamic pages
  const sitemap = [
    {
      // Root / Home / Explore
      url: "https://www.foncii.com",
      lastModified: new Date()
    },
    // Home page but under a different name, this is a permanent redirect right now
    // TODO: - Create a reserved words list for usernames when signing up, or throw the user gallery behind u/ for users
    // Ex.) If a person creates a user named login, they'll never be able to go to their gallery.
    {
      url: "https://www.foncii.com/explore",
      lastModified: new Date()
    },
    // Sign Up Redirect
    {
      url: "https://www.foncii.com/signup",
      lastModified: new Date()
    },
    // Log In  Redirect
    {
      url: "https://www.foncii.com/login",
      lastModified: new Date()
    },
  ];

  // Dynamic Pages
  // User Post Detail Pages
  postIDs.forEach(id => {
    sitemap.push({
      url: `https://www.foncii.com/p/${id}`,
      lastModified: new Date()
    });
  });

  // Restaurant Detail Pages
  restaurantIDs.forEach(id => {
    sitemap.push({
      url: `https://www.foncii.com/r/${id}`,
      lastModified: new Date()
    });
  });

  // User Map Pages
  userNames.forEach(userName => {
    sitemap.push({
      url: `https://www.foncii.com/${userName}`,
      lastModified: new Date()
    });
  });

  return sitemap;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Server-side only api server
  const apiService = new FonciiAPIServerAdapter({});

  // Constants
  // Note: 50MB or 50,000 URLs is the Google limit for sitemaps,
  // Ref: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#:~:text=Sitemap%20size%20limits%3A%20All%20formats,single%20index%20file%20to%20Google.
  // Multiple Site Maps can be created to overcome this limitation like so:
  // https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
  // 50,000 Maximum possible URLs. 
  // TODO: - Implement multiple site map generation, not needed for now, but necessary when we get there.
  const PUBLIC_POST_LIMIT = 20000,
    RESTAURANT_LIMIT = 20000,
    USER_LIMIT = 10000;

  // Gather required data to generate the site map dynamically
  const [publicPosts, restaurants, users] = await Promise.all([
    apiService.performGetAllPublicPosts({ limit: PUBLIC_POST_LIMIT }),
    apiService.performGetAllRestaurants({ limit: RESTAURANT_LIMIT }),
    apiService.performGetAllUsers({ limit: USER_LIMIT })
  ]);

  // Parsing
  const postIDs = publicPosts.map(post => post.id),
    restaurantIDs = restaurants.map(restaurant => restaurant.id),
    userNames = users.map(user => user.username);

  // We generate the XML sitemap with the various fetched data-points
  const sitemap = generateSiteMap({
    postIDs,
    restaurantIDs,
    userNames
  });

  return sitemap;
}