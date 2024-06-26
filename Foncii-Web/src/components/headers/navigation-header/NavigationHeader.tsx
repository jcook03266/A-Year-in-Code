/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { SearchBarPlaceholders } from "../../../types/foncii-maps";
import { FmIntegrationProviders } from "../../../__generated__/graphql";

// App Properties
import { integrationOAuthRedirectURI } from "../../../core-foncii-maps/properties/AppProperties";

// Components
import FonciiFullLogoIcon from "../../icons/foncii-icons/foncii-maps/full-logo-icon/FonciiFullLogoIcon";
import FonciiShorthandLogoIcon from "../../icons/foncii-icons/foncii-maps/shorthand-logo-icon/FonciiShorthandLogoIcon";
import PersistentSearchBar from "../../../components/inputs/searchbars/persistent-search-bar/PersistentSearchBar";
import GalleryContextSwitcher from "../../../components/context-switchers/gallery-context-switcher/GalleryContextSwitcher";
import PostFilterMenu from "../../../components/menus/post-filter-menu/menu/PostFilterMenu";
import UserSideMenuToggleButton from "../../../components/menus/user-menu/components/side-menu-toggle/UserSideMenuToggleButton";

// Hooks
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRouteObserver } from "../../../hooks/UseRouteObserver";

// Helpers
import {
  getAppRouteIDForPathname,
  getNameOfAppRouteForPathname,
} from "../../../core-foncii-maps/navigation/PathAssociatedValues";

// Navigation
import {
  IdentifiableAppRoutes,
  NavigationProperties,
} from "../../../core-foncii-maps/properties/NavigationProperties";

// Redux
import {
  getFonciiRestaurantsSlice,
  getFonciiUserSlice,
  getUserPostsSlice,
  getVisitedUserSlice,
} from "../../../redux/operations/selectors";
import {
  FonciiUserActions,
  UserPostsActions,
} from "../../../redux/operations/dispatchers";

// Formatting
import { uppercaseFirstLetter } from "../../../utilities/formatting/textContentFormatting";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";

