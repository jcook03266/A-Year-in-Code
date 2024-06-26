// Dependencies
import { AppRoutes } from "./NavigationProperties";

export class NetworkingInformation {
  // Properties
  static prodDomain = "foncii.com";
  static devDomain = "localhost:3000";

  // Creates a path to each route, not a direct URL ex.) login page -> /login
  static GetPathToRoute(route: AppRoutes): string {
    const directorySeparator = "/",
      rootRoute = AppRoutes.homePage,
      separator = rootRoute != route ? directorySeparator : "";

    return directorySeparator + route + separator;
  }
}
