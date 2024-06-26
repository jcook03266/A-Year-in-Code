// Dependencies
// Routing
import { IdentifiableAppRoutes } from "../properties/NavigationProperties";

// Helper functions and definitions for associating direct string values with enum types and
// known path names. This allows the navigation UI to update dynamically given some arbitrary
// route
enum SupportedPathnames {
  onboardingPage = "/onboarding/[userID]", // ['','onboarding','[userID]']
  explorePage = "/", // Home is just an alias for the explore page so it's not supported here to prevent collisions, only 1 directory match ['']
  galleryPage = "/[username]", // ['','[username]'], the gallery page has a custom [username] slug, so 2 directories to match
  notFoundPage = "/404",
}

// Important: When adding new app routes keep all applicable methods updated immediately upon changes.
// keep all of the pathnames in parity with the ones in navigation properties as well.
export function getAppRouteIDForPathname(
  pathname: string
): IdentifiableAppRoutes {
  // Assuming this is not a malformed URL, remove any parameters and get the basic redirectories as an array
  const pathnameComponents = pathname.split("?")[0].split("/"),
    pathnameComponentsLength = pathnameComponents.length,
    lastDirectory = pathnameComponents[pathnameComponents.length - 1];

  switch (lastDirectory) {
    case SupportedPathnames.explorePage.split("/")[0]:
      return IdentifiableAppRoutes.explorePage;
    case SupportedPathnames.notFoundPage.split("/")[1]:
      return IdentifiableAppRoutes.notFoundPage;
    default:
      // Matching routes with slugs (custom directories)
      // Onboarding (/onboarding/[userID])
      if (
        pathnameComponentsLength == 3 &&
        pathnameComponents.includes(
          SupportedPathnames.onboardingPage.split("/")[1]
        ) // Match 'onboarding'
      ) {
        return IdentifiableAppRoutes.onboardingPage;
      }
      // Gallery (/[username])
      else if (
        pathnameComponentsLength == 2 &&
        pathnameComponents.includes(
          SupportedPathnames.galleryPage.split("/")[0]
        ) // Match empty string ''
      ) {
        return IdentifiableAppRoutes.galleryPage;
      } else return IdentifiableAppRoutes.notFoundPage; // Some malformed URL, can't be determined at all
  }
}

export function getNameOfAppRouteForPathname(pathname: string) {
  const pathnameComponents = pathname.split("?")[0].split("/"),
    pathnameComponentsLength = pathnameComponents.length,
    lastDirectory = pathnameComponents[pathnameComponents.length - 1];

  switch (lastDirectory) {
    // Kept for reference
    // `/` at index 0 since explore is located at `/`, if this was /landing you'd use [1] to get the landing slug
    case SupportedPathnames.explorePage.split("/")[0]:
      return "Explore";
    default:
      // Matching routes with slugs (custom directories)
      // Onboarding (/onboarding/[userID])
      if (
        pathnameComponentsLength == 3 &&
        pathnameComponents.includes(
          SupportedPathnames.onboardingPage.split("/")[1]
        ) // Match 'onboarding'
      ) {
        return "Onboarding";
      }
      // Gallery (/[username])
      else if (
        pathnameComponentsLength == 2 &&
        pathnameComponents.includes(
          SupportedPathnames.galleryPage.split("/")[0]
        ) // Match empty string ''
      ) {
        return lastDirectory; // This is the custom username component / directory
      } else return pathname; // Some malformed URL, can't be determined at all, 404 page should display
  }
}