function NavigationHeader() {
  // Observers
  const routeObserver = useRouteObserver();

  // Dynamic Route Properties
  const pathname = usePathname(),
    router = useRouter();

  // State Management
  // Redux store
  const fonciiUser = getFonciiUserSlice()(),
    visitedUser = getVisitedUserSlice()(),
    fonciiRestaurants = getFonciiRestaurantsSlice()(),
    userPosts = getUserPostsSlice()();

  // URL state parameter parsing
  const searchParams = useSearchParams(),
    // Instagram OAuth auth token passed via callback
    instagramAuthCode: string | null = searchParams.get("code") as string;

  // General navigation transitions and corrections corresponding to the main user's state
  useEffect(() => {
    rerouteIsolatedUser();
    handleAuthNavigationTransitions();
  }, [fonciiUser, visitedUser, pathname]);

  // Integration credential OAuth side-effects
  useEffect(() => {
    if (
      getAppRouteIDForPathname(pathname) == IdentifiableAppRoutes.explorePage &&
      instagramAuthCode != null
    ) {
      handleIntegrationConnectionRequest();
    }
  }, [instagramAuthCode, pathname]);

  // Business Logic
  // Authorization Callback / Integration Connection Handlers
  const handleIntegrationConnectionRequest = async (): Promise<void> => {
    const cleanUpInstagramAuthToken = (code: string): string => {
      return code.replace("#_", "");
    };

    // Don't disturb in-flight connection requests
    if (fonciiUser.integrationConnectionInProgress) return;

    // Instagram Integration Connection Request
    if (instagramAuthCode != undefined && instagramAuthCode != "") {
      const authToken = cleanUpInstagramAuthToken(instagramAuthCode),
        // Important: This URI must be the same as the one used to generate the auth code ~ location.origin (www.foncii.com or other support domains)
        redirectURI = integrationOAuthRedirectURI(location.origin);

      const connectedIntegrationCredential =
        await FonciiUserActions.connectIntegration({
          authToken,
          redirectURI,
          integrationProvider: FmIntegrationProviders.Instagram,
        }),
        didSucceed = connectedIntegrationCredential != null;

      if (didSucceed) {
        // Connection successful, user is located to the homepage automatically via the auth link redirect
        UserPostsActions.importUserPosts({
          integrationCredential: connectedIntegrationCredential,
        });
      } else {
        // Connection failed, remove the auth token from the user's URL state for security purposes
        router.replace(NavigationProperties.explorePageLink());
      }
    }
  };

  // Auth Logic
  // Transitions
  const handleAuthNavigationTransitions = (): void => {
    const signOutInProgress = fonciiUser.signingOut;

    if (signOutInProgress) {
      // Redirect the user to the explore page
      router.push(NavigationProperties.explorePageLink());
    }
  };

  // Redirects any isolated authenticated users from unexpected pathways
  // i.e login / sign up pages as these pages are not intended for users who are already logged in.
  // Note: This is used when the user is logging in / signing up.
  const rerouteIsolatedUser = (): void => {
    // Don't disrupt the sign / sign in transitions
    if (fonciiUser.signingOut || fonciiUser.signingIn) return;

    // First time user, should be redirected to the onboarding screen to complete onboarding from anywhere (login, sign up, explore etc.)
    if (fonciiUser.isFTUE && fonciiUser.user) {
      router.replace(
        NavigationProperties.onboardingPageLink(fonciiUser.user?.id)
      );
    }
  };

  // Convenience
  const isLoading = (): boolean => {
    if (routeObserver.explorePageActive()) return fonciiRestaurants.isLoading;
    else if (routeObserver.isGalleryBeingViewedByAuthor())
      return userPosts.isLoading;
    else if (routeObserver.isGalleryBeingViewedByVisitor())
      return visitedUser.isLoading;
    else return false;
  };

  // Looks up the appropriate title for the current pathname
  const getTitleForCurrentPath = (): string => {
    return getNameOfAppRouteForPathname(pathname);
  };

  const getAppRouteForCurrentPath = (): IdentifiableAppRoutes => {
    return getAppRouteIDForPathname(pathname);
  };

  // Search bar is displayed only on the explore and gallery pages
  const shouldDisplaySearchUI = (): boolean => {
    return (
      getAppRouteForCurrentPath() == IdentifiableAppRoutes.galleryPage ||
      getAppRouteForCurrentPath() == IdentifiableAppRoutes.explorePage
    );
  };

  const shouldHideForCurrentRoute = (): boolean => {
    return getAppRouteForCurrentPath() == IdentifiableAppRoutes.onboardingPage;
  };

  // Subcomponent
  // Hides on larger screens, only visible on mobile dimensions
  const FonciiMapsAttribution = (): React.ReactNode => {
    // The attribution in this component is redundant on auth related pages with their own attributions
    if (
      routeObserver.explorePageActive() ||
      routeObserver.galleryPageActive()
    ) {
      return (
        <div className="w-full left-0">
          <div
            className={`hidden sm:flex transition-all ease-in-out opacity-100 xl:opacity-0 w-[20dvw] xs:w-[100px] sm:w-[120px]`}
          >
            <FonciiFullLogoIcon withLink />
          </div>

          <FonciiShorthandLogoIcon
            className="flex sm:hidden transition-all ease-in-out opacity-100 xl:opacity-0 w-[20dvw] xs:w-[100px] sm:w-[120px] h-[32px] items-center justify-start"
            withLink
          />
        </div>
      );
    } else {
      // Empty div to center the title section in the middle
      return <div className="w-full left-0" />;
    }
  };

  // Custom title describing the current section of the website
  const TitleSection = (): React.ReactNode => {
    // Use context switcher in place of title for gallery based contexts
    if (
      routeObserver.explorePageActive() ||
      routeObserver.galleryPageActive()
    ) {
      return (
        <span className="flex h-fit shrink-0 w-[60%]">
          <GalleryContextSwitcher />
        </span>
      );
    }

    // Shifted by 150px when side nav is visible
    const formattedTitle = uppercaseFirstLetter(getTitleForCurrentPath());

    return (
      <h1 className="transition-all text-center overflow-hidden text-ellipsis text-[16px] md:text-[18px] font-bold min-w-[40vw]">
        {formattedTitle}
      </h1>
    );
  };

  // User menu widget / gallery attribution header
  const RightSection = (): React.ReactNode => {
    if (
      routeObserver.explorePageActive() ||
      routeObserver.galleryPageActive()
    ) {
      return (
        <div className="flex items-center h-full w-full justify-end">
          {
            <div className="flex flex-row gap-x-[12px] items-center justify-end h-fit">
              <UserSideMenuToggleButton />
            </div>
          }
        </div>
      );
    } else {
      // Empty div to center the title section in the middle
      return <div className="w-full left-0" />;
    }
  };

  // Hidden for desktop, visible for mobile and medium size screens. On mobile / medium sized screens this is displayed at the top of the screen inside of this header.
  const SearchBarSection = (): React.ReactNode => {
    if (!shouldDisplaySearchUI()) return;

    return (
      <div
        className={cn(
          "flex w-[95%] max-w-[556px] items-center justify-center transition-all ease-in-out duration-700",
          routeObserver.postDetailViewActive() ||
            routeObserver.restaurantDetailViewActive()
            ? "h-[0px] translate-x-[1000px]"
            : "h-[64px]"
        )}
      >
        <PersistentSearchBar
          placeholder={SearchBarPlaceholders.gallery}
          searchBarClassNames="h-[40px]"
          isLoading={isLoading()}
        />
      </div>
    );
  };

  const FilterSection = (): React.ReactNode => {
    if (!shouldDisplaySearchUI()) return;

    return (
      <div
        className={cn(
          "flex flex-row w-full items-center justify-center no-scrollbar overflow-x-scroll overflow-y-clip transition-all ease-in-out duration-700 pointer-events-auto",
          routeObserver.postDetailViewActive() ||
            routeObserver.restaurantDetailViewActive()
            ? "h-[0px] translate-x-[1000px]"
            : "h-[40px]"
        )}
      >
        <PostFilterMenu parent={"navHeader"} isMobile={true} />
      </div>
    );
  };

  // Conditional rendering
  if (shouldHideForCurrentRoute()) return;

  return (
    <div
      className={`xl:pointer-events-none xl:overflow-hidden xl:hidden xl:h-[0px] xl:p-[0px] bg-black transition-all ease-in-out z-[1000] sticky top-0 pt-[12px] border-b-[0.5px] border-medium_dark_grey`}
    >
      <div className={`h-fit w-screen flex flex-col items-center`}>
        <div
          className={`h-full w-[100dvw] px-[10px] flex flex-row items-center`}
        >
          {FonciiMapsAttribution()}
          {TitleSection()}
          {RightSection()}
        </div>
        {SearchBarSection()}
        {FilterSection()}
      </div>
    </div>
  );
}

export default NavigationHeader;
