// Dependencies
// Framework
import { MetadataRoute } from "next";

// App Properties
import { productionEnvironment } from "../core-foncii-maps/properties/AppProperties";

export default function robots(): MetadataRoute.Robots {
  if (productionEnvironment) {
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
        },
        {
          userAgent: "*",
          disallow: "/onboarding",
        },
        {
          userAgent: "*",
          disallow: "/pcp",
        },
      ],
    };
  } else {
    // Prevent crawlers from indexing the staging environment and only index the live production
    // pages.
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }
}
