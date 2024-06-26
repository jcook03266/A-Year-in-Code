/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Components
// Local
import FonciiToolTip from "../../tool-tips/FonciiToolTip";
import { AuthForms } from "../../../components/modals/auth-modal/AuthModal";

// External
import Link from "next/link";

// Hooks
import { useEffect, useState } from "react";
import { useRouteObserver } from "../../../hooks/UseRouteObserver";
import { useRouterSearchParams } from "../../../hooks/UseRouterSearchParamsHook";
import { usePathname } from "next/navigation";

// Utilities
import {
  NavigationProperties,
  SharedURLParameters,
} from "../../../core-foncii-maps/properties/NavigationProperties";
import { cn } from "../../../utilities/development/DevUtils";

// Managers
import UserManager from "../../../managers/userManager";

// Types
enum GalleryContexts {
  Explore,
  MyMap,
}

interface GalleryContextTab {
  id: GalleryContexts;
  label: string;
  link: string;
  onClick?: () => void;
}

/// Clickable name label for displaying creator usernames
function GalleryContextSwitcher() {
  // Routing
  const routeObserver = useRouteObserver();

  // Navigation
  const pathname = usePathname();
  const routerSearchParams = useRouterSearchParams();

  // State Management
  const activeTab = (): GalleryContexts | undefined => {
    // Display the explore tab for the explore page as per the design spec
    if (routeObserver.explorePageActive()) return GalleryContexts.Explore;
    else if (routeObserver.isCurrentUserGalleryAuthor())
      return GalleryContexts.MyMap;
  };

  const [currentTab, setCurrentTab] = useState<GalleryContexts | undefined>(
    activeTab()
  );

  // Updates the current tab based on the route / URL the site is currently at
  useEffect(() => {
    setCurrentTab(activeTab());
  }, [pathname]);

  // Dynamic Sizing
  const tabWidthClassName = (): string => {
    return "w-[50%]";
  };

  // Actions
  const displayAuthModal = (defaultForm: AuthForms = AuthForms.LogIn) => {
    routerSearchParams.setParams({
      [SharedURLParameters.displayAuthModal]: true,
      [SharedURLParameters.currentAuthForm]: defaultForm,
    });
  };

  // Convenience
  const tabsToDisplay = (): GalleryContextTab[] => {
    const tabs: GalleryContextTab[] = [
      {
        id: GalleryContexts.Explore,
        label: "Explore",
        link: NavigationProperties.explorePageLink(),
      },
    ];

    // The 'My Map' tab navigates authenticated users to their gallery, and non-auth users to the login page
    tabs.push({
      id: GalleryContexts.MyMap,
      label: "My Map",
      link: UserManager.shared.userAuthenticated()
        ? NavigationProperties.userGalleryPageLink()
        : NavigationProperties.logInPageLink(),
      onClick: UserManager.shared.userAuthenticated()
        ? undefined
        : () => displayAuthModal(AuthForms.LogIn), // If the user is not authenticated, then display the login modal. Otherwise, navigate to the user's gallery.
      // Note: The /login redirect link results in a weird bug when clicked from this component, the modal is blank, don't use it, use the onclick action
    });

    return tabs;
  };

  const isTabCurrentlySelected = (tab: GalleryContextTab): boolean => {
    return currentTab === tab.id;
  };

  const getDisplacementIndexOfBottomBar = (): number => {
    switch (currentTab) {
      case GalleryContexts.Explore:
        return 0;
      case GalleryContexts.MyMap:
        return 1;
      default:
        return 0; // Default index is 0 if the current tab can't be determined.
    }
  };

  const shouldBottomBarBeDisplayed = (): boolean => {
    return currentTab !== undefined; // If the current tab is undefined, then the bottom bar should not be displayed. This means a gallery context isn't being viewed.
  };

  // Subcomponents
  const ContextSwitcherTab = (tab: GalleryContextTab): React.ReactElement => {
    // Properties
    const shouldRenderAsButton = tab.onClick != undefined;

    const TabContent = () => {
      return (
        <FonciiToolTip title={`Go to ${tab.label.toLowerCase()}`}>
          <div id={tab.id.toString()}>
            {isTabCurrentlySelected(tab) ? (
              // This is the contextual page's title hence the h1 tag when the tab is selected
              <h1
                className={`text-[16px] md:text-[20px] font-semibold ${
                  isTabCurrentlySelected(tab) ? "text-primary" : "text-neutral"
                }`}
              >
                {tab.label.toUpperCase()}
              </h1>
            ) : (
              <p
                className={`text-[16px] md:text-[20px] font-semibold ${
                  isTabCurrentlySelected(tab) ? "text-primary" : "text-neutral"
                }`}
              >
                {tab.label.toUpperCase()}
              </p>
            )}
          </div>
        </FonciiToolTip>
      );
    };

    // Note: When tab is active the onclick action is silenced
    return (
      <div
        id={tab.id.toString()}
        key={tab.id.toString()}
        onClick={!isTabCurrentlySelected(tab) ? tab.onClick : undefined}
        className={cn(
          "flex text-center justify-center items-center h-[48px] shrink-0 overflow-hidden hover:opacity-75 ease-in transition-all active:scale-90",
          tabWidthClassName(),
          isTabCurrentlySelected(tab) ? "pointer-events-none" : ""
        )}
      >
        {shouldRenderAsButton ? (
          <button
            onClick={!isTabCurrentlySelected(tab) ? tab.onClick : undefined}
          >
            <TabContent />
          </button>
        ) : (
          <Link href={tab.link}>
            <TabContent />
          </Link>
        )}
      </div>
    );
  };

  const ContextSwitcherBottomBar = (): React.ReactElement | undefined => {
    if (!shouldBottomBarBeDisplayed()) return undefined;

    return (
      <div
        className={`h-[2px] ${tabWidthClassName()} bg-primary shrink-0 transition-all ease-in-out`}
        style={{
          transform: `translateX(${getDisplacementIndexOfBottomBar() * 100}%)`,
        }}
      />
    );
  };

  return (
    <div className="flex flex-col items-start justify-end w-full h-fit transition-all ease-in-out">
      <div className="flex flex-row w-full h-fit">
        {tabsToDisplay().map((tab) => {
          return ContextSwitcherTab(tab);
        })}
      </div>
      {ContextSwitcherBottomBar()}
    </div>
  );
}

export default GalleryContextSwitcher;
